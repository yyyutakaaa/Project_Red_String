// The first start: the language, the offer of an account, the offer of the tutorial, and the guide
// that walks a new player through the tutorial case. Also: returning players see none of it.
import { test, expect, type Page } from '@playwright/test';

const QUIET = { textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0 };

/** A brand-new player: nothing on this device yet. The settings land only after the popups. */
async function newPlayer(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('firstrun-cleared')) return;
    sessionStorage.setItem('firstrun-cleared', '1');
    localStorage.clear();
  });
}

test('a new player picks a language, plays as a guest and starts the tutorial with the guide', async ({ page }) => {
  await newPlayer(page);
  await page.goto('/');

  const language = page.getByTestId('first-run-language');
  await expect(language).toBeVisible();
  await expect(language).toContainText('Kies je taal');
  await page.getByTestId('first-run-language-nl').click();

  const account = page.getByTestId('first-run-account');
  await expect(account).toBeVisible();
  await expect(account).toContainText('Bewaar je voortgang');
  await page.getByTestId('first-run-guest').click();

  const tutorial = page.getByTestId('first-run-tutorial');
  await expect(tutorial).toBeVisible();
  await page.getByTestId('first-run-play-tutorial').click();

  // The tutorial case opens with its comic strip; the guide waits until it is over.
  await expect(page).toHaveURL(/\/case\/tutorial\/briefing$/);
  await expect(page.getByTestId('cutscene')).toBeVisible();
  await expect(page.getByTestId('tour')).toHaveCount(0);
  await page.getByTestId('cutscene-skip').click();
  await expect(page.getByTestId('cutscene')).toHaveCount(0);

  // Then the briefing, with the guide pointing at the button.
  const tour = page.getByTestId('tour');
  await expect(tour).toHaveAttribute('data-step', 'briefing');
  await expect(page.getByTestId('tour-title')).toHaveText('Dit is je dossier');

  await page.getByTestId('begin-investigation').click();
  await expect(tour).toHaveAttribute('data-step', 'rooms');
  await page.getByTestId('room-link-lobby').click();
  await expect(tour).toHaveAttribute('data-step', 'search');
  await page.getByTestId('hotspot-front-desk').click();
  await expect(tour).toHaveAttribute('data-step', 'found');

  // The guide folds away and comes back.
  await page.getByTestId('tour-hide').click();
  await expect(tour).toHaveCount(0);
  await page.getByTestId('tour-show').click();
  await expect(page.getByTestId('tour')).toHaveAttribute('data-step', 'found');

  // Back in the menu nothing asks again, and the tutorial has its own button.
  await page.goto('/');
  await expect(page.getByTestId('menu-tutorial')).toBeVisible();
  await expect(page.getByTestId('first-run-language')).toHaveCount(0);
  await expect(page.getByTestId('first-run-tutorial')).toHaveCount(0);
});

test('skipping the tutorial keeps it in the menu', async ({ page }) => {
  await newPlayer(page);
  await page.goto('/');
  await page.getByTestId('first-run-language-en').click();
  await page.getByTestId('first-run-guest').click();
  await page.getByTestId('first-run-skip-tutorial').click();
  await expect(page.getByTestId('first-run-tutorial')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('first-run-tutorial')).toHaveCount(0);
  await page.getByTestId('menu-tutorial').click();
  await expect(page).toHaveURL(/\/case\/tutorial\/briefing$/);
});

test('a returning player sees none of the first-start popups', async ({ page }) => {
  await page.addInitScript((s) => localStorage.setItem('redstring.settings', JSON.stringify(s)), QUIET);
  await page.goto('/');
  await expect(page.getByTestId('menu-story-cases')).toBeVisible();
  await expect(page.getByTestId('first-run-language')).toHaveCount(0);
  await expect(page.getByTestId('first-run-account')).toHaveCount(0);
  // All seven menu items, the tutorial among them, fit without scrolling.
  await expect(page.getByTestId('menu-tutorial')).toBeVisible();
  await expect(page.getByTestId('menu-credits')).toBeInViewport({ ratio: 1 });
  // (once the items have slid into place: their entrance animation moves them down a little)
  await expect.poll(() => page.locator('main').evaluate((m) => m.scrollHeight - m.clientHeight)).toBeLessThanOrEqual(1);
});
