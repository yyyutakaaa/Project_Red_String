// Player accounts: a detective name and a password, no email.
//
// Supabase Auth needs an email, so each name maps to an internal address that never gets mail
// (it must match ACCOUNT_EMAIL_DOMAIN in supabase/functions/account). New accounts are created by
// the account edge function; signing in goes straight to Supabase Auth.
import { FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from './config.ts';
import { supabase } from './supabase.ts';
import { t } from '../i18n/index.ts';

export const ACCOUNT_EMAIL_DOMAIN = 'players.redstring.local';
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export class AccountError extends Error {
  constructor(
    public code: 'invalid' | 'taken' | 'wrong_credentials' | 'rate_limited' | 'offline' | 'unavailable',
    message: string,
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** A message when the name is not allowed, else null. */
export function usernameProblem(raw: string): string | null {
  const name = normalizeUsername(raw);
  if (name.length < 3) return t('account.errMinName');
  if (name.length > 20) return t('account.errMaxName');
  if (!USERNAME_RE.test(name)) return t('account.errNameChars');
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return t('account.errMinPass', { n: PASSWORD_MIN });
  if (password.length > PASSWORD_MAX) return t('account.errMaxPass', { n: PASSWORD_MAX });
  return null;
}

export const emailFor = (username: string) => `${normalizeUsername(username)}@${ACCOUNT_EMAIL_DOMAIN}`;

export function usernameFromEmail(email: string | undefined | null): string {
  return (email ?? '').split('@')[0] ?? '';
}

function client() {
  const c = supabase();
  if (!c) throw new AccountError('unavailable', t('account.errUnavailableBuild'));
  return c;
}

export async function signIn(username: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email: emailFor(username), password });
  if (!error) return;
  if (error.status === 400 || /invalid login/i.test(error.message)) {
    throw new AccountError('wrong_credentials', t('account.errWrong'));
  }
  if (error.status === 429) throw new AccountError('rate_limited', t('account.errTooMany'));
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    throw new AccountError('offline', t('account.errOffline'));
  }
  throw new AccountError('unavailable', t('account.errClosed'));
}

export async function createAccount(username: string, password: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ username: normalizeUsername(username), password }),
    });
  } catch {
    throw new AccountError('offline', t('account.errOffline'));
  }
  if (!res.ok) {
    let code = '';
    try {
      const body = (await res.json()) as { error?: { code?: string } };
      code = body.error?.code ?? '';
    } catch {
      /* no code: the generic message */
    }
    // The server's messages are English; the player reads them in their own language.
    if (code === 'username_taken') throw new AccountError('taken', t('account.errTaken'));
    if (code === 'rate_limited') throw new AccountError('rate_limited', t('account.errTooManyNew'));
    if (code === 'bad_request') throw new AccountError('invalid', t('account.errInvalid'));
    throw new AccountError('unavailable', t('account.errOpenFile'));
  }
  await signIn(username, password);
}
