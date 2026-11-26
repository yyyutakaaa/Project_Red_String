// In-app game updates.
//
// The app (the Electron shell) stays installed; only the game files change. Every deploy of the web
// game publishes version.json: the commit, the build time, and each file with its sha256. When the
// live build is newer than the one this app runs, the player gets a prompt in the game's own update
// popup. Only a manual check from the menu falls back to a system dialog, when the page never shows
// it. On "Update now" the app downloads those files from the live site into its own data folder,
// checks every hash, and only then switches to the new build and reloads. Nothing needs a GitHub
// token or a new installer.
//
// A new installer is only needed when this shell itself (main.cjs, preload.cjs, Electron) changes.
const { app, dialog, net } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// RED_STRING_UPDATE_URL lets a development run (npm start) test updates against another server.
const DEV_BASE_URL = app.isPackaged ? '' : (process.env.RED_STRING_UPDATE_URL || '').replace(/\/$/, '');
const BASE_URL = DEV_BASE_URL || 'https://project-red-string.vercel.app';
const CHECK_DELAY_MS = 5_000;
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const DOWNLOAD_CONCURRENCY = 6;
const POPUP_POLL_MS = 500;
const AUTO_POPUP_WAIT_MS = 60_000;
const MANUAL_POPUP_WAIT_MS = 5_000;

const COMMIT_RE = /^[0-9a-f]{7,40}$/i;
const HASH_RE = /^[0-9a-f]{64}$/;
// Build output paths only: letters, digits and a few separators, no "..", no leading slash.
const FILE_RE = /^(?!.*\.\.)[A-Za-z0-9_][A-Za-z0-9_./-]*$/;

function updatesDir() {
  return path.join(app.getPath('userData'), 'game-updates');
}

function parseManifest(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null; // Before the first deploy with version.json the site answers with index.html.
  }
  if (!data || typeof data !== 'object') return null;
  const { commit, builtAt, files } = data;
  if (typeof commit !== 'string' || !COMMIT_RE.test(commit)) return null;
  if (typeof builtAt !== 'string' || Number.isNaN(Date.parse(builtAt))) return null;
  if (!files || typeof files !== 'object') return null;
  const entries = Object.entries(files);
  if (entries.length === 0 || !files['index.html']) return null;
  for (const [file, hash] of entries) {
    if (!FILE_RE.test(file) || typeof hash !== 'string' || !HASH_RE.test(hash)) return null;
  }
  return { commit, builtAt, files };
}

function readManifest(dir) {
  try {
    return parseManifest(fs.readFileSync(path.join(dir, 'version.json'), 'utf8'));
  } catch {
    return null;
  }
}

const isNewer = (a, b) => Date.parse(a.builtAt) > Date.parse(b.builtAt);

/**
 * Picks the folder to serve: the build shipped inside the app, or a downloaded update if that one is
 * newer. A fresh installer that is newer than every download wins, and old downloads are removed.
 */
function pickGameRoot(bundledRoot) {
  const bundled = readManifest(bundledRoot);
  let best = { root: bundledRoot, manifest: bundled };
  const dir = updatesDir();
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    // No updates downloaded yet.
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !COMMIT_RE.test(entry.name)) continue;
    const root = path.join(dir, entry.name);
    const manifest = readManifest(root);
    if (manifest && (!best.manifest || isNewer(manifest, best.manifest))) best = { root, manifest };
  }
  // Keep only the folder in use (half-finished downloads included).
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (full !== best.root) fs.rmSync(full, { recursive: true, force: true });
  }
  return best;
}

async function fetchLiveManifest() {
  const res = await net.fetch(`${BASE_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return parseManifest(await res.text());
}

async function downloadFile(file, expectedHash, targetDir) {
  const res = await net.fetch(`${BASE_URL}/${file}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  if (hash !== expectedHash) throw new Error(`${file}: hash mismatch`);
  const target = path.join(targetDir, ...file.split('/'));
  if (!target.startsWith(targetDir + path.sep)) throw new Error(`${file}: bad path`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}

/** Downloads a full build next to the current one. Returns its folder once every file checks out. */
async function downloadBuild(manifest, onProgress) {
  const dir = updatesDir();
  const finalDir = path.join(dir, manifest.commit);
  const tempDir = path.join(dir, `${manifest.commit}.partial`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const queue = Object.entries(manifest.files);
  const total = queue.length;
  let done = 0;
  try {
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        await downloadFile(next[0], next[1], tempDir);
        done += 1;
        onProgress(done / total);
      }
    };
    await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));
    // version.json goes in last: a folder without it is never picked as a game root.
    fs.writeFileSync(path.join(tempDir, 'version.json'), JSON.stringify(manifest, null, 2) + '\n');
    fs.rmSync(finalDir, { recursive: true, force: true });
    fs.renameSync(tempDir, finalDir);
    return finalDir;
  } catch (err) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw err;
  }
}

