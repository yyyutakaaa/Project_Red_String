import { useState } from 'react';
import { Button } from '../components/Button.tsx';
import { shellOutdated } from './bridge.ts';
import { Telegram } from './Telegram.tsx';
import { t } from '../i18n/index.ts';

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
    <Telegram
      title={t('shell.title')}
      onClose={later}
      testId="shell-notice"
      actions={
        <>
          <Button onClick={later}>
            {t('shell.later')}
          </Button>
          {/* The desktop app opens outside links in the system browser. */}
          <Button variant="primary" onClick={() => window.open(RELEASES_URL, '_blank', 'noopener')}>
            {t('shell.download')}
          </Button>
        </>
      }
    >
      <p>{t('shell.text')}</p>
    </Telegram>
  );
}
