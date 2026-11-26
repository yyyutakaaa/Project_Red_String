// Electron shell for Project Red String.
//
// The game is served from a tiny HTTP server on 127.0.0.1 instead of file://. That gives the page a
// real origin (http://127.0.0.1:<port>), which the edge functions already accept for CORS, keeps
// client-side routing working, and keeps localStorage saves stable between launches because the
// port stays the same.
const { app, BrowserWindow, Menu, ipcMain, nativeTheme, screen, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pickGameRoot, startUpdates } = require('./updater.cjs');
const { createPresence } = require('./discord.cjs');
const { shellFingerprint } = require('./fingerprint.cjs');
const { createInstaller } = require('./installer.cjs');

// Fingerprint of this shell's own files; the game compares it with the shell it was built for.
const SHELL_FINGERPRINT = shellFingerprint();

app.setName('Red String');
// Development only: run a second copy next to an installed one, with its own data folder.
if (!app.isPackaged && process.env.RED_STRING_USER_DATA) app.setPath('userData', process.env.RED_STRING_USER_DATA);

const BUNDLED_ROOT = path.join(__dirname, 'renderer');
const ICON = path.join(__dirname, 'build', 'icon.png');
const PREFERRED_PORT = 47615;
const PORT_ATTEMPTS = 10;

// The build being served: the one shipped with the app, or a newer downloaded update.
let game = { root: BUNDLED_ROOT, manifest: null };

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const root = game.root;
  const target = path.normalize(path.join(root, decoded));
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  try {
    if (fs.statSync(target).isFile()) return target;
  } catch {
    // Not a file on disk; fall through to the SPA fallback below.
  }
  // Client-side routes (no file extension) get index.html; missing assets get a 404.
  return path.extname(decoded) ? null : path.join(root, 'index.html');
}

function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  const file = resolveFile(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

function listen(port, attemptsLeft) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handle);
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' && attemptsLeft > 1) {
        resolve(listen(port + 1, attemptsLeft - 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, '127.0.0.1', () => resolve({ server, port }));
  });
}

let mainWindow = null;

// ---------------------------------------------------------------------------
// Window chrome. The game draws its own title bar (TitleBar.tsx): on macOS the traffic lights sit
// inside it, on Windows the system paints the minimise/maximise/close buttons over its right end in
// the game's colours. TITLEBAR_HEIGHT must match --titlebar-h in the game's tokens.css.
const TITLEBAR_HEIGHT = 32;
const CHROME = {
  dark: { background: '#0b0f17', bar: '#0b0f17', symbol: '#ebe5d8' },
  light: { background: '#ebe4d6', bar: '#e9e2d4', symbol: '#2a2620' },
};

// ---------------------------------------------------------------------------
// The window has one fixed size, the size the game is laid out for: 1440 x 900, or the largest
// 16:10 size that fits a smaller screen. The player picks a window or full screen (Settings, or
// F11 / Ctrl+Cmd+F). The window remembers its position, the choice and the last theme (so the first
// frame already has the right background).
const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
const GAME_SIZE = { width: 1440, height: 900 };
const DEFAULT_STATE = { fullscreen: false, theme: 'dark' };

/** The fixed window size for the screen the window is on: the game size, smaller only if it must be. */
function windowSize(area) {
  const scale = Math.min(1, (area.width - 40) / GAME_SIZE.width, (area.height - 40) / GAME_SIZE.height);
  return { width: Math.round(GAME_SIZE.width * scale), height: Math.round(GAME_SIZE.height * scale) };
}

