// Furnishing a room.
//
// A case file gives every hotspot a rectangle. Those rectangles were written for clicking, not for
// carpentry: drawn as they stand, a door ends up in the middle of the floor with a cabinet behind
// it, a staircase floats in the centre of the room, a brandy glass hangs in mid-air. Things look
// pasted on.
//
// So the rectangles are only a hint (which things there are, and roughly left or right). This
// module lays the room out the way someone would furnish it:
//
//   1. The back wall. Doors and stairs go to the sides, never the middle. Whatever stands against
//      the wall (bookcase, cabinet, fireplace, boiler, piano) is lined up along it, side by side,
//      nothing in front of a door.
//   2. On the wall. Windows, pictures, clocks and boards hang in the free stretches of wall, or
//      above low furniture, never across a door or a bookcase.
//   3. On the floor. Desks, tables, beds and chairs stand free in one or two rows, with the way to
//      every door kept clear. A chair goes to its desk.
//   4. Small things. A glass, a letter, a telephone goes on top of a piece of furniture. When no
//      surface is left it gets a shelf on the wall, or a small table of its own. Things that were
//      dropped (a glove, a revolver, a torn letter) lie on the floor.
//
// It also keeps proportions sane: a door is taller than wide whatever the rectangle says, and a
// ledger is not the size of a bed. Pure geometry: no React.
import type { PropKind } from './Props.tsx';

export const SCENE_W = 1000;
export const SCENE_H = 600;
/** Where the back wall meets the floor. */
export const SCENE_HORIZON = 372;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Seat = 'wall' | 'opening' | 'floor' | 'flat' | 'ceiling' | 'small';

/** Lowest a wall-hung thing may reach: just above the skirting board. */
const WALL_BOTTOM = SCENE_HORIZON - 30;
const WALL_TOP = 18;

const WALL_KINDS = new Set<PropKind>(['window', 'painting', 'mirror', 'keyrack', 'booth', 'wall', 'grating']);
const OPENING_KINDS = new Set<PropKind>(['door', 'elevator', 'curtain']);
const FLAT_KINDS = new Set<PropKind>(['rug', 'pond', 'stain', 'footprints']);
/** Stands with its back to the wall. */
const AGAINST_WALL = new Set<PropKind>([
  'cabinet', 'bookshelf', 'counter', 'piano', 'safe', 'coat', 'stairs', 'sink', 'bathtub', 'icebox', 'boiler',
  'switchboard', 'bandstand', 'fountain', 'ladder', 'plant', 'bed',
]);
/** Stands free on the floor. */
const FREE_STANDING = new Set<PropKind>([
  'desk', 'table', 'sofa', 'chair', 'barrel', 'bicycle', 'cart', 'musicstand', 'microphone', 'reeds',
  'sack', 'bin', 'umbrella', 'gramophone',
]);

/**
 * Small things that would not be left on the floor: with no furniture to put them on they get a
 * shelf or a side table. A dropped glove or a revolver can lie where it fell.
 */
const NEEDS_A_SURFACE = new Set<PropKind>([
  'glass', 'bottle', 'decanter', 'letter', 'book', 'phone', 'typewriter', 'lamp', 'vase', 'candle', 'ashtray', 'radio',
  'tray', 'clock', 'photo', 'press', 'sleeve', 'scale', 'statuette', 'bell', 'camera', 'medical', 'cosmetic', 'magnifier',
  'spectacles', 'pipe', 'wallet', 'fingerprint', 'reel', 'cards', 'money', 'item', 'jewel', 'binoculars', 'painting',
  'hat', 'case', 'crate', 'key', 'tag', 'instrument',
]);

