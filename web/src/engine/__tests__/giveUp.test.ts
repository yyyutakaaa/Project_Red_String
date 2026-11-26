import { beforeEach, describe, expect, it } from 'vitest';
import { getStoryCase, isStoryUnlocked, STORY_ORDER } from '../caseLoader.ts';
import { computeScore } from '../scoring.ts';
import { accuse, giveUp, stopCaseClock, useGame } from '../../store/game.ts';

const KEY = 'ashgrove-house';
const caseFile = getStoryCase(KEY)!;
const slot = () => useGame.getState().slot!;

describe('giving up a case', () => {
  beforeEach(() => {
    useGame.setState({ slot: null });
    useGame.getState().createSlot(1);
    useGame.getState().ensureProgress(KEY, 'story');
  });

  it('closes the case unsolved, with no score, and opens the next case', () => {
    const record = giveUp(caseFile, KEY);
    stopCaseClock();
    expect(record).toMatchObject({ outcome: 'gave_up', culpritId: '', evidenceIds: [], score: 0, rank: 'D' });
    expect(slot().progress[KEY]!.accusation?.outcome).toBe('gave_up');
    expect(slot().completions[KEY]).toMatchObject({ solved: false, lastOutcome: 'gave_up', bestScore: 0 });
    expect(isStoryUnlocked(1, (id) => Boolean(slot().completions[id]))).toBe(true);
    expect(STORY_ORDER[0]).toBe(KEY);
  });

  it('cannot close a case twice', () => {
    giveUp(caseFile, KEY);
    expect(giveUp(caseFile, KEY)).toBeNull();
    expect(accuse(caseFile, KEY, caseFile.solution.culprit_id, caseFile.solution.required_evidence)).toBeNull();
  });

  it('starting over after giving up opens a fresh run and keeps the record', () => {
    giveUp(caseFile, KEY);
    const before = slot().progress[KEY]!.runId;
    const fresh = useGame.getState().restartCase(KEY, 'story');
    expect(fresh.accusation).toBeNull();
    expect(fresh.runId).not.toBe(before);
    expect(slot().completions[KEY]?.lastOutcome).toBe('gave_up');
  });

  it('scores nothing, whatever was found', () => {
    expect(computeScore({ outcome: 'gave_up', discovered: 20, discoverable: 20, questionsUsed: 0, questionBudget: 40, hintsUsed: 0 }).total).toBe(0);
  });
});
