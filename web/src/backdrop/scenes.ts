// The painted backdrops behind the screens, in the style of the comic strips. A scene is a stack of
// items, back to front: painted layers (art/backdrops/<scene>/<layer>.webp, 1920x1080, transparent
// where the layer behind should show) and effects between them: rain, fog, lightning and lights.
//
// Positions and sizes are in percent of the 16:9 picture, so they stay on the painted lamp or sign
// whatever the window's shape. depth: how far an item leans with the pointer (0 = not at all).
import { backdropArt } from '../assets/registry.ts';

export type BackdropItem =
  /** A painted layer. pan: drifts slowly sideways (the sky). */
  | { kind: 'art'; art: string; depth: number; pan?: boolean }
  /** Rain drawn on a canvas: far drops are thin and slow, near drops thick, fast and splash on the ground. */
  | { kind: 'rain'; drops: 'far' | 'near'; density?: number }
  /** A band of mist drifting sideways. */
  | { kind: 'fog'; depth: number; top: number; height: number; opacity: number; seconds: number }
  /** The sky lights up now and then and a painted bolt shows at one of these left edges (percent). */
  | { kind: 'lightning'; depth: number; at: number[] }
  /** A light source: pulse breathes slowly, flicker is a neon tube that catches. */
  | { kind: 'glow'; depth: number; x: number; y: number; r: number; color: string; mode: 'pulse' | 'flicker' | 'steady'; strength?: number }
  /** Cigarette smoke curling up from a point. */
  | { kind: 'smoke'; depth: number; x: number; y: number };

export interface BackdropScene {
  items: BackdropItem[];
  /** Which part of the picture to keep in view when the window is narrower than 16:9 (0 left .. 1 right). */
  focusX?: number;
}

const WARM = 'rgba(255, 196, 110, 0.55)';

type Light = [x: number, y: number, r: number, color?: string, mode?: 'pulse' | 'flicker' | 'steady'];

/**
 * The usual stack for a painted scene: sky, a middle layer (everything but the sky and the foreground),
 * a foreground layer, with rain, mist and lightning between them. Lights sit on the layer they belong to.
 */
function painted(opts: {
  focusX?: number;
  rain?: boolean;
  /** Rain only behind the middle layer: a scene seen from indoors, through a window. */
  indoors?: boolean;
  lightning?: number[];
  /** Mist bands: [top, height, opacity]. */
  fog?: Array<[number, number, number]>;
  midLights?: Light[];
  frontLights?: Light[];
}): BackdropScene {
  const rain = opts.rain ?? true;
  const glow = (depth: number) => ([x, y, r, color = WARM, mode = 'pulse']: Light): BackdropItem => ({ kind: 'glow', depth, x, y, r, color, mode });
  const [farFog, ...nearFog] = opts.fog ?? [[46, 26, 0.5], [80, 24, 0.4]];
  const items: BackdropItem[] = [{ kind: 'art', art: 'sky', depth: 0.05, pan: true }];
  if (opts.lightning) items.push({ kind: 'lightning', depth: 0.06, at: opts.lightning });
  if (farFog) items.push({ kind: 'fog', depth: 0.12, top: farFog[0], height: farFog[1], opacity: farFog[2], seconds: 100 });
  if (rain) items.push({ kind: 'rain', drops: 'far' });
  items.push({ kind: 'art', art: 'mid', depth: 0.24 }, ...(opts.midLights ?? []).map(glow(0.24)));
  nearFog.forEach(([top, height, opacity], i) => items.push({ kind: 'fog', depth: 0.4, top, height, opacity, seconds: 70 - i * 12 }));
  items.push({ kind: 'art', art: 'front', depth: 0.55 }, ...(opts.frontLights ?? []).map(glow(0.55)));
  if (rain && !opts.indoors) items.push({ kind: 'rain', drops: 'near' });
  return { focusX: opts.focusX ?? 0.5, items };
}

const RED = 'rgba(255, 50, 70, 0.55)';
const BLUE = 'rgba(70, 150, 255, 0.55)';
const GREEN = 'rgba(120, 230, 150, 0.4)';

