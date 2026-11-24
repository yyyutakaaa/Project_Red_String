// Procedural room scenes. Each background key gets its own palette, wall and floor treatment, window, lamp
// and set dressing, drawn as layered SVG in a 1000 x 600 viewBox (5:3). Hotspots are transparent buttons
// laid over the drawing; their props come from Props.tsx. If real art is registered for the background key
// (src/assets/art/rooms/<key>.webp) the image is used instead and the procedural drawing and props are skipped.
import { useId, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type { Hotspot } from '@shared/caseSchema.ts';
import { backgroundArt } from '../assets/registry.ts';
import { sfx } from '../audio/audio.ts';
import { useReducedMotion } from '../store/settings.ts';
import { describeProp, hashString, rainPath, renderProp, seededRandom, type PropBox, type PropLight, type PropPaint } from './Props.tsx';
import styles from './RoomScene.module.css';

const W = 1000;
const H = 600;
/** Where the back wall meets the floor (62 percent down). */
const HZ = 372;
/** Vanishing point of the floor lines. */
const VPX = 500;
const VPY = 140;

// ---------------------------------------------------------------------------
// Scene specs

interface Palette {
  wallTop: string;
  wallBottom: string;
  accent: string;
  trim: string;
  floorFar: string;
  floorNear: string;
  floorLine: string;
  floorAlt: string;
  skyTop: string;
  skyBottom: string;
  fabric: string;
  propTop: string;
  propBottom: string;
  propMid: string;
  light: string;
}

type WallKind =
  | 'stripes'
  | 'damask'
  | 'panels'
  | 'brick'
  | 'stone'
  | 'subway'
  | 'squareTile'
  | 'glass'
  | 'open'
  | 'curtains'
  | 'plaster'
  | 'marble'
  | 'corrugated'
  | 'shelving';
type FloorKind =
  | 'boards'
  | 'parquet'
  | 'checker'
  | 'smallTile'
  | 'carpet'
  | 'cobbles'
  | 'planks'
  | 'grass'
  | 'flagstone'
  | 'concrete'
  | 'linoleum';
type WindowKind = 'sash' | 'arched' | 'blinds' | 'small' | 'grid' | 'carriage' | 'fanlight' | 'frosted' | 'none';
type LampKind = 'chandelier' | 'pendant' | 'shade' | 'bulb' | 'lantern' | 'sconces' | 'floor' | 'street' | 'spot';
type Extra =
  | 'drapes'
  | 'pictureRail'
  | 'fireGlow'
  | 'rugBig'
  | 'runner'
  | 'palms'
  | 'leaks'
  | 'potRack'
  | 'pipes'
  | 'shelfJars'
  | 'radiator'
  | 'towelRail'
  | 'ladder'
  | 'moon'
  | 'skyline'
  | 'balustrade'
  | 'urns'
  | 'trees'
  | 'hedges'
  | 'statue'
  | 'proscenium'
  | 'stageEdge'
  | 'clubTables'
  | 'backbar'
  | 'neon'
  | 'certificate'
  | 'posters'
  | 'costumeRail'
  | 'alleyWalls'
  | 'fireEscape'
  | 'puddles'
  | 'steam'
  | 'columns'
  | 'sunburst'
  | 'elevator'
  | 'hotelSign'
  | 'trusses'
  | 'racks'
  | 'sea'
  | 'ship'
  | 'crane'
  | 'pilings'
  | 'dust'
  | 'arches'
  | 'wineRacks'
  | 'cobwebs'
  | 'luggageRack'
  | 'passingLights';

interface SceneSpec {
  wall: WallKind;
  floor: FloorKind;
  window: WindowKind;
  lamp: LampKind;
  wainscot?: boolean;
  crown?: boolean;
  shelfItems?: 'books' | 'boxes';
  rain: 'window' | 'open' | 'none';
  fog?: boolean;
  extras: Extra[];
  palette: Palette;
}

const BASE: Palette = {
  wallTop: '#1a2130',
  wallBottom: '#0d121b',
  accent: '#232c3d',
  trim: '#0a0e15',
  floorFar: '#161b24',
  floorNear: '#0a0d13',
  floorLine: '#05070c',
  floorAlt: '#1d2330',
  skyTop: '#070c16',
  skyBottom: '#1a2538',
  fabric: '#2a2030',
  propTop: '#151b29',
  propBottom: '#06080d',
  propMid: '#121824',
  light: '#e8b54a',
};

const pal = (over: Partial<Palette>): Palette => ({ ...BASE, ...over });

const SPECS: Record<string, SceneSpec> = {
  'dining-room': {
    wall: 'damask', floor: 'parquet', window: 'sash', lamp: 'chandelier', wainscot: true, crown: true, rain: 'window',
    extras: ['drapes', 'pictureRail'],
    palette: pal({ wallTop: '#2a1b22', wallBottom: '#150d12', accent: '#3d2833', trim: '#22150e', floorFar: '#23170f', floorNear: '#0e0906', floorLine: '#070403', floorAlt: '#2c1d12', fabric: '#2e1a28', propTop: '#1d1411', propBottom: '#070505', propMid: '#1a120e' }),
  },
  study: {
    wall: 'stripes', floor: 'boards', window: 'sash', lamp: 'shade', wainscot: true, crown: true, rain: 'window',
    extras: ['fireGlow', 'rugBig', 'drapes'],
    palette: pal({ wallTop: '#17271f', wallBottom: '#0a130f', accent: '#1e3329', trim: '#24170f', floorFar: '#22170e', floorNear: '#0c0805', floorLine: '#060403', floorAlt: '#2a1d12', fabric: '#1e2a40', propTop: '#1a140e', propBottom: '#060504', propMid: '#17110c' }),
  },
  conservatory: {
    wall: 'glass', floor: 'checker', window: 'none', lamp: 'lantern', rain: 'open',
    extras: ['palms', 'leaks'],
    palette: pal({ wallTop: '#0b1b20', wallBottom: '#10282b', accent: '#081012', trim: '#1c1915', floorFar: '#2b1c14', floorNear: '#100a07', floorLine: '#080504', floorAlt: '#1d140e', skyTop: '#06121a', skyBottom: '#133238', fabric: '#1d2a22', propTop: '#121a14', propBottom: '#050807', propMid: '#101611' }),
  },
  kitchen: {
    wall: 'subway', floor: 'checker', window: 'sash', lamp: 'pendant', wainscot: false, rain: 'window',
    extras: ['potRack', 'pipes', 'shelfJars'],
    palette: pal({ wallTop: '#1f2b2a', wallBottom: '#111918', accent: '#2b3a39', trim: '#0c1212', floorFar: '#2a2c2a', floorNear: '#0c0d0e', floorLine: '#050606', floorAlt: '#0e1012', fabric: '#2a2a22', propTop: '#161c1c', propBottom: '#060808', propMid: '#131818' }),
  },
  bedroom: {
    wall: 'stripes', floor: 'carpet', window: 'sash', lamp: 'sconces', crown: true, rain: 'window',
    extras: ['drapes', 'radiator', 'pictureRail'],
    palette: pal({ wallTop: '#1c2434', wallBottom: '#0d121c', accent: '#263148', trim: '#141a26', floorFar: '#251b27', floorNear: '#0d0a0f', floorLine: '#08060a', floorAlt: '#2e2232', fabric: '#3a2a3c', propTop: '#161a28', propBottom: '#06070c', propMid: '#131624' }),
  },
  bathroom: {
    wall: 'squareTile', floor: 'smallTile', window: 'frosted', lamp: 'bulb', rain: 'window',
    extras: ['pipes', 'towelRail'],
    palette: pal({ wallTop: '#28313a', wallBottom: '#141a20', accent: '#333e49', trim: '#0f1418', floorFar: '#2b3137', floorNear: '#0e1114', floorLine: '#080a0c', floorAlt: '#171c21', fabric: '#2a3a3e', propTop: '#181e27', propBottom: '#07090c', propMid: '#151a22' }),
  },
  library: {
    wall: 'shelving', shelfItems: 'books', floor: 'boards', window: 'arched', lamp: 'chandelier', rain: 'window',
    extras: ['ladder', 'rugBig'],
    palette: pal({ wallTop: '#22170f', wallBottom: '#120c07', accent: '#2e2014', trim: '#1f150c', floorFar: '#20160d', floorNear: '#0b0704', floorLine: '#050302', floorAlt: '#29190e', fabric: '#2c1f30', propTop: '#1b130c', propBottom: '#070504', propMid: '#18110a' }),
  },
  hallway: {
    wall: 'stripes', floor: 'checker', window: 'fanlight', lamp: 'lantern', wainscot: true, crown: true, rain: 'window',
    extras: ['runner'],
    palette: pal({ wallTop: '#232a35', wallBottom: '#11151c', accent: '#2d3544', trim: '#1a1f28', floorFar: '#3a3c40', floorNear: '#121316', floorLine: '#050607', floorAlt: '#07080a', fabric: '#1c2638', propTop: '#161a24', propBottom: '#06070b', propMid: '#13161f' }),
  },
  terrace: {
    wall: 'open', floor: 'flagstone', window: 'none', lamp: 'street', rain: 'open', fog: true,
    extras: ['moon', 'skyline', 'balustrade', 'urns'],
    palette: pal({ skyTop: '#060b15', skyBottom: '#1c2a40', accent: '#1d2333', trim: '#141a26', floorFar: '#1f242d', floorNear: '#0a0c11', floorLine: '#05060a', floorAlt: '#262c37', propTop: '#141824', propBottom: '#05070b', propMid: '#11151f' }),
  },
  garden: {
    wall: 'open', floor: 'grass', window: 'none', lamp: 'street', rain: 'open', fog: true,
    extras: ['moon', 'trees', 'hedges', 'statue'],
    palette: pal({ skyTop: '#050c10', skyBottom: '#15272b', accent: '#0a1712', trim: '#0d1611', floorFar: '#101b14', floorNear: '#050906', floorLine: '#030504', floorAlt: '#1d201d', propTop: '#101611', propBottom: '#040605', propMid: '#0e130f' }),
  },
  stage: {
    wall: 'curtains', floor: 'boards', window: 'none', lamp: 'spot', rain: 'none',
    extras: ['proscenium', 'stageEdge', 'clubTables'],
    palette: pal({ wallTop: '#2b1328', wallBottom: '#12060e', accent: '#3d1c35', trim: '#1a0f0a', floorFar: '#2c1e13', floorNear: '#120c07', floorLine: '#070402', floorAlt: '#35251a', fabric: '#2c1426', propTop: '#191210', propBottom: '#060404', propMid: '#161010' }),
  },
  bar: {
    wall: 'brick', floor: 'boards', window: 'none', lamp: 'pendant', rain: 'none',
    extras: ['backbar', 'neon'],
    palette: pal({ wallTop: '#2a1914', wallBottom: '#120a08', accent: '#3b231a', trim: '#170d08', floorFar: '#20150c', floorNear: '#0a0604', floorLine: '#050302', floorAlt: '#29190f', propTop: '#1a110c', propBottom: '#060403', propMid: '#170f0b' }),
  },
  office: {
    wall: 'plaster', floor: 'boards', window: 'blinds', lamp: 'pendant', wainscot: true, rain: 'window',
    extras: ['certificate'],
    palette: pal({ wallTop: '#24261f', wallBottom: '#10110e', accent: '#2d2f28', trim: '#1b1912', floorFar: '#1e1913', floorNear: '#0a0806', floorLine: '#050403', floorAlt: '#251f17', propTop: '#171610', propBottom: '#060605', propMid: '#14130e' }),
  },
  'dressing-room': {
    wall: 'stripes', floor: 'carpet', window: 'none', lamp: 'bulb', crown: true, rain: 'none',
    extras: ['posters', 'costumeRail'],
    palette: pal({ wallTop: '#2e2226', wallBottom: '#161013', accent: '#3b2b31', trim: '#1c1416', floorFar: '#23171d', floorNear: '#0c080a', floorLine: '#060405', floorAlt: '#2c1d24', fabric: '#3a2438', propTop: '#1a131b', propBottom: '#070508', propMid: '#161017' }),
  },
  alley: {
    wall: 'open', floor: 'cobbles', window: 'none', lamp: 'street', rain: 'open', fog: true,
    extras: ['alleyWalls', 'fireEscape', 'puddles', 'steam'],
    palette: pal({ skyTop: '#080d15', skyBottom: '#1e2735', accent: '#20242c', trim: '#0b0d11', floorFar: '#1a1d23', floorNear: '#08090c', floorLine: '#040507', floorAlt: '#23272f', propTop: '#13161c', propBottom: '#05060a', propMid: '#10131a' }),
  },
  lobby: {
    wall: 'marble', floor: 'checker', window: 'none', lamp: 'chandelier', crown: true, rain: 'none',
    extras: ['columns', 'sunburst', 'elevator'],
    palette: pal({ wallTop: '#2b2a25', wallBottom: '#131210', accent: '#3b3931', trim: '#1d1b15', floorFar: '#302e28', floorNear: '#0e0d0b', floorLine: '#060505', floorAlt: '#0c0c0b', propTop: '#181610', propBottom: '#060605', propMid: '#15130e' }),
  },
  'hotel-room': {
    wall: 'damask', floor: 'carpet', window: 'sash', lamp: 'shade', crown: true, rain: 'window',
    extras: ['hotelSign', 'radiator', 'drapes'],
    palette: pal({ wallTop: '#1a2b2d', wallBottom: '#0c1516', accent: '#22393d', trim: '#121c1d', floorFar: '#211c25', floorNear: '#0b090d', floorLine: '#060507', floorAlt: '#2b2431', fabric: '#2b3b37', propTop: '#131c1e', propBottom: '#05080a', propMid: '#10181a' }),
  },
  warehouse: {
    wall: 'corrugated', floor: 'concrete', window: 'grid', lamp: 'bulb', rain: 'window',
    extras: ['trusses', 'racks'],
    palette: pal({ wallTop: '#1b2026', wallBottom: '#0b0d10', accent: '#252c35', trim: '#0f1216', floorFar: '#1d1f21', floorNear: '#09090a', floorLine: '#050506', floorAlt: '#242628', propTop: '#19150f', propBottom: '#060504', propMid: '#16120d' }),
  },
  dock: {
    wall: 'open', floor: 'planks', window: 'none', lamp: 'street', rain: 'open', fog: true,
    extras: ['moon', 'sea', 'ship', 'crane', 'pilings'],
    palette: pal({ skyTop: '#070d16', skyBottom: '#1b2734', accent: '#0a141d', trim: '#0f1419', floorFar: '#1f1a13', floorNear: '#0b0907', floorLine: '#040302', floorAlt: '#28211a', propTop: '#14110c', propBottom: '#050403', propMid: '#12100b' }),
  },
  archive: {
    wall: 'shelving', shelfItems: 'boxes', floor: 'linoleum', window: 'small', lamp: 'bulb', rain: 'window',
    extras: ['dust'],
    palette: pal({ wallTop: '#1a201c', wallBottom: '#0b0e0c', accent: '#2e271b', trim: '#1a1f1b', floorFar: '#1d1f1d', floorNear: '#0a0b0a', floorLine: '#050605', floorAlt: '#242723', propTop: '#151812', propBottom: '#060705', propMid: '#121510' }),
  },
  cellar: {
    wall: 'stone', floor: 'flagstone', window: 'small', lamp: 'bulb', rain: 'window',
    extras: ['arches', 'wineRacks', 'cobwebs'],
    palette: pal({ wallTop: '#1f1c18', wallBottom: '#0c0b09', accent: '#2a2620', trim: '#110f0b', floorFar: '#1c1a16', floorNear: '#090807', floorLine: '#040403', floorAlt: '#23211c', propTop: '#15130f', propBottom: '#060504', propMid: '#12100c' }),
  },
  'train-car': {
    wall: 'panels', floor: 'carpet', window: 'carriage', lamp: 'sconces', rain: 'window',
    extras: ['luggageRack', 'passingLights', 'runner'],
    palette: pal({ wallTop: '#2b1913', wallBottom: '#120a07', accent: '#3b2319', trim: '#1b100a', floorFar: '#1b1f2b', floorNear: '#090a10', floorLine: '#050608', floorAlt: '#242939', fabric: '#202740', propTop: '#18110c', propBottom: '#060403', propMid: '#150f0b' }),
  },
};

/** Unknown keys (generated cases may invent them) borrow the closest known scene by keyword. */
const FALLBACK_RULES: Array<[RegExp, string]> = [
  [/garden|park|yard|field|forest|wood|grave|cemetery|lawn|orchard|maze/, 'garden'],
  [/pier|harbou?r|beach|shore|wharf|quay|boat|ship|deck|marina|canal|river/, 'dock'],
  [/street|road|alley|lane|square|plaza|avenue|parking|bridge/, 'alley'],
  [/roof|balcony|veranda|porch|patio|terrace/, 'terrace'],
  [/theat|cabaret|stage|ballroom|auditorium|studio/, 'stage'],
  [/club|lounge|bar|pub|saloon|speakeasy|casino|tavern/, 'bar'],
  [/kitchen|pantry|scullery|diner|cafe/, 'kitchen'],
  [/bath|wash|lavatory|powder/, 'bathroom'],
  [/dressing|backstage|green-room/, 'dressing-room'],
  [/hotel|motel|suite|inn|boarding/, 'hotel-room'],
  [/bed|guest|nursery|chamber|quarters|cabin/, 'bedroom'],
  [/office|bank|police|station|precinct|agency|newsroom|clinic/, 'office'],
  [/store|shop|garage|factory|mill|depot|hangar|workshop|loading/, 'warehouse'],
  [/vault|basement|crypt|tunnel|cellar|boiler|sewer/, 'cellar'],
  [/train|carriage|tram|compartment|pullman|sleeper/, 'train-car'],
  [/hall|corridor|foyer|landing|entrance|vestibule|stair/, 'hallway'],
  [/lobby|reception|atrium|concourse/, 'lobby'],
  [/library|records|gallery|museum|reading/, 'library'],
  [/archive|registry|files|morgue/, 'archive'],
  [/greenhouse|glasshouse|orangery|conservatory|solarium/, 'conservatory'],
  [/dining|parlou?r|drawing|sitting|living|salon/, 'dining-room'],
  [/study|den|smoking|billiard/, 'study'],
];

const GENERIC_TINTS: Array<Partial<Palette>> = [
  { wallTop: '#1e2433', wallBottom: '#0e121b', accent: '#262e40', fabric: '#2a2232' },
  { wallTop: '#232019', wallBottom: '#110f0b', accent: '#2d2a21', fabric: '#2c2520' },
  { wallTop: '#1a2624', wallBottom: '#0c1312', accent: '#21302d', fabric: '#23302c' },
  { wallTop: '#261c24', wallBottom: '#120d11', accent: '#31242e', fabric: '#33222e' },
  { wallTop: '#1f2228', wallBottom: '#0e1013', accent: '#292d35', fabric: '#242a36' },
];

function specFor(key: string): SceneSpec {
  const k = key.toLowerCase();
  const exact = SPECS[k];
  if (exact) return exact;
  for (const [re, known] of FALLBACK_RULES) {
    const spec = re.test(k) ? SPECS[known] : undefined;
    if (spec) return spec;
  }
  const tint = GENERIC_TINTS[hashString(k) % GENERIC_TINTS.length] ?? {};
  return {
    wall: 'plaster',
    floor: 'boards',
    window: 'sash',
    lamp: 'pendant',
    wainscot: true,
    crown: true,
    rain: 'window',
    extras: ['pictureRail'],
    palette: pal({ trim: '#171410', floorFar: '#1d1812', floorNear: '#0a0806', floorAlt: '#241e16', ...tint }),
  };
}

// ---------------------------------------------------------------------------
// Geometry

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function hotspotRect(h: Hotspot): Rect {
  const x = Math.max(0, Math.min(100, h.x));
  const y = Math.max(0, Math.min(100, h.y));
  return { x: x * 10, y: y * 6, w: (Math.min(100 - x, h.width) || 1) * 10, h: (Math.min(100 - y, h.height) || 1) * 6 };
}

/** The first candidate that is clear of every obstacle, else the least covered one if it is mostly clear. */
function pickRect(candidates: Rect[], obstacles: Rect[], maxCovered = 0.12): Rect | null {
  let best: Rect | null = null;
  let bestRatio = Infinity;
  for (const c of candidates) {
    const grown = { x: c.x - 10, y: c.y - 10, w: c.w + 20, h: c.h + 20 };
    const covered = obstacles.reduce((n, o) => n + overlapArea(grown, o), 0) / (grown.w * grown.h);
    if (covered === 0) return c;
    if (covered < bestRatio) {
      bestRatio = covered;
      best = c;
    }
  }
  return bestRatio <= maxCovered ? best : null;
}

/** x on a floor line that meets the bottom edge at xb, at screen height y. */
const xAt = (xb: number, y: number) => VPX + (xb - VPX) * ((y - VPY) / (H - VPY));

/** Floor rows from the wall line down to the bottom edge, spaced in perspective. */
function depthRows(n: number): number[] {
  const far = (H - VPY) / (HZ - VPY) - 1;
  const rows: number[] = [];
  for (let k = n; k >= 0; k--) rows.push(VPY + (H - VPY) / (1 + (far * k) / n));
  return rows;
}

const f1 = (n: number) => n.toFixed(1);

function quad(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): string {
  return `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}L${f1(c[0])} ${f1(c[1])}L${f1(d[0])} ${f1(d[1])}Z`;
}

// ---------------------------------------------------------------------------
// Layout: where the window, lamp and props go for a given room

interface LampLayout {
  kind: LampKind;
  x: number;
  y: number;
  poolX: number;
  poolY: number;
  poolRx: number;
  poolRy: number;
  coneTop: number;
  sconces: number[];
}

interface PlacedProp {
  id: string;
  label: string;
  box: PropBox;
  drawn: PropBox;
  flip: boolean;
  grounded: boolean;
  seed: number;
}

interface Layout {
  windows: Rect[];
  windowKind: WindowKind;
  /** Window-shaped areas that throw moonlight on the floor (scene windows and window props). */
  moonlight: Array<{ rect: Rect; blinds: boolean }>;
  lamp: LampLayout;
  props: PlacedProp[];
  propLights: PropLight[];
  obstacles: Rect[];
  seed: number;
}

function placeWindows(spec: SceneSpec, obstacles: Rect[], hasWindowProp: boolean): Rect[] {
  const k = spec.window;
  if (k === 'none') return [];
  if (k === 'carriage') return [70, 310, 550, 790].map((x) => ({ x, y: 72, w: 150, h: 160 }));
  if (k === 'grid') return [{ x: 110, y: 26, w: 780, h: 112 }];
  if (hasWindowProp) return [];
  const opts: Record<Exclude<WindowKind, 'none' | 'carriage' | 'grid'>, { w: number; h: number; y: number; xs: number[] }> = {
    sash: { w: 190, h: 220, y: 54, xs: [620, 190, 405, 780, 40] },
    arched: { w: 170, h: 270, y: 34, xs: [415, 640, 190, 780, 40] },
    blinds: { w: 300, h: 230, y: 52, xs: [600, 100, 350, 660] },
    small: { w: 150, h: 64, y: 30, xs: [425, 700, 160, 820] },
    fanlight: { w: 230, h: 112, y: 22, xs: [385, 620, 150] },
    frosted: { w: 150, h: 170, y: 54, xs: [680, 170, 420, 820] },
  };
  const o = opts[k];
  const found = pickRect(
    o.xs.map((x) => ({ x, y: o.y, w: o.w, h: o.h })),
    obstacles,
  );
  return found ? [found] : [];
}

function placeLamp(spec: SceneSpec, obstacles: Rect[]): LampLayout {
  const k = spec.lamp;
  const base = { kind: k, sconces: [] as number[] };
  if (k === 'spot') return { ...base, x: 500, y: -30, poolX: 500, poolY: HZ + 110, poolRx: 300, poolRy: 70, coneTop: 70 };
  if (k === 'sconces') {
    const pairs = [
      [170, 830],
      [300, 700],
      [90, 910],
    ];
    let chosen = pairs[0]!;
    let least = Infinity;
    for (const pair of pairs) {
      const cover = pair.reduce((n, x) => n + obstacles.reduce((m, o) => m + overlapArea({ x: x - 30, y: 130, w: 60, h: 90 }, o), 0), 0);
      if (cover < least) {
        least = cover;
        chosen = pair;
      }
    }
    return { ...base, sconces: chosen, x: 500, y: 170, poolX: 500, poolY: HZ + 110, poolRx: 380, poolRy: 90, coneTop: 0 };
  }
  if (k === 'floor' || k === 'street') {
    const xs = k === 'floor' ? [90, 910, 190, 810] : [860, 140, 740, 260];
    const top = k === 'floor' ? 120 : 40;
    const foot = k === 'floor' ? HZ + 40 : HZ + 150;
    const r = pickRect(
      xs.map((x) => ({ x: x - 40, y: top, w: 80, h: foot - top })),
      obstacles,
      1,
    ) ?? { x: xs[0]! - 40, y: top, w: 80, h: foot - top };
    const x = r.x + 40;
    return k === 'floor'
      ? { ...base, x, y: 150, poolX: x, poolY: HZ + 64, poolRx: 230, poolRy: 62, coneTop: 30 }
      : { ...base, x, y: 74, poolX: x, poolY: HZ + 150, poolRx: 320, poolRy: 80, coneTop: 24 };
  }
  const drop: Record<string, [number, number]> = { chandelier: [112, 44], pendant: [150, 40], shade: [142, 46], bulb: [134, 12], lantern: [124, 24] };
  const [y, coneTop] = drop[k] ?? [140, 40];
  const r = pickRect(
    [500, 640, 360, 780, 220].map((x) => ({ x: x - 55, y: 0, w: 110, h: y + 20 })),
    obstacles,
    1,
  );
  const x = r ? r.x + 55 : 500;
  return { ...base, x, y, poolX: x, poolY: HZ + 126, poolRx: k === 'chandelier' ? 320 : 250, poolRy: 84, coneTop };
}

function computeLayout(spec: SceneSpec, hotspots: readonly Hotspot[], key: string): Layout {
  const obstacles = hotspots.map(hotspotRect);
  const infos = hotspots.map((h, i) => ({ h, rect: obstacles[i]!, info: describeProp(h.label, obstacles[i]!) }));
  const windowProps = infos.filter((p) => p.info.kind === 'window' && p.info.variant === 'sash');
  const windows = placeWindows(spec, obstacles, windowProps.length > 0 || infos.some((p) => p.info.kind === 'window'));
  const lamp = placeLamp(spec, [...obstacles, ...windows]);
  const propLights = infos.map((p) => p.info.light).filter((l): l is PropLight => l !== null);
  const mainX = lamp.kind === 'sconces' ? 500 : lamp.x;
  const props: PlacedProp[] = infos
    .map(({ h, rect, info }) => {
      const cx = info.drawn.x + info.drawn.w / 2;
      return {
        id: h.id,
        label: h.label,
        box: rect,
        drawn: info.drawn,
        flip: !info.light && mainX < cx - 40,
        grounded: info.drawn.y + info.drawn.h > HZ + 4 && info.kind !== 'rug',
        seed: hashString(`${key}/${h.id}`),
      };
    })
    .sort((a, b) => a.drawn.y + a.drawn.h - (b.drawn.y + b.drawn.h));
  const moonlight: Layout['moonlight'] = [];
  if (spec.wall !== 'open' && spec.wall !== 'glass' && spec.window !== 'grid' && spec.window !== 'small') {
    for (const w of windows) moonlight.push({ rect: w, blinds: spec.window === 'blinds' });
    for (const p of windowProps) moonlight.push({ rect: p.info.drawn, blinds: false });
  }
  return { windows, windowKind: spec.window, moonlight, lamp, props, propLights, obstacles: [...obstacles, ...windows], seed: hashString(key) };
}

// ---------------------------------------------------------------------------
// Drawing context

interface Ctx {
  spec: SceneSpec;
  pa: Palette;
  layout: Layout;
  animated: boolean;
  r: () => number;
  id: (name: string) => string;
  url: (name: string) => string;
  has: (e: Extra) => boolean;
}

function anim(c: Ctx, cls: string | undefined): string | undefined {
  return c.animated ? cls : undefined;
}

function defs(c: Ctx): ReactElement {
  const { pa, id, layout } = c;
  const vx = layout.lamp.poolX;
  const vy = Math.min(H - 120, layout.lamp.poolY - 70);
  return (
    <defs>
      <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pa.wallTop} />
        <stop offset="1" stopColor={pa.wallBottom} />
      </linearGradient>
      <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pa.floorFar} />
        <stop offset="1" stopColor={pa.floorNear} />
      </linearGradient>
      <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pa.skyTop} />
        <stop offset="1" stopColor={pa.skyBottom} />
      </linearGradient>
      <linearGradient id={id('prop')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={pa.propTop} />
        <stop offset="1" stopColor={pa.propBottom} />
      </linearGradient>
      <radialGradient id={id('glow')}>
        <stop offset="0" stopColor={pa.light} stopOpacity="0.6" />
        <stop offset="0.35" stopColor={pa.light} stopOpacity="0.2" />
        <stop offset="1" stopColor={pa.light} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('ember')}>
        <stop offset="0" stopColor="#e0873a" stopOpacity="0.5" />
        <stop offset="0.45" stopColor="#d9772b" stopOpacity="0.16" />
        <stop offset="1" stopColor="#d9772b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('cone')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pa.light} stopOpacity="0.3" />
        <stop offset="1" stopColor={pa.light} stopOpacity="0.03" />
      </linearGradient>
      <radialGradient id={id('pool')}>
        <stop offset="0" stopColor={pa.light} stopOpacity="0.36" />
        <stop offset="0.6" stopColor={pa.light} stopOpacity="0.1" />
        <stop offset="1" stopColor={pa.light} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('moon')}>
        <stop offset="0" stopColor="#c8d8ee" stopOpacity="0.5" />
        <stop offset="0.3" stopColor="#8fb3e0" stopOpacity="0.16" />
        <stop offset="1" stopColor="#8fb3e0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('shaft')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fb3e0" stopOpacity="0.16" />
        <stop offset="1" stopColor="#8fb3e0" stopOpacity="0.01" />
      </linearGradient>
      <linearGradient id={id('shaftStrong')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9c1e0" stopOpacity="0.3" />
        <stop offset="1" stopColor="#8fb3e0" stopOpacity="0.03" />
      </linearGradient>
      <radialGradient id={id('fog')}>
        <stop offset="0" stopColor="#9aa8bd" stopOpacity="0.2" />
        <stop offset="1" stopColor="#9aa8bd" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('vig')} gradientUnits="userSpaceOnUse" cx={vx} cy={vy} r="700">
        <stop offset="0" stopColor="#020308" stopOpacity="0" />
        <stop offset="0.45" stopColor="#03050b" stopOpacity="0.1" />
        <stop offset="0.8" stopColor="#020308" stopOpacity="0.55" />
        <stop offset="1" stopColor="#010205" stopOpacity="0.85" />
      </radialGradient>
      <linearGradient id={id('edgeL')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#02040a" stopOpacity="0.5" />
        <stop offset="1" stopColor="#02040a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('edgeR')} x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#02040a" stopOpacity="0.5" />
        <stop offset="1" stopColor="#02040a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('top')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#02040a" stopOpacity="0.5" />
        <stop offset="1" stopColor="#02040a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('ao')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0.6" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('fold')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000000" stopOpacity="0.55" />
        <stop offset="0.45" stopColor={pa.accent} stopOpacity="0.9" />
        <stop offset="0.6" stopColor={pa.accent} stopOpacity="0.6" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id={id('rib')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={pa.trim} />
        <stop offset="0.5" stopColor={pa.accent} />
        <stop offset="1" stopColor={pa.trim} />
      </linearGradient>
      <linearGradient id={id('glassSheen')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
      </linearGradient>
      <filter id={id('hot')} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#e8b54a" floodOpacity="0.8" />
      </filter>
      <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      {patternFor(c)}
      <pattern id={id('stone')} width="140" height="70" patternUnits="userSpaceOnUse">
        <rect width="140" height="70" fill={pa.trim} />
        <rect x="2" y="2" width="62" height="31" rx="3" fill={pa.accent} />
        <rect x="68" y="2" width="70" height="31" rx="3" fill={pa.accent} opacity="0.82" />
        <rect x="-30" y="37" width="60" height="31" rx="3" fill={pa.accent} opacity="0.9" />
        <rect x="34" y="37" width="64" height="31" rx="3" fill={pa.accent} opacity="0.75" />
        <rect x="102" y="37" width="66" height="31" rx="3" fill={pa.accent} opacity="0.92" />
      </pattern>
      <pattern id={id('brick')} width="72" height="30" patternUnits="userSpaceOnUse">
        <rect width="72" height="30" fill={pa.trim} />
        <rect x="1.5" y="1.5" width="33" height="12" rx="1" fill={pa.accent} />
        <rect x="37.5" y="1.5" width="33" height="12" rx="1" fill={pa.accent} opacity="0.84" />
        <rect x="-16.5" y="16.5" width="33" height="12" rx="1" fill={pa.accent} opacity="0.92" />
        <rect x="19.5" y="16.5" width="33" height="12" rx="1" fill={pa.accent} />
        <rect x="55.5" y="16.5" width="33" height="12" rx="1" fill={pa.accent} opacity="0.92" />
      </pattern>
    </defs>
  );
}

function patternFor(c: Ctx): ReactNode {
  const { pa, id, spec } = c;
  switch (spec.wall) {
    case 'stripes':
      return (
        <pattern id={id('pat')} width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="22" height="56" fill={pa.accent} opacity="0.6" />
          <rect x="29" width="2" height="56" fill={pa.accent} opacity="0.75" />
          <rect x="49" width="2" height="56" fill={pa.accent} opacity="0.75" />
        </pattern>
      );
    case 'damask':
      return (
        <pattern id={id('pat')} width="64" height="88" patternUnits="userSpaceOnUse">
          <path d="M32 6 C44 20 44 32 32 44 C20 32 20 20 32 6 Z M32 44 C40 54 40 66 32 82 C24 66 24 54 32 44 Z" fill={pa.accent} opacity="0.55" />
          <path d="M0 40 C9 46 9 56 0 62 Z M64 40 C55 46 55 56 64 62 Z" fill={pa.accent} opacity="0.45" />
          <path d="M32 40 C36 42 36 46 32 48 C28 46 28 42 32 40 Z" fill={pa.accent} />
          <circle cx="0" cy="0" r="3" fill={pa.accent} opacity="0.6" />
          <circle cx="64" cy="0" r="3" fill={pa.accent} opacity="0.6" />
          <circle cx="0" cy="88" r="3" fill={pa.accent} opacity="0.6" />
          <circle cx="64" cy="88" r="3" fill={pa.accent} opacity="0.6" />
        </pattern>
      );
    case 'subway':
      return (
        <pattern id={id('pat')} width="44" height="22" patternUnits="userSpaceOnUse">
          <rect width="44" height="22" fill={pa.trim} />
          <rect x="1" y="1" width="42" height="9" rx="1" fill={pa.accent} />
          <rect x="-21" y="12" width="42" height="9" rx="1" fill={pa.accent} opacity="0.88" />
          <rect x="23" y="12" width="42" height="9" rx="1" fill={pa.accent} opacity="0.88" />
          <rect x="2" y="1.5" width="40" height="1.2" fill="#ffffff" opacity="0.04" />
        </pattern>
      );
    case 'squareTile':
      return (
        <pattern id={id('pat')} width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill={pa.trim} />
          <rect x="1" y="1" width="34" height="34" rx="1.5" fill={pa.accent} />
          <path d="M2 34 V2 H34" stroke="#ffffff" strokeOpacity="0.05" fill="none" />
        </pattern>
      );
    case 'corrugated':
      return (
        <pattern id={id('pat')} width="26" height="40" patternUnits="userSpaceOnUse">
          <rect width="26" height="40" fill={c.url('rib')} />
        </pattern>
      );
    case 'curtains':
      return (
        <pattern id={id('pat')} width="74" height="40" patternUnits="userSpaceOnUse">
          <rect width="74" height="40" fill={c.url('fold')} />
        </pattern>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Walls

function raisedPanels(c: Ctx, top: number, bottom: number, cols = 6): ReactNode {
  const pw = W / cols;
  const rows = bottom - top > 200 ? 2 : 1;
  const rh = (bottom - top) / rows;
  const panels: ReactElement[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * pw + 18;
      const y = top + j * rh + 14;
      const w = pw - 36;
      const h = rh - 28;
      panels.push(
        <g key={`${i}-${j}`}>
          <rect x={x} y={y} width={w} height={h} fill={c.pa.accent} opacity="0.42" />
          <path d={`M${x} ${y + h} V${y} H${x + w}`} stroke="#f2cd7a" strokeOpacity="0.07" strokeWidth="2" fill="none" />
          <path d={`M${x + w} ${y} V${y + h} H${x}`} stroke="#000000" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        </g>,
      );
    }
  }
  return <g>{panels}</g>;
}

function shelving(c: Ctx): ReactNode {
  const { pa, r } = c;
  const bays = 6;
  const bw = W / bays;
  const shelfYs = [88, 150, 212, 274, 336];
  const books = c.spec.shelfItems !== 'boxes';
  const colors = books ? ['#3b2a1c', '#22303d', '#2f3b25', '#3a2424', '#3a331f', '#2a2533', '#40301f'] : ['#3a3122', '#2f281c', '#463a27', '#2a2620'];
  const fills: string[] = colors.map(() => '');
  let labels = '';
  for (let b = 0; b < bays; b++) {
    const x0 = b * bw + 14;
    const x1 = (b + 1) * bw - 6;
    for (let s = 0; s < shelfYs.length; s++) {
      const yb = shelfYs[s]!;
      const top = s === 0 ? 30 : shelfYs[s - 1]! + 6;
      const maxH = yb - top - 6;
      let x = x0 + r() * 4;
      while (x < x1) {
        if (books) {
          const w = 7 + r() * 9;
          if (x + w > x1) break;
          const h = maxH * (0.6 + r() * 0.36);
          if (r() < 0.07) {
            x += w + 6;
            continue;
          }
          const ci = Math.floor(r() * colors.length);
          fills[ci] += `M${f1(x)} ${yb}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`;
          if (r() < 0.55) labels += `M${f1(x + 1)} ${f1(yb - h * 0.78)}h${f1(w - 2)}`;
          x += w + (r() < 0.15 ? 3 : 0.6);
        } else {
          const w = 34 + r() * 18;
          if (x + w > x1) break;
          const h = Math.min(maxH, 30 + r() * 14);
          const ci = Math.floor(r() * colors.length);
          fills[ci] += `M${f1(x)} ${yb}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`;
          labels += `M${f1(x + w * 0.3)} ${f1(yb - h * 0.62)}h${f1(w * 0.4)}`;
          x += w + 3 + r() * 6;
        }
      }
    }
  }
  return (
    <g>
      <rect width={W} height={HZ} fill="#05070c" opacity="0.55" />
      {fills.map((d, i) => (d ? <path key={i} d={d} fill={colors[i]} /> : null))}
      <path d={labels} stroke={books ? '#d9a23a' : '#cdbb95'} strokeOpacity={books ? 0.22 : 0.35} strokeWidth={books ? 1.4 : 7} />
      {shelfYs.map((y) => (
        <g key={y}>
          <rect x="0" y={y} width={W} height="7" fill={pa.trim} />
          <rect x="0" y={y} width={W} height="1.4" fill="#f2cd7a" opacity="0.07" />
        </g>
      ))}
      {Array.from({ length: bays + 1 }, (_, i) => (
        <rect key={i} x={i * bw - 7} y="18" width="14" height={HZ - 18} fill={pa.trim} />
      ))}
      <rect x="0" y="0" width={W} height="22" fill={pa.trim} />
    </g>
  );
}

function drawWall(c: Ctx): ReactNode {
  const { spec, pa, url, r } = c;
  const plainBase = <rect width={W} height={HZ} fill={url('wall')} />;
  switch (spec.wall) {
    case 'stripes':
    case 'damask':
    case 'subway':
    case 'squareTile':
    case 'corrugated':
      return (
        <>
          {plainBase}
          <rect width={W} height={HZ} fill={url('pat')} />
          {spec.wall === 'corrugated' && (
            <g>
              <rect y="150" width={W} height="4" fill="#000000" opacity="0.4" />
              <rect y="262" width={W} height="4" fill="#000000" opacity="0.4" />
              {[120, 380, 610, 840].map((x) => (
                <rect key={x} x={x} y="150" width={10 + r() * 14} height={140 + r() * 60} fill="#3a2614" opacity="0.18" />
              ))}
            </g>
          )}
          <rect width={W} height={HZ} fill={url('wall')} opacity="0.35" />
        </>
      );
    case 'brick':
    case 'stone': {
      const dark: ReactElement[] = [];
      if (spec.wall === 'brick') {
        for (let i = 0; i < 40; i++) {
          const row = Math.floor(r() * 12);
          const col = Math.floor(r() * 28);
          const off = row % 2 ? -18 : 0;
          dark.push(<rect key={i} x={col * 36 + off + 1.5} y={row * 15 + 1.5} width="33" height="12" fill="#000000" opacity={0.15 + r() * 0.25} />);
        }
      }
      return (
        <>
          <rect width={W} height={HZ} fill={url(spec.wall)} />
          <g>{dark}</g>
          <rect width={W} height={HZ} fill={url('wall')} opacity="0.55" />
          <rect y={HZ - 120} width={W} height="120" fill="#000000" opacity="0.22" />
        </>
      );
    }
    case 'panels':
      return (
        <>
          {plainBase}
          <g stroke={pa.trim} strokeOpacity="0.6">
            {Array.from({ length: 25 }, (_, i) => (
              <path key={i} d={`M${i * 42} 0 V${HZ}`} />
            ))}
          </g>
          {raisedPanels(c, 250, HZ - 10)}
          <rect y="244" width={W} height="10" fill={pa.trim} />
          <rect y="244" width={W} height="1.5" fill="#f2cd7a" opacity="0.1" />
        </>
      );
    case 'plaster':
      return (
        <>
          {plainBase}
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={i} cx={r() * W} cy={r() * HZ} rx={60 + r() * 120} ry={30 + r() * 70} fill={i % 3 === 0 ? '#ffffff' : '#000000'} opacity={i % 3 === 0 ? 0.025 : 0.12} />
          ))}
          <path d={`M${f1(120 + r() * 200)} 0 l14 40 l-10 26 l18 34 l-6 30`} stroke="#000000" strokeOpacity="0.35" fill="none" />
          <path d={`M${f1(700 + r() * 200)} ${HZ - 140} l-12 30 l8 24 l-14 30`} stroke="#000000" strokeOpacity="0.3" fill="none" />
        </>
      );
    case 'marble': {
      const veins: string[] = [];
      for (let i = 0; i < 14; i++) {
        const x = r() * W;
        const y = r() * HZ;
        veins.push(`M${f1(x)} ${f1(y)} c${f1(30 + r() * 40)} ${f1(10 + r() * 30)} ${f1(40 + r() * 50)} ${f1(-20 + r() * 40)} ${f1(90 + r() * 60)} ${f1(20 + r() * 40)}`);
      }
      return (
        <>
          {plainBase}
          <path d={veins.join('')} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1.4" fill="none" />
          <g stroke="#000000" strokeOpacity="0.45">
            {[250, 500, 750].map((x) => (
              <path key={x} d={`M${x} 0 V${HZ}`} />
            ))}
            <path d={`M0 186 H${W}`} />
          </g>
        </>
      );
    }
    case 'curtains':
      return (
        <>
          <rect width={W} height={HZ} fill={pa.wallBottom} />
          <rect width={W} height={HZ} fill={url('pat')} />
          <rect width={W} height={HZ} fill={url('wall')} opacity="0.45" />
          <path d={`M498 60 V${HZ}`} stroke="#000000" strokeOpacity="0.7" strokeWidth="5" />
          <path d={`M0 0 H${W} V52 ${Array.from({ length: 10 }, (_, i) => `Q${W - i * 100 - 50} 96 ${W - (i + 1) * 100} 52`).join(' ')} Z`} fill={pa.fabric} />
          <path d={`M0 52 ${Array.from({ length: 10 }, (_, i) => `Q${i * 100 + 50} 96 ${(i + 1) * 100} 52`).join(' ')}`} stroke="#d9a23a" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <rect width={W} height="10" fill="#000000" opacity="0.5" />
        </>
      );
    case 'glass':
      return glassWall(c);
    case 'open':
      return <rect width={W} height={HZ} fill={url('sky')} />;
    case 'shelving':
      return (
        <>
          {plainBase}
          {shelving(c)}
        </>
      );
  }
}

