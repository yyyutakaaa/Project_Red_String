// Server-side case lookup. Story cases live in public.story_cases (seeded from web/src/cases by
// web/scripts/sync-cases.mjs); a story case is only used when its stored text matches the SHA-256 the
// repository recorded, so a stale or corrupted row can never reach a prompt. Generated cases are read from
// public.generated_cases. Every case is validated before use.
import type { CaseFile } from './core/caseSchema.ts';
import { validateCase } from './core/validator.ts';
import { STORY_CASE_HASHES } from './cases/index.ts';
import { db, loadGeneratedCase } from './db.ts';
import { sha256Hex } from './http.ts';

const cache = new Map<string, CaseFile>();

/** Hash of the canonical (minified) JSON, independent of how the stored text is formatted. */
function canonicalHash(value: unknown): Promise<string> {
  return sha256Hex(JSON.stringify(value));
}

async function loadStoryCaseText(id: string): Promise<string | null> {
  if (!STORY_CASE_HASHES[id]) return null;
  const { data, error } = await db().from('story_cases').select('case_text').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return String(data.case_text);
}

export async function resolveCase(caseId: string | undefined, generatedId: string | undefined): Promise<{ caseFile: CaseFile; caseKey: string } | null> {
  const key = generatedId ? `gen-${generatedId}` : caseId ?? '';
  if (!key) return null;
  const hit = cache.get(key);
  if (hit) return { caseFile: hit, caseKey: key };
  let raw: unknown = null;
  if (generatedId) {
    raw = await loadGeneratedCase(generatedId);
  } else if (caseId) {
    const text = await loadStoryCaseText(caseId);
    if (!text) return null;
    try {
      raw = JSON.parse(text);
    } catch {
      console.error(`story case ${caseId} in the database is not valid JSON; run the seed`);
      return null;
    }
    if ((await canonicalHash(raw)) !== STORY_CASE_HASHES[caseId]) {
      console.error(`story case ${caseId} in the database does not match the deployed hash; run the seed`);
      return null;
    }
  }
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

/** Per story case: present in the database, valid, and matching the hash recorded in the repository? */
export async function storyCaseDiagnostics(): Promise<Record<string, { valid: boolean; hash_ok: boolean; suspects: number }>> {
  const out: Record<string, { valid: boolean; hash_ok: boolean; suspects: number }> = {};
  for (const id of Object.keys(STORY_CASE_HASHES)) {
    const text = await loadStoryCaseText(id);
    if (!text) {
      out[id] = { valid: false, hash_ok: false, suspects: 0 };
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      out[id] = { valid: false, hash_ok: false, suspects: 0 };
      continue;
    }
    const v = validateCase(parsed);
    out[id] = { valid: v.ok, hash_ok: (await canonicalHash(parsed)) === STORY_CASE_HASHES[id], suspects: v.ok ? v.case.suspects.length : 0 };
  }
  return out;
}

/**
 * Store a story case in public.story_cases. Only text whose canonical hash equals the hash compiled into
 * this function is accepted, so this can only load the exact cases the repository was deployed with.
 */
export async function seedStoryCase(id: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const expected = STORY_CASE_HASHES[id];
  if (!expected) return { ok: false, error: 'unknown story case id' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not valid JSON' };
  }
  if ((await canonicalHash(parsed)) !== expected) return { ok: false, error: 'content does not match the deployed hash' };
  const { error } = await db().from('story_cases').upsert({ id, case_text: JSON.stringify(parsed), updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  cache.delete(id);
  return { ok: true };
}
