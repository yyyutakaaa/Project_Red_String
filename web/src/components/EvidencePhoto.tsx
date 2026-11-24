// An evidence photograph: the object drawn on a dark table in a pool of lamp light, with the yellow
// numbered marker the police photographer sets next to it. Drawn from the evidence name with the
// same prop drawings the rooms use. Renders an <svg>, so it works on its own or nested in a bigger
// drawing (the board) through x / y / width / height.
import { useId } from 'react';
import { hashString, propKindFor, renderProp, type PropPaint } from './Props.tsx';

const TAIL = /\s+(?:from|in|on|of|for|to|at|with|under|behind)\s+/i;

/** "Revolver from the rain barrel" is a picture of a revolver, not of a barrel. */
function evidenceArtLabel(name: string): string {
  const head = name.split(TAIL)[0] ?? name;
  return propKindFor(head) !== 'item' ? head : name;
}

interface EvidencePhotoProps {
  name: string;
  /** Number on the marker; leave out for no marker. */
  marker?: number;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function EvidencePhoto({ name, marker, x, y, width = '100%', height = '100%', className }: EvidencePhotoProps) {
  const uid = `ep${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const label = evidenceArtLabel(name);
  const paint: PropPaint = {
    body: `url(#${uid}-body)`,
    mid: '#2b3548',
    edge: '#05070c',
    rim: '#f2cd7a',
    glow: '#e8b54a',
    paper: '#d8c9a6',
    glass: '#12233a',
    metal: '#9a7636',
    fabric: '#4a2a36',
  };
  return (
    <svg
      className={className}
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 150 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="46%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#4a3a26" />
          <stop offset="45%" stopColor="#241b13" />
          <stop offset="100%" stopColor="#07080c" />
        </radialGradient>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#4b5871" />
          <stop offset="100%" stopColor="#161c2a" />
        </linearGradient>
        <radialGradient id={`${uid}-pool`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2cd7a" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#f2cd7a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width="150" height="100" fill={`url(#${uid}-bg)`} />
      {/* the table edge, and the lamp's light lying on it */}
      <rect y="78" width="150" height="22" fill="#000" opacity="0.28" />
      <ellipse cx="72" cy="84" rx="58" ry="13" fill={`url(#${uid}-pool)`} />
      {renderProp({ label, box: { x: 36, y: 9, w: 76, h: 78 }, paint, seed: hashString(name) })}
      {marker !== undefined && marker > 0 && (
        <g transform="translate(122 70)">
          <path d="M0 22 L5 2 H19 L24 22 Z" fill="#e9b93a" stroke="#6b4a08" strokeWidth="0.8" />
          <path d="M5 2 H19 L17.500 -1 H6.500 Z" fill="#c8961e" />
          <text x="12" y="17" textAnchor="middle" fontFamily="'Courier Prime', monospace" fontWeight="700" fontSize={marker > 9 ? 10 : 13} fill="#1c1404">
            {marker}
          </text>
        </g>
      )}
      <rect width="150" height="100" fill={`url(#${uid}-vig)`} />
    </svg>
  );
}
