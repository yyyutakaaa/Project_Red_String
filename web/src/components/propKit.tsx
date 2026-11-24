// Shared pieces for the prop drawings (Props.tsx and the libraries next to it): the paint a scene
// hands to a prop, the drawing function type, and the small helpers every drawing uses.
// Plain functions only (no components), so fast refresh stays happy.
import type { ReactElement, ReactNode } from 'react';

/** Colours a prop is painted with. The scene supplies them so props match the room. */
export interface PropPaint {
  /** Silhouette fill, usually a gradient url. */
  body: string;
  /** Secondary surfaces (seat cushions, door panels). */
  mid: string;
  /** Darkest detail lines. */
  edge: string;
  /** Lamp-coloured rim light. */
  rim: string;
  /** Emitted light (lamp shades, embers, brandy). */
  glow: string;
  paper: string;
  glass: string;
  metal: string;
  fabric: string;
}

export interface Ctx {
  p: PropPaint;
  /** Variant of the drawing ('' when the kind has one look). */
  v: string;
  r: () => number;
  animated: boolean;
}
export type Draw = (c: Ctx) => ReactNode;

export const NS = 'non-scaling-stroke' as const;

/** A lamp-coloured highlight along an edge. */
export function rim(p: PropPaint, d: string, opacity = 0.9, width = 2): ReactElement {
  return (
    <path
      d={d}
      fill="none"
      stroke={p.rim}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect={NS}
    />
  );
}

export function stroke(color: string, d: string, opacity = 0.6, width = 1): ReactElement {
  return <path d={d} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={width} strokeLinecap="round" vectorEffect={NS} />;
}

export function halo(p: PropPaint, cx: number, cy: number, r: number, strength = 1): ReactElement {
  return (
    <g fill={p.glow}>
      <circle cx={cx} cy={cy} r={r} opacity={0.05 * strength} />
      <circle cx={cx} cy={cy} r={r * 0.66} opacity={0.08 * strength} />
      <circle cx={cx} cy={cy} r={r * 0.38} opacity={0.14 * strength} />
    </g>
  );
}

/** The soft shadow a standing object throws on the floor (ground line y = 100). */
export function ground(cx: number, rx: number, ry = 2.4): ReactElement {
  return <ellipse cx={cx} cy={98} rx={rx} ry={ry} fill="#000000" opacity="0.5" />;
}

export const STEEL = '#aab3c3';
export const PEARL = '#ece6d6';
export const BLOOD = '#8e1f28';
