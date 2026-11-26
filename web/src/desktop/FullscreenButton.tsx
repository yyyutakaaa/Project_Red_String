// A small comic tile in the bottom-right corner, on every screen: full screen on and off. In the
// desktop app it asks the shell (F11, or Ctrl+Cmd+F on macOS, does the same); in a browser it uses
// the page's own full screen. Hidden where neither is available.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { desktop, useDesktopFullscreen } from './bridge.ts';
import { useT } from '../i18n/index.ts';
import styles from './FullscreenButton.module.css';

function subscribeBrowser(onChange: () => void): () => void {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
}
const browserFullscreen = () => Boolean(document.fullscreenElement);

export function FullscreenButton() {
  const { t } = useT();
  const bridge = desktop();
  const inShell = Boolean(bridge?.setFullscreen);
  const [available] = useState(() => inShell || (!bridge && Boolean(document.fullscreenEnabled)));
  const shellOn = useDesktopFullscreen((s) => s.on);
  const pageOn = useSyncExternalStore(subscribeBrowser, browserFullscreen, () => false);
  const on = inShell ? shellOn : pageOn;

  // The toasts and the tutorial chip make room for the tile.
  useEffect(() => {
    if (!available) return;
    const root = document.documentElement;
    root.dataset.fullscreenButton = '';
    return () => {
      delete root.dataset.fullscreenButton;
    };
  }, [available]);

  if (!available) return null;

  const toggle = () => {
    if (inShell) {
      bridge?.setFullscreen?.(!on);
    } else if (on) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  };
  const key = bridge?.platform === 'darwin' ? '⌃⌘F' : 'F11';
  const label = t(on ? 'fullscreen.off' : 'fullscreen.on', { key });

  return (
    <button
      type="button"
      className={styles.tile}
      onClick={toggle}
      aria-label={label}
      aria-pressed={on}
      title={label}
      data-testid="fullscreen-toggle"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        {on ? (
          <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
        ) : (
          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
        )}
      </svg>
    </button>
  );
}
