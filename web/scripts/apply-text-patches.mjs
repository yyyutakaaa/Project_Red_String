// Applies exact text replacements to a story case: node scripts/apply-text-patches.mjs <case-id> <patches.json>
// patches.json is [[old, new], ...]. Every "old" must occur exactly once in the file, or the script fails.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [id, patchFile] = process.argv.slice(2);
const file = path.resolve(here, '../src/cases', `${id}.json`);
let text = readFileSync(file, 'utf8');
const patches = JSON.parse(readFileSync(patchFile, 'utf8'));
const esc = (s) => JSON.stringify(s).slice(1, -1);
let problems = 0;
for (const [from, to] of patches) {
  const a = esc(from);
  const count = text.split(a).length - 1;
  if (count !== 1) {
    console.error(`expected 1 match, found ${count}: ${from.slice(0, 70)}`);
    problems++;
    continue;
  }
  text = text.replace(a, () => esc(to));
}
if (problems) process.exit(1);
JSON.parse(text);
writeFileSync(file, text);
console.log(`${id}: applied ${patches.length} patches`);
