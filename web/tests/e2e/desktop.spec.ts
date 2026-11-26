// The desktop bridge, simulated in the page: the banner that asks for a new installer, and the
// Discord settings that only exist in a desktop shell that supports them.
import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../desktop');

/** The same recipe as shellFingerprint() in desktop/main.cjs. */
function currentShellFingerprint(): string {
  const { files } = JSON.parse(readFileSync(path.join(desktopDir, 'shell-files.json'), 'utf8')) as { files: string[] };
  const hash = createHash('sha256');
  for (const name of files) {
    hash.update(`${name}\n`);
    hash.update(readFileSync(path.join(desktopDir, name), 'utf8').replace(/\r/g, ''));
    hash.update('\n');
  }
  return hash.digest('hex').slice(0, 16);
}

async function asDesktop(page: Page, bridge: Record<string, unknown>) {
  await page.addInitScript((b) => {
    localStorage.setItem('redstring.settings', JSON.stringify({ reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0 }));
    const presence: unknown[] = [];
    (window as unknown as { __presence: unknown[] }).__presence = presence;
    const full = { ...b } as Record<string, unknown>;
    if (b.withPresence) full.setPresence = (s: unknown) => presence.push(s);
    if (b.withUpdates) {
      // The updater's side of the popup: the test sends messages, the page answers.
      const answers: string[] = [];
      let send: ((m: unknown) => void) | null = null;
      const w = window as unknown as { __updateAnswers: string[]; __sendUpdate: (m: unknown) => void; __updateReady: number };
      w.__updateAnswers = answers;
      w.__sendUpdate = (m) => send?.(m);
      w.__updateReady = 0;
      // Each subscription is the page saying "the popup is up" to the shell.
      full.onUpdate = (cb: (m: unknown) => void) => {
        send = cb;
        w.__updateReady += 1;
        return () => undefined;
      };
      full.answerUpdate = (choice: string) => answers.push(choice);
    }
    if (b.withInstaller) {
      // The shell installs the new app itself: the page asks, the test plays the shell's answers.
      const asked: string[] = [];
      let send: ((m: unknown) => void) | null = null;
      const w = window as unknown as { __installAsked: string[]; __sendInstall: (m: unknown) => void };
      w.__installAsked = asked;
      w.__sendInstall = (m) => send?.(m);
      full.installShell = (fp: string) => asked.push(fp);
      full.onShellInstall = (cb: (m: unknown) => void) => {
        send = cb;
        return () => undefined;
      };
    }
    if (b.withDisplay) {
      // A shell with a fixed window: full screen goes through the shell and comes back as an event.
      let listener: ((on: boolean) => void) | null = null;
      full.onFullscreen = (cb: (on: boolean) => void) => {
        listener = cb;
        return () => undefined;
      };
      full.setFullscreen = (on: boolean) => listener?.(on);
    }
    (window as unknown as { redStringDesktop: unknown }).redStringDesktop = full;
  }, bridge);
}

test('an old app (no fingerprint) is asked to install the new version', async ({ page }) => {
  await asDesktop(page, { platform: 'darwin' });
  await page.goto('/');
  const notice = page.getByTestId('shell-notice');
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Later' }).click();
  await expect(notice).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('shell-notice')).toHaveCount(0);
});

test('an up-to-date app sees no banner, and gets Discord settings and status', async ({ page }) => {
  await asDesktop(page, { platform: 'darwin', withPresence: true, shell: { fingerprint: currentShellFingerprint(), version: '1.0.6' } });
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('shell-notice')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __presence: Array<{ details: string } | null> }).__presence.at(-1)?.details)).toBe('In the main menu');

  await page.goto('/settings');
  await page.getByTestId('settings-tab-discord').click();
  await expect(page.getByRole('heading', { name: 'Discord' })).toBeVisible();
  // Settings has more than one 'Hidden' option (Discord status, places to search): pick the Discord one.
  await page.getByRole('group', { name: 'Discord status' }).getByText('Hidden', { exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __presence: unknown[] }).__presence.at(-1))).toBeNull();
});

test('a browser shows neither', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByTestId('settings-tab-discord')).toHaveCount(0);
  await expect(page.getByTestId('settings-tab-display')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Discord' })).toHaveCount(0);
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('shell-notice')).toHaveCount(0);
});

