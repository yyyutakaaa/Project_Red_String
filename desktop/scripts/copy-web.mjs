// Builds the web game and copies the result into desktop/renderer, which the Electron app serves.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '../../web');
const out = path.resolve(here, '../renderer');

if (!existsSync(path.join(web, 'node_modules'))) {
  execSync('npm ci', { cwd: web, stdio: 'inherit' });
}
execSync('npm run build', { cwd: web, stdio: 'inherit' });
execSync('node scripts/check-secrets.mjs dist', { cwd: web, stdio: 'inherit' });

rmSync(out, { recursive: true, force: true });
cpSync(path.join(web, 'dist'), out, { recursive: true });
console.log(`Copied web build to ${out}`);
