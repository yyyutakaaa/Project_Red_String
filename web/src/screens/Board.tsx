import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { CaseFile, Evidence, Suspect } from '@shared/caseSchema.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  addLink,
  checkTheory,
  hasLink,
  linkId,
  movePin,
  removeLink,
  summarizeTheory,
  syncPins,
  type TheorySummary,
} from '../engine/board.ts';
import type { BoardLink, BoardState, LinkStatus, PinKind } from '../engine/types.ts';
import { setBoard, useGame } from '../store/game.ts';
import { useReducedMotion, useSettings, type FontSize } from '../store/settings.ts';
import { sfx } from '../audio/audio.ts';
import { initials } from '../lib/format.ts';
import styles from './Board.module.css';

// ---------------------------------------------------------------------------
// Geometry (all in board units, the SVG viewBox is BOARD_WIDTH x BOARD_HEIGHT)

interface Pt {
  x: number;
  y: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface PinShape {
  id: string;
  kind: PinKind;
  name: string;
  /** Evidence: the name wrapped for the index card. Suspect: the name for the paper strip. */
  lines: string[];
  font: number;
  lineHeight: number;
  /** Card size (evidence) or name strip size (suspect). */
  width: number;
  height: number;
  /** Push-pin position relative to the pin centre; strings are tied here. */
  pushY: number;
  /** Connector knob position relative to the pin centre. */
  knob: Pt;
  /** Hit and clamp box relative to the pin centre. */
  box: Box;
  tilt: number;
  suspect: Suspect | null;
}

interface PinView {
  shape: PinShape;
  x: number;
  y: number;
}

interface DragSession {
  type: 'move' | 'link';
  id: string;
  pointerId: number;
  sx: number;
  sy: number;
  /** Offset from the pointer to the pin centre (move sessions). */
  ox: number;
  oy: number;
  moved: boolean;
}

interface Connecting {
  from: string;
  via: 'drag' | 'select';
}

const PHOTO_R = 40;
const PHOTO_CY = -12;
const STRIP_Y = 34;
const CARD_W = 172;
const CARD_PAD = 12;
const CARD_HEADER = 26;
const MONO = 0.6;
const KNOB_HIT = 26;
const DRAG_THRESHOLD = 6;
const NUDGE = 20;
const NUDGE_FAST = 60;
const EDGE = 4;
const TEXT_SCALE: Record<FontSize, number> = { small: 0.94, medium: 1, large: 1.12, xlarge: 1.25 };

const ELLIPSIS = String.fromCharCode(0x2026);
/** Toggled onto repeated announcements so screen readers read them again. */
const NBSP = String.fromCharCode(0xa0);

const r1 = (n: number) => Math.round(n * 10) / 10;

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, v + amount));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Word-wrap for a monospace label; long words are hyphenated, overflow ends in an ellipsis. */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const raw of text.trim().split(/\s+/).filter(Boolean)) {
    let word = raw;
    while (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }
      lines.push(`${word.slice(0, maxChars - 1)}-`);
      word = word.slice(maxChars - 1);
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1] ?? '';
  kept[maxLines - 1] = `${last.length >= maxChars ? last.slice(0, maxChars - 1) : last}${ELLIPSIS}`;
  return kept;
}

function suspectShape(s: Suspect, scale: number): PinShape {
  const font = 14 * scale;
  const charW = font * MONO;
  const maxChars = Math.floor(188 / charW);
  const label = s.name.length > maxChars ? `${s.name.slice(0, maxChars - 1)}${ELLIPSIS}` : s.name;
  const width = Math.max(100, Math.min(210, label.length * charW + 22));
  const height = Math.round(font * 1.9);
  const pushY = PHOTO_CY - PHOTO_R - 3;
  const knob = { x: 38, y: PHOTO_CY - 36 };
  return {
    id: s.id,
    kind: 'suspect',
    name: s.name,
    lines: [label],
    font,
    lineHeight: font,
    width,
    height,
    pushY,
    knob,
    box: {
      left: -Math.max(PHOTO_R + 6, width / 2),
      right: Math.max(knob.x + 12, width / 2),
      top: pushY - 10,
      bottom: STRIP_Y + height + 5,
    },
    tilt: (hash(s.id) % 30) / 10 - 1.5,
    suspect: s,
  };
}

