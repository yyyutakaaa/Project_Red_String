// The interrogation's helpers, with the interrogate endpoint mocked: suggested opening questions,
// the "nothing new" line for evidence that does not touch a suspect, pinning a statement and calling
// it a lie, and the board's count-only theory check.
import { test, expect, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CaseJson {
  id: string;
  title: string;
  victim: { name: string };
  solution: { culprit_id: string; required_evidence: string[] };
  rooms: Array<{ id: string; name: string; hotspots: Array<{ id: string; label: string; evidence_id: string | null }> }>;
  evidence: Array<{ id: string; name: string; points_to: string[] }>;
  suspects: Array<{ id: string; name: string; patience: number }>;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const c = JSON.parse(readFileSync(path.resolve(here, '../../src/cases/ashgrove-house.json'), 'utf8')) as CaseJson;
const STORY = 'I never left the drawing room all evening, Detective.';

interface Body {
  suspect_id: string;
  shown_evidence_id: string | null;
  challenge_statement?: string | null;
  message: string;
}

async function mockInterrogate(page: Page, calls: Body[]) {
  let n = 0;
  await page.route('**/functions/v1/interrogate', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    if (req.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    const body = JSON.parse(req.postData() ?? '{}') as Body;
    calls.push(body);
    n += 1;
    const lie = Boolean(body.challenge_statement);
    const reply = lie ? 'All right. I did leave the room.' : body.shown_evidence_id ? 'I have never seen that before.' : STORY;
    const final = {
      reply,
      revealed_clue_ids: [],
      mood: lie ? 'broken' : 'calm',
      patience_used: n,
      patience_max: 12,
      silent: false,
      evidence_effect: lie ? 'gave' : body.shown_evidence_id ? 'none' : null,
      challenge: lie ? 'caught' : null,
    };
    return route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
      body: `event: delta\ndata: ${JSON.stringify({ text: reply })}\n\nevent: final\ndata: ${JSON.stringify(final)}\n\n`,
    });
  });
}

async function send(page: Page) {
  await page.getByTestId('send-question').click();
  await expect(page.getByTestId('waiting-indicator')).toHaveCount(0, { timeout: 15_000 });
}

test('suggested questions, evidence that means nothing, a caught lie and a count-only board check', async ({ page }) => {
  const calls: Body[] = [];
  await mockInterrogate(page, calls);
  await page.addInitScript(() => {
    if (!localStorage.getItem('redstring.settings')) {
      localStorage.setItem(
        'redstring.settings',
        JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }),
      );
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /story cases/i }).or(page.getByRole('link', { name: /story cases/i })).first().click();
  await page.getByTestId(`open-case-${c.id}`).click();
  await page.getByTestId('cutscene-skip').click();
  await page.getByTestId('begin-investigation').click();

  // Find one piece of evidence that points at somebody.
  const culprit = c.suspects.find((s) => s.id === c.solution.culprit_id)!;
  const spot = c.rooms
    .flatMap((r) => r.hotspots.map((h) => ({ room: r, h })))
    .find(({ h }) => h.evidence_id && c.evidence.find((e) => e.id === h.evidence_id)?.points_to.includes(culprit.id))!;
  const evidence = c.evidence.find((e) => e.id === spot.h.evidence_id)!;
  await page.goto(`/case/${c.id}/room/${spot.room.id}`);
  await page.getByTestId(`hotspot-${spot.h.id}`).click();
  await expect(page.getByTestId('hotspot-description')).toContainText(spot.h.label);

  // A suggested question fills the box and can be changed before it is sent.
  await page.goto(`/case/${c.id}/interrogate/${culprit.id}`);
  const suggestions = page.getByTestId('suggested-questions');
  await expect(suggestions).toBeVisible();
  await suggestions.getByRole('button').first().click();
  await expect(page.getByTestId('question-input')).toHaveValue(new RegExp(c.victim.name));
  await send(page);
  await expect(page.getByTestId('chat-message').last()).toContainText('drawing room');
  await expect(suggestions).toHaveCount(0);

  // Evidence that means nothing to the suspect is marked as such.
  const attach = async () => {
    await page.getByTestId('show-evidence-button').click();
    await page.getByTestId(`pick-evidence-${evidence.id}`).click();
    const done = page.getByRole('dialog').getByRole('button', { name: /done/i });
    if (await done.count()) await done.first().click();
  };
  await attach();
  await send(page);
  await expect(page.getByTestId('evidence-effect')).toHaveAttribute('data-effect', 'none');
  await expect(page.getByTestId('evidence-effect')).toContainText(evidence.name);

  // Pin the first statement, put the evidence beside it and call the lie.
  await page.getByTestId('pin-statement').first().click();
  await expect(page.getByTestId('pinned-statement')).toContainText('drawing room');
  await expect(page.getByTestId('send-question')).toBeDisabled();
  await attach();
  await expect(page.getByTestId('send-question')).toHaveText(/call the lie/i);
  await send(page);
  expect(calls.at(-1)?.challenge_statement).toBe(STORY);
  expect(calls.at(-1)?.shown_evidence_id).toBe(evidence.id);
  await expect(page.getByTestId('lie-outcome')).toHaveAttribute('data-outcome', 'caught');
  await expect(page.getByTestId('pinned-statement')).toHaveCount(0);

  // The notebook keeps the caught lie and marks nothing as "nothing new" any more (they gave way).
  await page.goto(`/case/${c.id}/notebook?tab=suspects`);
  await expect(page.getByTestId(`caught-lies-${culprit.id}`)).toContainText('drawing room');
  await expect(page.getByTestId(`caught-lies-${culprit.id}`)).toContainText(evidence.name);

  // The board: a check gives totals only, marking the strings is the paid answer key.
  await page.goto(`/case/${c.id}/board`);
  await page.getByTestId(`pin-${culprit.id}`).click();
  await page.getByTestId(`pin-${evidence.id}`).click();
  const link = page.getByTestId(`link-${[culprit.id, evidence.id].sort().join('~')}`);
  await expect(link).toBeAttached();
  await expect(page.getByTestId('check-theory')).toContainText('3');
  await page.getByTestId('check-theory').click();
  await expect(page.getByTestId('theory-summary')).toContainText('1 of 1');
  await expect(link).toHaveAttribute('data-status', 'unchecked');
  await expect(page.getByTestId('check-theory')).toContainText('2');
  await page.getByTestId('mark-theory').click();
  await page.getByTestId('confirm-mark-theory').click();
  await expect(link).toHaveAttribute('data-status', 'supported');
});
