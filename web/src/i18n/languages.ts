// The languages the game ships in. English is the source; the others are machine translated with
// web/scripts/translate.ts and can be corrected by hand in src/i18n/locales and src/cases/i18n.
// To add one: put it here, then run `npm run translate -- --lang <code>`.
// No value imports: the translate script reads this file with plain Node.

export const LANGUAGES = [
  { code: 'en', name: 'English', english: 'English' },
  { code: 'nl', name: 'Nederlands', english: 'Dutch' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'de', name: 'Deutsch', english: 'German' },
  { code: 'es', name: 'Español', english: 'Spanish' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const SOURCE_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === 'string' && LANGUAGES.some((l) => l.code === v);
}

/** The best shipped language for a list of browser preferences ("nl-BE", "fr", ...). English otherwise. */
export function pickLanguage(preferred: readonly string[]): LanguageCode {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguageCode(base)) return base;
  }
  return SOURCE_LANGUAGE;
}