function readWindowState() {
  try {
    const s = { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8')) };
    if (s.theme !== 'light') s.theme = 'dark';
    // Forget the position if that screen is gone (an unplugged monitor).
    if (typeof s.x === 'number' && typeof s.y === 'number') {
      const area = screen.getDisplayMatching({ x: s.x, y: s.y, width: GAME_SIZE.width, height: GAME_SIZE.height }).workArea;
      const { width, height } = windowSize(area);
      const visible = s.x >= area.x - 10 && s.x + width <= area.x + area.width + 10 && s.y >= area.y - 10 && s.y + height <= area.y + area.height + 10;
      if (!visible) {
        delete s.x;
        delete s.y;
      }
    }
    return s;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

let windowState = DEFAULT_STATE;

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const fullscreen = mainWindow.isFullScreen();
  // Keep the window's position while full screen, so leaving it puts the window back where it was.
  const bounds = fullscreen ? windowState : mainWindow.getBounds();
  windowState = { ...windowState, x: bounds.x, y: bounds.y, fullscreen };
  try {
    fs.writeFileSync(STATE_FILE(), JSON.stringify(windowState));
  } catch {
    // Not fatal: the window just opens at the default size next time.
  }
}

// Full screen. macOS handles it on its own. On Windows a window that cannot be resized does not grow
// when it goes full screen: it jumps to the corner at its fixed size and the desktop shows around it.
// So the window may be resized for as long as it is full screen, and if it still does not cover the
// screen it is stretched over it by hand. Leaving full screen puts back the fixed size.
function setFullscreen(on) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const want = Boolean(on);
  if (want === mainWindow.isFullScreen()) return;
  if (process.platform !== 'darwin' && want) {
    mainWindow.setResizable(true);
    mainWindow.setMaximizable(true);
  }
  mainWindow.setFullScreen(want);
}

function coverScreen() {
  if (!mainWindow || mainWindow.isDestroyed() || process.platform === 'darwin' || !mainWindow.isFullScreen()) return;
  const { bounds } = screen.getDisplayMatching(mainWindow.getBounds());
  const now = mainWindow.getBounds();
  if (now.x !== bounds.x || now.y !== bounds.y || now.width !== bounds.width || now.height !== bounds.height) {
    mainWindow.setBounds(bounds);
  }
}

function restoreWindowSize() {
  if (!mainWindow || mainWindow.isDestroyed() || process.platform === 'darwin' || mainWindow.isFullScreen()) return;
  const area = screen.getDisplayMatching(mainWindow.getBounds()).workArea;
  const size = windowSize(area);
  mainWindow.setResizable(true);
  mainWindow.setContentSize(size.width, size.height);
  if (typeof windowState.x === 'number' && typeof windowState.y === 'number') {
    mainWindow.setPosition(windowState.x, windowState.y);
  }
  mainWindow.setResizable(false);
  mainWindow.setMaximizable(false);
}

function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  windowState = { ...windowState, theme: t };
  nativeTheme.themeSource = t; // dialogs, menus and the context menu follow the game
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBackgroundColor(CHROME[t].background);
  if (process.platform === 'win32') {
    mainWindow.setTitleBarOverlay({ color: CHROME[t].bar, symbolColor: CHROME[t].symbol, height: TITLEBAR_HEIGHT });
  }
}

function chromeOptions(theme) {
  if (process.platform === 'darwin') {
    return { titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 10 } };
  }
  if (process.platform === 'win32') {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: CHROME[theme].bar, symbolColor: CHROME[theme].symbol, height: TITLEBAR_HEIGHT },
    };
  }
  return {};
}

// Native right-click menu: editing commands in text fields, Copy on a selection, nothing else.
function contextMenu(params) {
  if (params.isEditable) {
    return Menu.buildFromTemplate([
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' },
    ]);
  }
  if (params.selectionText.trim()) return Menu.buildFromTemplate([{ role: 'copy' }]);
  return null;
}

