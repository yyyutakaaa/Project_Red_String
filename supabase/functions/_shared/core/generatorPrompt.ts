// Prompt for the case generator. Built from the same schema and validator rules the game uses,
// so a generated case can be checked with validateCase() before anyone plays it.
import { z } from 'zod';
import { CaseFile } from './caseSchema.ts';
import { BACKGROUND_KEYS, PORTRAIT_KEYS } from './assetKeys.ts';

export interface GeneratorPreferences {
  setting?: string;
  era?: string;
  difficulty?: 'gentle' | 'standard' | 'hard';
}

let cachedSchema: string | null = null;
export function caseJsonSchema(): string {
  if (!cachedSchema) {
    const schema = z.toJSONSchema(CaseFile, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
    delete schema.$schema;
    cachedSchema = JSON.stringify(schema);
  }
  return cachedSchema;
}

export const VALIDATOR_RULES = [
  'Every id reference must resolve: hotspot evidence_id, evidence found_in (a room id or a suspect id), points_to (suspect ids), breaks_on (evidence ids), shown_evidence:<id> conditions, clue evidence_id, timeline who (suspect ids or the victim id) and location (room ids or offstage_locations ids), victim.found_in (a room id), alibi_verification evidence_ids and clue_ids.',
  'All ids are lowercase with digits, "-" or "_", and unique across the victim, rooms, offstage locations, suspects, evidence and clues.',
  'Evidence found in a room must be held by exactly the hotspot in that room whose evidence_id names it. Evidence held by a suspect (found_in = suspect id) must be granted by one of that suspect\'s revealable_clues via evidence_id.',
  'solution.culprit_id must be a suspect. solution.required_evidence lists 2 to 4 evidence ids that together prove guilt; each must be obtainable from a hotspot or from a reachable clue; none may be a red herring; at least one must point_to the culprit.',
  'For fairness, every required evidence item must come from a hotspot or from a clue with condition shown_evidence:<id> (never from free or pressed clues).',
  'At least one innocent suspect must have a lie or evidence pointing to them, so the answer is not obvious. At least one evidence item must be a red herring (is_red_herring true, pointing to an innocent).',
  'The timeline is in chronological order and includes at least one event tagged "crime" with visibility "hidden" whose who includes the culprit (opportunity).',
  'Every suspect has alibi_verification with status confirmed or broken and at least one obtainable evidence id or clue id. The culprit\'s alibi must be "broken" by at least one obtainable evidence id. An alibi cannot be confirmed only by the suspect\'s own clue.',
  'No suspect field may contain the exact text of solution.motive, solution.method or solution.reveal; write the culprit\'s guilty knowledge in different words inside lies[].truth and never_reveal.',
  'Hotspot rectangles are percentages: x + width <= 100 and y + height <= 100, no two hotspots in a room overlap.',
  'Every revealable clue must be reachable (a shown_evidence clue needs obtainable evidence).',
];

/** Prose rules for every player-visible string and every suspect sheet, so the text reads as written by a person. */
export const WRITING_STYLE = [
  'Writing style, for every string in the case: write like a working crime novelist, concrete and plain.',
  '- No em dashes or en dashes anywhere; use commas, full stops or colons. Straight quotes only.',
  '- No "not X but Y" or "it was not just X, it was Y" contrasts. State the point.',
  '- No groups of three for rhythm, no aphorisms, no one-line paragraph that restates the one before it.',
  '- Do not explain what a detail means after showing it. Describe what the detective sees and stop.',
  '- Avoid these words: quietly, testament, tapestry, pivotal, crucial, vibrant, intricate, landscape (figurative), delve, underscore, showcase.',
  '- Vary sentence length. Prefer "is" and "has" to "serves as" and "boasts". Each sentence must add a fact.',
  '- Give each suspect a distinct way of talking in speech_style and deflections, with ordinary spoken rhythm.',
].join('\n');

export function buildGeneratorSystemPrompt(): string {
  return [
    'You are an expert mystery designer writing a complete, fair, self-contained murder case for "Project Red String", a noir detective game. The player examines clickable rooms, interrogates AI-played suspects by typing freely, connects evidence on a board and accuses a culprit with 2 to 4 pieces of evidence.',
    'Output ONLY one fenced ```json block containing a single case object that matches this JSON Schema exactly (strict: no extra keys, schema_version 1):',
    caseJsonSchema(),
    'The case is rejected unless all of these validator rules hold:',
    VALIDATOR_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n'),
    `Allowed room background keys: ${BACKGROUND_KEYS.join(', ')}.`,
    `Allowed portrait keys: ${PORTRAIT_KEYS.join(', ')}. Suspect color is a dark-to-mid hex colour like #6b7f99.`,
    'Size and style: keep the case compact, because the whole file must be written in under two minutes: exactly 3 suspects, 3 rooms with 3 hotspots each, 6 evidence items (1 or 2 red herrings), 8 to 10 timeline events, 4 hints from gentle to explicit, intro_briefing of 2 short paragraphs. Every description, clue text, fact and ending is ONE sentence of at most 30 words; solution.reveal is at most 90 words. Per suspect: 2 public_facts, 2 private_knowledge items, 1 lie, 1 secret, 1 never_reveal item, 2 deflections, 2 or 3 revealable clues mixing free, pressed and shown_evidence conditions, patience 10 to 14. Hotspot labels are 1 to 3 concrete words (desk, coat, decanter, ledger, window ...). Noir voice, no emojis, no graphic gore. The player is an unnamed police detective. Output valid JSON only: escape double quotes inside strings, no comments, no trailing commas.',
    WRITING_STYLE,
    'Design for fairness: there must be a moment where the evidence clicks; each lie must be breakable by an evidence item in that suspect\'s breaks_on; red herrings must have innocent explanations that interrogation can reveal.',
  ].join('\n\n');
}

export function buildGeneratorUserPrompt(prefs: GeneratorPreferences): string {
  const setting = prefs.setting?.trim() ? prefs.setting.trim().slice(0, 120) : 'your choice of an atmospheric 1940s location';
  const era = prefs.era?.trim() ? prefs.era.trim().slice(0, 60) : 'the late 1940s';
  const difficulty = prefs.difficulty ?? 'standard';
  return `Write a new case. Setting: ${setting}. Era: ${era}. Difficulty: ${difficulty}. Use a fresh premise and original names. Return only the fenced JSON block.`;
}

export function buildRepairPrompt(errors: readonly string[]): string {
  return `The case you wrote failed validation with these errors:\n- ${errors.slice(0, 40).join('\n- ')}\n\nFix every error while keeping the story. Return the complete corrected case as one fenced \`\`\`json block and nothing else.`;
}
