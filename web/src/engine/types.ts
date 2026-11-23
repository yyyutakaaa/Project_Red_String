import type { Mood } from '@shared/caseSchema.ts';

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
}

export interface ConversationState {
  messages: ChatMessage[];
  patienceUsed: number;
  patienceMax: number;
  mood: Mood;
  shownEvidence: string[];
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
}

export type AccusationOutcome = 'correct' | 'wrong_culprit' | 'weak_proof';

export interface AccusationRecord {
  culpritId: string;
  evidenceIds: string[];
  outcome: AccusationOutcome;
  score: number;
  rank: string;
  at: number;
}

export interface CaseProgress {
  /** Unique per attempt; sent to the backend as save_id so patience is tracked per run. */
  runId: string;
  caseKey: string;
  source: CaseSource;
  startedAt: number;
  updatedAt: number;
  briefingSeen: boolean;
  visitedRooms: string[];
  examinedHotspots: string[];
  foundEvidence: string[];
  revealedClues: string[];
  conversations: Record<string, ConversationState>;
  board: BoardState;
  hintsUsed: number;
  notes: string;
  accusation: AccusationRecord | null;
}

export interface CompletionRecord {
  bestScore: number;
  bestRank: string;
  lastOutcome: AccusationOutcome;
  solved: boolean;
  completedAt: number;
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
