// Clue gating rules. The model proposes which clues it revealed; the server keeps only the ones that
// belong to the suspect and whose condition is met. Shared with the web app so the rules are tested once.
import { MOODS, parseCondition, type Mood, type RevealableClue, type Suspect } from './caseSchema.ts';

/** Questions a player must ask a suspect before "pressed" clues unlock (unless evidence was shown). */
export const PRESS_THRESHOLD = 2;

export interface ClueContext {
  /** Questions already used with this suspect before the current one. */
  patienceUsedBefore: number;
  /** Evidence shown with the current message, if any. */
  shownEvidenceNow: string | null;
  /** Evidence shown to this suspect in earlier messages. */
  shownEvidenceBefore: readonly string[];
  /** Clues this suspect already revealed. */
  alreadyRevealed: readonly string[];
  /** Confrontations so far per piece of evidence, this message included (see evidencePressure). */
  pressure?: Readonly<Record<string, number>>;
  /** The evidence the detective is pressing right now: shown with this message, or still being pushed. */
  pressing?: string | null;
  /** Confrontations this suspect gets through before a piece of evidence breaks them (temperament). */
  holdsOut?: number;
}

/** Pressure a caught lie adds: more than any temperament holds out against. */
export const CAUGHT_PRESSURE = 100;

/**
 * How hard each piece of evidence has been put to a suspect. Showing it is one confrontation, and so is
 * every question after it, until other evidence goes on the table: the detective keeps pushing.
 * A turn in which the detective caught the suspect lying with that evidence breaks them at once.
 */
export function evidencePressure(
  turns: ReadonlyArray<{ role: string; shown_evidence_id?: string | null; caught?: boolean }>,
  shownNow: string | null,
  caughtNow = false,
): { pressure: Record<string, number>; pressing: string | null } {
  const pressure: Record<string, number> = {};
  let pressing: string | null = null;
  const push = (shown: string | null | undefined, caught: boolean | undefined) => {
    if (shown) pressing = shown;
    if (pressing) pressure[pressing] = (pressure[pressing] ?? 0) + (caught && shown ? CAUGHT_PRESSURE : 1);
  };
  for (const t of turns) if (t.role === 'detective') push(t.shown_evidence_id, t.caught);
  push(shownNow, caughtNow);
  return { pressure, pressing };
}

/** Has this evidence been pushed hard enough to break the suspect? Without pressure data, showing it is enough. */
export function cracked(evidenceId: string, ctx: ClueContext): boolean {
  return (ctx.pressure?.[evidenceId] ?? 1) > (ctx.holdsOut ?? 0);
}

/** Does this evidence touch the suspect at all: it breaks them, or one of their clues waits on it. */
export function evidenceMatters(suspect: Suspect, evidenceId: string): boolean {
  return suspect.breaks_on.includes(evidenceId) || suspect.revealable_clues.some((c) => {
    const cond = parseCondition(c.condition);
    return cond.kind === 'shown_evidence' && cond.evidenceId === evidenceId;
  });
}

/** Evidence the detective is pressing that the suspect is still holding out against, or null. */
export function holdingOut(suspect: Suspect, ctx: ClueContext): { evidenceId: string; confrontation: number } | null {
  const e = ctx.pressing ?? ctx.shownEvidenceNow;
  if (!e || cracked(e, ctx)) return null;
  const guards = suspect.breaks_on.includes(e) || suspect.revealable_clues.some((c) => {
    const cond = parseCondition(c.condition);
    return cond.kind === 'shown_evidence' && cond.evidenceId === e && !ctx.alreadyRevealed.includes(c.clue_id);
  });
  return guards ? { evidenceId: e, confrontation: ctx.pressure?.[e] ?? 1 } : null;
}

export type EvidenceEffect = 'none' | 'holding' | 'gave';

/**
 * What the evidence on the table does to this suspect, for the player's notes: nothing (it does not
 * touch them), they are holding out against it, or it has made them give way.
 */
export function evidenceEffect(suspect: Suspect, ctx: ClueContext): EvidenceEffect | null {
  const e = ctx.pressing ?? ctx.shownEvidenceNow;
  if (!e) return null;
  if (!evidenceMatters(suspect, e)) return 'none';
  return cracked(e, ctx) ? 'gave' : 'holding';
}

export function isConditionMet(condition: string, ctx: ClueContext): boolean {
  const cond = parseCondition(condition);
  switch (cond.kind) {
    case 'free':
      return true;
    case 'pressed':
      return (
        ctx.patienceUsedBefore >= PRESS_THRESHOLD || ctx.shownEvidenceNow !== null || ctx.shownEvidenceBefore.length > 0
      );
    case 'shown_evidence':
      return (ctx.shownEvidenceNow === cond.evidenceId || ctx.shownEvidenceBefore.includes(cond.evidenceId)) && cracked(cond.evidenceId, ctx);
  }
}

/** Clues the suspect may reveal in the current reply. */
export function availableClues(suspect: Suspect, ctx: ClueContext): RevealableClue[] {
  return suspect.revealable_clues.filter((c) => isConditionMet(c.condition, ctx));
}

/**
 * Clues the suspect must reveal now: shown_evidence clues for the evidence being pressed, once it has
 * been pressed hard enough to break them. Deterministic, so no exact question phrasing is ever required.
 */
export function forcedClues(suspect: Suspect, ctx: ClueContext): RevealableClue[] {
  const e = ctx.pressing ?? ctx.shownEvidenceNow;
  if (!e || !cracked(e, ctx)) return [];
  return suspect.revealable_clues.filter((c) => {
    const cond = parseCondition(c.condition);
    return cond.kind === 'shown_evidence' && cond.evidenceId === e && isConditionMet(c.condition, ctx) && !ctx.alreadyRevealed.includes(c.clue_id);
  });
}

/** Keep only clue ids that exist on this suspect and whose condition is met. Deduplicates, keeps order. */
export function filterRevealedClues(suspect: Suspect, proposed: unknown, ctx: ClueContext): string[] {
  if (!Array.isArray(proposed)) return [];
  const byId = new Map(suspect.revealable_clues.map((c) => [c.clue_id, c]));
  const out: string[] = [];
  for (const raw of proposed) {
    if (typeof raw !== 'string') continue;
    const clue = byId.get(raw);
    if (!clue) continue;
    if (!isConditionMet(clue.condition, ctx)) continue;
    if (!out.includes(raw)) out.push(raw);
  }
  return out;
}

/** Final clue list for a reply: filtered model proposals plus forced clues, minus already revealed. */
export function resolveRevealedClues(suspect: Suspect, proposed: unknown, ctx: ClueContext): string[] {
  const ids = filterRevealedClues(suspect, proposed, ctx);
  for (const c of forcedClues(suspect, ctx)) if (!ids.includes(c.clue_id)) ids.push(c.clue_id);
  return ids.filter((id) => !ctx.alreadyRevealed.includes(id));
}

export function normalizeMood(raw: unknown, fallback: Mood = 'calm'): Mood {
  return typeof raw === 'string' && (MOODS as readonly string[]).includes(raw) ? (raw as Mood) : fallback;
}

/** Mood after a reply: evidence in breaks_on breaks the suspect once it has been pressed hard enough. */
export function resolveMood(suspect: Suspect, proposed: unknown, ctx: ClueContext, previous: Mood = 'calm'): Mood {
  const e = ctx.pressing ?? ctx.shownEvidenceNow;
  if (e && suspect.breaks_on.includes(e) && cracked(e, ctx)) return 'broken';
  return normalizeMood(proposed, previous);
}
