import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { addLink, checkLink, checkTheory, emptyBoard, movePin, removeLink, summarizeTheory, syncPins } from '../board.ts';
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
    expect(summarizeTheory(b)).toEqual({ supported: 1, unsupported: 1, neutral: 1, unchecked: 0 });
    b = addLink(b, 'ben', 'racing-slips');
    expect(summarizeTheory(b).unchecked).toBe(1);
  });

  it('clamps pins to the board', () => {
    let b = syncPins(emptyBoard(), c, []);
    b = movePin(b, 'nora', -500, 99999);
    const p = b.pins.find((x) => x.id === 'nora')!;
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThan(99999);
  });
});
