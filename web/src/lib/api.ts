// Client for the two Supabase Edge Functions. Interrogation replies stream over SSE:
//   event: delta  data: {"text": "..."}             (zero or more)
//   event: final  data: InterrogateFinal             (exactly one on success)
//   event: error  data: {"code": "...", "message": "..."}
// Non-streaming errors come back as JSON: {"error": {"code": "...", "message": "..."}}.
import type { CaseFile, Mood } from '@shared/caseSchema.ts';
import { BACKEND_CONFIGURED, FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from './config.ts';

export type ApiErrorCode =
  | 'offline'
  | 'not_configured'
  | 'rate_limited'
  | 'patience_exhausted'
  | 'spend_limit'
  | 'generation_limit'
  | 'bad_request'
  | 'not_found'
  | 'invalid_case'
  | 'timeout'
  | 'server_error';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 0,
    public retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ConversationTurn {
  role: 'detective' | 'suspect';
  text: string;
}

export interface InterrogateRequest {
  case_id?: string;
  generated_case_id?: string;
  suspect_id: string;
  save_id: string;
  conversation: ConversationTurn[];
  message: string;
  shown_evidence_id: string | null;
  device_id: string;
  /** The run this save was copied from, so the server can carry its interrogation state over. */
  parent_save_id?: string | null;
}

export interface InterrogateFinal {
  reply: string;
  /** Clues newly revealed by this reply. */
  revealed_clue_ids: string[];
  /** Every clue this suspect has revealed in this run, so a reply lost in transit is recovered next time. */
  all_revealed_clue_ids?: string[];
  mood: Mood;
  patience_used: number;
  patience_max: number;
  /** True when the provider failed: the reply is a canned deflection and no patience was used. */
  silent: boolean;
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  };
}

async function errorFromResponse(res: Response): Promise<ApiError> {
  let code: ApiErrorCode = res.status === 429 ? 'rate_limited' : res.status === 404 ? 'not_found' : res.status >= 500 ? 'server_error' : 'bad_request';
  let message = `Request failed (${res.status}).`;
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.code) code = body.error.code as ApiErrorCode;
    if (body.error?.message) message = body.error.message;
  } catch {
    /* ignore non-JSON bodies */
  }
  const retry = Number(res.headers.get('Retry-After'));
  return new ApiError(code, message, res.status, Number.isFinite(retry) && retry > 0 ? retry : null);
}

function ensureConfigured(): void {
  if (!BACKEND_CONFIGURED) throw new ApiError('not_configured', 'The interrogation service is not configured for this build.');
}

/** Parse an SSE byte stream into (event, data) pairs. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        let event = 'message';
        const data: string[] = [];
        for (const line of block.split('\n')) {
          if (line.startsWith(':')) continue;
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (data.length) yield { event, data: data.join('\n') };
      }
    }
    if (buffer.trim()) {
      const data = buffer
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).replace(/^ /, ''));
      const ev = buffer.split('\n').find((l) => l.startsWith('event:'))?.slice(6).trim() ?? 'message';
      if (data.length) yield { event: ev, data: data.join('\n') };
    }
  } finally {
    reader.releaseLock();
  }
}

export interface StreamHandlers {
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

const INTERROGATE_TIMEOUT_MS = 45_000;

export async function interrogate(req: InterrogateRequest, handlers: StreamHandlers = {}): Promise<InterrogateFinal> {
  ensureConfigured();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), INTERROGATE_TIMEOUT_MS);
  handlers.signal?.addEventListener('abort', () => controller.abort(handlers.signal?.reason));
  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/interrogate`, {
      method: 'POST',
      headers: { ...headers(), Accept: 'text/event-stream' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    if (controller.signal.aborted && !handlers.signal?.aborted) throw new ApiError('timeout', 'The interrogation timed out.');
    throw new ApiError('offline', 'Cannot reach the interrogation room. Check your connection.', 0);
  }
  try {
    if (!res.ok) throw await errorFromResponse(res);
    const type = res.headers.get('Content-Type') ?? '';
    if (!type.includes('text/event-stream') || !res.body) {
      const body = (await res.json()) as InterrogateFinal;
      return body;
    }
    let final: InterrogateFinal | null = null;
    for await (const { event, data } of readSse(res.body)) {
      if (event === 'delta') {
        const { text } = JSON.parse(data) as { text: string };
        if (text) handlers.onDelta?.(text);
      } else if (event === 'final') {
        final = JSON.parse(data) as InterrogateFinal;
      } else if (event === 'error') {
        const e = JSON.parse(data) as { code?: ApiErrorCode; message?: string };
        throw new ApiError(e.code ?? 'server_error', e.message ?? 'The interrogation failed.');
      }
    }
    if (!final) throw new ApiError('server_error', 'The reply ended unexpectedly.');
    return final;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (controller.signal.aborted) throw new ApiError('timeout', 'The interrogation timed out.');
    throw new ApiError('offline', 'The connection to the interrogation room was lost.');
  } finally {
    clearTimeout(timer);
  }
}

export interface GenerateCaseRequest {
  device_id: string;
  preferences: { setting?: string; era?: string; difficulty?: 'gentle' | 'standard' | 'hard' };
}

export interface GenerateCaseResponse {
  generated_case_id: string;
  case: CaseFile;
  remaining_today: number;
  attempts: number;
}

export interface GenerateProgress {
  /** 1 for the first draft, 2 and 3 for repairs after validation errors. */
  attempt: number;
  errorCount: number;
}

