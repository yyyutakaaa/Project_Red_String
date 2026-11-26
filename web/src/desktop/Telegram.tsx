// The game's own popup for news about the game itself: an update ready, downloading, done or failed,
// or a new app to install. A panel from the strips, like every other dialog in the game: ink line,
// paper rim, hard shadow, the title in a yellow narration caption. Never a system dialog.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Telegram.module.css';

interface TelegramProps {
  title: string;
  children: ReactNode;
  /** Buttons; none while something is running. */
  actions?: ReactNode;
  /** 0..1 shows the red thread filling up; null hides it. */
  progress?: number | null;
  /** Escape or a click outside: only when there is something to close. */
  onClose?: () => void;
  testId?: string;
}

export function Telegram({ title, children, actions, progress = null, onClose, testId }: TelegramProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d || d.open) return;
    try {
      d.showModal();
    } catch {
      d.setAttribute('open', '');
    }
  }, []);

  const pct = progress === null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      data-testid={testId}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
    >
      <div className={styles.panel}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        {pct !== null && (
          <div className={styles.thread} role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span className={styles.pin} />
            <span className={styles.line} style={{ transform: `scaleX(${pct / 100})` }} />
            <span className={`${styles.pin} ${styles.pinEnd} ${pct >= 100 ? styles.pinLit : ''}`} />
          </div>
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </dialog>
  );
}
