// Stylized SVG silhouette portraits (placeholder art). A real portrait image replaces the drawing
// automatically when one is registered in src/assets/art/portraits (see assets/registry.ts).
import { useId } from 'react';
import type { Mood } from '@shared/caseSchema.ts';
import { portraitArt } from '../assets/registry.ts';
import styles from './Portrait.module.css';
import { initials } from '../lib/format.ts';

export interface PortraitSubject {
  id: string;
  name: string;
  portrait: string;
  color: string;
}

interface PortraitProps {
  suspect: PortraitSubject;
  size?: number;
  mood?: Mood | null;
  /** Show the name plate under the silhouette. */
  showInitials?: boolean;
  className?: string;
  decorative?: boolean;
}


function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const MOOD_COLOR: Record<Mood, string> = {
  calm: 'var(--mood-calm)',
  nervous: 'var(--mood-nervous)',
  angry: 'var(--mood-angry)',
  broken: 'var(--mood-broken)',
};

/** Head, hair and headwear shapes per portrait key, drawn in a 200x240 box. */
export function Figure({ kind, fill, rim }: { kind: string; fill: string; rim: string }) {
  const female = kind.startsWith('woman') || kind === 'elder-woman' || kind === 'young-woman';
  const elder = kind.startsWith('elder');
  const shoulders = female
    ? 'M30 240 C34 196 62 178 100 176 C138 178 166 196 170 240 Z'
    : 'M18 240 C22 192 58 172 100 170 C142 172 178 192 182 240 Z';
  const headY = elder ? 112 : 106;
  return (
    <g>
      {/* shoulders and collar */}
      <path d={shoulders} fill={fill} />
      {!female && <path d="M84 176 L100 204 L116 176 L108 172 L100 186 L92 172 Z" fill={rim} opacity="0.35" />}
      {female && <path d="M78 182 C88 196 112 196 122 182" stroke={rim} strokeWidth="2" fill="none" opacity="0.5" />}
      {/* neck */}
      <rect x="86" y={headY + 40} width="28" height="34" rx="10" fill={fill} />
      {/* head */}
      <ellipse cx="100" cy={headY} rx={female ? 34 : 36} ry={female ? 42 : 44} fill={fill} />
      {/* rim light on the cheek */}
      <path
        d={`M${female ? 128 : 130} ${headY - 24} C${female ? 140 : 142} ${headY} ${female ? 136 : 138} ${headY + 28} ${female ? 118 : 120} ${headY + 40}`}
        stroke={rim}
        strokeWidth="3"
        fill="none"
        opacity="0.75"
        strokeLinecap="round"
      />
      {kind === 'man-hat' && (
        <g fill={fill}>
          <ellipse cx="100" cy="74" rx="66" ry="11" />
          <path d="M60 74 C60 40 74 30 100 30 C126 30 140 40 140 74 Z" />
          <rect x="62" y="62" width="76" height="8" fill={rim} opacity="0.4" />
        </g>
      )}
      {kind === 'man-cap' && (
        <g fill={fill}>
          <path d="M62 82 C60 52 80 44 104 46 C130 48 142 60 140 80 Z" />
          <path d="M124 76 C146 74 160 80 164 86 L128 88 Z" />
        </g>
      )}
      {(kind === 'man-bare' || kind === 'man-glasses') && (
        <path d="M64 96 C60 62 80 54 102 56 C126 58 140 70 136 98 C130 80 112 74 98 76 C82 78 70 84 64 96 Z" fill={fill} stroke={rim} strokeOpacity="0.25" />
      )}
      {kind === 'man-glasses' && (
        <g stroke={rim} strokeWidth="2.5" fill="none" opacity="0.9">
          <circle cx="86" cy={headY + 2} r="10" />
          <circle cx="116" cy={headY + 2} r="10" />
          <path d={`M96 ${headY + 2} L106 ${headY + 2}`} />
          <path d={`M126 ${headY} L136 ${headY - 4}`} />
        </g>
      )}
      {kind === 'young-man' && (
        <path d="M62 94 C56 60 78 46 108 50 C136 52 146 70 138 96 C132 70 116 66 96 70 C80 74 68 80 62 94 Z M96 50 C110 38 132 40 140 54 C126 48 112 48 96 50 Z" fill={fill} />
      )}
      {kind === 'elder-man' && (
        <g fill={fill}>
          <path d="M64 112 C62 92 66 84 72 80 L72 104 Z M136 112 C138 92 134 84 128 80 L128 104 Z" />
          <path d="M84 132 C92 126 108 126 116 132 C108 136 92 136 84 132 Z" fill={rim} opacity="0.35" />
        </g>
      )}
      {kind === 'woman-hat' && (
        <g fill={fill}>
          <path d="M64 118 C56 140 62 160 76 168 L80 120 Z M136 118 C144 140 138 160 124 168 L120 120 Z" />
          <ellipse cx="96" cy="72" rx="58" ry="10" transform="rotate(-8 96 72)" />
          <path d="M66 74 C66 48 82 40 100 40 C120 40 134 50 132 70 Z" />
          <path d="M130 60 C146 50 156 54 160 46" stroke={rim} strokeWidth="2" fill="none" opacity="0.6" />
        </g>
      )}
      {kind === 'woman-bob' && (
        <path d="M60 128 C52 82 70 58 100 58 C130 58 148 82 140 128 C134 112 132 96 126 88 C110 90 86 88 74 88 C68 98 66 112 60 128 Z" fill={fill} />
      )}
      {kind === 'woman-long' && (
        <path d="M58 200 C40 150 50 70 100 60 C150 70 160 150 142 200 C134 170 134 130 130 96 C112 84 88 84 70 96 C66 130 66 170 58 200 Z" fill={fill} />
      )}
      {kind === 'woman-bun' && (
        <g fill={fill}>
          <circle cx="100" cy="52" r="20" />
          <path d="M64 104 C60 74 78 62 100 62 C122 62 140 74 136 104 C128 88 114 82 100 82 C86 82 72 88 64 104 Z" />
        </g>
      )}
      {kind === 'young-woman' && (
        <g fill={fill}>
          <ellipse cx="74" cy="76" rx="16" ry="14" />
          <ellipse cx="126" cy="76" rx="16" ry="14" />
          <path d="M62 120 C56 90 70 70 100 68 C130 70 144 90 138 120 C132 100 120 90 100 90 C80 90 68 100 62 120 Z" />
        </g>
      )}
      {kind === 'elder-woman' && (
        <g>
          <path d="M62 108 C54 72 76 58 100 58 C124 58 146 72 138 108 C134 94 126 86 116 82 C106 88 94 88 84 82 C74 86 66 94 62 108 Z" fill={fill} />
          <path d="M70 190 C86 204 114 204 130 190" stroke={rim} strokeWidth="3" strokeDasharray="1 6" strokeLinecap="round" fill="none" />
        </g>
      )}
    </g>
  );
}

