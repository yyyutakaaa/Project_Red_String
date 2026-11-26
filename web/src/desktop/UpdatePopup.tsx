// Desktop app only: what the in-app updater has to say, in the game's own popup. The shell sends
// messages (see updater.cjs); this answers "update now" or "later". Shells without this bridge keep
// their system dialogs, and the popup never shows in a browser.
//
// Shells up to v1.0.x forget that the popup is up on every in-game navigation (Electron reports a
// history.pushState as "started loading"), and then fall back to the system dialog. So the popup says
// "I am here" again after each navigation, and every few seconds besides.
import { useEffect, useState } from 'react';
import { Button } from '../components/Button.tsx';
import { desktop, type UpdateMessage } from './bridge.ts';
import { Telegram } from './Telegram.tsx';
import styles from './Telegram.module.css';
import { useT } from '../i18n/index.ts';

const REANNOUNCE_MS = 4_000;
const AFTER_NAVIGATION_MS = 250;

interface UpdatePopupProps {
  /** Calls back on every in-game navigation; returns the unsubscribe. */
  subscribeNavigation?: (callback: () => void) => () => void;
}

export function UpdatePopup({ subscribeNavigation }: UpdatePopupProps = {}) {
  const { t } = useT();
  const [message, setMessage] = useState<UpdateMessage | null>(null);

  useEffect(() => {
    const bridge = desktop();
    if (!bridge?.onUpdate) return;
    const onUpdate = bridge.onUpdate;
    // Subscribing is what tells the shell the popup is up: take the new listener before dropping
    // the old one, so no message falls in between.
    let stop = onUpdate((m) => setMessage(m));
    const announce = () => {
      const previous = stop;
      stop = onUpdate((m) => setMessage(m));
      previous();
    };
    const timer = window.setInterval(announce, REANNOUNCE_MS);
    let soon: number | undefined;
    const stopNav = subscribeNavigation?.(() => {
      window.clearTimeout(soon);
      soon = window.setTimeout(announce, AFTER_NAVIGATION_MS);
    });
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(soon);
      stopNav?.();
      stop();
    };
  }, [subscribeNavigation]);

  if (!message) return null;
  const close = () => setMessage(null);
  const answer = (choice: 'now' | 'later') => {
    desktop()?.answerUpdate?.(choice);
    setMessage(choice === 'now' ? { state: 'downloading', progress: 0 } : null);
  };

  switch (message.state) {
    case 'available':
      return (
        <Telegram
          title={t('update.availableTitle')}
          onClose={() => answer('later')}
          testId="update-popup"
          actions={
            <>
              <Button onClick={() => answer('later')} data-testid="update-later">
                {t('update.later')}
              </Button>
              <Button variant="primary" onClick={() => answer('now')} data-testid="update-now">
                {t('update.now')}
              </Button>
            </>
          }
        >
          <p>{t('update.availableText')}</p>
        </Telegram>
      );
    case 'downloading':
      return (
        <Telegram title={t('update.downloadingTitle')} progress={message.progress ?? 0} testId="update-popup">
          <p>{t('update.downloadingText')}</p>
        </Telegram>
      );
    case 'installing':
      return (
        <Telegram title={t('update.installingTitle')} progress={1} testId="update-popup">
          <p>{t('update.installingText')}</p>
        </Telegram>
      );
    case 'failed':
      return (
        <Telegram
          title={t('update.failedTitle')}
          onClose={close}
          testId="update-popup"
          actions={
            <Button variant="primary" onClick={close}>
              {t('update.keepPlaying')}
            </Button>
          }
        >
          <p>{t('update.failedText')}</p>
          {message.detail && <p className={styles.detail}>{message.detail}</p>}
        </Telegram>
      );
    case 'current':
    case 'offline':
      return (
        <Telegram
          title={t(message.state === 'current' ? 'update.currentTitle' : 'update.offlineTitle')}
          onClose={close}
          testId="update-popup"
          actions={
            <Button variant="primary" onClick={close}>
              {t('common.close')}
            </Button>
          }
        >
          <p>{t(message.state === 'current' ? 'update.currentText' : 'update.offlineText')}</p>
        </Telegram>
      );
    default:
      return null;
  }
}
