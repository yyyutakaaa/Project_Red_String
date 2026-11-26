import { parseCondition, type CaseFile, type Evidence } from '@shared/caseSchema.ts';
import type { AutoReason, BoardLink, BoardPin, BoardState, CaseProgress, LinkStatus, PinKind, TheoryCount } from './types.ts';

export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 760;

export function emptyBoard(): BoardState {
  return { pins: [], links: [], lastCheckedAt: null };
}

export function linkId(a: string, b: string): string {
  return [a, b].sort().join('~');
}

function defaultPosition(kind: PinKind, index: number): { x: number; y: number } {
  if (kind === 'suspect') {
    return { x: 150 + (index % 5) * 220, y: 110 + Math.floor(index / 5) * 150 };
  }
  const col = index % 6;
  const row = Math.floor(index / 6);
  // Evidence prints are about 150 tall; rows sit far enough apart not to overlap.
  return { x: 110 + col * 190 + (row % 2) * 60, y: 320 + row * 185 };
}

/** Ensure every suspect and every found evidence item has a pin; keeps existing positions. */
export function syncPins(board: BoardState, c: CaseFile, foundEvidence: readonly string[]): BoardState {
  const existing = new Map(board.pins.map((p) => [p.id, p]));
  const pins: BoardPin[] = [];
  c.suspects.forEach((s, i) => pins.push(existing.get(s.id) ?? { id: s.id, kind: 'suspect', ...defaultPosition('suspect', i) }));
  const evidenceIds = c.evidence.map((e) => e.id).filter((id) => foundEvidence.includes(id));
  // Evidence turns up one piece at a time, so a new print takes the first default spot that is still
  // free. (Placing it by its index in the list would drop it right on top of an earlier one.)
  const taken = (pos: { x: number; y: number }) => pins.some((p) => Math.abs(p.x - pos.x) < 90 && Math.abs(p.y - pos.y) < 90);
  for (const id of evidenceIds) {
    const kept = existing.get(id);
    if (!kept) continue;
    // Older saves can hold two prints on exactly the same spot (see above). Treat the second as new.
    const stacked = pins.some((p) => p.kind === 'evidence' && Math.abs(p.x - kept.x) < 1 && Math.abs(p.y - kept.y) < 1);
    if (stacked) existing.delete(id);
    else pins.push(kept);
  }
  for (const id of evidenceIds) {
    if (existing.has(id)) continue;
    let slot = 0;
    while (slot < 60 && taken(defaultPosition('evidence', slot))) slot += 1;
    pins.push({ id, kind: 'evidence', ...defaultPosition('evidence', slot) });
  }
  // Keep the case file's order, whatever order the pins were added in.
  const order = new Map<string, number>([...c.suspects.map((s) => s.id), ...evidenceIds].map((id, i) => [id, i]));
  pins.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const pinIds = new Set(pins.map((p) => p.id));
  const links = board.links.filter((l) => pinIds.has(l.from) && pinIds.has(l.to));
  const unchanged = pins.length === board.pins.length && links.length === board.links.length && pins.every((p, i) => p === board.pins[i]);
  return unchanged ? board : { ...board, pins, links };
}

export function movePin(board: BoardState, id: string, x: number, y: number): BoardState {
  const cx = Math.max(40, Math.min(BOARD_WIDTH - 40, x));
  const cy = Math.max(40, Math.min(BOARD_HEIGHT - 40, y));
  return { ...board, pins: board.pins.map((p) => (p.id === id ? { ...p, x: cx, y: cy } : p)) };
}

export function hasLink(board: BoardState, a: string, b: string): boolean {
  const id = linkId(a, b);
  return board.links.some((l) => l.id === id);
}

export function addLink(board: BoardState, from: string, to: string): BoardState {
  if (from === to) return board;
  const pinIds = new Set(board.pins.map((p) => p.id));
  if (!pinIds.has(from) || !pinIds.has(to)) return board;
  if (hasLink(board, from, to)) return board;
  const link: BoardLink = { id: linkId(from, to), from, to, status: null };
  return { ...board, links: [...board.links, link] };
}

