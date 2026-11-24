import type { ReactNode } from 'react';
import styles from './ScreenFrame.module.css';

interface ScreenFrameProps {
  title: string;
  kicker?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Use nearly the whole window: for screens built around a big picture. */
  wide?: boolean;
}

/** Standard page shell: kicker, title, optional actions and content. Renders the page's <main>. */
export function ScreenFrame({ title, kicker, actions, children, wide = false }: ScreenFrameProps) {
  return (
    <div className={styles.frame}>
      <main id="main" className={`${styles.inner} ${wide ? styles.wide : ''}`} tabIndex={-1}>
        <header className={styles.header}>
          <div className={styles.titles}>
            {kicker && <p className={styles.kicker}>{kicker}</p>}
            <h1>{title}</h1>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}