function blob(r: () => number, cx: number, cy: number, w: number, h: number, n: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * w;
    const y = cy + (r() - 0.5) * h;
    const rad = 14 + r() * (w / 5);
    d += `M${f1(x - rad)} ${f1(y)}a${f1(rad)} ${f1(rad * 0.85)} 0 1 0 ${f1(rad * 2)} 0a${f1(rad)} ${f1(rad * 0.85)} 0 1 0 ${f1(-rad * 2)} 0`;
  }
  return d;
}

function glassWall(c: Ctx): ReactNode {
  const { pa, url, r, animated } = c;
  const top = 96;
  const dwarf = HZ - 62;
  const mullions = Array.from({ length: 11 }, (_, i) => i * 100);
  const bushes = blob(r, 500, dwarf - 30, 1100, 90, 26);
  return (
    <>
      <rect width={W} height={HZ} fill={url('sky')} />
      <ellipse cx="760" cy="60" rx="220" ry="120" fill={url('moon')} />
      <path d={bushes} fill="#06100c" opacity="0.95" />
      <path d={blob(r, 300, dwarf - 90, 500, 60, 8)} fill="#081410" opacity="0.7" />
      <g clipPath={`url(#${c.id('clipWallUpper')})`}>
        <g className={anim(c, styles.rain60)}>
          <path d={rainPath(r, 1040, dwarf, 110, 60, 22)} stroke="#a9c1e0" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      </g>
      <clipPath id={c.id('clipWallUpper')}>
        <rect width={W} height={dwarf} />
      </clipPath>
      <rect width={W} height={HZ} fill={url('glassSheen')} />
      <g fill={pa.accent}>
        {mullions.map((x) => (
          <rect key={x} x={x - 3} y={top} width="6" height={dwarf - top} />
        ))}
        <rect y={top - 4} width={W} height="8" />
        <rect y="200" width={W} height="5" />
      </g>
      <g stroke={pa.accent} strokeWidth="5">
        {mullions.map((x) => (
          <path key={x} d={`M${x} ${top} L${f1(VPX + (x - VPX) * 0.55)} 0`} />
        ))}
        <path d={`M0 48 H${W}`} strokeWidth="4" />
      </g>
      <g stroke={pa.accent} strokeWidth="3" fill="none">
        {mullions.slice(0, -1).map((x) => (
          <path key={x} d={`M${x + 3} 236 Q${x + 50} 206 ${x + 97} 236`} />
        ))}
      </g>
      <rect y={dwarf} width={W} height={HZ - dwarf} fill={url('stone')} />
      <rect y={dwarf} width={W} height={HZ - dwarf} fill="#000000" opacity="0.45" />
      <rect y={dwarf - 6} width={W} height="8" fill={pa.trim} />
      {animated && (
        <g stroke="#a9c1e0" strokeOpacity="0.4" strokeWidth="1.4">
          <path d="M318 0 V40" className={styles.drip} />
          <path d="M642 0 V40" className={styles.drip} style={{ animationDelay: '1.3s' }} />
        </g>
      )}
    </>
  );
}