/** Cut a string. One the board tied by itself is remembered, so it is not tied again. */
export function removeLink(board: BoardState, id: string): BoardState {
  const link = board.links.find((l) => l.id === id);
  const links = board.links.filter((l) => l.id !== id);
  if (!link?.auto) return { ...board, links };
  const cutAuto = board.cutAuto?.includes(id) ? board.cutAuto : [...(board.cutAuto ?? []), id];
  return { ...board, links, cutAuto };
}

// ---------------------------------------------------------------------------
// Strings the board ties by itself. They record what the player found out, never the answer:
// a piece of evidence that names someone, evidence a suspect handed over, evidence a suspect gave way
// to, and evidence that led to more evidence. Whether a string holds is still for the player to test.

const TITLES = new Set(['mr', 'mrs', 'miss', 'ms', 'dr', 'judge', 'doctor', 'sir', 'lady', 'lord']);

/** Words that name one suspect and nobody or nothing else in the case (first names, unshared surnames). */
function nameWords(c: CaseFile): Map<string, string> {
  const taken = new Set<string>();
  const words = (text: string) => text.toLowerCase().split(/[^a-z\u00c0-\u024f']+/).filter(Boolean);
  for (const w of [...words(c.victim.name), ...words(c.title), ...c.rooms.flatMap((r) => words(r.name))]) taken.add(w);
  const owners = new Map<string, Set<string>>();
  for (const s of c.suspects) {
    for (const w of words(s.name)) {
      if (w.length < 3 || TITLES.has(w) || taken.has(w)) continue;
      owners.set(w, (owners.get(w) ?? new Set()).add(s.id));
    }
  }
  const out = new Map<string, string>();
  for (const [w, ids] of owners) if (ids.size === 1) out.set(w, [...ids][0]!);
  return out;
}

/**
 * The suspects a piece of evidence names, by a first name or a surname only they carry. Evidence that
 * names more than two of them (a guest list, a programme) is about everyone and ties nobody.
 */
export function suspectsNamedIn(c: CaseFile, e: Evidence): string[] {
  const words = nameWords(c);
  const text = ` ${e.name} ${e.description} `.toLowerCase();
  const ids = new Set<string>();
  for (const [w, id] of words) {
    if (new RegExp(`(^|[^a-z\u00c0-\u024f])${w}('s)?([^a-z\u00c0-\u024f]|$)`).test(text)) ids.add(id);
  }
  return ids.size > 2 ? [] : [...ids];
}

export interface AutoLink {
  from: string;
  to: string;
  reason: AutoReason;
}

/** Every string the board ties by itself for this run so far. Pass the English case. */
export function autoLinks(c: CaseFile, p: Pick<CaseProgress, 'foundEvidence' | 'revealedClues' | 'conversations'>): AutoLink[] {
  const found = new Set(p.foundEvidence);
  const out = new Map<string, AutoLink>();
  const add = (from: string, to: string, reason: AutoReason) => {
    const id = linkId(from, to);
    if (from !== to && !out.has(id)) out.set(id, { from, to, reason });
  };
  for (const s of c.suspects) {
    for (const clue of s.revealable_clues) {
      if (!p.revealedClues.includes(clue.clue_id)) continue;
      const cond = parseCondition(clue.condition);
      const gave = clue.evidence_id && found.has(clue.evidence_id) ? clue.evidence_id : null;
      if (gave) add(s.id, gave, 'handed');
      if (cond.kind === 'shown_evidence' && found.has(cond.evidenceId)) {
        add(s.id, cond.evidenceId, 'reacted');
        if (gave) add(cond.evidenceId, gave, 'led');
      }
    }
    const conv = p.conversations[s.id];
    for (const [e, effect] of Object.entries(conv?.evidenceEffects ?? {})) if (effect === 'gave' && found.has(e)) add(s.id, e, 'reacted');
    for (const lie of conv?.caughtLies ?? []) if (found.has(lie.evidenceId)) add(s.id, lie.evidenceId, 'reacted');
  }
  for (const e of c.evidence) {
    if (!found.has(e.id)) continue;
    for (const s of suspectsNamedIn(c, e)) add(s, e.id, 'named');
  }
  return [...out.values()];
}

/** Tie the strings the board knows about that are not on it yet, unless the player cut them before. */
export function syncAutoLinks(board: BoardState, links: readonly AutoLink[]): BoardState {
  const pinIds = new Set(board.pins.map((p) => p.id));
  const have = new Set(board.links.map((l) => l.id));
  const cut = new Set(board.cutAuto ?? []);
  const added: BoardLink[] = [];
  for (const a of links) {
    const id = linkId(a.from, a.to);
    if (have.has(id) || cut.has(id) || !pinIds.has(a.from) || !pinIds.has(a.to)) continue;
    have.add(id);
    added.push({ id, from: a.from, to: a.to, status: null, auto: a.reason });
  }
  return added.length ? { ...board, links: [...board.links, ...added] } : board;
}

/**
 * Check one connection against the case's points_to data.
 * suspect-evidence: supported when the evidence points to that suspect.
 * evidence-evidence: supported when both items point to at least one common suspect.
 * suspect-suspect: neutral (evidence is needed to support a link between people).
 */
export function checkLink(c: CaseFile, a: string, b: string): LinkStatus {
  const ev = (id: string) => c.evidence.find((e) => e.id === id);
  const isSuspect = (id: string) => c.suspects.some((s) => s.id === id);
  const ea = ev(a);
  const eb = ev(b);
  if (ea && eb) return ea.points_to.some((s) => eb.points_to.includes(s)) ? 'supported' : 'unsupported';
  if (ea && isSuspect(b)) return ea.points_to.includes(b) ? 'supported' : 'unsupported';
  if (eb && isSuspect(a)) return eb.points_to.includes(a) ? 'supported' : 'unsupported';
  if (isSuspect(a) && isSuspect(b)) return 'neutral';
  return 'unsupported';
}

/** Free checks per run. A check gives the totals and nothing else, so it cannot be used as an answer key. */
export const FREE_CHECKS = 3;

export function checksLeft(board: BoardState): number {
  return Math.max(0, FREE_CHECKS - (board.checksUsed ?? 0));
}

/** How many strings hold, do not hold, or only join two people. */
export function countTheory(board: BoardState, c: CaseFile): TheoryCount {
  const out: TheoryCount = { total: board.links.length, supported: 0, unsupported: 0, neutral: 0 };
  for (const l of board.links) {
    const status = checkLink(c, l.from, l.to);
    if (status) out[status]++;
  }
  return out;
}

/** A free check: the totals only. No string is marked, and old marks come off. */
export function checkTheory(board: BoardState, c: CaseFile, now = Date.now()): BoardState {
  if (checksLeft(board) === 0) return board;
  return {
    ...board,
    links: board.links.map((l) => (l.status === null ? l : { ...l, status: null })),
    lastCheck: countTheory(board, c),
    checksUsed: (board.checksUsed ?? 0) + 1,
    lastCheckedAt: now,
  };
}

/** Mark every string as holding or not. This is the answer key, so it costs as much as a hint. */
export function markTheory(board: BoardState, c: CaseFile, now = Date.now()): BoardState {
  return {
    ...board,
    links: board.links.map((l) => ({ ...l, status: checkLink(c, l.from, l.to) })),
    lastCheck: countTheory(board, c),
    lastCheckedAt: now,
  };
}

export interface TheorySummary {
  supported: number;
  unsupported: number;
  neutral: number;
  unchecked: number;
}

export function summarizeTheory(board: BoardState): TheorySummary {
  const out: TheorySummary = { supported: 0, unsupported: 0, neutral: 0, unchecked: 0 };
  for (const l of board.links) {
    if (l.status === null) out.unchecked++;
    else out[l.status]++;
  }
  return out;
}
