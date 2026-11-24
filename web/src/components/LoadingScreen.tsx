// Full-screen loading card used at start-up and when a case or save opens: the logo winds itself
// in as `progress` climbs, with a red thread underneath as the progress bar.
import { LogoEye } from './LogoEye.tsx';
import { RainBackdrop } from './RainBackdrop.tsx';
import styles from './LoadingScreen.module.css';

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
}

export function LoadingScreen({ progress, kicker, title, status, leaving = false, masthead = false }: LoadingScreenProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ''}`} data-testid="loading-screen">
      <RainBackdrop lamp="right" intensity="soft" />
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
          aria-label={masthead ? title : `Opening ${title}`}
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
      </div>
    </div>
  );
}
