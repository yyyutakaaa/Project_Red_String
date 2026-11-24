import styles from './Interrogation.parts.module.css';
import { useT } from '../i18n/index.ts';

interface PatienceMeterProps {
  used: number;
  max: number;
  className?: string;
}

/** How many questions the suspect will still take, as text plus a row of matchstick pips. */
export function PatienceMeter({ used, max, className }: PatienceMeterProps) {
  const total = Math.max(0, Math.floor(max));
  const left = Math.max(0, Math.min(total, total - Math.floor(used)));
  const level = left === 0 ? 'none' : left <= 2 ? 'low' : 'ok';
  const { t } = useT();
  return (
    <div className={`${styles.patience} ${className ?? ''}`} data-testid="patience-meter" data-level={level}>
      <p className={styles.patienceText} aria-live="polite" aria-atomic="true">
        {t('interro.questionsLeft', { left, total })}
      </p>
      <ul className={styles.pips} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={`${styles.pip} ${i < left ? styles.pipLit : ''}`} />
        ))}
      </ul>
    </div>
  );
}
