// OmniaKey client (OpenAI-compatible Chat Completions endpoint).
// Docs (docs.omniakey.com): base https://api.omniakey.com/v1, POST /chat/completions,
// auth "Authorization: Bearer <key>". Claude, GPT and MiMo model ids are all served on this route.
// Streaming and usage fields are not documented in detail, so parsing is defensive: standard OpenAI
// SSE ("data: {...}" lines with choices[0].delta.content, terminated by "data: [DONE]") is expected,
// usage is read from prompt_tokens/completion_tokens or input_tokens/output_tokens when present,
// and estimated from text length otherwise.
import { config, env } from './env.ts';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  /**
   * OpenAI-compatible reasoning effort ("low" | "medium" | "high"). Models with adaptive thinking
   * (e.g. claude-opus-5-5) stream reasoning as `reasoning_content` and can spend the whole token budget
   * on it; a low effort leaves room for the answer. Dropped automatically if the gateway rejects it.
   */
  reasoningEffort?: string;
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
}

export interface ChatResult {
  text: string;
  usage: Usage;
  model: string;
  firstTokenMs: number | null;
  totalMs: number;
}

export class ProviderError extends Error {
  /**
   * What the failed call probably cost: set when the provider accepted the request (it may have billed
   * tokens before the stream broke, timed out or came back empty). Null for rejected requests.
   */
  usage: Usage | null = null;
  constructor(
    message: string,
    public status: number,
    public kind: 'timeout' | 'http' | 'network' | 'empty' | 'config',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** True when the provider never started work, so nothing was billed (bad request, auth, config). */
export function providerRejected(err: unknown): boolean {
  return err instanceof ProviderError && (err.kind === 'config' || (err.kind === 'http' && err.usage === null));
}

export interface Provider {
  name: 'omniakey' | 'deepseek';
  baseUrl: string;
  key: string;
  keyName: string;
  /** Hard cap on max_tokens accepted by the provider, if any. */
  maxOutputTokens?: number;
}

/**
 * Which API a model id is served by. Ids starting with "deepseek-" go straight to DeepSeek
 * (OpenAI-compatible, key in the DEEPSEEK_API_KEY secret); everything else goes through OmniaKey.
 */
export function providerFor(model: string): Provider {
  if (model.startsWith('deepseek-')) {
    return {
      name: 'deepseek',
      baseUrl: config.deepseekBaseUrl(),
      key: config.deepseekKey(),
      keyName: 'DEEPSEEK_API_KEY',
      maxOutputTokens: config.deepseekMaxOutputTokens(),
    };
  }
  return { name: 'omniakey', baseUrl: config.omniakeyBaseUrl(), key: config.omniakeyKey(), keyName: 'OMNIAKEY_API_KEY' };
}

/** USD per million tokens, from the OmniaKey pricing tables (docs.omniakey.com/en/models, 2026-11-23). */
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-haiku-5-5': { input: 0.08, output: 0.4 },
  'claude-opus-5-5': { input: 1.12, output: 5.6 },
  'mimo-v2.6-flash': { input: 0.0666, output: 0.133 },
  'gpt-6.2-sol': { input: 0.18, output: 0.9 },
  // DeepSeek direct, list prices (cache miss). Check api-docs.deepseek.com; override with MODEL_PRICING_JSON.
  'deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
};
/** Unknown models are costed pessimistically so the spend ceiling stays safe. */
const FALLBACK_PRICE = { input: 5, output: 25 };

export function priceFor(model: string): { input: number; output: number } {
  try {
    const raw = config.pricingOverride();
    if (raw) {
      const override = JSON.parse(raw) as Record<string, { input: number; output: number }>;
      const p = override[model];
      if (p && Number.isFinite(p.input) && Number.isFinite(p.output)) return p;
    }
  } catch {
    /* ignore malformed override */
  }
  return PRICES[model] ?? FALLBACK_PRICE;
}

export function estimateCostUsd(model: string, usage: Usage): number {
  const p = priceFor(model);
  return (usage.inputTokens * p.input + usage.outputTokens * p.output) / 1_000_000;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}

function readUsage(u: unknown): { input: number; output: number } | null {
  if (!u || typeof u !== 'object') return null;
  const o = u as Record<string, unknown>;
  const input = Number(o.prompt_tokens ?? o.input_tokens);
  const output = Number(o.completion_tokens ?? o.output_tokens);
  if (!Number.isFinite(input) && !Number.isFinite(output)) return null;
  return { input: Number.isFinite(input) ? input : 0, output: Number.isFinite(output) ? output : 0 };
}

function deltaText(chunk: unknown): string {
  if (!chunk || typeof chunk !== 'object') return '';
  const c = chunk as Record<string, unknown>;
  const choices = c.choices as Array<Record<string, unknown>> | undefined;
  const first = choices?.[0];
  if (first) {
    const delta = first.delta as Record<string, unknown> | undefined;
    const fromDelta = contentText(delta?.content);
    if (fromDelta) return fromDelta;
    const message = first.message as Record<string, unknown> | undefined;
    const fromMessage = contentText(message?.content);
    if (fromMessage) return fromMessage;
    if (typeof first.text === 'string') return first.text;
    return '';
  }
  // Responses-API style events: {"type":"response.output_text.delta","delta":"..."}
  if (typeof c.delta === 'string' && typeof c.type === 'string' && c.type.includes('output_text')) return c.delta;
  if (typeof c.output_text === 'string') return c.output_text;
  // Anthropic-style stream events and messages, in case the gateway passes them through.
  const d = c.delta as Record<string, unknown> | undefined;
  if (d && typeof d === 'object' && typeof d.text === 'string') return d.text;
  const fromContent = contentText(c.content);
  if (fromContent) return fromContent;
  return '';
}

/** Content may be a string or an array of parts like [{type: 'text', text: '...'}]. Thinking parts are skipped. */
function contentText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        const part = p as Record<string, unknown>;
        if (part.type === 'thinking' || part.type === 'reasoning') return '';
        if (typeof part.text === 'string') return part.text;
      }
      return '';
    })
    .join('');
}