function wallTrim(c: Ctx): ReactNode {
  const { spec, pa } = c;
  if (spec.wall === 'open' || spec.wall === 'glass') return null;
  return (
    <>
      {spec.wainscot && (
        <g>
          <rect y={HZ - 132} width={W} height="132" fill={pa.trim} />
          {raisedPanels(c, HZ - 124, HZ - 12, 7)}
          <rect y={HZ - 140} width={W} height="10" fill={pa.trim} />
          <rect y={HZ - 140} width={W} height="1.6" fill="#f2cd7a" opacity="0.1" />
          <rect y={HZ - 130} width={W} height="2" fill="#000000" opacity="0.5" />
        </g>
      )}
      {spec.crown && (
        <g>
          <rect width={W} height="16" fill={pa.trim} />
          <rect y="16" width={W} height="3" fill="#000000" opacity="0.5" />
          <rect y="15" width={W} height="1" fill="#f2cd7a" opacity="0.06" />
        </g>
      )}
      <rect y={HZ - 14} width={W} height="14" fill={pa.trim} />
      <rect y={HZ - 14} width={W} height="1.4" fill="#f2cd7a" opacity="0.08" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Windows

function skyline(r: () => number, x0: number, x1: number, base: number, maxH: number): { body: string; lights: string } {
  let body = `M${x0} ${base}`;
  let lights = '';
  let x = x0;
  while (x < x1) {
    const w = 18 + r() * 40;
    const h = maxH * (0.3 + r() * 0.7);
    body += `V${f1(base - h)}H${f1(x + w)}`;
    for (let i = 0; i < 3; i++) {
      if (r() < 0.45) lights += `M${f1(x + 4 + r() * (w - 8))} ${f1(base - h + 6 + r() * (h - 12))}h2.4v2.4h-2.4Z`;
    }
    x += w;
  }
  body += `V${base}Z`;
  return { body, lights };
}

function drawWindows(c: Ctx): ReactNode {
  const { layout, pa, spec, r, url } = c;
  if (layout.windows.length === 0) return null;
  const kind = layout.windowKind;
  const rainy = spec.rain !== 'none';
  return layout.windows.map((w, i) => {
    const clip = c.id(`win${i}`);
    const glassShape =
      kind === 'arched' ? (
        <path d={`M${w.x} ${w.y + w.h} V${w.y + w.w / 2} A${w.w / 2} ${w.w / 2} 0 0 1 ${w.x + w.w} ${w.y + w.w / 2} V${w.y + w.h} Z`} />
      ) : kind === 'fanlight' ? (
        <path d={`M${w.x} ${w.y + w.h} A${w.w / 2} ${w.h} 0 0 1 ${w.x + w.w} ${w.y + w.h} Z`} />
      ) : (
        <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={kind === 'carriage' ? 18 : 0} />
      );
    const city = skyline(r, w.x - 10, w.x + w.w + 10, w.y + w.h, w.h * 0.4);
    return (
      <g key={i}>
        <clipPath id={clip}>{glassShape}</clipPath>
        <g transform={`translate(-8 -8)`} fill={pa.trim}>
          {kind === 'arched' ? (
            <path d={`M${w.x} ${w.y + w.h + 16} V${w.y + w.w / 2} A${w.w / 2 + 8} ${w.w / 2 + 8} 0 0 1 ${w.x + w.w + 16} ${w.y + w.w / 2} V${w.y + w.h + 16} Z`} />
          ) : kind === 'fanlight' ? (
            <path d={`M${w.x} ${w.y + w.h + 16} A${w.w / 2 + 8} ${w.h + 8} 0 0 1 ${w.x + w.w + 16} ${w.y + w.h + 16} Z`} />
          ) : (
            <rect x={w.x} y={w.y} width={w.w + 16} height={w.h + 16} rx={kind === 'carriage' ? 24 : 2} />
          )}
        </g>
        <g clipPath={`url(#${clip})`}>
          <rect x={w.x - 20} y={w.y - 20} width={w.w + 40} height={w.h + 40} fill={url('sky')} />
          {kind === 'frosted' ? (
            <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#8fa3bd" opacity="0.18" />
          ) : (
            <>
              <ellipse cx={w.x + w.w * 0.7} cy={w.y + w.h * 0.25} rx={w.w * 0.5} ry={w.h * 0.4} fill={url('moon')} />
              {kind !== 'carriage' && (
                <>
                  <path d={city.body} fill="#04060b" opacity="0.92" />
                  <path d={city.lights} fill={pa.light} opacity="0.7" />
                </>
              )}
              {kind === 'carriage' && (
                <path d={`M${w.x - 10} ${w.y + w.h - 30} Q${w.x + w.w * 0.4} ${w.y + w.h - 52} ${w.x + w.w + 10} ${w.y + w.h - 36} V${w.y + w.h} H${w.x - 10} Z`} fill="#04060b" />
              )}
            </>
          )}
          {c.has('hotelSign') && kind === 'sash' && i === 0 && (
            <g className={anim(c, styles.neon)}>
              <rect x={w.x + w.w * 0.58} y={w.y + 14} width="34" height={w.h - 50} fill="#0b0d12" />
              {'HOTEL'.split('').map((ch, j) => (
                <text
                  key={j}
                  x={w.x + w.w * 0.58 + 17}
                  y={w.y + 44 + j * ((w.h - 70) / 5)}
                  textAnchor="middle"
                  fontFamily="Limelight, Georgia, serif"
                  fontSize="26"
                  fill="#f2cd7a"
                  opacity="0.85"
                >
                  {ch}
                </text>
              ))}
              <ellipse cx={w.x + w.w * 0.58 + 17} cy={w.y + w.h / 2} rx="60" ry={w.h / 2} fill={url('glow')} opacity="0.7" />
            </g>
          )}
          {c.has('passingLights') && kind === 'carriage' && (
            <g className={anim(c, styles.passing)} style={{ animationDelay: `${-i * 0.9}s` }}>
              {[0, 260, 520, 900].map((x) => (
                <ellipse key={x} cx={w.x + w.w + 60 + x} cy={w.y + w.h - 40 - (x % 3) * 8} rx="26" ry="5" fill={pa.light} opacity="0.5" />
              ))}
            </g>
          )}
          {rainy && (
            <g transform={`translate(${w.x} ${w.y})`}>
              <g className={anim(c, styles.rain60)}>
                <path d={rainPath(r, w.w + 30, w.h, Math.round((w.w * w.h) / 900), 60, kind === 'carriage' ? 30 : 20)} stroke="#a9c1e0" strokeOpacity={kind === 'frosted' ? 0.2 : 0.42} strokeWidth="1.1" />
              </g>
            </g>
          )}
          <rect x={w.x} y={w.y} width={w.w} height={w.h} fill={url('glassSheen')} />
        </g>
        {windowBars(c, w, kind, clip)}
      </g>
    );
  });
}

function windowBars(c: Ctx, w: Rect, kind: WindowKind, clip: string): ReactNode {
  const { pa } = c;
  const bar = pa.trim;
  switch (kind) {
    case 'sash':
    case 'frosted':
      return (
        <g>
          <rect x={w.x + w.w / 2 - 3} y={w.y} width="6" height={w.h} fill={bar} />
          <rect x={w.x} y={w.y + w.h * 0.48} width={w.w} height="9" fill={bar} />
          {kind === 'sash' && (
            <>
              <rect x={w.x} y={w.y + w.h * 0.24} width={w.w} height="3" fill={bar} />
              <rect x={w.x} y={w.y + w.h * 0.74} width={w.w} height="3" fill={bar} />
            </>
          )}
          <rect x={w.x - 16} y={w.y + w.h + 6} width={w.w + 32} height="10" fill={bar} />
          <rect x={w.x - 16} y={w.y + w.h + 6} width={w.w + 32} height="1.6" fill="#f2cd7a" opacity="0.14" />
        </g>
      );
    case 'arched':
      return (
        <g fill={bar}>
          <rect x={w.x + w.w / 2 - 3} y={w.y} width="6" height={w.h} />
          {[0.38, 0.6, 0.82].map((t) => (
            <rect key={t} x={w.x} y={w.y + w.h * t} width={w.w} height="4" />
          ))}
          <rect x={w.x - 14} y={w.y + w.h + 6} width={w.w + 28} height="10" />
        </g>
      );
    case 'fanlight': {
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h;
      return (
        <g>
          <g stroke={bar} strokeWidth="5" fill="none" clipPath={`url(#${clip})`}>
            {[-60, -30, 0, 30, 60].map((a) => {
              const rad = ((a - 90) * Math.PI) / 180;
              return <path key={a} d={`M${cx} ${cy} L${f1(cx + Math.cos(rad) * w.w * 0.5)} ${f1(cy + Math.sin(rad) * w.h)}`} />;
            })}
            <path d={`M${cx - 34} ${cy} A34 30 0 0 1 ${cx + 34} ${cy}`} />
          </g>
          <rect x={w.x - 8} y={cy} width={w.w + 16} height="10" fill={bar} />
          <rect x={w.x - 8} y={cy} width={w.w + 16} height="1.6" fill="#f2cd7a" opacity="0.12" />
        </g>
      );
    }
    case 'blinds':
      return (
        <g>
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={w.x} y={w.y + i * (w.h / 14)} width={w.w} height={w.h / 14 - 6} fill={bar} opacity="0.96" />
          ))}
          <rect x={w.x + w.w / 2 - 2} y={w.y} width="4" height={w.h} fill={bar} />
          <path d={`M${w.x + w.w - 20} ${w.y} V${w.y + w.h + 30}`} stroke={bar} strokeWidth="1.4" />
          <rect x={w.x - 14} y={w.y + w.h + 6} width={w.w + 28} height="10" fill={bar} />
        </g>
      );
    case 'small':
      return (
        <g fill={bar}>
          {[0.25, 0.5, 0.75].map((t) => (
            <rect key={t} x={w.x + w.w * t - 2.5} y={w.y} width="5" height={w.h} />
          ))}
        </g>
      );
    case 'grid':
      return (
        <g fill={bar}>
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={`v${i}`} x={w.x + (i * w.w) / 12 - 2.5} y={w.y} width="5" height={w.h} />
          ))}
          {[0.33, 0.66].map((t) => (
            <rect key={t} x={w.x} y={w.y + w.h * t - 2} width={w.w} height="4" />
          ))}
          <rect x={w.x + w.w * 0.25 + 4} y={w.y + 4} width={w.w / 12 - 8} height={w.h * 0.33 - 6} fill="#020306" opacity="0.8" />
          <rect x={w.x + w.w * 0.75 + 4} y={w.y + w.h * 0.66 + 3} width={w.w / 12 - 8} height={w.h * 0.33 - 6} fill="#020306" opacity="0.8" />
        </g>
      );
    case 'carriage':
      return <rect x={w.x - 8} y={w.y + w.h + 6} width={w.w + 16} height="8" fill={bar} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Floors

