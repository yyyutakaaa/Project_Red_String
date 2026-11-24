// interrogate: one question to one suspect, answered in character and streamed over SSE.
//
// Request (POST JSON): { case_id, suspect_id, save_id, conversation, message,
//                        shown_evidence_id?, device_id, challenge_statement? }
// Response: text/event-stream with "delta" events ({ text }) and one "final" event:
//   { reply, revealed_clue_ids, mood, patience_used, patience_max, silent, evidence_effect, challenge }
// Errors before streaming starts are JSON: { error: { code, message } }.
//
// The system prompt is built from ONLY the suspect's own sheet plus public case facts (see
// _shared/core/suspectPrompt.ts). The server keeps the transcript, patience and shown evidence per save,
// so the client's "conversation" is accepted for compatibility but never trusted for the prompt.
import { z } from 'zod';
import { buildSuspectPrompt, buildUserTurn, MAX_PLAYER_MESSAGE_CHARS } from '../_shared/core/suspectPrompt.ts';
import { evidenceEffect, evidencePressure, resolveMood, resolveRevealedClues, normalizeMood, type ClueContext } from '../_shared/core/clues.ts';
import { limitWords, parseReplyMeta, sanitizeReply, spokenPart, streamableText, visibleLength } from '../_shared/core/replyParsing.ts';
import { DEFAULT_TEMPERAMENT, type Mood } from '../_shared/core/caseSchema.ts';
import { SseStream, clientIp, errorResponse, isUuid, json, originRejected, preflight, sha256Hex } from '../_shared/http.ts';
import { NETWORK_SHARE_USED, claimQuestion, hitRateLimit, logUsage, recordTurn, releaseQuestion, reserveSpend, settleSpend, worstCaseCostUsd, type StoredTurn } from '../_shared/db.ts';
import { chat, providerRejected, ProviderError, streamChat, type ChatMessage, type Usage } from '../_shared/omniakey.ts';
import { config } from '../_shared/env.ts';
import { resolveCase, seedStoryCase, storyCaseDiagnostics } from '../_shared/cases.ts';
import { judgeModel, judgeReply, resolveEval, type JudgeVerdict } from '../_shared/evalMode.ts';
import { MAX_STATEMENT_CHARS, judgeLie, lieCheckChars, sameStatement } from '../_shared/lieCheck.ts';

const MAX_OUTPUT_TOKENS = 320;
const PROVIDER_TIMEOUT_MS = 25_000;
// A suspect that thinks first (DeepSeek) spends part of max_tokens on reasoning before it speaks.
const THINKING_OUTPUT_TOKENS = 3_000;
const THINKING_TIMEOUT_MS = 50_000;
const HISTORY_TURNS = 12;
const LIMITS = { devicePerMinute: 30, devicePerDay: 400, ipPerMinute: 90, ipPerDay: 2000 };
const EVAL_LIMITS = { perMinute: 240, perDay: 5000 };

