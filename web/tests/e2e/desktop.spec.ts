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
  await expect(page.getByRole('heading', { name: 'Discord' })).toHaveCount(0);
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('shell-notice')).toHaveCount(0);
});
