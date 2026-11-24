// Service-role database access for the edge functions: rate limits, spend ceiling, usage log,
// conversation state and generated cases. The browser never talks to these tables.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './env.ts';
import { estimateCostUsd, type Usage } from './omniakey.ts';

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabaseUrl(), config.serviceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function utcStamp(): { minute: string; day: string } {
  const iso = new Date().toISOString();
  return { minute: iso.slice(0, 16), day: iso.slice(0, 10) };
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  scope: 'minute' | 'day' | null;
}

/** Count one request against per-minute and per-day limits for a key (device id or hashed IP). */
export async function hitRateLimit(key: string, perMinute: number, perDay: number, prefix = 'rl'): Promise<RateLimitResult> {
  const { minute, day } = utcStamp();
  const { data, error } = await db().rpc('rs_hit_rate_limit', {
    p_key: key,
    p_minute_window: `${prefix}:m:${minute}`,
    p_day_window: `${prefix}:d:${day}`,
    p_minute_limit: perMinute,
    p_day_limit: perDay,
  });
  if (error) throw new Error(`rate limit rpc failed: ${error.message}`);
  const r = data as { allowed: boolean; minute_exceeded: boolean; day_exceeded: boolean };
  if (r.allowed) return { allowed: true, retryAfterSeconds: 0, scope: null };
  const now = new Date();
  if (r.day_exceeded) {
    const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return { allowed: false, retryAfterSeconds: Math.ceil((tomorrow - now.getTime()) / 1000), scope: 'day' };
  }
  return { allowed: false, retryAfterSeconds: 60 - now.getUTCSeconds(), scope: 'minute' };
}

export async function hitDailyCounter(key: string, name: string, limit: number): Promise<{ allowed: boolean; remaining: number; window: string }> {
  const window = `${name}:d:${utcStamp().day}`;
  const { data, error } = await db().rpc('rs_hit_counter', { p_key: key, p_window: window, p_limit: limit });
  if (error) throw new Error(`counter rpc failed: ${error.message}`);
  const r = data as { allowed: boolean; remaining: number };
  return { allowed: r.allowed, remaining: r.remaining, window };
}

export async function releaseCounter(key: string, window: string): Promise<void> {
  await db().rpc('rs_release_counter', { p_key: key, p_window: window });
}

export async function dailySpendUsd(): Promise<number> {
  const { data, error } = await db().rpc('rs_daily_spend_usd');
  if (error) throw new Error(`spend rpc failed: ${error.message}`);
  return Number(data) || 0;
}

/** True when today's estimated spend has reached DAILY_SPEND_LIMIT_USD. Fails closed on errors. */
export async function spendCeilingReached(): Promise<boolean> {
  try {
    return (await dailySpendUsd()) >= config.dailySpendLimitUsd();
  } catch {
    return true;
  }
}

/**
 * Reserve the worst-case cost of a model call against the daily ceiling, atomically (advisory lock in
 * Postgres). Returns the usage_log row id, or null when the ceiling would be passed. Fails closed.
 */
export async function reserveSpend(deviceId: string, fn: string, model: string, estimateUsd: number): Promise<number | null> {
  const { data, error } = await db().rpc('rs_reserve_spend', {
    p_device_id: deviceId,
    p_function: fn,
    p_model: model,
    p_estimate: Number(estimateUsd.toFixed(6)),
    p_limit: config.dailySpendLimitUsd(),
  });
  if (error) {
    console.error('reserve spend failed', error.message);
    return null;
  }
  return typeof data === 'number' ? data : data === null ? null : Number(data);
}

/** Replace a reservation with what the calls actually cost (summed). */
export async function settleSpend(id: number, fn: string, model: string, usages: Usage[]): Promise<void> {
  const total = usages.reduce(
    (acc, u) => ({ inputTokens: acc.inputTokens + u.inputTokens, outputTokens: acc.outputTokens + u.outputTokens, estimated: acc.estimated || u.estimated }),
    { inputTokens: 0, outputTokens: 0, estimated: false },
  );
  const { error } = await db().rpc('rs_settle_spend', {
    p_id: id,
    p_function: fn,
    p_input_tokens: Math.round(total.inputTokens),
    p_output_tokens: Math.round(total.outputTokens),
    p_cost: Number(estimateCostUsd(model, total).toFixed(6)),
  });
  if (error) console.error('settle spend failed', error.message);
}

