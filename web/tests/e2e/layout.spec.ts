// The game is one screen: the page never scrolls, each screen scrolls its own panels, and a window
// smaller than the game needs gets a notice over everything.
import { test, expect, type Page } from '@playwright/test';

const SCREENS = ['/', '/cases', '/slots', '/settings', '/credits', '/case/ashgrove-house/briefing', '/case/ashgrove-house/rooms', '/case/ashgrove-house/suspects', '/case/ashgrove-house/notebook', '/case/ashgrove-house/board', '/case/ashgrove-house/accuse'];

async function pageOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    return { page: doc.scrollHeight - doc.clientHeight, body: document.body.scrollHeight - document.body.clientHeight };
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/functions/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.addInitScript(() => {
    localStorage.setItem('redstring.settings', JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }));
  });
});

test('no screen makes the page scroll; the briefing paper scrolls instead', async ({ page }) => {
  for (const path of SCREENS) {
    await page.goto(path);
    // The case opens with its comic strip; skip it to reach the briefing.
    if (path.endsWith('/briefing')) await page.getByTestId('cutscene-skip').click();
    await expect(page.locator('h1').first()).toBeVisible();
    const o = await pageOverflow(page);
    expect(o.page, `page scrolls on ${path}`).toBeLessThanOrEqual(0);
    expect(o.body, `body scrolls on ${path}`).toBeLessThanOrEqual(0);
  }
  await page.goto('/case/ashgrove-house/briefing');
  const paper = page.getByTestId('briefing-paper');
  const { scrolls } = await paper.evaluate((el) => ({ scrolls: el.scrollHeight > el.clientHeight }));
  if (scrolls) {
    await paper.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => paper.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect((await pageOverflow(page)).page).toBeLessThanOrEqual(0);
  }
});

test('a window that is too small gets a notice, and it goes when the window grows', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('too-small')).toHaveCount(0);
  await page.setViewportSize({ width: 800, height: 500 });
  await expect(page.getByTestId('too-small')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId('too-small')).toHaveCount(0);
});