/**
 * Starts the update checks.
 * - getWindow(): the main window, for dialogs and the progress bar.
 * - getCurrent(): the manifest of the build being served now.
 * - applyBuild(root, manifest): switch to a downloaded build and reload.
 * - getPopup(): the game's own update popup ({ ask(): Promise<boolean>, send(message) }), or null when
 *   the page cannot show it (an older game build): then the system dialogs are used.
 * Returns checkNow(manual) for the "Check for Updates…" menu item.
 */
function startUpdates({ getWindow, getCurrent, applyBuild, getPopup = () => null }) {
  const dismissed = new Set();
  let busy = false;

  const show = (options) => {
    const win = getWindow();
    return win ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options);
  };
  /** Tell the game's popup, or fall back to a system dialog. */
  const tell = async (state, options, extra = {}) => {
    const popup = getPopup();
    if (popup) popup.send({ state, ...extra });
    else if (options) await show(options);
  };
  /** The game's popup, once the page has it up (it may be loading or reloading); null after the wait. */
  const waitForPopup = async (ms) => {
    for (let waited = 0; ; waited += POPUP_POLL_MS) {
      const popup = getPopup();
      if (popup || waited >= ms) return popup;
      await new Promise((resolve) => setTimeout(resolve, POPUP_POLL_MS));
    }
  };

  async function checkNow(manual = false) {
    if (busy) return;
    busy = true;
    const win = getWindow();
    try {
      const current = getCurrent();
      let live;
      try {
        live = await fetchLiveManifest();
      } catch {
        live = null;
      }
      if (!live) {
        if (manual) await tell('offline', { type: 'warning', message: 'Could not check for updates.', detail: 'Check your internet connection and try again.' });
        return;
      }
      const newer = !current || (live.commit !== current.commit && isNewer(live, current));
      if (!newer) {
        if (manual) await tell('current', { type: 'info', message: 'Red String is up to date.' });
        return;
      }
      if (!manual && dismissed.has(live.commit)) return;

      // The game's own popup, always: a background check without it waits for the next round
      // instead of showing a system dialog.
      const popup = await waitForPopup(manual ? MANUAL_POPUP_WAIT_MS : AUTO_POPUP_WAIT_MS);
      if (!popup && !manual) return;
      const accepted = popup
        ? await popup.ask()
        : (
            await show({
              type: 'info',
              title: 'Update available',
              message: 'A new version of Red String is ready.',
              detail: 'The update downloads in a few seconds and the game reloads. Your saves stay where they are.',
              buttons: ['Update now', 'Later'],
              defaultId: 0,
              cancelId: 1,
            })
          ).response === 0;
      if (!accepted) {
        dismissed.add(live.commit);
        return;
      }

      try {
        let shown = -1;
        const root = await downloadBuild(live, (p) => {
          if (win && !win.isDestroyed()) win.setProgressBar(p);
          // A few steps are enough for the popup's bar.
          const step = Math.floor(p * 20);
          if (step !== shown) {
            shown = step;
            getPopup()?.send({ state: 'downloading', progress: p });
          }
        });
        getPopup()?.send({ state: 'installing' });
        applyBuild(root, live);
        // Drop the build we just left behind (unless it is the one shipped inside the app).
        pickGameRoot(path.join(__dirname, 'renderer'));
      } catch (err) {
        await tell(
          'failed',
          {
            type: 'error',
            message: 'The update could not be installed.',
            detail: `You can keep playing this version. We will try again later.\n\n${err.message}`,
          },
          { detail: err.message },
        );
      } finally {
        if (win && !win.isDestroyed()) win.setProgressBar(-1);
      }
    } finally {
      busy = false;
    }
  }

  if (app.isPackaged || DEV_BASE_URL) {
    setTimeout(() => checkNow(false), CHECK_DELAY_MS);
    setInterval(() => checkNow(false), CHECK_INTERVAL_MS);
  }
  return checkNow;
}

module.exports = { pickGameRoot, startUpdates };