export function seatOf(kind: PropKind, variant: string, rect: Rect): Seat {
  if (kind === 'window') return variant === 'roof' ? 'ceiling' : 'wall';
  if (kind === 'lamp') return variant === 'chandelier' ? 'ceiling' : variant === 'floor' || variant === 'street' ? 'floor' : 'small';
  if (kind === 'clock') return variant === 'tall' ? 'floor' : variant === 'wall' ? 'wall' : 'small';
  if (kind === 'mirror') return variant === 'vanity' ? 'floor' : 'wall';
  if (kind === 'door') return variant === 'hatch' ? 'wall' : 'opening';
  if (kind === 'fireplace') return variant === 'stove' ? 'floor' : 'opening';
  if (kind === 'phone') return variant === 'wall' ? 'wall' : 'small';
  if (kind === 'crate') return variant === 'crate' ? 'floor' : 'small';
  if (kind === 'case') return variant === 'trunk' || variant === 'suitcase' ? 'floor' : 'small';
  if (kind === 'mallet') return variant === 'rack' ? 'floor' : 'small';
  if (kind === 'grating') return rect.y + rect.h / 2 > SCENE_HORIZON ? 'flat' : 'wall';
  // hooks on a rope hang from the roof beams
  if (kind === 'rope' && variant === 'hooks') return 'ceiling';
  if (WALL_KINDS.has(kind)) return 'wall';
  if (OPENING_KINDS.has(kind)) return 'opening';
  if (FLAT_KINDS.has(kind)) return 'flat';
  if (AGAINST_WALL.has(kind) || FREE_STANDING.has(kind)) return 'floor';
  return 'small';
}

/** Does this floor-standing thing belong against the back wall (true) or free in the room (false)? */
function againstWall(kind: PropKind, variant: string): boolean {
  if (kind === 'clock' || kind === 'mirror' || kind === 'fireplace' || kind === 'mallet') return true;
  if (kind === 'lamp') return variant === 'floor';
  if (kind === 'crate' || kind === 'case') return false;
  return AGAINST_WALL.has(kind);
}

const keyOf = (kind: PropKind, variant: string) => (variant ? `${kind}/${variant}` : kind);

/** Width divided by height that still looks like the thing. [narrowest, widest]. */
const ASPECT: Record<string, [number, number]> = {
  'door': [0.42, 0.54], 'door/revolving': [0.6, 0.78], 'door/hatch': [1.25, 1.8],
  'elevator': [0.64, 0.82], 'curtain': [0.5, 1.0], 'fireplace/hearth': [1.05, 1.4], 'fireplace/stove': [0.65, 0.9],
  'window/sash': [0.75, 1.35], 'window/barred': [0.8, 1.25], 'window/ticket': [0.85, 1.2], 'window/porthole': [1, 1],
  'window/roof': [1.3, 2.2], 'painting/portrait': [0.72, 1.0], 'painting/landscape': [1.25, 1.65], 'painting/map': [1.15, 1.55],
  'painting/notice': [0.75, 1.15], 'painting/directory': [0.72, 1.0], 'mirror/oval': [0.66, 0.88], 'mirror/wide': [1.35, 1.8],
  'mirror/vanity': [0.95, 1.3], 'clock/wall': [1, 1], 'clock/tall': [0.27, 0.4], 'keyrack': [1.2, 1.55], 'booth': [1.5, 2.2],
  'wall': [1.0, 1.6], 'grating': [1.0, 1.5], 'phone/wall': [0.62, 0.82],
  'desk': [1.35, 2.1], 'table/dining': [1.7, 2.6], 'table/plain': [1.3, 2.1], 'table/work': [1.4, 2.2], 'table/round': [0.95, 1.4],
  'bed': [1.4, 2.1], 'sofa': [1.6, 2.4], 'counter': [2.2, 3.6], 'bookshelf': [0.7, 1.35], 'cabinet/plain': [0.65, 1.1],
  'cabinet/glazed': [0.62, 1.0], 'cabinet/filing': [0.48, 0.7], 'cabinet/drawer': [1.3, 2.0], 'chair/arm': [0.82, 1.1],
  'chair/side': [0.52, 0.75], 'chair/wicker': [0.72, 1.0], 'chair/stool': [0.62, 0.85], 'chair/bench': [1.5, 2.2], 'piano': [1.05, 1.5],
  'safe': [0.78, 1.0], 'barrel': [0.68, 0.86], 'plant/palm': [0.6, 0.95], 'plant/fern': [0.75, 1.1], 'coat': [0.42, 0.62],
  'stairs': [1.0, 1.5], 'sink': [0.75, 1.1], 'bathtub': [1.6, 2.2], 'bicycle': [1.35, 1.65], 'cart/linen': [1.05, 1.4],
  'cart/trolley': [1.05, 1.4], 'icebox': [0.62, 0.85], 'boiler': [0.68, 0.9], 'switchboard': [0.85, 1.15], 'bandstand': [1.9, 2.8],
  'fountain': [1.5, 2.3], 'lamp/floor': [0.32, 0.5], 'lamp/street': [0.24, 0.36], 'lamp/chandelier': [1.1, 1.7],
  'crate/crate': [0.95, 1.4], 'case/trunk': [1.15, 1.6], 'case/suitcase': [1.15, 1.5], 'mallet/rack': [0.95, 1.3],
  'musicstand': [0.6, 0.8], 'microphone': [0.3, 0.45], 'reeds': [0.8, 1.3], 'sack': [0.8, 1.05], 'bin': [0.75, 1.0],
  'ladder': [0.35, 0.55], 'umbrella': [0.4, 0.6], 'gramophone': [0.8, 1.1],
  'rug': [2.6, 3.8], 'pond': [2.2, 3.4], 'stain/blood': [1.8, 2.8], 'stain/outline': [1.5, 2.2], 'footprints': [0.9, 1.5],
};

