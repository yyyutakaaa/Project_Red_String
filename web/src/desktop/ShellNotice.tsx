import { useState } from 'react';
import { Button } from '../components/Button.tsx';
import { shellOutdated } from './bridge.ts';
import styles from './ShellNotice.module.css';

const RELEASES_URL = 'https://github.com/yyyutakaaa/Project_Red_String/releases/latest';
const DISMISS_KEY = 'redstring.shellNotice.dismissed';

function dismissedForThisBuild(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === __SHELL_FINGERPRINT__;
  } catch {
    return false;
  }
}

/**
 * Desktop app only: the in-app update brought game files for a newer app than the one installed.
 * Things that live in the app itself (window, Discord status) need the new installer.
 */
export function ShellNotice() {
  const [show, setShow] = useState(() => shellOutdated() && !dismissedForThisBuild());
  if (!show) return null;

  const later = () => {
    try {
      localStorage.setItem(DISMISS_KEY, __SHELL_FINGERPRINT__);
    } catch {
      /* without storage it simply shows again next time */
    }
    setShow(false);
  };

  return (
    <aside className={styles.notice} aria-labelledby="shell-notice-title" data-testid="shell-notice">
      <div className={styles.text}>
        <p id="shell-notice-title" className={styles.title}>
          A new version of the Red String app is ready.
        </p>
        <p className={styles.sub}>
          Some things live in the app itself, like the window and your Discord status. Install the new version over this one.
          Your saves stay.
        </p>
      </div>
      <div className={styles.actions}>
        {/* The desktop app opens outside links in the system browser. */}
        <Button variant="lamp" size="small" onClick={() => window.open(RELEASES_URL, '_blank', 'noopener')}>
          Download
        </Button>
        <Button variant="ghost" size="small" onClick={later}>
          Later
        </Button>
      </div>
    </aside>
  );
}
