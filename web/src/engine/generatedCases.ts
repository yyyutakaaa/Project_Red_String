// Generated cases are kept on the device so they can be replayed.
import type { CaseFile } from '@shared/caseSchema.ts';
import { validateCase } from '@shared/validator.ts';
import { listSlots, type KeyValueStorage } from './save.ts';

const KEY = 'redstring.generatedCases';
const MAX_KEPT = 20;

export interface StoredGeneratedCase {
  id: string;
  createdAt: number;
  title: string;
  tagline: string;
  caseFile: CaseFile;
}

export function listGeneratedCases(storage: KeyValueStorage): StoredGeneratedCase[] {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const out: StoredGeneratedCase[] = [];
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Partial<StoredGeneratedCase>;
      if (typeof rec.id !== 'string') continue;
      const v = validateCase(rec.caseFile);
      if (!v.ok) continue;
      out.push({ id: rec.id, createdAt: Number(rec.createdAt) || 0, title: v.case.title, tagline: v.case.tagline, caseFile: v.case });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** Generated cases with an unfinished run in any save slot. They are never evicted automatically. */
export function generatedCasesInProgress(storage: KeyValueStorage): Set<string> {
  const open = new Set<string>();
  for (const slot of listSlots(storage)) {
    if (!slot) continue;
    for (const [key, p] of Object.entries(slot.progress)) {
      if (key.startsWith('gen-') && !p.accusation) open.add(key.slice(4));
    }
  }
  return open;
}

/**
 * Keep a generated case for replay. The shelf holds MAX_KEPT cases; when it is full the oldest cases
 * without an open run are dropped first. If every kept case is still being played, the shelf grows instead.
 */
export function saveGeneratedCase(storage: KeyValueStorage, id: string, caseFile: CaseFile, now = Date.now()): StoredGeneratedCase {
  const rec: StoredGeneratedCase = { id, createdAt: now, title: caseFile.title, tagline: caseFile.tagline, caseFile };
  const rest = listGeneratedCases(storage).filter((c) => c.id !== id);
  const open = generatedCasesInProgress(storage);
  const next = [rec, ...rest];
  for (let i = next.length - 1; i > 0 && next.length > MAX_KEPT; i--) {
    if (!open.has(next[i]!.id)) next.splice(i, 1);
  }
  storage.setItem(KEY, JSON.stringify(next));
  return rec;
}

export function getGeneratedCase(storage: KeyValueStorage, id: string): StoredGeneratedCase | null {
  return listGeneratedCases(storage).find((c) => c.id === id) ?? null;
}

/** Remove a generated case and its progress from every save slot. */
export function deleteGeneratedCase(storage: KeyValueStorage, id: string): void {
  const rest = listGeneratedCases(storage).filter((c) => c.id !== id);
  storage.setItem(KEY, JSON.stringify(rest));
  const key = `gen-${id}`;
  for (const slot of listSlots(storage)) {
    if (!slot || !(key in slot.progress || key in slot.completions || slot.activeCaseKey === key)) continue;
    const progress = { ...slot.progress };
    delete progress[key];
    const completions = { ...slot.completions };
    delete completions[key];
    // Keep the slot's own timestamp: deleting a case is housekeeping, not play.
    storage.setItem(
      `redstring.save.${slot.slot}`,
      JSON.stringify({ ...slot, progress, completions, activeCaseKey: slot.activeCaseKey === key ? null : slot.activeCaseKey }),
    );
  }
}
