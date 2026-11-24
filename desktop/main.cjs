// Electron shell for Project Red String.
//
// The game is served from a tiny HTTP server on 127.0.0.1 instead of file://. That gives the page a
// real origin (http://127.0.0.1:<port>), which the edge functions already accept for CORS, keeps
// client-side routing working, and keeps localStorage saves stable between launches because the
// port stays the same.
const { app, BrowserWindow, Menu, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, 'renderer');
const PREFERRED_PORT = 47615;
const PORT_ATTEMPTS = 10;

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
  const target = path.normalize(path.join(ROOT, decoded));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  try {
    if (fs.statSync(target).isFile()) return target;
  } catch {
    // Not a file on disk; fall through to the SPA fallback below.
  }
  // Client-side routes (no file extension) get index.html; missing assets get a 404.
  return path.extname(decoded) ? null : path.join(ROOT, 'index.html');
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

function createWindow(origin) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0b0b0d',
    title: 'Red String',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Links that leave the game open in the system browser instead of inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
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

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

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

    buildMenu();
    createWindow(origin);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(origin);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
