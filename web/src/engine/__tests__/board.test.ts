import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { FREE_CHECKS, addLink, checkLink, checkTheory, checksLeft, emptyBoard, markTheory, movePin, removeLink, summarizeTheory, syncPins } from '../board.ts';
import { miniCase } from './fixtures/miniCase.ts';

const c = CaseFile.parse(miniCase());

describe('red-string board', () => {
  it('creates pins for suspects and found evidence only', () => {
    const b = syncPins(emptyBoard(), c, ['pawn-ticket']);
    expect(b.pins.map((p) => p.id).sort()).toEqual(['ben', 'nora', 'pawn-ticket']);
  });

  it('keeps positions when syncing again', () => {
    let b = syncPins(emptyBoard(), c, ['pawn-ticket']);
    b = movePin(b, 'nora', 300, 300);
    b = syncPins(b, c, ['pawn-ticket', 'bloody-clock']);
    expect(b.pins.find((p) => p.id === 'nora')).toMatchObject({ x: 300, y: 300 });
    expect(b.pins).toHaveLength(4);
  });

  it('gives every print its own spot when evidence turns up one piece at a time', () => {
    const ids = c.evidence.map((e) => e.id);
    // Found in reverse order: placing by list index would stack them.
    let b = emptyBoard();
    const found: string[] = [];
    for (const id of [...ids].reverse()) {
      found.push(id);
      b = syncPins(b, c, found);
    }
    const spots = b.pins.filter((p) => p.kind === 'evidence').map((p) => `${p.x},${p.y}`);
    expect(new Set(spots).size).toBe(ids.length);
  });

  it('pulls apart prints that an older save stacked on one spot', () => {
    const ids = c.evidence.map((e) => e.id).slice(0, 2);
    const b0 = syncPins(emptyBoard(), c, ids);
    const first = b0.pins.find((p) => p.id === ids[0])!;
    const stacked = { ...b0, pins: b0.pins.map((p) => (p.id === ids[1] ? { ...p, x: first.x, y: first.y } : p)) };
    const fixed = syncPins(stacked, c, ids);
    const a = fixed.pins.find((p) => p.id === ids[0])!;
    const z = fixed.pins.find((p) => p.id === ids[1])!;
    expect(a).toMatchObject({ x: first.x, y: first.y });
    expect(`${z.x},${z.y}`).not.toBe(`${a.x},${a.y}`);
  });

  it('adds, deduplicates and removes links', () => {
    let b = syncPins(emptyBoard(), c, ['pawn-ticket', 'racing-slips']);
    b = addLink(b, 'nora', 'pawn-ticket');
    b = addLink(b, 'pawn-ticket', 'nora');
    b = addLink(b, 'nora', 'nora');
    b = addLink(b, 'nora', 'not-a-pin');
    expect(b.links).toHaveLength(1);
    b = removeLink(b, b.links[0]!.id);
    expect(b.links).toHaveLength(0);
  });

  it('checks links against points_to', () => {
    expect(checkLink(c, 'nora', 'pawn-ticket')).toBe('supported');
    expect(checkLink(c, 'pawn-ticket', 'ben')).toBe('unsupported');
    expect(checkLink(c, 'bloody-clock', 'pawn-ticket')).toBe('supported');
    expect(checkLink(c, 'bloody-clock', 'racing-slips')).toBe('unsupported');
    expect(checkLink(c, 'nora', 'ben')).toBe('neutral');
  });

  it('marks a confirmed theory', () => {
    let b = syncPins(emptyBoard(), c, ['pawn-ticket', 'racing-slips']);
    b = addLink(b, 'nora', 'pawn-ticket');
    b = addLink(b, 'nora', 'racing-slips');
    b = addLink(b, 'nora', 'ben');
    b = checkTheory(b, c, 123);
    expect(b.lastCheckedAt).toBe(123);
    // A free check counts and marks nothing.
    expect(b.lastCheck).toEqual({ total: 3, supported: 1, unsupported: 1, neutral: 1 });
    expect(summarizeTheory(b)).toEqual({ supported: 0, unsupported: 0, neutral: 0, unchecked: 3 });
    expect(checksLeft(b)).toBe(FREE_CHECKS - 1);
    // Marking the strings is the paid answer key.
    b = markTheory(b, c, 456);
    expect(summarizeTheory(b)).toEqual({ supported: 1, unsupported: 1, neutral: 1, unchecked: 0 });
    b = addLink(b, 'ben', 'racing-slips');
    expect(summarizeTheory(b).unchecked).toBe(1);
  });

  it('runs out of free checks', () => {
    let b = syncPins(emptyBoard(), c, ['pawn-ticket']);
    b = addLink(b, 'nora', 'pawn-ticket');
    for (let i = 0; i < FREE_CHECKS; i++) b = checkTheory(b, c, i + 1);
    expect(checksLeft(b)).toBe(0);
    expect(checkTheory(b, c, 99)).toBe(b);
  });

  it('clamps pins to the board', () => {
    let b = syncPins(emptyBoard(), c, []);
    b = movePin(b, 'nora', -500, 99999);
    const p = b.pins.find((x) => x.id === 'nora')!;
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThan(99999);
  });
});
