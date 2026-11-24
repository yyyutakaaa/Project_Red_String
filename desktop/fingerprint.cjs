// Fingerprint of the desktop shell's own files (listed in shell-files.json). The game is built with
// the fingerprint of the shell next to it; when an in-app update brings game files for a newer
// shell, the two differ and the game offers the new app. The release workflow publishes it next to
// the installers (shell.json), so the app can tell whether the latest release is the one it needs.
// Must match shellFingerprint() in web/vite.config.ts. Plain Node: no Electron here.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function shellFingerprint(dir = __dirname) {
  try {
    const { files } = JSON.parse(fs.readFileSync(path.join(dir, 'shell-files.json'), 'utf8'));
    const hash = crypto.createHash('sha256');
    for (const name of files) {
      hash.update(`${name}\n`);
      hash.update(fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r/g, ''));
      hash.update('\n');
    }
    return hash.digest('hex').slice(0, 16);
  } catch {
    return '';
  }
}

module.exports = { shellFingerprint };

// `node desktop/fingerprint.cjs` prints it (used by the release workflow).
if (require.main === module) process.stdout.write(`${shellFingerprint()}\n`);