/**
 * Request body. Only required fields by default: some models on the gateway reject non-default sampling
 * parameters (e.g. "claude-haiku-5-5 does not support non-default temperature"), so temperature is only
 * sent when OMNIAKEY_SEND_TEMPERATURE=1.
 */
function buildBody(opts: ChatOptions, stream: boolean, minimal: boolean): string {
  const provider = providerFor(opts.model);
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    max_tokens: provider.maxOutputTokens ? Math.min(opts.maxTokens, provider.maxOutputTokens) : opts.maxTokens,
    stream,
  };
  if (!minimal) {
    if (opts.temperature !== undefined && env('OMNIAKEY_SEND_TEMPERATURE') === '1') body.temperature = opts.temperature;
    if (opts.reasoningEffort) body.reasoning_effort = opts.reasoningEffort;
    if (stream) body.stream_options = { include_usage: true };
  }
  return JSON.stringify(body);
}

/** A 400 that names a request parameter: worth one retry with the minimal body. */
function isParameterError(status: number, detail: string): boolean {
  return status === 400 && /(temperature|stream_options|include_usage|reasoning|unsupported|not support|unknown parameter|unrecognized)/i.test(detail);
}

/** Models that rejected an optional parameter in this function instance: send them the minimal body. */
const needsMinimalBody = new Set<string>();

async function post(opts: ChatOptions, stream: boolean, controller: AbortController): Promise<Response> {
  const provider = providerFor(opts.model);
  const key = provider.key;
  if (!key) throw new ProviderError(`${provider.keyName} is not set`, 0, 'config');
  const variants = needsMinimalBody.has(opts.model) ? [true] : [false, true];
  for (const minimal of variants) {
    let res: Response;
    try {
      res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Accept: stream ? 'text/event-stream' : 'application/json',
        },
        body: buildBody(opts, stream, minimal),
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) throw new ProviderError('Provider timed out', 0, 'timeout');
      throw new ProviderError(`Network error: ${(err as Error).message}`, 0, 'network');
    }
    if (res.ok) return res;
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    if (!minimal && isParameterError(res.status, detail)) {
      console.warn(`provider rejected a parameter for ${opts.model}, using the minimal body from now on:`, detail.slice(0, 160));
      needsMinimalBody.add(opts.model);
      continue;
    }
    throw new ProviderError(`Provider HTTP ${res.status}: ${detail}`, res.status, 'http');
  }
  throw new ProviderError('Provider rejected the request', 400, 'http');
}

function withTimeout(opts: ChatOptions): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  opts.signal?.addEventListener('abort', () => controller.abort());
  return { controller, clear: () => clearTimeout(timer) };
}