function drawFloor(c: Ctx): ReactNode {
  const { spec, pa, url, r } = c;
  const base = <rect y={HZ} width={W} height={H - HZ} fill={url('floor')} />;
  const lines = (step: number, from = -500, to = 1500) => {
    let d = '';
    for (let xb = from; xb <= to; xb += step) d += `M${f1(xAt(xb, HZ))} ${HZ}L${xb} ${H}`;
    return d;
  };
  const checker = (step: number, rows: number, a: string, b: string, ao = 1, bo = 1) => {
    const ys = depthRows(rows);
    let da = '';
    let db = '';
    for (let j = 0; j < ys.length - 1; j++) {
      const y0 = ys[j]!;
      const y1 = ys[j + 1]!;
      let i = 0;
      for (let xb = -500; xb < 1500; xb += step, i++) {
        const q = quad([xAt(xb, y0), y0], [xAt(xb + step, y0), y0], [xAt(xb + step, y1), y1], [xAt(xb, y1), y1]);
        if ((i + j) % 2 === 0) da += q;
        else db += q;
      }
    }
    return (
      <>
        <path d={da} fill={a} opacity={ao} />
        <path d={db} fill={b} opacity={bo} />
      </>
    );
  };
  const rowLines = (n: number) =>
    depthRows(n)
      .map((y) => `M0 ${f1(y)}H${W}`)
      .join('');
  let detail: ReactNode = null;
  switch (spec.floor) {
    case 'boards': {
      const ys = depthRows(9);
      let joints = '';
      for (let j = 1; j < ys.length; j++) {
        for (let xb = -500, i = 0; xb < 1500; xb += 64, i++) {
          if ((i + j * 2) % 5 !== 0) continue;
          const y = ys[j]!;
          joints += `M${f1(xAt(xb, y))} ${f1(y)}L${f1(xAt(xb + 64, y))} ${f1(y)}`;
        }
      }
      detail = (
        <>
          <path d={lines(64)} stroke={pa.floorLine} strokeOpacity="0.85" strokeWidth="1.4" />
          <path d={joints} stroke={pa.floorLine} strokeOpacity="0.7" strokeWidth="1.2" />
          <path d={lines(64, -468)} stroke="#f2cd7a" strokeOpacity="0.025" strokeWidth="3" />
        </>
      );
      break;
    }
    case 'parquet':
      detail = (
        <>
          {checker(96, 8, pa.floorAlt, pa.floorFar, 0.55, 0.3)}
          <path d={lines(24)} stroke={pa.floorLine} strokeOpacity="0.35" />
          <path d={rowLines(8)} stroke={pa.floorLine} strokeOpacity="0.6" />
        </>
      );
      break;
    case 'checker':
      detail = (
        <>
          {checker(110, 7, pa.floorFar, pa.floorAlt, 0.95, 0.95)}
          <rect y={HZ} width={W} height={H - HZ} fill={url('floor')} opacity="0.45" />
        </>
      );
      break;
    case 'smallTile':
      detail = (
        <>
          {checker(40, 16, pa.floorFar, pa.floorAlt, 0.4, 0.2)}
          <path d={lines(40)} stroke={pa.floorLine} strokeOpacity="0.7" />
          <path d={rowLines(16)} stroke={pa.floorLine} strokeOpacity="0.7" />
        </>
      );
      break;
    case 'linoleum':
      detail = (
        <>
          {checker(130, 6, pa.floorAlt, pa.floorFar, 0.4, 0.2)}
          <ellipse cx="500" cy={HZ + 90} rx="380" ry="40" fill="#ffffff" opacity="0.025" />
        </>
      );
      break;
    case 'carpet':
      detail = (
        <>
          <path d={lines(18)} stroke="#000000" strokeOpacity="0.12" />
          <rect y={HZ} width={W} height="16" fill="#000000" opacity="0.25" />
          <path d={`M0 ${HZ + 26}H${W}`} stroke={pa.floorAlt} strokeOpacity="0.5" strokeWidth="3" />
        </>
      );
      break;
    case 'cobbles': {
      const ys = depthRows(14);
      let d = '';
      let wet = '';
      for (let j = 0; j < ys.length - 1; j++) {
        const y0 = ys[j]!;
        const y1 = ys[j + 1]!;
        const cy = (y0 + y1) / 2;
        const ry = (y1 - y0) * 0.42;
        const off = (j % 2) * 30;
        for (let xb = -500 + off; xb < 1500; xb += 60) {
          const xl = xAt(xb, cy);
          const xr = xAt(xb + 60, cy);
          const rx = (xr - xl) * 0.44;
          const cx = (xl + xr) / 2 + (r() - 0.5) * rx * 0.3;
          d += `M${f1(cx - rx)} ${f1(cy)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(rx * 2)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-rx * 2)} 0`;
          if (r() < 0.25) wet += `M${f1(cx - rx * 0.5)} ${f1(cy - ry * 0.4)}h${f1(rx * 0.6)}`;
        }
      }
      detail = (
        <>
          <rect y={HZ} width={W} height={H - HZ} fill="#030406" opacity="0.6" />
          <path d={d} fill={pa.floorAlt} />
          <path d={d} fill={url('floor')} opacity="0.5" />
          <path d={wet} stroke="#8fb3e0" strokeOpacity="0.16" strokeWidth="1.4" />
        </>
      );
      break;
    }
    case 'planks': {
      const ys = depthRows(16);
      let gaps = '';
      let nails = '';
      ys.forEach((y, j) => {
        gaps += `M0 ${f1(y)}H${W}`;
        if (j > 0) {
          const h = y - ys[j - 1]!;
          for (const xb of [80, 920]) nails += `M${f1(xAt(xb, y - h / 2))} ${f1(y - h / 2)}h2`;
        }
      });
      detail = (
        <>
          <path d={gaps} stroke="#020202" strokeOpacity="0.9" strokeWidth="2.4" />
          <path d={lines(250)} stroke="#020202" strokeOpacity="0.5" />
          <path d={nails} stroke="#cdbb95" strokeOpacity="0.3" strokeWidth="2" />
        </>
      );
      break;
    }
    case 'grass': {
      let tufts = '';
      for (let i = 0; i < 160; i++) {
        const y = HZ + 10 + Math.pow(r(), 0.7) * (H - HZ - 10);
        const x = r() * W;
        const s = 4 + ((y - HZ) / (H - HZ)) * 14;
        tufts += `M${f1(x)} ${f1(y)}l${f1(-s * 0.3)} ${f1(-s)}M${f1(x)} ${f1(y)}l${f1(s * 0.25)} ${f1(-s * 0.9)}`;
      }
      detail = (
        <>
          <path d={`M${xAt(420, HZ)} ${HZ}L${xAt(580, HZ)} ${HZ}L740 ${H}L260 ${H}Z`} fill={pa.floorAlt} opacity="0.85" />
          <path d={`M${xAt(420, HZ)} ${HZ}L260 ${H}M${xAt(580, HZ)} ${HZ}L740 ${H}`} stroke="#000000" strokeOpacity="0.5" strokeWidth="3" />
          <path d={tufts} stroke="#16261c" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
      break;
    }
    case 'flagstone': {
      const ys = depthRows(7);
      let seams = '';
      let fillA = '';
      for (let j = 0; j < ys.length - 1; j++) {
        const y0 = ys[j]!;
        const y1 = ys[j + 1]!;
        let xb = -500 + r() * 80;
        while (xb < 1500) {
          const w = 110 + r() * 90;
          if (r() < 0.45) fillA += quad([xAt(xb, y0), y0], [xAt(xb + w, y0), y0], [xAt(xb + w, y1), y1], [xAt(xb, y1), y1]);
          seams += `M${f1(xAt(xb, y0))} ${f1(y0)}L${f1(xAt(xb, y1))} ${f1(y1)}`;
          xb += w;
        }
      }
      detail = (
        <>
          <path d={fillA} fill={pa.floorAlt} opacity="0.7" />
          <path d={seams} stroke={pa.floorLine} strokeWidth="2.4" />
          <path d={rowLines(7)} stroke={pa.floorLine} strokeWidth="2.4" />
        </>
      );
      break;
    }
    case 'concrete':
      detail = (
        <>
          <path d={lines(260, -540)} stroke={pa.floorLine} strokeOpacity="0.7" strokeWidth="1.6" />
          <path d={depthRows(4).map((y) => `M0 ${f1(y)}H${W}`).join('')} stroke={pa.floorLine} strokeOpacity="0.6" strokeWidth="1.6" />
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx={r() * W} cy={HZ + 30 + r() * (H - HZ - 40)} rx={30 + r() * 70} ry={8 + r() * 16} fill="#000000" opacity={0.18 + r() * 0.15} />
          ))}
        </>
      );
      break;
  }
  return (
    <>
      {base}
      {detail}
      <rect y={HZ} width={W} height="46" fill={url('ao')} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Set dressing

function free(c: Ctx, candidates: Rect[], maxCovered = 0.05): Rect | null {
  return pickRect(candidates, c.layout.obstacles, maxCovered);
}

function palmTree(cx: number, baseY: number, height: number, fill: string, r: () => number): ReactElement {
  const topY = baseY - height;
  let leaves = '';
  for (let i = 0; i < 9; i++) {
    const a = (-170 + i * 20 + (r() - 0.5) * 10) * (Math.PI / 180);
    const len = height * (0.45 + r() * 0.2);
    const tx = cx + Math.cos(a) * len;
    const ty = topY + Math.sin(a) * len * 0.5 + len * 0.35;
    const mx = cx + Math.cos(a) * len * 0.5;
    const my = topY + Math.sin(a) * len * 0.4 - len * 0.1;
    leaves += `M${f1(cx)} ${f1(topY)}Q${f1(mx)} ${f1(my - 10)} ${f1(tx)} ${f1(ty)}Q${f1(mx)} ${f1(my + 8)} ${f1(cx)} ${f1(topY)}Z`;
  }
  return (
    <g fill={fill}>
      <path d={`M${cx - 6} ${baseY} Q${cx + 10} ${baseY - height * 0.5} ${cx} ${topY} L${cx + 4} ${topY} Q${cx + 16} ${baseY - height * 0.5} ${cx + 6} ${baseY} Z`} />
      <path d={leaves} />
    </g>
  );
}

function wallExtras(c: Ctx): ReactNode {
  const { pa, layout, r, url } = c;
  const out: ReactElement[] = [];
  const win = layout.windows[0];
  if (c.has('pictureRail')) {
    out.push(<rect key="rail" y="104" width={W} height="4" fill={pa.trim} opacity="0.9" />);
  }
  if (c.has('drapes') && win) {
    const top = win.y - 34;
    const bottom = HZ - 18;
    const left = `M${win.x - 64} ${top} H${win.x + 26} C${win.x + 18} ${top + 120} ${win.x + 4} ${win.y + win.h * 0.6} ${win.x - 22} ${win.y + win.h * 0.7} C${win.x - 10} ${win.y + win.h * 0.9} ${win.x - 4} ${bottom - 60} ${win.x - 10} ${bottom} H${win.x - 64} Z`;
    const rx = win.x + win.w;
    const right = `M${rx + 64} ${top} H${rx - 26} C${rx - 18} ${top + 120} ${rx - 4} ${win.y + win.h * 0.6} ${rx + 22} ${win.y + win.h * 0.7} C${rx + 10} ${win.y + win.h * 0.9} ${rx + 4} ${bottom - 60} ${rx + 10} ${bottom} H${rx + 64} Z`;
    out.push(
      <g key="drapes">
        <path d={left + right} fill={pa.fabric} />
        <path d={left + right} fill="#000000" opacity="0.35" />
        <g stroke="#000000" strokeOpacity="0.45" fill="none" strokeWidth="3">
          <path d={`M${win.x - 44} ${top} C${win.x - 40} ${top + 140} ${win.x - 46} ${bottom - 80} ${win.x - 40} ${bottom}`} />
          <path d={`M${rx + 44} ${top} C${rx + 40} ${top + 140} ${rx + 46} ${bottom - 80} ${rx + 40} ${bottom}`} />
        </g>
        <rect x={win.x - 74} y={top - 10} width={win.w + 148} height="12" rx="4" fill={pa.trim} />
        <rect x={win.x - 74} y={top - 10} width={win.w + 148} height="1.6" fill="#f2cd7a" opacity="0.15" />
        <rect x={win.x - 30} y={win.y + win.h * 0.68} width="16" height="6" fill="#8a6a32" opacity="0.6" />
        <rect x={rx + 14} y={win.y + win.h * 0.68} width="16" height="6" fill="#8a6a32" opacity="0.6" />
      </g>,
    );
  }
  if (c.has('radiator') && win) {
    const y = HZ - 88;
    const x = win.x + 16;
    const w = win.w - 32;
    out.push(
      <g key="radiator" fill={pa.trim}>
        <rect x={x} y={y} width={w} height="70" rx="6" />
        {Array.from({ length: Math.floor(w / 14) }, (_, i) => (
          <rect key={i} x={x + 6 + i * 14} y={y + 6} width="6" height="58" rx="3" fill="#000000" opacity="0.45" />
        ))}
        <rect x={x} y={y} width={w} height="1.6" fill="#f2cd7a" opacity="0.1" />
      </g>,
    );
  }
  if (c.has('potRack')) {
    const spot = free(c, [
      { x: 300, y: 40, w: 400, h: 120 },
      { x: 60, y: 40, w: 300, h: 120 },
      { x: 640, y: 40, w: 300, h: 120 },
    ]);
    if (spot) {
      const n = Math.floor(spot.w / 70);
      out.push(
        <g key="pots" fill={pa.propBottom}>
          <rect x={spot.x} y={spot.y + 10} width={spot.w} height="6" />
          {Array.from({ length: n }, (_, i) => {
            const cx = spot.x + 35 + i * 70;
            const rad = 18 + (i % 3) * 6;
            return (
              <g key={i}>
                <path d={`M${cx} ${spot.y + 16} V${spot.y + 40}`} stroke={pa.propBottom} strokeWidth="2" />
                <circle cx={cx} cy={spot.y + 40 + rad} r={rad} />
                <rect x={cx - 3} y={spot.y + 30} width="6" height="14" />
                <path d={`M${cx + rad * 0.7} ${spot.y + 40 + rad * 0.3} A${rad} ${rad} 0 0 1 ${cx + rad * 0.2} ${spot.y + 40 + rad * 1.9}`} stroke="#f2cd7a" strokeOpacity="0.18" fill="none" />
              </g>
            );
          })}
        </g>,
      );
    }
  }
  if (c.has('shelfJars')) {
    const spot = free(c, [
      { x: 60, y: 150, w: 260, h: 70 },
      { x: 680, y: 150, w: 260, h: 70 },
      { x: 370, y: 150, w: 260, h: 70 },
    ]);
    if (spot) {
      out.push(
        <g key="jars">
          <rect x={spot.x} y={spot.y + 60} width={spot.w} height="7" fill={pa.trim} />
          {Array.from({ length: Math.floor(spot.w / 34) }, (_, i) => {
            const h = 30 + ((i * 13) % 24);
            return <rect key={i} x={spot.x + 8 + i * 34} y={spot.y + 60 - h} width="22" height={h} rx="5" fill={i % 2 ? '#152024' : '#1d2628'} />;
          })}
        </g>,
      );
    }
  }
  if (c.has('pipes')) {
    const x = free(c, [{ x: 930, y: 0, w: 40, h: HZ }], 0.2) ? 950 : 40;
    out.push(
      <g key="pipes" stroke={pa.trim} strokeWidth="10" fill="none">
        <path d={`M${x} ${HZ - 10} V34 H${x > 500 ? 600 : 400}`} />
        <path d={`M${x + 22} ${HZ - 10} V54`} strokeWidth="6" />
        <path d={`M${x - 4} 140 h8 M${x - 4} 260 h8`} stroke="#f2cd7a" strokeOpacity="0.15" strokeWidth="3" />
      </g>,
    );
  }
  if (c.has('towelRail')) {
    const spot = free(c, [
      { x: 80, y: 150, w: 130, h: 130 },
      { x: 790, y: 150, w: 130, h: 130 },
      { x: 430, y: 150, w: 130, h: 130 },
    ]);
    if (spot) {
      out.push(
        <g key="towel">
          <rect x={spot.x} y={spot.y} width={spot.w} height="6" rx="3" fill="#8a6a32" opacity="0.55" />
          <path d={`M${spot.x + 20} ${spot.y + 4} H${spot.x + spot.w - 20} V${spot.y + 110} L${spot.x + spot.w - 34} ${spot.y + 118} H${spot.x + 20} Z`} fill="#cdbb95" opacity="0.18" />
        </g>,
      );
    }
  }
  if (c.has('ladder')) {
    const spot = free(c, [
      { x: 820, y: 20, w: 120, h: HZ + 40 },
      { x: 60, y: 20, w: 120, h: HZ + 40 },
      { x: 300, y: 20, w: 120, h: HZ + 40 },
    ], 0.2);
    if (spot) {
      const x = spot.x;
      out.push(
        <g key="ladder" stroke={pa.propBottom} strokeWidth="7">
          <path d={`M${x} ${HZ + 40} L${x + 60} 24 M${x + 50} ${HZ + 40} L${x + 110} 24`} />
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i + 1) / 10;
            const y = HZ + 40 - t * (HZ + 16);
            return <path key={i} d={`M${f1(x + t * 60)} ${f1(y)} h50`} strokeWidth="4" />;
          })}
          <path d={`M0 22 H${W}`} stroke="#8a6a32" strokeOpacity="0.5" strokeWidth="3" />
        </g>,
      );
    }
  }
  if (c.has('certificate')) {
    const spot = free(c, [
      { x: 120, y: 90, w: 110, h: 80 },
      { x: 420, y: 90, w: 110, h: 80 },
      { x: 780, y: 100, w: 110, h: 80 },
    ]);
    if (spot) {
      out.push(
        <g key="cert">
          <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} fill={pa.trim} />
          <rect x={spot.x + 8} y={spot.y + 8} width={spot.w - 16} height={spot.h - 16} fill="#cdbb95" opacity="0.22" />
          <path d={`M${spot.x + 20} ${spot.y + 26} h${spot.w - 40} M${spot.x + 26} ${spot.y + 40} h${spot.w - 52}`} stroke="#000000" strokeOpacity="0.4" />
        </g>,
      );
    }
  }
  if (c.has('posters')) {
    const spots = [
      { x: 90, y: 70, w: 120, h: 170 },
      { x: 410, y: 60, w: 120, h: 170 },
      { x: 760, y: 70, w: 120, h: 170 },
      { x: 250, y: 80, w: 120, h: 170 },
    ].filter((s) => free(c, [s]));
    spots.slice(0, 2).forEach((s, i) => {
      out.push(
        <g key={`poster${i}`} transform={`rotate(${i ? 2 : -2} ${s.x + s.w / 2} ${s.y + s.h / 2})`}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#cdbb95" opacity="0.2" />
          <rect x={s.x + 10} y={s.y + 12} width={s.w - 20} height="26" fill="#000000" opacity="0.4" />
          <circle cx={s.x + s.w / 2} cy={s.y + 92} r="30" fill="#000000" opacity="0.32" />
          <path d={`M${s.x + 14} ${s.y + 142} h${s.w - 28} M${s.x + 20} ${s.y + 154} h${s.w - 40}`} stroke="#000000" strokeOpacity="0.4" strokeWidth="3" />
        </g>,
      );
    });
  }
  if (c.has('costumeRail')) {
    const spot = free(c, [
      { x: 700, y: 120, w: 260, h: HZ - 100 },
      { x: 40, y: 120, w: 260, h: HZ - 100 },
      { x: 370, y: 120, w: 260, h: HZ - 100 },
    ], 0.15);
    if (spot) {
      out.push(
        <g key="rail" fill={pa.propBottom}>
          <rect x={spot.x} y={spot.y + 10} width={spot.w} height="5" />
          <rect x={spot.x} y={spot.y + 10} width="5" height={spot.h} />
          <rect x={spot.x + spot.w - 5} y={spot.y + 10} width="5" height={spot.h} />
          {Array.from({ length: 5 }, (_, i) => {
            const x = spot.x + 26 + i * ((spot.w - 52) / 4);
            return <path key={i} d={`M${x} ${spot.y + 14} l-22 22 l-6 ${120 + (i % 2) * 40} h56 l-6 ${-120 - (i % 2) * 40} Z`} fill={i % 2 ? pa.fabric : pa.propMid} opacity="0.85" />;
          })}
        </g>,
      );
    }
  }
  if (c.has('backbar')) {
    const shelves = [210, 262, 314];
    let bottles = '';
    let glints = '';
    for (const y of shelves) {
      let x = 130;
      while (x < 870) {
        const h = 26 + r() * 18;
        const w = 9 + r() * 6;
        bottles += `M${f1(x)} ${y}v${f1(-h * 0.7)}q0 -6 ${f1(w * 0.3)} -8v${f1(-h * 0.3 + 8)}h${f1(w * 0.4)}v${f1(h * 0.3 - 8)}q${f1(w * 0.3)} 2 ${f1(w * 0.3)} 8v${f1(h * 0.7)}Z`;
        if (r() < 0.5) glints += `M${f1(x + w * 0.7)} ${f1(y - h * 0.6)}v${f1(h * 0.4)}`;
        x += w + 6 + r() * 10;
      }
    }
    out.push(
      <g key="backbar">
        <rect x="110" y="60" width="780" height="130" fill="#0d1622" />
        <rect x="110" y="60" width="780" height="130" fill={url('glassSheen')} />
        <ellipse cx={layout.lamp.x} cy="130" rx="120" ry="50" fill={url('glow')} opacity="0.35" />
        <rect x="100" y="52" width="800" height="10" fill={pa.trim} />
        <rect x="100" y="188" width="800" height="10" fill={pa.trim} />
        <path d={bottles} fill="#0a100e" />
        <path d={glints} stroke="#f2cd7a" strokeOpacity="0.35" strokeWidth="1.4" />
        {shelves.map((y) => (
          <g key={y}>
            <rect x="110" y={y} width="780" height="6" fill={pa.trim} />
            <rect x="110" y={y} width="780" height="1.4" fill="#f2cd7a" opacity="0.12" />
          </g>
        ))}
      </g>,
    );
  }
  if (c.has('neon')) {
    const spot = free(c, [
      { x: 350, y: 4, w: 300, h: 50 },
      { x: 120, y: 4, w: 300, h: 50 },
      { x: 600, y: 4, w: 300, h: 50 },
    ], 0.3) ?? { x: 350, y: 4, w: 300, h: 50 };
    out.push(
      <g key="neon" className={anim(c, styles.neon)}>
        <ellipse cx={spot.x + spot.w / 2} cy={spot.y + 26} rx={spot.w * 0.7} ry="60" fill={url('glow')} opacity="0.55" />
        <text x={spot.x + spot.w / 2} y={spot.y + 40} textAnchor="middle" fontFamily="Limelight, Georgia, serif" fontSize="38" letterSpacing="6" fill="none" stroke="#f2cd7a" strokeWidth="2.4">
          COCKTAILS
        </text>
        <text x={spot.x + spot.w / 2} y={spot.y + 40} textAnchor="middle" fontFamily="Limelight, Georgia, serif" fontSize="38" letterSpacing="6" fill="#f8e2ae" opacity="0.35">
          COCKTAILS
        </text>
      </g>,
    );
  }
  if (c.has('columns')) {
    for (const x of [70, 930]) {
      out.push(
        <g key={`col${x}`}>
          <rect x={x - 34} y="0" width="68" height={HZ} fill={pa.trim} />
          <rect x={x - 26} y="0" width="52" height={HZ} fill={pa.accent} opacity="0.5" />
          <g stroke="#000000" strokeOpacity="0.4">
            {[-14, 0, 14].map((o) => (
              <path key={o} d={`M${x + o} 40 V${HZ - 40}`} />
            ))}
          </g>
          <rect x={x - 42} y="24" width="84" height="18" fill={pa.trim} />
          <rect x={x - 42} y={HZ - 40} width="84" height="26" fill={pa.trim} />
          <rect x={x - 42} y="24" width="84" height="1.6" fill="#f2cd7a" opacity="0.15" />
        </g>,
      );
    }
  }
  if (c.has('sunburst')) {
    const cx = 500;
    const cy = 150;
    out.push(
      <g key="sun" stroke="#d9a23a" strokeOpacity="0.14" strokeWidth="2">
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 12;
          return <path key={i} d={`M${f1(cx + Math.cos(a) * 30)} ${f1(cy + Math.sin(a) * 30)} L${f1(cx + Math.cos(a) * 130)} ${f1(cy + Math.sin(a) * 130)}`} />;
        })}
        <path d={`M${cx - 30} ${cy} A30 30 0 0 1 ${cx + 30} ${cy}`} fill="none" />
        <path d={`M${cx - 140} ${cy} H${cx + 140}`} />
      </g>,
    );
  }
  if (c.has('elevator')) {
    const spot = free(c, [
      { x: 640, y: 96, w: 170, h: HZ - 96 },
      { x: 190, y: 96, w: 170, h: HZ - 96 },
      { x: 415, y: 160, w: 170, h: HZ - 160 },
    ], 0.12);
    if (spot) {
      const cx = spot.x + spot.w / 2;
      out.push(
        <g key="lift">
          <rect x={spot.x} y={spot.y + 60} width={spot.w} height={spot.h - 60} fill={pa.trim} />
          <rect x={spot.x + 12} y={spot.y + 72} width={spot.w / 2 - 14} height={spot.h - 72} fill={pa.propMid} />
          <rect x={cx + 2} y={spot.y + 72} width={spot.w / 2 - 14} height={spot.h - 72} fill={pa.propMid} />
          <path d={`M${cx - 36} ${spot.y + 44} A36 36 0 0 1 ${cx + 36} ${spot.y + 44}`} stroke="#d9a23a" strokeOpacity="0.4" strokeWidth="3" fill="none" />
          <path d={`M${cx} ${spot.y + 44} L${cx + 20} ${spot.y + 20}`} stroke="#d9a23a" strokeOpacity="0.6" strokeWidth="2" />
        </g>,
      );
    }
  }
  if (c.has('trusses')) {
    let d = `M0 70 H${W} M0 6 H${W}`;
    for (let x = 0; x <= W; x += 80) d += `M${x} 70 L${x + 40} 6 L${x + 80} 70`;
    out.push(<path key="truss" d={d} stroke={pa.trim} strokeWidth="6" fill="none" />);
  }
  if (c.has('racks')) {
    let crates = '';
    for (const y of [250, HZ - 6]) {
      let x = 40;
      while (x < 960) {
        const w = 60 + r() * 50;
        const h = 50 + r() * 40;
        if (r() < 0.8) crates += `M${f1(x)} ${y}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`;
        x += w + 8;
      }
    }
    out.push(
      <g key="racks">
        <path d={crates} fill="#1a150e" />
        <path d={crates} fill="none" stroke="#000000" strokeOpacity="0.5" />
        <g fill={pa.trim}>
          <rect x="0" y="250" width={W} height="8" />
          <rect x="0" y="150" width={W} height="6" />
          {[30, 300, 560, 830].map((x) => (
            <rect key={x} x={x} y="140" width="10" height={HZ - 140} />
          ))}
        </g>
      </g>,
    );
  }
  if (c.has('arches')) {
    const arches: Array<[number, number]> = [
      [110, 410],
      [590, 890],
    ];
    arches.forEach(([x0, x1], ai) => {
      const w = x1 - x0;
      const outline = `M${x0} ${HZ} V150 A${w / 2} ${w / 2.4} 0 0 1 ${x1} 150 V${HZ}`;
      const clipId = c.id(`arch${ai}`);
      out.push(
        <g key={`arch${x0}`}>
          <clipPath id={clipId}>
            <path d={`${outline} Z`} />
          </clipPath>
          <path d={`${outline} Z`} fill="#050403" />
          {c.has('wineRacks') && (
            <g clipPath={`url(#${clipId})`}>
              <g stroke="#1b1610" strokeWidth="3">
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d={`M${x0 + i * 34 - 120} ${HZ} L${x0 + i * 34 + 80} 160`} />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={`b${i}`} d={`M${x0 + i * 34 - 80} 160 L${x0 + i * 34 + 120} ${HZ}`} />
                ))}
              </g>
              <g fill="#0f1a14">
                {Array.from({ length: 24 }, (_, i) => (
                  <circle key={i} cx={x0 + 24 + (i % 8) * 34} cy={200 + Math.floor(i / 8) * 56 + (i % 2) * 24} r="7" />
                ))}
              </g>
              <g fill="#f2cd7a" opacity="0.18">
                {Array.from({ length: 8 }, (_, i) => (
                  <circle key={i} cx={x0 + 26 + (i % 8) * 34} cy={198 + (i % 2) * 24} r="1.6" />
                ))}
              </g>
            </g>
          )}
          <path d={outline} stroke={pa.accent} strokeWidth="14" fill="none" />
        </g>,
      );
    });
  }
  if (c.has('palms')) {
    out.push(
      <g key="palms">
        {palmTree(520, HZ - 40, 190, '#081410', r)}
        {palmTree(70, HZ + 24, 310, '#050d0a', r)}
        {palmTree(944, HZ + 30, 270, '#050d0a', r)}
      </g>,
    );
  }
  if (c.has('cobwebs')) {
    out.push(
      <g key="webs" stroke="#cdbb95" strokeOpacity="0.12" fill="none">
        <path d="M0 0 L90 70 M0 0 L40 90 M0 0 L100 30 M20 16 Q34 6 46 8 M34 28 Q60 18 74 24 M14 40 Q26 30 30 18" />
        <path d="M1000 0 L910 70 M1000 0 L960 90 M1000 0 L900 30 M980 16 Q966 6 954 8 M966 28 Q940 18 926 24" />
      </g>,
    );
  }
  if (c.has('luggageRack')) {
    out.push(
      <g key="luggage">
        <rect x="40" y="40" width="920" height="4" fill="#8a6a32" opacity="0.6" />
        <rect x="40" y="54" width="920" height="3" fill="#8a6a32" opacity="0.45" />
        {[90, 380, 640].map((x, i) => (
          <rect key={x} x={x} y={10 - (i % 2) * 6} width={120 + (i % 2) * 40} height={30 + (i % 2) * 6} rx="4" fill={pa.propBottom} />
        ))}
      </g>,
    );
  }
  if (c.has('proscenium')) {
    out.push(
      <g key="pros">
        <path d={`M0 0 H${W} V${HZ + 40} H${W - 56} V70 Q500 30 56 70 V${HZ + 40} H0 Z`} fill="#0b0708" />
        <path d={`M56 ${HZ + 40} V70 Q500 30 ${W - 56} 70 V${HZ + 40}`} stroke="#d9a23a" strokeOpacity="0.28" strokeWidth="3" fill="none" />
        <path d={`M44 ${HZ + 40} V60 Q500 18 ${W - 44} 60 V${HZ + 40}`} stroke="#d9a23a" strokeOpacity="0.12" strokeWidth="2" fill="none" />
      </g>,
    );
  }
  return out;
}

