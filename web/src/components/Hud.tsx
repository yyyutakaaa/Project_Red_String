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
import { useT } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

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
  const { t } = useT();
  return (
    <span
      className={`${styles.timer} ${closed ? styles.timerStopped : ''}`}
      role="timer"
      aria-label={t(closed ? 'hud.closedIn' : 'hud.timeOn', { time: spokenDuration(ms) })}
      title={closed ? t('hud.closedTitle') : t('hud.timeTitle')}
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
  const { t } = useT();

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
    <header ref={headerRef} className={styles.hud} aria-label={t('hud.controls')}>
      <a href="#main" className="skip-link">
        {t('hud.skip')}
      </a>
      <NavLink to={casePath(caseKey, 'briefing')} className={styles.title} title={t('hud.openBriefing')}>
        {caseFile.title}
      </NavLink>
      <nav className={styles.nav} aria-label={t('hud.sections')}>
        {link('rooms', t('nav.scenes'))}
        {link('suspects', t('nav.suspects'))}
        {link('board', t('nav.board'))}
        {link('notebook', t('nav.notebook'))}
        {closed ? link('ending', t('hud.verdict'), styles.accuse) : link('accuse', t('nav.accuse'), styles.accuse)}
      </nav>
      <div className={styles.tools}>
        <span className={styles.counter} aria-label={t('hud.cluesLabel', { n: discovered, total })} data-testid="clue-counter">
          <span className={styles.counterFull} aria-hidden="true">
            {rich(t('hud.clues'), { n: <strong>{discovered}</strong>, total })}
          </span>
          {/* Narrower windows: a magnifier and the numbers only (the label above is still read out). */}
          <span className={styles.counterShort} aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12.6 12.6l4.4 4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <strong>{discovered}</strong>/{total}
          </span>
        </span>
        <CaseTimer caseKey={caseKey} progress={progress} />
        <Button size="small" onClick={() => setHintOpen(true)} aria-haspopup="dialog">
          {t('hud.hint')}
        </Button>
        <Button size="small" onClick={() => setSaveOpen(true)} aria-haspopup="dialog">
          {t('hud.save')}
        </Button>
        <Button size="small" variant="ghost" onClick={() => navigate('/')}>
          {t('hud.menu')}
        </Button>
      </div>

      <Modal
        open={hintOpen}
        title={t('hud.hintTitle')}
        onClose={() => {
          setHintOpen(false);
          setLatestHint(null);
        }}
        footer={
          <>
            <Button variant="ghost" onClick={() => setHintOpen(false)}>
              {t('common.close')}
            </Button>
            <Button
              variant="lamp"
              disabled={remainingHints <= 0 || closed}
              onClick={() => setLatestHint(takeHint(caseFile, caseKey))}
            >
              {remainingHints > 0 ? t('hud.takeHint', { cost: HINT_COST }) : t('hud.noHints')}
            </Button>
          </>
        }
      >
        {latestHint ? (
          <p className={styles.hintText} data-testid="hint-text">
            {latestHint}
          </p>
        ) : (
          <p>{t('hud.hintCost', { cost: HINT_COST, remaining: remainingHints, total: caseFile.hints.length })}</p>
        )}
        {hintsShown(caseFile, progress).length > 0 && (
          <>
            <h3>{t('hud.hintsSoFar')}</h3>
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
        title={t('hud.saveTitle')}
        onClose={() => setSaveOpen(false)}
        footer={
          <Button
            variant="lamp"
            onClick={() => {
              saveNow();
              setSaveOpen(false);
            }}
          >
            {t('hud.saveToSlot', { n: activeSlot })}
          </Button>
        }
      >
        <p>{t('hud.saveNote')}</p>
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
                {t('hud.saveCopy', { n })}
              </Button>
            ))}
        </div>
      </Modal>
    </header>
  );
}
