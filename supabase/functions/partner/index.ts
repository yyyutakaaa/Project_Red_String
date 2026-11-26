// partner: one short remark from Sergeant Doyle, the detective's partner, about something the player
// just found out. The browser decides when he speaks and what about (web/src/engine/partner.ts); this
// function only puts it into words, in the player's language.
//
// Request (POST JSON): { case_id, device_id, language, kind, suspect_id?, speaker_id?, evidence_id?, clue_id?, said? }
// Response: { line } or { error: { code, message } }. The game has its own lines to fall back on.
//
// The prompt is built from the case on the server and holds only the one observation and the facts the
// player has already seen (see _shared/core/partnerPrompt.ts): never the solution or anyone's secrets.
import { z } from 'zod';
import { buildPartnerPrompt, cleanPartnerLine, PARTNER_KINDS } from '../_shared/core/partnerPrompt.ts';
import { PLAY_LANGUAGES, type PlayLanguage } from '../_shared/core/language.ts';
import { clientIp, errorResponse, isUuid, json, originRejected, preflight, sha256Hex } from '../_shared/http.ts';
import { NETWORK_SHARE_USED, hitRateLimit, reserveSpend, settleSpend, worstCaseCostUsd } from '../_shared/db.ts';
import { chat, providerRejected, ProviderError, type Usage } from '../_shared/omniakey.ts';
import { config } from '../_shared/env.ts';
import { resolveCase } from '../_shared/cases.ts';

const MAX_OUTPUT_TOKENS = 120;
const TIMEOUT_MS = 9_000;
const LIMITS = { devicePerMinute: 10, devicePerDay: 200, ipPerMinute: 40, ipPerDay: 1500 };

const Id = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/);
const Body = z.object({
  case_id: Id,
  device_id: z.string().refine(isUuid, 'device_id must be a uuid'),
  language: z.enum(Object.keys(PLAY_LANGUAGES) as [PlayLanguage, ...PlayLanguage[]]),
  kind: z.enum(PARTNER_KINDS),
  suspect_id: Id.nullable().optional(),
  speaker_id: Id.nullable().optional(),
  evidence_id: Id.nullable().optional(),
  clue_id: Id.nullable().optional(),
  said: z.string().max(600).nullable().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method === 'GET') return json(req, { ok: true, service: 'partner' });
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return errorResponse(req, 400, 'bad_request', 'Invalid request.');
  }

  const resolved = await resolveCase(body.case_id);
  if (!resolved) return errorResponse(req, 404, 'not_found', 'Unknown case.');
  const prompt = buildPartnerPrompt({
    caseFile: resolved.caseFile,
    kind: body.kind,
    language: body.language,
    suspectId: body.suspect_id,
    speakerId: body.speaker_id,
    evidenceId: body.evidence_id,
    clueId: body.clue_id,
    said: body.said?.replace(/\s+/g, ' ').trim().slice(0, 400) || null,
  });
  if (!prompt) return errorResponse(req, 400, 'bad_request', 'Nothing to remark on.');

  let networkKey: string | null = null;
  try {
    const rl = await hitRateLimit(body.device_id, LIMITS.devicePerMinute, LIMITS.devicePerDay, 'pt');
    if (!rl.allowed) return errorResponse(req, 429, 'rate_limited', 'Too many remarks.', { 'Retry-After': String(rl.retryAfterSeconds) });
    networkKey = `ip:${(await sha256Hex(clientIp(req))).slice(0, 32)}`;
    const ipRl = await hitRateLimit(networkKey, LIMITS.ipPerMinute, LIMITS.ipPerDay, 'pt');
    if (!ipRl.allowed) return errorResponse(req, 429, 'rate_limited', 'Too many remarks.', { 'Retry-After': String(ipRl.retryAfterSeconds) });
  } catch (err) {
    console.error('limit check failed', (err as Error).message);
    return errorResponse(req, 503, 'server_error', 'Not now.');
  }

  // The same model as the suspects, without thinking first: a remark has to come quickly.
  const model = config.suspectModel();
  const estimate = worstCaseCostUsd(model, prompt.system.length + prompt.user.length, MAX_OUTPUT_TOKENS);
  const reservation = await reserveSpend(body.device_id, 'partner', model, estimate, networkKey);
  if (reservation === null || reservation === NETWORK_SHARE_USED) return errorResponse(req, 503, 'spend_limit', 'Not now.');

  try {
    const result = await chat({
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      thinking: false,
      timeoutMs: TIMEOUT_MS,
    });
    await settleSpend(reservation, 'partner', model, [result.usage]);
    const line = cleanPartnerLine(result.text);
    if (!line) return errorResponse(req, 502, 'server_error', 'No remark.');
    return json(req, { line });
  } catch (err) {
    console.error('partner failed', (err as Error).message);
    // A call the provider accepted may have been billed: count it. A rejected call cost nothing. Otherwise
    // the reservation stays at its estimate, the safe side.
    const usage: Usage[] = err instanceof ProviderError && err.usage ? [err.usage] : [];
    if (usage.length) await settleSpend(reservation, 'partner-failed', model, usage);
    else if (providerRejected(err)) await settleSpend(reservation, 'partner-rejected', model, [{ inputTokens: 0, outputTokens: 0, estimated: false }]);
    return errorResponse(req, 502, 'server_error', 'No remark.');
  }
});
