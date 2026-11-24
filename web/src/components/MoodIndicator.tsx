import type { Mood } from '@shared/caseSchema.ts';
import styles from './Interrogation.parts.module.css';
import { useT, type MessageKey } from '../i18n/index.ts';

const MOOD_NOTE: Record<Mood, MessageKey> = {
  calm: 'interro.moodCalm',
  nervous: 'interro.moodNervous',
  angry: 'interro.moodAngry',
  broken: 'interro.moodBroken',
};

interface MoodIndicatorProps {
  mood: Mood;
  className?: string;
}

/** The suspect's current temper: a colour, a word and a line. Announced politely when it changes. */
export function MoodIndicator({ mood, className }: MoodIndicatorProps) {
  const { t } = useT();
  return (
    <div
      className={`${styles.mood} ${className ?? ''}`}
      data-testid="mood-indicator"
      data-mood={mood}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.moodDot} aria-hidden="true" />
      <span className={styles.moodLine}>
        <span className={styles.moodLabel}>{t('interro.mood')}</span>
        <strong className={styles.moodValue}>{t(`mood.${mood}`)}</strong>
      </span>
      <span className={styles.moodNote}>{t(MOOD_NOTE[mood])}</span>
    </div>
  );
}
