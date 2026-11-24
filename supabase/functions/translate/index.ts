// translate: turns English game text into another language. Only web/scripts/translate.ts calls it,
// once per batch of strings, when a language is added or English text changes. Players never do.
//
// Request (POST JSON, header X-Eval-Token: a valid token from public.eval_tokens):
//   { language: "nl", strings: { "<key>": "<English text>", ... }, context?: "<what the text is>" }
// Response: { strings: { "<key>": "<translation>", ... }, model }
//   Keys the model left out are missing from the reply; the script asks again for those.
//   codes: unauthorized, bad_request, spend_limit, server_error
//
// The model is deepseek-flash, like the suspects. The cost is reserved against the same daily ceiling
// as interrogations (DAILY_SPEND_LIMIT_USD).
// Self-contained apart from http.ts and env.ts (like account/), so it deploys with few files.
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { errorResponse, json, originRejected, preflight, sha256Hex } from '../_shared/http.ts';
import { config } from '../_shared/env.ts';

/** Languages the game can be translated into, with how each one should address the player. */
const LANGUAGES: Record<string, { name: string; notes: string }> = {
  nl: {
    name: 'Dutch',
    notes: 'Standard Dutch that reads naturally in both the Netherlands and Flanders. Address the player with "je/jij", never "u".',
  },
  fr: { name: 'French', notes: 'Address the player with "vous". Use French typography: a space before : ; ? ! and « » for quotes.' },
  de: { name: 'German', notes: 'Address the player with "du". Use „…“ for quotes.' },
  es: { name: 'Spanish', notes: 'Neutral Spanish for Spain and Latin America. Address the player with "tú". Use ¿ ¡ and « » or “ ” for quotes.' },
  it: { name: 'Italian', notes: 'Address the player with "tu".' },
  pt: { name: 'Portuguese', notes: 'Brazilian Portuguese. Address the player with "você".' },
  pl: { name: 'Polish', notes: 'Address the player informally.' },
  sv: { name: 'Swedish', notes: 'Address the player with "du".' },
  da: { name: 'Danish', notes: 'Address the player with "du".' },
  nb: { name: 'Norwegian Bokmål', notes: 'Address the player with "du".' },
  fi: { name: 'Finnish', notes: 'Address the player informally.' },
  cs: { name: 'Czech', notes: 'Address the player informally.' },
  tr: { name: 'Turkish', notes: 'Address the player with "sen".' },
  ro: { name: 'Romanian', notes: 'Address the player with "tu".' },
};

/** The one model the game uses, served by DeepSeek-V4.1-Flash-1017 (api-docs.deepseek.com, 2026-11-24). */
const MODEL = 'deepseek-flash';
/** USD per million tokens at peak price, cache miss (off-peak is half): the safe side for the ceiling. */
const PRICE = { input: 0.3, output: 1.2 };

const MAX_STRINGS = 80;
const MAX_CHARS = 14_000;
const MAX_OUTPUT_TOKENS = 8_000;
const TIMEOUT_MS = 140_000;

const Body = z.object({
  language: z.string().regex(/^[a-z]{2,3}$/),
  strings: z.record(z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/), z.string().max(6_000)),
  context: z.string().max(4_000).optional(),
});