/** How tall the thing is in a room 372 units high. [smallest, largest]. */
const HEIGHT: Record<string, [number, number]> = {
  'door': [196, 236], 'door/revolving': [206, 240], 'door/hatch': [80, 120], 'elevator': [206, 240], 'curtain': [230, 300],
  'fireplace/hearth': [140, 180], 'fireplace/stove': [130, 170],
  'window/sash': [110, 180], 'window/barred': [100, 150], 'window/ticket': [110, 150], 'window/porthole': [80, 110],
  'painting': [80, 150], 'painting/directory': [120, 170], 'mirror/oval': [100, 150], 'mirror/wide': [70, 110], 'mirror/vanity': [150, 190],
  'clock/wall': [70, 100], 'clock/tall': [200, 236], 'keyrack': [90, 130], 'booth': [110, 150], 'wall': [120, 180], 'grating': [70, 110],
  'phone/wall': [100, 130],
  'bookshelf': [180, 236], 'cabinet/plain': [140, 190], 'cabinet/glazed': [150, 200], 'cabinet/filing': [150, 186], 'cabinet/drawer': [70, 100],
  'counter': [110, 140], 'piano': [130, 160], 'safe': [96, 126], 'coat': [176, 206], 'stairs': [200, 250], 'sink': [104, 136],
  'bathtub': [96, 126], 'icebox': [166, 200], 'boiler': [180, 226], 'switchboard': [146, 186], 'bandstand': [140, 176],
  'fountain': [130, 166], 'ladder': [206, 250], 'plant': [120, 180], 'lamp/floor': [206, 236], 'lamp/street': [270, 330],
  'mallet/rack': [110, 144],
  'desk': [104, 132], 'table': [92, 120], 'table/dining': [96, 124], 'table/round': [96, 124], 'bed': [110, 144], 'sofa': [104, 134],
  'chair': [110, 144], 'chair/bench': [90, 116], 'barrel': [104, 136], 'bicycle': [110, 136], 'cart': [112, 144],
  'musicstand': [134, 166], 'microphone': [156, 190], 'reeds': [116, 156], 'sack': [84, 114], 'bin': [74, 98],
  'umbrella': [116, 146], 'gramophone': [100, 130], 'crate/crate': [96, 132], 'case/trunk': [84, 114], 'case/suitcase': [80, 106],
  'rug': [100, 130], 'pond': [70, 110], 'stain': [44, 70], 'footprints': [70, 110],
};
const WIDTH_MAX: Record<string, number> = { stairs: 300, counter: 480, bandstand: 440, bookshelf: 290, fountain: 340, rug: 460 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** How big the thing is drawn: its own proportions and height, nudged by what the case file asked. */
function naturalSize(kind: PropKind, variant: string, rect: Rect): [number, number] {
  const key = keyOf(kind, variant);
  const [narrow, wide] = ASPECT[key] ?? ASPECT[kind] ?? [0.7, 1.4];
  const [low, high] = HEIGHT[key] ?? HEIGHT[kind] ?? [90, 140];
  let h = clamp(rect.h, low, high);
  let w = h * clamp(rect.w / Math.max(1, rect.h), narrow, wide);
  const max = WIDTH_MAX[kind];
  if (max && w > max) {
    w = max;
    h = clamp(h, w / wide, w / narrow);
  }
  return [w, h];
}

/** How high, as a share of its box, the top surface of a piece of furniture is, and which part of its width is free. */
function surfaceOf(kind: PropKind, variant: string): { top: number; from: number; to: number } | null {
  if (kind === 'desk') return { top: 0.38, from: 0.36, to: 0.76 };
  if (kind === 'table') return variant === 'round' ? { top: 0.34, from: 0.22, to: 0.78 } : { top: 0.3, from: 0.12, to: 0.88 };
  if (kind === 'counter') return { top: 0.34, from: 0.08, to: 0.92 };
  if (kind === 'cabinet') return variant === 'drawer' ? null : { top: 0.02, from: 0.12, to: 0.88 };
  if (kind === 'piano') return { top: 0.4, from: 0.2, to: 0.8 };
  if (kind === 'safe' || kind === 'icebox') return { top: 0.02, from: 0.12, to: 0.88 };
  if (kind === 'crate') return variant === 'crate' ? { top: 0.02, from: 0.1, to: 0.9 } : null;
  if (kind === 'barrel') return { top: 0.04, from: 0.2, to: 0.8 };
  if (kind === 'fountain') return { top: 0.34, from: 0.66, to: 0.96 };
  if (kind === 'case') return variant === 'trunk' ? { top: 0.1, from: 0.15, to: 0.85 } : null;
  if (kind === 'mirror' && variant === 'vanity') return { top: 0.62, from: 0.15, to: 0.85 };
  return null;
}

export interface Placed {
  seat: Seat;
  /** Where the prop is drawn. */
  box: Rect;
  /** A shelf to rest on, for small things on the wall. */
  shelf: Rect | null;
  /** A side table (or a crate, out of doors) under a small thing that should not lie on the floor. */
  stand: Rect | null;
  /** A slab of building behind a wall thing in a scene that has no wall (a garden, an alley). */
  facade: Rect | null;
  /** Where the hotspot is clicked: the drawing with a little room around it. */
  hit: Rect;
}

export interface PlaceInput {
  kind: PropKind;
  variant: string;
  /** The hotspot rectangle from the case file, in scene units. */
  rect: Rect;
}

type Span = [number, number];

/** The x nearest to `want` (a centre) where something `w` wide fits between `lo` and `hi`, clear of the taken spans. */
function freeX(w: number, want: number, lo: number, hi: number, taken: readonly Span[], gap = 14): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (let x = lo; x <= hi - w + 0.01; x += 5) {
    if (taken.some(([a, b]) => x < b + gap && x + w > a - gap)) continue;
    const distance = Math.abs(x + w / 2 - want);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = x;
    }
  }
  return best;
}

