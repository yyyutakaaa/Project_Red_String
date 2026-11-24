// generate-case: an AI writes a fresh case, and the shared validator decides whether it can be played.
//
// POST { device_id, preferences }            -> starts a job and runs attempt 1
// POST { device_id, job_id }                 -> runs the next repair attempt for that job
// Response: { status: 'ready', generated_case_id, case, remaining_today, attempts }
//        or { status: 'repairing', job_id, attempts, error_count, remaining_today }   (HTTP 202)
//        or { error: { code, message, errors? } }
//
// Each invocation makes exactly one model call so it stays inside the edge function time limit. On a
// validation failure the errors are sent back to the model; at most 2 repairs (3 attempts) are made.
// Valid cases are stored in generated_cases. Limit: 5 new generations per device per day.
import { z } from 'zod';
import { validateCase } from '../_shared/core/validator.ts';
import { buildGeneratorSystemPrompt, buildGeneratorUserPrompt, buildRepairPrompt } from '../_shared/core/generatorPrompt.ts';
import { extractJson } from '../_shared/core/replyParsing.ts';
import { errorResponse, isUuid, json, originRejected, preflight } from '../_shared/http.ts';
import { db, hitDailyCounter, hitRateLimit, logUsage, releaseCounter, spendCeilingReached } from '../_shared/db.ts';
import { streamChat, ProviderError, type ChatMessage } from '../_shared/omniakey.ts';
import { config } from '../_shared/env.ts';

const MAX_ATTEMPTS = 3;
const GENERATIONS_PER_DAY = 5;
const MAX_OUTPUT_TOKENS = 14_000;
const PROVIDER_TIMEOUT_MS = 135_000;

const Body = z.object({
  device_id: z.string().refine(isUuid, 'device_id must be a uuid'),
  job_id: z.string().refine(isUuid, 'job_id must be a uuid').optional(),
  preferences: z
    .object({
      setting: z.string().max(120).optional(),
      era: z.string().max(60).optional(),
      difficulty: z.enum(['gentle', 'standard', 'hard']).optional(),
    })
    .optional(),
});

interface JobRow {
  id: string;
  device_id: string;
  status: 'pending' | 'repairing' | 'ready' | 'failed';
  attempts: number;
  preferences: Record<string, unknown>;
  draft_json: unknown;
  last_errors: string[];
  case_json: unknown;
}

/** Give the generated case a stable id and keep only valid schema data. */
function normalizeDraft(draft: unknown, jobId: string): unknown {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return draft;
  return { ...(draft as Record<string, unknown>), id: `generated-${jobId.slice(0, 8)}`, schema_version: 1 };
}

async function runAttempt(job: JobRow, remainingToday: number): Promise<Response | { body: unknown; status: number }> {
  const model = config.generatorModel();
  const messages: ChatMessage[] = [
    { role: 'system', content: buildGeneratorSystemPrompt() },
    { role: 'user', content: buildGeneratorUserPrompt(job.preferences as Record<string, string>) },
  ];
  if (job.attempts > 0 && job.draft_json) {
    messages.push({ role: 'assistant', content: '```json\n' + JSON.stringify(job.draft_json) + '\n```' });
    messages.push({ role: 'user', content: buildRepairPrompt(job.last_errors ?? []) });
  }

  const attempt = job.attempts + 1;
  let text: string;
  try {
    const result = await streamChat({ model, messages, maxTokens: MAX_OUTPUT_TOKENS, temperature: 0.9, timeoutMs: PROVIDER_TIMEOUT_MS }, () => {});
    text = result.text;
    await logUsage(job.device_id, 'generate-case', model, result.usage);
  } catch (err) {
    const timeout = err instanceof ProviderError && err.kind === 'timeout';
    console.error('generator provider failure', (err as Error).message);
    await db().from('generated_cases').update({ status: 'failed', attempts: attempt, updated_at: new Date().toISOString() }).eq('id', job.id);
    return { status: timeout ? 504 : 502, body: { error: { code: timeout ? 'timeout' : 'server_error', message: 'The case writer did not deliver. Try again.' } } };
  }

  let draft = extractJson(text);
  if (draft === undefined) {
    // Parse failure: count as a failed attempt with a parse error the model can fix.
    draft = job.draft_json ?? null;
    const errors = ['Your answer did not contain a parseable JSON object in a ```json block.'];
    return saveRepairOrFail(job, attempt, draft, errors, remainingToday);
  }
  draft = normalizeDraft(draft, job.id);
  const v = validateCase(draft);
  if (v.ok) {
    const caseJson = v.case;
    await db()
      .from('generated_cases')
      .update({ status: 'ready', attempts: attempt, case_json: caseJson, draft_json: null, last_errors: [], updated_at: new Date().toISOString() })
      .eq('id', job.id);
    return { status: 200, body: { status: 'ready', generated_case_id: job.id, case: caseJson, remaining_today: remainingToday, attempts: attempt } };
  }
  return saveRepairOrFail(job, attempt, draft, v.errors, remainingToday);
}

