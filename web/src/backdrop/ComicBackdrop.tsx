// A painted backdrop in the style of the comic strips: layers of the picture stacked back to front,
// with rain, mist, lightning and lights between them. The layers lean with the pointer by their depth.
// Purely decorative (aria-hidden). With reduced motion it is one still frame: no rain falling, no
// lightning, no drifting mist, no leaning.
import { useEffect, useRef, type CSSProperties } from 'react';
import { backdropArt } from '../assets/registry.ts';
import { useReducedMotion } from '../store/settings.ts';
import { backdropScene, hasBackdrop, type BackdropItem } from './scenes.ts';
import styles from './ComicBackdrop.module.css';

interface Props {
  scene: string;
  /**
   * How much the picture steps back for what is on top of it. menu: dark on the left, where the menu
   * sits; page: the whole picture dimmed, for screens full of panels and reading.
   */
  dim?: 'menu' | 'page';
}

const depthStyle = (depth: number, extra?: Record<string, string | number>) =>
  ({ ['--depth' as string]: depth, ...extra }) as CSSProperties;

// ---------------------------------------------------------------------------------------------------
// Rain on a canvas. Far rain: thin, slow streaks. Near rain: thick, fast streaks that splash on the ground.

const DROPS = {
  far: [
    { alpha: 0.18, width: 0.8, len: [8, 14], speed: [560, 720] },
    { alpha: 0.28, width: 1.1, len: [13, 22], speed: [800, 1040] },
  ],
  near: [{ alpha: 0.46, width: 1.7, len: [24, 40], speed: [1250, 1600] }],
} as const;

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  spec: number;
}

function Rain({ drops, density = 1, reduced }: { drops: 'far' | 'near'; density?: number; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const specs = DROPS[drops];
    const near = drops === 'near';
    let width = 0;
    let height = 0;
    let dpr = 1;
    let list: Drop[] = [];
    const splashes: Array<{ x: number; y: number; age: number }> = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (spec: number, anywhere: boolean): Drop => {
      const s = specs[spec]!;
      return {
        x: rand(-0.2, 1.05) * width,
        y: anywhere ? Math.random() * height : -rand(0, 0.3) * height,
        len: rand(s.len[0], s.len[1]) * dpr,
        speed: rand(s.speed[0], s.speed[1]) * dpr,
        spec,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.round(canvas.clientWidth * dpr);
      height = canvas.height = Math.round(canvas.clientHeight * dpr);
      const per = near ? 9000 : 3200;
      const count = Math.min(near ? 220 : 480, Math.round(((canvas.clientWidth * canvas.clientHeight) / per) * density));
      list = Array.from({ length: count }, (_, i) => spawn(i % specs.length, true));
    };

    const draw = (dt: number, time: number) => {
      const slant = 0.17 + Math.sin(time / 5200) * 0.06; // the wind breathes
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      specs.forEach((s, si) => {
        ctx.beginPath();
        for (const d of list) {
          if (d.spec !== si) continue;
          d.y += d.speed * dt;
          d.x += d.speed * dt * slant;
          if (d.y > height) {
            if (near && splashes.length < 50) splashes.push({ x: d.x, y: height * rand(0.88, 0.995), age: 0 });
            Object.assign(d, spawn(si, false));
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * slant, d.y + d.len);
        }
        ctx.strokeStyle = `rgba(214, 226, 246, ${s.alpha})`;
        ctx.lineWidth = s.width * dpr;
        ctx.stroke();
      });
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
        ctx.ellipse(s.x, s.y, (3 + p * 14) * dpr, (1 + p * 3.4) * dpr, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(214, 226, 246, ${0.38 * (1 - p)})`;
        ctx.stroke();
      }
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0, 0);
    });
    observer.observe(canvas);
    if (reduced) {
      draw(0, 0);
      return () => observer.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      draw(dt, t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [drops, density, reduced]);

  return <canvas ref={ref} className={styles.rain} />;
}

// ---------------------------------------------------------------------------------------------------

function Item({ scene, item, reduced }: { scene: string; item: BackdropItem; reduced: boolean }) {
  switch (item.kind) {
    case 'art': {
      const src = backdropArt(scene, item.art);
      if (!src) return null;
      return (
        <div className={`${styles.item} ${item.pan ? styles.pan : ''}`} style={depthStyle(item.depth)}>
          <img
            src={src}
            alt=""
            className={styles.art}
            decoding="async"
            draggable={false}
            onLoad={(e) => (e.currentTarget.dataset.ready = '')}
          />
        </div>
      );
    }
    case 'rain':
      return (
        <div className={styles.item}>
          <Rain drops={item.drops} density={item.density} reduced={reduced} />
        </div>
      );
    case 'fog':
      return (
        <div className={styles.item} style={depthStyle(item.depth)}>
          <div
            className={styles.fog}
            style={{ top: `${item.top}%`, height: `${item.height}%`, opacity: item.opacity, ['--seconds' as string]: `${item.seconds}s` }}
          >
            <span />
            <span />
          </div>
        </div>
      );
    case 'lightning': {
      const bolt = backdropArt('fx', 'bolt');
      return (
        <div className={`${styles.item} ${styles.lightning}`} style={depthStyle(item.depth)} data-lightning="">
          <div className={styles.flash} />
          {bolt && <img src={bolt} alt="" className={styles.bolt} draggable={false} />}
        </div>
      );
    }
    case 'glow':
      return (
        <div className={styles.item} style={depthStyle(item.depth)}>
          <span
            className={styles.glow}
            data-mode={item.mode}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.r * 2}%`,
              ['--glow' as string]: item.color,
              ['--strength' as string]: item.strength ?? 1,
            }}
          />
        </div>
      );
    case 'smoke':
      return (
        <div className={styles.item} style={depthStyle(item.depth)}>
          <div className={styles.smoke} style={{ left: `${item.x}%`, top: `${item.y}%` }}>
            <span />
            <span />
            <span />
          </div>
        </div>
      );
  }
}

