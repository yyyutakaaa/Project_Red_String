import type { Mood } from '@shared/caseSchema.ts';
import type { EvidenceEffect } from '@shared/clues.ts';

export type CaseSource = 'story' | 'generated';

export interface ChatMessage {
  id: string;
  role: 'detective' | 'suspect' | 'system';
  text: string;
  at: number;
  shownEvidenceId?: string | null;
  revealedClueIds?: string[];
  /** Set when the suspect fell silent because the backend failed. */
  silent?: boolean;
  /** On a question: the earlier statement the detective called a lie. */
  pinnedStatement?: string;
  /** On a reply: what the evidence on the table did to the suspect, and which evidence that was. */
  evidenceEffect?: EvidenceEffect | null;
  effectEvidenceId?: string | null;
  /** On a reply: how calling the lie went. */
  challenge?: 'caught' | 'failed' | null;
}

/** A lie the detective caught: what was said and the evidence that disproved it. */
export interface CaughtLie {
  statement: string;
  evidenceId: string;
  at: number;
}

export interface ConversationState {
  messages: ChatMessage[];
  patienceUsed: number;
  patienceMax: number;
  mood: Mood;
  shownEvidence: string[];
  /** Per piece of evidence shown: what it did to this suspect, last time it was on the table. */
  evidenceEffects?: Record<string, EvidenceEffect>;
  /** Lies this suspect was caught in. */
  caughtLies?: CaughtLie[];
}

export type PinKind = 'suspect' | 'evidence';

export interface BoardPin {
  id: string;
  kind: PinKind;
  x: number;
  y: number;
}

export type LinkStatus = 'supported' | 'unsupported' | 'neutral' | null;

export interface BoardLink {
  id: string;
  from: string;
  to: string;
  status: LinkStatus;
}

export interface BoardState {
  pins: BoardPin[];
  links: BoardLink[];
  lastCheckedAt: number | null;
  /** Free checks used in this run (they only give totals). */
  checksUsed?: number;
  /** The totals of the last check. */
  lastCheck?: TheoryCount | null;
}

export interface TheoryCount {
  total: number;
  supported: number;
  unsupported: number;
  neutral: number;
}

/** gave_up: the player closed the case without naming anyone, to read the solution. */
export type AccusationOutcome = 'correct' | 'wrong_culprit' | 'weak_proof' | 'gave_up';

export interface ScoreSnapshot {
  base: number;
  thoroughness: number;
  efficiency: number;
  hintPenalty: number;
  discovered: number;
  discoverable: number;
  questionsUsed: number;
  questionBudget: number;
  hintsUsed: number;
}

export interface AccusationRecord {
  culpritId: string;
  evidenceIds: string[];
  outcome: AccusationOutcome;
  score: number;
  rank: string;
  at: number;
  /** Time spent on the case when the accusation was made, in ms (missing in older saves). */
  timeMs?: number;
  /** Score breakdown frozen at the moment of the accusation (missing in older saves). */
  breakdown?: ScoreSnapshot;
}

export interface CaseProgress {
  /** Unique per attempt; sent to the backend as save_id so patience is tracked per run. */
  runId: string;
  /**
   * Set when this run was copied from another slot ("save to slot N"). The server copies that run's
   * interrogation state (patience, clues, transcript) the first time this run questions each suspect.
   */
  parentRunId?: string | null;
  caseKey: string;
  source: CaseSource;
  startedAt: number;
  updatedAt: number;
  briefingSeen: boolean;
  /** The comic strip before the briefing was played (or skipped) in this run. */
  cutsceneSeen?: boolean;
  visitedRooms: string[];
  examinedHotspots: string[];
  foundEvidence: string[];
  revealedClues: string[];
  conversations: Record<string, ConversationState>;
  board: BoardState;
  hintsUsed: number;
  /** Times the weak strings on the board were marked; each costs as much as a hint. */
  boardReveals?: number;
  notes: string;
  accusation: AccusationRecord | null;
  /** Time actually spent on this run, in ms: a case screen open, the window in view, the player not idle. */
  playMs?: number;
}

export interface CompletionRecord {
  bestScore: number;
  bestRank: string;
  lastOutcome: AccusationOutcome;
  solved: boolean;
  completedAt: number;
  /** Fastest time in which the case was solved correctly, in ms. */
  bestTimeMs?: number;
}

export interface SaveSlotData {
  version: 1;
  slot: number;
  createdAt: number;
  updatedAt: number;
  activeCaseKey: string | null;
  progress: Record<string, CaseProgress>;
  completions: Record<string, CompletionRecord>;
}
