// The city behind the menu screens, as a living noir film set. Purely decorative (aria-hidden).
//
// Layers, back to front: storm sky with drifting clouds and lightning, three skylines with lit
// windows, a blinking mast, an elevated line with a passing train, a flickering HOTEL sign, the wet
// street, the street lamp with a detective smoking under it, rain on a canvas (three depths, with
// splashes on the street), fog and a vignette. The layers shift a little with the pointer.
//
// With reduced motion everything stands still: one frame of rain, no lightning, no train.
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../store/settings.ts';
import styles from './RainBackdrop.module.css';

interface RainBackdropProps {
  /** Which side the street lamp stands on. */
  lamp?: 'left' | 'right';
  /** Soft: less rain and a dimmer scene, for screens with a lot of reading. */
  intensity?: 'full' | 'soft';
}

type Roof = 'flat' | 'step' | 'spire' | 'tank' | 'mast';

interface Building {
  x: number;
  w: number;
  h: number;
  roof: Roof;
}

interface LitWindow {
  x: number;
  y: number;
  cool: boolean;
  /** Twinkles: someone switches the light off and on again. */
  blink: boolean;
  delay: number;
  duration: number;
}

/** Small deterministic generator so the city looks the same on every visit. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const GROUND = 400;

function skyline(seed: number, minH: number, maxH: number, minW: number, maxW: number, roofs: Roof[]): Building[] {
  const r = seeded(seed);
  const out: Building[] = [];
  let x = -40;
  while (x < 1640) {
    const w = minW + r() * (maxW - minW);
    const h = minH + r() * (maxH - minH);
    out.push({ x, w, h, roof: roofs[Math.floor(r() * roofs.length)]! });
    x += w + r() * 5;
  }
  return out;
}

const n = (v: number) => v.toFixed(1);

function buildingPath(b: Building): string {
  const top = GROUND - b.h;
  const x2 = b.x + b.w;
  if (b.roof === 'step' || b.roof === 'spire') {
    // Art deco setbacks, with a needle on the tall ones.
    const s1 = b.w * 0.16;
    const s2 = b.w * 0.33;
    const h1 = Math.min(24, b.h * 0.12);
    const h2 = h1 * 0.85;
    let d = `M${n(b.x)} ${GROUND}V${n(top)}H${n(b.x + s1)}V${n(top - h1)}H${n(b.x + s2)}V${n(top - h1 - h2)}H${n(x2 - s2)}V${n(top - h1)}H${n(x2 - s1)}V${n(top)}H${n(x2)}V${GROUND}Z`;
    if (b.roof === 'spire') {
      const cx = b.x + b.w / 2;
      d += `M${n(cx - 1.6)} ${n(top - h1 - h2)}V${n(top - h1 - h2 - 40)}h3.2V${n(top - h1 - h2)}Z`;
    }
    return d;
  }
  let d = `M${n(b.x)} ${GROUND}V${n(top)}h${n(b.w)}V${GROUND}Z`;
  if (b.roof === 'tank') {
    const tx = b.x + b.w * 0.3;
    d += `M${n(tx)} ${n(top)}v-11h2v11ZM${n(tx + 14)} ${n(top)}v-11h2v11ZM${n(tx - 2)} ${n(top - 11)}v-15h20v15ZM${n(tx - 3)} ${n(top - 26)}l11 -8l11 8Z`;
  } else if (b.roof === 'mast') {
    const mx = b.x + b.w * 0.6;
    d += `M${n(mx)} ${n(top)}v-34h1.8v34ZM${n(mx - 5)} ${n(top - 12)}h11.8v1.4h-11.8Z`;
  }
  return d;
}

function windowsFor(list: Building[], seed: number, chance: number, stepX: number, stepY: number): LitWindow[] {
  const r = seeded(seed);
  const out: LitWindow[] = [];
  for (const b of list) {
    for (let wx = b.x + 9; wx < b.x + b.w - 11; wx += stepX) {
      for (let wy = GROUND - b.h + 14; wy < GROUND - 10; wy += stepY) {
        if (r() < chance) {
          out.push({ x: wx, y: wy, cool: r() < 0.16, blink: r() < 0.16, delay: -r() * 14, duration: 8 + r() * 10 });
        }
      }
    }
  }
  return out;
}

const FAR = skyline(5, 150, 300, 70, 150, ['flat', 'step', 'spire', 'step', 'flat']);
const MID = skyline(23, 110, 235, 64, 140, ['flat', 'tank', 'step', 'flat', 'mast']);
const NEAR = skyline(11, 60, 170, 80, 190, ['flat', 'flat', 'tank', 'flat']);
const FAR_PATH = FAR.map(buildingPath).join('');
const MID_PATH = MID.map(buildingPath).join('');
const NEAR_PATH = NEAR.map(buildingPath).join('');
const FAR_WINDOWS = windowsFor(FAR, 41, 0.05, 13, 17);
const MID_WINDOWS = windowsFor(MID, 29, 0.11, 15, 19);
const NEAR_WINDOWS = windowsFor(NEAR, 57, 0.07, 17, 21);
const BEACONS = MID.filter((b) => b.roof === 'mast').map((b) => ({ x: b.x + b.w * 0.6 + 0.9, y: GROUND - b.h - 36 }));

function Windows({ list, w, h }: { list: LitWindow[]; w: number; h: number }) {
  return (
    <g className={styles.windows}>
      {list.map((win, i) => (
        <rect
          key={i}
          x={win.x}
          y={win.y}
          width={w}
          height={h}
          className={[win.cool ? styles.cool : '', win.blink ? styles.blink : ''].filter(Boolean).join(' ') || undefined}
          style={win.blink ? { animationDelay: `${win.delay.toFixed(1)}s`, animationDuration: `${win.duration.toFixed(1)}s` } : undefined}
        />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Rain on a canvas: three depths, a wind that breathes, splashes where drops meet the street.

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  layer: 0 | 1 | 2;
}

interface Splash {
  x: number;
  y: number;
  age: number;
}

const LAYERS = [
  { alpha: 0.16, width: 0.7, len: [7, 13], speed: [520, 700] },
  { alpha: 0.26, width: 1, len: [12, 22], speed: [780, 1040] },
  { alpha: 0.4, width: 1.5, len: [20, 36], speed: [1150, 1500] },
] as const;

function bolt(width: number, height: number): string {
  let x = width * (0.15 + Math.random() * 0.7);
  let y = -10;
  let d = `M${x.toFixed(0)} ${y}`;
  const end = height * (0.34 + Math.random() * 0.2);
  while (y < end) {
    x += (Math.random() - 0.5) * 90;
    y += 26 + Math.random() * 44;
    d += `L${x.toFixed(0)} ${y.toFixed(0)}`;
    if (Math.random() < 0.28) {
      // A short fork.
      const fx = x + (Math.random() - 0.5) * 120;
      const fy = y + 40 + Math.random() * 50;
      d += `L${fx.toFixed(0)} ${fy.toFixed(0)}M${x.toFixed(0)} ${y.toFixed(0)}`;
    }
  }
  return d;
}

export function RainBackdrop({ lamp = 'right', intensity = 'full' }: RainBackdropProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltRef = useRef<SVGPathElement>(null);
  const soft = intensity === 'soft';

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    const splashes: Splash[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (layer: 0 | 1 | 2, anywhere: boolean): Drop => {
      const spec = LAYERS[layer];
      return {
        x: rand(-0.15, 1.05) * width,
        y: anywhere ? Math.random() * height : -rand(0, 0.25) * height,
        len: rand(spec.len[0], spec.len[1]) * dpr,
        speed: rand(spec.speed[0], spec.speed[1]) * dpr,
        layer,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.round(root.clientWidth * dpr);
      height = canvas.height = Math.round(root.clientHeight * dpr);
      const count = Math.min(520, Math.round((root.clientWidth * root.clientHeight) / (soft ? 7200 : 3600)));
      drops = Array.from({ length: count }, (_, i) => spawn((i % 3) as 0 | 1 | 2, true));
    };

    const colour = () => (document.documentElement.dataset.theme === 'light' ? '70, 84, 104' : '196, 210, 234');

    const draw = (dt: number, time: number) => {
      const slant = 0.16 + Math.sin(time / 5200) * 0.06; // the wind breathes
      const rgb = colour();
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      for (let layer = 0 as 0 | 1 | 2; layer < 3; layer = (layer + 1) as 0 | 1 | 2) {
        const spec = LAYERS[layer];
        ctx.beginPath();
        for (const d of drops) {
          if (d.layer !== layer) continue;
          d.y += d.speed * dt;
          d.x += d.speed * dt * slant;
          if (d.y > height) {
            // Near drops hit the street in front of us and splash.
            if (layer === 2 && splashes.length < 46) splashes.push({ x: d.x, y: height * rand(0.9, 0.995), age: 0 });
            Object.assign(d, spawn(layer, false));
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * slant, d.y + d.len);
        }
        ctx.strokeStyle = `rgba(${rgb}, ${spec.alpha})`;
        ctx.lineWidth = spec.width * dpr;
        ctx.stroke();
      }
      ctx.lineWidth = dpr;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]!;
        s.age += dt;
        const p = s.age / 0.42;
        if (p >= 1) {
          splashes.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, (3 + p * 13) * dpr, (1 + p * 3.2) * dpr, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, ${0.34 * (1 - p)})`;
        ctx.stroke();
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    if (reduced) {
      draw(0, 0);
      const redraw = new ResizeObserver(() => draw(0, 0));
      redraw.observe(root);
      return () => {
        observer.disconnect();
        redraw.disconnect();
      };
    }

    // Pointer parallax, eased.
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      draw(dt, t);
      now.x += (target.x - now.x) * Math.min(1, dt * 3);
      now.y += (target.y - now.y) * Math.min(1, dt * 3);
      root.style.setProperty('--mx', now.x.toFixed(4));
      root.style.setProperty('--my', now.y.toFixed(4));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Lightning: every so often the whole sky goes white for a moment.
    let strikeTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    const schedule = (first = false) => {
      const wait = first ? rand(2500, 6000) : soft ? rand(16000, 34000) : rand(9000, 22000);
      strikeTimer = setTimeout(() => {
        if (document.visibilityState === 'visible' && document.documentElement.dataset.theme !== 'light') {
          boltRef.current?.setAttribute('d', bolt(root.clientWidth, root.clientHeight));
          root.dataset.flash = Math.random() < 0.5 ? 'a' : 'b';
          clearTimer = setTimeout(() => delete root.dataset.flash, 900);
        }
        schedule();
      }, wait);
    };
    schedule(true);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(strikeTimer);
      clearTimeout(clearTimer);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reduced, soft]);

  const signX = lamp === 'right' ? 905 : 665;

  return (
    <div ref={rootRef} className={styles.backdrop} data-lamp={lamp} data-intensity={intensity} aria-hidden="true">
      <div className={styles.clouds}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.flash} />
      <svg className={styles.bolt} focusable="false">
        <path ref={boltRef} />
      </svg>

      <svg className={`${styles.city} ${styles.cityFar}`} viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={FAR_PATH} />
        <Windows list={FAR_WINDOWS} w={4} h={6} />
      </svg>

      <svg className={`${styles.city} ${styles.cityMid}`} viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={MID_PATH} />
        <Windows list={MID_WINDOWS} w={6} h={9} />
        {BEACONS.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="2.4" className={styles.beacon} style={{ animationDelay: `${-i * 0.9}s` }} />
        ))}
      </svg>

      {/* The elevated line and its train. */}
      <div className={styles.el}>
        <div className={styles.train}>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className={styles.track} />
      </div>

      <svg className={`${styles.city} ${styles.cityNear}`} viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={NEAR_PATH} />
        <Windows list={NEAR_WINDOWS} w={7} h={10} />
        <g className={styles.sign} transform={`translate(${signX} 158)`}>
          <rect className={styles.signBack} x="-17" y="-8" width="34" height="168" rx="3" />
          <rect className={styles.signTube} x="-13" y="-4" width="26" height="160" rx="2" />
          {'HOTEL'.split('').map((letter, i) => (
            <text key={i} x="0" y={24 + i * 30} className={`${styles.signLetter} ${i === 3 ? styles.signFaulty : ''}`}>
              {letter}
            </text>
          ))}
          <path className={styles.signArm} d="M17 12h16v4h-16zM17 132h16v4h-16z" />
        </g>
      </svg>

      <div className={styles.street}>
        <div className={styles.signReflection} style={{ left: `${(signX / 1600) * 100}%` }} />
      </div>

      <div className={styles.lamp}>
        <div className={styles.cone} />
        <div className={styles.glow} />
        <div className={styles.pool} />
        <svg className={styles.post} viewBox="0 0 100 300" preserveAspectRatio="xMidYMax meet" focusable="false">
          <path d="M72 300V44c0-16-10-26-26-26H34" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M66 300h12v-10h-12z" fill="currentColor" />
          <path d="M22 18h24l-3 10H25z" fill="currentColor" />
          <ellipse cx="34" cy="29" rx="9" ry="2.6" className={styles.bulb} />

          {/* The detective, waiting under the light. */}
          <g className={styles.detective}>
            <ellipse cx="30" cy="300" rx="15" ry="1.6" className={styles.shadow} />
            <path d="M24 286h5.4l-.4 13.2h-5.8zM31 286h5.4l.9 13.2h-5.8z" />
            <path d="M18.6 299h9v1.6h-10zM30.4 299h9l1 1.6h-10z" />
            <path d="M22 236.5c2-4.2 5-5.2 8-3.7 3-1.5 6-.5 8 3.7l2.6 33.5c.3 6-.5 12-1 16.2H20.9c-1-4.200-1.500-10.2-1.200-16.200z" />
            <path d="M26 224h8v5.200c0 2-1.800 3.600-4 3.600s-4-1.600-4-3.600z" />
            <path d="M24.400 224.300c0-8 2.600-9.800 5.600-9.800s5.600 1.800 5.600 9.800z" />
            <ellipse cx="30" cy="224.300" rx="9.400" ry="1.900" />
            <path className={styles.rim} d="M24.600 222c.4-5.600 2.600-7.200 5.400-7.200M22.300 236.600c1.900-3.700 4.600-4.700 7.300-3.500" />
            <circle cx="35.600" cy="229.600" r="0.75" className={styles.ember} />
          </g>
        </svg>
        <div className={styles.smoke}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.rain} />
      <div className={styles.fog}>
        <span />
        <span />
      </div>
      <div className={styles.vignette} />
    </div>
  );
}
