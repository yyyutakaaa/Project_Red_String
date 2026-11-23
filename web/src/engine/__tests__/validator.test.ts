import { describe, expect, it } from 'vitest';
import { validateCase, computeReachability } from '@shared/validator.ts';
import { CaseFile } from '@shared/caseSchema.ts';
import { miniCase } from './fixtures/miniCase.ts';

function errorsOf(mutate: (c: ReturnType<typeof miniCase>) => void): string[] {
  const c = miniCase();
  mutate(c);
  const r = validateCase(c);
  return r.ok ? [] : r.errors;
}

describe('validateCase', () => {
  it('accepts the fixture case', () => {
    const r = validateCase(miniCase());
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('reports schema errors with paths', () => {
    const errors = errorsOf((c) => {
      (c as unknown as { title: number }).title = 5;
    });
    expect(errors.some((e) => e.startsWith('title:'))).toBe(true);
  });

  it('rejects unknown keys (e.g. a solution block inside a suspect)', () => {
    const errors = errorsOf((c) => {
      (c.suspects[0] as unknown as Record<string, unknown>).solution = { culprit_id: 'nora' };
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects dangling references', () => {
    const errors = errorsOf((c) => {
      c.evidence[0]!.points_to.push('ghost');
      c.rooms[0]!.hotspots[1]!.evidence_id = 'nothing';
      c.suspects[0]!.breaks_on.push('nope');
      c.timeline[0]!.who.push('stranger');
    });
    expect(errors.join('\n')).toMatch(/unknown suspect "ghost"/);
    expect(errors.join('\n')).toMatch(/unknown evidence "nothing"/);
    expect(errors.join('\n')).toMatch(/breaks_on unknown evidence "nope"/);
    expect(errors.join('\n')).toMatch(/who "stranger"/);
  });

  it('rejects a culprit that is not a suspect', () => {
    expect(errorsOf((c) => (c.solution.culprit_id = 'victim')).join('\n')).toMatch(/not a suspect/);
  });

  it('rejects required evidence that cannot be obtained', () => {
    const errors = errorsOf((c) => {
      // Remove the hotspot that holds the pawn ticket.
      c.rooms[1]!.hotspots = c.rooms[1]!.hotspots.filter((h) => h.id !== 'coat');
    });
    expect(errors.join('\n')).toMatch(/pawn-ticket/);
  });

  it('treats evidence granted by a reachable clue as obtainable', () => {
    const parsed = CaseFile.parse(miniCase());
    const reach = computeReachability(parsed);
    expect(reach.evidence.has('ben-note')).toBe(true);
    expect(reach.clues.has('nora-return')).toBe(true);
  });

  it('follows chains of shown_evidence conditions', () => {
    const c = miniCase();
    // ben-note only becomes available after showing racing slips.
    c.suspects[1]!.revealable_clues[0]!.condition = 'shown_evidence:racing-slips';
    expect(validateCase(c).ok).toBe(true);
    // Break the chain: racing slips disappear, so ben-note and nora-return become unreachable.
    c.rooms[1]!.hotspots = c.rooms[1]!.hotspots.filter((h) => h.id !== 'bin');
    c.evidence = c.evidence.filter((e) => e.id !== 'racing-slips');
    c.suspects[1]!.breaks_on = [];
    c.suspects[1]!.alibi_verification.evidence_ids = [];
    const r = validateCase(c);
    expect(r.ok).toBe(false);
  });

  it('requires a suspicious innocent', () => {
    const errors = errorsOf((c) => {
      c.suspects[1]!.lies = [];
      c.evidence.forEach((e) => (e.points_to = e.points_to.filter((p) => p !== 'ben')));
    });
    expect(errors.join('\n')).toMatch(/obvious/);
  });

  it('requires a red herring', () => {
    expect(errorsOf((c) => c.evidence.forEach((e) => (e.is_red_herring = false))).join('\n')).toMatch(/red herring/);
  });

  it('requires the culprit to have opportunity', () => {
    const errors = errorsOf((c) => {
      c.timeline[2]!.who = ['victim', 'ben'];
    });
    expect(errors.join('\n')).toMatch(/no opportunity/);
  });

  it('requires crime events to be hidden', () => {
    expect(errorsOf((c) => (c.timeline[2]!.visibility = 'private')).join('\n')).toMatch(/hidden/);
  });

  it('requires every alibi to be confirmed or broken', () => {
    const errors = errorsOf((c) => {
      c.suspects[1]!.alibi_verification = { status: 'confirmed', evidence_ids: [], clue_ids: [], note: 'x' };
    });
    expect(errors.join('\n')).toMatch(/neither confirmed nor broken/);
  });

  it('requires the culprit alibi to be broken', () => {
    const errors = errorsOf((c) => {
      c.suspects[0]!.alibi_verification.status = 'confirmed';
    });
    expect(errors.join('\n')).toMatch(/culprit's alibi must be broken/);
  });

  it('rejects solution text inside suspect prompt data', () => {
    const errors = errorsOf((c) => {
      c.suspects[0]!.private_knowledge.push(c.solution.method);
    });
    expect(errors.join('\n')).toMatch(/contains the solution text/);
  });

  it('rejects red herrings as required evidence', () => {
    const errors = errorsOf((c) => {
      c.solution.required_evidence = ['bloody-clock', 'racing-slips'];
    });
    expect(errors.join('\n')).toMatch(/red herring/);
  });

  it('rejects duplicate ids and out-of-order timelines', () => {
    const errors = errorsOf((c) => {
      c.evidence[1]!.id = 'bloody-clock';
      c.timeline[3]!.time = '18:00';
    });
    expect(errors.join('\n')).toMatch(/Duplicate id/);
    expect(errors.join('\n')).toMatch(/earlier than/);
  });

  it('rejects hotspots outside the scene', () => {
    expect(errorsOf((c) => (c.rooms[0]!.hotspots[0]!.x = 95)).join('\n')).toMatch(/outside the room/);
  });

  it('never throws on garbage input', () => {
    for (const junk of [null, 42, 'case', [], { schema_version: 1 }]) {
      const r = validateCase(junk);
      expect(r.ok).toBe(false);
      expect(r.errors.length).toBeGreaterThan(0);
    }
  });
});
