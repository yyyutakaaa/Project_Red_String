// The languages the game is played in, as the models should be told. Shared by the suspects' prompt
// and the partner's, so both answer in the player's language.
export const PLAY_LANGUAGES = {
  en: 'English',
  nl: 'Dutch',
  fr: 'French',
  de: 'German',
} as const;

export type PlayLanguage = keyof typeof PLAY_LANGUAGES;

export function playLanguage(code: unknown): PlayLanguage | null {
  return typeof code === 'string' && code in PLAY_LANGUAGES ? (code as PlayLanguage) : null;
}
