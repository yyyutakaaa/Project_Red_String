// Installing a new version of the app itself, from inside the game.
//
// Game files update on their own (updater.cjs). When the shell changes (this folder), the game asks
// for a new app. On "Install" this module finds the latest GitHub release, checks that it is the
// shell the game expects (shell.json next to the installers), downloads the installer for this
// platform with progress for the game's popup, checks its size and sha256, and installs it:
//
// - Windows: runs the NSIS installer silently and quits; the installer starts the new app.
// - macOS: mounts the disk image, copies the new Red String.app next to this one, quits, and a small
//   shell script swaps the two once this app has exited and opens the new one.
//
// When that cannot work (a development run, an app started from the disk image or from a folder this
// user cannot write to), it says so and the game offers the download page instead.
const { app, net } = require('electron');
const { execFile, spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPO = 'yyyutakaaa/Project_Red_String';
const API = `https://api.github.com/repos/${REPO}/releases/latest`;
const HEADERS = { Accept: 'application/vnd.github+json', 'User-Agent': 'RedString-desktop' };

/** A failure the game shows. `manual`: offer the download page. `notReady`: the release is still building. */
class InstallError extends Error {
  constructor(message, kind = 'failed') {
    super(message);
    this.kind = kind;
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => (err ? reject(new Error(`${cmd}: ${String(stderr || err.message).trim()}`)) : resolve(stdout)));
  });
}

async function getJson(url) {
  const res = await net.fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new InstallError(`GitHub answered ${res.status}`);
  return res.json();
}

function installerAsset(release) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const pattern = process.platform === 'darwin' ? /-mac\.dmg$/ : /-windows-setup\.exe$/;
  return assets.find((a) => pattern.test(a.name));
}

/** The latest release, if it is the shell the game asked for. */
async function findRelease(wantedFingerprint) {
  const release = await getJson(API);
  const shellAsset = (release.assets || []).find((a) => a.name === 'shell.json');
  const asset = installerAsset(release);
  if (!shellAsset || !asset) throw new InstallError('The latest release has no installer for this computer yet.', 'notReady');
  const shell = await getJson(shellAsset.browser_download_url);
  if (wantedFingerprint && shell.fingerprint !== wantedFingerprint) {
    throw new InstallError('The new app is still being built.', 'notReady');
  }
  return asset;
}

async function download(asset, dir, onProgress) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, path.basename(asset.name));
  const res = await net.fetch(asset.browser_download_url, { headers: { 'User-Agent': HEADERS['User-Agent'] }, cache: 'no-store' });
  if (!res.ok || !res.body) throw new InstallError(`Download failed (${res.status})`);
  const total = Number(asset.size) || Number(res.headers.get('content-length')) || 0;
  const hash = crypto.createHash('sha256');
  const out = fs.createWriteStream(file);
  const reader = res.body.getReader();
  let received = 0;
  let lastStep = -1;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
      received += value.length;
      if (!out.write(value)) await new Promise((r) => out.once('drain', r));
      const step = total ? Math.floor((received / total) * 100) : 0;
      if (step !== lastStep) {
        lastStep = step;
        onProgress(total ? Math.min(1, received / total) : 0);
      }
    }
  } finally {
    await new Promise((r) => out.end(r));
  }
  if (total && received !== total) throw new InstallError('The download was cut off.');
  // GitHub lists a sha256 for each release file ("sha256:<hex>").
  const digest = typeof asset.digest === 'string' && asset.digest.startsWith('sha256:') ? asset.digest.slice(7) : '';
  if (digest && hash.digest('hex') !== digest.toLowerCase()) throw new InstallError('The download does not match the release.');
  return file;
}

/** Where this app's bundle lives on macOS, if we may replace it. */
function macBundle() {
  const bundle = path.resolve(app.getPath('exe'), '..', '..', '..');
  if (!bundle.endsWith('.app')) throw new InstallError('This app is not in an app bundle.', 'manual');
  // Started from the disk image, or moved by macOS into a read-only copy: nothing to replace.
  if (bundle.startsWith('/Volumes/') || bundle.includes('/AppTranslocation/')) {
    throw new InstallError('Move Red String to Applications first.', 'manual');
  }
  try {
    fs.accessSync(path.dirname(bundle), fs.constants.W_OK);
  } catch {
    throw new InstallError('No permission to replace the app in its folder.', 'manual');
  }
  return bundle;
}

async function installMac(dmg, dir) {
  const bundle = macBundle();
  const mount = path.join(dir, 'mount');
  fs.mkdirSync(mount, { recursive: true });
  await run('hdiutil', ['attach', '-nobrowse', '-noautoopen', '-readonly', '-mountpoint', mount, dmg]);
  const staged = path.join(path.dirname(bundle), '.Red String.update.app');
  try {
    const found = fs.readdirSync(mount).find((n) => n.endsWith('.app'));
    if (!found) throw new InstallError('The disk image has no app in it.');
    fs.rmSync(staged, { recursive: true, force: true });
    await run('ditto', [path.join(mount, found), staged]);
  } finally {
    await run('hdiutil', ['detach', mount, '-force']).catch(() => undefined);
  }
  await run('xattr', ['-dr', 'com.apple.quarantine', staged]).catch(() => undefined);
  // After this app has quit: swap the bundles, open the new one, clean up.
  const script = [
    'while kill -0 "$RS_PID" 2>/dev/null; do sleep 0.2; done',
    'rm -rf "$RS_OLD" && mv "$RS_NEW" "$RS_OLD" || exit 1',
    'open "$RS_OLD"',
    'rm -rf "$RS_DIR"',
  ].join('\n');
  spawn('/bin/sh', ['-c', script], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, RS_PID: String(process.pid), RS_OLD: bundle, RS_NEW: staged, RS_DIR: dir },
  }).unref();
}

function installWindows(exe) {
  // The same switches electron-updater uses: silent, into the existing install, start it after.
  spawn(exe, ['--updated', '/S', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
}

/**
 * Download and install the latest app. `send` gets { state: 'downloading', progress } and then
 * 'installing' (the app quits soon after), or 'failed' / 'notReady' / 'manual' with a detail.
 */
function createInstaller() {
  let busy = false;
  return async function installShell(wantedFingerprint, send) {
    if (busy) return;
    busy = true;
    try {
      if (!app.isPackaged) throw new InstallError('A development run cannot replace itself.', 'manual');
      if (process.platform !== 'darwin' && process.platform !== 'win32') throw new InstallError('Not supported here.', 'manual');
      send({ state: 'downloading', progress: 0 });
      const asset = await findRelease(wantedFingerprint);
      const dir = path.join(app.getPath('temp'), 'red-string-app-update');
      const file = await download(asset, dir, (progress) => send({ state: 'downloading', progress }));
      send({ state: 'installing' });
      if (process.platform === 'darwin') await installMac(file, dir);
      else installWindows(file);
      setTimeout(() => app.quit(), 1200);
    } catch (err) {
      const kind = err instanceof InstallError ? err.kind : 'failed';
      send({ state: kind, detail: String(err?.message || err).slice(0, 200) });
      busy = false;
    }
  };
}

module.exports = { createInstaller };
