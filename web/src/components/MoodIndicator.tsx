import type { Mood } from '@shared/caseSchema.ts';
import { moodLabel } from '../store/game.ts';
import styles from './Interrogation.parts.module.css';

const MOOD_NOTE: Record<Mood, string> = {
  calm: 'Composed. Giving nothing away.',
  nervous: 'Sweating. You are close to something.',
  angry: 'Hostile. Push too hard and the door shuts.',
  broken: 'Cracked. The truth is leaking out.',
};

interface MoodIndicatorProps {
  mood: Mood;
  className?: string;
}

/** The suspect's current temper: a colour, a word and a line. Announced politely when it changes. */
export function MoodIndicator({ mood, className }: MoodIndicatorProps) {
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
        <span className={styles.moodLabel}>Mood</span>
        <strong className={styles.moodValue}>{moodLabel(mood)}</strong>
      </span>
      <span className={styles.moodNote}>{MOOD_NOTE[mood]}</span>
    </div>
  );
}