/** Streaming chat completion. onDelta receives raw text pieces as they arrive. */
export async function streamChat(opts: ChatOptions, onDelta: (text: string) => void): Promise<ChatResult> {
  const started = performance.now();
  const { controller, clear } = withTimeout(opts);
  let firstTokenMs: number | null = null;
  let text = '';
  let usage: { input: number; output: number } | null = null;
  // A few raw payloads, kept only to explain an empty completion in the logs (no secrets are in them).
  const samples: string[] = [];
  let finishReason: string | null = null;
  const inputChars = opts.messages.reduce((n, m) => n + m.content.length, 0);
  let accepted = false;
  // Attach a cost estimate to failures after the provider accepted the request.
  const withUsage = (err: ProviderError): ProviderError => {
    if (accepted) {
      err.usage = {
        inputTokens: usage?.input ?? Math.ceil(inputChars / 3.6),
        outputTokens: usage?.output ?? Math.max(estimateTokens(text), err.kind === 'timeout' ? opts.maxTokens : 0),
        estimated: true,
      };
    }
    return err;
  };
  try {
    const res = await post(opts, true, controller);
    accepted = true;
    const type = res.headers.get('Content-Type') ?? '';
    if (!type.includes('event-stream') || !res.body) {
      // Gateway answered without streaming: treat as a single chunk.
      const data = (await res.json()) as unknown;
      samples.push(JSON.stringify(data).slice(0, 300));
      text = deltaText(data);
      usage = readUsage((data as Record<string, unknown>)?.usage);
      if (text) {
        firstTokenMs = performance.now() - started;
        onDelta(text);
      }
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      outer: while (true) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch {
          if (controller.signal.aborted) throw withUsage(new ProviderError('Provider timed out', 0, 'timeout'));
          throw withUsage(new ProviderError('Stream interrupted', 0, 'network'));
        }
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, '\n');
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) {
            if (line && samples.length < 4) samples.push(line.slice(0, 200));
            continue;
          }
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') break outer;
          let parsed: unknown;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }
          const u = readUsage((parsed as Record<string, unknown>)?.usage);
          if (u) usage = u;
          const fr = ((parsed as Record<string, unknown>)?.choices as Array<Record<string, unknown>> | undefined)?.[0]?.finish_reason;
          if (typeof fr === 'string') finishReason = fr;
          const piece = deltaText(parsed);
          if (!piece && samples.length < 4) samples.push(payload.slice(0, 240));
          if (piece) {
            if (firstTokenMs === null) firstTokenMs = performance.now() - started;
            text += piece;
            onDelta(piece);
          }
        }
      }
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    }
  } finally {
    clear();
  }
  if (!text) {
    console.error(`empty completion from ${opts.model}; finish_reason=${finishReason}; usage=${JSON.stringify(usage)}; samples=${JSON.stringify(samples)}`);
    throw withUsage(new ProviderError('Empty completion', 0, 'empty'));
  }
  return {
    text,
    model: opts.model,
    firstTokenMs,
    totalMs: performance.now() - started,
    usage: usage
      ? { inputTokens: usage.input, outputTokens: usage.output, estimated: false }
      : { inputTokens: estimateTokens(' '.repeat(inputChars)), outputTokens: estimateTokens(text), estimated: true },
  };
}

/** Non-streaming chat completion. */
export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const started = performance.now();
  const { controller, clear } = withTimeout(opts);
  const inputChars = opts.messages.reduce((n, m) => n + m.content.length, 0);
  const billed = (err: ProviderError): ProviderError => {
    err.usage = { inputTokens: Math.ceil(inputChars / 3.6), outputTokens: opts.maxTokens, estimated: true };
    return err;
  };
  try {
    const res = await post(opts, false, controller);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      if (controller.signal.aborted) throw billed(new ProviderError('Provider timed out', 0, 'timeout'));
      throw billed(new ProviderError('Invalid JSON from provider', res.status, 'network'));
    }
    const text = deltaText(data);
    if (!text) throw billed(new ProviderError('Empty completion', 0, 'empty'));
    const u = readUsage((data as Record<string, unknown>)?.usage);
    return {
      text,
      model: opts.model,
      firstTokenMs: null,
      totalMs: performance.now() - started,
      usage: u
        ? { inputTokens: u.input, outputTokens: u.output, estimated: false }
        : { inputTokens: Math.ceil(inputChars / 3.6), outputTokens: estimateTokens(text), estimated: true },
    };
  } finally {
    clear();
  }
}
