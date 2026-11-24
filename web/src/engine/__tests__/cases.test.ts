// Validates every story case JSON and checks the authoring targets for each case.
// Run with: npm run validate:cases
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateCase, computeReachability } from '@shared/validator.ts';
import { parseCondition, type CaseFile } from '@shared/caseSchema.ts';
import { BACKGROUND_KEYS, PORTRAIT_KEYS } from '@shared/assetKeys.ts';
import { buildSuspectPrompt } from '@shared/suspectPrompt.ts';
import { STORY_ORDER } from '../caseLoader.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.resolve(here, '../../cases');
const syncedDir = path.resolve(here, '../../../../supabase/functions/_shared/cases');
const seedFile = path.resolve(here, '../../../../supabase/seed/story_cases.sql');

function load(id: string): unknown {
  return JSON.parse(readFileSync(path.join(casesDir, `${id}.json`), 'utf8'));
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

const parsed = new Map<string, CaseFile>();

describe.each(STORY_ORDER.map((id) => [id]))('story case %s', (id) => {
  it('exists and passes the validator', () => {
    expect(existsSync(path.join(casesDir, `${id}.json`)), `missing src/cases/${id}.json`).toBe(true);
    const r = validateCase(load(id));
    if (!r.ok) throw new Error(`Validator errors for ${id}:\n- ${r.errors.join('\n- ')}`);
    expect(r.case.id).toBe(id);
    expect(r.warnings, `warnings for ${id}`).toEqual([]);
    parsed.set(id, r.case);
  });

  it('makes every required evidence item discoverable without exact phrasing', () => {
    const c = parsed.get(id) ?? (validateCase(load(id)).case as CaseFile);
    const fromRooms = new Set(c.rooms.flatMap((r) => r.hotspots.map((h) => h.evidence_id).filter(Boolean)));
    for (const rid of c.solution.required_evidence) {
      if (fromRooms.has(rid)) continue;
      const grant = c.suspects.flatMap((s) => s.revealable_clues).find((cl) => cl.evidence_id === rid);
      expect(grant, `${rid} must come from a hotspot or a clue`).toBeDefined();
      expect(parseCondition(grant!.condition).kind, `${rid} must be granted by showing evidence`).toBe('shown_evidence');
    }
    expect(computeReachability(c).evidence.size).toBe(c.evidence.length);
  });

  it('uses known asset keys and non-overlapping hotspots', () => {
    const c = parsed.get(id) ?? (validateCase(load(id)).case as CaseFile);
    for (const r of c.rooms) {
      expect(BACKGROUND_KEYS as readonly string[], `room ${r.id}`).toContain(r.background);
      for (let i = 0; i < r.hotspots.length; i++) {
        for (let j = i + 1; j < r.hotspots.length; j++) {
          expect(overlaps(r.hotspots[i]!, r.hotspots[j]!), `${r.id}: ${r.hotspots[i]!.id} overlaps ${r.hotspots[j]!.id}`).toBe(false);
        }
      }
      expect(r.hotspots.length, `room ${r.id} hotspots`).toBeGreaterThanOrEqual(3);
    }
    for (const s of c.suspects) expect(PORTRAIT_KEYS as readonly string[], `suspect ${s.id}`).toContain(s.portrait);
  });

  it('gives every suspect depth', () => {
    const c = parsed.get(id) ?? (validateCase(load(id)).case as CaseFile);
    for (const s of c.suspects) {
      expect(s.deflections.length, `${s.id} deflections`).toBeGreaterThanOrEqual(3);
      expect(s.revealable_clues.length, `${s.id} clues`).toBeGreaterThanOrEqual(2);
      expect(s.public_facts.length, `${s.id} public facts`).toBeGreaterThanOrEqual(2);
      expect(s.patience, `${s.id} patience`).toBeGreaterThanOrEqual(10);
      const prompt = buildSuspectPrompt({
        caseFile: c,
        suspectId: s.id,
        ctx: { patienceUsedBefore: 99, shownEvidenceNow: null, shownEvidenceBefore: c.evidence.map((e) => e.id), alreadyRevealed: [] },
        mood: 'calm',
        shownEvidence: null,
      });
      expect(prompt).not.toContain(c.solution.reveal);
      expect(prompt).not.toContain(c.solution.method);
      expect(prompt).not.toContain(c.solution.motive);
    }
    expect(c.hints.length).toBeGreaterThanOrEqual(5);
  });

  it('is synced to the edge functions (seed SQL and hash)', () => {
    const minified = JSON.stringify(load(id));
    const text = readFileSync(path.join(casesDir, `${id}.json`), 'utf8').replace(/\r\n/g, '\n').trimEnd();
    const seed = readFileSync(seedFile, 'utf8');
    expect(seed.includes(`values ('${id}', $case$${text}$case$`), 'seed is stale: run npm run sync:cases').toBe(true);
    const index = readFileSync(path.join(syncedDir, 'index.ts'), 'utf8');
    expect(index).toContain(`'${id}': '${createHash('sha256').update(minified).digest('hex')}'`);
  });
});

describe('story targets', () => {
  const get = (id: string) => validateCase(load(id)).case as CaseFile;

  it('Ashgrove House is a tutorial-sized case', () => {
    const c = get('ashgrove-house');
    expect(c.title).toBe('Ashgrove House');
    expect(c.rooms).toHaveLength(5);
    expect(c.suspects).toHaveLength(3);
    expect(c.evidence.length).toBeGreaterThanOrEqual(6);
    expect(c.evidence.length).toBeLessThanOrEqual(8);
    expect(c.evidence.filter((e) => e.is_red_herring)).toHaveLength(2);
    const hints = c.hints.join(' ').toLowerCase();
    expect(hints).toMatch(/board/);
    expect(hints).toMatch(/show/);
  });

  it('case two and three have four suspects', () => {
    expect(get('blue-lantern').suspects).toHaveLength(4);
    expect(get('pier-seventeen').suspects).toHaveLength(4);
  });

  it('one character recurs across all three cases', () => {
    const names = STORY_ORDER.map((id) => new Set(get(id).suspects.map((s) => s.name)));
    const recurring = [...names[0]!].filter((n) => names.every((set) => set.has(n)));
    expect(recurring.length).toBeGreaterThanOrEqual(1);
  });

  it('the hardest case needs the most proof', () => {
    expect(get('pier-seventeen').solution.required_evidence.length).toBeGreaterThanOrEqual(3);
  });
});