/** Worst-case cost of a call: estimated input plus the full output budget. */
export function worstCaseCostUsd(model: string, inputChars: number, maxOutputTokens: number, calls = 1): number {
  return estimateCostUsd(model, { inputTokens: Math.ceil(inputChars / 3.6) * calls, outputTokens: maxOutputTokens * calls, estimated: true });
}

export async function logUsage(deviceId: string, fn: string, model: string, usage: Usage): Promise<number> {
  const cost = estimateCostUsd(model, usage);
  const { error } = await db()
    .from('usage_log')
    .insert({
      device_id: deviceId,
      function: fn,
      model,
      input_tokens: Math.round(usage.inputTokens),
      output_tokens: Math.round(usage.outputTokens),
      estimated_cost_usd: Number(cost.toFixed(6)),
    });
  if (error) console.error('usage_log insert failed', error.message);
  return cost;
}

export interface StoredTurn {
  role: 'detective' | 'suspect';
  text: string;
  shown_evidence_id?: string | null;
}

export interface ClaimedQuestion {
  ok: true;
  patienceUsedBefore: number;
  mood: string;
  shownEvidence: string[];
  revealedClues: string[];
  messages: StoredTurn[];
}

export type ClaimResult =
  | ClaimedQuestion
  | { ok: false; reason: 'patience_exhausted' | 'device_mismatch'; patienceUsed?: number; revealedClues?: string[] };

export async function claimQuestion(
  saveId: string,
  caseKey: string,
  suspectId: string,
  deviceId: string,
  patienceMax: number,
  parentSaveId: string | null = null,
): Promise<ClaimResult> {
  const { data, error } = await db().rpc('rs_claim_question', {
    p_save_id: saveId,
    p_case_key: caseKey,
    p_suspect_id: suspectId,
    p_device_id: deviceId,
    p_patience_max: patienceMax,
    p_parent_save_id: parentSaveId,
  });
  if (error) throw new Error(`claim rpc failed: ${error.message}`);
  const r = data as Record<string, unknown>;
  if (!r.ok) {
    return {
      ok: false,
      reason: r.reason as 'patience_exhausted' | 'device_mismatch',
      patienceUsed: Number(r.patience_used) || 0,
      revealedClues: Array.isArray(r.revealed_clues) ? (r.revealed_clues as string[]) : [],
    };
  }
  return {
    ok: true,
    patienceUsedBefore: Number(r.patience_used_before) || 0,
    mood: String(r.mood ?? 'calm'),
    shownEvidence: Array.isArray(r.shown_evidence) ? (r.shown_evidence as string[]) : [],
    revealedClues: Array.isArray(r.revealed_clues) ? (r.revealed_clues as string[]) : [],
    messages: Array.isArray(r.messages) ? (r.messages as StoredTurn[]) : [],
  };
}

export async function releaseQuestion(saveId: string, caseKey: string, suspectId: string): Promise<void> {
  const { error } = await db().rpc('rs_release_question', { p_save_id: saveId, p_case_key: caseKey, p_suspect_id: suspectId });
  if (error) console.error('release question failed', error.message);
}

export async function recordTurn(
  saveId: string,
  caseKey: string,
  suspectId: string,
  turns: StoredTurn[],
  shownEvidence: string | null,
  revealed: string[],
  mood: string,
): Promise<void> {
  const { error } = await db().rpc('rs_record_turn', {
    p_save_id: saveId,
    p_case_key: caseKey,
    p_suspect_id: suspectId,
    p_messages: turns,
    p_shown_evidence: shownEvidence,
    p_revealed: revealed,
    p_mood: mood,
  });
  if (error) console.error('record turn failed', error.message);
}

export async function loadGeneratedCase(id: string): Promise<unknown | null> {
  const { data, error } = await db().from('generated_cases').select('case_json, status').eq('id', id).maybeSingle();
  if (error || !data || data.status !== 'ready') return null;
  return data.case_json;
}
