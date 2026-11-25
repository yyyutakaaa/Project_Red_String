// The tutorial's guide: a note on the desk that says what to do next, with a red arrow pointing at
// the part of the screen to use. It follows the player through the tutorial case (tutorialSteps.ts)
// and never blocks the screen: only the note itself takes clicks.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { CaseProgress } from '../engine/types.ts';
import { casePath } from '../hooks/useCase.ts';
import { useReducedMotion } from '../store/settings.ts';
import { useT } from '../i18n/index.ts';
import { completeTutorial } from './onboarding.ts';
import { tutorialStep } from './tutorialSteps.ts';
import styles from './TutorialGuide.module.css';

const COLLAPSE_KEY = 'redstring.tour.collapsed';
const GAP = 46;
const MARGIN = 12;

interface Layout {
  /** The note's top-left corner. */
  x: number;
  y: number;
  /** The target's box, or null when the note has nothing to point at (or it is not on screen). */
  target: { x: number; y: number; w: number; h: number } | null;
  /** Where the arrow starts (on the note) and ends (on the target). */
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
}

function readCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Put the note beside the target where there is room, and aim the arrow from the note's edge.
 * `clear` is the area the note must leave free (the target, plus whatever the step needs to stay
 * usable, such as the question box next to the evidence button).
 */
function place(note: DOMRect, rect: DOMRect | null, clear: DOMRect | null, vw: number, vh: number, top: number): Layout {
  const corner = { x: vw - note.width - MARGIN * 2, y: vh - note.height - MARGIN * 2 };
  if (!rect || rect.width === 0 || rect.bottom < top || rect.top > vh) return { ...corner, target: null, from: null, to: null };
  const clampX = (x: number) => Math.min(vw - note.width - MARGIN, Math.max(MARGIN, x));
  const clampY = (y: number) => Math.min(vh - note.height - MARGIN, Math.max(top + MARGIN, y));
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const target = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  const box = clear
    ? { left: Math.min(rect.left, clear.left), top: Math.min(rect.top, clear.top), right: Math.max(rect.right, clear.right), bottom: Math.max(rect.bottom, clear.bottom) }
    : rect;
  const options = [
    { fits: box.bottom + GAP + note.height < vh - MARGIN, x: clampX(cx - note.width / 2), y: box.bottom + GAP, side: 'below' },
    { fits: box.top - GAP - note.height > top + MARGIN, x: clampX(cx - note.width / 2), y: box.top - GAP - note.height, side: 'above' },
    { fits: box.right + GAP + note.width < vw - MARGIN, x: box.right + GAP, y: clampY(cy - note.height / 2), side: 'right' },
    { fits: box.left - GAP - note.width > MARGIN, x: box.left - GAP - note.width, y: clampY(cy - note.height / 2), side: 'left' },
  ];
  const pick = options.find((o) => o.fits) ?? { ...corner, side: 'corner' };
  const noteBox = { left: pick.x, top: pick.y, right: pick.x + note.width, bottom: pick.y + note.height };
  let from: { x: number; y: number };
  let to: { x: number; y: number };
  if (pick.side === 'below') {
    from = { x: Math.min(noteBox.right - 24, Math.max(noteBox.left + 24, cx)), y: noteBox.top };
    to = { x: cx, y: rect.bottom + 4 };
  } else if (pick.side === 'above') {
    from = { x: Math.min(noteBox.right - 24, Math.max(noteBox.left + 24, cx)), y: noteBox.bottom };
    to = { x: cx, y: rect.top - 4 };
  } else if (pick.side === 'right') {
    from = { x: noteBox.left, y: Math.min(noteBox.bottom - 24, Math.max(noteBox.top + 24, cy)) };
    to = { x: rect.right + 4, y: cy };
  } else if (pick.side === 'left') {
    from = { x: noteBox.right, y: Math.min(noteBox.bottom - 24, Math.max(noteBox.top + 24, cy)) };
    to = { x: rect.left - 4, y: cy };
  } else {
    from = { x: noteBox.left + 30, y: noteBox.top };
    to = { x: cx, y: cy };
  }
  return { x: pick.x, y: pick.y, target, from, to };
}

const same = (a: Layout | null, b: Layout) => a !== null && JSON.stringify(a) === JSON.stringify(b);

