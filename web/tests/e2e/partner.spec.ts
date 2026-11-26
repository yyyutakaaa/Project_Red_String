// The partner and the strings the board ties by itself, in the tutorial case, played in Dutch.
// The interrogate and partner functions are mocked: this checks what the game sends them and what it
// shows, not the models.
import { test, expect, type Page, type Route } from '@playwright/test';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };

async function mockInterrogate(page: Page, calls: Array<Record<string, unknown>>) {
  await page.route('**/functions/v1/interrogate', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (req.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: '{"ok":true}' });
    calls.push(JSON.parse(req.postData() ?? '{}') as Record<string, unknown>);
    const final = { reply: 'Ik stond de hele nacht achter de balie, meneer. Eerlijk.', revealed_clue_ids: ['pike-desk'], mood: 'calm', patience_used: calls.length, patience_max: 16, silent: false };
    return route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', ...cors },
      body: `event: delta\ndata: ${JSON.stringify({ text: final.reply })}\n\nevent: final\ndata: ${JSON.stringify(final)}\n\n`,
    });
  });
}

async function setUp(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('redstring.settings')) {
      localStorage.setItem('redstring.settings', JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }));
      localStorage.setItem('redstring.language', 'nl');
    }
  });
}

async function questionPike(page: Page) {
  await page.goto('/case/tutorial/interrogate/pike');
  await page.getByTestId('question-input').fill('Waar was u om elf uur?');
  await page.getByTestId('send-question').click();
  await expect(page.getByTestId('waiting-indicator')).toHaveCount(0, { timeout: 15_000 });
}

test('Luna remarks on a find that does not fit what a suspect said, in the player\'s language', async ({ page }) => {
  const calls: Array<Record<string, unknown>> = [];
  const partnerCalls: Array<Record<string, unknown>> = [];
  await setUp(page);
  await mockInterrogate(page, calls);
  await page.route('**/functions/v1/partner', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    partnerCalls.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>);
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ line: 'Hm, wacht eens. Volgens Pike stond hij de hele tijd aan de balie.' }) });
  });

  await questionPike(page);
  // The suspect is told which language the player plays in.
  expect(calls[0]).toMatchObject({ language: 'nl', suspect_id: 'pike' });

  await page.goto('/case/tutorial/room/lobby');
  await page.getByTestId('hotspot-front-desk').click();
  const line = page.getByTestId('partner-line');
  await expect(line).toContainText('Volgens Pike stond hij de hele tijd aan de balie.');
  await expect(line).toHaveAttribute('data-kind', 'contradicts');
  expect(partnerCalls[0]).toMatchObject({ case_id: 'tutorial', kind: 'contradicts', suspect_id: 'pike', evidence_id: 'bell-note', language: 'nl' });

  // He says it once: searching the same place again brings no new remark.
  await line.getByRole('button').click();
  await expect(line).toHaveCount(0);
  await page.getByTestId('hotspot-front-desk').click();
  await page.waitForTimeout(800);
  expect(partnerCalls).toHaveLength(1);

  // What he said stays in the notebook, after the bubble is gone.
  await page.goto('/case/tutorial/notebook?tab=partner');
  await expect(page.getByRole('tabpanel')).toContainText('Volgens Pike stond hij de hele tijd aan de balie.');
});

test('without the partner function Luna uses the game\'s own line, and the board ties strings by itself', async ({ page }) => {
  await setUp(page);
  await mockInterrogate(page, []);
  await page.route('**/functions/v1/partner', (route) => route.fulfill({ status: 404, headers: cors, body: '' }));

  await questionPike(page);
  await page.goto('/case/tutorial/room/lobby');
  await page.getByTestId('hotspot-front-desk').click();
  await expect(page.getByTestId('partner-line')).toContainText('Dat is niet het verhaal dat Leonard Pike ons vertelde.');

  // The diary names Pike and the letter names Margaret: the board ties both by itself.
  await page.goto('/case/tutorial/room/office');
  await page.getByTestId('hotspot-writing-desk').click();
  await page.getByTestId('hotspot-wastebasket').click();
  await page.goto('/case/tutorial/board');
  await expect(page.getByTestId('link-finch-diary~pike')).toBeAttached();
  await expect(page.getByTestId('link-buyer-letter~margaret')).toBeAttached();
  await expect(page.getByTestId('link-bell-note~pike')).toHaveCount(0);

  // A string the player cuts stays cut.
  await page.locator('[data-remove-id="finch-diary~pike"]').click();
  await expect(page.getByTestId('link-finch-diary~pike')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('link-buyer-letter~margaret')).toBeAttached();
  await expect(page.getByTestId('link-finch-diary~pike')).toHaveCount(0);
});
