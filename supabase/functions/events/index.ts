// events: anonymous play statistics from the game (web/src/lib/telemetry.ts).
//
// Request (POST JSON):
//   { device_id, session_id, app: { version, platform },
//     events: [{ name, at, seq, case?, props? }, ...] }   (1 to 50 events)
// Response: 204, or { error: { code, message } }
//   codes: bad_request, rate_limited, server_error
//
// Events say what a player did (opened a room, found evidence, asked a question and what it revealed,
// accused someone) with the random device id the game already uses for interrogations. They never
// carry typed text, names or account details: the schema below only admits short values.
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { clientIp, corsHeaders, errorResponse, isUuid, originRejected, preflight, sha256Hex } from '../_shared/http.ts';
import { config } from '../_shared/env.ts';

const EVENT_NAMES = [
  'app_open',
  'session_end',
  'case_start',
  'case_restart',
  'briefing_done',
  'screen',
  'room_open',
  'evidence_found',
  'question',
  'clue_revealed',
  'interrogation_error',
  'hint_used',
  'theory_checked',
  'accusation',
] as const;

const DEVICE_LIMITS = { perMinute: 20, perDay: 1500 };
const IP_LIMITS = { perMinute: 60, perDay: 6000 };
/** A client clock further off than this is not trusted: the row keeps only the server time. */
const MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

const Value = z.union([z.string().max(80), z.number(), z.boolean(), z.null()]);
const Props = z
  .record(z.string().regex(/^[a-z_]{1,24}$/), Value)
  .refine((p) => Object.keys(p).length <= 12, 'too many props');

const Event = z.object({
  name: z.enum(EVENT_NAMES),
  at: z.number(),
  seq: z.number().int().min(0).max(10_000_000),
  case: z.string().regex(/^[a-z0-9-]{1,64}$/).optional(),
  props: Props.optional(),
});

const Id = z.string().refine(isUuid, 'not a uuid');

const Body = z.object({
  device_id: Id,
  session_id: Id,
  app: z.object({ version: z.string().max(40), platform: z.string().max(20) }),
  events: z.array(Event).min(1).max(50),
});

// Service-role client. Kept local (not _shared/db.ts) so this function deploys with few files.
const admin = createClient(config.supabaseUrl(), config.serviceRoleKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function allowed(key: string, limits: { perMinute: number; perDay: number }): Promise<boolean> {
  const iso = new Date().toISOString();
  const { data, error } = await admin.rpc('rs_hit_rate_limit', {
    p_key: key,
    p_minute_window: `ev:m:${iso.slice(0, 16)}`,
    p_day_window: `ev:d:${iso.slice(0, 10)}`,
    p_minute_limit: limits.perMinute,
    p_day_limit: limits.perDay,
  });
  if (error) throw new Error(`rate limit rpc failed: ${error.message}`);
  return (data as { allowed: boolean }).allowed;
}

function noContent(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return errorResponse(req, 400, 'bad_request', 'Malformed events.');
  }

  try {
    const ipKey = `ip:${await sha256Hex(clientIp(req))}`;
    if (!(await allowed(ipKey, IP_LIMITS)) || !(await allowed(`dev:${body.device_id}`, DEVICE_LIMITS))) {
      return errorResponse(req, 429, 'rate_limited', 'Too many events.', { 'Retry-After': '60' });
    }

    const now = Date.now();
    const rows = body.events.map((e) => ({
      client_at: Math.abs(e.at - now) <= MAX_CLOCK_SKEW_MS ? new Date(e.at).toISOString() : null,
      device_id: body.device_id,
      session_id: body.session_id,
      seq: e.seq,
      name: e.name,
      case_key: e.case ?? null,
      props: e.props ?? {},
      app_version: body.app.version || null,
      platform: body.app.platform || null,
    }));
    const { error } = await admin.from('play_events').insert(rows);
    if (error) {
      console.error('play_events insert failed', error.message);
      return errorResponse(req, 500, 'server_error', 'Could not store events.');
    }
    return noContent(req);
  } catch (err) {
    console.error('events error', err);
    return errorResponse(req, 500, 'server_error', 'Could not store events.');
  }
});
