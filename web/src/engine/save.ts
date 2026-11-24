// Save system: three slots in localStorage, plus the device id.
// Storage is injected so it can be tested without a browser.
import type { CaseProgress, CompletionRecord, SaveSlotData } from './types.ts';
import { emptyBoard } from './board.ts';

export const SLOT_COUNT = 3;
const SLOT_KEY = (slot: number) => `redstring.save.${slot}`;
const ACTIVE_SLOT_KEY = 'redstring.activeSlot';
const DEVICE_KEY = 'redstring.deviceId';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements KeyValueStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

export function browserStorage(): KeyValueStorage {
  try {
    const ls = globalThis.localStorage;
    const probe = '__redstring_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return new MemoryStorage();
  }
}

export function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getDeviceId(storage: KeyValueStorage): string {
  const existing = storage.getItem(DEVICE_KEY);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const id = uuid();
  storage.setItem(DEVICE_KEY, id);
  return id;
}

export function newSlot(slot: number, now = Date.now()): SaveSlotData {
  return { version: 1, slot, createdAt: now, updatedAt: now, activeCaseKey: null, progress: {}, completions: {} };
}

export function newCaseProgress(caseKey: string, source: CaseProgress['source'], now = Date.now()): CaseProgress {
  return {
    runId: uuid(),
    caseKey,
    source,
    startedAt: now,
    updatedAt: now,
    briefingSeen: false,
    visitedRooms: [],
    examinedHotspots: [],
    foundEvidence: [],
    revealedClues: [],
    conversations: {},
    board: emptyBoard(),
    hintsUsed: 0,
    notes: '',
    accusation: null,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Defensive structural check so a corrupted or tampered slot never crashes the game. */
export function parseSlot(raw: string | null, slot: number): SaveSlotData | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.version !== 1 || !isObject(data.progress) || !isObject(data.completions)) return null;
    const progress: Record<string, CaseProgress> = {};
    for (const [key, value] of Object.entries(data.progress)) {
      if (!isObject(value) || typeof value.runId !== 'string' || !Array.isArray(value.foundEvidence)) continue;
      const base = newCaseProgress(key, value.source === 'generated' ? 'generated' : 'story');
      const p = { ...base, ...(value as Partial<CaseProgress>), caseKey: key } as CaseProgress;
      if (!isObject(p.board) || !Array.isArray(p.board.pins) || !Array.isArray(p.board.links)) p.board = emptyBoard();
      if (!isObject(p.conversations)) p.conversations = {};
      progress[key] = p;
    }
    const completions: Record<string, CompletionRecord> = {};
    for (const [key, value] of Object.entries(data.completions)) {
      if (isObject(value) && typeof value.bestScore === 'number') completions[key] = value as unknown as CompletionRecord;
    }
    return {
      version: 1,
      slot,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      activeCaseKey: typeof data.activeCaseKey === 'string' ? data.activeCaseKey : null,
      progress,
      completions,
    };
  } catch {
    return null;
  }
}

export function loadSlot(storage: KeyValueStorage, slot: number): SaveSlotData | null {
  return parseSlot(storage.getItem(SLOT_KEY(slot)), slot);
}

export function writeSlot(storage: KeyValueStorage, data: SaveSlotData, now = Date.now()): SaveSlotData {
  const stamped = { ...data, updatedAt: now };
  storage.setItem(SLOT_KEY(data.slot), JSON.stringify(stamped));
  storage.setItem(ACTIVE_SLOT_KEY, String(data.slot));
  return stamped;
}

export function deleteSlot(storage: KeyValueStorage, slot: number): void {
  storage.removeItem(SLOT_KEY(slot));
  if (storage.getItem(ACTIVE_SLOT_KEY) === String(slot)) storage.removeItem(ACTIVE_SLOT_KEY);
}

export function listSlots(storage: KeyValueStorage): Array<SaveSlotData | null> {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(storage, i + 1));
}

/** The slot "Continue" should open: the last written one, else the most recently updated. */
export function continueSlot(storage: KeyValueStorage): SaveSlotData | null {
  const active = Number(storage.getItem(ACTIVE_SLOT_KEY));
  if (active >= 1 && active <= SLOT_COUNT) {
    const s = loadSlot(storage, active);
    if (s) return s;
  }
  const all = listSlots(storage).filter((s): s is SaveSlotData => s !== null);
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all[0] ?? null;
}

export function recordCompletion(
  slot: SaveSlotData,
  caseKey: string,
  outcome: CompletionRecord['lastOutcome'],
  score: number,
  rank: string,
  now = Date.now(),
): SaveSlotData {
  const prev = slot.completions[caseKey];
  const better = !prev || score > prev.bestScore;
  const rec: CompletionRecord = {
    bestScore: better ? score : prev.bestScore,
    bestRank: better ? rank : prev.bestRank,
    lastOutcome: outcome,
    solved: (prev?.solved ?? false) || outcome === 'correct',
    completedAt: now,
  };
  return { ...slot, completions: { ...slot.completions, [caseKey]: rec } };
}