function evidenceShape(e: Evidence, scale: number): PinShape {
  const font = 15 * scale;
  const lineHeight = font * 1.22;
  const maxChars = Math.max(6, Math.floor((CARD_W - CARD_PAD * 2) / (font * MONO)));
  const lines = wrapText(e.name, maxChars, 3);
  const height = Math.max(76, Math.round(CARD_HEADER + lines.length * lineHeight + 16));
  const top = -height / 2;
  const pushY = top + 5;
  return {
    id: e.id,
    kind: 'evidence',
    name: e.name,
    lines,
    font,
    lineHeight,
    width: CARD_W,
    height,
    pushY,
    knob: { x: CARD_W / 2 - 8, y: top + 8 },
    box: { left: -CARD_W / 2 - 2, right: CARD_W / 2 + 4, top: pushY - 10, bottom: height / 2 + 7 },
    tilt: (hash(e.id) % 50) / 10 - 2.5,
    suspect: null,
  };
}

/** Keep the whole pin (push-pin included) on the cork. */
function clampToBoard(shape: PinShape, x: number, y: number): Pt {
  return {
    x: Math.min(BOARD_WIDTH - shape.box.right - EDGE, Math.max(-shape.box.left + EDGE, x)),
    y: Math.min(BOARD_HEIGHT - shape.box.bottom - EDGE, Math.max(-shape.box.top + EDGE, y)),
  };
}

const anchorOf = (v: PinView): Pt => ({ x: v.x, y: v.y + v.shape.pushY });

const curve = (a: Pt, c: Pt, b: Pt) => `M${r1(a.x)} ${r1(a.y)} Q${r1(c.x)} ${r1(c.y)} ${r1(b.x)} ${r1(b.y)}`;

/** A slightly sagging string between two push-pins. */
function stringGeometry(a: Pt, b: Pt) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const sag = Math.min(80, 16 + Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
  const c = { x: mx, y: my + sag };
  // The point of a quadratic curve at t = 0.5.
  const mid = { x: mx, y: my + sag / 2 };
  const flip = (p: Pt) => ({ x: 2 * mid.x - p.x, y: 2 * mid.y - p.y });
  return {
    d: curve(a, c, b),
    // Mirror image of the curve through its midpoint. Invisible and inert; it makes the string's bounding box
    // symmetric around the midpoint, so "click the middle of this element" lands on the string itself.
    balance: curve(flip(a), flip(c), flip(b)),
    mid,
  };
}

