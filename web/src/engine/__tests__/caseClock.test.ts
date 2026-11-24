import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newSlot, recordCompletion } from '../save.ts';
import { formatDuration, spokenDuration } from '../../lib/format.ts';
import { startCaseClock, stopCaseClock, useCaseClock, useGame } from '../../store/game.ts';

const KEY = 'ashgrove-house';
const progress = () => useGame.getState().slot!.progress[KEY]!;

describe('case clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-24T20:00:00Z'));
    useGame.setState({ slot: null });
    useGame.getState().createSlot(1);
    useGame.getState().ensureProgress(KEY, 'story');
  });
  afterEach(() => {
    stopCaseClock();
    vi.useRealTimers();
  });

  it('counts the seconds while the case is open and saves them when it stops', () => {
    startCaseClock(KEY);
    vi.advanceTimersByTime(12_000);
    expect(useCaseClock.getState().ms).toBeGreaterThanOrEqual(11_000);
    expect(useCaseClock.getState().ms).toBeLessThanOrEqual(12_000);
    stopCaseClock();
    expect(progress().playMs).toBeGreaterThanOrEqual(11_000);
  });

  it('writes the time into the save every 30 seconds while playing', () => {
    startCaseClock(KEY);
    vi.advanceTimersByTime(31_000);
    expect(progress().playMs).toBeGreaterThanOrEqual(29_000);
  });

  it('stops counting when the player has been idle for three minutes', () => {
    startCaseClock(KEY);
    vi.advanceTimersByTime(10 * 60_000);
    stopCaseClock();
    expect(progress().playMs).toBeLessThanOrEqual(3 * 60_000);
    expect(progress().playMs).toBeGreaterThan(2.5 * 60_000);
  });

  it('carries on from the saved time when the case is opened again', () => {
    startCaseClock(KEY);
    vi.advanceTimersByTime(20_000);
    stopCaseClock();
    const first = progress().playMs!;
    startCaseClock(KEY);
    vi.advanceTimersByTime(5_000);
    expect(useCaseClock.getState().ms).toBeGreaterThanOrEqual(first + 4_000);
  });

  it('does not run on a closed case, and does not credit a restarted case with the old run', () => {
    startCaseClock(KEY);
    vi.advanceTimersByTime(8_000);
    useGame.getState().restartCase(KEY, 'story');
    stopCaseClock();
    expect(progress().playMs).toBe(0);
  });
});

describe('best time', () => {
  it('keeps the fastest correct solve only', () => {
    let slot = newSlot(1);
    slot = recordCompletion(slot, KEY, 'correct', 1200, 'A', 1, 600_000);
    expect(slot.completions[KEY]!.bestTimeMs).toBe(600_000);
    slot = recordCompletion(slot, KEY, 'correct', 1100, 'B', 2, 900_000);
    expect(slot.completions[KEY]!.bestTimeMs).toBe(600_000);
    slot = recordCompletion(slot, KEY, 'wrong_culprit', 100, 'D', 3, 60_000);
    expect(slot.completions[KEY]!.bestTimeMs).toBe(600_000);
    slot = recordCompletion(slot, KEY, 'correct', 1300, 'A', 4, 420_000);
    expect(slot.completions[KEY]!.bestTimeMs).toBe(420_000);
  });

  it('has no best time until the case is solved', () => {
    const slot = recordCompletion(newSlot(1), KEY, 'weak_proof', 400, 'C', 1, 300_000);
    expect(slot.completions[KEY]!.bestTimeMs).toBeUndefined();
  });
});

describe('formatDuration', () => {
  it('reads like a stopwatch', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65_400)).toBe('1:05');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
    expect(spokenDuration(65_000)).toBe('1 minute 5 seconds');
    expect(spokenDuration(3_600_000)).toBe('1 hour');
  });
});
