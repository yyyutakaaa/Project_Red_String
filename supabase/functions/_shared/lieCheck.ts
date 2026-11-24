// "Catch a lie": the detective pins something a suspect said, puts evidence on the table and says it
// is a lie. Two things must hold. The evidence has to matter to this suspect (a fixed rule, see
// evidenceMatters). And the statement has to be one of the lies on their sheet, which that evidence
// disproves: a small model call decides that, because the statement is free text.
import type { Evidence, Suspect } from './core/caseSchema.ts';
import { evidenceMatters } from './core/clues.ts';
import { parseLieVerdict } from './core/lies.ts';
import { chat, type Usage } from './omniakey.ts';

export const MAX_STATEMENT_CHARS = 1200;
export { sameStatement } from './core/lies.ts';

export interface LieVerdict {
  /** Index into suspect.lies of the lie that was caught, or null when the call does not stick. */
  lieIndex: number | null;
  usage: Usage | null;
}

export async function judgeLie(model: string, suspect: Suspect, statement: string, evidence: Evidence): Promise<LieVerdict> {
  if (suspect.lies.length === 0 || !evidenceMatters(suspect, evidence.id)) return { lieIndex: null, usage: null };
  const system = [
    'You referee one move in a detective game. A suspect made a statement. The suspect sheet lists the false claims this suspect makes, each with the hidden truth.',
    'The detective says the statement is a lie and shows one piece of evidence.',
    'Decide two things. "lie": the number of the false claim that the statement asserts or clearly relies on, or null when the statement asserts none of them (a true statement, small talk, a refusal or an admission of the truth is null).',
    '"contradicts": true when the evidence, as described, contradicts that false claim or supports the hidden truth behind it; false otherwise.',
    'The statement may be in any language. Answer with only JSON: {"lie": <number or null>, "contradicts": true or false}',
  ].join('\n');
  const user = JSON.stringify({
    statement: statement.slice(0, MAX_STATEMENT_CHARS),
    false_claims: suspect.lies.map((l, i) => ({ number: i + 1, topic: l.topic, claim: l.claim, hidden_truth: l.truth })),
    evidence: { name: evidence.name, description: evidence.description },
  });
  try {
    const r = await chat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      maxTokens: 60,
      temperature: 0,
      thinking: false,
      timeoutMs: 15_000,
    });
    return { lieIndex: parseLieVerdict(r.text, suspect.lies.length), usage: r.usage };
  } catch (err) {
    console.error('lie check failed', (err as Error).message);
    return { lieIndex: null, usage: null };
  }
}

/** Rough size of the judge call, for the spend reservation. */
export function lieCheckChars(suspect: Suspect, statement: string, evidence: Evidence): number {
  return 900 + statement.length + evidence.description.length + suspect.lies.reduce((n, l) => n + l.topic.length + l.claim.length + l.truth.length + 60, 0);
}
