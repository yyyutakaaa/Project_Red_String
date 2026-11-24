import type { ReactNode } from 'react';
import styles from './ScreenFrame.module.css';

interface ScreenFrameProps {
  title: string;
  kicker?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Use nearly the whole window: for screens built around a big picture. */
  wide?: boolean;
  /**
   * The content fills the space under the title and scrolls its own parts (fill), instead of the
   * whole area under the title scrolling as one (the default).
   */
  fill?: boolean;
}

/** Standard page shell: kicker, title, optional actions and content. Renders the page's <main>. */
export function ScreenFrame({ title, kicker, actions, children, wide = false, fill = false }: ScreenFrameProps) {
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
        <div className={fill ? styles.fill : `${styles.body} scroll-area`} data-testid="screen-body">
          {children}
        </div>
      </main>
    </div>
  );
}