export function Portrait({ suspect, size = 160, mood = null, showInitials = true, className, decorative = false }: PortraitProps) {
  const uid = useId().replace(/:/g, '');
  const art = portraitArt(suspect.portrait, suspect.id);
  const ring = mood ? MOOD_COLOR[mood] : 'var(--ink-500)';
  const label = decorative ? undefined : `Portrait of ${suspect.name}`;
  const bg1 = shade(suspect.color, 30);
  const bg2 = shade(suspect.color, -60);
  return (
    <figure
      className={`${styles.portrait} ${className ?? ''}`}
      style={{ width: size, ['--ring' as string]: ring }}
      data-mood={mood ?? undefined}
      aria-hidden={decorative || undefined}
    >
      {art ? (
        <img src={art} alt={label ?? ''} className={styles.img} width={size} height={size * 1.2} />
      ) : (
        <svg viewBox="0 0 200 240" role={decorative ? undefined : 'img'} aria-label={label} className={styles.svg}>
          <defs>
            <radialGradient id={`bg-${uid}`} cx="70%" cy="25%" r="90%">
              <stop offset="0%" stopColor={bg1} />
              <stop offset="55%" stopColor={bg2} />
              <stop offset="100%" stopColor="#05070c" />
            </radialGradient>
            <linearGradient id={`fig-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#05070c" />
              <stop offset="75%" stopColor="#0b0f17" />
              <stop offset="100%" stopColor="#1a2233" />
            </linearGradient>
          </defs>
          <rect width="200" height="240" fill={`url(#bg-${uid})`} />
          <g opacity="0.18">
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={i * 24 - 4} y="0" width="6" height="240" fill="#000" transform="skewX(-12)" />
            ))}
          </g>
          <Figure kind={suspect.portrait} fill={`url(#fig-${uid})`} rim="var(--lamp-300)" />
          {showInitials && (
            <g>
              <rect x="56" y="206" width="88" height="26" rx="3" fill="rgba(5,7,12,0.82)" stroke={suspect.color} />
              <text x="100" y="225" textAnchor="middle" className={styles.initials} fill="var(--lamp-200)">
                {initials(suspect.name)}
              </text>
            </g>
          )}
        </svg>
      )}
    </figure>
  );
}