test('a shell with a fixed window offers a window or full screen', async ({ page }) => {
  await asDesktop(page, { platform: 'win32', withDisplay: true, shell: { fingerprint: currentShellFingerprint(), version: '1.0.7' } });
  await page.goto('/settings');
  await page.getByTestId('settings-tab-display').click();
  const group = page.getByRole('group', { name: 'Display' });
  await expect(group.getByRole('radio', { name: /Window/ })).toBeChecked();
  await group.getByText('Full screen', { exact: true }).click();
  await expect(group.getByRole('radio', { name: /Full screen/ })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-fullscreen', '');
  await group.getByText('Window', { exact: true }).click();
  await expect(group.getByRole('radio', { name: /Window/ })).toBeChecked();
});

test('the updater speaks through the game popup: ready, update now, downloading, failed', async ({ page }) => {
  await asDesktop(page, { platform: 'darwin', withUpdates: true, shell: { fingerprint: currentShellFingerprint(), version: '1.0.7' } });
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  const send = (m: unknown) => page.evaluate((msg) => (window as unknown as { __sendUpdate: (x: unknown) => void }).__sendUpdate(msg), m);
  const answers = () => page.evaluate(() => (window as unknown as { __updateAnswers: string[] }).__updateAnswers);

  await send({ state: 'available' });
  const popup = page.getByTestId('update-popup');
  await expect(popup).toContainText('A new version is ready');
  await page.getByTestId('update-later').click();
  await expect(popup).toHaveCount(0);
  expect(await answers()).toEqual(['later']);

  await send({ state: 'available' });
  await page.getByTestId('update-now').click();
  expect(await answers()).toEqual(['later', 'now']);
  await send({ state: 'downloading', progress: 0.5 });
  await expect(popup.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  await send({ state: 'failed', detail: 'index.html: hash mismatch' });
  await expect(popup).toContainText('did not go through');
  await expect(popup).toContainText('hash mismatch');
  await popup.getByRole('button', { name: 'Keep playing' }).click();
  await expect(popup).toHaveCount(0);
});

test('the popup says it is up again after every screen change, and speaks the game language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('redstring.language', 'nl'));
  await asDesktop(page, { platform: 'darwin', withUpdates: true, shell: { fingerprint: currentShellFingerprint(), version: '1.0.7' } });
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  const ready = () => page.evaluate(() => (window as unknown as { __updateReady: number }).__updateReady);
  const before = await ready();
  expect(before).toBeGreaterThan(0);

  // An in-game navigation: older shells forget the popup here, so it has to announce itself again.
  await page.evaluate(() => {
    history.pushState({}, '', '/settings');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect.poll(ready, { timeout: 2_000 }).toBeGreaterThan(before);

  await page.evaluate(() => (window as unknown as { __sendUpdate: (x: unknown) => void }).__sendUpdate({ state: 'available' }));
  const popup = page.getByTestId('update-popup');
  await expect(popup).toContainText('Er ligt een nieuwe versie klaar');
  await expect(popup.getByTestId('update-now')).toHaveText('Nu bijwerken');
});

test('an app that can install itself downloads the new one in the game, with a progress bar', async ({ page }) => {
  await asDesktop(page, { platform: 'win32', withInstaller: true, shell: { fingerprint: 'oldshell00000000', version: '1.0.7' } });
  await page.goto('/');
  const notice = page.getByTestId('shell-notice');
  await expect(notice).toBeVisible();
  const send = (m: unknown) => page.evaluate((msg) => (window as unknown as { __sendInstall: (x: unknown) => void }).__sendInstall(msg), m);

  await notice.getByTestId('shell-install').click();
  const asked = await page.evaluate(() => (window as unknown as { __installAsked: string[] }).__installAsked);
  expect(asked).toEqual([currentShellFingerprint()]);
  await expect(notice.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await send({ state: 'downloading', progress: 0.42 });
  await expect(notice.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
  await expect(notice.getByRole('button')).toHaveCount(0);

  await send({ state: 'notReady', detail: 'The new app is still being built.' });
  await expect(notice).toContainText('still on its way');
  await notice.getByTestId('shell-install').click();
  await send({ state: 'failed', detail: 'Download failed (502)' });
  await expect(notice).toContainText('Download failed (502)');
  await send({ state: 'manual', detail: 'Move Red String to Applications first.' });
  await expect(notice.getByRole('button', { name: 'Open download page' })).toBeVisible();
  await send({ state: 'installing' });
  await expect(notice.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
});