/** A hand-drawn curve from the note to the target. */
function arrowPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Bend the line a little to one side.
  const bend = Math.min(60, Math.hypot(dx, dy) / 4);
  const len = Math.hypot(dx, dy) || 1;
  return `M ${from.x} ${from.y} Q ${mx - (dy / len) * bend} ${my + (dx / len) * bend} ${to.x} ${to.y}`;
}

export function TutorialGuide({ caseKey, progress }: { caseKey: string; progress: CaseProgress }) {
  const { t } = useT();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [screen = 'briefing', target = null] = location.pathname.slice(casePath(caseKey).length).split('/').filter(Boolean);
  const step = tutorialStep(screen, target, progress);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [layout, setLayout] = useState<Layout | null>(null);
  const noteRef = useRef<HTMLElement>(null);
  const last = useRef<Layout | null>(null);

  // Done once the accusation is made, whatever the verdict: the popup does not offer it again.
  const closed = Boolean(progress.accusation);
  useEffect(() => {
    if (closed) completeTutorial();
  }, [closed]);

  useEffect(() => {
    try {
      sessionStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* stays as it is for this screen only */
    }
  }, [collapsed]);

  // Bring a new step's target into view once (it may sit below the fold of a scrolling panel).
  useEffect(() => {
    if (!step.target || collapsed) return;
    const timer = setTimeout(() => {
      document.querySelector(step.target!)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }, 350);
    return () => clearTimeout(timer);
  }, [step.id, step.target, collapsed, reduced]);

  // Follow the target as the screen scrolls, resizes or redraws. Only a real move re-renders.
  useLayoutEffect(() => {
    if (collapsed) return;
    let raf = 0;
    const tick = () => {
      const note = noteRef.current;
      if (note) {
        const el = step.target ? document.querySelector(step.target) : null;
        const clear = step.clear ? document.querySelector(step.clear) : null;
        const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--titlebar-h')) || 0;
        const next = place(note.getBoundingClientRect(), el?.getBoundingClientRect() ?? null, clear?.getBoundingClientRect() ?? null, window.innerWidth, window.innerHeight, top);
        const rounded = JSON.parse(JSON.stringify(next, (_k, v: unknown) => (typeof v === 'number' ? Math.round(v) : v))) as Layout;
        if (!same(last.current, rounded)) {
          last.current = rounded;
          setLayout(rounded);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step.target, step.clear, step.id, collapsed]);

  if (collapsed) {
    return (
      <button type="button" className={styles.chip} onClick={() => setCollapsed(false)} data-testid="tour-show">
        <span className={styles.chipMark} aria-hidden="true">?</span>
        {t('tour.show')}
      </button>
    );
  }

  const ready = layout !== null;
  return (
    <div className={styles.layer} data-testid="tour" data-step={step.id}>
      {ready && layout.target && layout.from && layout.to && (
        <svg className={styles.arrows} aria-hidden="true" focusable="false">
          <defs>
            <marker id="tour-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className={styles.head} />
            </marker>
          </defs>
          <rect
            className={styles.ring}
            x={layout.target.x - 6}
            y={layout.target.y - 6}
            width={layout.target.w + 12}
            height={layout.target.h + 12}
            rx="10"
          />
          <path key={step.id} className={styles.arrow} d={arrowPath(layout.from, layout.to)} markerEnd="url(#tour-head)" pathLength={1} />
        </svg>
      )}
      <aside
        ref={noteRef}
        key={step.id}
        className={`paper ${styles.note}`}
        style={{ transform: `translate(${layout?.x ?? -9999}px, ${layout?.y ?? -9999}px)` }}
        aria-live="polite"
        aria-label={t('tour.label')}
      >
        <p className={styles.kicker}>
          <span>{t('tour.kicker')}</span>
          <button type="button" className={styles.hide} onClick={() => setCollapsed(true)} data-testid="tour-hide">
            {t('tour.hide')}
          </button>
        </p>
        <h2 className={styles.title} data-testid="tour-title">
          {t(step.title)}
        </h2>
        <p className={styles.text}>{t(step.text)}</p>
        {step.tip && (
          <p className={styles.tip}>
            <strong>{t('tour.tip')}</strong> {t(step.tip)}
          </p>
        )}
      </aside>
    </div>
  );
}
