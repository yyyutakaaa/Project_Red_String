import { desktop } from './bridge.ts';
import styles from './TitleBar.module.css';

/**
 * The desktop app's title bar. The system one is hidden; this strip is the drag handle. On macOS the
 * traffic lights sit at its left end, on Windows the system draws its buttons over the right end.
 */
export function TitleBar() {
  const bridge = desktop();
  if (!bridge?.titleBar) return null;
  return (
    <div className={styles.bar} aria-hidden="true">
      <span className={styles.title}>
        <span className={styles.pin} />
        Red String
      </span>
    </div>
  );
}
