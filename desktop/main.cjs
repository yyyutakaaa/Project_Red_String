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
const crypto = require('node:crypto');

/**
 * Fingerprint of this shell's own files. The game is built with the fingerprint of the shell next to
 * it; when an in-app update brings game files for a newer shell, the two differ and the game asks
 * the player to install the new app. Must match shellFingerprint() in web/vite.config.ts.
 */
function shellFingerprint() {
  try {
    const { files } = JSON.parse(fs.readFileSync(path.join(__dirname, 'shell-files.json'), 'utf8'));
    const hash = crypto.createHash('sha256');
    for (const name of files) {
      hash.update(`${name}\n`);
      hash.update(fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r/g, ''));
      hash.update('\n');
    }
    return hash.digest('hex').slice(0, 16);
  } catch {
    return '';
  }
}
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
// Window memory: size, position, maximised/full screen, and the last theme (so the first frame
// already has the right background).
const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
const DEFAULT_STATE = { width: 1440, height: 900, maximized: false, fullscreen: false, theme: 'dark' };

function readWindowState() {
  try {
    const s = { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8')) };
    if (s.theme !== 'light') s.theme = 'dark';
    // Forget the position if that screen is gone (an unplugged monitor).
    if (typeof s.x === 'number' && typeof s.y === 'number') {
      const area = screen.getDisplayMatching({ x: s.x, y: s.y, width: s.width, height: s.height }).workArea;
      const visible = s.x < area.x + area.width - 100 && s.x + s.width > area.x + 100 && s.y >= area.y - 10 && s.y < area.y + area.height - 100;
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
  const maximized = mainWindow.isMaximized();
  const fullscreen = mainWindow.isFullScreen();
  // Keep the normal size while maximised or full screen, so un-maximising goes back to it.
  const bounds = maximized || fullscreen ? windowState : mainWindow.getBounds();
  windowState = { ...windowState, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, maximized, fullscreen };
  try {
    fs.writeFileSync(STATE_FILE(), JSON.stringify(windowState));
  } catch {
    // Not fatal: the window just opens at the default size next time.
  }
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
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 960,
    minHeight: 600,
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
  if (windowState.maximized) mainWindow.maximize();
  if (windowState.fullscreen) mainWindow.setFullScreen(true);

  mainWindow.once('ready-to-show', () => mainWindow.show());
  for (const event of ['resize', 'move']) {
    let t = null;
    mainWindow.on(event, () => {
      clearTimeout(t);
      t = setTimeout(saveWindowState, 400);
    });
  }
  mainWindow.on('close', saveWindowState);

  const sendFullscreen = (on) => mainWindow.webContents.send('red-string:fullscreen', on);
  mainWindow.on('enter-full-screen', () => sendFullscreen(true));
  mainWindow.on('leave-full-screen', () => sendFullscreen(false));
  mainWindow.webContents.on('did-finish-load', () => sendFullscreen(mainWindow.isFullScreen()));

  const contents = mainWindow.webContents;
  // A game, not a web page: no pinch or keyboard zoom.
  contents.setVisualZoomLevelLimits(1, 1);
  contents.on('before-input-event', (event, input) => {
    const mod = process.platform === 'darwin' ? input.meta : input.control;
    if (input.type === 'keyDown' && mod && ['=', '+', '-', '_', '0'].includes(input.key)) event.preventDefault();
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
        { role: 'togglefullscreen', accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11' },
        ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('red-string:theme', (_event, theme) => applyTheme(theme));
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
