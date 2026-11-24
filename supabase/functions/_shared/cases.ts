// Server-side case lookup. Story cases are bundled (synced from web/src/cases by web/scripts/sync-cases.mjs);
// generated cases are read from the generated_cases table. Every case is validated before use.
import type { CaseFile } from './core/caseSchema.ts';
import { validateCase } from './core/validator.ts';
import { STORY_CASES, STORY_CASE_HASHES } from './cases/index.ts';
import { loadGeneratedCase } from './db.ts';
import { sha256Hex } from './http.ts';

/** Per story case: does it validate, and does its content hash match what the sync script recorded? */
export async function storyCaseDiagnostics(): Promise<Record<string, { valid: boolean; hash_ok: boolean; suspects: number }>> {
  const out: Record<string, { valid: boolean; hash_ok: boolean; suspects: number }> = {};
  for (const [id, raw] of Object.entries(STORY_CASES)) {
    const v = validateCase(raw);
    out[id] = {
      valid: v.ok,
      hash_ok: (await sha256Hex(JSON.stringify(raw))) === STORY_CASE_HASHES[id],
      suspects: v.ok ? v.case.suspects.length : 0,
    };
  }
  return out;
}

const cache = new Map<string, CaseFile>();

export async function resolveCase(caseId: string | undefined, generatedId: string | undefined): Promise<{ caseFile: CaseFile; caseKey: string } | null> {
  const key = generatedId ? `gen-${generatedId}` : caseId ?? '';
  if (!key) return null;
  const hit = cache.get(key);
  if (hit) return { caseFile: hit, caseKey: key };
  const raw = generatedId ? await loadGeneratedCase(generatedId) : caseId ? STORY_CASES[caseId] : undefined;
  if (!raw) return null;
  const v = validateCase(raw);
  if (!v.ok) {
    console.error(`case ${key} failed validation`, v.errors.slice(0, 5));
    return null;
  }
  if (cache.size > 200) cache.clear();
  cache.set(key, v.case);
  return { caseFile: v.case, caseKey: key };
}
