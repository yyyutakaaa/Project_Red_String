import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import {
  MemoryStorage,
  continueSlot,
  deleteSlot,
  getDeviceId,
  listSlots,
  loadSlot,
  newCaseProgress,
  newSlot,
  parseSlot,
  recordCompletion,
  writeSlot,
} from '../save.ts';
import { addLink, syncPins } from '../board.ts';
import { miniCase } from './fixtures/miniCase.ts';

describe('save system', () => {
  it('round-trips a full slot including chats, patience, evidence and board', () => {
    const storage = new MemoryStorage();
    const c = CaseFile.parse(miniCase());
    const slot = newSlot(2, 1000);
    const p = newCaseProgress('mini', 'story', 1000);
    p.foundEvidence = ['pawn-ticket', 'bloody-clock'];
    p.revealedClues = ['nora-return'];
    p.conversations.nora = {
      messages: [
        { id: 'm1', role: 'detective', text: 'Where were you?', at: 1 },
        { id: 'm2', role: 'suspect', text: 'At home.', at: 2, revealedClueIds: [] },
      ],
      patienceUsed: 1,
      patienceMax: 8,
      mood: 'nervous',
      shownEvidence: ['pawn-ticket'],
    };
    p.board = addLink(syncPins(p.board, c, p.foundEvidence), 'nora', 'pawn-ticket');
    slot.progress.mini = p;
    slot.activeCaseKey = 'mini';
    writeSlot(storage, slot, 2000);

    const loaded = loadSlot(storage, 2);
    expect(loaded).not.toBeNull();
    expect(loaded!.updatedAt).toBe(2000);
    expect(loaded!.progress.mini).toEqual(p);
    expect(loaded!.activeCaseKey).toBe('mini');
  });

  it('continue opens the last written slot', () => {
    const storage = new MemoryStorage();
    writeSlot(storage, newSlot(1), 10);
    writeSlot(storage, newSlot(3), 20);
    expect(continueSlot(storage)?.slot).toBe(3);
    deleteSlot(storage, 3);
    expect(continueSlot(storage)?.slot).toBe(1);
    expect(listSlots(storage).map((s) => s?.slot ?? null)).toEqual([1, null, null]);
  });

  it('survives corrupted data', () => {
    expect(parseSlot('{not json', 1)).toBeNull();
    expect(parseSlot(JSON.stringify({ version: 2 }), 1)).toBeNull();
    const weird = parseSlot(
      JSON.stringify({ version: 1, progress: { x: { runId: 'r', foundEvidence: [], board: 7 } }, completions: {} }),
      1,
    );
    expect(weird?.progress.x?.board.pins).toEqual([]);
  });

  it('keeps a stable device id', () => {
    const storage = new MemoryStorage();
    const a = getDeviceId(storage);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(getDeviceId(storage)).toBe(a);
  });

  it('records best score and solved flag', () => {
    let slot = newSlot(1);
    slot = recordCompletion(slot, 'mini', 'weak_proof', 500, 'C');
    slot = recordCompletion(slot, 'mini', 'correct', 1300, 'A');
    slot = recordCompletion(slot, 'mini', 'wrong_culprit', 100, 'D');
    expect(slot.completions.mini).toMatchObject({ bestScore: 1300, bestRank: 'A', solved: true, lastOutcome: 'wrong_culprit' });
  });
});
