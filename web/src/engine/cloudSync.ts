// Cloud save bookkeeping, kept free of network code so it can be tested.
//
// Local storage stays the working copy: the game reads and writes slots there as before. With an
// account, every write is also uploaded, and on sign-in the two sides are merged slot by slot.
//
// The sync record remembers whose saves are on this device and the updatedAt of each slot the last
// time it matched the cloud. That tells "deleted on another device" (was synced, now gone from the
// cloud) apart from "never uploaded" (a guest save, or one made while offline).
import { SLOT_COUNT, parseSlot, type KeyValueStorage } from './save.ts';
import type { SaveSlotData } from './types.ts';

const SYNC_KEY = 'redstring.cloud';

export interface SyncRecord {
  /** The account these local saves belong to, or null for guest saves. */
  owner: string | null;
  /** Per slot: updatedAt of the copy both sides last agreed on. */
  synced: Record<number, number>;
}

export function readSyncRecord(storage: KeyValueStorage): SyncRecord {
  try {
    const raw = JSON.parse(storage.getItem(SYNC_KEY) ?? 'null') as Partial<SyncRecord> | null;
    if (raw && typeof raw === 'object') {
      const synced: Record<number, number> = {};
      for (const [k, v] of Object.entries(raw.synced ?? {})) if (typeof v === 'number') synced[Number(k)] = v;
      return { owner: typeof raw.owner === 'string' ? raw.owner : null, synced };
    }
  } catch {
    /* fall through to a fresh record */
  }
  return { owner: null, synced: {} };
}

export function writeSyncRecord(storage: KeyValueStorage, record: SyncRecord): void {
  storage.setItem(SYNC_KEY, JSON.stringify(record));
}

export interface RemoteRow {
  slot: number;
  data: unknown;
}

/** Turn cloud rows into slots, dropping anything malformed. */
export function parseRemote(rows: readonly RemoteRow[]): Map<number, SaveSlotData> {
  const out = new Map<number, SaveSlotData>();
  for (const row of rows) {
    if (!Number.isInteger(row.slot) || row.slot < 1 || row.slot > SLOT_COUNT) continue;
    const slot = parseSlot(JSON.stringify(row.data), row.slot);
    if (slot) out.set(row.slot, slot);
  }
  return out;
}

export interface MergePlan {
  /** Cloud copies to store on this device. */
  writeLocal: SaveSlotData[];
  /** Local slots to remove (deleted elsewhere, or another account's saves). */
  deleteLocal: number[];
  /** Local copies to upload. */
  upload: SaveSlotData[];
}

/**
 * Decide how to bring local slots and cloud slots together for `userId`.
 * - Another account's saves on this device are replaced by this account's cloud saves.
 * - Guest saves (owner null) and this account's own saves merge: per slot, the newer copy wins.
 */
export function planMerge(
  local: ReadonlyArray<SaveSlotData | null>,
  remote: ReadonlyMap<number, SaveSlotData>,
  record: SyncRecord,
  userId: string,
): MergePlan {
  const plan: MergePlan = { writeLocal: [], deleteLocal: [], upload: [] };
  const foreign = record.owner !== null && record.owner !== userId;
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const l = local[n - 1] ?? null;
    const r = remote.get(n) ?? null;
    if (foreign) {
      if (r) plan.writeLocal.push(r);
      else if (l) plan.deleteLocal.push(n);
      continue;
    }
    if (l && r) {
      if (l.updatedAt > r.updatedAt) plan.upload.push(l);
      else if (r.updatedAt > l.updatedAt) plan.writeLocal.push(r);
    } else if (r) {
      plan.writeLocal.push(r);
    } else if (l) {
      const wasSynced = record.owner === userId && record.synced[n] !== undefined;
      if (wasSynced) plan.deleteLocal.push(n);
      else plan.upload.push(l);
    }
  }
  return plan;
}
