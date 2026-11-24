// Single source of truth for the case data format.
// Used by the web app (via the @shared alias), both edge functions (Deno) and the case generator.
// Keep this file free of runtime-specific APIs so it runs unchanged in Node, Vite and Deno.
import { z } from 'zod';

export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const Id = z.string().regex(ID_PATTERN, 'ids use lowercase letters, digits, "-" or "_"');

export const MOODS = ['calm', 'nervous', 'angry', 'broken'] as const;
export const Mood = z.enum(MOODS);
export type Mood = z.infer<typeof Mood>;

/** free | pressed | shown_evidence:<evidence id> */
export const ClueConditionString = z
  .string()
  .regex(/^(free|pressed|shown_evidence:[a-z0-9][a-z0-9_-]{0,63})$/, 'condition must be free, pressed or shown_evidence:<id>');

export const Hotspot = z.strictObject({
  id: Id,
  label: z.string().min(1).max(60),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  description: z.string().min(1),
  evidence_id: Id.nullable(),
});
export type Hotspot = z.infer<typeof Hotspot>;

export const Room = z.strictObject({
  id: Id,
  name: z.string().min(1),
  description: z.string().min(1),
  background: z.string().min(1),
  hotspots: z.array(Hotspot).min(1),
});
export type Room = z.infer<typeof Room>;

export const Evidence = z.strictObject({
  id: Id,
  name: z.string().min(1),
  description: z.string().min(1),
  /** Room id or suspect id. Suspect-held evidence is granted by one of that suspect's revealable clues. */
  found_in: Id,
  points_to: z.array(Id),
  is_red_herring: z.boolean(),
});
export type Evidence = z.infer<typeof Evidence>;

export const Lie = z.strictObject({
  topic: z.string().min(1),
  claim: z.string().min(1),
  truth: z.string().min(1),
});
export type Lie = z.infer<typeof Lie>;

export const RevealableClue = z.strictObject({
  clue_id: Id,
  text: z.string().min(1),
  condition: ClueConditionString,
  /** When set, revealing this clue hands the player this evidence item. */
  evidence_id: Id.nullable().optional(),
});
export type RevealableClue = z.infer<typeof RevealableClue>;

export const AlibiVerification = z.strictObject({
  status: z.enum(['confirmed', 'broken']),
  /** Evidence that confirms or breaks the alibi. */
  evidence_ids: z.array(Id),
  /** Revealable clue ids (usually another suspect's testimony) that confirm or break the alibi. */
  clue_ids: z.array(Id),
  note: z.string().min(1),
});
export type AlibiVerification = z.infer<typeof AlibiVerification>;

/**
 * How a suspect stands up to evidence. holds_out: how many confrontations with a piece of evidence
 * they get through before it breaks them (each showing of it, and each question that keeps pressing
 * after it, is one). under_pressure: how they sound while they hold out.
 */
export const PRESSURE_STYLES = ['hostile', 'fearful', 'cold', 'charming'] as const;
export const Temperament = z.strictObject({
  holds_out: z.number().int().min(0).max(4),
  under_pressure: z.enum(PRESSURE_STYLES),
});
export type Temperament = z.infer<typeof Temperament>;
export const DEFAULT_TEMPERAMENT: Temperament = { holds_out: 1, under_pressure: 'cold' };

export const Suspect = z.strictObject({
  id: Id,
  name: z.string().min(1),
  role: z.string().min(1),
  age: z.number().int().min(10).max(110),
  portrait: z.string().min(1),
  /** Hex colour used by the placeholder silhouette portrait. */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  personality: z.string().min(1),
  speech_style: z.string().min(1),
  alibi: z.string().min(1),
  public_facts: z.array(z.string().min(1)).min(1),
  private_knowledge: z.array(z.string().min(1)),
  lies: z.array(Lie),
  secrets: z.array(z.string().min(1)),
  never_reveal: z.array(z.string().min(1)),
  revealable_clues: z.array(RevealableClue),
  breaks_on: z.array(Id),
  patience: z.number().int().min(4).max(40),
  temperament: Temperament.optional(),
  /** Canned in-character lines used when the AI provider is unavailable. */
  deflections: z.array(z.string().min(1)).min(1),
  /** Not sent to the model: how the case proves or disproves the alibi. */
  alibi_verification: AlibiVerification,
});
export type Suspect = z.infer<typeof Suspect>;

export const TimelineEvent = z.strictObject({
  day: z.number().int().min(0).max(30).default(0),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:MM'),
  location: Id,
  who: z.array(Id).min(1),
  what: z.string().min(1),
  /**
   * public: common knowledge, every suspect may know it.
   * private: known only to the people listed in `who`.
   * hidden: ground truth nobody will volunteer (the crime itself). Never sent to any model.
   */
  visibility: z.enum(['public', 'private', 'hidden']),
  tags: z.array(z.string()).default([]),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

export const Victim = z.strictObject({
  id: Id,
  name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  description: z.string().min(1),
  cause_of_death: z.string().min(1),
  found_in: Id,
  found_at: z.string().min(1),
});
export type Victim = z.infer<typeof Victim>;

export const Solution = z.strictObject({
  culprit_id: Id,
  motive: z.string().min(1),
  method: z.string().min(1),
  required_evidence: z.array(Id).min(2).max(4),
  /** The full explanation shown on the ending screen. */
  reveal: z.string().min(1),
});
export type Solution = z.infer<typeof Solution>;

export const OffstageLocation = z.strictObject({
  id: Id,
  name: z.string().min(1),
});

export const Endings = z.strictObject({
  correct: z.string().min(1),
  wrong_culprit: z.string().min(1),
  weak_proof: z.string().min(1),
});

export const CaseFile = z.strictObject({
  schema_version: z.literal(1),
  id: Id,
  title: z.string().min(1),
  tagline: z.string().min(1),
  setting: z.string().min(1),
  era: z.string().min(1),
  intro_briefing: z.array(z.string().min(1)).min(1),
  victim: Victim,
  solution: Solution,
  timeline: z.array(TimelineEvent).min(3),
  offstage_locations: z.array(OffstageLocation).default([]),
  rooms: z.array(Room).min(1),
  evidence: z.array(Evidence).min(3),
  suspects: z.array(Suspect).min(2).max(8),
  hints: z.array(z.string().min(1)).min(1),
  endings: Endings,
});
export type CaseFile = z.infer<typeof CaseFile>;
/** Input shape (before defaults are applied), e.g. raw JSON. */
export type CaseFileInput = z.input<typeof CaseFile>;

export type ClueCondition =
  | { kind: 'free' }
  | { kind: 'pressed' }
  | { kind: 'shown_evidence'; evidenceId: string };

export function parseCondition(condition: string): ClueCondition {
  if (condition === 'free') return { kind: 'free' };
  if (condition === 'pressed') return { kind: 'pressed' };
  const evidenceId = condition.startsWith('shown_evidence:') ? condition.slice('shown_evidence:'.length) : '';
  return { kind: 'shown_evidence', evidenceId };
}

/** Fields of a suspect that may be placed into that suspect's own prompt. */
export type SuspectSheet = Omit<Suspect, 'alibi_verification' | 'deflections'>;

/** The subset of a case the browser needs to render and score a case is the whole case (it is a local game),
 * but prompt construction only ever uses this narrowed view. */
export interface PublicCaseFacts {
  title: string;
  setting: string;
  era: string;
  victim: { name: string; age: number; description: string; cause_of_death: string; found_at: string };
  publicTimeline: Array<{ time: string; location: string; what: string }>;
  people: Array<{ name: string; role: string; public_facts: string[] }>;
}
