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
  /** Settings → Display: full screen, or the window at its fixed size. */
  setFullscreen: (on) => ipcRenderer.send('red-string:fullscreen', Boolean(on)),
  onFullscreen: (callback) => {
    const listener = (_event, on) => callback(Boolean(on));
    ipcRenderer.on('red-string:fullscreen', listener);
    return () => ipcRenderer.removeListener('red-string:fullscreen', listener);
  },
  /** The game's update popup: messages from the updater, the player's answer, and "the popup is up". */
  onUpdate: (callback) => {
    const listener = (_event, message) => {
      if (message && typeof message === 'object') callback(message);
    };
    ipcRenderer.on('red-string:update', listener);
    ipcRenderer.send('red-string:update-ready');
    return () => ipcRenderer.removeListener('red-string:update', listener);
  },
  answerUpdate: (choice) => ipcRenderer.send('red-string:update-answer', choice === 'now' ? 'now' : 'later'),
  onNavigate: (callback) => {
    const listener = (_event, route) => {
      if (typeof route === 'string' && route.startsWith('/')) callback(route);
    };
    ipcRenderer.on('red-string:navigate', listener);
    return () => ipcRenderer.removeListener('red-string:navigate', listener);
  },
});
