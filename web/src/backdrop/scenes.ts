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
};

/** Whether a scene exists and all its art is in the build. */
export function hasBackdrop(id: string | undefined | null): boolean {
  const s = backdropScene(id);
  return Boolean(s && s.items.every((i) => i.kind !== 'art' || backdropArt(id!, i.art)));
}

export function backdropScene(id: string | undefined | null): BackdropScene | null {
  return (id && SCENES[id]) || null;
}
