// Full playthrough of case 1 ("Ashgrove House") with the interrogate endpoint mocked.
// The solution path is derived from the case JSON, so the test keeps working when the case is edited:
// collect every hotspot, interrogate, show evidence to unlock suspect-held proof, connect the board,
// accuse with the required evidence and check the ending, the score and the save.
import { test, expect, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface Clue { clue_id: string; condition: string; evidence_id?: string | null; text: string }
interface Suspect { id: string; name: string; patience: number; revealable_clues: Clue[] }
interface CaseJson {
  id: string;
  title: string;
  solution: { culprit_id: string; required_evidence: string[] };
  rooms: Array<{ id: string; name: string; hotspots: Array<{ id: string; label: string; evidence_id: string | null }> }>;
  evidence: Array<{ id: string; name: string; found_in: string }>;
  suspects: Suspect[];
}

const here = path.dirname(fileURLToPath(import.meta.url));
const c = JSON.parse(readFileSync(path.resolve(here, '../../src/cases/ashgrove-house.json'), 'utf8')) as CaseJson;

/** Mock of the interrogate function: deterministic replies, clue reveals for shown evidence. */
async function mockInterrogate(page: Page, calls: Array<Record<string, unknown>>) {
  const used = new Map<string, number>();
  await page.route('**/functions/v1/interrogate', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    if (req.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    const body = JSON.parse(req.postData() ?? '{}') as { suspect_id: string; shown_evidence_id: string | null; message: string; save_id: string };
    calls.push(body);
    const suspect = c.suspects.find((s) => s.id === body.suspect_id)!;
    const n = (used.get(suspect.id) ?? 0) + 1;
    used.set(suspect.id, n);
    const revealed = suspect.revealable_clues
      .filter((cl) => (body.shown_evidence_id ? cl.condition === `shown_evidence:${body.shown_evidence_id}` : cl.condition === 'free'))
      .map((cl) => cl.clue_id);
    const reply = body.shown_evidence_id
      ? `*stares at it* All right, Detective. You had better hear the rest of it.`
      : `It was a long evening, Detective. I told the constable everything I know.`;
    const words = reply.split(' ');
    const events = words.map((w, i) => `event: delta\ndata: ${JSON.stringify({ text: (i ? ' ' : '') + w })}\n\n`).join('');
    const final = {
      reply,
      revealed_clue_ids: revealed,
      mood: body.shown_evidence_id ? 'nervous' : 'calm',
      patience_used: n,
      patience_max: suspect.patience,
      silent: false,
    };
    return route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
      body: `${events}event: final\ndata: ${JSON.stringify(final)}\n\n`,
    });
  });
}

async function ask(page: Page, text: string) {
  await page.getByTestId('question-input').fill(text);
  await page.getByTestId('send-question').click();
  await expect(page.getByTestId('chat-message').filter({ hasText: 'Detective' }).last().or(page.getByTestId('chat-message').last())).toBeVisible();
  await expect(page.getByTestId('waiting-indicator')).toHaveCount(0, { timeout: 15_000 });
}

