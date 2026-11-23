// Generated cases are kept on the device so they can be replayed.
import type { CaseFile } from '@shared/caseSchema.ts';
import { validateCase } from '@shared/validator.ts';
import type { KeyValueStorage } from './save.ts';

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

export function saveGeneratedCase(storage: KeyValueStorage, id: string, caseFile: CaseFile, now = Date.now()): StoredGeneratedCase {
  const rec: StoredGeneratedCase = { id, createdAt: now, title: caseFile.title, tagline: caseFile.tagline, caseFile };
  const rest = listGeneratedCases(storage).filter((c) => c.id !== id);
  const next = [rec, ...rest].slice(0, MAX_KEPT);
  storage.setItem(KEY, JSON.stringify(next));
  return rec;
}

export function getGeneratedCase(storage: KeyValueStorage, id: string): StoredGeneratedCase | null {
  return listGeneratedCases(storage).find((c) => c.id === id) ?? null;
}

export function deleteGeneratedCase(storage: KeyValueStorage, id: string): void {
  const rest = listGeneratedCases(storage).filter((c) => c.id !== id);
  storage.setItem(KEY, JSON.stringify(rest));
}
