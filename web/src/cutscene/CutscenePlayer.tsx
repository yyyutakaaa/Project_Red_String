// Plays a cutscene as a comic: one page at a time, its panels fading in one after another, each
// panel's layers leaning with the pointer and its captions and balloons appearing one click at a
// time. Click, Space, Enter or the right arrow goes on; Escape skips the lot.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { cutsceneArt } from '../assets/registry.ts';
import { sfx } from '../audio/audio.ts';
import { useReducedMotion } from '../store/settings.ts';
import { useT, type LanguageCode } from '../i18n/index.ts';
import { FocusContext, SharedDefs } from './art/kit.tsx';
import { cutsceneFor, textIn, useCutscenePlaying } from './index.ts';
import type { Beat, Focus, Layer, Panel } from './types.ts';
import styles from './Cutscene.module.css';

interface Props {
  caseId: string;
  /** The case's name in the player's language, for the title card. */
  title: string;
  onDone: () => void;
}

/** How long a panel waits after fading in before its first caption shows by itself. */
const FIRST_BEAT_MS = 650;

/** object-position for a real drawing, matching the svg's preserveAspectRatio. */
function objectPosition(focus: Focus): string {
  const x = focus.slice(1, 4) === 'Min' ? 'left' : focus.slice(1, 4) === 'Max' ? 'right' : 'center';
  const y = focus.slice(5) === 'Min' ? 'top' : focus.slice(5) === 'Max' ? 'bottom' : 'center';
  return `${x} ${y}`;
}

function LayerView({ caseId, layer, art, focus }: { caseId: string; layer: Layer; art: Record<string, ComponentType>; focus: Focus }) {
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
      {file ? <img src={file} alt="" className={styles.layerImg} style={{ objectPosition: objectPosition(focus) }} /> : Drawing ? <Drawing /> : null}
    </div>
  );
}