function createWindow(origin) {
  windowState = readWindowState();
  const theme = windowState.theme;
  nativeTheme.themeSource = theme;
  const area = typeof windowState.x === 'number' && typeof windowState.y === 'number'
    ? screen.getDisplayMatching({ x: windowState.x, y: windowState.y, width: GAME_SIZE.width, height: GAME_SIZE.height }).workArea
    : screen.getPrimaryDisplay().workArea;
  const size = windowSize(area);
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: size.width,
    height: size.height,
    useContentSize: true,
    // One fixed size: the game is laid out for it. Full screen is the other choice.
    resizable: false,
    maximizable: false,
    fullscreenable: true,
    backgroundColor: CHROME[theme].background,
    title: 'Red String',
    icon: ICON,
    show: false,
    ...chromeOptions(theme),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  if (windowState.fullscreen) setFullscreen(true);

  mainWindow.once('ready-to-show', () => mainWindow.show());
  // A reload takes the popup with it: the page has to say it is ready again, and an open question is "later".
  // Only a new document counts: the game's own screen changes (history.pushState) also fire
  // did-start-loading, and must not send the next update to a system dialog.
  mainWindow.webContents.on('did-start-navigation', (details, legacyUrl, legacyInPlace, legacyMainFrame) => {
    const sameDocument = typeof details?.isSameDocument === 'boolean' ? details.isSameDocument : Boolean(legacyInPlace);
    const mainFrame = typeof details?.isMainFrame === 'boolean' ? details.isMainFrame : Boolean(legacyMainFrame);
    if (sameDocument || !mainFrame) return;
    popupReady = false;
    answerUpdate(false);
  });
  for (const event of ['move', 'enter-full-screen', 'leave-full-screen']) {
    let t = null;
    mainWindow.on(event, () => {
      clearTimeout(t);
      t = setTimeout(saveWindowState, 400);
    });
  }
  mainWindow.on('close', saveWindowState);

  const sendFullscreen = (on) => mainWindow.webContents.send('red-string:fullscreen', on);
  mainWindow.on('enter-full-screen', () => {
    sendFullscreen(true);
    // Windows may report full screen before the window has its new size.
    coverScreen();
    setTimeout(coverScreen, 150);
  });
  mainWindow.on('leave-full-screen', () => {
    sendFullscreen(false);
    restoreWindowSize();
    setTimeout(restoreWindowSize, 150);
  });
  mainWindow.webContents.on('did-finish-load', () => sendFullscreen(mainWindow.isFullScreen()));

  const contents = mainWindow.webContents;
  // A game, not a web page: no pinch or keyboard zoom.
  contents.setVisualZoomLevelLimits(1, 1);
  contents.on('before-input-event', (event, input) => {
    const mod = process.platform === 'darwin' ? input.meta : input.control;
    if (input.type === 'keyDown' && mod && ['=', '+', '-', '_', '0'].includes(input.key)) event.preventDefault();
    // F11 switches full screen on Windows and Linux (the menu's Ctrl+Cmd+F does it on macOS).
    if (input.type === 'keyDown' && input.key === 'F11' && process.platform !== 'darwin') {
      event.preventDefault();
      if (!input.isAutoRepeat) setFullscreen(!mainWindow.isFullScreen());
    }
  });
  contents.on('context-menu', (_event, params) => contextMenu(params)?.popup({ window: mainWindow }));

  // Links that leave the game open in the system browser instead of inside the app.
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith(origin)) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.loadURL(`${origin}/`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/** Ask the game to open one of its own screens (Settings, Account). */
function openScreen(route) {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  mainWindow.webContents.send('red-string:navigate', route);
}

function buildMenu(checkForUpdates) {
  const isMac = process.platform === 'darwin';
  const updateItem = { label: 'Check for Updates…', click: () => checkForUpdates(true) };
  const settingsItem = { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: () => openScreen('/settings') };
  const accountItem = { label: 'Account…', click: () => openScreen('/account') };
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              updateItem,
              { type: 'separator' },
              settingsItem,
              accountItem,
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : [{ label: 'Game', submenu: [settingsItem, accountItem, updateItem, { type: 'separator' }, { role: 'quit' }] }]),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          click: () => setFullscreen(!mainWindow?.isFullScreen()),
        },
        ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('red-string:theme', (_event, theme) => applyTheme(theme));

