// Plays a cutscene: one comic panel at a time, its layers drifting against each other with the
// pointer, and its captions and balloons appearing one click at a time. Click, Space, Enter or the
// right arrow goes on; Escape skips the lot.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { cutsceneArt } from '../assets/registry.ts';
import { sfx } from '../audio/audio.ts';
import { useReducedMotion } from '../store/settings.ts';
import { useT } from '../i18n/index.ts';
import { SharedDefs } from './art/kit.tsx';
import { cutsceneFor, textIn, useCutscenePlaying } from './index.ts';
import type { Beat, Layer } from './types.ts';
import styles from './Cutscene.module.css';

interface Props {
  caseId: string;
  /** The case's name in the player's language, for the title card. */
  title: string;
  onDone: () => void;
}

/** How long a panel waits before its first caption shows by itself. */
const FIRST_BEAT_MS = 650;

function LayerView({ caseId, layer, art }: { caseId: string; layer: Layer; art: Record<string, React.ComponentType> }) {
  const style = { ['--depth' as string]: layer.depth, ['--delay' as string]: `${layer.delay ?? 0}s` } as CSSProperties;
  if (layer.art === 'rain') {
    return (
      <div className={`${styles.layer} ${styles.rain}`} style={style} data-enter={layer.enter}>
        <span />
        <span />
      </div>
    );
  }
  const file = cutsceneArt(caseId, layer.art);
  const Drawing = art[layer.art];
  return (
    <div className={styles.layer} style={style} data-enter={layer.enter}>
      {file ? <img src={file} alt="" className={styles.layerImg} /> : Drawing ? <Drawing /> : null}
    </div>
  );
}

function BeatView({ beat, text, onSize }: { beat: Beat; text: string; onSize: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    const measure = () => onSize((el.offsetHeight / stage.clientHeight) * 100);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSize, text]);
  return (
    <div
      ref={ref}
      className={beat.kind === 'caption' ? styles.caption : styles.balloon}
      style={{ left: `${beat.x}%`, top: `${beat.y}%`, width: `${beat.w}%` }}
    >
      {text}
    </div>
  );
}

export function CutscenePlayer({ caseId, title, onDone }: Props) {
  const entry = cutsceneFor(caseId);
  const { t, language } = useT();
  const reduced = useReducedMotion();
  const [panelIndex, setPanelIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const panels = entry?.cutscene.panels ?? [];
  const panel = panels[panelIndex];
  const beats = panel?.beats ?? [];
  const last = panelIndex === panels.length - 1;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    useCutscenePlaying.setState({ playing: true });
    return () => useCutscenePlaying.setState({ playing: false });
  }, []);

  // A new panel: its first caption comes by itself after a moment.
  useEffect(() => {
    setShown(0);
    setHeights({});
    const timer = setTimeout(() => setShown((s) => Math.max(s, 1)), reduced ? 0 : FIRST_BEAT_MS);
    return () => clearTimeout(timer);
  }, [panelIndex, reduced]);

  const advance = () => {
    if (!panel) return;
    if (shown < beats.length) {
      setShown((s) => s + 1);
      sfx('click');
    } else if (!last) {
      setPanelIndex((i) => i + 1);
      sfx('page');
    } else {
      finish();
    }
  };

  // The keyboard reads the latest advance and finish through a ref.
  const keys = useRef({ advance, finish });
  useEffect(() => {
    keys.current = { advance, finish };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        keys.current.finish();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        keys.current.advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The layers lean a little towards the pointer, the near ones more than the far ones.
  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    let raf = 0;
    const frame = () => {
      now.x += (target.x - now.x) * 0.06;
      now.y += (target.y - now.y) * 0.06;
      stage.style.setProperty('--mx', now.x.toFixed(4));
      stage.style.setProperty('--my', now.y.toFixed(4));
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  const setHeight = useCallback((i: number, h: number) => {
    setHeights((prev) => (Math.abs((prev[i] ?? 0) - h) < 0.2 ? prev : { ...prev, [i]: h }));
  }, []);

  if (!entry || !panel) return null;
  const waiting = shown >= beats.length;

  return (
    <div className={styles.overlay} data-testid="cutscene" data-panel={panel.id} data-still={reduced || undefined} role="dialog" aria-modal="true" aria-label={title}>
      <SharedDefs />
      <button type="button" className={styles.skip} onClick={finish} data-testid="cutscene-skip">
        {t('cutscene.skip')}
      </button>

      <div className={styles.page} onClick={advance} data-testid="cutscene-next">
        <div key={panel.id} ref={stageRef} className={styles.stage} data-drift={panel.drift}>
          <div className={styles.camera}>
            {panel.layers.map((layer, i) => (
              <LayerView key={`${layer.art}-${i}`} caseId={caseId} layer={layer} art={entry.art} />
            ))}
          </div>
          <div className={styles.halftone} aria-hidden="true" />

          {panel.titleCard && <h2 className={styles.title}>{title}</h2>}

          {/* Balloon tails sit under the balloons, so only the part outside them shows. */}
          <svg className={styles.tails} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {beats.slice(0, shown).map((b, i) => {
              if (b.kind !== 'balloon' || !b.tail) return null;
              const cx = b.x + b.w / 2;
              const cy = b.y + (heights[i] ?? 8) / 2;
              const dx = b.tail.x - cx;
              const dy = b.tail.y - cy;
              const len = Math.hypot(dx, dy) || 1;
              const spread = 2.4;
              const nx = (-dy / len) * spread;
              const ny = (dx / len) * spread * 1.6;
              return <polygon key={i} points={`${cx + nx},${cy + ny} ${cx - nx},${cy - ny} ${b.tail.x},${b.tail.y}`} className={styles.tail} />;
            })}
          </svg>

          {beats.slice(0, shown).map((b, i) => (
            <BeatView key={i} beat={b} text={textIn(b.text, language)} onSize={(h) => setHeight(i, h)} />
          ))}

          {waiting && <span className={styles.next} aria-hidden="true" />}
        </div>

        <div className={styles.dots} aria-hidden="true">
          {panels.map((p, i) => (
            <span key={p.id} data-on={i === panelIndex || undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
