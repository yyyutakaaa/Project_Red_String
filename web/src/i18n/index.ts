// The game's language: which one is chosen, its interface strings and its case texts, and t() to
// read them. English (en.ts) is built in; other languages are separate chunks loaded on demand,
// so a player only downloads the language they play in.
import { create } from 'zustand';
import type { CaseFile, Room } from '@shared/caseSchema.ts';
import { en, type MessageKey } from './en.ts';
import { englishOf, localizeCase, type CaseStrings } from './caseText.ts';
import { LANGUAGES, SOURCE_LANGUAGE, isLanguageCode, pickLanguage, type LanguageCode } from './languages.ts';

export { LANGUAGES, type LanguageCode } from './languages.ts';
export type { MessageKey } from './en.ts';
export { englishOf } from './caseText.ts';

const STORAGE_KEY = 'redstring.language';

const uiChunks = import.meta.glob<Record<string, string>>('./locales/*.json', { import: 'default' });
const caseChunks = import.meta.glob<CaseStrings>('../cases/i18n/*/*.json', { import: 'default' });

/** English plus every language that has its translation in the game. The settings offer only these. */
export const AVAILABLE_LANGUAGES = LANGUAGES.filter((l) => l.code === SOURCE_LANGUAGE || `./locales/${l.code}.json` in uiChunks);
const available = (code: LanguageCode | null): code is LanguageCode => code !== null && AVAILABLE_LANGUAGES.some((l) => l.code === code);

interface LanguageState {
  language: LanguageCode;
  /** Interface strings of the chosen language (empty for English). */
  messages: Partial<Record<MessageKey, string>>;
  /** Case texts of the chosen language, by case id. */
  cases: Record<string, CaseStrings>;
}

function storedLanguage(): LanguageCode | null {
  try {
    const v = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isLanguageCode(v) ? v : null;
  } catch {
    return null;
  }
}

/** The saved choice, or the browser's language when the player never picked one. */
export function initialLanguage(): LanguageCode {
  const nav = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
  const stored = storedLanguage();
  if (available(stored)) return stored;
  const picked = pickLanguage(nav);
  return available(picked) ? picked : SOURCE_LANGUAGE;
}

export const useLanguage = create<LanguageState>(() => ({ language: SOURCE_LANGUAGE, messages: {}, cases: {} }));

async function fetchLanguage(code: LanguageCode): Promise<Pick<LanguageState, 'messages' | 'cases'>> {
  if (code === SOURCE_LANGUAGE) return { messages: {}, cases: {} };
  const ui = uiChunks[`./locales/${code}.json`];
  const prefix = `../cases/i18n/${code}/`;
  const caseLoads = Object.entries(caseChunks)
    .filter(([p]) => p.startsWith(prefix))
    .map(async ([p, load]) => [p.slice(prefix.length).replace(/\.json$/, ''), await load()] as const);
  const [messages, cases] = await Promise.all([ui ? ui() : Promise.resolve({}), Promise.all(caseLoads)]);
  return { messages: messages as LanguageState['messages'], cases: Object.fromEntries(cases) };
}

let loading: Promise<void> | null = null;
let loadingCode: LanguageCode | null = null;

/** Load a language and switch to it. A failed download keeps the current language. */
export function setLanguage(code: LanguageCode, remember = true): Promise<void> {
  if (remember) {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, code);
    } catch {
      /* the choice lasts for this session only */
    }
  }
  if (loadingCode === code && loading) return loading;
  loadingCode = code;
  loading = fetchLanguage(code)
    .then((data) => {
      if (loadingCode !== code) return;
      useLanguage.setState({ language: code, ...data });
      if (typeof document !== 'undefined') document.documentElement.lang = code;
    })
    .catch((err) => {
      console.warn(`Could not load language ${code}`, err);
    })
    .finally(() => {
      if (loadingCode === code) loading = null;
    });
  return loading;
}

export type Vars = Record<string, string | number>;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

function lookup(state: LanguageState, key: MessageKey): string {
  return state.messages[key] ?? en[key] ?? key;
}

/** An interface string in the current language, with {placeholders} filled in. */
export function t(key: MessageKey, vars?: Vars): string {
  return fill(lookup(useLanguage.getState(), key), vars);
}

/** A string with a count: uses `<key>.one` or `<key>.other` by the language's plural rules. */
export function tn(key: string, count: number, vars?: Vars): string {
  const state = useLanguage.getState();
  const form = new Intl.PluralRules(state.language).select(count) === 'one' ? 'one' : 'other';
  return fill(lookup(state, `${key}.${form}` as MessageKey), { count, ...vars });
}

export interface Translator {
  t: typeof t;
  tn: typeof tn;
  language: LanguageCode;
}

/** In components: t and tn that re-render when the language changes. */
export function useT(): Translator {
  const language = useLanguage((s) => s.language);
  useLanguage((s) => s.messages);
  return { t, tn, language };
}

const localized = new Map<string, { source: CaseFile; strings: CaseStrings | undefined; out: CaseFile }>();

/** The case in the current language. The same object comes back until the language changes. */
export function localizedCase(c: CaseFile): CaseFile {
  const { language, cases } = useLanguage.getState();
  if (language === SOURCE_LANGUAGE) return c;
  const strings = cases[c.id];
  const key = `${language}:${c.id}`;
  const hit = localized.get(key);
  if (hit && hit.source === c && hit.strings === strings) return hit.out;
  const out = localizeCase(c, strings);
  localized.set(key, { source: c, strings, out });
  return out;
}

/** What a room drawing is chosen from: always the English room and setting, in every language. */
export function scenePlaceOf(room: Room, caseFile: CaseFile): { name: string; description: string; setting: string } {
  const r = englishOf(room);
  return { name: r.name, description: r.description, setting: englishOf(caseFile).setting };
}

/** Locale-aware formatting of numbers and dates for the current language. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(useLanguage.getState().language).format(n);
}

export function formatDate(ms: number, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat(useLanguage.getState().language, options).format(ms);
}
