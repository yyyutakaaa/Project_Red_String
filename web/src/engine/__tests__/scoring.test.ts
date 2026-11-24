import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { accusationSelectionError, computeScore, evaluateAccusation, scoreProgress, HINT_COST } from '../scoring.ts';
import { newCaseProgress } from '../save.ts';
import { miniCase } from './fixtures/miniCase.ts';

const c = CaseFile.parse(miniCase());

describe('accusation', () => {
  it('is correct when culprit and required evidence match', () => {
    expect(evaluateAccusation(c, 'nora', ['bloody-clock', 'pawn-ticket']).outcome).toBe('correct');
    expect(evaluateAccusation(c, 'nora', ['pawn-ticket', 'bloody-clock', 'racing-slips']).outcome).toBe('correct');
  });

  it('is weak proof when the culprit is right but evidence is incomplete', () => {
    const v = evaluateAccusation(c, 'nora', ['bloody-clock', 'racing-slips']);
    expect(v.outcome).toBe('weak_proof');
    expect(v.missingEvidence).toEqual(['pawn-ticket']);
  });

  it('is wrong when the culprit is wrong, whatever the evidence', () => {
    expect(evaluateAccusation(c, 'ben', ['bloody-clock', 'pawn-ticket']).outcome).toBe('wrong_culprit');
  });

  it('enforces 2 to 4 evidence items', () => {
    expect(accusationSelectionError(null, ['a', 'b'])).toMatch(/Choose/);
    expect(accusationSelectionError('nora', ['a'])).toMatch(/at least 2/);
    expect(accusationSelectionError('nora', ['a', 'b', 'c', 'd', 'e'])).toMatch(/at most 4/);
    expect(accusationSelectionError('nora', ['a', 'b'])).toBeNull();
  });
});

describe('score', () => {
  const base = { discovered: 6, discoverable: 7, questionsUsed: 4, questionBudget: 16, hintsUsed: 0 };

  it('ranks outcomes in order', () => {
    const correct = computeScore({ ...base, outcome: 'correct' }).total;
    const weak = computeScore({ ...base, outcome: 'weak_proof' }).total;
    const wrong = computeScore({ ...base, outcome: 'wrong_culprit' }).total;
    expect(correct).toBeGreaterThan(weak);
    expect(weak).toBeGreaterThan(wrong);
  });

  it('rewards thoroughness and fewer questions, and charges for hints', () => {
    const a = computeScore({ ...base, outcome: 'correct' });
    const fewerClues = computeScore({ ...base, discovered: 2, outcome: 'correct' });
    const moreQuestions = computeScore({ ...base, questionsUsed: 16, outcome: 'correct' });
    const hinted = computeScore({ ...base, hintsUsed: 2, outcome: 'correct' });
    expect(fewerClues.total).toBeLessThan(a.total);
    expect(moreQuestions.total).toBeLessThan(a.total);
    expect(a.total - hinted.total).toBe(2 * HINT_COST);
  });

  it('never goes below zero', () => {
    expect(computeScore({ ...base, outcome: 'wrong_culprit', discovered: 0, hintsUsed: 20 }).total).toBe(0);
  });

  it('scores a progress record', () => {
    const p = newCaseProgress('mini', 'story');
    p.foundEvidence = ['bloody-clock', 'pawn-ticket', 'bloody-clock'];
    p.revealedClues = ['nora-return'];
    p.conversations.nora = { messages: [], patienceUsed: 3, patienceMax: 8, mood: 'calm', shownEvidence: [] };
    const s = scoreProgress(c, p, 'correct');
    expect(s.thoroughness).toBe(Math.round((300 * 3) / 7));
    expect(s.efficiency).toBe(Math.round(300 * (1 - 3 / 16)));
  });
});
