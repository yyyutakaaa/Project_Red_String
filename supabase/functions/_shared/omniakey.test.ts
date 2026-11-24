// Deno tests for the OmniaKey client with a stubbed fetch (no network, no key needed).
// Run: npx deno test --config supabase/functions/interrogate/deno.json --allow-env supabase/functions/_shared/omniakey.test.ts
import { chat, estimateCostUsd, ProviderError, streamChat } from './omniakey.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function sseResponse(lines: string[], chunkSize = 7): Response {
  const text = lines.join('');
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < text.length; i += chunkSize) c.enqueue(enc.encode(text.slice(i, i + chunkSize)));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function withFetch(impl: (url: string, init: RequestInit) => Promise<Response>, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => impl(String(input), init ?? {})) as typeof fetch;
  Deno.env.set('OMNIAKEY_API_KEY', 'test-key');
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

const opts = { model: 'claude-haiku-5-5', messages: [{ role: 'user' as const, content: 'hello' }], maxTokens: 50, timeoutMs: 2000 };

Deno.test('sends reasoning_effort, and after a rejection uses the minimal body for that model only', async () => {
  const bodies: Record<string, unknown>[] = [];
  await withFetch(
    async (_url, init) => {
      const body = JSON.parse(String(init.body));
      bodies.push(body);
      if (body.model === 'picky-model' && 'reasoning_effort' in body) {
        return new Response('{"error":{"message":"Unknown parameter: reasoning_effort"}}', { status: 400 });
      }
      return sseResponse(['data: {"choices":[{"delta":{"content":"Ok."}}]}\n\n', 'data: [DONE]\n\n']);
    },
    async () => {
      await streamChat({ ...opts, reasoningEffort: 'low' }, () => {});
      assert(bodies[0]!.reasoning_effort === 'low', 'reasoning_effort is sent');
      await streamChat({ ...opts, model: 'picky-model', reasoningEffort: 'low' }, () => {});
      await streamChat({ ...opts, model: 'picky-model', reasoningEffort: 'low' }, () => {});
      const picky = bodies.filter((b) => b.model === 'picky-model');
      assert(picky.length === 3, `expected 1 rejected + 2 minimal requests, got ${picky.length}`);
      assert(!('reasoning_effort' in picky[2]!), 'remembered minimal body');
    },
  );
});

Deno.test('streams OpenAI-style deltas and reads usage', async () => {
  await withFetch(
    async (url, init) => {
      assert(url.endsWith('/v1/chat/completions'), `unexpected url ${url}`);
      const headers = init.headers as Record<string, string>;
      assert(headers.Authorization === 'Bearer test-key', 'missing bearer auth');
      const body = JSON.parse(String(init.body));
      assert(body.stream === true && body.model === 'claude-haiku-5-5', 'bad body');
      return sseResponse([
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"I was "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"at home."}}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":120,"completion_tokens":9}}\n\n',
        'data: [DONE]\n\n',
      ]);
    },
    async () => {
      const pieces: string[] = [];
      const r = await streamChat(opts, (p) => pieces.push(p));
      assert(r.text === 'I was at home.', `text was ${r.text}`);
      assert(pieces.join('') === r.text, 'deltas do not add up');
      assert(r.usage.inputTokens === 120 && r.usage.outputTokens === 9 && !r.usage.estimated, 'usage not read');
      assert(r.firstTokenMs !== null, 'no first token time');
    },
  );
});

Deno.test('estimates usage when the stream has none, and handles CRLF', async () => {
  await withFetch(
    async () => sseResponse(['data: {"choices":[{"delta":{"content":"Fine."}}]}\r\n\r\n', 'data: [DONE]\r\n\r\n'], 3),
    async () => {
      const r = await streamChat(opts, () => {});
      assert(r.text === 'Fine.', 'text');
      assert(r.usage.estimated && r.usage.outputTokens > 0, 'estimate');
    },
  );
});

Deno.test('falls back to a JSON body when the gateway does not stream', async () => {
  await withFetch(
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'Plain.' } }], usage: { input_tokens: 5, output_tokens: 2 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    async () => {
      const r = await streamChat(opts, () => {});
      assert(r.text === 'Plain.' && r.usage.inputTokens === 5 && r.usage.outputTokens === 2, 'json fallback');
      const r2 = await chat(opts);
      assert(r2.text === 'Plain.', 'chat');
    },
  );
});

Deno.test('reports HTTP errors and timeouts as ProviderError', async () => {
  await withFetch(
    async () => new Response('{"error":"nope"}', { status: 429 }),
    async () => {
      let caught: unknown = null;
      try {
        await streamChat(opts, () => {});
      } catch (e) {
        caught = e;
      }
      assert(caught instanceof ProviderError && caught.status === 429 && caught.kind === 'http', 'http error');
    },
  );
  await withFetch(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }),
    async () => {
      let caught: unknown = null;
      try {
        await streamChat({ ...opts, timeoutMs: 50 }, () => {});
      } catch (e) {
        caught = e;
      }
      assert(caught instanceof ProviderError && caught.kind === 'timeout', 'timeout');
    },
  );
});