function farExtras(c: Ctx): ReactNode {
  const { pa, r, url } = c;
  const out: ReactElement[] = [];
  if (c.has('moon')) {
    out.push(
      <g key="moon">
        <circle cx="660" cy="92" r="170" fill={url('moon')} />
        <circle cx="660" cy="92" r="28" fill="#e6ebf2" opacity="0.82" />
        <circle cx="652" cy="86" r="6" fill="#aab3c3" opacity="0.35" />
        <path d="M560 112 Q610 100 680 110 T800 104 L800 118 Q720 114 660 122 T560 124 Z" fill={pa.skyTop} opacity="0.55" />
      </g>,
    );
  }
  if (c.has('skyline')) {
    const far = skyline(r, 0, W, 300, 120);
    const near = skyline(r, 0, W, 300, 70);
    out.push(
      <g key="sky">
        <path d={far.body} fill="#0d1524" />
        <path d={far.lights} fill={pa.light} opacity="0.35" />
        <rect y="200" width={W} height="110" fill={url('sky')} opacity="0.45" />
        <path d={near.body} fill="#070b13" />
        <path d={near.lights} fill={pa.light} opacity="0.6" />
        <rect x="318" y="140" width="4" height="100" fill="#0d1524" />
        <circle cx="320" cy="138" r="3" fill={pa.light} className={anim(c, styles.blink)} />
      </g>,
    );
  }
  if (c.has('trees')) {
    out.push(
      <g key="trees" fill="#08130f">
        <path d={blob(r, 160, 170, 260, 140, 14)} opacity="0.75" />
        <path d={blob(r, 820, 150, 300, 160, 16)} opacity="0.8" />
        <path d={blob(r, 480, 230, 260, 80, 9)} opacity="0.6" />
        <rect x="150" y="200" width="16" height="110" opacity="0.75" />
        <rect x="820" y="190" width="18" height="120" opacity="0.8" />
      </g>,
    );
  }
  if (c.has('sea')) {
    let glints = '';
    for (let i = 0; i < 60; i++) {
      const y = 276 + Math.pow(r(), 1.4) * 90;
      const x = r() * W;
      glints += `M${f1(x)} ${f1(y)}h${f1(6 + ((y - 270) / 100) * 30)}`;
    }
    out.push(
      <g key="sea">
        <rect y="270" width={W} height={HZ - 270} fill={pa.accent} />
        <rect y="270" width={W} height="20" fill="#8fb3e0" opacity="0.05" />
        <path d={glints} stroke="#8fb3e0" strokeOpacity="0.2" strokeWidth="1.4" />
        <path d={Array.from({ length: 14 }, (_, i) => `M${740 + (r() - 0.5) * 40} ${280 + i * 7}h${20 + r() * 30}`).join('')} stroke="#c8d8ee" strokeOpacity="0.28" strokeWidth="2" />
      </g>,
    );
  }
  if (c.has('ship')) {
    out.push(
      <g key="ship" fill="#060a10">
        <path d="M560 270 L580 246 H880 L900 270 Z" />
        <rect x="640" y="214" width="150" height="32" />
        <rect x="680" y="186" width="80" height="28" />
        <rect x="716" y="150" width="22" height="36" />
        <path d="M610 246 V160 M840 246 V170 M610 170 L840 180" stroke="#060a10" strokeWidth="3" fill="none" />
        <g fill={pa.light} opacity="0.7">
          {[650, 672, 694, 760, 782].map((x) => (
            <rect key={x} x={x} y="226" width="4" height="4" />
          ))}
        </g>
        <circle cx="840" cy="168" r="3" fill={pa.light} className={anim(c, styles.blink)} />
      </g>,
    );
  }
  if (c.has('crane')) {
    let lattice = '';
    for (let y = 120; y < 270; y += 22) lattice += `M150 ${y} L190 ${y + 22} M190 ${y} L150 ${y + 22}`;
    out.push(
      <g key="crane" stroke="#070b12" fill="none" strokeWidth="5">
        <path d="M150 270 V100 M190 270 V100 M110 100 H400 M150 100 L170 60 L190 100 M170 60 L400 100 M360 100 V170" />
        <path d={lattice} strokeWidth="2.4" />
        <rect x="346" y="170" width="28" height="18" fill="#070b12" stroke="none" />
      </g>,
    );
  }
  return out;
}

