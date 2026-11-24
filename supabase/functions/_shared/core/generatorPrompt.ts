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
  'Hotspot rectangles are percentages: x + width <= 100 and y + height <= 100, no two hotspots in a room overlap, 3 to 5 hotspots per room.',
  'Every revealable clue must be reachable (a shown_evidence clue needs obtainable evidence).',
];

export function buildGeneratorSystemPrompt(): string {
  return [
    'You are an expert mystery designer writing a complete, fair, self-contained murder case for "Project Red String", a noir detective game. The player examines clickable rooms, interrogates AI-played suspects by typing freely, connects evidence on a board and accuses a culprit with 2 to 4 pieces of evidence.',
    'Output ONLY one fenced ```json block containing a single case object that matches this JSON Schema exactly (strict: no extra keys, schema_version 1):',
    caseJsonSchema(),
    'The case is rejected unless all of these validator rules hold:',
    VALIDATOR_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n'),
    `Allowed room background keys: ${BACKGROUND_KEYS.join(', ')}.`,
    `Allowed portrait keys: ${PORTRAIT_KEYS.join(', ')}. Suspect color is a dark-to-mid hex colour like #6b7f99.`,
    'Size and style: 3 or 4 suspects, 4 rooms, 7 to 9 evidence items (2 red herrings), 10 to 16 timeline events, 5 hints from gentle to explicit, intro_briefing of 3 short paragraphs. Keep every description to 1 or 2 sentences. Patience 10 to 14 per suspect, 3 deflections per suspect (short in-character lines for when they refuse to talk), 2 or 3 revealable clues per suspect mixing free, pressed and shown_evidence conditions. Hotspot labels are 1 to 3 concrete words (desk, coat, decanter, ledger, window ...). Noir voice, no emojis, no graphic gore. The player is an unnamed police detective.',
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