export function ComicBackdrop({ scene, dim = 'page' }: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const def = backdropScene(scene);
  const lightning = def?.items.find((i) => i.kind === 'lightning');

  // The layers lean with the pointer, eased; without a pointer they sway a little on their own.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let moved = 0;
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
      moved = performance.now();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (t - moved > 4000) {
        target.x = Math.sin(t / 7000) * 0.35;
        target.y = Math.sin(t / 9000) * 0.2;
      }
      now.x += (target.x - now.x) * Math.min(1, dt * 2.5);
      now.y += (target.y - now.y) * Math.min(1, dt * 2.5);
      root.style.setProperty('--mx', now.x.toFixed(4));
      root.style.setProperty('--my', now.y.toFixed(4));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reduced]);

  // Lightning: every so often the sky goes white and a bolt shows at one of the scene's places.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || lightning?.kind !== 'lightning') return;
    const spots = lightning.at;
    let strike: ReturnType<typeof setTimeout>;
    let clear: ReturnType<typeof setTimeout>;
    const schedule = (first = false) => {
      const wait = first ? 2500 + Math.random() * 4000 : 9000 + Math.random() * 15000;
      strike = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          root.style.setProperty('--bolt-x', `${spots[Math.floor(Math.random() * spots.length)]}%`);
          root.style.setProperty('--bolt-flip', Math.random() < 0.5 ? '-1' : '1');
          root.dataset.flash = Math.random() < 0.5 ? 'a' : 'b';
          clear = setTimeout(() => delete root.dataset.flash, 1100);
        }
        schedule();
      }, wait);
    };
    schedule(true);
    return () => {
      clearTimeout(strike);
      clearTimeout(clear);
    };
  }, [reduced, lightning]);

  if (!def || !hasBackdrop(scene)) return null;

  return (
    <div
      ref={rootRef}
      className={styles.backdrop}
      data-dim={dim}
      data-reduced={reduced ? '' : undefined}
      style={{ ['--focus-x' as string]: def.focusX ?? 0.5 }}
      aria-hidden="true"
      data-testid="comic-backdrop"
    >
      <div className={styles.stage}>
        {def.items.map((item, i) => (
          <Item key={i} scene={scene} item={item} reduced={reduced} />
        ))}
      </div>
      <div className={styles.halftone} />
      <div className={styles.scrim} />
    </div>
  );
}
