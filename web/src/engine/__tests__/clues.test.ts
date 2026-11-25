import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { CAUGHT_PRESSURE, cracked, evidenceEffect, evidenceMatters, evidencePressure, filterRevealedClues, forcedClues, guardedEvidence, holdingOut, isConditionMet, resolveMood, resolveRevealedClues, type ClueContext } from '@shared/clues.ts';
import { parseLieVerdict, sameStatement } from '@shared/lies.ts';
import { miniCase } from './fixtures/miniCase.ts';

const c = CaseFile.parse(miniCase());
const nora = c.suspects.find((s) => s.id === 'nora')!;
const ctx = (over: Partial<ClueContext> = {}): ClueContext => ({
  patienceUsedBefore: 0,
  shownEvidenceNow: null,
  shownEvidenceBefore: [],
  alreadyRevealed: [],
  ...over,
});

describe('clue filtering', () => {
  it('free clues are always available', () => {
    expect(isConditionMet('free', ctx())).toBe(true);
  });

  it('pressed clues need questions or evidence', () => {
    expect(isConditionMet('pressed', ctx())).toBe(false);
    expect(isConditionMet('pressed', ctx({ patienceUsedBefore: 2 }))).toBe(true);
    expect(isConditionMet('pressed', ctx({ shownEvidenceNow: 'bloody-clock' }))).toBe(true);
  });

  it('shown_evidence clues need that exact evidence', () => {
    expect(isConditionMet('shown_evidence:ben-note', ctx({ shownEvidenceNow: 'pawn-ticket' }))).toBe(false);
    expect(isConditionMet('shown_evidence:ben-note', ctx({ shownEvidenceNow: 'ben-note' }))).toBe(true);
    expect(isConditionMet('shown_evidence:ben-note', ctx({ shownEvidenceBefore: ['ben-note'] }))).toBe(true);
  });

  it('drops unknown ids, clues of other suspects, unmet conditions and junk', () => {
    const out = filterRevealedClues(nora, ['nora-debts', 'ben-saw-nora', 'made-up', 42, 'nora-return', 'nora-debts'], ctx());
    expect(out).toEqual([]);
    const pressed = filterRevealedClues(nora, ['nora-debts', 'nora-debts'], ctx({ patienceUsedBefore: 3 }));
    expect(pressed).toEqual(['nora-debts']);
    expect(filterRevealedClues(nora, 'nora-debts', ctx())).toEqual([]);
  });

  it('forces evidence-triggered clues and skips already revealed ones', () => {
    expect(forcedClues(nora, ctx({ shownEvidenceNow: 'ben-note' })).map((x) => x.clue_id)).toEqual(['nora-return']);
    expect(resolveRevealedClues(nora, [], ctx({ shownEvidenceNow: 'ben-note' }))).toEqual(['nora-return']);
    expect(
      resolveRevealedClues(nora, ['nora-return'], ctx({ shownEvidenceNow: 'ben-note', alreadyRevealed: ['nora-return'] })),
    ).toEqual([]);
  });

  it('breaks the suspect when breaks_on evidence is shown', () => {
    expect(resolveMood(nora, 'calm', ctx({ shownEvidenceNow: 'pawn-ticket' }))).toBe('broken');
    expect(resolveMood(nora, 'angry', ctx())).toBe('angry');
    expect(resolveMood(nora, 'ecstatic', ctx(), 'nervous')).toBe('nervous');
  });
});

describe('suspects hold out against evidence', () => {
  const turns = (...shown: Array<string | null>) => shown.map((s) => ({ role: 'detective', shown_evidence_id: s }));

  it('counts each showing and each question that keeps pushing after it', () => {
    expect(evidencePressure([], 'letter')).toEqual({ pressure: { letter: 1 }, pressing: 'letter' });
    expect(evidencePressure(turns(null, 'letter', null), null)).toEqual({ pressure: { letter: 3 }, pressing: 'letter' });
    expect(evidencePressure(turns('letter', null, 'glove'), null)).toEqual({ pressure: { letter: 2, glove: 2 }, pressing: 'glove' });
    expect(evidencePressure(turns(null, null), null)).toEqual({ pressure: {}, pressing: null });
  });

  it('gives way only after the confrontations the temperament allows', () => {
    const base = { patienceUsedBefore: 3, shownEvidenceBefore: [] as string[], alreadyRevealed: [] as string[], holdsOut: 2 };
    expect(cracked('letter', { ...base, shownEvidenceNow: 'letter', pressure: { letter: 1 }, pressing: 'letter' })).toBe(false);
    expect(cracked('letter', { ...base, shownEvidenceNow: null, pressure: { letter: 2 }, pressing: 'letter' })).toBe(false);
    expect(cracked('letter', { ...base, shownEvidenceNow: null, pressure: { letter: 3 }, pressing: 'letter' })).toBe(true);
    // Without pressure data the old rule holds: showing it is enough.
    expect(cracked('letter', { patienceUsedBefore: 0, shownEvidenceNow: 'letter', shownEvidenceBefore: [], alreadyRevealed: [] })).toBe(true);
  });

  it('breaks at once when the detective catches a lie with the evidence', () => {
    const caught = evidencePressure([], 'letter', true);
    expect(caught.pressure.letter).toBe(CAUGHT_PRESSURE);
    // The catch is remembered in the transcript, so they stay broken on the next question.
    const later = evidencePressure([{ role: 'detective', shown_evidence_id: 'letter', caught: true }], null);
    expect(cracked('letter', { patienceUsedBefore: 1, shownEvidenceNow: null, shownEvidenceBefore: ['letter'], alreadyRevealed: [], holdsOut: 4, ...later })).toBe(true);
  });

  it('tells the player what the evidence did: nothing, holding out, or gave way', () => {
    const base = { patienceUsedBefore: 0, shownEvidenceBefore: [] as string[], alreadyRevealed: [] as string[], holdsOut: 1 };
    expect(evidenceEffect(nora, { ...base, shownEvidenceNow: null })).toBeNull();
    // Evidence nothing on her sheet waits for.
    expect(evidenceMatters(nora, 'racing-slips')).toBe(false);
    expect(evidenceEffect(nora, { ...base, shownEvidenceNow: 'racing-slips', pressure: { 'racing-slips': 1 }, pressing: 'racing-slips' })).toBe('none');
    expect(evidenceEffect(nora, { ...base, shownEvidenceNow: 'pawn-ticket', pressure: { 'pawn-ticket': 1 }, pressing: 'pawn-ticket' })).toBe('holding');
    expect(evidenceEffect(nora, { ...base, shownEvidenceNow: null, pressure: { 'pawn-ticket': 2 }, pressing: 'pawn-ticket' })).toBe('gave');
  });
});