function BeatView({ beat, text, onSize }: { beat: Beat; text: string; onSize: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const frame = el?.parentElement;
    if (!el || !frame) return;
    const measure = () => onSize((el.offsetHeight / frame.clientHeight) * 100);
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

interface FrameProps {
  caseId: string;
  panel: Panel;
  art: Record<string, ComponentType>;
  /** How many of its captions and balloons are out. */
  shown: number;
  current: boolean;
  title: string;
  language: LanguageCode;
}

/** One panel on the page. */
function Frame({ caseId, panel, art, shown, current, title, language }: FrameProps) {
  const [heights, setHeights] = useState<Record<number, number>>({});
  const setHeight = useCallback((i: number, h: number) => {
    setHeights((prev) => (Math.abs((prev[i] ?? 0) - h) < 0.2 ? prev : { ...prev, [i]: h }));
  }, []);
  const focus = panel.focus ?? 'xMidYMid';
  const beats = panel.beats.slice(0, shown);
  const waiting = current && shown >= panel.beats.length;

  return (
    <div className={styles.frame} style={{ gridArea: panel.id }} data-drift={panel.drift} data-testid={`cutscene-panel-${panel.id}`}>
      <FocusContext.Provider value={focus}>
        <div className={styles.camera}>
          {panel.layers.map((layer, i) => (
            <LayerView key={`${layer.art}-${i}`} caseId={caseId} layer={layer} art={art} focus={focus} />
          ))}
        </div>
      </FocusContext.Provider>
      <div className={styles.halftone} aria-hidden="true" />

      {panel.titleCard && (
        <h2 className={styles.title} style={panel.titleTop !== undefined ? { top: `${panel.titleTop}%` } : undefined}>
          {title}
        </h2>
      )}

      {/* Balloon tails sit under the balloons, so only the part outside them shows. */}
      <svg className={styles.tails} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {beats.map((b, i) => {
          if (b.kind !== 'balloon' || !b.tail) return null;
          const cx = b.x + b.w / 2;
          const cy = b.y + (heights[i] ?? 8) / 2;
          const dx = b.tail.x - cx;
          const dy = b.tail.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const nx = (-dy / len) * 2.4;
          const ny = (dx / len) * 3.8;
          return <polygon key={i} points={`${cx + nx},${cy + ny} ${cx - nx},${cy - ny} ${b.tail.x},${b.tail.y}`} className={styles.tail} />;
        })}
      </svg>

      {beats.map((b, i) => (
        <BeatView key={i} beat={b} text={textIn(b.text, language)} onSize={(h) => setHeight(i, h)} />
      ))}

      {waiting && <span className={styles.next} aria-hidden="true" />}
    </div>
  );
}

export function CutscenePlayer({ caseId, title, onDone }: Props) {
  const entry = cutsceneFor(caseId);
  const { t, language } = useT();
  const reduced = useReducedMotion();
  const [pageIndex, setPageIndex] = useState(0);
  /** The panel on this page that is being read; the ones before it stay on the page. */
  const [panelIndex, setPanelIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const pages = entry?.cutscene.pages ?? [];
  const page = pages[pageIndex];
  const panel = page?.panels[panelIndex];
  const beats = panel?.beats ?? [];
  const lastPanel = page ? panelIndex === page.panels.length - 1 : true;
  const lastPage = pageIndex === pages.length - 1;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    useCutscenePlaying.setState({ playing: true });
    return () => useCutscenePlaying.setState({ playing: false });
  }, []);

  // A new panel fades in; its first caption comes by itself a moment later.
  useEffect(() => {
    setShown(0);
    const timer = setTimeout(() => setShown((s) => Math.max(s, 1)), reduced ? 0 : FIRST_BEAT_MS);
    return () => clearTimeout(timer);
  }, [pageIndex, panelIndex, reduced]);

  const advance = () => {
    if (!panel) return;
    if (shown < beats.length) {
      setShown((s) => s + 1);
      sfx('click');
    } else if (!lastPanel) {
      setPanelIndex((i) => i + 1);
      sfx('page');
    } else if (!lastPage) {
      setPageIndex((i) => i + 1);
      setPanelIndex(0);
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
      pageRef.current?.style.setProperty('--mx', now.x.toFixed(4));
      pageRef.current?.style.setProperty('--my', now.y.toFixed(4));
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  if (!entry || !page || !panel) return null;

  // Progress over the whole strip, one dot per panel.
  const allPanels = pages.flatMap((p, pi) => p.panels.map((pn, i) => ({ key: `${p.id}-${pn.id}`, on: pi === pageIndex && i === panelIndex })));

  return (
    <div className={styles.overlay} data-testid="cutscene" data-page={page.id} data-panel={panel.id} data-still={reduced || undefined} role="dialog" aria-modal="true" aria-label={title}>
      <SharedDefs />
      <button type="button" className={styles.skip} onClick={finish} data-testid="cutscene-skip">
        {t('cutscene.skip')}
      </button>

      <div className={styles.book} onClick={advance} data-testid="cutscene-next">
        <div
          key={page.id}
          ref={pageRef}
          className={styles.page}
          style={{ gridTemplateColumns: page.columns, gridTemplateRows: page.rows, gridTemplateAreas: page.areas.map((a) => `"${a}"`).join(' ') }}
        >
          {page.panels.slice(0, panelIndex + 1).map((p, i) => (
            <Frame
              key={p.id}
              caseId={caseId}
              panel={p}
              art={entry.art}
              shown={i < panelIndex ? p.beats.length : shown}
              current={i === panelIndex}
              title={title}
              language={language}
            />
          ))}
          {/* The panels still to come: empty frames on the page. */}
          {page.panels.slice(panelIndex + 1).map((p) => (
            <div key={p.id} className={styles.ghost} style={{ gridArea: p.id }} />
          ))}
        </div>

        <div className={styles.dots} aria-hidden="true">
          {allPanels.map((d) => (
            <span key={d.key} data-on={d.on || undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
