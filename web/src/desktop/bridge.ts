// The desktop app (Electron) exposes window.redStringDesktop from its preload script. In a browser
// it is missing and everything here does nothing. Older desktop shells (before the custom title
// bar) only expose `platform`, so every extra is optional.
import type { Theme } from '../store/settings.ts';
import type { PresenceStatus } from './presence.ts';

export interface DesktopBridge {
  platform: string;
  titleBar?: boolean;
  setTheme?: (theme: Theme) => void;
  /** Discord Rich Presence (desktop shells from v1.0.5). */
  setPresence?: (status: PresenceStatus | null) => void;
  onFullscreen?: (callback: (on: boolean) => void) => () => void;
  onNavigate?: (callback: (route: string) => void) => () => void;
}

export function desktop(): DesktopBridge | null {
  return (window as unknown as { redStringDesktop?: DesktopBridge }).redStringDesktop ?? null;
}

/**
 * Mark <html> for desktop styling: data-desktop="darwin|win32" when the game draws the title bar,
 * data-fullscreen while the window is full screen (the title bar steps aside).
 */
export function initDesktopDocument(): void {
  const bridge = desktop();
  const root = document.documentElement;
  if (!bridge) return;
  root.dataset.app = 'desktop';
  if (bridge.titleBar) root.dataset.desktop = bridge.platform;
  bridge.onFullscreen?.((on) => {
    if (on) root.dataset.fullscreen = '';
    else delete root.dataset.fullscreen;
  });
  // Files dropped on the window would otherwise open as a page.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
}
