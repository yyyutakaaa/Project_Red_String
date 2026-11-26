import { describe, expect, it } from 'vitest';
import { newCaseProgress, newSlot, recordCompletion } from '../save.ts';
import { playerStats } from '../stats.ts';
import type { ConversationState } from '../types.ts';

function talk(questions: number, lies = 0): ConversationState {
  return {
    messages: Array.from({ length: questions }, (_, i) => ({ id: `q${i}`, role: 'detective' as const, text: '?', at: i })),
    patienceUsed: questions,
    patienceMax: 10,
    mood: 'calm',
    shownEvidence: [],
    caughtLies: Array.from({ length: lies }, (_, i) => ({ statement: 's', evidenceId: `e${i}`, at: i })),
  };
}

describe('playerStats', () => {
  it('is empty for a new player', () => {
    const s = playerStats([null, newSlot(2), null]);
    expect(s.solved).toBe(0);
    expect(s.playMs).toBe(0);
    expect(s.bestRank).toBeNull();
    expect(s.cases.every((c) => c.standing === 'untouched')).toBe(true);
  });

  it('adds up every slot and keeps the best of each case', () => {
    const one = newSlot(1);
    const run = newCaseProgress('ashgrove-house', 'story');
    run.playMs = 60_000;
    run.foundEvidence = ['a', 'b'];
    run.hintsUsed = 1;
    run.boardReveals = 1;
    run.conversations = { clara: talk(3, 1), simon: talk(0) };
    run.accusation = { culpritId: 'vance', evidenceIds: [], outcome: 'correct', score: 1300, rank: 'A', at: 1 };
    one.progress['ashgrove-house'] = run;
    const solved = recordCompletion(one, 'ashgrove-house', 'correct', 1300, 'A', 1, 50_000);

    const two = newSlot(2);
    const second = newCaseProgress('ashgrove-house', 'story');
    second.playMs = 30_000;
    second.conversations = { vance: talk(2) };
    second.accusation = { culpritId: 'clara', evidenceIds: [], outcome: 'wrong_culprit', score: 200, rank: 'D', at: 2 };
    two.progress['ashgrove-house'] = second;
    two.progress['blue-lantern'] = newCaseProgress('blue-lantern', 'story');
    const closed = recordCompletion(two, 'ashgrove-house', 'wrong_culprit', 200, 'D', 2);

    const s = playerStats([solved, closed, null]);
    expect(s.solved).toBe(1);
    expect(s.playMs).toBe(90_000);
    expect(s.suspectsQuestioned).toBe(2);
    expect(s.questionsAsked).toBe(5);
    expect(s.liesCaught).toBe(1);
    expect(s.evidenceFound).toBe(2);
    expect(s.hintsUsed).toBe(2);
    expect(s.accusationsRight).toBe(1);
    expect(s.accusationsWrong).toBe(1);
    expect(s.bestRank).toBe('A');
    expect(s.fastestSolveMs).toBe(50_000);
    const ashgrove = s.cases.find((c) => c.id === 'ashgrove-house')!;
    expect(ashgrove).toMatchObject({ standing: 'solved', bestScore: 1300, bestRank: 'A', bestTimeMs: 50_000 });
    expect(s.cases.find((c) => c.id === 'blue-lantern')!.standing).toBe('open');
  });
});
