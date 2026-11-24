import { useEffect, useState } from 'react';
import { Button } from '../components/Button.tsx';
import { desktop, shellOutdated, type ShellInstallMessage } from './bridge.ts';
import { Telegram } from './Telegram.tsx';
import styles from './Telegram.module.css';
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

/** The desktop app opens outside links in the system browser. */
const openReleases = () => window.open(RELEASES_URL, '_blank', 'noopener');

/**
 * Desktop app only: the in-app update brought game files for a newer app than the one installed.
 * Things that live in the app itself (window, Discord status) need the new app. Shells that can
 * install it themselves do so here, with the download in the popup; older ones open the download page.
 */
export function ShellNotice() {
  const [show, setShow] = useState(() => shellOutdated() && !dismissedForThisBuild());
  const [status, setStatus] = useState<ShellInstallMessage | null>(null);
  const canInstall = Boolean(desktop()?.installShell);

  useEffect(() => {
    if (!show) return;
    return desktop()?.onShellInstall?.((m) => setStatus(m));
  }, [show]);

  if (!show) return null;

  const later = () => {
    try {
      localStorage.setItem(DISMISS_KEY, __SHELL_FINGERPRINT__);
    } catch {
      /* without storage it simply shows again next time */
    }
    setShow(false);
  };
  const install = () => {
    setStatus({ state: 'downloading', progress: 0 });
    desktop()?.installShell?.(__SHELL_FINGERPRINT__);
  };

  if (status?.state === 'downloading' || status?.state === 'installing') {
    const installing = status.state === 'installing';
    return (
      <Telegram
        title={t(installing ? 'shell.installingTitle' : 'shell.downloadingTitle')}
        progress={installing ? 1 : (status.progress ?? 0)}
        testId="shell-notice"
      >
        <p>{t(installing ? 'shell.installingText' : 'shell.downloadingText')}</p>
      </Telegram>
    );
  }

  if (status) {
    // failed, notReady or manual: say why, and offer what still works.
    const key = status.state === 'notReady' ? 'notReady' : status.state === 'manual' ? 'manual' : 'failed';
    return (
      <Telegram
        title={t(`shell.${key}Title`)}
        onClose={later}
        testId="shell-notice"
        actions={
          <>
            <Button onClick={later}>{t('shell.later')}</Button>
            {key === 'manual' ? (
              <Button variant="primary" onClick={openReleases}>
                {t('shell.openPage')}
              </Button>
            ) : (
              <Button variant="primary" onClick={install} data-testid="shell-install">
                {t('shell.tryAgain')}
              </Button>
            )}
          </>
        }
      >
        <p>{t(`shell.${key}Text`)}</p>
        {status.detail && key !== 'notReady' && <p className={styles.detail}>{status.detail}</p>}
      </Telegram>
    );
  }

  return (
    <Telegram
      title={t('shell.title')}
      onClose={later}
      testId="shell-notice"
      actions={
        <>
          <Button onClick={later}>{t('shell.later')}</Button>
          {canInstall ? (
            <Button variant="primary" onClick={install} data-testid="shell-install">
              {t('shell.install')}
            </Button>
          ) : (
            <Button variant="primary" onClick={openReleases}>
              {t('shell.download')}
            </Button>
          )}
        </>
      }
    >
      <p>{t(canInstall ? 'shell.installText' : 'shell.text')}</p>
    </Telegram>
  );
}
