import { describe, expect, it } from 'vitest';
import { MemoryStorage, newSlot } from '../save.ts';
import { parseRemote, planMerge, readSyncRecord, writeSyncRecord, type SyncRecord } from '../cloudSync.ts';

const ME = 'user-a';
const slot = (n: number, updatedAt: number) => ({ ...newSlot(n, updatedAt), updatedAt });
const remote = (...slots: ReturnType<typeof slot>[]) => new Map(slots.map((s) => [s.slot, s]));
const guest: SyncRecord = { owner: null, synced: {} };

describe('planMerge', () => {
  it('uploads guest saves when the cloud is empty', () => {
    const plan = planMerge([slot(1, 100), null, slot(3, 50)], remote(), guest, ME);
    expect(plan.upload.map((s) => s.slot)).toEqual([1, 3]);
    expect(plan.writeLocal).toEqual([]);
    expect(plan.deleteLocal).toEqual([]);
  });

  it('keeps the newer copy of each slot', () => {
    const plan = planMerge([slot(1, 200), slot(2, 100), null], remote(slot(1, 150), slot(2, 300), slot(3, 10)), guest, ME);
    expect(plan.upload.map((s) => s.slot)).toEqual([1]);
    expect(plan.writeLocal.map((s) => s.slot)).toEqual([2, 3]);
  });

  it('does nothing when both sides match', () => {
    const plan = planMerge([slot(1, 100), null, null], remote(slot(1, 100)), { owner: ME, synced: { 1: 100 } }, ME);
    expect(plan).toEqual({ writeLocal: [], deleteLocal: [], upload: [] });
  });

  it('removes a slot that was deleted on another device', () => {
    const plan = planMerge([slot(1, 100), slot(2, 100), null], remote(slot(1, 100)), { owner: ME, synced: { 1: 100, 2: 100 } }, ME);
    expect(plan.deleteLocal).toEqual([2]);
    expect(plan.upload).toEqual([]);
  });

  it('uploads a slot made offline that the cloud never saw', () => {
    const plan = planMerge([null, slot(2, 500), null], remote(), { owner: ME, synced: {} }, ME);
    expect(plan.upload.map((s) => s.slot)).toEqual([2]);
  });

  it('replaces another account\'s saves instead of merging them', () => {
    const plan = planMerge([slot(1, 900), slot(2, 900), null], remote(slot(1, 10)), { owner: 'user-b', synced: { 1: 900 } }, ME);
    expect(plan.writeLocal.map((s) => s.slot)).toEqual([1]);
    expect(plan.deleteLocal).toEqual([2]);
    expect(plan.upload).toEqual([]);
  });
});

describe('parseRemote', () => {
  it('drops malformed rows and out-of-range slots', () => {
    const parsed = parseRemote([
      { slot: 1, data: slot(1, 5) },
      { slot: 2, data: { nonsense: true } },
      { slot: 9, data: slot(9, 5) },
    ]);
    expect([...parsed.keys()]).toEqual([1]);
  });
});

describe('sync record', () => {
  it('round-trips and survives garbage', () => {
    const storage = new MemoryStorage();
    expect(readSyncRecord(storage)).toEqual({ owner: null, synced: {} });
    writeSyncRecord(storage, { owner: ME, synced: { 2: 42 } });
    expect(readSyncRecord(storage)).toEqual({ owner: ME, synced: { 2: 42 } });
    storage.setItem('redstring.cloud', '{oops');
    expect(readSyncRecord(storage)).toEqual({ owner: null, synced: {} });
  });
});