/** Per request; the server stops its own model call at 135 s. */
export const GENERATE_STEP_TIMEOUT_MS = 160_000;

interface GenerateStep {
  status?: 'ready' | 'repairing';
  job_id?: string;
  attempts?: number;
  error_count?: number;
  remaining_today?: number | null;
  generated_case_id?: string;
  case?: CaseFile;
}

/**
 * Generate a new case. The server makes one model call per request; when the validator rejects a draft
 * it answers "repairing" with a job id and this client asks for the next repair (at most two).
 */
export async function generateCase(
  req: GenerateCaseRequest,
  signal?: AbortSignal,
  onProgress?: (p: GenerateProgress) => void,
): Promise<GenerateCaseResponse> {
  ensureConfigured();
  let payload: Record<string, unknown> = { ...req };
  let remaining: number | null = null;
  for (let step = 0; step < 4; step++) {
    // Each request (one model call on the server) gets its own time budget.
    const stepController = new AbortController();
    const stepTimer = setTimeout(() => stepController.abort(), GENERATE_STEP_TIMEOUT_MS);
    const onAbort = () => stepController.abort();
    signal?.addEventListener('abort', onAbort);
    let res: Response;
    let body: GenerateStep;
    try {
      try {
        res = await fetch(`${FUNCTIONS_URL}/generate-case`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
          signal: stepController.signal,
        });
      } catch {
        if (signal?.aborted) throw new ApiError('timeout', 'Generation cancelled.');
        if (stepController.signal.aborted) throw new ApiError('timeout', 'The case office took too long. Try again.');
        throw new ApiError('offline', 'Cannot reach the case office. Check your connection.');
      }
      if (!res.ok) throw await errorFromResponse(res);
      body = (await res.json()) as GenerateStep;
    } finally {
      clearTimeout(stepTimer);
      signal?.removeEventListener('abort', onAbort);
    }
    if (typeof body.remaining_today === 'number' && body.remaining_today >= 0) remaining = body.remaining_today;
    if (body.status === 'ready' && body.generated_case_id && body.case) {
      return { generated_case_id: body.generated_case_id, case: body.case, remaining_today: remaining ?? 0, attempts: body.attempts ?? step + 1 };
    }
    if (body.status === 'repairing' && body.job_id) {
      onProgress?.({ attempt: (body.attempts ?? step + 1) + 1, errorCount: body.error_count ?? 0 });
      payload = { device_id: req.device_id, job_id: body.job_id };
      continue;
    }
    throw new ApiError('server_error', 'Unexpected answer from the case office.');
  }
  throw new ApiError('invalid_case', 'The case writer could not produce a fair case. Try again.');
}

/** Cheap reachability probe used to show an offline banner before the player types. */
export async function checkBackend(timeoutMs = 6000): Promise<boolean> {
  if (!BACKEND_CONFIGURED) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FUNCTIONS_URL}/interrogate`, { method: 'GET', headers: headers(), signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function describeApiError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Try again.';
  switch (err.code) {
    case 'offline':
      return 'The interrogation room is unreachable right now. Rooms, notebook and board still work offline.';
    case 'not_configured':
      return 'This build has no interrogation service configured. Rooms, notebook and board still work.';
    case 'rate_limited':
      return err.retryAfterSeconds
        ? `Easy, Detective. Too many questions too fast. Try again in ${err.retryAfterSeconds} seconds.`
        : 'Easy, Detective. Too many questions too fast. Try again shortly.';
    case 'patience_exhausted':
      return 'This suspect will not answer any more questions.';
    case 'spend_limit':
      return 'The precinct is out of budget for today. Interrogations reopen tomorrow.';
    case 'generation_limit':
      return 'You have used all new case files for today. Come back tomorrow.';
    case 'timeout':
      return 'The suspect took too long to answer. Try again.';
    default:
      return err.message || 'Something went wrong. Try again.';
  }
}
