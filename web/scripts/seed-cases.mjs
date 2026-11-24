// Loads the story cases into public.story_cases through the deployed interrogate function.
// Run after `npm run sync:cases` and after deploying interrogate (the function only accepts text whose
// hash matches the hashes it was deployed with). Needs RS_EVAL_TOKEN in tools/eval/.env.local.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
for (const f of [path.resolve(here, '../../tools/eval/.env.local'), path.resolve(here, '../.env.local'), path.resolve(here, '../.env.production')]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const url = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const token = process.env.RS_EVAL_TOKEN ?? '';
if (!url || !key || !token) {
  console.error('Need VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and RS_EVAL_TOKEN.');
  process.exit(1);
}
const dir = path.resolve(here, '../src/cases');
let failed = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const id = f.replace(/\.json$/, '');
  const res = await fetch(`${url}/functions/v1/interrogate?seed=${id}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'X-Eval-Token': token, 'Content-Type': 'text/plain' },
    body: readFileSync(path.join(dir, f), 'utf8'),
  });
  const text = await res.text();
  console.log(`${id}: HTTP ${res.status} ${text.slice(0, 160)}`);
  if (!res.ok) failed++;
}
const diag = await fetch(`${url}/functions/v1/interrogate?diag=1`, { headers: { apikey: key } });
console.log(await diag.text());
process.exit(failed ? 1 : 0);
