import { describe, expect, it } from 'vitest';
import { getStoryCase } from '../../engine/caseLoader.ts';
import { newCaseProgress, newSlot } from '../../engine/save.ts';
import { describePresence, type PresenceInput } from '../presence.ts';

const ashgrove = getStoryCase('ashgrove-house')!;
const base = (over: Partial<PresenceInput>): PresenceInput => ({
  pathname: '/',
  mode: 'full',
  slot: null,
  caseFile: (key) => (key === 'ashgrove-house' ? ashgrove : null),
  ...over,
});

describe('describePresence', () => {
  it('names the menu screen', () => {
    expect(describePresence(base({ pathname: '/cases' }))).toEqual({ details: 'Choosing a case file' });
    expect(describePresence(base({ pathname: '/somewhere' }))).toEqual({ details: 'In the menus' });
  });

  it('names the case and the suspect, and sends no timer or small icon', () => {
    const slot = newSlot(1);
    slot.progress['ashgrove-house'] = { ...newCaseProgress('ashgrove-house', 'story'), foundEvidence: ['a', 'b'], revealedClues: ['c'] };
    const suspect = ashgrove.suspects[0]!;
    const status = describePresence(base({ pathname: `/case/ashgrove-house/interrogate/${suspect.id}`, slot }));
    // Nothing else: no start time (the timer must not reset per screen) and no small icon.
    expect(status).toEqual({ details: `Case: ${ashgrove.title}`, state: `Questioning ${suspect.name}` });
  });

  it('says where the player searches', () => {
    const room = ashgrove.rooms[1]!;
    expect(describePresence(base({ pathname: `/case/ashgrove-house/room/${room.id}` }))?.state).toBe(`At the scene: ${room.name}`);
  });

  it('keeps it vague in minimal mode and silent when off', () => {
    expect(describePresence(base({ pathname: '/case/ashgrove-house/board', mode: 'minimal' }))).toEqual({ details: 'Working a case' });
    expect(describePresence(base({ pathname: '/', mode: 'minimal' }))).toEqual({ details: 'In the menus' });
    expect(describePresence(base({ pathname: '/case/ashgrove-house/board', mode: 'off' }))).toBeNull();
  });

  it('never names the culprit at the ending', () => {
    const slot = newSlot(1);
    const p = newCaseProgress('ashgrove-house', 'story');
    slot.progress['ashgrove-house'] = {
      ...p,
      accusation: { culpritId: ashgrove.solution.culprit_id, evidenceIds: [], outcome: 'correct', score: 900, rank: 'A', at: 1, breakdown: p.accusation?.breakdown ?? ({} as never) },
    };
    const status = describePresence(base({ pathname: '/case/ashgrove-house/ending', slot }));
    expect(status?.state).toBe('Case closed. Rank A');
    const culprit = ashgrove.suspects.find((s) => s.id === ashgrove.solution.culprit_id)!;
    expect(JSON.stringify(status)).not.toContain(culprit.name);
  });
});
