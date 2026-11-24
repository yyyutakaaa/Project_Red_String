// The game needs no Node access. This bridge tells the page it runs in the desktop app and carries
// the few things the window needs from the game (and back).
const { contextBridge, ipcRenderer } = require('electron');

const shell = ipcRenderer.sendSync('red-string:shell') || {};

contextBridge.exposeInMainWorld('redStringDesktop', {
  platform: process.platform,
  /** Fingerprint and version of this app shell (see shellFingerprint in main.cjs). */
  shell: { fingerprint: String(shell.fingerprint || ''), version: String(shell.version || '') },
  /** The game may draw its own title bar: this shell hides the system one. */
  titleBar: process.platform === 'darwin' || process.platform === 'win32',
  setTheme: (theme) => ipcRenderer.send('red-string:theme', theme === 'light' ? 'light' : 'dark'),
  /** Discord status: { details, state?, startedAt?, smallText? }, or null to clear it. */
  setPresence: (status) => ipcRenderer.send('red-string:presence', status ?? null),
  onFullscreen: (callback) => {
    const listener = (_event, on) => callback(Boolean(on));
    ipcRenderer.on('red-string:fullscreen', listener);
    return () => ipcRenderer.removeListener('red-string:fullscreen', listener);
  },
  onNavigate: (callback) => {
    const listener = (_event, route) => {
      if (typeof route === 'string' && route.startsWith('/')) callback(route);
    };
    ipcRenderer.on('red-string:navigate', listener);
    return () => ipcRenderer.removeListener('red-string:navigate', listener);
  },
});