/** Like freeX, but lets the thing shrink a little before giving up, and never returns nothing. */
function fitX(size: [number, number], want: number, lo: number, hi: number, taken: readonly Span[], gap = 14): { x: number; w: number; h: number } {
  let [w, h] = size;
  for (let attempt = 0; attempt < 5; attempt++) {
    const x = freeX(w, want, lo, hi, taken, gap);
    if (x !== null) return { x, w, h };
    w *= 0.86;
    h *= 0.86;
  }
  return { x: clamp(want - w / 2, lo, Math.max(lo, hi - w)), w, h };
}

const touches = (a: Rect, b: Rect, margin: number) =>
  a.x < b.x + b.w + margin && a.x + a.w > b.x - margin && a.y < b.y + b.h + margin && a.y + a.h > b.y - margin;

/** A free place on the wall for something w by h, as near to wantX as it gets. */
function freeOnWall(w: number, h: number, wantX: number, wantY: number, taken: readonly Rect[]): Rect | null {
  const rows = [wantY, wantY - 34, wantY + 34, WALL_TOP + 6, WALL_BOTTOM - h].map((y) => clamp(y, WALL_TOP, WALL_BOTTOM - h));
  let best: Rect | null = null;
  let bestScore = Infinity;
  for (const y of rows) {
    for (let x = 14; x <= SCENE_W - 14 - w; x += 8) {
      const box = { x, y, w, h };
      if (taken.some((t) => touches(box, t, 12))) continue;
      const score = Math.abs(x + w / 2 - wantX) + Math.abs(y - wantY) * 1.5;
      if (score < bestScore) {
        bestScore = score;
        best = box;
      }
    }
  }
  return best;
}

