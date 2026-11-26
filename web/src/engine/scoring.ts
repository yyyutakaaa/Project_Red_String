import type { CaseFile } from '@shared/caseSchema.ts';
import type { AccusationOutcome, CaseProgress } from './types.ts';
import { t } from '../i18n/index.ts';

export const HINT_COST = 75;
export const MIN_ACCUSATION_EVIDENCE = 2;
export const MAX_ACCUSATION_EVIDENCE = 4;

export interface AccusationVerdict {
  outcome: AccusationOutcome;
  missingEvidence: string[];
  irrelevantEvidence: string[];
}

export function evaluateAccusation(c: CaseFile, culpritId: string, evidenceIds: readonly string[]): AccusationVerdict {
  const chosen = new Set(evidenceIds);
  const required = c.solution.required_evidence;
  const missingEvidence = required.filter((id) => !chosen.has(id));
  const irrelevantEvidence = [...chosen].filter((id) => !required.includes(id));
  if (culpritId !== c.solution.culprit_id) return { outcome: 'wrong_culprit', missingEvidence, irrelevantEvidence };
  if (missingEvidence.length > 0) return { outcome: 'weak_proof', missingEvidence, irrelevantEvidence };
  return { outcome: 'correct', missingEvidence, irrelevantEvidence };
}

export function accusationSelectionError(culpritId: string | null, evidenceIds: readonly string[]): string | null {
  if (!culpritId) return t('accuse.errChoose');
  if (evidenceIds.length < MIN_ACCUSATION_EVIDENCE) return t('accuse.errMin', { n: MIN_ACCUSATION_EVIDENCE });
  if (evidenceIds.length > MAX_ACCUSATION_EVIDENCE) return t('accuse.errMax', { n: MAX_ACCUSATION_EVIDENCE });
  return null;
}

/** Everything a player can discover: evidence items plus revealable clues. */
export function totalDiscoverables(c: CaseFile): number {
  return c.evidence.length + c.suspects.reduce((n, s) => n + s.revealable_clues.length, 0);
}

export function totalPatience(c: CaseFile): number {
  return c.suspects.reduce((n, s) => n + s.patience, 0);
}

export function questionsUsed(p: Pick<CaseProgress, 'conversations'>): number {
  return Object.values(p.conversations).reduce((n, conv) => n + conv.patienceUsed, 0);
}

export function discoveredCount(p: Pick<CaseProgress, 'foundEvidence' | 'revealedClues'>): number {
  return new Set(p.foundEvidence).size + new Set(p.revealedClues).size;
}

export interface ScoreInput {
  outcome: AccusationOutcome;
  discovered: number;
  discoverable: number;
  questionsUsed: number;
  questionBudget: number;
  hintsUsed: number;
}

export interface ScoreBreakdown {
  base: number;
  thoroughness: number;
  efficiency: number;
  hintPenalty: number;
  total: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

const BASE: Record<AccusationOutcome, number> = { correct: 1000, weak_proof: 450, wrong_culprit: 100, gave_up: 0 };

export function computeScore(input: ScoreInput): ScoreBreakdown {
  // Giving up scores nothing: the solution was read, not found.
  if (input.outcome === 'gave_up') return { base: 0, thoroughness: 0, efficiency: 0, hintPenalty: 0, total: 0, rank: 'D' };
  const base = BASE[input.outcome];
  const ratio = input.discoverable > 0 ? Math.min(1, input.discovered / input.discoverable) : 0;
  const thoroughness = Math.round(300 * ratio);
  const usedRatio = input.questionBudget > 0 ? Math.min(1, input.questionsUsed / input.questionBudget) : 1;
  // Efficiency only rewards a correct solve; guessing early should not score well.
  const efficiency = input.outcome === 'correct' ? Math.round(300 * (1 - usedRatio)) : 0;
  const hintPenalty = input.hintsUsed * HINT_COST;
  const total = Math.max(0, base + thoroughness + efficiency - hintPenalty);
  const rank = total >= 1450 ? 'S' : total >= 1200 ? 'A' : total >= 950 ? 'B' : total >= 500 ? 'C' : 'D';
  return { base, thoroughness, efficiency, hintPenalty, total, rank };
}

export function scoreProgress(c: CaseFile, p: CaseProgress, outcome: AccusationOutcome): ScoreBreakdown {
  return computeScore({
    outcome,
    discovered: discoveredCount(p),
    discoverable: totalDiscoverables(c),
    questionsUsed: questionsUsed(p),
    questionBudget: totalPatience(c),
    // Having the board marked costs the same as a hint.
    hintsUsed: p.hintsUsed + (p.boardReveals ?? 0),
  });
}