function nearExtras(c: Ctx): ReactNode {
  const { pa, r, url } = c;
  const out: ReactElement[] = [];
  if (c.has('balustrade')) {
    let balusters = '';
    for (let x = 6; x < W; x += 34) {
      balusters += `M${x} ${HZ - 12} h18 l-3 -10 q-6 -14 0 -30 q5 -10 -1 -14 h-10 q-6 4 -1 14 q6 16 0 30 Z`;
    }
    out.push(
      <g key="bal" fill={pa.accent}>
        <rect y="282" width={W} height="20" />
        <rect y="282" width={W} height="2" fill="#f2cd7a" opacity="0.1" />
        <path d={balusters} transform="translate(0 0)" />
        <rect y={HZ - 14} width={W} height="14" />
        <path d={balusters} fill="#000000" opacity="0.3" />
      </g>,
    );
    if (c.has('urns')) {
      for (const x of [60, 940]) {
        out.push(<path key={`urn${x}`} d={`M${x - 22} 282 h44 l-6 -10 q14 -16 4 -38 h-40 q-10 22 4 38 Z M${x - 14} 234 h28 v-6 h-28 Z`} fill={pa.accent} />);
      }
    }
  }
  if (c.has('hedges')) {
    let top = `M0 ${HZ} V270`;
    for (let x = 0; x <= W; x += 50) top += ` Q${x + 25} ${250 + r() * 14} ${x + 50} ${266 + r() * 8}`;
    top += ` V${HZ} Z`;
    out.push(
      <g key="hedge">
        <path d={top} fill={pa.accent} />
        <path d={top} fill="#000000" opacity="0.35" />
        <path d={`M440 ${HZ} V300 Q500 252 560 300 V${HZ} Z`} fill="#030605" />
      </g>,
    );
  }
  if (c.has('statue')) {
    const spot = free(c, [
      { x: 740, y: 170, w: 80, h: 200 },
      { x: 180, y: 170, w: 80, h: 200 },
      { x: 620, y: 170, w: 80, h: 200 },
    ], 0.1);
    if (spot) {
      const x = spot.x + 40;
      out.push(
        <g key="statue" fill="#0b1310">
          <rect x={x - 28} y="300" width="56" height="70" />
          <rect x={x - 34} y="292" width="68" height="10" />
          <ellipse cx={x} cy="198" rx="11" ry="13" />
          <path d={`M${x - 18} 292 L${x - 14} 222 Q${x} 208 ${x + 14} 222 L${x + 20} 292 Z M${x + 12} 226 L${x + 32} 190`} />
          <path d={`M${x + 11} 190 Q${x + 14} 200 ${x + 8} 208`} stroke="#c8d8ee" strokeOpacity="0.2" fill="none" />
        </g>,
      );
    }
  }
  if (c.has('alleyWalls')) {
    const lw = `M0 0 L330 100 V${HZ} L0 512 Z`;
    const rw = `M${W} 0 L670 100 V${HZ} L${W} 512 Z`;
    out.push(
      <g key="alley">
        <rect x="330" y="100" width="340" height={HZ - 100} fill="#0b1019" />
        <ellipse cx="500" cy="300" rx="160" ry="80" fill={url('fog')} />
        <rect x="380" y="230" width="60" height="70" fill="#070a10" />
        <rect x="560" y="210" width="80" height="90" fill="#070a10" />
        <rect x="575" y="230" width="14" height="14" fill={pa.light} opacity="0.4" />
        <path d={lw} fill={url('brick')} />
        <path d={rw} fill={url('brick')} />
        <path d={lw} fill="#02040a" opacity="0.55" />
        <path d={rw} fill="#02040a" opacity="0.45" />
        <path d={`M0 0 L330 100 M${W} 0 L670 100`} stroke="#000000" strokeWidth="6" />
        <path d="M110 90 L190 112 V210 L110 214 Z" fill="#050709" />
        <path d="M120 100 L180 116 V200 L120 204 Z" fill={pa.light} opacity="0.16" className={anim(c, styles.flicker)} />
        <path d="M300 92 V420" stroke="#06080c" strokeWidth="8" />
        <path d="M302 92 V420" stroke="#8fb3e0" strokeOpacity="0.12" strokeWidth="1.4" />
      </g>,
    );
  }
  if (c.has('fireEscape')) {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const y = 90 + i * 100;
      d += `M700 ${y + 20} L860 ${y - 20 + i * 4} M700 ${y + 30} L860 ${y - 10 + i * 4}`;
      d += `M720 ${y + 25} L840 ${y + 85}`;
    }
    out.push(<path key="fe" d={d} stroke="#04060a" strokeWidth="5" fill="none" />);
  }
  return out;
}

