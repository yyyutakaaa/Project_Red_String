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
      return ctx.shownEvidenceNow === cond.evidenceId || ctx.shownEvidenceBefore.includes(cond.evidenceId);
  }
}

/** Clues the suspect may reveal in the current reply. */
export function availableClues(suspect: Suspect, ctx: ClueContext): RevealableClue[] {
  return suspect.revealable_clues.filter((c) => isConditionMet(c.condition, ctx));
}

/**
 * Clues the suspect must reveal now: shown_evidence clues triggered by the evidence shown with this message.
 * This makes evidence-gated clues deterministic, so no exact question phrasing is ever required.
 */
export function forcedClues(suspect: Suspect, ctx: ClueContext): RevealableClue[] {
  if (!ctx.shownEvidenceNow) return [];
  return suspect.revealable_clues.filter((c) => {
    const cond = parseCondition(c.condition);
    return cond.kind === 'shown_evidence' && cond.evidenceId === ctx.shownEvidenceNow && !ctx.alreadyRevealed.includes(c.clue_id);
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

/** Mood after a reply: evidence in breaks_on always breaks the suspect. */
export function resolveMood(suspect: Suspect, proposed: unknown, ctx: ClueContext, previous: Mood = 'calm'): Mood {
  if (ctx.shownEvidenceNow && suspect.breaks_on.includes(ctx.shownEvidenceNow)) return 'broken';
  return normalizeMood(proposed, previous);
}
