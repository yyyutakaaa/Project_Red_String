import type { CaseFile } from '@shared/caseSchema.ts';
import { validateCase } from '@shared/validator.ts';

/** Story cases in unlock order. Each id matches a JSON file in src/cases. */
export const STORY_ORDER = [
  'ashgrove-house',
  'blue-lantern',
  'pier-seventeen',
  'night-express',
  'hollis-garden',
  'studio-nine',
  'the-regent',
  'reading-room',
  'mercers-pharmacy',
  'vance-and-pryor',
] as const;
export type StoryCaseId = (typeof STORY_ORDER)[number];

const modules = import.meta.glob<unknown>('../cases/*.json', { eager: true, import: 'default' });

const rawById = new Map<string, unknown>();
for (const [path, data] of Object.entries(modules)) {
  const id = path.split('/').pop()!.replace(/\.json$/, '');
  rawById.set(id, data);
}

const cache = new Map<string, CaseFile>();
const errorsById = new Map<string, string[]>();

/** Returns a validated story case, or null if it is missing or invalid. */
export function getStoryCase(id: string): CaseFile | null {
  if (cache.has(id)) return cache.get(id)!;
  const raw = rawById.get(id);
  if (!raw) return null;
  const result = validateCase(raw);
  if (!result.ok) {
    errorsById.set(id, result.errors);
    if (import.meta.env.DEV) console.error(`Story case ${id} failed validation`, result.errors);
    return null;
  }
  cache.set(id, result.case);
  return result.case;
}

export function storyCaseErrors(id: string): string[] {
  getStoryCase(id);
  return errorsById.get(id) ?? [];
}

export function listStoryCases(): CaseFile[] {
  return STORY_ORDER.map((id) => getStoryCase(id)).filter((c): c is CaseFile => c !== null);
}

export function rawStoryCases(): Map<string, unknown> {
  return rawById;
}

/** Keys used in saves: story cases use their id, generated cases are prefixed. */
export function caseKeyFor(source: 'story' | 'generated', id: string): string {
  return source === 'story' ? id : `gen-${id}`;
}

export function parseCaseKey(key: string): { source: 'story' | 'generated'; id: string } {
  return key.startsWith('gen-') ? { source: 'generated', id: key.slice(4) } : { source: 'story', id: key };
}

export function isStoryUnlocked(index: number, completed: (id: string) => boolean): boolean {
  if (index <= 0) return true;
  const prev = STORY_ORDER[index - 1];
  return prev ? completed(prev) : false;
}
