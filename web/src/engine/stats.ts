// A detective's record over every save slot: what the account page shows.
//
// The three slots are the working copy of the account (merged with the cloud on sign-in), so
// adding them up gives the player's whole record. A case replayed in a slot replaces that slot's
// run, so the counts follow the runs that are on file; best scores come from the completions.
import { STORY_ORDER } from './caseLoader.ts';
import type { SaveSlotData } from './types.ts';

export type CaseStanding = 'solved' | 'closed' | 'open' | 'untouched';

export interface CaseRecord {
  id: string;
  standing: CaseStanding;
  bestScore: number | null;
  bestRank: string | null;
  bestTimeMs: number | null;
}

export interface PlayerStats {
  solved: number;
  storyTotal: number;
  playMs: number;
  suspectsQuestioned: number;
  questionsAsked: number;
  liesCaught: number;
  evidenceFound: number;
  hintsUsed: number;
  accusationsRight: number;
  accusationsWrong: number;
  bestScore: number | null;
  bestRank: string | null;
  fastestSolveMs: number | null;
  cases: CaseRecord[];
}

const RANK_ORDER = ['S', 'A', 'B', 'C', 'D'];
const better = (a: string, b: string | null) => b === null || RANK_ORDER.indexOf(a) < RANK_ORDER.indexOf(b);

export function playerStats(slots: readonly (SaveSlotData | null)[]): PlayerStats {
  const filled = slots.filter((s): s is SaveSlotData => s !== null);
  const stats: PlayerStats = {
    solved: 0,
    storyTotal: STORY_ORDER.length,
    playMs: 0,
    suspectsQuestioned: 0,
    questionsAsked: 0,
    liesCaught: 0,
    evidenceFound: 0,
    hintsUsed: 0,
    accusationsRight: 0,
    accusationsWrong: 0,
    bestScore: null,
    bestRank: null,
    fastestSolveMs: null,
    cases: [],
  };

  for (const slot of filled) {
    for (const run of Object.values(slot.progress)) {
      stats.playMs += run.playMs ?? 0;
      stats.evidenceFound += run.foundEvidence.length;
      stats.hintsUsed += run.hintsUsed + (run.boardReveals ?? 0);
      for (const talk of Object.values(run.conversations)) {
        const asked = talk.messages.filter((m) => m.role === 'detective').length;
        if (asked > 0) stats.suspectsQuestioned += 1;
        stats.questionsAsked += asked;
        stats.liesCaught += talk.caughtLies?.length ?? 0;
      }
      const outcome = run.accusation?.outcome;
      if (outcome === 'correct') stats.accusationsRight += 1;
      else if (outcome === 'wrong_culprit' || outcome === 'weak_proof') stats.accusationsWrong += 1;
    }
    for (const done of Object.values(slot.completions)) {
      if (stats.bestScore === null || done.bestScore > stats.bestScore) stats.bestScore = done.bestScore;
      if (better(done.bestRank, stats.bestRank)) stats.bestRank = done.bestRank;
      if (done.bestTimeMs != null && (stats.fastestSolveMs === null || done.bestTimeMs < stats.fastestSolveMs)) {
        stats.fastestSolveMs = done.bestTimeMs;
      }
    }
  }

  for (const id of STORY_ORDER) {
    const record: CaseRecord = { id, standing: 'untouched', bestScore: null, bestRank: null, bestTimeMs: null };
    for (const slot of filled) {
      const done = slot.completions[id];
      if (done) {
        if (done.solved) record.standing = 'solved';
        else if (record.standing !== 'solved') record.standing = 'closed';
        if (record.bestScore === null || done.bestScore > record.bestScore) record.bestScore = done.bestScore;
        if (better(done.bestRank, record.bestRank)) record.bestRank = done.bestRank;
        if (done.bestTimeMs != null && (record.bestTimeMs === null || done.bestTimeMs < record.bestTimeMs)) record.bestTimeMs = done.bestTimeMs;
      } else if (slot.progress[id] && record.standing === 'untouched') {
        record.standing = 'open';
      }
    }
    if (record.standing === 'solved') stats.solved += 1;
    stats.cases.push(record);
  }
  return stats;
}
