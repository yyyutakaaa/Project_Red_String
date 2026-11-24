// The game's logo, drawn live: red thread wound around brass nails into an eye, with a keyhole for
// a pupil. Same geometry as desktop/build/icon.svg. `progress` (0..1) winds the thread in: first the
// lids, then the corners, then the iris, and the keyhole lights up at the end.
import styles from './LogoEye.module.css';

interface Point {
  x: number;
  y: number;
}

const CX = 512;
const CY = 512;
const IRIS_R = 176;
const IRIS_NAILS = 48;

function lidPoints(apexDy: number, n: number, x0 = 148, x1 = 876): Point[] {
  const half = (x1 - x0) / 2;
  const h = Math.abs(apexDy);
  const r = (half * half + h * h) / (2 * h);
  const s = apexDy < 0 ? -1 : 1;
  const cy = CY + s * (h - r);
  const a = Math.asin(half / r);
  return Array.from({ length: n }, (_, i) => {
    const t = -a + (2 * a * i) / (n - 1);
    return { x: CX + r * Math.sin(t), y: cy + s * r * Math.cos(t) };
  });
}

const f = (n: number) => n.toFixed(1);
const line = (a: Point, b: Point) => `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`;
const poly = (pts: Point[]) => 'M' + pts.map((p) => `${f(p.x)} ${f(p.y)}`).join('L');

function geometry() {
  const up = lidPoints(-232, 15);
  const lo = lidPoints(196, 15);
  const n = up.length;
  const fans: string[] = [];
  for (let i = 1; i <= 5; i++) {
    fans.push(line(up[i]!, lo[6 - i]!), line(up[n - 1 - i]!, lo[n - 1 - (6 - i)]!));
  }
  const ring = Array.from({ length: IRIS_NAILS }, (_, i) => {
    const t = (2 * Math.PI * i) / IRIS_NAILS - Math.PI / 2;
    return { x: CX + IRIS_R * Math.cos(t), y: CY + IRIS_R * Math.sin(t) };
  });
  const chords = (k: number) => ring.map((p, i) => line(p, ring[(i + k) % IRIS_NAILS]!)).join('');
  return {
    up,
    lo,
    lidUp: poly(up),
    lidLo: poly(lo),
    fans: fans.join(''),
    ring,
    chordsDeep: chords(11),
    chordsMid: chords(15),
    chordsLight: chords(18),
  };
}

// The geometry never changes, so it is built once.
const GEOMETRY = geometry();

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Map overall progress onto one stage that runs from `start` to `end`. */
const stage = (p: number, start: number, end: number) => clamp((p - start) / (end - start));

const LOOSE = 'M876 512 C 912 590, 838 650, 858 730 C 874 795, 930 820, 918 900';
const KEYHOLE = 'M512 468 a27 27 0 0 1 15.5 49 l11 43 h-53 l11 -43 a27 27 0 0 1 15.5 -49 z';

interface LogoEyeProps {
  /** 0..1. Leave out for the finished logo. */
  progress?: number;
  className?: string;
  /** Accessible name. Leave out when the logo is decorative. */
  label?: string;
}

export function LogoEye({ progress = 1, className, label }: LogoEyeProps) {
  const g = GEOMETRY;
  const p = clamp(progress);
  const lids = stage(p, 0, 0.35);
  const fans = stage(p, 0.25, 0.5);
  const iris = stage(p, 0.4, 0.9);
  const lit = stage(p, 0.85, 1);
  const nailsShown = (i: number, count: number, from: number, to: number) => p >= from + ((to - from) * i) / count;

  return (
    <svg
      className={[styles.logo, className].filter(Boolean).join(' ')}
      viewBox="110 230 804 600"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient id="le-brass" cx=".36" cy=".3" r=".85">
          <stop offset="0" stopColor="#fff0bd" />
          <stop offset=".45" stopColor="#ecbb52" />
          <stop offset="1" stopColor="#8a5d12" />
        </radialGradient>
        <linearGradient id="le-thread" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0616a" />
          <stop offset="1" stopColor="#b3212d" />
        </linearGradient>
        <linearGradient id="le-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset=".55" stopColor="#f1c257" />
          <stop offset="1" stopColor="#b9801a" />
        </linearGradient>
        <radialGradient id="le-glow" cx="512" cy="512" r="260" gradientUnits="userSpaceOnUse">
          <stop offset=".3" stopColor="#ff5a66" stopOpacity=".38" />
          <stop offset="1" stopColor="#ff5a66" stopOpacity="0" />
        </radialGradient>
        <filter id="le-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <path
        d={`${g.lidUp}L${g.lo
          .slice()
          .reverse()
          .map((pt) => `${f(pt.x)} ${f(pt.y)}`)
          .join('L')}Z`}
        className={styles.well}
        style={{ opacity: 0.6 * lids }}
      />
      <path d={g.fans} className={styles.fan} style={{ opacity: 0.75 * fans }} />
      <path d={LOOSE} className={styles.loose} pathLength={1} style={{ strokeDashoffset: 1 - lids }} />

      <circle cx={CX} cy={CY} r={250} fill="url(#le-glow)" style={{ opacity: iris }} />
      <circle cx={CX} cy={CY} r={IRIS_R} className={styles.irisBed} style={{ opacity: iris }} />
      <path d={g.chordsDeep} className={styles.chordDeep} style={{ opacity: stage(iris, 0, 0.4) }} />
      <path d={g.chordsMid} className={styles.chordMid} style={{ opacity: stage(iris, 0.3, 0.7) }} />
      <path d={g.chordsLight} className={styles.chordLight} style={{ opacity: stage(iris, 0.6, 1) }} />
      <circle cx={CX} cy={CY} r={IRIS_R} className={styles.irisRim} pathLength={1} style={{ strokeDashoffset: 1 - iris }} />

      <circle cx={CX} cy={CY} r={74} className={styles.pupil} />
      <path d={KEYHOLE} fill="#ffcf66" filter="url(#le-blur)" style={{ opacity: 0.15 + 0.75 * lit }} />
      <path d={KEYHOLE} fill="url(#le-gold)" style={{ opacity: 0.35 + 0.65 * lit }} />

      <path d={g.lidUp} className={styles.lid} pathLength={1} style={{ strokeDashoffset: 1 - lids }} />
      <path d={g.lidLo} className={styles.lid} pathLength={1} style={{ strokeDashoffset: 1 - lids }} />

      {g.ring.map((pt, i) => (
        <circle
          key={`r${i}`}
          cx={pt.x}
          cy={pt.y}
          r={5.5}
          className={`${styles.nail} ${nailsShown(i, IRIS_NAILS, 0.35, 0.6) ? styles.nailIn : ''}`}
        />
      ))}
      {[...g.up.slice(1, -1), ...g.lo.slice(1, -1)].map((pt, i, all) => (
        <circle
          key={`l${i}`}
          cx={pt.x}
          cy={pt.y}
          r={13}
          className={`${styles.nail} ${nailsShown(i, all.length, 0, 0.3) ? styles.nailIn : ''}`}
        />
      ))}
      {[g.up[0]!, g.up[g.up.length - 1]!].map((pt, i) => (
        <circle key={`c${i}`} cx={pt.x} cy={pt.y} r={19} className={`${styles.nail} ${styles.nailIn}`} />
      ))}
    </svg>
  );
}