const admin = createClient(config.supabaseUrl(), config.serviceRoleKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** The label of a valid, unrevoked token from public.eval_tokens (the same tokens tools/eval uses), or null. */
async function tokenLabel(req: Request): Promise<string | null> {
  const token = req.headers.get('x-eval-token');
  if (!token || token.length < 24 || token.length > 200) return null;
  const { data, error } = await admin.from('eval_tokens').select('label, revoked').eq('token_hash', await sha256Hex(token)).maybeSingle();
  if (error || !data || data.revoked) return null;
  return String(data.label ?? 'eval');
}

function costUsd(input: number, output: number): number {
  return (input * PRICE.input + output * PRICE.output) / 1_000_000;
}

function systemPrompt(language: { name: string; notes: string }): string {
  return [
    `You translate the text of "Project Red String", a film-noir detective game, from English into ${language.name}.`,
    'The game is set in Calder City, an invented American port city, from October 1948 to June 1950. The player is a police detective.',
    'Keep the voice: hard-boiled, dry, short sentences, period detail, no modern slang. Translate the meaning and the tone, not word for word.',
    'Rules:',
    '- Keep the names of people, places, businesses, streets, ships, trains and newspapers exactly as they are (Calder City, Ashgrove House, The Blue Lantern, Pier Seventeen). Translate a common noun next to a name only when that reads naturally.',
    '- Keep every placeholder in curly braces exactly as written, for example {name}, {count}, {cost}. Never translate or remove them.',
    '- Keep line breaks, numbers, times (21:40), money amounts and markdown-like markers as they are.',
    '- Keep each string about as long as the English one. Interface labels stay short; buttons stay one to three words.',
    '- Strings whose keys end in ".one" and ".other" are the singular and plural form of the same message.',
    `- ${language.notes}`,
    'Answer with one JSON object only, in a ```json fence: the same keys as the input, each with its translation. No comments, no extra keys.',
  ].join('\n');
}

/** The first JSON object in a reply: a fenced block, or the outermost braces. */
function firstJsonObject(text: string): Record<string, unknown> | null {
  const candidates: string[] = [];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fenced.exec(text)) !== null) if (m[1]) candidates.push(m[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** One call to DeepSeek (OpenAI-compatible), thinking off: a translation needs the whole budget for the answer. */
async function complete(system: string, user: string, maxTokens: number): Promise<{ text: string; input: number; output: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${config.deepseekBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.deepseekKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`provider HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const text = data.choices?.[0]?.message?.content ?? '';
    return {
      text,
      input: Number(data.usage?.prompt_tokens) || Math.ceil((system.length + user.length) / 3.6),
      output: Number(data.usage?.completion_tokens) || Math.ceil(text.length / 3.6),
    };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  const label = await tokenLabel(req);
  if (!label) return errorResponse(req, 401, 'unauthorized', 'A valid X-Eval-Token is required.');

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return errorResponse(req, 400, 'bad_request', 'Send { language, strings, context? }.');
  }
  const language = LANGUAGES[body.language];
  if (!language) return errorResponse(req, 400, 'bad_request', `Unknown language "${body.language}".`);
  const keys = Object.keys(body.strings);
  const chars = keys.reduce((n, k) => n + k.length + (body.strings[k]?.length ?? 0), 0);
  if (keys.length === 0 || keys.length > MAX_STRINGS || chars > MAX_CHARS) {
    return errorResponse(req, 400, 'bad_request', `Send 1 to ${MAX_STRINGS} strings and at most ${MAX_CHARS} characters per call.`);
  }

  const system = systemPrompt(language);
  const user = [body.context ? `What this text is: ${body.context}` : '', 'Translate these strings:', '```json', JSON.stringify(body.strings, null, 1), '```']
    .filter(Boolean)
    .join('\n');

  // Room for the answer: a translation runs about as long as the source, some languages a third longer.
  const inputTokens = Math.ceil((system.length + user.length) / 3.6);
  const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.ceil((chars / 3.6) * 1.6) + 400);
  // Reserve the worst case against the daily ceiling, then settle it with what the call really cost.
  const worst = costUsd(inputTokens, maxTokens);
  const { data: reservation, error: reserveError } = await admin.rpc('rs_reserve_spend', {
    p_device_id: `translate:${label}`,
    p_function: 'translate',
    p_model: MODEL,
    p_estimate: Number(worst.toFixed(6)),
    p_limit: config.dailySpendLimitUsd(),
  });
  if (reserveError) console.error('reserve spend failed', reserveError.message);
  if (reserveError || reservation === null) return errorResponse(req, 503, 'spend_limit', 'The daily budget is used up. Try again tomorrow.');
  const settle = (fn: string, input: number, output: number) =>
    admin.rpc('rs_settle_spend', {
      p_id: Number(reservation),
      p_function: fn,
      p_input_tokens: Math.round(input),
      p_output_tokens: Math.round(output),
      p_cost: Number(costUsd(input, output).toFixed(6)),
    });

  try {
    const result = await complete(system, user, maxTokens);
    await settle('translate', result.input, result.output);
    const parsed = firstJsonObject(result.text) ?? {};
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = parsed[k];
      if (typeof v === 'string' && v.trim()) out[k] = v;
    }
    return json(req, { strings: out, model: MODEL });
  } catch (err) {
    // A timeout may still have been billed: count the full output budget to stay on the safe side.
    await settle('translate-failed', inputTokens, maxTokens);
    console.error('translate failed', err instanceof Error ? err.message : err);
    return errorResponse(req, 502, 'server_error', 'The translation model did not answer. Try again.');
  }
});
