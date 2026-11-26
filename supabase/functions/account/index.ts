// account: creates a player account from a detective name and a password, and renames one.
//
// Request (POST JSON): { username, password }                         a new account
//                      { action: 'rename', username } + Bearer token   a new name for the signed-in player
// Response: { ok: true, username } or { error: { code, message } }
//   codes: bad_request, unauthorized, username_taken, rate_limited, server_error
//
// Players never type an email. Supabase Auth still needs one, so each name maps to an internal
// address (<name>@<ACCOUNT_EMAIL_DOMAIN>) that never receives mail. Public sign-up rejects such
// addresses and would send a confirmation email, so accounts are created here with the admin API,
// already confirmed. The browser then signs in with the same name and password.
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { clientIp, errorResponse, json, originRejected, preflight, sha256Hex } from '../_shared/http.ts';
import { config, env } from '../_shared/env.ts';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const LIMITS = { perMinute: 5, perDay: 30 };
const RENAME_LIMITS = { perMinute: 3, perDay: 10 };

const Body = z.object({
  username: z.string().trim().toLowerCase().regex(USERNAME_RE),
  password: z.string().min(8).max(72),
});
const Rename = z.object({
  action: z.literal('rename'),
  username: z.string().trim().toLowerCase().regex(USERNAME_RE),
});

// Service-role client. Kept local (not _shared/db.ts) so this function deploys with few files.
const admin = createClient(config.supabaseUrl(), config.serviceRoleKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Per-network limit on new accounts (and per-player limit on new names), using the same counters as the other functions. */
async function allowSignup(
  key: string,
  prefix = 'acct',
  limits = LIMITS,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const iso = new Date().toISOString();
  const { data, error } = await admin.rpc('rs_hit_rate_limit', {
    p_key: key,
    p_minute_window: `${prefix}:m:${iso.slice(0, 16)}`,
    p_day_window: `${prefix}:d:${iso.slice(0, 10)}`,
    p_minute_limit: limits.perMinute,
    p_day_limit: limits.perDay,
  });
  if (error) throw new Error(`rate limit rpc failed: ${error.message}`);
  const r = data as { allowed: boolean; day_exceeded: boolean };
  return { allowed: r.allowed, retryAfterSeconds: r.allowed ? 0 : r.day_exceeded ? 3600 : 60 };
}

function accountEmail(username: string): string {
  return `${username}@${env('ACCOUNT_EMAIL_DOMAIN', 'players.redstring.local')}`;
}

const isTaken = (error: { code?: string; message: string }) =>
  error.code === 'email_exists' || error.code === 'user_already_exists' || /already (been )?registered|already exists/i.test(error.message);

/** A new name for the signed-in player: the internal address and the name in the metadata change together. */
async function rename(req: Request, input: unknown): Promise<Response> {
  const parsed = Rename.safeParse(input);
  if (!parsed.success) return errorResponse(req, 400, 'bad_request', 'Names are 3 to 20 letters, digits or underscores.');
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: who, error: authError } = token ? await admin.auth.getUser(token) : { data: { user: null }, error: null };
  const user = who.user;
  if (authError || !user) return errorResponse(req, 401, 'unauthorized', 'Sign in again.');

  const username = parsed.data.username;
  if (user.email === accountEmail(username)) return json(req, { ok: true, username });

  const rl = await allowSignup(`user:${user.id}`, 'rename', RENAME_LIMITS);
  if (!rl.allowed) {
    return errorResponse(req, 429, 'rate_limited', 'Too many new names. Try again later.', {
      'Retry-After': String(rl.retryAfterSeconds),
    });
  }
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: accountEmail(username),
    email_confirm: true,
    user_metadata: { ...(user.user_metadata ?? {}), username },
  });
  if (error) {
    if (isTaken(error)) return errorResponse(req, 409, 'username_taken', 'That name is already on file. Pick another.');
    console.error('rename failed', error.status, error.message);
    return errorResponse(req, 500, 'server_error', 'Could not change the name. Try again in a moment.');
  }
  return json(req, { ok: true, username });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  if (req.method !== 'POST') return errorResponse(req, 405, 'bad_request', 'Use POST.');

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return errorResponse(req, 400, 'bad_request', 'Send JSON.');
  }
  if ((input as { action?: unknown } | null)?.action === 'rename') {
    try {
      return await rename(req, input);
    } catch (err) {
      console.error('rename error', err);
      return errorResponse(req, 500, 'server_error', 'Could not change the name. Try again in a moment.');
    }
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(input);
  } catch {
    return errorResponse(
      req,
      400,
      'bad_request',
      'Names are 3 to 20 letters, digits or underscores. Passwords are 8 to 72 characters.',
    );
  }

  try {
    const ipKey = `ip:${await sha256Hex(clientIp(req))}`;
    const rl = await allowSignup(ipKey);
    if (!rl.allowed) {
      return errorResponse(req, 429, 'rate_limited', 'Too many new accounts from this network. Try again later.', {
        'Retry-After': String(rl.retryAfterSeconds),
      });
    }

    const { error } = await admin.auth.admin.createUser({
      email: accountEmail(body.username),
      password: body.password,
      email_confirm: true,
      user_metadata: { username: body.username },
    });
    if (error) {
      if (isTaken(error)) return errorResponse(req, 409, 'username_taken', 'That name is already on file. Pick another.');
      if (/password/i.test(error.message)) return errorResponse(req, 400, 'bad_request', error.message);
      console.error('createUser failed', error.status, error.message);
      return errorResponse(req, 500, 'server_error', 'Could not open the file. Try again in a moment.');
    }
    return json(req, { ok: true, username: body.username });
  } catch (err) {
    console.error('account error', err);
    return errorResponse(req, 500, 'server_error', 'Could not open the file. Try again in a moment.');
  }
});
