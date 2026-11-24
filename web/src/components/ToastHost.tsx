import { useGame } from '../store/game.ts';
import styles from './ToastHost.module.css';

const LABEL = { evidence: 'Evidence', clue: 'Clue', info: 'Note', error: 'Problem', save: 'Saved' } as const;

export function ToastHost() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <div className={styles.host} role="status" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.kind] ?? ''}`} data-testid={`toast-${t.kind}`}>
          <span className={styles.text}>
            <span className={styles.label}>{LABEL[t.kind]}</span>
            {t.text}
          </span>
          <button className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
            x
          </button>
        </div>
      ))}
    </div>
  );
}
