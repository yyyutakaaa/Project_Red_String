// The commissioner's tips: the tip just taken stands on its own, the list below holds only the earlier ones.
import { test, expect } from '@playwright/test';

test('each tip shows once in the tip window', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('redstring.settings')) {
      localStorage.setItem('redstring.settings', JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }));
      localStorage.setItem('redstring.language', 'en');
    }
  });
  await page.goto('/case/tutorial/notebook');
  await page.locator('[data-tour="hint"]').click();
  const dialog = page.getByRole('dialog');
  const take = dialog.getByRole('button', { name: /take a hint/i });

  // First tip: shown on top, no list yet.
  await take.click();
  await expect(dialog.getByTestId('hint-text')).toContainText('Start in the lobby');
  await expect(dialog.locator('ol li')).toHaveCount(0);

  // Second tip: the new one on top, only the first in the list.
  await take.click();
  await expect(dialog.getByTestId('hint-text')).toContainText("Walter Finch's diary");
  await expect(dialog.locator('ol li')).toHaveCount(1);
  await expect(dialog.locator('ol li')).toContainText('Start in the lobby');

  // Closed and opened again: no tip on top, both in the list.
  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await page.locator('[data-tour="hint"]').click();
  await expect(dialog.getByTestId('hint-text')).toHaveCount(0);
  await expect(dialog.locator('ol li')).toHaveCount(2);
});