// ---------------------------------------------------------------------------
// The game's own update popup. A game build that has it says so once its page is up; the updater
// waits for it, and only a manual check with a page that never answers falls back to a system dialog.
let popupReady = false;
let pendingAnswer = null;
function answerUpdate(accepted) {
  const resolve = pendingAnswer;
  pendingAnswer = null;
  resolve?.(accepted);
}
ipcMain.on('red-string:update-ready', (event) => {
  if (mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents) popupReady = true;
});
ipcMain.on('red-string:update-answer', (_event, choice) => answerUpdate(choice === 'now'));
function updatePopup() {
  if (!popupReady || !mainWindow || mainWindow.isDestroyed()) return null;
  const send = (message) => mainWindow.webContents.send('red-string:update', message);
  return {
    send,
    ask: () =>
      new Promise((resolve) => {
        answerUpdate(false);
        pendingAnswer = resolve;
        if (mainWindow.isMinimized()) mainWindow.restore();
        send({ state: 'available' });
      }),
  };
}
// Settings → Display: a window of the fixed size, or full screen.
ipcMain.on('red-string:fullscreen', (_event, on) => {
  setFullscreen(on);
});
// A new app, installed from the game: download with progress in the game's popup, then restart.
const installShell = createInstaller();
ipcMain.on('red-string:install-shell', (event, fingerprint) => {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) return;
  const wanted = typeof fingerprint === 'string' && /^[0-9a-f]{16}$/.test(fingerprint) ? fingerprint : '';
  installShell(wanted, (message) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('red-string:shell-install', message);
  });
});
ipcMain.on('red-string:shell', (event) => {
  event.returnValue = { fingerprint: SHELL_FINGERPRINT, version: app.getVersion() };
});

// ---------------------------------------------------------------------------
// Discord Rich Presence. The application ID comes from the Discord Developer Portal (it is public,
// not a secret); its name is what friends see after "Playing". Empty switches presence off.
// RED_STRING_DISCORD_ID overrides it for testing.
const DISCORD_CLIENT_ID = process.env.RED_STRING_DISCORD_ID || '1574718724559085648';
const SITE_URL = 'https://project-red-string.vercel.app';
const presence = DISCORD_CLIENT_ID ? createPresence(DISCORD_CLIENT_ID) : null;
const appStartedAt = Date.now();

const line = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : undefined);

/** Build the Discord activity from what the game reports. Only text and a time come from the page. */
function toActivity(status) {
  if (!status || typeof status !== 'object') return null;
  const details = line(status.details);
  if (!details) return null;
  const startedAt = Number.isFinite(status.startedAt) && status.startedAt > 0 && status.startedAt <= Date.now() ? status.startedAt : appStartedAt;
  return {
    type: 0,
    details,
    state: line(status.state),
    timestamps: { start: Math.floor(startedAt) },
    assets: {
      large_image: `${SITE_URL}/discord-logo.png`,
      large_text: 'Project Red String',
      ...(line(status.smallText) ? { small_image: `${SITE_URL}/discord-pin.png`, small_text: line(status.smallText) } : {}),
    },
    buttons: [{ label: 'Play Red String', url: SITE_URL }],
  };
}

ipcMain.on('red-string:presence', (_event, status) => presence?.set(toActivity(status)));
app.on('will-quit', () => presence?.stop());

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const { server, port } = await listen(PREFERRED_PORT, PORT_ATTEMPTS);
    const origin = `http://127.0.0.1:${port}`;
    app.on('before-quit', () => server.close());

    game = pickGameRoot(BUNDLED_ROOT);
    if (process.platform === 'darwin' && !app.isPackaged) app.dock.setIcon(ICON);

    const checkForUpdates = startUpdates({
      getWindow: () => mainWindow,
      getCurrent: () => game.manifest,
      getPopup: updatePopup,
      applyBuild: (root, manifest) => {
        game = { root, manifest };
        if (mainWindow) mainWindow.webContents.reloadIgnoringCache();
      },
    });

    app.setAboutPanelOptions({
      applicationName: 'Red String',
      applicationVersion: app.getVersion(),
      version: game.manifest ? `game ${game.manifest.commit.slice(0, 7)}` : '',
      copyright: 'A noir detective game. You question suspects in your own words.',
      iconPath: ICON,
    });
    buildMenu(checkForUpdates);
    createWindow(origin);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(origin);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