test('case 1 can be solved end to end with the interrogation mocked', async ({ page }) => {
  const calls: Array<Record<string, unknown>> = [];
  await mockInterrogate(page, calls);
  await page.addInitScript(() => {
    // Instant text and no animations make the run deterministic.
    if (!localStorage.getItem('redstring.settings')) {
      localStorage.setItem('redstring.settings', JSON.stringify({ textSpeed: 'instant', reducedMotion: 'reduced', masterVolume: 0, musicVolume: 0, sfxVolume: 0, fontSize: 'medium' }));
    }
  });

  // Main menu -> story cases -> case 1 briefing
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Project Red String/i })).toBeVisible();
  await page.getByRole('button', { name: /story cases/i }).or(page.getByRole('link', { name: /story cases/i })).first().click();
  await page.getByTestId(`open-case-${c.id}`).click();
  await expect(page.getByText(c.title).first()).toBeVisible();
  await page.getByTestId('begin-investigation').click();

  // Search every room and every hotspot.
  for (const room of c.rooms) {
    await page.goto(`/case/${c.id}/room/${room.id}`);
    await expect(page.getByRole('heading', { name: room.name }).first()).toBeVisible();
    for (const h of room.hotspots) {
      await page.getByTestId(`hotspot-${h.id}`).click();
      await expect(page.getByTestId('hotspot-description')).toContainText(h.label);
    }
  }
  const roomEvidence = c.rooms.flatMap((r) => r.hotspots.map((h) => h.evidence_id).filter(Boolean)) as string[];
  await expect(page.getByTestId('clue-counter')).toContainText(String(roomEvidence.length));

  // Interrogate every suspect once, then show evidence that unlocks suspect-held required proof.
  for (const s of c.suspects) {
    await page.goto(`/case/${c.id}/interrogate/${s.id}`);
    await expect(page.getByTestId('patience-meter')).toBeVisible();
    await ask(page, 'Where were you when it happened?');
    await expect(page.getByTestId('chat-message').last()).toContainText('long evening');
  }
  const unlocks = c.suspects.flatMap((s) =>
    s.revealable_clues
      .filter((cl) => cl.condition.startsWith('shown_evidence:') && cl.evidence_id && c.solution.required_evidence.includes(cl.evidence_id))
      .map((cl) => ({ suspect: s, shown: cl.condition.slice('shown_evidence:'.length), grants: cl.evidence_id! })),
  );
  for (const u of unlocks) {
    await page.goto(`/case/${c.id}/interrogate/${u.suspect.id}`);
    await page.getByTestId('show-evidence-button').click();
    await page.getByTestId(`pick-evidence-${u.shown}`).click();
    const confirm = page.getByRole('dialog').getByRole('button', { name: /show|attach|use|done/i });
    if (await confirm.count()) await confirm.first().click();
    await ask(page, 'Explain this.');
    await expect(page.getByTestId('toast-evidence').filter({ hasText: c.evidence.find((e) => e.id === u.grants)!.name }).first()).toBeVisible();
  }
  expect(calls.length).toBe(c.suspects.length + unlocks.length);
  expect(calls.every((b) => typeof b.save_id === 'string' && (b.save_id as string).length === 36)).toBe(true);

  // Red-string board: connect the culprit to one piece of required proof and check the theory.
  await page.goto(`/case/${c.id}/board`);
  const proof = c.solution.required_evidence.find((id) => roomEvidence.includes(id)) ?? c.solution.required_evidence[0]!;
  await page.getByTestId(`pin-${c.solution.culprit_id}`).click();
  await page.getByTestId(`pin-${proof}`).click();
  const linkId = [c.solution.culprit_id, proof].sort().join('~');
  await expect(page.getByTestId(`link-${linkId}`)).toBeAttached();
  await page.getByTestId('check-theory').click();
  await expect(page.getByTestId('theory-summary')).toContainText(/supported/i);

  // Notebook lists the evidence.
  await page.goto(`/case/${c.id}/notebook`);
  await expect(page.getByTestId('notebook-evidence')).toBeVisible();

  // Accuse the culprit with exactly the required evidence.
  await page.goto(`/case/${c.id}/accuse`);
  await page.getByTestId(`accuse-suspect-${c.solution.culprit_id}`).click();
  for (const id of c.solution.required_evidence) {
    const tile = page.getByTestId(`accuse-evidence-${id}`);
    const inner = tile.getByRole('button');
    if (await inner.count()) await inner.first().click();
    else await tile.click();
  }
  await page.getByTestId('submit-accusation').click();
  await page.getByTestId('confirm-accusation').click();

  await expect(page.getByTestId('ending-outcome')).toHaveAttribute('data-outcome', 'correct');
  await expect(page.getByTestId('final-score')).toContainText(/\d/);

  // The save survives a reload and the next case is unlocked.
  await page.goto('/cases');
  await expect(page.getByTestId('open-case-blue-lantern')).toBeEnabled();
  const saved = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('redstring.save.')));
  expect(saved.length).toBeGreaterThan(0);
});

test('interrogation shows a clear message when the backend is unreachable', async ({ page }) => {
  await page.route('**/functions/v1/interrogate', (route) => route.abort('internetdisconnected'));
  await page.goto('/');
  await page.getByRole('button', { name: /story cases/i }).or(page.getByRole('link', { name: /story cases/i })).first().click();
  await page.getByTestId(`open-case-${c.id}`).click();
  await page.getByTestId('begin-investigation').click();
  const s = c.suspects[0]!;
  await page.goto(`/case/${c.id}/interrogate/${s.id}`);
  await expect(page.getByTestId('offline-banner')).toBeVisible();
  // Rooms still work offline.
  const room = c.rooms[0]!;
  await page.goto(`/case/${c.id}/room/${room.id}`);
  await page.getByTestId(`hotspot-${room.hotspots[0]!.id}`).click();
  await expect(page.getByTestId('hotspot-description')).toBeVisible();
});
