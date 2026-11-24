// Player accounts: a detective name and a password, no email.
//
// Supabase Auth needs an email, so each name maps to an internal address that never gets mail
// (it must match ACCOUNT_EMAIL_DOMAIN in supabase/functions/account). New accounts are created by
// the account edge function; signing in goes straight to Supabase Auth.
import { FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from './config.ts';
import { supabase } from './supabase.ts';

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
  if (name.length < 3) return 'Use at least 3 characters.';
  if (name.length > 20) return 'Use at most 20 characters.';
  if (!USERNAME_RE.test(name)) return 'Use only letters, digits and underscores.';
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  return null;
}

export const emailFor = (username: string) => `${normalizeUsername(username)}@${ACCOUNT_EMAIL_DOMAIN}`;

export function usernameFromEmail(email: string | undefined | null): string {
  return (email ?? '').split('@')[0] ?? '';
}

function client() {
  const c = supabase();
  if (!c) throw new AccountError('unavailable', 'Accounts are not available in this build.');
  return c;
}

export async function signIn(username: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email: emailFor(username), password });
  if (!error) return;
  if (error.status === 400 || /invalid login/i.test(error.message)) {
    throw new AccountError('wrong_credentials', 'That name and password do not match our records.');
  }
  if (error.status === 429) throw new AccountError('rate_limited', 'Too many tries. Wait a minute and try again.');
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    throw new AccountError('offline', 'No connection. Check your internet and try again.');
  }
  throw new AccountError('unavailable', 'The records office is closed right now. Try again in a moment.');
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
    throw new AccountError('offline', 'No connection. Check your internet and try again.');
  }
  if (!res.ok) {
    let code = '';
    let message = 'Could not open the file. Try again in a moment.';
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? '';
      message = body.error?.message ?? message;
    } catch {
      /* keep the default message */
    }
    if (code === 'username_taken') throw new AccountError('taken', message);
    if (code === 'rate_limited') throw new AccountError('rate_limited', message);
    if (code === 'bad_request') throw new AccountError('invalid', message);
    throw new AccountError('unavailable', message);
  }
  await signIn(username, password);
}