export const SCENES: Record<string, BackdropScene> = {
  // The main menu: a street corner in the rain, the detective under the lamp, the hotel's neon.
  street: {
    focusX: 0.62,
    items: [
      { kind: 'art', art: 'sky', depth: 0.05, pan: true },
      { kind: 'lightning', depth: 0.06, at: [8, 22, 36] },
      { kind: 'art', art: 'far', depth: 0.14 },
      { kind: 'fog', depth: 0.2, top: 52, height: 30, opacity: 0.75, seconds: 90 },
      { kind: 'rain', drops: 'far' },
      { kind: 'art', art: 'street', depth: 0.34 },
      { kind: 'glow', depth: 0.34, x: 86, y: 21, r: 16, color: 'rgba(255, 50, 70, 0.55)', mode: 'flicker' },
      { kind: 'glow', depth: 0.34, x: 88.5, y: 59, r: 7, color: WARM, mode: 'pulse' },
      { kind: 'art', art: 'front', depth: 0.5 },
      { kind: 'glow', depth: 0.5, x: 67.3, y: 9.5, r: 14, color: WARM, mode: 'pulse', strength: 1.1 },
      { kind: 'smoke', depth: 0.5, x: 70.6, y: 37.6 },
      { kind: 'fog', depth: 0.6, top: 78, height: 26, opacity: 0.45, seconds: 60 },
      { kind: 'rain', drops: 'near' },
    ],
  },

  // Case 1: the house on the cliff, seen from the gates.
  'ashgrove-house': {
    focusX: 0.55,
    items: [
      { kind: 'art', art: 'sky', depth: 0.05, pan: true },
      { kind: 'lightning', depth: 0.06, at: [-6, 14, 40] },
      { kind: 'fog', depth: 0.12, top: 40, height: 26, opacity: 0.55, seconds: 110 },
      { kind: 'rain', drops: 'far' },
      { kind: 'art', art: 'house', depth: 0.22 },
      { kind: 'glow', depth: 0.22, x: 62, y: 34, r: 15, color: 'rgba(255, 190, 100, 0.35)', mode: 'pulse' },
      { kind: 'fog', depth: 0.32, top: 56, height: 28, opacity: 0.5, seconds: 75 },
      { kind: 'art', art: 'front', depth: 0.55 },
      { kind: 'fog', depth: 0.6, top: 80, height: 24, opacity: 0.4, seconds: 55 },
      { kind: 'rain', drops: 'near' },
    ],
  },

  // The case files: a detective's office at night, the city through the window.
  office: painted({
    indoors: true,
    lightning: [30, 42],
    fog: [],
    midLights: [[64, 25, 9, RED, 'flicker'], [18.8, 9, 9]],
    frontLights: [[88, 52, 11, GREEN]],
  }),

  // Settings, account, saves and credits: a rooftop above the city.
  rooftop: painted({
    lightning: [20, 40, 55],
    fog: [[50, 26, 0.55], [84, 20, 0.35]],
    frontLights: [[89, 35, 20, RED, 'flicker']],
  }),

  tutorial: painted({
    lightning: [24, 40],
    midLights: [[64, 33, 10, RED, 'flicker']],
    frontLights: [[16, 12, 10], [81, 69, 6]],
  }),

  'blue-lantern': painted({
    lightning: [22, 36],
    midLights: [[69, 22, 14, BLUE, 'flicker'], [86, 54, 8]],
    frontLights: [[91.7, 10, 9]],
  }),

  'pier-seventeen': painted({
    fog: [[36, 30, 0.7], [58, 26, 0.6], [80, 24, 0.45]],
  }),

  'night-express': painted({
    lightning: [30, 48],
    fog: [[44, 26, 0.5], [70, 24, 0.45]],
    midLights: [[73.4, 16.7, 9]],
    frontLights: [[12.5, 14, 6, RED]],
  }),

  'hollis-garden': painted({
    rain: false,
    fog: [[58, 22, 0.3], [86, 18, 0.25]],
    midLights: [[17.2, 19.4, 5], [28.6, 25, 5], [91, 28.7, 5], [66, 48, 9], [74.5, 47, 9]],
  }),

  'studio-nine': painted({
    lightning: [8, 66],
    midLights: [[51.5, 3, 4, RED, 'flicker'], [51.5, 43, 12, RED, 'flicker']],
    frontLights: [[84.9, 15.7, 9]],
  }),

  'the-regent': painted({
    lightning: [10, 70],
    midLights: [[62, 27, 18], [53, 51, 7]],
  }),

  'reading-room': painted({
    lightning: [36, 60],
    midLights: [[41.7, 46.3, 18]],
    frontLights: [[94.8, 20.4, 7], [85.9, 22.2, 7]],
  }),

  'mercers-pharmacy': painted({
    lightning: [46, 62],
    midLights: [[28, 32, 12], [27.6, 43.5, 15], [41, 15.7, 6]],
    frontLights: [[89.1, 12, 9]],
  }),

  'vance-and-pryor': painted({
    lightning: [10, 52, 70],
    fog: [[56, 30, 0.55], [84, 20, 0.35]],
    midLights: [[44, 3, 4, RED, 'flicker']],
  }),
};

/** Whether a scene exists and all its art is in the build. */
export function hasBackdrop(id: string | undefined | null): boolean {
  const s = backdropScene(id);
  return Boolean(s && s.items.every((i) => i.kind !== 'art' || backdropArt(id!, i.art)));
}

export function backdropScene(id: string | undefined | null): BackdropScene | null {
  return (id && SCENES[id]) || null;
}