const Body = z.object({
  case_id: z.string().max(64),
  suspect_id: z.string().min(1).max(64),
  save_id: z.string().refine(isUuid, 'save_id must be a uuid'),
  conversation: z
    .array(z.object({ role: z.enum(['detective', 'suspect']), text: z.string().max(4000) }))
    .max(200)
    .optional(),
  message: z.string().max(4000),
  shown_evidence_id: z.string().max(64).nullable().optional(),
  device_id: z.string().refine(isUuid, 'device_id must be a uuid'),
  parent_save_id: z.string().refine(isUuid, 'parent_save_id must be a uuid').nullable().optional(),
  /** "Catch a lie": something this suspect said earlier, word for word, that the shown evidence is said to disprove. */
  challenge_statement: z.string().max(4000).nullable().optional(),
});

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('diag') !== '1') return json(req, { ok: true, service: 'interrogate' });
    return json(req, { ok: true, service: 'interrogate', suspect_model: config.suspectModel(), cases: await storyCaseDiagnostics() });
  }
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  // Maintenance: load a story case into the database (web/scripts/seed-cases.mjs). Needs a valid eval
  // token, and the content must match the hash compiled into this deployment.
  const seedId = new URL(req.url).searchParams.get('seed');
  if (seedId) {
    if (!(await resolveEval(req))) return errorResponse(req, 403, 'bad_request', 'Not allowed.');
    const result = await seedStoryCase(seedId, await req.text());
    return result.ok ? json(req, { ok: true, seeded: seedId }) : errorResponse(req, 400, 'bad_request', result.error ?? 'Seed failed.');
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') : 'Invalid JSON body.';
    return errorResponse(req, 400, 'bad_request', msg);
  }

  const message = body.message.trim().slice(0, MAX_PLAYER_MESSAGE_CHARS);
  const shownId = body.shown_evidence_id ?? null;
  if (!message && !shownId) return errorResponse(req, 400, 'bad_request', 'Ask a question or show evidence.');

  const resolved = await resolveCase(body.case_id);
  if (!resolved) return errorResponse(req, 404, 'not_found', 'Unknown case.');
  const { caseFile, caseKey } = resolved;
  const suspect = caseFile.suspects.find((s) => s.id === body.suspect_id);
  if (!suspect) return errorResponse(req, 404, 'not_found', 'Unknown suspect.');
  const shown = shownId ? caseFile.evidence.find((e) => e.id === shownId) ?? null : null;
  if (shownId && !shown) return errorResponse(req, 400, 'bad_request', 'Unknown evidence.');
  const statement = (body.challenge_statement ?? '').trim().slice(0, MAX_STATEMENT_CHARS);
  if (statement && !shown) return errorResponse(req, 400, 'bad_request', 'Show the evidence that proves the lie.');

  const evalCtx = await resolveEval(req);
  let networkKey: string | null = null;

  try {
    const rl = evalCtx
      ? await hitRateLimit(`eval:${evalCtx.label}`, EVAL_LIMITS.perMinute, EVAL_LIMITS.perDay, 'int')
      : await hitRateLimit(body.device_id, LIMITS.devicePerMinute, LIMITS.devicePerDay, 'int');
    if (!rl.allowed) {
      return errorResponse(req, 429, 'rate_limited', rl.scope === 'day' ? 'Daily question limit reached.' : 'Too many questions, slow down.', {
        'Retry-After': String(rl.retryAfterSeconds),
      });
    }
    if (!evalCtx) {
      const ipKey = `ip:${(await sha256Hex(clientIp(req))).slice(0, 32)}`;
      networkKey = ipKey;
      const ipRl = await hitRateLimit(ipKey, LIMITS.ipPerMinute, LIMITS.ipPerDay, 'int');
      if (!ipRl.allowed) {
        return errorResponse(req, 429, 'rate_limited', 'Too many questions from this network.', { 'Retry-After': String(ipRl.retryAfterSeconds) });
      }
    }
  } catch (err) {
    console.error('limit check failed', (err as Error).message);
    return errorResponse(req, 503, 'server_error', 'The precinct is not answering. Try again shortly.');
  }

  const patienceMax = suspect.patience;
  let claim;
  try {
    claim = await claimQuestion(
      body.save_id,
      caseKey,
      suspect.id,
      body.device_id,
      evalCtx ? 1_000_000 : patienceMax,
      body.parent_save_id && body.parent_save_id !== body.save_id ? body.parent_save_id : null,
    );
  } catch (err) {
    console.error('claim failed', (err as Error).message);
    return errorResponse(req, 503, 'server_error', 'The precinct is not answering. Try again shortly.');
  }
  if (!claim.ok) {
    if (claim.reason === 'device_mismatch') return errorResponse(req, 403, 'bad_request', 'This save belongs to another device.');
    return errorResponse(req, 409, 'patience_exhausted', `${suspect.name} will not answer any more questions.`, {}, {
      patience_used: claim.patienceUsed ?? patienceMax,
      patience_max: patienceMax,
      all_revealed_clue_ids: claim.revealedClues ?? [],
    });
  }

  const model = evalCtx?.model ?? config.suspectModel();
  const thinking = model.startsWith('deepseek-') && config.suspectThinking();
  const maxTokens = thinking ? THINKING_OUTPUT_TOKENS : MAX_OUTPUT_TOKENS;
  const spokenQuestion = message || (statement ? 'You told me this. This says otherwise.' : 'Take a look at this.');

  // A pinned statement must be something this suspect really said in this run.
  const challenging = Boolean(statement && shown);
  if (challenging && !claim.messages.some((t: StoredTurn) => t.role === 'suspect' && sameStatement(t.text, statement))) {
    await releaseQuestion(body.save_id, caseKey, suspect.id);
    return errorResponse(req, 400, 'bad_request', 'That statement is not in the record.');
  }

  // Reserve the worst case (the reply plus one metadata retry, and the lie check when one is asked for)
  // against the daily ceiling before calling a model, atomically, so concurrent requests cannot overshoot it.
  const historyTurns = claim.messages.slice(-HISTORY_TURNS * 2);
  const sheetChars = buildSuspectPrompt({
    caseFile,
    suspectId: suspect.id,
    ctx: { patienceUsedBefore: claim.patienceUsedBefore, shownEvidenceNow: shown?.id ?? null, shownEvidenceBefore: claim.shownEvidence, alreadyRevealed: claim.revealedClues },
    mood: 'calm',
    shownEvidence: shown,
  }).length;
  const roughInputChars = sheetChars + 1500 + historyTurns.reduce((n: number, t: StoredTurn) => n + t.text.length + 120, 0) + spokenQuestion.length + statement.length;
  const estimate =
    worstCaseCostUsd(model, roughInputChars, maxTokens, 2) +
    (challenging && shown ? worstCaseCostUsd(model, lieCheckChars(suspect, statement, shown), 60, 1) : 0);
  const reservation = await reserveSpend(body.device_id, 'interrogate', model, estimate, networkKey);
  if (reservation === null || reservation === NETWORK_SHARE_USED) {
    await releaseQuestion(body.save_id, caseKey, suspect.id);
    return reservation === null
      ? errorResponse(req, 503, 'spend_limit', 'The daily interrogation budget is used up. Try again tomorrow.')
      : errorResponse(req, 429, 'network_limit', 'This network has used its share of today\'s interrogation budget. Try again tomorrow.');
  }

  // "Catch a lie": the statement has to be one of this suspect's lies, and the evidence has to disprove it.
  const usages: Array<{ model: string; usage: Usage }> = [];
  let caughtLie: number | null = null;
  if (challenging && shown) {
    const verdict = await judgeLie(model, suspect, statement, shown);
    if (verdict.usage) usages.push({ model, usage: verdict.usage });
    caughtLie = verdict.lieIndex;
  }
  const caught = caughtLie !== null;

  // Evidence does not break a suspect on sight: each showing, and each question that keeps pushing
  // after it, is one confrontation, and their temperament says how many they get through. A caught
  // lie breaks them at once.
  const { pressure, pressing } = evidencePressure(claim.messages, shown?.id ?? null, caught);
  const ctx: ClueContext = {
    patienceUsedBefore: claim.patienceUsedBefore,
    shownEvidenceNow: shown?.id ?? null,
    shownEvidenceBefore: claim.shownEvidence,
    alreadyRevealed: claim.revealedClues,
    pressure,
    pressing,
    holdsOut: (suspect.temperament ?? DEFAULT_TEMPERAMENT).holds_out,
  };
  const prevMood: Mood = normalizeMood(claim.mood);
  const system = buildSuspectPrompt({
    caseFile,
    suspectId: suspect.id,
    ctx,
    mood: prevMood,
    shownEvidence: shown,
    challenge: challenging ? { statement, caught, truth: caughtLie !== null ? suspect.lies[caughtLie]?.truth : undefined } : null,
  });
  const history: ChatMessage[] = historyTurns.map((t: StoredTurn) =>
    t.role === 'detective'
      ? { role: 'user', content: buildUserTurn(t.text, t.shown_evidence_id ? caseFile.evidence.find((e) => e.id === t.shown_evidence_id) ?? null : null) }
      : { role: 'assistant', content: t.text },
  );
  const messages: ChatMessage[] = [{ role: 'system', content: system }, ...history, { role: 'user', content: buildUserTurn(spokenQuestion, shown) }];
  const clueIds = suspect.revealable_clues.map((c) => c.clue_id);
  const effect = evidenceEffect(suspect, ctx);
  const challengeResult = challenging ? (caught ? 'caught' : 'failed') : null;

  const sse = new SseStream();
  const run = async () => {
    const settle = async (fn: string) => {
      const own = usages.filter((u) => u.model === model).map((u) => u.usage);
      if (own.length) await settleSpend(reservation, fn, model, own);
      for (const u of usages.filter((x) => x.model !== model)) await logUsage(body.device_id, `${fn}-judge`, u.model, u.usage);
    };
    let full = '';
    let emitted = 0;
    let firstTokenMs: number | null = null;
    const started = performance.now();
    try {
      const result = await streamChat(
        { model, messages, maxTokens, thinking, temperature: 0.8, reasoningEffort: config.suspectReasoningEffort(), timeoutMs: thinking ? THINKING_TIMEOUT_MS : PROVIDER_TIMEOUT_MS },
        (piece) => {
          if (firstTokenMs === null) firstTokenMs = performance.now() - started;
          full += piece;
          // Stream cleaned text (no dashes as connectors); trailing spaces and dashes are held back so
          // what was already sent never changes.
          const clean = streamableText(full.slice(0, visibleLength(full)));
          if (clean.length > emitted) {
            sse.send('delta', { text: clean.slice(emitted) });
            emitted = clean.length;
          }
        },
      );
      usages.push({ model, usage: result.usage });

      let meta = parseReplyMeta(result.text);
      if (!meta) {
        // One retry on parse failure: ask for the metadata block only.
        try {
          const retry = await chat({
            model,
            messages: [
              ...messages,
              { role: 'assistant', content: result.text },
              { role: 'user', content: 'Output only the fenced JSON block for your last reply: {"revealed_clue_ids": [...], "mood": "..."}' },
            ],
            maxTokens: 80,
            temperature: 0,
            timeoutMs: 10_000,
          });
          usages.push({ model, usage: retry.usage });
          meta = parseReplyMeta(retry.text);
        } catch (err) {
          console.error('meta retry failed', (err as Error).message);
        }
      }

      let reply = limitWords(spokenPart(result.text), 95);
      const cleaned = sanitizeReply(reply, clueIds);
      reply = cleaned.text;
      const flagged = cleaned.suspicious || reply.length === 0;
      if (flagged) reply = pick(suspect.deflections);

      const revealed = flagged ? resolveRevealedClues(suspect, [], ctx) : resolveRevealedClues(suspect, meta?.revealed_clue_ids, ctx);
      const mood = resolveMood(suspect, meta?.mood, ctx, prevMood);

      if (sse.isClosed && !evalCtx) {
        // The player left before the reply arrived: give the question back and do not record the turn,
        // so the reply and its clues are not lost (the player can ask again).
        await releaseQuestion(body.save_id, caseKey, suspect.id);
        await settle('interrogate-abandoned');
        return;
      }

      await recordTurn(
        body.save_id,
        caseKey,
        suspect.id,
        [
          { role: 'detective', text: spokenQuestion, shown_evidence_id: shown?.id ?? null, ...(caught ? { caught: true } : {}) },
          { role: 'suspect', text: reply },
        ],
        shown?.id ?? null,
        revealed,
        mood,
      );

      let evalReport: { verdict: JudgeVerdict | null; first_token_ms: number | null; total_ms: number; model: string; flagged: boolean; raw: string } | null = null;
      if (evalCtx) {
        let verdict: JudgeVerdict | null = null;
        if (evalCtx.judge) {
          const j = await judgeReply(caseFile, suspect, spokenQuestion, reply);
          verdict = j.verdict;
          if (j.usage) usages.push({ model: judgeModel(), usage: j.usage });
        }
        evalReport = { verdict, first_token_ms: firstTokenMs, total_ms: performance.now() - started, model, flagged, raw: spokenPart(result.text) };
      }

      await settle(evalCtx ? 'interrogate-eval' : 'interrogate');

      sse.send('final', {
        reply,
        revealed_clue_ids: revealed,
        // Every clue revealed in this run, so a reply whose final event was lost in transit is recovered.
        all_revealed_clue_ids: [...new Set([...claim.revealedClues, ...revealed])],
        mood,
        patience_used: claim.patienceUsedBefore + 1,
        patience_max: patienceMax,
        silent: false,
        // What the evidence on the table did: nothing, they are holding out, or they gave way.
        evidence_effect: flagged ? null : effect,
        challenge: challengeResult,
        ...(evalReport ? { eval: evalReport } : {}),
      });
    } catch (err) {
      console.error('provider failure', (err as Error).message);
      await releaseQuestion(body.save_id, caseKey, suspect.id);
      // A call the provider accepted may have been billed: count its estimate. A rejected call cost nothing.
      if (err instanceof ProviderError && err.usage) usages.push({ model, usage: err.usage });
      if (usages.some((u) => u.model === model)) await settle('interrogate-failed');
      else if (providerRejected(err)) await settleSpend(reservation, 'interrogate-rejected', model, [{ inputTokens: 0, outputTokens: 0, estimated: false }]);
      sse.send('final', {
        reply: pick(suspect.deflections),
        revealed_clue_ids: [],
        all_revealed_clue_ids: claim.revealedClues,
        mood: prevMood,
        patience_used: claim.patienceUsedBefore,
        patience_max: patienceMax,
        silent: true,
        evidence_effect: null,
        challenge: null,
        ...(evalCtx ? { eval: { verdict: null, first_token_ms: firstTokenMs, total_ms: performance.now() - started, model, flagged: false, raw: '', error: (err as Error).message } } : {}),
      });
    } finally {
      sse.close();
    }
  };
  // Keep the function alive until the stream completes.
  const done = run();
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(done);
  return sse.response(req);
});
