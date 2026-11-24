import { useGame } from '../store/game.ts';
import styles from './ToastHost.module.css';
import { useT } from '../i18n/index.ts';

const LABEL = { evidence: 'toastLabel.evidence', clue: 'toastLabel.clue', info: 'toastLabel.info', error: 'toastLabel.error', save: 'toastLabel.save' } as const;

export function ToastHost() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  const { t: tr } = useT();
  return (
    <div className={styles.host} role="status" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.kind] ?? ''}`} data-testid={`toast-${t.kind}`}>
          <span className={styles.text}>
            <span className={styles.label}>{tr(LABEL[t.kind])}</span>
            {t.text}
          </span>
          <button className={styles.close} onClick={() => dismiss(t.id)} aria-label={tr('toast.dismiss')}>
            x
          </button>
        </div>
      ))}
    </div>
  );
}
