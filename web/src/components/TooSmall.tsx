// The game is laid out for one screen. Below this size it no longer fits, so instead of squeezing or
// scrolling the page, a notice covers the window until it is made bigger again.
import { useSyncExternalStore } from 'react';
import styles from './TooSmall.module.css';
import { useT } from '../i18n/index.ts';

/** The smallest game area (under the desktop title bar) every screen is designed to fit. */
export const MIN_WIDTH = 960;
export const MIN_HEIGHT = 560;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function gameArea(): string {
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--titlebar-h')) || 0;
  return `${window.innerWidth}x${Math.max(0, window.innerHeight - bar)}`;
}

export function TooSmall() {
  const area = useSyncExternalStore(subscribe, gameArea, () => `${MIN_WIDTH}x${MIN_HEIGHT}`);
  const [width = 0, height = 0] = area.split('x').map(Number);
  const { t } = useT();
  if (width >= MIN_WIDTH && height >= MIN_HEIGHT) return null;
  return (
    <div className={styles.cover} role="alertdialog" aria-modal="true" aria-labelledby="too-small-title" data-testid="too-small">
      <div className={styles.card}>
        <p className={styles.kicker}>{t('tooSmall.kicker')}</p>
        <h1 id="too-small-title" className={styles.title}>
          {t('tooSmall.title')}
        </h1>
        <p className={styles.text}>{t('tooSmall.text')}</p>
        <p className={styles.sizes}>
          {t('tooSmall.sizes', { width, height, minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT })}
        </p>
      </div>
    </div>
  );
}