async function saveRepairOrFail(job: JobRow, attempt: number, draft: unknown, errors: string[], remainingToday: number) {
  const failed = attempt >= MAX_ATTEMPTS;
  await db()
    .from('generated_cases')
    .update({
      status: failed ? 'failed' : 'repairing',
      attempts: attempt,
      draft_json: draft,
      last_errors: errors.slice(0, 60),
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);
  if (failed) {
    return {
      status: 422,
      body: { error: { code: 'invalid_case', message: 'The case writer could not produce a fair case. Try again.', errors: errors.slice(0, 20) } },
    };
  }
  return { status: 202, body: { status: 'repairing', job_id: job.id, attempts: attempt, error_count: errors.length, remaining_today: remainingToday } };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method === 'GET') return json(req, { ok: true, service: 'generate-case' });
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') : 'Invalid JSON body.';
    return errorResponse(req, 400, 'bad_request', msg);
  }

  try {
    const rl = await hitRateLimit(body.device_id, 6, 40, 'gen');
    if (!rl.allowed) return errorResponse(req, 429, 'rate_limited', 'Too many requests.', { 'Retry-After': String(rl.retryAfterSeconds) });
    if (await spendCeilingReached()) return errorResponse(req, 503, 'spend_limit', 'The daily budget is used up. Try again tomorrow.');
  } catch (err) {
    console.error('limit check failed', (err as Error).message);
    return errorResponse(req, 503, 'server_error', 'The case office is not answering.');
  }

  // Continue an existing job.
  if (body.job_id) {
    const { data, error } = await db().from('generated_cases').select('*').eq('id', body.job_id).maybeSingle();
    if (error || !data) return errorResponse(req, 404, 'not_found', 'Unknown generation job.');
    const job = data as JobRow;
    if (job.device_id !== body.device_id) return errorResponse(req, 403, 'bad_request', 'This job belongs to another device.');
    if (job.status === 'ready') {
      return json(req, { status: 'ready', generated_case_id: job.id, case: job.case_json, remaining_today: null, attempts: job.attempts });
    }
    if (job.status !== 'repairing' || job.attempts >= MAX_ATTEMPTS) {
      return errorResponse(req, 422, 'invalid_case', 'This generation job has ended. Start a new case.', {}, { errors: job.last_errors ?? [] });
    }
    const out = await runAttempt(job, -1);
    return out instanceof Response ? out : json(req, out.body, out.status);
  }

  // Start a new job: counts against the 5-per-day generation limit.
  let counter: { allowed: boolean; remaining: number; window: string };
  try {
    counter = await hitDailyCounter(body.device_id, 'gen-cases', GENERATIONS_PER_DAY);
  } catch (err) {
    console.error('generation counter failed', (err as Error).message);
    return errorResponse(req, 503, 'server_error', 'The case office is not answering.');
  }
  if (!counter.allowed) return errorResponse(req, 429, 'generation_limit', `You can generate ${GENERATIONS_PER_DAY} cases per day.`);

  const { data: inserted, error: insertError } = await db()
    .from('generated_cases')
    .insert({ device_id: body.device_id, status: 'pending', preferences: body.preferences ?? {} })
    .select('*')
    .single();
  if (insertError || !inserted) {
    await releaseCounter(body.device_id, counter.window);
    return errorResponse(req, 503, 'server_error', 'The case office is not answering.');
  }
  const out = await runAttempt(inserted as JobRow, counter.remaining);
  if (!(out instanceof Response) && (out.status === 504 || out.status === 502)) {
    // The provider failed before producing anything: do not charge the daily generation.
    await releaseCounter(body.device_id, counter.window);
  }
  return out instanceof Response ? out : json(req, out.body, out.status);
});