const pad = (r: Rect, by: number): Rect => {
  const x = clamp(r.x - by, 0, SCENE_W);
  const y = clamp(r.y - by, 0, SCENE_H);
  return { x, y, w: Math.min(SCENE_W - x, r.w + by * 2), h: Math.min(SCENE_H - y, r.h + by * 2) };
};

const around = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/**
 * Furnish a room. `openAir` scenes (a garden, a dock) have no back wall: doors and windows get a
 * slab of building around them, and small things go on a crate instead of a shelf.
 */
export function placeProps(inputs: readonly PlaceInput[], openAir: boolean): Placed[] {
  const out: Array<Placed | null> = inputs.map(() => null);
  const items = inputs.map((input, i) => ({ ...input, i, cx: input.rect.x + input.rect.w / 2, seat: seatOf(input.kind, input.variant, input.rect) }));
  const put = (i: number, seat: Seat, box: Rect, extra: Partial<Placed> = {}) => {
    const placed: Placed = { seat, box, shelf: null, stand: null, facade: null, hit: pad(box, 5), ...extra };
    out[i] = placed;
    return placed;
  };

  // ---- 1. The back wall: doors and stairs to the sides, then whatever stands against the wall.
  const wallRow: Span[] = []; // stretches of the wall's foot that are taken
  const wallBoxes: Rect[] = []; // everything on or against the wall, for hanging pictures around it
  const keepClear: Span[] = []; // the way to a door, a fireplace, the stairs
  const sides = { left: 0, right: 0 };
  const sideOf = (cx: number, central: boolean): 'left' | 'right' => {
    const side = central ? (sides.left <= sides.right ? 'left' : 'right') : cx < SCENE_W / 2 ? 'left' : 'right';
    sides[side] += 1;
    return side;
  };
  const placeOnRow = (item: (typeof items)[number], want: number, seat: Seat, clearWay: boolean) => {
    const size = naturalSize(item.kind, item.variant, item.rect);
    const fit = fitX(size, want, 24, SCENE_W - 24, wallRow, openAir ? 60 : 16);
    const stands = seat === 'opening' ? SCENE_HORIZON + 2 : SCENE_HORIZON + 10;
    const box = { x: fit.x, y: stands - fit.h, w: fit.w, h: fit.h };
    wallRow.push([box.x, box.x + box.w]);
    wallBoxes.push(box);
    if (clearWay) keepClear.push([box.x - 6, box.x + box.w + 6]);
    const facade = openAir && seat === 'opening' ? { x: box.x - 36, y: box.y - 34, w: box.w + 72, h: fit.h + 36 } : null;
    put(item.i, seat, box, { facade });
  };

  // A chair goes to a desk or a table. With none in the room it stands against the wall, as a bench always does.
  const hasDesk = items.some((it) => it.kind === 'desk' || it.kind === 'table');
  const atWall = (it: (typeof items)[number]) =>
    againstWall(it.kind, it.variant) || (it.kind === 'chair' && (it.variant === 'bench' || !hasDesk));
  const backRow = items.filter((it) => it.seat === 'opening' || (it.seat === 'floor' && atWall(it)));
  const stairs = backRow.filter((it) => it.kind === 'stairs');
  const doors = backRow.filter((it) => it.kind === 'door');
  const rest = backRow.filter((it) => it.kind !== 'stairs' && it.kind !== 'door');
  for (const it of stairs) placeOnRow(it, sideOf(it.cx, false) === 'left' ? 0 : SCENE_W, 'floor', true);
  for (const it of doors) {
    const central = it.cx > 380 && it.cx < 620;
    placeOnRow(it, sideOf(it.cx, central) === 'left' ? 0 : SCENE_W, 'opening', true);
  }
  // Widest first, so the big pieces get the room they need; each as near as it can to where it was meant.
  for (const it of [...rest].sort((a, b) => naturalSize(b.kind, b.variant, b.rect)[0] - naturalSize(a.kind, a.variant, a.rect)[0])) {
    const isOpening = it.seat === 'opening';
    placeOnRow(it, clamp(it.cx, 150, SCENE_W - 150), isOpening ? 'opening' : 'floor', isOpening);
  }

  // ---- 2. On the wall: in the free stretches, or above low furniture.
  const hung = items.filter((it) => it.seat === 'wall').sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h);
  for (const it of hung) {
    let [w, h] = naturalSize(it.kind, it.variant, it.rect);
    const wantY = it.kind === 'window' ? 56 : clamp(150 - h / 2, WALL_TOP, WALL_BOTTOM - h);
    let box: Rect | null = null;
    for (let attempt = 0; attempt < 4 && !box; attempt++) {
      box = freeOnWall(w, h, it.cx, wantY, wallBoxes);
      if (!box) {
        w *= 0.84;
        h *= 0.84;
      }
    }
    box ??= { x: clamp(it.cx - w / 2, 14, SCENE_W - 14 - w), y: clamp(wantY, WALL_TOP, WALL_BOTTOM - h), w, h };
    wallBoxes.push(box);
    put(it.i, 'wall', box, { facade: openAir ? { x: box.x - 34, y: box.y - 30, w: box.w + 68, h: SCENE_HORIZON - box.y + 30 } : null });
  }

  // ---- Ceiling: lamps and skylights keep their place along the room.
  for (const it of items.filter((x) => x.seat === 'ceiling')) {
    const [w, h] = naturalSize(it.kind, it.variant, it.rect);
    put(it.i, 'ceiling', { x: clamp(it.cx - w / 2, 10, SCENE_W - 10 - w), y: it.kind === 'lamp' ? 0 : 12, w, h });
  }

  // ---- 3. On the floor: free-standing furniture in one or two rows, the way to every door kept clear.
  const free = items.filter((it) => it.seat === 'floor' && !atWall(it));
  const byDepth = [...free].sort((a, b) => a.rect.y + a.rect.h - (b.rect.y + b.rect.h));
  const twoRows = free.length > 3;
  const rows = {
    back: { foot: SCENE_HORIZON + (twoRows ? 84 : 118), scale: twoRows ? 0.84 : 0.94, taken: [...keepClear] as Span[] },
    front: { foot: SCENE_H - 26, scale: 1.08, taken: [] as Span[] },
  };
  const rowOf = new Map<number, keyof typeof rows>();
  byDepth.forEach((it, n) => rowOf.set(it.i, twoRows && n >= Math.ceil(free.length / 2) ? 'front' : 'back'));
  const floorBoxes: Array<{ item: (typeof items)[number]; box: Rect }> = [];
  const stand = (it: (typeof items)[number], want: number, rowName: keyof typeof rows) => {
    const row = rows[rowName];
    const [w, h] = naturalSize(it.kind, it.variant, it.rect);
    const fit = fitX([w * row.scale, h * row.scale], want, 30, SCENE_W - 30, row.taken, 22);
    const box = { x: fit.x, y: row.foot - fit.h, w: fit.w, h: fit.h };
    row.taken.push([box.x, box.x + box.w]);
    floorBoxes.push({ item: it, box });
    put(it.i, 'floor', box);
  };
  const seats = free.filter((it) => it.kind === 'chair' && it.variant !== 'bench');
  const others = free.filter((it) => !seats.includes(it)).sort((a, b) => b.rect.w - a.rect.w);
  for (const it of others) stand(it, it.cx, rowOf.get(it.i) ?? 'back');
  for (const it of seats) {
    // A chair belongs at a desk or a table when there is one.
    const partner = floorBoxes
      .filter((f) => f.item.kind === 'desk' || f.item.kind === 'table')
      .sort((a, b) => Math.abs(a.box.x + a.box.w / 2 - it.cx) - Math.abs(b.box.x + b.box.w / 2 - it.cx))[0];
    if (!partner) {
      stand(it, it.cx, rowOf.get(it.i) ?? 'back');
      continue;
    }
    const partnerCx = partner.box.x + partner.box.w / 2;
    const side = it.cx < partnerCx ? -1 : 1;
    stand(it, partnerCx + side * (partner.box.w / 2 + 44), rowOf.get(partner.item.i) ?? 'back');
  }

  // ---- Flat on the floor.
  for (const it of items.filter((x) => x.seat === 'flat')) {
    const [w, h] = naturalSize(it.kind, it.variant, it.rect);
    const foot = it.kind === 'rug' ? SCENE_H - 44 : clamp(it.rect.y + it.rect.h, SCENE_HORIZON + 80, SCENE_H - 14);
    const x = it.kind === 'rug' ? clamp(it.cx - w / 2, 120, SCENE_W - 120 - w) : clamp(it.cx - w / 2, 20, SCENE_W - 20 - w);
    put(it.i, 'flat', { x, y: Math.max(SCENE_HORIZON + 12, foot - h), w, h });
  }

  // ---- 4. Small things: on a piece of furniture, else a shelf, else a table of their own.
  const surfaces: Array<{ top: number; from: number; to: number; cx: number; guests: number[] }> = [];
  inputs.forEach((input, i) => {
    const placed = out[i];
    const share = placed && placed.seat === 'floor' ? surfaceOf(input.kind, input.variant) : null;
    if (!placed || !share) return;
    const { box } = placed;
    surfaces.push({ top: box.y + box.h * share.top, from: box.x + box.w * share.from, to: box.x + box.w * share.to, cx: box.x + box.w / 2, guests: [] });
  });
  const small = items.filter((it) => it.seat === 'small').sort((a, b) => a.cx - b.cx);
  const homeless: typeof small = [];
  for (const it of small) {
    const dropped = !NEEDS_A_SURFACE.has(it.kind) || (it.kind === 'letter' && (it.variant === 'torn' || it.variant === 'crumpled'));
    const roomy = surfaces.filter((s) => s.guests.length < Math.max(1, Math.floor((s.to - s.from) / 46)));
    const nearest = roomy.sort((a, b) => Math.abs(a.cx - it.cx) - Math.abs(b.cx - it.cx))[0];
    if (!dropped && nearest) nearest.guests.push(it.i);
    else homeless.push(it);
  }
  for (const s of surfaces) {
    const slot = (s.to - s.from) / Math.max(1, s.guests.length);
    s.guests.forEach((i, n) => {
      const rect = inputs[i]!.rect;
      const size = clamp(Math.min(rect.w, rect.h), 36, Math.max(36, Math.min(66, slot - 4)));
      const box = { x: s.from + slot * (n + 0.5) - size / 2, y: s.top + 3 - size, w: size, h: size };
      put(i, 'small', box, { hit: pad(box, 9) });
    });
  }
  const frontTaken: Span[] = rows.front.taken;
  for (const it of homeless) {
    const dropped = !NEEDS_A_SURFACE.has(it.kind) || (it.kind === 'letter' && (it.variant === 'torn' || it.variant === 'crumpled'));
    const size = clamp(Math.min(it.rect.w, it.rect.h), 44, 70);
    if (!dropped && !openAir) {
      // a shelf on the wall, in a free stretch
      const spot = freeOnWall(size + 44, size + 16, it.cx, 250 - size, wallBoxes);
      if (spot) {
        const box = { x: spot.x + 22, y: spot.y + 4, w: size, h: size };
        const shelf = { x: spot.x, y: box.y + size, w: size + 44, h: 7 };
        wallBoxes.push(spot);
        put(it.i, 'small', box, { shelf, hit: pad(around(box, shelf), 5) });
        continue;
      }
    }
    // on the floor at the front: lying where it fell, or on a small table (out of doors, a crate)
    const foot = SCENE_H - 22;
    const big = size * 1.25;
    if (dropped) {
      const x = freeX(big, it.cx, 30, SCENE_W - 30, frontTaken, 18) ?? clamp(it.cx - big / 2, 30, SCENE_W - 30 - big);
      frontTaken.push([x, x + big]);
      const box = { x, y: foot - big, w: big, h: big };
      put(it.i, 'small', box, { hit: pad(box, 9) });
    } else {
      const tableW = big + 44;
      const x = freeX(tableW, it.cx, 30, SCENE_W - 30, frontTaken, 18) ?? clamp(it.cx - tableW / 2, 30, SCENE_W - 30 - tableW);
      frontTaken.push([x, x + tableW]);
      const table = { x, y: foot - 78, w: tableW, h: 78 };
      const box = { x: x + 22, y: table.y + 3 - big, w: big, h: big };
      put(it.i, 'small', box, { stand: table, hit: pad(around(box, table), 5) });
    }
  }

  return out as Placed[];
}
