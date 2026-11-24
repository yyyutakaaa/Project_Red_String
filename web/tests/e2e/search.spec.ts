import { expect, test } from '@playwright/test';

// The rooms do not point at their clues: the places worth searching have no outline, no name and
// no Tab stop, ordinary things are drawn alongside them, and every click gets an answer.

test('a room answers every click and marks none of its clues', async ({ page }) => {
  await page.goto('/case/ashgrove-house/room/study');
  const area = page.getByTestId('search-area');
  await expect(area).toBeVisible();

  // Not named, not reachable with Tab.
  await expect(page.getByTestId('hotspot-brandy-glass')).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('button', { name: 'Brandy glass' })).toHaveCount(0);

  // The bare wall at the far left holds nothing.
  const box = (await area.boundingBox())!;
  await area.click({ position: { x: box.width * 0.02, y: box.height * 0.5 } });
  await expect(page.getByTestId('search-miss')).toBeVisible();

  // The glass does.
  await page.getByTestId('hotspot-brandy-glass').click();
  await expect(page.getByTestId('hotspot-description')).toContainText('Brandy glass');
  await expect(page.getByTestId('search-miss')).toHaveCount(0);

  // Keyboard: aim with the arrows, look with Enter.
  await area.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('hotspot-description')).not.toContainText('Brandy glass');
});

test('with the search aid on, the places are named and reachable', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('redstring.settings', JSON.stringify({ searchAid: true })));
  await page.goto('/case/ashgrove-house/room/study');
  await expect(page.getByRole('button', { name: 'Brandy glass' })).toBeVisible();
  await expect(page.getByTestId('search-area')).toHaveCount(0);
});