function toBoardPoint(svg: SVGSVGElement | null, clientX: number, clientY: number): Pt | null {
  const ctm = svg?.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function pinAt(views: readonly PinView[], pt: Pt, exclude: string | null): string | null {
  for (let i = views.length - 1; i >= 0; i--) {
    const v = views[i];
    if (!v || v.shape.id === exclude) continue;
    const b = v.shape.box;
    if (pt.x >= v.x + b.left && pt.x <= v.x + b.right && pt.y >= v.y + b.top && pt.y <= v.y + b.bottom) return v.shape.id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Copy

type StatusKey = 'supported' | 'unsupported' | 'neutral' | 'unchecked';
const statusKey = (s: LinkStatus): StatusKey => s ?? 'unchecked';

const STATUS_LABEL: Record<StatusKey, string> = {
  supported: 'Supported by the evidence',
  unsupported: 'Not supported',
  neutral: 'Between people, needs evidence',
  unchecked: 'Not checked yet',
};

function summaryText(s: TheorySummary, total: number): string {
  if (total === 0) return 'No strings on the board. Nothing to check.';
  const parts = [
    `${s.supported} ${s.supported === 1 ? 'link' : 'links'} supported by the evidence`,
    `${s.unsupported} not supported`,
    `${s.neutral} between people (needs evidence)`,
  ];
  if (s.unchecked > 0) parts.push(`${s.unchecked} tied since the last check`);
  return `${parts.join(', ')}.`;
}

function verdictLine(s: TheorySummary, total: number): string {
  if (total === 0) return '';
  if (s.supported === 0) return 'Nothing on this board would stand up in court.';
  if (s.unsupported === 0 && s.unchecked === 0) return 'The string holds. For now.';
  return 'Some of it holds. Cut what does not.';
}

// ---------------------------------------------------------------------------
// Pin artwork

function PushPin({ y }: { y: number }) {
  return (
    <g className={styles.pushPin} transform={`translate(0 ${r1(y)})`}>
      <ellipse className={styles.pushShadow} cx={4} cy={5} rx={7.5} ry={4.5} />
      <circle className={styles.pushHead} r={7.5} />
      <circle className={styles.pushShine} cx={-2.4} cy={-2.6} r={2.4} />
    </g>
  );
}

function SuspectBody({ shape, uid }: { shape: PinShape; uid: string }) {
  const s = shape.suspect;
  if (!s) return null;
  const hat = s.portrait.includes('hat');
  const w = shape.width;
  const h = shape.height;
  return (
    <g>
      <circle className={styles.photoShadow} cx={3} cy={PHOTO_CY + 6} r={PHOTO_R + 4} />
      <circle className={styles.photoMount} cx={0} cy={PHOTO_CY} r={PHOTO_R + 5} />
      <g clipPath={`url(#${uid}-photo)`}>
        <circle cx={0} cy={PHOTO_CY} r={PHOTO_R} fill={`url(#${uid}-tint-${s.id})`} />
        <g className={styles.silhouette} transform={`translate(0 ${PHOTO_CY})`}>
          <path d="M-36 46 C-34 20 -18 12 0 12 C18 12 34 20 36 46 Z" />
          <rect x={-6} y={4} width={12} height={12} rx={4} />
          <ellipse cx={0} cy={-6} rx={13} ry={16} />
          {hat && (
            <>
              <ellipse cx={0} cy={-18} rx={25} ry={4.5} />
              <path d="M-14 -18 C-14 -32 -8 -35 0 -35 C8 -35 14 -32 14 -18 Z" />
            </>
          )}
        </g>
        <circle className={styles.photoGloss} cx={0} cy={PHOTO_CY} r={PHOTO_R} />
      </g>
      <text className={styles.initials} x={0} y={PHOTO_CY + 30}>
        {initials(s.name)}
      </text>
      <g transform={`rotate(${r1(shape.tilt)})`}>
        <rect className={styles.paperShadow} x={-w / 2 + 2} y={STRIP_Y + 4} width={w} height={h} />
        <rect className={styles.paper} x={-w / 2} y={STRIP_Y} width={w} height={h} rx={1.5} />
        <text className={styles.stripText} x={0} y={r1(STRIP_Y + h / 2 + shape.font * 0.36)} style={{ fontSize: shape.font }}>
          {shape.lines[0]}
        </text>
      </g>
    </g>
  );
}

function EvidenceBody({ shape, exhibit }: { shape: PinShape; exhibit: number }) {
  const w = shape.width;
  const h = shape.height;
  const top = -h / 2;
  const left = -w / 2;
  const block = shape.lines.length * shape.lineHeight;
  const avail = h - CARD_HEADER - 10;
  const first = top + CARD_HEADER + Math.max(0, (avail - block) / 2) + shape.font * 0.82;
  const ruleY = top + CARD_HEADER - 6;
  return (
    <g transform={`rotate(${r1(shape.tilt)})`}>
      <rect className={styles.paperShadow} x={left + 3} y={top + 6} width={w} height={h} rx={2} />
      <rect className={styles.paper} x={left} y={top} width={w} height={h} rx={2} />
      <line className={styles.cardRule} x1={left + 8} x2={left + w - 8} y1={ruleY} y2={ruleY} />
      <text className={styles.cardLabel} x={left + 10} y={top + 16}>
        {exhibit > 0 ? `EXHIBIT ${exhibit}` : 'EXHIBIT'}
      </text>
      <text className={styles.cardName} style={{ fontSize: shape.font }}>
        {shape.lines.map((line, i) => (
          <tspan key={i} x={0} y={r1(first + i * shape.lineHeight)}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function LegendSwatch({ status }: { status: StatusKey }) {
  return (
    <svg className={styles.swatch} viewBox="0 0 56 20" aria-hidden="true" focusable="false">
      <g className={styles[status]}>
        <path className={styles.line} d="M3 6 Q28 18 53 6" />
        {status === 'supported' && (
          <g className={styles.badge} transform="translate(28 12)">
            <circle r={6.5} />
            <path d="M-3 0.3 L-0.9 2.4 L3 -2.1" />
          </g>
        )}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------

export function Board() {
  const { caseFile, caseKey, progress } = useCaseContext();
  useAmbience('rain');
  const reducedMotion = useReducedMotion();
  const fontSize = useSettings((s) => s.fontSize);
  const [boardWidth, setBoardWidth] = useState(0);
  // SVG text shrinks with the board; on narrow screens (tablets) the labels are drawn larger to stay readable.
  const fit = boardWidth > 0 ? Math.round(Math.min(1.3, Math.max(1, 1000 / boardWidth)) * 20) / 20 : 1;
  const scale = Math.min(1.5, TEXT_SCALE[fontSize] * fit);
  const uid = `b${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const instructionsId = `${uid}-instructions`;
  const connectionsId = `${uid}-connections`;

  const svgRef = useRef<SVGSVGElement>(null);
  const session = useRef<DragSession | null>(null);
  const suppressClickUntil = useRef(0);
  const viewsRef = useRef<PinView[]>([]);

  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [connecting, setConnecting] = useState<Connecting | null>(null);
  const [pointer, setPointer] = useState<Pt | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState({ text: '', n: 0 });

  // Every suspect and every found item gets a pin. Saved back when that changed anything.
  const board = useMemo(
    () => syncPins(progress.board, caseFile, progress.foundEvidence),
    [progress.board, caseFile, progress.foundEvidence],
  );
  useEffect(() => {
    if (board !== progress.board) setBoard(caseKey, board);
  }, [board, progress.board, caseKey]);

  const shapes = useMemo(() => {
    const m = new Map<string, PinShape>();
    caseFile.suspects.forEach((s) => m.set(s.id, suspectShape(s, scale)));
    caseFile.evidence.forEach((e) => m.set(e.id, evidenceShape(e, scale)));
    return m;
  }, [caseFile, scale]);

  const views: PinView[] = board.pins.flatMap((pin) => {
    const shape = shapes.get(pin.id);
    if (!shape) return [];
    const raw = drag?.id === pin.id ? drag : pin;
    return [{ shape, ...clampToBoard(shape, raw.x, raw.y) }];
  });
  viewsRef.current = views;
  const viewById = new Map(views.map((v) => [v.shape.id, v]));

  const nameOf = (id: string) => shapes.get(id)?.name ?? id;
  const announce = (text: string) => setAnnouncement((a) => ({ text, n: a.n + 1 }));

  /** The freshest board from the store (handlers may run between renders). */
  const latestBoard = (): BoardState => {
    const p = useGame.getState().slot?.progress[caseKey];
    return p ? syncPins(p.board, caseFile, p.foundEvidence) : board;
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoardWidth(Math.round(w));
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  // Escape lets go of a string that is being tied, wherever focus is.
  useEffect(() => {
    if (!connecting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      session.current = null;
      setConnecting(null);
      setPointer(null);
      setHoverId(null);
      setAnnouncement((a) => ({ text: 'String put away.', n: a.n + 1 }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connecting]);

  const clearConnect = () => {
    setConnecting(null);
    setPointer(null);
    setHoverId(null);
  };

  const cancelConnect = () => {
    clearConnect();
    announce('String put away.');
  };

  const tie = (a: string, b: string) => {
    clearConnect();
    if (a === b) return;
    const current = latestBoard();
    if (hasLink(current, a, b)) {
      announce(`${nameOf(a)} and ${nameOf(b)} are already tied.`);
      return;
    }
    const next = addLink(current, a, b);
    if (next === current) return;
    setBoard(caseKey, next);
    sfx('string');
    if (!reducedMotion) setFresh(linkId(a, b));
    announce(`String tied: ${nameOf(a)} to ${nameOf(b)}.`);
  };

  const cut = (link: BoardLink) => {
    setBoard(caseKey, removeLink(latestBoard(), link.id));
    sfx('snap');
    announce(`String cut: ${nameOf(link.from)} to ${nameOf(link.to)}.`);
  };

  /** Click, tap, Enter or Space on a pin: start a string here, or finish the one in hand. */
  const activatePin = (id: string) => {
    if (!connecting) {
      setConnecting({ from: id, via: 'select' });
      setHoverId(null);
      announce(`Tying from ${nameOf(id)}. Pick the other end, or press Escape.`);
      return;
    }
    if (connecting.from === id) {
      cancelConnect();
      return;
    }
    tie(connecting.from, id);
  };

  const nudge = (id: string, dx: number, dy: number) => {
    const current = latestBoard();
    const pin = current.pins.find((p) => p.id === id);
    const shape = shapes.get(id);
    if (!pin || !shape) return;
    const from = clampToBoard(shape, pin.x, pin.y);
    const to = clampToBoard(shape, from.x + dx, from.y + dy);
    if (to.x === from.x && to.y === from.y) return;
    setBoard(caseKey, movePin(current, id, to.x, to.y));
  };

  // --- pointer sessions (mouse, pen and touch alike)

  const capture = (e: ReactPointerEvent<Element>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer is already gone */
    }
  };

  const startMove = (e: ReactPointerEvent<SVGGElement>, v: PinView) => {
    if (e.button !== 0) return;
    suppressClickUntil.current = 0;
    const pt = toBoardPoint(svgRef.current, e.clientX, e.clientY);
    if (!pt) return;
    session.current = {
      type: 'move',
      id: v.shape.id,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: v.x - pt.x,
      oy: v.y - pt.y,
      moved: false,
    };
    capture(e);
  };

  const startLink = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    suppressClickUntil.current = 0;
    session.current = { type: 'link', id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, moved: false };
    capture(e);
  };

  const onSessionMove = (e: ReactPointerEvent<SVGGElement>) => {
    const s = session.current;
    if (!s || s.pointerId !== e.pointerId) return;
    if (!s.moved) {
      if (Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < DRAG_THRESHOLD) return;
      s.moved = true;
      if (s.type === 'link') setConnecting({ from: s.id, via: 'drag' });
    }
    const pt = toBoardPoint(svgRef.current, e.clientX, e.clientY);
    if (!pt) return;
    if (s.type === 'move') {
      setDrag({ id: s.id, x: pt.x + s.ox, y: pt.y + s.oy });
    } else {
      setPointer(pt);
      setHoverId(pinAt(viewsRef.current, pt, s.id));
    }
  };

  const onSessionEnd = (e: ReactPointerEvent<SVGGElement>) => {
    const s = session.current;
    if (!s || s.pointerId !== e.pointerId) return;
    session.current = null;
    // A press that never moved is a click; the click handler takes it from here.
    if (!s.moved) return;
    // Swallow the click the browser sends after a drag (event time stamps share one clock).
    suppressClickUntil.current = e.timeStamp + 500;
    const pt = toBoardPoint(svgRef.current, e.clientX, e.clientY);
    if (s.type === 'move') {
      setDrag(null);
      const shape = shapes.get(s.id);
      if (!pt || !shape) return;
      const pos = clampToBoard(shape, pt.x + s.ox, pt.y + s.oy);
      setBoard(caseKey, movePin(latestBoard(), s.id, pos.x, pos.y));
      sfx('pin');
      return;
    }
    const target = pt ? pinAt(viewsRef.current, pt, s.id) : null;
    if (target) tie(s.id, target);
    else {
      clearConnect();
      announce('The string falls loose. Drop it on a pin.');
    }
  };

  const onSessionCancel = (e: ReactPointerEvent<SVGGElement>) => {
    const s = session.current;
    if (!s || s.pointerId !== e.pointerId) return;
    session.current = null;
    setDrag(null);
    if (s.type === 'link' && s.moved) clearConnect();
  };

  const onPinClick = (e: ReactMouseEvent<SVGGElement>, id: string) => {
    if (e.timeStamp < suppressClickUntil.current) {
      suppressClickUntil.current = 0;
      return;
    }
    activatePin(id);
  };

  const onPinKeyDown = (e: ReactKeyboardEvent<SVGGElement>, id: string) => {
    const step = e.shiftKey ? NUDGE_FAST : NUDGE;
    let dx = 0;
    let dy = 0;
    switch (e.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (!e.repeat) activatePin(id);
        return;
      default:
        return;
    }
    e.preventDefault();
    nudge(id, dx, dy);
  };

  // Follow the mouse with a loose string while picking the second pin.
  const onBoardPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (connecting?.via !== 'select' || e.pointerType !== 'mouse') return;
    const pt = toBoardPoint(svgRef.current, e.clientX, e.clientY);
    if (!pt) return;
    setPointer(pt);
    setHoverId(pinAt(viewsRef.current, pt, connecting.from));
  };

  const onBoardPointerLeave = () => {
    if (connecting?.via !== 'select') return;
    setPointer(null);
    setHoverId(null);
  };

  // --- strings

  const onLinkClick = (link: BoardLink) => {
    if (connecting) {
      cancelConnect();
      return;
    }
    cut(link);
  };

  const onLinkKeyDown = (e: ReactKeyboardEvent<SVGGElement>, link: BoardLink) => {
    if (!['Delete', 'Backspace', 'Enter', ' ', 'Spacebar'].includes(e.key)) return;
    e.preventDefault();
    if (e.repeat) return;
    const ids = board.links.map((l) => l.id);
    const index = ids.indexOf(link.id);
    const nextId = ids[index + 1] ?? ids[index - 1] ?? null;
    cut(link);
    // Keep the keyboard on the board: the next string, or the first pin.
    requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const nextEl = nextId ? svg.querySelector<SVGGElement>(`[data-link-id="${CSS.escape(nextId)}"]`) : null;
      (nextEl ?? svg.querySelector<SVGGElement>('[data-pin-id]'))?.focus();
    });
  };

  const onCheck = () => {
    setBoard(caseKey, checkTheory(latestBoard(), caseFile));
    setFresh(null);
    sfx('page');
  };

  const onClear = () => {
    setBoard(caseKey, { ...latestBoard(), links: [], lastCheckedAt: null });
    setConfirmClear(false);
    clearConnect();
    setFresh(null);
    sfx('snap');
    announce('Board cleared. Every string is down.');
  };

  // --- derived view

  const summary = summarizeTheory(board);
  const checked = board.lastCheckedAt !== null;
  const linkCount = board.links.length;

  let liveString: string | null = null;
  if (connecting) {
    const source = viewById.get(connecting.from);
    const targetId = hoverId ?? (connecting.via === 'select' && focusedId !== connecting.from ? focusedId : null);
    const target = targetId ? viewById.get(targetId) : undefined;
    const end = target ? anchorOf(target) : pointer;
    if (source && end) liveString = stringGeometry(anchorOf(source), end).d;
  }

  return (
    <ScreenFrame
      title="The board"
      kicker={caseFile.title}
      actions={
        <>
          <Button variant="primary" data-testid="check-theory" onClick={onCheck}>
            Check theory
          </Button>
          <Button onClick={() => setConfirmClear(true)} disabled={linkCount === 0} aria-haspopup="dialog">
            Clear strings
          </Button>
        </>
      }
    >
      <div className={styles.layout}>
        <p id={instructionsId} className={styles.instructions}>
          Drag a pin to move it. Drag from a red knob to another pin to tie a string, or tap two pins in turn. Tap a
          string to cut it. Keyboard: Tab to a pin, arrows move it, Enter ties, Escape lets go.
        </p>

        <div
          className={`${styles.summary} ${checked ? styles.summaryChecked : ''}`}
          data-testid="theory-summary"
          role="status"
          aria-live="polite"
        >
          {checked ? (
            <>
              <span className={styles.summaryLabel}>Theory checked:</span>{' '}
              <span className={styles.summaryText}>{summaryText(summary, linkCount)}</span>{' '}
              {verdictLine(summary, linkCount) && <span className={styles.summaryVerdict}>{verdictLine(summary, linkCount)}</span>}
            </>
          ) : (
            <span className={styles.summaryText}>No verdict yet. Tie your strings, then check the theory.</span>
          )}
        </div>

        {progress.foundEvidence.length === 0 && (
          <aside className={styles.tip} aria-label="Tip">
            <p>
              Only faces on the cork so far. Search the scenes; whatever you find gets pinned here. Strings between
              people prove nothing on their own.
            </p>
            <ButtonLink to={casePath(caseKey, 'rooms')} size="small" variant="lamp">
              Search the scenes
            </ButtonLink>
          </aside>
        )}

        {/* Fixed height, so the board never jumps between the first and the second tap. */}
        <div className={`${styles.hand} ${connecting ? styles.handActive : ''}`}>
          {connecting ? (
            <>
              <span>
                Tying from <strong>{nameOf(connecting.from)}</strong>.{' '}
                {connecting.via === 'drag' ? 'Drop it on another pin.' : 'Pick the other end.'}
              </span>
              {connecting.via === 'select' && (
                <Button size="small" variant="ghost" onClick={cancelConnect}>
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <span>No string in hand.</span>
          )}
        </div>

        <div className={styles.frame}>
          <div className={styles.cork}>
            <svg
              ref={svgRef}
              className={styles.svg}
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              role="group"
              aria-label="Red-string board"
              aria-describedby={instructionsId}
              data-connecting={connecting ? 'true' : undefined}
              onPointerMove={onBoardPointerMove}
              onPointerLeave={onBoardPointerLeave}
            >
              <BoardDefs uid={uid} caseFile={caseFile} />
              <rect
                className={styles.backdrop}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                onPointerDown={() => {
                  if (connecting?.via === 'select') cancelConnect();
                }}
              />

              <g className={styles.strings}>
                {board.links.map((link) => {
                  const a = viewById.get(link.from);
                  const b = viewById.get(link.to);
                  if (!a || !b) return null;
                  const geo = stringGeometry(anchorOf(a), anchorOf(b));
                  const status = statusKey(link.status);
                  const isFresh = fresh === link.id && status === 'unchecked';
                  return (
                    <g
                      key={link.id}
                      className={`${styles.link} ${styles[status] ?? ''} ${isFresh ? styles.fresh : ''}`}
                      tabIndex={0}
                      role="button"
                      aria-label={`String from ${nameOf(link.from)} to ${nameOf(link.to)}. Press Delete to remove.`}
                      data-testid={`link-${link.id}`}
                      data-link-id={link.id}
                      data-status={status}
                      onClick={() => onLinkClick(link)}
                      onKeyDown={(e) => onLinkKeyDown(e, link)}
                      onAnimationEnd={() => setFresh((f) => (f === link.id ? null : f))}
                    >
                      <title>{`${STATUS_LABEL[status]}. Click to cut.`}</title>
                      <path className={styles.balance} d={geo.balance} />
                      <path className={styles.shadowWide} d={geo.d} transform="translate(3 7)" />
                      <path className={styles.shadow} d={geo.d} transform="translate(2 5)" pathLength={isFresh ? 1 : undefined} />
                      <path className={styles.focusHalo} d={geo.d} />
                      {status === 'supported' && <path className={styles.glow} d={geo.d} />}
                      <path className={styles.line} d={geo.d} pathLength={isFresh ? 1 : undefined} />
                      <path className={styles.hit} d={geo.d} />
                      {status === 'supported' && (
                        <g className={styles.badge} transform={`translate(${r1(geo.mid.x)} ${r1(geo.mid.y)})`}>
                          <circle r={11} />
                          <path d="M-5 0.5 L-1.5 4 L5 -3.5" />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {liveString && <path className={styles.live} d={liveString} />}

              <g className={styles.pins}>
                {views.map((v) => {
                  const { shape } = v;
                  const id = shape.id;
                  const isSource = connecting?.from === id;
                  const isTarget =
                    !!connecting &&
                    connecting.from !== id &&
                    (hoverId === id || (connecting.via === 'select' && hoverId === null && focusedId === id));
                  const isDragging = drag?.id === id;
                  const className = [
                    styles.pin,
                    isSource ? styles.source : '',
                    isTarget ? styles.target : '',
                    isDragging ? styles.dragging : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const exhibit = progress.foundEvidence.indexOf(id) + 1;
                  return (
                    <g
                      key={id}
                      className={className}
                      transform={`translate(${r1(v.x)} ${r1(v.y)})`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${shape.name}, ${shape.kind}. Press Enter to connect, arrow keys to move.`}
                      data-testid={`pin-${id}`}
                      data-pin-id={id}
                      data-kind={shape.kind}
                      onPointerDown={(e) => startMove(e, v)}
                      onPointerMove={onSessionMove}
                      onPointerUp={onSessionEnd}
                      onPointerCancel={onSessionCancel}
                      onLostPointerCapture={onSessionCancel}
                      onClick={(e) => onPinClick(e, id)}
                      onKeyDown={(e) => onPinKeyDown(e, id)}
                      onFocus={() => setFocusedId(id)}
                      onBlur={() => setFocusedId((f) => (f === id ? null : f))}
                    >
                      <rect
                        className={styles.pinFocus}
                        x={shape.box.left - 6}
                        y={shape.box.top - 2}
                        width={shape.box.right - shape.box.left + 12}
                        height={shape.box.bottom - shape.box.top + 6}
                        rx={10}
                      />
                      <g filter={isDragging ? `url(#${uid}-lift)` : undefined}>
                        {shape.kind === 'suspect' ? <SuspectBody shape={shape} uid={uid} /> : <EvidenceBody shape={shape} exhibit={exhibit} />}
                      </g>
                      <PushPin y={shape.pushY} />
                      <g
                        className={styles.handle}
                        transform={`translate(${r1(shape.knob.x)} ${r1(shape.knob.y)})`}
                        data-testid={`pin-handle-${id}`}
                        onPointerDown={(e) => startLink(e, id)}
                      >
                        <circle className={styles.handleHit} r={KNOB_HIT} />
                        <circle className={styles.handleRing} r={11} />
                        <circle className={styles.handleKnob} r={7} />
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        <ul className={styles.legend} aria-label="Legend">
          {(['unchecked', 'supported', 'unsupported', 'neutral'] as const).map((s) => (
            <li key={s}>
              <LegendSwatch status={s} />
              <span>{STATUS_LABEL[s]}</span>
            </li>
          ))}
        </ul>

        <section className={styles.connections} aria-labelledby={connectionsId}>
          <h2 id={connectionsId}>
            Connections <span className={styles.count}>({linkCount})</span>
          </h2>
          {linkCount === 0 ? (
            <p className={styles.empty}>No string up yet. Tie a suspect to the evidence that names them.</p>
          ) : (
            <ul className={styles.connectionList}>
              {board.links.map((link) => {
                const status = statusKey(link.status);
                return (
                  <li key={link.id} className={styles.connection}>
                    <span className={styles.connectionNames}>
                      {nameOf(link.from)} <span className={styles.connectionTo}>to</span> {nameOf(link.to)}
                    </span>
                    <span className={`${styles.connectionStatus} ${styles[`status_${status}`] ?? ''}`}>{STATUS_LABEL[status]}</span>
                    <Button
                      variant="ghost"
                      onClick={() => cut(link)}
                      aria-label={`Remove string from ${nameOf(link.from)} to ${nameOf(link.to)}`}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement.text}
          {announcement.n % 2 === 1 ? NBSP : ''}
        </p>
      </div>

      <Modal
        open={confirmClear}
        title="Pull down every string?"
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Keep them
            </Button>
            <Button variant="primary" onClick={onClear}>
              Clear strings
            </Button>
          </>
        }
      >
        <p>
          {linkCount === 1 ? 'One string comes down.' : `${linkCount} strings come down.`} The pins stay where they are.
          There is no undo.
        </p>
      </Modal>
    </ScreenFrame>
  );
}

function BoardDefs({ uid, caseFile }: { uid: string; caseFile: CaseFile }) {
  return (
    <defs>
      <clipPath id={`${uid}-photo`}>
        <circle cx={0} cy={PHOTO_CY} r={PHOTO_R} />
      </clipPath>
      {caseFile.suspects.map((s) => (
        <radialGradient key={s.id} id={`${uid}-tint-${s.id}`} cx="38%" cy="30%" r="85%">
          <stop offset="0%" stopColor={shade(s.color, 55)} />
          <stop offset="55%" stopColor={s.color} />
          <stop offset="100%" stopColor={shade(s.color, -70)} />
        </radialGradient>
      ))}
      <filter id={`${uid}-lift`} x="-30%" y="-30%" width="160%" height="175%">
        <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.55" />
      </filter>
    </defs>
  );
}
