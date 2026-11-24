// Fails if a build output (or any directory) contains something that looks like a secret:
// the OmniaKey key variable or endpoint, provider-style secret keys, or a Supabase service-role JWT.
// Usage: node web/scripts/check-secrets.mjs [dir ...]   (default: web/dist)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [path.resolve(here, '../dist')];

const PATTERNS = [
  { name: 'OmniaKey key variable', re: /OMNIAKEY_API_KEY/ },
  { name: 'OmniaKey API endpoint (frontend must not call the provider)', re: /api\.omniakey\.com/ },
  { name: 'secret-looking provider key', re: /\b(sk|ok|omk)-[A-Za-z0-9_-]{24,}\b/ },
  { name: 'Supabase secret key', re: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      yield* walk(p);
    } else if (st.size < 8_000_000) {
      yield p;
    }
  }
}

function jwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

let problems = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    if (!/\.(js|mjs|cjs|css|html|json|map|txt|ts|tsx)$/.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const { name, re } of PATTERNS) {
      if (re.test(text)) {
        console.error(`[check-secrets] ${name} found in ${file}`);
        problems++;
      }
    }
    for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g)) {
      if (jwtRole(m[0]) === 'service_role') {
        console.error(`[check-secrets] Supabase service_role JWT found in ${file}`);
        problems++;
      }
    }
  }
}
if (problems > 0) {
  console.error(`[check-secrets] ${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`[check-secrets] OK: no secrets found in ${dirs.join(', ')}`);
