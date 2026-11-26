// Full-screen loading card used at start-up and when a case or save opens: the logo winds itself
// in as `progress` climbs, with a red thread underneath as the progress bar.
import { useEffect } from 'react';
import { LogoEye } from './LogoEye.tsx';
import { RainBackdrop } from './RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
import { hasBackdrop } from '../backdrop/scenes.ts';
import styles from './LoadingScreen.module.css';
import { t } from '../i18n/index.ts';

interface LoadingScreenProps {
  progress: number;
  /** Small line above the title, e.g. "Slot 2". */
  kicker?: string;
  title: string;
  /** What is happening right now. */
  status: string;
  leaving?: boolean;
  /** Show the big game title (start-up only). */
  masthead?: boolean;
  /** Given when the player may skip the wait: a click anywhere, or Enter, Space or Escape. */
  onSkip?: () => void;
  /** The painted scene behind the card; the street when the case has none of its own. */
  scene?: string;
}

export function LoadingScreen({ progress, kicker, title, status, leaving = false, masthead = false, onSkip, scene = 'street' }: LoadingScreenProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  useEffect(() => {
    if (!onSkip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
      e.preventDefault();
      onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <div
      className={`${styles.screen} ${leaving ? styles.leaving : ''} ${onSkip ? styles.skippable : ''}`}
      data-testid="loading-screen"
      onClick={onSkip}
    >
      <ComicBackdrop scene={hasBackdrop(scene) ? scene : 'street'} dim="page" fallback={<RainBackdrop lamp="right" intensity="soft" />} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <LogoEye progress={progress} />
        </div>
        {masthead ? (
          <h1 className={styles.masthead}>
            <span className={styles.mastSmall}>Project</span>
            <span className={styles.mastBig}>Red String</span>
          </h1>
        ) : (
          <div className={styles.heading}>
            {kicker && <p className={styles.kicker}>{kicker}</p>}
            <h1 className={styles.title}>{title}</h1>
          </div>
        )}
        <div
          className={styles.bar}
          role="progressbar"
          aria-label={masthead ? title : t('loading.opening', { title })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span className={styles.pin} />
          <span className={styles.thread} style={{ transform: `scaleX(${pct / 100})` }} />
          <span className={`${styles.pin} ${styles.pinEnd} ${pct >= 100 ? styles.pinLit : ''}`} />
        </div>
        <p className={styles.status} aria-live="polite">
          {status}
        </p>
        {onSkip && (
          <button type="button" className={styles.skip} data-testid="skip-loading" onClick={onSkip}>
            {t('loading.skip')}
          </button>
        )}
      </div>
    </div>
  );
}