Deno.test('sends no temperature by default and retries once without optional fields on a parameter error', async () => {
  const bodies: Record<string, unknown>[] = [];
  await withFetch(
    async (_url, init) => {
      const body = JSON.parse(String(init.body));
      bodies.push(body);
      if (bodies.length === 1) {
        return new Response('{"error":{"message":"Invalid request for the selected model. x does not support stream_options"}}', { status: 400 });
      }
      return sseResponse(['data: {"choices":[{"delta":{"content":"Ok."}}]}\n\n', 'data: [DONE]\n\n']);
    },
    async () => {
      const r = await streamChat({ ...opts, temperature: 0.8 }, () => {});
      assert(r.text === 'Ok.', 'retry result');
      assert(bodies.length === 2, `expected 2 requests, got ${bodies.length}`);
      assert(!('temperature' in bodies[0]!), 'temperature must not be sent by default');
      assert('stream_options' in bodies[0]! && !('stream_options' in bodies[1]!), 'minimal retry drops optional fields');
    },
  );
});

Deno.test('reads content-part arrays and skips thinking parts', async () => {
  await withFetch(
    async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":[{"type":"thinking","thinking":"hmm"}]}}]}\n\n',
        'data: {"choices":[{"delta":{"content":[{"type":"text","text":"Hello"}]}}]}\n\n',
        'data: {"type":"response.output_text.delta","delta":" there"}\n\n',
        'data: [DONE]\n\n',
      ]),
    async () => {
      const r = await streamChat(opts, () => {});
      assert(r.text === 'Hello there', `text was ${r.text}`);
    },
  );
});

Deno.test('routes deepseek- models to DeepSeek with its own key, output cap and thinking off', async () => {
  Deno.env.set('DEEPSEEK_API_KEY', 'ds-test');
  await withFetch(
    async (url, init) => {
      assert(url === 'https://api.deepseek.com/chat/completions', `unexpected url ${url}`);
      assert((init.headers as Record<string, string>).Authorization === 'Bearer ds-test', 'deepseek key not used');
      const body = JSON.parse(String(init.body));
      assert(body.max_tokens === 4096, `max_tokens was ${body.max_tokens}`);
      assert(body.thinking?.type === 'disabled' && body.reasoning_effort === undefined, 'thinking must be off');
      return sseResponse([
        'data: {"choices":[{"delta":{"reasoning_content":"hm"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Hi."}}]}\n\n',
        'data: [DONE]\n\n',
      ]);
    },
    async () => {
      Deno.env.set('DEEPSEEK_MAX_OUTPUT_TOKENS', '4096');
      const r = await streamChat({ ...opts, model: 'deepseek-flash', maxTokens: 16000, reasoningEffort: 'low' }, () => {});
      Deno.env.delete('DEEPSEEK_MAX_OUTPUT_TOKENS');
      assert(r.text === 'Hi.', `text was ${r.text}`);
    },
  );
});

Deno.test('uses the Anthropic-native route for claude models when asked', async () => {
  await withFetch(
    async (url, init) => {
      assert(url.endsWith('/v1/messages'), `unexpected url ${url}`);
      const body = JSON.parse(String(init.body));
      assert(body.system === 'sys' && body.messages.length === 1 && body.messages[0].role === 'user', 'system must be split out');
      assert(body.thinking?.type === 'disabled', 'thinking disabled');
      return sseResponse([
        'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":40,"output_tokens":1}}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Case"}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" file."}}\n\n',
        'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":7}}\n\n',
      ]);
    },
    async () => {
      const r = await streamChat(
        { ...opts, model: 'claude-opus-5-5', anthropicNative: true, messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'go' }] },
        () => {},
      );
      assert(r.text === 'Case file.', `text was ${r.text}`);
      assert(r.usage.inputTokens === 40 && r.usage.outputTokens === 7, `usage ${JSON.stringify(r.usage)}`);
    },
  );
});

Deno.test('prices known and unknown models', () => {
  const known = estimateCostUsd('claude-haiku-5-5', { inputTokens: 1_000_000, outputTokens: 1_000_000, estimated: false });
  assert(Math.abs(known - 0.48) < 1e-9, `haiku cost ${known}`);
  const unknown = estimateCostUsd('mystery-model', { inputTokens: 1_000_000, outputTokens: 0, estimated: false });
  assert(unknown === 5, 'unknown models are costed pessimistically');
});
