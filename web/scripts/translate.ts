// Translates the game: the interface strings (src/i18n/en.ts) and the player-facing text of every
// case (src/cases/*.json), into the languages listed in src/i18n/languages.ts or named on the
// command line. Only new or changed English text is sent; the rest is kept.
//
//   npm run translate                 every language, interface and cases
//   npm run translate -- --lang nl    one language (comma-separate several)
//   npm run translate -- --only ui    only the interface (or: --only cases)
//   npm run translate -- --dry-run    show what would be sent, send nothing
//   npm run translate -- --record     mark the translations on disk as up to date (after editing by hand)
//
// The model runs server-side in the `translate` edge function, which needs an admin token in
// RED_STRING_TRANSLATE_TOKEN (or in scripts/translate.env.local, which git ignores).
//
// Output:
//   src/i18n/locales/<lang>.json         interface strings
//   src/cases/i18n/<lang>/<case>.json    case strings (see src/i18n/caseText.ts)
//   src/i18n/sources/<lang>.json         a hash of the English each translation was made from
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CaseFile } from '@shared/caseSchema.ts';
import { caseStrings } from '../src/i18n/caseText.ts';
import { en } from '../src/i18n/en.ts';
import { LANGUAGES } from '../src/i18n/languages.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '..');
const BATCH_STRINGS = 60;
const BATCH_CHARS = 9_000;
const CONCURRENCY = 3;
const ATTEMPTS = 3;

type Strings = Record<string, string>;

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? '') : null;
}
const dryRun = process.argv.includes('--dry-run');
const recordOnly = process.argv.includes('--record');
const only = arg('only');
const langs = (arg('lang') ?? LANGUAGES.filter((l) => l.code !== 'en').map((l) => l.code).join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function readEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m?.[1]) out[m[1]] = m[2] ?? '';
  }
  return out;
}

const localEnv = readEnvFile(path.join(here, 'translate.env.local'));
const publicEnv = readEnvFile(path.join(web, '.env.production'));
const token = process.env.RED_STRING_TRANSLATE_TOKEN ?? localEnv.RED_STRING_TRANSLATE_TOKEN ?? '';
const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? publicEnv.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const placeholders = (s: string) => [...s.matchAll(/\{[a-zA-Z0-9_]+\}/g)].map((m) => m[0]).sort().join(' ');

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** Batches small enough for one model call. */
function batches(todo: Strings): Strings[] {
  const out: Strings[] = [];
  let cur: Strings = {};
  let n = 0;
  let chars = 0;
  for (const [k, v] of Object.entries(todo)) {
    if (n > 0 && (n >= BATCH_STRINGS || chars + v.length > BATCH_CHARS)) {
      out.push(cur);
      cur = {};
      n = 0;
      chars = 0;
    }
    cur[k] = v;
    n++;
    chars += v.length + k.length;
  }
  if (n > 0) out.push(cur);
  return out;
}

async function callTranslate(language: string, strings: Strings, context: string): Promise<Strings> {
  const res = await fetch(`${supabaseUrl}/functions/v1/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      'X-Eval-Token': token,
    },
    body: JSON.stringify({ language, strings, context }),
  });
  if (!res.ok) throw new Error(`translate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { strings?: Strings };
  return data.strings ?? {};
}

/** Translate every string in todo, asking again for the ones that come back missing or broken. */
async function translateAll(language: string, todo: Strings, context: string): Promise<Strings> {
  const done: Strings = {};
  let left = { ...todo };
  for (let attempt = 1; attempt <= ATTEMPTS && Object.keys(left).length; attempt++) {
    const queue = batches(left);
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let b = queue.shift(); b; b = queue.shift()) {
        try {
          const got = await callTranslate(language, b, context);
          for (const [k, v] of Object.entries(got)) {
            const source = b[k];
            if (source !== undefined && placeholders(source) === placeholders(v)) done[k] = v;
          }
        } catch (err) {
          console.warn(`  ${language}: a batch failed (${(err as Error).message})`);
        }
      }
    });
    await Promise.all(workers);
    left = Object.fromEntries(Object.entries(left).filter(([k]) => !(k in done)));
    if (Object.keys(left).length && attempt < ATTEMPTS) console.log(`  ${language}: ${Object.keys(left).length} strings again`);
  }
  if (Object.keys(left).length) console.warn(`  ${language}: ${Object.keys(left).length} strings stay English for now`);
  return done;
}

interface Unit {
  /** Name in the sources file. */
  id: string;
  english: Strings;
  context: string;
  file: (lang: string) => string;
}

function units(): Unit[] {
  const out: Unit[] = [];
  if (only !== 'cases') {
    out.push({
      id: 'ui',
      english: { ...en },
      context: 'The interface of the game: menus, buttons, labels, notices and short messages.',
      file: (lang) => path.join(web, 'src/i18n/locales', `${lang}.json`),
    });
  }
  if (only !== 'ui') {
    const dir = path.join(web, 'src/cases');
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      const c = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as CaseFile;
      const people = [c.victim.name, ...c.suspects.map((s) => s.name)].join(', ');
      out.push({
        id: `case:${c.id}`,
        english: caseStrings(c),
        context: `Case "${c.title}" (${c.tagline}), ${c.era}. People: ${people}. Keys name the part of the case file (rooms, hotspots, evidence, a suspect's public facts, clues they give up, hints, endings).`,
        file: (lang) => path.join(dir, 'i18n', lang, name),
      });
    }
  }
  return out;
}

async function main(): Promise<void> {
  if (!dryRun && !recordOnly && (!token || !supabaseUrl)) {
    console.error('Set RED_STRING_TRANSLATE_TOKEN (or put it in scripts/translate.env.local) to run this.');
    process.exit(1);
  }
  const all = units();
  for (const lang of langs) {
    if (!LANGUAGES.some((l) => l.code === lang) || lang === 'en') {
      console.error(`Unknown language "${lang}". Add it to src/i18n/languages.ts first.`);
      process.exit(1);
    }
    const sourcesFile = path.join(web, 'src/i18n/sources', `${lang}.json`);
    const sources = readJson<Record<string, Record<string, string>>>(sourcesFile, {});
    for (const unit of all) {
      const existing = readJson<Strings>(unit.file(lang), {});
      const seen = sources[unit.id] ?? {};
      if (recordOnly) {
        const marked: Record<string, string> = {};
        for (const [k, v] of Object.entries(unit.english)) if (existing[k]) marked[k] = hash(v);
        sources[unit.id] = marked;
        writeJson(sourcesFile, sources);
        continue;
      }
      const todo: Strings = {};
      for (const [k, v] of Object.entries(unit.english)) if (!existing[k] || seen[k] !== hash(v)) todo[k] = v;
      const count = Object.keys(todo).length;
      if (count === 0) continue;
      const chars = Object.values(todo).reduce((n, v) => n + v.length, 0);
      console.log(`${lang} ${unit.id}: ${count} strings, ${chars} characters`);
      if (dryRun) continue;
      const fresh = await translateAll(lang, todo, unit.context);
      // Keep the English order, drop keys English no longer has.
      const merged: Strings = {};
      const nextSeen: Record<string, string> = {};
      for (const [k, v] of Object.entries(unit.english)) {
        const t = fresh[k] ?? (k in todo ? undefined : existing[k]);
        if (t === undefined) continue;
        merged[k] = t;
        nextSeen[k] = k in fresh ? hash(v) : (seen[k] ?? hash(v));
      }
      writeJson(unit.file(lang), merged);
      sources[unit.id] = nextSeen;
      writeJson(sourcesFile, sources);
    }
  }
}

await main();
