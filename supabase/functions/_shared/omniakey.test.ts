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

Deno.test('prices known and unknown models', () => {
  const known = estimateCostUsd('claude-haiku-5-5', { inputTokens: 1_000_000, outputTokens: 1_000_000, estimated: false });
  assert(Math.abs(known - 0.48) < 1e-9, `haiku cost ${known}`);
  const unknown = estimateCostUsd('mystery-model', { inputTokens: 1_000_000, outputTokens: 0, estimated: false });
  assert(unknown === 5, 'unknown models are costed pessimistically');
});