describe('only what a suspect has to hide is hard to get out of them', () => {
  // Ben did not do it. Besides the slips that disprove his own lie, he saw something about the clock.
  const base = c.suspects.find((s) => s.id === 'ben')!;
  const ben = {
    ...base,
    revealable_clues: [
      ...base.revealable_clues,
      { clue_id: 'ben-clock', text: 'Saw the clock on the kitchen mantel at nine.', condition: 'shown_evidence:bloody-clock' },
      { clue_id: 'ben-door', text: 'Heard the back door at twenty past nine.', condition: 'pressed' },
    ],
  };
  const innocentCtx = (shown: string, over: Partial<ClueContext> = {}): ClueContext =>
    ctx({ shownEvidenceNow: shown, pressure: { [shown]: 1 }, pressing: shown, holdsOut: 3, guarded: guardedEvidence(ben, true), innocent: true, ...over });

  it('an innocent suspect holds out only against evidence that disproves their own lies', () => {
    expect(guardedEvidence(ben, true)).toEqual(['racing-slips']);
    // The one who did it holds out against everything that touches them.
    expect(guardedEvidence(nora, false)).toEqual(['pawn-ticket', 'ben-note']);
  });

  it('tells what evidence jogs in their memory the first time it is shown', () => {
    const shown = innocentCtx('bloody-clock');
    expect(holdingOut(ben, shown)).toBeNull();
    expect(forcedClues(ben, shown).map((x) => x.clue_id)).toEqual(['ben-clock']);
    expect(evidenceEffect(ben, shown)).toBe('gave');
  });

  it('still holds out against evidence that disproves their lie', () => {
    const slips = innocentCtx('racing-slips');
    expect(holdingOut(ben, slips)).not.toBeNull();
    expect(evidenceEffect(ben, slips)).toBe('holding');
  });

  it('the one who did it holds out against any evidence that touches them', () => {
    const shown = ctx({ shownEvidenceNow: 'ben-note', pressure: { 'ben-note': 1 }, pressing: 'ben-note', holdsOut: 3, guarded: guardedEvidence(nora, false) });
    expect(holdingOut(nora, shown)).not.toBeNull();
    expect(forcedClues(nora, shown)).toEqual([]);
  });

  it('an innocent suspect does not have to be pushed for what they saw', () => {
    expect(isConditionMet('pressed', ctx({ innocent: true }))).toBe(true);
    expect(filterRevealedClues(ben, ['ben-door'], ctx({ innocent: true }))).toEqual(['ben-door']);
    expect(isConditionMet('pressed', ctx({ innocent: false }))).toBe(false);
  });
});

describe('catching a lie', () => {
  it('matches a pinned statement to the transcript whatever the spacing', () => {
    expect(sameStatement('I was  in the lounge.\n', ' i was in the Lounge.')).toBe(true);
    expect(sameStatement('I was in the lounge.', 'I was in the bar.')).toBe(false);
    expect(sameStatement('', '')).toBe(false);
  });

  it('reads the referee and treats anything unclear as not caught', () => {
    expect(parseLieVerdict('{"lie": 2, "contradicts": true}', 2)).toBe(1);
    expect(parseLieVerdict('```json\n{"lie": 1, "contradicts": true}\n```', 2)).toBe(0);
    expect(parseLieVerdict('{"lie": 1, "contradicts": false}', 2)).toBeNull();
    expect(parseLieVerdict('{"lie": null, "contradicts": true}', 2)).toBeNull();
    expect(parseLieVerdict('{"lie": 3, "contradicts": true}', 2)).toBeNull();
    expect(parseLieVerdict('yes, they lied', 2)).toBeNull();
  });
});