function floorExtras(c: Ctx): ReactNode {
  const { pa, layout, url } = c;
  const out: ReactElement[] = [];
  if (c.has('rugBig')) {
    const top = HZ + 36;
    const bottom = H - 26;
    out.push(
      <g key="rug">
        <path d={quad([xAt(220, top), top], [xAt(780, top), top], [xAt(780, bottom), bottom], [xAt(220, bottom), bottom])} fill={pa.fabric} />
        <path d={quad([xAt(220, top), top], [xAt(780, top), top], [xAt(780, bottom), bottom], [xAt(220, bottom), bottom])} fill="#000000" opacity="0.25" />
        <path
          d={quad([xAt(260, top + 12), top + 12], [xAt(740, top + 12), top + 12], [xAt(740, bottom - 18), bottom - 18], [xAt(260, bottom - 18), bottom - 18])}
          fill="none"
          stroke="#8a6a32"
          strokeOpacity="0.35"
          strokeWidth="3"
        />
        <ellipse cx="500" cy={(top + bottom) / 2 + 10} rx="120" ry="34" fill="none" stroke="#8a6a32" strokeOpacity="0.28" strokeWidth="3" />
      </g>,
    );
  }
  if (c.has('runner')) {
    out.push(
      <g key="runner">
        <path d={quad([xAt(400, HZ), HZ], [xAt(600, HZ), HZ], [620, H], [380, H])} fill={pa.fabric} />
        <path d={`M${f1(xAt(416, HZ))} ${HZ}L394 ${H}M${f1(xAt(584, HZ))} ${HZ}L606 ${H}`} stroke="#8a6a32" strokeOpacity="0.4" strokeWidth="3" />
      </g>,
    );
  }
  if (c.has('leaks') || c.has('puddles')) {
    const spots: Array<[number, number, number]> = c.has('puddles')
      ? [
          [380, HZ + 90, 90],
          [640, HZ + 150, 120],
          [220, HZ + 200, 70],
        ]
      : [
          [318, HZ + 60, 46],
          [642, HZ + 110, 60],
        ];
    out.push(
      <g key="puddles">
        {spots.map(([x, y, rx]) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.16} fill="#0d1726" opacity="0.85" />
            <ellipse cx={x} cy={y} rx={rx * 0.9} ry={rx * 0.12} fill="none" stroke="#8fb3e0" strokeOpacity="0.12" />
            <ellipse cx={x + (layout.lamp.x - x) * 0.1} cy={y} rx={rx * 0.4} ry={rx * 0.05} fill={pa.light} opacity="0.3" />
          </g>
        ))}
      </g>,
    );
  }
  if (c.has('pilings')) {
    out.push(
      <g key="pilings" fill={pa.propBottom}>
        {[40, 250, 750, 960].map((x, i) => (
          <g key={x}>
            <rect x={x - 12} y={HZ - 60 - (i % 2) * 20} width="24" height={80 + (i % 2) * 20} />
            <ellipse cx={x} cy={HZ - 60 - (i % 2) * 20} rx="12" ry="4" fill={pa.floorAlt} />
          </g>
        ))}
        <path d={`M40 ${HZ - 50} Q145 ${HZ - 20} 250 ${HZ - 66} M750 ${HZ - 66} Q855 ${HZ - 20} 960 ${HZ - 50}`} stroke={pa.propBottom} strokeWidth="4" fill="none" />
      </g>,
    );
  }
  if (c.has('steam')) {
    out.push(
      <g key="steam" className={anim(c, styles.drift)}>
        <ellipse cx="160" cy={H - 40} rx="140" ry="60" fill={url('fog')} />
        <ellipse cx="200" cy={H - 110} rx="110" ry="50" fill={url('fog')} opacity="0.7" />
        <rect x="120" y={H - 30} width="80" height="12" fill="#020305" />
      </g>,
    );
  }
  if (c.has('stageEdge')) {
    out.push(
      <g key="edge">
        <rect y={H - 46} width={W} height="46" fill="#080506" />
        <rect y={H - 48} width={W} height="3" fill="#d9a23a" opacity="0.25" />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i}>
            <ellipse cx={45 + i * 83} cy={H - 44} rx="30" ry="14" fill={url('glow')} opacity="0.9" />
            <path d={`M${30 + i * 83} ${H - 40} q15 -10 30 0 Z`} fill="#f2cd7a" opacity="0.7" />
          </g>
        ))}
      </g>,
    );
  }
  if (c.has('clubTables')) {
    for (const [x, flip] of [
      [70, 1],
      [930, -1],
    ] as const) {
      out.push(
        <g key={`tbl${x}`} fill="#030203">
          <ellipse cx={x} cy={H - 8} rx="90" ry="20" />
          <rect x={x - 6} y={H - 8} width="12" height="20" />
          <path d={`M${x + flip * 30} ${H - 22} h${flip * 18} l${-flip * 4} -26 h${-flip * 10} Z`} />
          <ellipse cx={x + flip * 39} cy={H - 54} rx="34" ry="24" fill={url('glow')} />
        </g>,
      );
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lamp fixtures (behind props) and light (over props)

function drawFixture(c: Ctx): ReactNode {
  const { layout } = c;
  const L = layout.lamp;
  const dark = '#06080d';
  const lit = '#f2cd7a';
  switch (L.kind) {
    case 'chandelier':
      return (
        <g>
          <path d={`M${L.x} 0 V${L.y - 34}`} stroke={dark} strokeWidth="3" />
          <ellipse cx={L.x} cy={L.y - 20} rx="16" ry="20" fill={dark} />
          <path d={`M${L.x} ${L.y - 10} C${L.x - 40} ${L.y + 20} ${L.x - 80} ${L.y} ${L.x - 90} ${L.y - 20} M${L.x} ${L.y - 10} C${L.x + 40} ${L.y + 20} ${L.x + 80} ${L.y} ${L.x + 90} ${L.y - 20} M${L.x} ${L.y - 6} C${L.x - 20} ${L.y + 24} ${L.x - 46} ${L.y + 16} ${L.x - 50} ${L.y} M${L.x} ${L.y - 6} C${L.x + 20} ${L.y + 24} ${L.x + 46} ${L.y + 16} ${L.x + 50} ${L.y}`} stroke={dark} strokeWidth="4" fill="none" />
          <g className={anim(c, styles.flicker)} fill={lit}>
            {[-90, -50, 50, 90].map((o) => (
              <g key={o}>
                <rect x={L.x + o - 2.5} y={L.y - (Math.abs(o) > 60 ? 34 : 14)} width="5" height="12" fill="#cdbb95" opacity="0.6" />
                <ellipse cx={L.x + o} cy={L.y - (Math.abs(o) > 60 ? 38 : 18)} rx="3" ry="5" />
              </g>
            ))}
          </g>
          <path d={`M${L.x - 70} ${L.y + 6} q70 30 140 0`} stroke="#cdbb95" strokeOpacity="0.2" strokeDasharray="2 6" fill="none" strokeWidth="3" />
        </g>
      );
    case 'pendant':
    case 'shade':
      return (
        <g>
          <path d={`M${L.x} 0 V${L.y - 44}`} stroke={dark} strokeWidth="2.4" />
          {L.kind === 'pendant' ? (
            <path d={`M${L.x - 46} ${L.y} L${L.x - 14} ${L.y - 44} H${L.x + 14} L${L.x + 46} ${L.y} Z`} fill={dark} />
          ) : (
            <path d={`M${L.x - 40} ${L.y} L${L.x - 30} ${L.y - 44} H${L.x + 30} L${L.x + 40} ${L.y} Z`} fill="#3a2a1a" />
          )}
          <path d={`M${L.x - 14} ${L.y - 44} H${L.x + 14}`} stroke={lit} strokeOpacity="0.2" />
          <ellipse cx={L.x} cy={L.y} rx={L.kind === 'pendant' ? 46 : 40} ry="6" fill={lit} className={anim(c, styles.flicker)} />
          {L.kind === 'shade' && <path d={`M${L.x - 40} ${L.y} L${L.x - 30} ${L.y - 44} H${L.x + 30} L${L.x + 40} ${L.y} Z`} fill={lit} opacity="0.16" />}
        </g>
      );
    case 'bulb':
      return (
        <g>
          <path d={`M${L.x} 0 V${L.y - 14}`} stroke={dark} strokeWidth="2" />
          <rect x={L.x - 5} y={L.y - 18} width="10" height="8" fill={dark} />
          <circle cx={L.x} cy={L.y} r="10" fill="#faf6ec" className={anim(c, styles.flicker)} />
        </g>
      );
    case 'lantern':
      return (
        <g>
          <path d={`M${L.x} 0 V${L.y - 36}`} stroke={dark} strokeWidth="3" strokeDasharray="6 3" />
          <path d={`M${L.x - 20} ${L.y - 30} H${L.x + 20} L${L.x + 26} ${L.y - 36} H${L.x - 26} Z`} fill={dark} />
          <path d={`M${L.x - 20} ${L.y - 30} H${L.x + 20} L${L.x + 16} ${L.y + 26} H${L.x - 16} Z`} fill={lit} opacity="0.75" className={anim(c, styles.flicker)} />
          <path d={`M${L.x - 20} ${L.y - 30} L${L.x - 16} ${L.y + 26} M${L.x + 20} ${L.y - 30} L${L.x + 16} ${L.y + 26} M${L.x} ${L.y - 30} V${L.y + 26}`} stroke={dark} strokeWidth="3" />
          <path d={`M${L.x - 18} ${L.y + 26} H${L.x + 18} L${L.x + 10} ${L.y + 36} H${L.x - 10} Z`} fill={dark} />
        </g>
      );
    case 'sconces':
      return (
        <g>
          {L.sconces.map((x) => (
            <g key={x}>
              <rect x={x - 6} y={L.y + 4} width="12" height="26" rx="3" fill="#8a6a32" opacity="0.6" />
              <path d={`M${x - 20} ${L.y} L${x - 12} ${L.y - 26} H${x + 12} L${x + 20} ${L.y} Z`} fill={lit} opacity="0.7" className={anim(c, styles.flicker)} />
            </g>
          ))}
        </g>
      );
    case 'floor':
      return (
        <g>
          <path d={`M${L.x - 30} ${L.y} L${L.x - 20} ${L.y - 30} H${L.x + 20} L${L.x + 30} ${L.y} Z`} fill={lit} opacity="0.8" className={anim(c, styles.flicker)} />
          <rect x={L.x - 2} y={L.y} width="4" height={HZ + 34 - L.y} fill={dark} />
          <ellipse cx={L.x} cy={HZ + 36} rx="22" ry="5" fill={dark} />
        </g>
      );
    case 'street':
      return (
        <g>
          <rect x={L.x - 4} y={L.y + 22} width="8" height={HZ + 150 - L.y - 22} fill={dark} />
          <rect x={L.x - 12} y={HZ + 130} width="24" height="22" fill={dark} />
          <path d={`M${L.x - 20} ${L.y + 22} H${L.x + 20} L${L.x + 14} ${L.y - 14} H${L.x - 14} Z`} fill={lit} opacity="0.8" className={anim(c, styles.flicker)} />
          <path d={`M${L.x - 24} ${L.y - 14} H${L.x + 24} L${L.x} ${L.y - 30} Z`} fill={dark} />
          <path d={`M${L.x - 20} ${L.y + 22} H${L.x + 20}`} stroke={dark} strokeWidth="4" />
        </g>
      );
    case 'spot':
      return (
        <g fill={dark}>
          <rect x="470" y="0" width="60" height="18" />
        </g>
      );
  }
}

function drawLights(c: Ctx): ReactNode {
  const { layout, url, spec } = c;
  const L = layout.lamp;
  const flick = anim(c, styles.flicker);
  const cone = (x: number, y: number, top: number, px: number, py: number, rx: number, o: number) => (
    <path d={`M${x - top} ${y} L${x + top} ${y} L${px + rx} ${py} L${px - rx} ${py} Z`} fill={url('cone')} opacity={o} />
  );
  const main =
    L.kind === 'sconces' ? (
      <g className={flick}>
        {L.sconces.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={L.y - 20} rx="120" ry="140" fill={url('glow')} />
            <path d={`M${x - 14} ${L.y - 24} L${x + 14} ${L.y - 24} L${x + 70} ${L.y - 170} L${x - 70} ${L.y - 170} Z`} fill={url('glow')} opacity="0.5" />
          </g>
        ))}
        <ellipse cx={L.poolX} cy={L.poolY} rx={L.poolRx} ry={L.poolRy} fill={url('pool')} opacity="0.55" />
      </g>
    ) : (
      <g className={flick}>
        {cone(L.x, L.y, L.coneTop, L.poolX, L.poolY, L.poolRx * 1.1, 0.45)}
        {cone(L.x, L.y, L.coneTop * 0.7, L.poolX, L.poolY, L.poolRx * 0.75, 0.6)}
        <ellipse cx={L.poolX} cy={L.poolY} rx={L.poolRx} ry={L.poolRy} fill={url('pool')} />
        <circle cx={L.x} cy={Math.max(0, L.y)} r={L.kind === 'spot' ? 120 : 170} fill={url('glow')} />
      </g>
    );
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      {layout.moonlight.map(({ rect: w, blinds }, i) => {
        const top = HZ + 6;
        const depth = Math.min(H - top - 8, w.h * 0.9);
        const shift = w.x + w.w / 2 > 500 ? -1 : 1;
        const a: [number, number] = [w.x + shift * 30, top];
        const b: [number, number] = [w.x + w.w + shift * 30, top];
        const cc: [number, number] = [w.x + w.w * 1.25 + shift * 150, top + depth];
        const d: [number, number] = [w.x - w.w * 0.25 + shift * 150, top + depth];
        if (blinds) {
          const bands: string[] = [];
          const n = 9;
          for (let k = 0; k < n; k++) {
            const t0 = k / n;
            const t1 = t0 + 0.55 / n;
            const lerp = (p: [number, number], q: [number, number], t: number): [number, number] => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
            bands.push(quad(lerp(a, d, t0), lerp(b, cc, t0), lerp(b, cc, t1), lerp(a, d, t1)));
          }
          return (
            <g key={i}>
              <path d={bands.join('')} fill={url('shaftStrong')} />
              <path d={`M${w.x} ${w.y + w.h} L${w.x + w.w} ${w.y + w.h} L${cc[0]} ${top + depth} L${d[0]} ${top + depth} Z`} fill={url('shaft')} opacity="0.25" />
            </g>
          );
        }
        const midTop: [number, number] = [(a[0] + b[0]) / 2, top];
        const midBottom: [number, number] = [(cc[0] + d[0]) / 2, top + depth];
        return (
          <g key={i}>
            <path d={quad(a, b, cc, d)} fill={url('shaft')} />
            <path d={`M${f1(midTop[0])} ${top}L${f1(midBottom[0])} ${f1(midBottom[1])}M${f1((a[0] + d[0]) / 2)} ${f1(top + depth / 2)}L${f1((b[0] + cc[0]) / 2)} ${f1(top + depth / 2)}`} stroke="#02040a" strokeOpacity="0.5" strokeWidth="7" />
          </g>
        );
      })}
      {main}
      {c.has('fireGlow') && (
        <g className={flick}>
          <ellipse cx="-40" cy={HZ - 20} rx="320" ry="300" fill={url('ember')} />
          <ellipse cx="-20" cy={HZ + 60} rx="240" ry="120" fill={url('ember')} />
        </g>
      )}
      {layout.propLights.map((l, i) => (
        <g key={i} className={l.kind === 'lamp' ? flick : anim(c, styles.flickerFast)}>
          <circle cx={l.x} cy={l.y} r={l.radius} fill={url(l.kind === 'fire' ? 'ember' : 'glow')} />
          {l.kind !== 'candle' && (
            <ellipse cx={l.x} cy={Math.max(l.y + l.radius * 0.5, HZ + 30)} rx={l.radius * 1.4} ry={l.radius * 0.35} fill={url(l.kind === 'fire' ? 'ember' : 'pool')} opacity="0.8" />
          )}
        </g>
      ))}
      {c.has('dust') && (
        <g fill="#f8e2ae" opacity="0.5" className={anim(c, styles.drift)}>
          {Array.from({ length: 26 }, (_, i) => {
            const t = (i * 37) % 26;
            return <circle key={i} cx={L.x + ((i * 53) % 160) - 80 + t * 2} cy={L.y + 30 + ((i * 71) % 220)} r={0.8 + (i % 3) * 0.5} />;
          })}
        </g>
      )}
      {spec.wall === 'open' && <ellipse cx={L.x} cy={L.y} rx="60" ry="60" fill={url('glow')} />}
    </g>
  );
}

