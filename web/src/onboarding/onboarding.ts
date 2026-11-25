// The first start: pick a language, then the offer of an account, then the offer of the tutorial.
// Each popup shows once. What was answered is kept on this device, and on the account for players
// who have one, so signing in on another computer skips what the account already knows.
//
// Players who were here before this existed (they have settings, a language or saves on this device)
// count as having answered all three; the tutorial is in the main menu for them.
import { create } from 'zustand';
import { useAccount, type AccountPrefs, type AccountUser } from '../store/account.ts';
import { AVAILABLE_LANGUAGES, setLanguage, useLanguage, type LanguageCode } from '../i18n/index.ts';

const KEY = 'redstring.onboarding';

export interface OnboardingState {
  languageChosen: boolean;
  accountAsked: boolean;
  /** The tutorial was offered and the player answered (played it or skipped it). */
  tutorialSeen: boolean;
  /** The tutorial case was played to the end. */
  tutorialDone: boolean;
}

export type FirstRunStep = 'language' | 'account' | 'tutorial' | null;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Someone who played before the first-start popups existed. */
function playedBefore(s: Storage): boolean {
  if (s.getItem('redstring.settings') || s.getItem('redstring.language') || s.getItem('redstring.cloud')) return true;
  for (let i = 0; i < s.length; i++) if (s.key(i)?.startsWith('redstring.save.')) return true;
  return false;
}

export function parseOnboarding(raw: string | null): OnboardingState | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      languageChosen: d.languageChosen === true,
      accountAsked: d.accountAsked === true,
      tutorialSeen: d.tutorialSeen === true,
      tutorialDone: d.tutorialDone === true,
    };
  } catch {
    return null;
  }
}

function initial(): OnboardingState {
  const s = storage();
  const stored = s ? parseOnboarding(s.getItem(KEY)) : null;
  if (stored) return stored;
  const old = s ? playedBefore(s) : false;
  // Players from before the tutorial existed know the game; it waits for them in the menu.
  const state = { languageChosen: old, accountAsked: old, tutorialSeen: old, tutorialDone: false };
  persist(state);
  return state;
}

function persist(state: OnboardingState): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(state));
  } catch {
    /* the popups may show again next time */
  }
}

export const useOnboarding = create<OnboardingState>(() => initial());

function update(patch: Partial<OnboardingState>): void {
  useOnboarding.setState(patch);
  persist(useOnboarding.getState());
}

/** Which popup the main menu should show now, if any. */
export function firstRunStep(state: OnboardingState, user: AccountUser | null, accountsAvailable: boolean): FirstRunStep {
  if (!state.languageChosen) return 'language';
  if (!state.accountAsked && !user && accountsAvailable) return 'account';
  if (!state.tutorialSeen && !state.tutorialDone) return 'tutorial';
  return null;
}

const savePrefs = (patch: AccountPrefs) => void useAccount.getState().savePrefs(patch);

export function chooseLanguage(code: LanguageCode): Promise<void> {
  update({ languageChosen: true });
  savePrefs({ language: code });
  return setLanguage(code);
}

export function answerAccount(): void {
  update({ accountAsked: true });
}

export function answerTutorial(): void {
  update({ tutorialSeen: true });
  savePrefs({ tutorialSeen: true });
}

export function completeTutorial(): void {
  if (useOnboarding.getState().tutorialDone) return;
  update({ tutorialDone: true, tutorialSeen: true });
  savePrefs({ tutorialSeen: true, tutorialDone: true });
}

/**
 * A player signed in (or the saved session came back): take what the account remembers, and give
 * the account what this device knows that it does not.
 */
export function applyAccount(user: AccountUser): void {
  const prefs = user.prefs;
  const local = useOnboarding.getState();
  const known = AVAILABLE_LANGUAGES.some((l) => l.code === prefs.language);
  if (known && prefs.language !== useLanguage.getState().language) void setLanguage(prefs.language as LanguageCode);
  update({
    accountAsked: true,
    languageChosen: local.languageChosen || known,
    tutorialSeen: local.tutorialSeen || prefs.tutorialSeen === true || prefs.tutorialDone === true,
    tutorialDone: local.tutorialDone || prefs.tutorialDone === true,
  });
  const now = useOnboarding.getState();
  const patch: AccountPrefs = {};
  if (!known && now.languageChosen) patch.language = useLanguage.getState().language;
  if (now.tutorialSeen && !prefs.tutorialSeen) patch.tutorialSeen = true;
  if (now.tutorialDone && !prefs.tutorialDone) patch.tutorialDone = true;
  if (Object.keys(patch).length > 0) savePrefs(patch);
}

// Every sign-in, sign-up and restored session goes through here, and so does a fresh copy of the
// account's preferences from the server.
useAccount.subscribe((s, prev) => {
  if (!s.user) return;
  if (s.user.id !== prev.user?.id || JSON.stringify(s.user.prefs) !== JSON.stringify(prev.user?.prefs)) applyAccount(s.user);
});
