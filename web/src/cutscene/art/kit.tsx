/* eslint-disable react-refresh/only-export-components -- a set of drawings and the helpers they share */
// Shared pieces for the comic art: the colours, the halftone and hatching patterns, and the frame
// every layer is drawn in. Each layer is a 1600 x 900 drawing that covers the whole panel, so the
// layers line up with each other wherever they are drawn.
import type { ReactNode } from 'react';

export const W = 1600;
export const H = 900;

export const C = {
  ink: '#06080d',
  night1: '#0c1322',
  night2: '#142038',
  night3: '#1f2f4e',
  night4: '#2d4268',
  steel: '#56647d',
  lamp: '#f2cd7a',
  lampHot: '#fff1c7',
  lampDeep: '#d9a23a',
  brass: '#c08a2e',
  red: '#c8323c',
  neon: '#ff4252',
  paper: '#f1e8d4',
  paperDim: '#cdbb95',
  cool: '#8fb3e0',
  warm1: '#3b2616',
  warm2: '#5c3a1e',
  warm3: '#8a5a2b',
};

/** Ink outline, as in a comic: thick, round-jointed. */
export const line = (w = 5) => ({ stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });

/** One layer's drawing surface. */
export function Art({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
      {children}
    </svg>
  );
}

/**
 * Patterns and gradients the layers share, rendered once per cutscene in a hidden svg. They are
 * referenced by id (url(#cs-dots) and so on) from every layer.
 */
export function SharedDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* Halftone: printed dots for shadows, in two sizes. */}
        <pattern id="cs-dots" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="6" cy="6" r="2.6" fill={C.ink} />
        </pattern>
        <pattern id="cs-dots-fine" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="4" cy="4" r="1.5" fill={C.ink} />
        </pattern>
        <pattern id="cs-dots-light" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="5" cy="5" r="1.7" fill={C.lamp} />
        </pattern>
        {/* Hatching for brick and wood. */}
        <pattern id="cs-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <path d="M0 7h14" stroke={C.ink} strokeWidth="2.2" />
        </pattern>
        <pattern id="cs-brick" width="64" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 0h64M0 16h64M16 0v16M48 16v16" stroke={C.ink} strokeWidth="2.4" fill="none" opacity="0.7" />
        </pattern>
        <pattern id="cs-wallpaper" width="60" height="80" patternUnits="userSpaceOnUse">
          <path d="M30 6c10 12 10 22 0 34c-10-12-10-22 0-34zM0 46c10 12 10 22 0 34M60 46c-10 12-10 22 0 34" fill="none" stroke={C.warm3} strokeWidth="2" opacity="0.55" />
        </pattern>
        <radialGradient id="cs-lamp-pool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.lampHot} stopOpacity="0.9" />
          <stop offset="35%" stopColor={C.lamp} stopOpacity="0.45" />
          <stop offset="100%" stopColor={C.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cs-neon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.neon} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.neon} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070f" />
          <stop offset="55%" stopColor={C.night2} />
          <stop offset="100%" stopColor="#30466e" />
        </linearGradient>
        <linearGradient id="cs-street" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.night2} />
          <stop offset="100%" stopColor={C.night1} />
        </linearGradient>
        <linearGradient id="cs-lobby" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.warm2} />
          <stop offset="70%" stopColor={C.warm1} />
          <stop offset="100%" stopColor="#1c120a" />
        </linearGradient>
        <linearGradient id="cs-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a6390" />
          <stop offset="100%" stopColor="#8fa9cf" />
        </linearGradient>
        <linearGradient id="cs-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.lampHot} />
          <stop offset="35%" stopColor={C.lamp} />
          <stop offset="70%" stopColor={C.brass} />
          <stop offset="100%" stopColor="#6b4614" />
        </linearGradient>
        <filter id="cs-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cs-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
    </svg>
  );
}
