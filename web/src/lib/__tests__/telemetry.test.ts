import { describe, expect, it } from 'vitest';
import { BATCH_MAX, EventQueue, FLUSH_MS, QUEUE_MAX, cleanProps, track, type Batch, type SendResult } from '../telemetry.ts';
import { DEFAULT_SETTINGS, parseSettings } from '../../store/settings.ts';

const DEVICE = '11111111-2222-4333-8444-555555555555';
const SESSION = '66666666-7777-4888-9999-000000000000';

/** A queue with a fake clock, fake timers and a transport that answers from a script. */
function harness(answers: Array<SendResult | 'hang'> = [], enabled = true) {
  const sent: Array<{ batch: Batch; keepalive: boolean }> = [];
  const timers: Array<{ fn: () => void; ms: number; live: boolean }> = [];
  const state = { enabled };
  let clock = 1_000;
  const queue = new EventQueue({
    transport: (batch, { keepalive }) => {
      sent.push({ batch, keepalive });
      const answer = answers.shift() ?? 'sent';
      // 'hang': a request still on its way when the page goes away.
      return answer === 'hang' ? new Promise<SendResult>(() => {}) : Promise.resolve(answer);
    },
    enabled: () => state.enabled,
    deviceId: () => DEVICE,
    sessionId: SESSION,
    app: { version: 'abc123', platform: 'web' },
    now: () => clock++,
    schedule: (fn, ms) => {
      const t = { fn, ms, live: true };
      timers.push(t);
      return t;
    },
    cancel: (h) => {
      (h as { live: boolean }).live = false;
    },
  });
  /** Run the timers that are due, as the browser would. */
  const fire = async () => {
    for (const t of timers.splice(0)) if (t.live) t.fn();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { queue, sent, timers, fire, state };
}

describe('EventQueue', () => {
  it('batches events and sends them when the timer fires', async () => {
    const h = harness();
    h.queue.track('case_start', 'ashgrove-house', { replay: false });
    h.queue.track('room_open', 'ashgrove-house', { room: 'study' });
    expect(h.sent).toHaveLength(0);
    expect(h.timers[0]?.ms).toBe(FLUSH_MS);
    await h.fire();
    expect(h.sent).toHaveLength(1);
    const batch = h.sent[0]!.batch;
    expect(batch).toMatchObject({ device_id: DEVICE, session_id: SESSION, app: { version: 'abc123', platform: 'web' } });
    expect(batch.events.map((e) => [e.name, e.case, e.seq])).toEqual([
      ['case_start', 'ashgrove-house', 0],
      ['room_open', 'ashgrove-house', 1],
    ]);
    expect(batch.events[1]!.props).toEqual({ room: 'study' });
    expect(h.queue.size).toBe(0);
  });

  it('sends at once when a full batch is waiting', async () => {
    const h = harness();
    for (let i = 0; i < BATCH_MAX; i++) h.queue.track('screen', 'ashgrove-house', { screen: 'rooms' });
    await new Promise((r) => setTimeout(r, 0));
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]!.batch.events).toHaveLength(BATCH_MAX);
  });

  it('keeps events after a network failure and backs off', async () => {
    const h = harness(['failed', 'sent']);
    h.queue.track('hint_used', 'ashgrove-house', { n: 1 });
    await h.fire();
    expect(h.sent).toHaveLength(1);
    expect(h.queue.size).toBe(1);
    expect(h.timers.at(-1)?.ms).toBe(FLUSH_MS * 2);
    await h.fire();
    expect(h.sent).toHaveLength(2);
    expect(h.sent[1]!.batch.events[0]!.name).toBe('hint_used');
    expect(h.queue.size).toBe(0);
  });

  it('drops a batch the server refuses', async () => {
    const h = harness(['rejected']);
    h.queue.track('question', 'ashgrove-house', { suspect: 'a' });
    await h.fire();
    expect(h.sent).toHaveLength(1);
    expect(h.queue.size).toBe(0);
    expect(h.timers.filter((t) => t.live)).toHaveLength(0);
  });

  it('never holds more than QUEUE_MAX events, dropping the oldest', async () => {
    const h = harness(Array(20).fill('failed') as SendResult[]);
    for (let i = 0; i < QUEUE_MAX + 25; i++) h.queue.track('screen', 'ashgrove-house', { n: i });
    await new Promise((r) => setTimeout(r, 0));
    expect(h.queue.size).toBeLessThanOrEqual(QUEUE_MAX);
  });

  it('sends everything with keepalive when the page goes away, without waiting', async () => {
    const h = harness(['hang']);
    // The first full batch is still on its way, so the rest piles up behind it.
    for (let i = 0; i < BATCH_MAX * 2 + 5; i++) h.queue.track('screen', 'ashgrove-house', { n: i });
    await new Promise((r) => setTimeout(r, 0));
    expect(h.sent).toHaveLength(1);
    h.sent.length = 0;
    await h.queue.flush(true);
    expect(h.sent.every((s) => s.keepalive)).toBe(true);
    expect(h.sent.reduce((n, s) => n + s.batch.events.length, 0)).toBe(BATCH_MAX + 5);
    expect(h.queue.size).toBe(0);
  });

  it('records and sends nothing while switched off, and clears what was waiting', async () => {
    const h = harness();
    h.queue.track('case_start', 'ashgrove-house');
    h.state.enabled = false;
    h.queue.track('room_open', 'ashgrove-house', { room: 'study' });
    await h.fire();
    expect(h.sent).toHaveLength(0);
    expect(h.queue.size).toBe(0);
  });

  it('leaves out a case key the server would refuse', () => {
    const h = harness();
    h.queue.track('screen', 'Not A Key!', { screen: 'board' });
    h.queue.clear();
    expect(h.queue.size).toBe(0);
  });
});

describe('cleanProps', () => {
  it('keeps short values and drops what the server would refuse', () => {
    expect(
      cleanProps({
        suspect: 'mara-vance',
        clues: 2,
        silent: false,
        shown: null,
        skipped: undefined,
        BadKey: 'x',
        endless: Number.POSITIVE_INFINITY,
        long: 'x'.repeat(200),
      }),
    ).toEqual({ suspect: 'mara-vance', clues: 2, silent: false, shown: null, endless: null, long: 'x'.repeat(80) });
  });

  it('keeps at most twelve props', () => {
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${'abcdefghijklmnopqrst'[i]}`, i]));
    expect(Object.keys(cleanProps(many))).toHaveLength(12);
  });
});

describe('the game queue outside a browser', () => {
  it('does nothing', () => {
    expect(() => track('app_open')).not.toThrow();
  });
});

describe('play statistics setting', () => {
  it('is on by default and survives a round trip', () => {
    expect(DEFAULT_SETTINGS.shareStats).toBe(true);
    expect(parseSettings(null).shareStats).toBe(true);
    expect(parseSettings(JSON.stringify({ shareStats: false })).shareStats).toBe(false);
    expect(parseSettings(JSON.stringify({ shareStats: 'nope' })).shareStats).toBe(true);
  });
});