function drawAtmosphere(c: Ctx): ReactNode {
  const { spec, url, r } = c;
  const open = spec.wall === 'open';
  return (
    <>
      {spec.fog && (
        <g className={anim(c, styles.drift)}>
          <ellipse cx="260" cy={HZ - 30} rx="420" ry="70" fill={url('fog')} />
          <ellipse cx="780" cy={HZ - 10} rx="380" ry="60" fill={url('fog')} />
          <ellipse cx="520" cy={HZ + 40} rx="520" ry="50" fill={url('fog')} opacity="0.7" />
        </g>
      )}
      {spec.rain === 'open' && open && (
        <g transform="skewX(-8)" pointerEvents="none">
          <g className={anim(c, styles.rain150)}>
            <path d={rainPath(r, 1140, H, 70, 150, 26)} stroke="#a9c1e0" strokeOpacity="0.18" strokeWidth="1" />
          </g>
          <g className={anim(c, styles.rain150Fast)}>
            <path d={rainPath(r, 1140, H, 26, 150, 48)} stroke="#c8d8ee" strokeOpacity="0.22" strokeWidth="1.6" />
          </g>
        </g>
      )}
    </>
  );
}

function drawShade(c: Ctx): ReactNode {
  const { url, spec } = c;
  const interior = spec.wall !== 'open';
  return (
    <>
      {interior && <rect width={W} height="170" fill={url('top')} />}
      <rect width="260" height={H} fill={url('edgeL')} />
      <rect x={W - 260} width="260" height={H} fill={url('edgeR')} />
      <rect width={W} height={H} fill="#0a1630" opacity="0.12" />
    </>
  );
}

interface Layers {
  defs: ReactNode;
  back: ReactNode;
  front: ReactNode;
}

function buildLayers(spec: SceneSpec, layout: Layout, u: string, animated: boolean): Layers {
  const set = new Set(spec.extras);
  const c: Ctx = {
    spec,
    pa: spec.palette,
    layout,
    animated,
    r: seededRandom(layout.seed),
    id: (name) => `${u}-${name}`,
    url: (name) => `url(#${u}-${name})`,
    has: (e) => set.has(e),
  };
  const open = spec.wall === 'open';
  return {
    defs: defs(c),
    back: (
      <>
        {drawWall(c)}
        {open && farExtras(c)}
        {open && spec.fog && <ellipse cx="500" cy="270" rx="700" ry="90" fill={c.url('fog')} />}
        {!open && farExtras(c)}
        {drawWindows(c)}
        {wallExtras(c)}
        {wallTrim(c)}
        {nearExtras(c)}
        {drawFloor(c)}
        {floorExtras(c)}
        {drawFixture(c)}
      </>
    ),
    front: (
      <>
        {drawShade(c)}
        {drawLights(c)}
        {drawAtmosphere(c)}
        <rect width={W} height={H} fill={c.url('vig')} />
      </>
    ),
  };
}

// ---------------------------------------------------------------------------
// Component

export interface RoomSceneProps {
  /** Background key from the case file (see BACKGROUND_KEYS). Unknown keys get a fitting fallback. */
  background: string;
  hotspots: readonly Hotspot[];
  /** Ids of hotspots the player has already examined. */
  examinedIds?: ReadonlySet<string>;
  /** The hotspot whose description is open. */
  activeId?: string | null;
  onExamine?: (hotspot: Hotspot) => void;
  /** Id of the element that shows the examined hotspot (wired up with aria-controls). */
  controlsId?: string;
  /** Small decorative version: no buttons, no animation. */
  thumbnail?: boolean;
  /** Accessible name for the group of hotspots. */
  label?: string;
  className?: string;
}

export function RoomScene({
  background,
  hotspots,
  examinedIds,
  activeId = null,
  onExamine,
  controlsId,
  thumbnail = false,
  label,
  className,
}: RoomSceneProps) {
  const reduced = useReducedMotion();
  const animated = !reduced && !thumbnail;
  const u = `rs${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const art = backgroundArt(background);
  const spec = useMemo(() => specFor(background), [background]);
  const layout = useMemo(() => computeLayout(spec, hotspots, background), [spec, hotspots, background]);
  const layers = useMemo(() => (art ? null : buildLayers(spec, layout, u, animated)), [art, spec, layout, u, animated]);
  const ordered = useMemo(() => [...hotspots].sort((a, b) => a.y - b.y || a.x - b.x), [hotspots]);
  const interactive = !thumbnail && onExamine !== undefined;

  const paint: PropPaint = useMemo(
    () => ({
      body: `url(#${u}-prop)`,
      mid: spec.palette.propMid,
      edge: '#05070c',
      rim: '#f2cd7a',
      glow: '#e8b54a',
      paper: '#cdbb95',
      glass: '#0f1c2c',
      metal: '#8a6a32',
      fabric: spec.palette.fabric,
    }),
    [u, spec],
  );

  const glowing = thumbnail ? null : (hoverId ?? activeId);
  const propLayer = useMemo(() => {
    if (art) return null;
    return layout.props.map((p) => {
      const cx = p.drawn.x + p.drawn.w / 2;
      const bottom = p.drawn.y + p.drawn.h;
      return (
        <g key={p.id} filter={glowing === p.id ? `url(#${u}-hot)` : undefined}>
          {p.grounded && (
            <ellipse
              cx={cx + (cx - layout.lamp.poolX) * 0.05}
              cy={bottom - 1}
              rx={p.drawn.w * 0.5}
              ry={Math.max(4, p.drawn.w * 0.07)}
              fill="#000000"
              opacity="0.55"
            />
          )}
          {renderProp({ label: p.label, box: p.box, paint, flip: p.flip, animated, seed: p.seed })}
        </g>
      );
    });
  }, [art, layout, glowing, u, paint, animated]);

  const classes = [styles.scene, thumbnail ? styles.thumb : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? label : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      {art ? (
        <img className={styles.art} src={art} alt="" draggable={false} />
      ) : (
        layers && (
          <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            {layers.defs}
            <rect width={W} height={H} fill="#05070c" />
            {layers.back}
            {propLayer}
            {layers.front}
          </svg>
        )
      )}
      <div className={styles.grain} aria-hidden="true" />
      {interactive && (
        <div className={styles.hotspots}>
          {ordered.map((h) => {
            const examined = examinedIds?.has(h.id) ?? false;
            const active = activeId === h.id;
            const centre = h.x + h.width / 2;
            const tagClass = [
              styles.tag,
              h.y < 9 ? styles.tagBelow : '',
              centre < 14 ? styles.tagStart : centre > 86 ? styles.tagEnd : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={h.id}
                type="button"
                className={styles.hotspot}
                style={{
                  left: `${Math.max(0, h.x)}%`,
                  top: `${Math.max(0, h.y)}%`,
                  width: `${Math.min(h.width, 100 - h.x)}%`,
                  height: `${Math.min(h.height, 100 - h.y)}%`,
                }}
                aria-label={h.label}
                aria-controls={controlsId}
                data-testid={`hotspot-${h.id}`}
                data-examined={examined || undefined}
                data-active={active || undefined}
                onClick={() => onExamine?.(h)}
                onPointerEnter={(e) => {
                  setHoverId(h.id);
                  if (e.pointerType === 'mouse') sfx('hover');
                }}
                onPointerLeave={() => setHoverId((cur) => (cur === h.id ? null : cur))}
                onFocus={() => setHoverId(h.id)}
                onBlur={() => setHoverId((cur) => (cur === h.id ? null : cur))}
              >
                <span className={tagClass} aria-hidden="true">
                  {h.label}
                </span>
                {examined && <span className={styles.mark} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
