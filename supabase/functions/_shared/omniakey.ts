// OmniaKey client (OpenAI-compatible Chat Completions endpoint).
// Docs (docs.omniakey.com): base https://api.omniakey.com/v1, POST /chat/completions,
// auth "Authorization: Bearer <key>". Claude, GPT and MiMo model ids are all served on this route.
// Streaming and usage fields are not documented in detail, so parsing is defensive: standard OpenAI
// SSE ("data: {...}" lines with choices[0].delta.content, terminated by "data: [DONE]") is expected,
// usage is read from prompt_tokens/completion_tokens or input_tokens/output_tokens when present,
// and estimated from text length otherwise.
import { config } from './env.ts';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
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
  constructor(
    message: string,
    public status: number,
    public kind: 'timeout' | 'http' | 'network' | 'empty' | 'config',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** USD per million tokens, from the OmniaKey pricing tables (docs.omniakey.com/en/models, 2026-11-23). */
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-haiku-5-5': { input: 0.08, output: 0.4 },
  'claude-opus-5-5': { input: 1.12, output: 5.6 },
  'mimo-v2.6-flash': { input: 0.0666, output: 0.133 },
  'gpt-6.2-sol': { input: 0.18, output: 0.9 },
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
    if (typeof delta?.content === 'string') return delta.content;
    const message = first.message as Record<string, unknown> | undefined;
    if (typeof message?.content === 'string') return message.content;
    if (typeof first.text === 'string') return first.text;
  }
  // Anthropic-style stream events, in case the gateway passes them through.
  const d = c.delta as Record<string, unknown> | undefined;
  if (typeof d?.text === 'string') return d.text;
  return '';
}

function buildBody(opts: ChatOptions, stream: boolean): string {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.7,
    stream,
  };
  if (stream) body.stream_options = { include_usage: true };
  return JSON.stringify(body);
}

async function post(opts: ChatOptions, stream: boolean, controller: AbortController): Promise<Response> {
  const key = config.omniakeyKey();
  if (!key) throw new ProviderError('OMNIAKEY_API_KEY is not set', 0, 'config');
  let res: Response;
  try {
    res = await fetch(`${config.omniakeyBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: stream ? 'text/event-stream' : 'application/json',
      },
      body: buildBody(opts, stream),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) throw new ProviderError('Provider timed out', 0, 'timeout');
    throw new ProviderError(`Network error: ${(err as Error).message}`, 0, 'network');
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new ProviderError(`Provider HTTP ${res.status}: ${detail}`, res.status, 'http');
  }
  return res;
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
  try {
    const res = await post(opts, true, controller);
    const type = res.headers.get('Content-Type') ?? '';
    if (!type.includes('event-stream') || !res.body) {
      // Gateway answered without streaming: treat as a single chunk.
      const data = (await res.json()) as unknown;
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
          if (controller.signal.aborted) throw new ProviderError('Provider timed out', 0, 'timeout');
          throw new ProviderError('Stream interrupted', 0, 'network');
        }
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, '\n');
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
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
          const piece = deltaText(parsed);
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
  if (!text) throw new ProviderError('Empty completion', 0, 'empty');
  const inputChars = opts.messages.reduce((n, m) => n + m.content.length, 0);
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
  try {
    const res = await post(opts, false, controller);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      if (controller.signal.aborted) throw new ProviderError('Provider timed out', 0, 'timeout');
      throw new ProviderError('Invalid JSON from provider', res.status, 'http');
    }
    const text = deltaText(data);
    if (!text) throw new ProviderError('Empty completion', 0, 'empty');
    const u = readUsage((data as Record<string, unknown>)?.usage);
    const inputChars = opts.messages.reduce((n, m) => n + m.content.length, 0);
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
