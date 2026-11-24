// Decorative night backdrop for the menu screens: a skyline, a street lamp with a flickering cone of
// light and slanted rain. Purely visual (aria-hidden). Rain is CSS-animated; with reduced motion the
// drops are drawn once, standing still.
import { useReducedMotion } from '../store/settings.ts';
import styles from './RainBackdrop.module.css';

interface RainBackdropProps {
  /** Which side the street lamp stands on. */
  lamp?: 'left' | 'right';
  /** Soft: fewer drops and a dimmer lamp, for screens with a lot of reading. */
  intensity?: 'full' | 'soft';
}

interface Drop {
  left: number;
  top: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
}

interface Building {
  x: number;
  w: number;
  h: number;
}

interface LitWindow {
  x: number;
  y: number;
  bright: boolean;
}

/** Small deterministic generator so the skyline and rain look the same on every visit. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DROPS: Drop[] = (() => {
  const r = seeded(19);
  return Array.from({ length: 84 }, () => ({
    left: r() * 116 - 8,
    top: r() * 100,
    delay: -r() * 3,
    duration: 0.55 + r() * 0.65,
    length: 5 + r() * 11,
    opacity: 0.1 + r() * 0.3,
  }));
})();

function skyline(seed: number, minH: number, maxH: number, minW: number, maxW: number): Building[] {
  const r = seeded(seed);
  const out: Building[] = [];
  let x = -20;
  while (x < 1620) {
    const w = minW + r() * (maxW - minW);
    const h = minH + r() * (maxH - minH);
    out.push({ x, w, h });
    x += w + r() * 6;
  }
  return out;
}

const FAR = skyline(5, 120, 260, 60, 150);
const NEAR = skyline(11, 70, 200, 80, 190);

const WINDOWS: LitWindow[] = (() => {
  const r = seeded(29);
  const out: LitWindow[] = [];
  for (const b of NEAR) {
    for (let wx = b.x + 10; wx < b.x + b.w - 12; wx += 16) {
      for (let wy = 400 - b.h + 14; wy < 388; wy += 20) {
        if (r() < 0.085) out.push({ x: wx, y: wy, bright: r() < 0.3 });
      }
    }
  }
  return out;
})();

function buildingPath(list: Building[]): string {
  return list.map((b) => `M${b.x.toFixed(1)} 400V${(400 - b.h).toFixed(1)}h${b.w.toFixed(1)}V400Z`).join('');
}

const FAR_PATH = buildingPath(FAR);
const NEAR_PATH = buildingPath(NEAR);

export function RainBackdrop({ lamp = 'right', intensity = 'full' }: RainBackdropProps) {
  const reduced = useReducedMotion();
  const drops = intensity === 'soft' ? DROPS.filter((_, i) => i % 2 === 0) : DROPS;
  return (
    <div className={styles.backdrop} data-lamp={lamp} data-intensity={intensity} aria-hidden="true">
      <svg className={styles.cityFar} viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={FAR_PATH} />
      </svg>

      <div className={styles.lamp}>
        <div className={styles.cone} />
        <div className={styles.glow} />
        <svg className={styles.post} viewBox="0 0 100 300" preserveAspectRatio="xMidYMax meet" focusable="false">
          <path d="M72 300V44c0-16-10-26-26-26H34" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M66 300h12v-10h-12z" fill="currentColor" />
          <path d="M22 18h24l-3 10H25z" fill="currentColor" />
          <ellipse cx="34" cy="29" rx="9" ry="2.6" className={styles.bulb} />
        </svg>
      </div>

      <svg className={styles.cityNear} viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={NEAR_PATH} />
        <g className={styles.windows}>
          {WINDOWS.map((w) => (
            <rect key={`${w.x}-${w.y}`} x={w.x} y={w.y} width="7" height="10" opacity={w.bright ? 0.7 : 0.32} />
          ))}
        </g>
      </svg>

      <div className={styles.rain} data-static={reduced || undefined}>
        {drops.map((d, i) => (
          <span
            key={i}
            className={styles.drop}
            style={{
              left: `${d.left}%`,
              ['--top' as string]: `${d.top}%`,
              ['--len' as string]: `${d.length}vh`,
              ['--op' as string]: d.opacity,
              ['--dur' as string]: `${d.duration}s`,
              ['--delay' as string]: `${d.delay}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.fog} />
      <div className={styles.vignette} />
    </div>
  );
}
