// Accounts and cloud saves, with Supabase mocked in the page: nothing leaves the browser.
// Covers: start-up screen, guest save, sign-up (guest save goes up), sign-out (device cleared),
// sign-in (saves come back), and the loading screens' minimum times.
import { test, expect, type Page, type Route } from '@playwright/test';

interface Account {
  id: string;
  password: string;
  /** What the account remembers besides saves (user_metadata.prefs). */
  prefs?: Record<string, unknown>;
}

/** A tiny stand-in for Supabase Auth, the account function and the cloud_saves table. */
async function mockSupabase(page: Page) {
  const accounts = new Map<string, Account>();
  const saves = new Map<string, Map<number, unknown>>();
  const upserts: Array<{ slot: number }> = [];

  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const userOf = (email: string, acc: Account) => ({
    id: acc.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    user_metadata: { username: email.split('@')[0], ...(acc.prefs ? { prefs: acc.prefs } : {}) },
    app_metadata: {},
    created_at: new Date().toISOString(),
  });
  const session = (email: string, acc: Account) => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const user = userOf(email, acc);
    return {
      access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: acc.id, exp, role: 'authenticated', aud: 'authenticated', email })}.sig`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      refresh_token: `r-${acc.id}`,
      user,
    };
  };
  const tokenUser = (route: Route) => {
    const auth = route.request().headers()['authorization'] ?? '';
    const payload = auth.split(' ')[1]?.split('.')[1];
    if (!payload) return null;
    try {
      return (JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub?: string }).sub ?? null;
    } catch {
      return null;
    }
  };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
  const reply = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  await page.route('**/functions/v1/account', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const { username, password } = JSON.parse(route.request().postData() ?? '{}') as { username: string; password: string };
    const email = `${username}@players.redstring.local`;
    if (accounts.has(email)) return reply(route, 409, { error: { code: 'username_taken', message: 'That name is already on file. Pick another.' } });
    accounts.set(email, { id: `00000000-0000-4000-8000-00000000000${accounts.size + 1}`, password });
    return reply(route, 200, { ok: true, username });
  });

  await page.route('**/auth/v1/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    if (url.pathname.endsWith('/token')) {
      const { email, password } = JSON.parse(req.postData() ?? '{}') as { email: string; password: string };
      const acc = accounts.get(email);
      if (!acc || acc.password !== password) return reply(route, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      return reply(route, 200, session(email, acc));
    }
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers: cors });
    if (url.pathname.endsWith('/user')) {
      // GET the signed-in user, or PUT new metadata (merged, as Supabase does).
      const uid = tokenUser(route);
      const entry = [...accounts.entries()].find(([, a]) => a.id === uid);
      if (!entry) return reply(route, 401, { message: 'not signed in' });
      const [email, acc] = entry;
      if (req.method() === 'PUT') {
        const { data } = JSON.parse(req.postData() ?? '{}') as { data?: { prefs?: Record<string, unknown> } };
        if (data?.prefs) acc.prefs = data.prefs;
      }
      return reply(route, 200, userOf(email, acc));
    }
    return reply(route, 200, {});
  });

  await page.route('**/rest/v1/cloud_saves**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const uid = tokenUser(route);
    if (!uid) return reply(route, 401, { message: 'no auth' });
    const mine = saves.get(uid) ?? new Map<number, unknown>();
    saves.set(uid, mine);
    if (req.method() === 'GET') return reply(route, 200, [...mine.entries()].map(([slot, data]) => ({ slot, data })));
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() ?? '{}') as { slot: number; data: unknown } | Array<{ slot: number; data: unknown }>;
      for (const row of Array.isArray(body) ? body : [body]) {
        mine.set(row.slot, row.data);
        upserts.push({ slot: row.slot });
      }
      return reply(route, 201, []);
    }
    if (req.method() === 'DELETE') {
      const slot = Number(new URL(req.url()).searchParams.get('slot')?.replace('eq.', ''));
      mine.delete(slot);
      return reply(route, 204, null);
    }
    return reply(route, 405, {});
  });

  return { accounts, saves, upserts };
}

async function quiet(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('redstring.settings')) {
      localStorage.setItem('redstring.settings', JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }));
    }
  });
}

const slotKeys = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage).filter((k) => /^redstring\.save\.\d$/.test(k)).sort());

test('start-up screen shows for at least 1.5 seconds', async ({ page }) => {
  await quiet(page);
  await mockSupabase(page);
  const started = Date.now();
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeVisible();
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  expect(Date.now() - started).toBeGreaterThanOrEqual(1500);
  await expect(page.getByTestId('loading-screen')).toHaveCount(0);
});

test('guest save moves into a new account, leaves on sign-out and returns on sign-in', async ({ page }) => {
  await quiet(page);
  const backend = await mockSupabase(page);
  await page.goto('/');
  await expect(page.getByTestId('account-chip')).toContainText('Guest');

  // A guest opens a case: the launch screen stays up for at least 2 seconds.
  await page.getByTestId('menu-story-cases').click();
  await expect(page).toHaveURL(/\/cases$/);
  const opened = Date.now();
  await page.getByRole('button', { name: /^Open case: Ashgrove House/ }).click();
  await expect(page.getByTestId('loading-screen')).toBeVisible();
  await expect(page).toHaveURL(/\/case\/ashgrove-house\/briefing$/);
  expect(Date.now() - opened).toBeGreaterThanOrEqual(2000);
  expect(await slotKeys(page)).toEqual(['redstring.save.1']);

  // Sign up: the guest save is uploaded to the new account.
  await page.goto('/account');
  await page.getByTestId('account-tab-signup').click();
  await page.getByTestId('account-username').fill('Sam_Spade');
  await page.getByTestId('account-password').fill('test-password-1');
  await page.getByTestId('account-confirm').fill('test-password-1');
  await page.getByTestId('account-submit').click();
  await expect(page.getByRole('heading', { name: 'sam_spade' })).toBeVisible();
  await expect.poll(() => backend.upserts.map((u) => u.slot)).toContain(1);

  // Sign out: the device goes back to guest with no saves on it.
  await page.getByTestId('account-signout').click();
  await expect(page.getByTestId('account-submit')).toBeVisible();
  expect(await slotKeys(page)).toEqual([]);

  // Sign in again: the save comes back from the cloud.
  await page.getByTestId('account-username').fill('SAM_SPADE');
  await page.getByTestId('account-password').fill('wrong-password');
  await page.getByTestId('account-submit').click();
  await expect(page.getByRole('alert')).toContainText('do not match');
  await page.getByTestId('account-password').fill('test-password-1');
  await page.getByTestId('account-submit').click();
  await expect(page.getByRole('heading', { name: 'sam_spade' })).toBeVisible();
  expect(await slotKeys(page)).toEqual(['redstring.save.1']);

  await page.goto('/');
  await expect(page.getByTestId('account-chip')).toContainText('sam_spade');
  // Continue picks up the case that came back from the cloud.
  await expect(page.getByTestId('menu-continue')).toBeEnabled();
  await page.getByTestId('menu-continue').click();
  await expect(page).toHaveURL(/\/case\/ashgrove-house\//);
});

test('the account remembers the language and the tutorial, so another computer skips the first-start popups', async ({ page }) => {
  const backend = await mockSupabase(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('fresh')) return;
    sessionStorage.setItem('fresh', '1');
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByTestId('first-run-language-de').click();
  // Open an account straight from the popup.
  const popup = page.getByTestId('first-run-account');
  await popup.getByTestId('account-username').fill('marlowe');
  await popup.getByTestId('account-password').fill('a-long-password');
  await popup.getByTestId('account-confirm').fill('a-long-password');
  await popup.getByTestId('account-submit').click();
  await expect(page.getByTestId('first-run-tutorial')).toBeVisible();
  await page.getByTestId('first-run-skip-tutorial').click();
  await expect.poll(() => backend.accounts.get('marlowe@players.redstring.local')?.prefs).toEqual({ language: 'de', tutorialSeen: true });

  // Another computer: nothing on it yet. The storage is wiped as the page loads, before the game
  // starts (the running game would write its session back). Then sign in from the account popup.
  await page.evaluate(() => sessionStorage.removeItem('fresh'));
  await page.reload();
  await page.getByTestId('first-run-language-en').click();
  const again = page.getByTestId('first-run-account');
  await again.getByRole('tab', { name: 'Sign in' }).click();
  await again.getByTestId('account-username').fill('marlowe');
  await again.getByTestId('account-password').fill('a-long-password');
  await again.getByTestId('account-submit').click();
  // The account's language comes back and the tutorial is not offered again.
  await expect(page.getByTestId('menu-story-cases')).toContainText('Fälle');
  await expect(page.getByTestId('first-run-tutorial')).toHaveCount(0);
});
