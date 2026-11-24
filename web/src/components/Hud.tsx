import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { CaseFile } from '@shared/caseSchema.ts';
import type { CaseProgress } from '../engine/types.ts';
import { HINT_COST, discoveredCount, totalDiscoverables } from '../engine/scoring.ts';
import { SLOT_COUNT } from '../engine/save.ts';
import { hintsShown, takeHint, useCaseClock, useGame } from '../store/game.ts';
import { formatDuration, spokenDuration } from '../lib/format.ts';
import { casePath } from '../hooks/useCase.ts';
import { Button } from './Button.tsx';
import { Modal } from './Modal.tsx';
import styles from './Hud.module.css';

interface HudProps {
  caseFile: CaseFile;
  caseKey: string;
  progress: CaseProgress;
}

/** The case clock. Only this re-renders every second. */
function CaseTimer({ caseKey, progress }: { caseKey: string; progress: CaseProgress }) {
  const live = useCaseClock((s) => (s.caseKey === caseKey ? s.ms : null));
  const closed = progress.accusation !== null;
  const ms = closed ? (progress.accusation?.timeMs ?? progress.playMs ?? 0) : (live ?? progress.playMs ?? 0);
  return (
    <span
      className={`${styles.timer} ${closed ? styles.timerStopped : ''}`}
      role="timer"
      aria-label={`${closed ? 'Case closed in' : 'Time on the case'}: ${spokenDuration(ms)}`}
      title={closed ? 'Time it took to close the case' : 'Time on the case. It pauses when you step away.'}
      data-testid="case-timer"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="11.5" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 2.5h4M10 2.5v2M10 11.5V7.5M15.2 5.2l1.3-1.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span aria-hidden="true">{formatDuration(ms)}</span>
    </span>
  );
}

export function Hud({ caseFile, caseKey, progress }: HudProps) {
  const navigate = useNavigate();
  const [hintOpen, setHintOpen] = useState(false);
  const [latestHint, setLatestHint] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const saveNow = useGame((s) => s.saveNow);
  const saveToSlot = useGame((s) => s.saveToSlot);
  const activeSlot = useGame((s) => s.slot?.slot ?? 1);
  const discovered = discoveredCount(progress);
  const total = totalDiscoverables(caseFile);
  const remainingHints = caseFile.hints.length - progress.hintsUsed;
  const closed = progress.accusation !== null;
  const headerRef = useRef<HTMLElement>(null);

  // The HUD wraps onto several rows on narrow screens. Sticky panels below it offset themselves by
  // --hud-height, so publish the real height instead of the 56px default.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = (height: number) => {
      if (height > 0) root.style.setProperty('--hud-height', `${Math.ceil(height)}px`);
    };
    apply(el.getBoundingClientRect().height);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        const box = entries[0]?.borderBoxSize?.[0];
        apply(box ? box.blockSize : el.getBoundingClientRect().height);
      });
      ro.observe(el, { box: 'border-box' });
    }
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--hud-height');
    };
  }, []);

  const link = (to: string, label: string, extra = '') => (
    <NavLink to={casePath(caseKey, to)} className={({ isActive }) => `${styles.link} ${extra} ${isActive ? styles.active : ''}`}>
      {label}
    </NavLink>
  );

  return (
    <header ref={headerRef} className={styles.hud} aria-label="Case controls">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <NavLink to={casePath(caseKey, 'briefing')} className={styles.title} title="Open the case briefing">
        {caseFile.title}
      </NavLink>
      <nav className={styles.nav} aria-label="Case sections">
        {link('rooms', 'Scenes')}
        {link('suspects', 'Suspects')}
        {link('board', 'Board')}
        {link('notebook', 'Notebook')}
        {closed ? link('ending', 'Verdict', styles.accuse) : link('accuse', 'Accuse', styles.accuse)}
      </nav>
      <div className={styles.tools}>
        <span className={styles.counter} aria-label={`Clues found: ${discovered} of ${total}`} data-testid="clue-counter">
          Clues <strong>{discovered}</strong>/{total}
        </span>
        <CaseTimer caseKey={caseKey} progress={progress} />
        <Button size="small" onClick={() => setHintOpen(true)} aria-haspopup="dialog">
          Hint
        </Button>
        <Button size="small" onClick={() => setSaveOpen(true)} aria-haspopup="dialog">
          Save
        </Button>
        <Button size="small" variant="ghost" onClick={() => navigate('/')}>
          Menu
        </Button>
      </div>

      <Modal
        open={hintOpen}
        title="Ask the Captain for a hint"
        onClose={() => {
          setHintOpen(false);
          setLatestHint(null);
        }}
        footer={
          <>
            <Button variant="ghost" onClick={() => setHintOpen(false)}>
              Close
            </Button>
            <Button
              variant="lamp"
              disabled={remainingHints <= 0 || closed}
              onClick={() => setLatestHint(takeHint(caseFile, caseKey))}
            >
              {remainingHints > 0 ? `Take a hint (-${HINT_COST} points)` : 'No hints left'}
            </Button>
          </>
        }
      >
        {latestHint ? (
          <p className={styles.hintText} data-testid="hint-text">
            {latestHint}
          </p>
        ) : (
          <p>
            Each hint costs {HINT_COST} points from your final score. {remainingHints} of {caseFile.hints.length} hints remain.
          </p>
        )}
        {hintsShown(caseFile, progress).length > 0 && (
          <>
            <h3>Hints so far</h3>
            <ol className={styles.hintList}>
              {hintsShown(caseFile, progress).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ol>
          </>
        )}
      </Modal>

      <Modal
        open={saveOpen}
        title="Save the case"
        onClose={() => setSaveOpen(false)}
        footer={
          <Button
            variant="lamp"
            onClick={() => {
              saveNow();
              setSaveOpen(false);
            }}
          >
            Save to slot {activeSlot}
          </Button>
        }
      >
        <p>The game also saves automatically after every action. You can copy this game into another slot:</p>
        <div className={styles.slotRow}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)
            .filter((n) => n !== activeSlot)
            .map((n) => (
              <Button
                key={n}
                onClick={() => {
                  saveToSlot(n);
                  setSaveOpen(false);
                }}
              >
                Save to slot {n} and continue there
              </Button>
            ))}
        </div>
      </Modal>
    </header>
  );
}
