// Anonymous play statistics, so the cases can be tuned where players get stuck (supabase/functions/events).
//
// The game reports what a player does in a case: a room opened, evidence found, a question asked and
// what it revealed, a hint, a theory check, the accusation. Every event carries the random device id the
// game already uses for interrogations and a session id that lasts one launch. Never typed text, names
// or account details: props hold ids, counts and short labels only. Players can switch it off under
// Settings > Play statistics, and it stays off in development builds and under test automation.
import { BACKEND_CONFIGURED, FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from './config.ts';
import { browserStorage, getDeviceId, uuid } from '../engine/save.ts';
import { useSettings } from '../store/settings.ts';
import { desktop } from '../desktop/bridge.ts';

export type EventName =
  | 'app_open'
  | 'session_end'
  | 'case_start'
  | 'case_restart'
  | 'briefing_done'
  | 'screen'
  | 'room_open'
  | 'evidence_found'
  | 'question'
  | 'clue_revealed'
  | 'interrogation_error'
  | 'hint_used'
  | 'theory_checked'
  | 'accusation';

export type PropValue = string | number | boolean | null;
export type EventProps = Record<string, PropValue | undefined>;

export interface QueuedEvent {
  name: EventName;
  /** Client time in ms. */
  at: number;
  /** Order within this launch. */
  seq: number;
  case?: string;
  props?: Record<string, PropValue>;
}

export interface Batch {
  device_id: string;
  session_id: string;
  app: { version: string; platform: string };
  events: QueuedEvent[];
}

/** 'sent', 'rejected' (the server refused the batch: drop it) or 'failed' (keep it and try again later). */
export type SendResult = 'sent' | 'rejected' | 'failed';
export type Transport = (batch: Batch, opts: { keepalive: boolean }) => Promise<SendResult>;

export const FLUSH_MS = 15_000;
export const MAX_BACKOFF_MS = 120_000;
export const BATCH_MAX = 40;
export const QUEUE_MAX = 300;

// Same limits the events function enforces, so one odd value never gets a whole batch refused.
const PROP_KEY = /^[a-z_]{1,24}$/;
const MAX_PROPS = 12;
const MAX_STRING = 80;
const CASE_KEY = /^[a-z0-9-]{1,64}$/;

export function cleanProps(props: EventProps): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(out).length >= MAX_PROPS) break;
    if (!PROP_KEY.test(key) || value === undefined) continue;
    if (typeof value === 'string') out[key] = value.slice(0, MAX_STRING);
    else if (typeof value === 'number') out[key] = Number.isFinite(value) ? value : null;
    else out[key] = value;
  }
  return out;
}

export interface QueueOptions {
  transport: Transport;
  enabled: () => boolean;
  deviceId: () => string;
  sessionId: string;
  app: { version: string; platform: string };
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}

/** Collects events and sends them in batches: every FLUSH_MS, at BATCH_MAX events, and when the page goes away. */
export class EventQueue {
  private queue: QueuedEvent[] = [];
  private seq = 0;
  private timer: unknown = null;
  private sending = false;
  private delay = FLUSH_MS;
  private readonly now: () => number;
  private readonly schedule: (fn: () => void, ms: number) => unknown;
  private readonly cancel: (handle: unknown) => void;

  constructor(private readonly opts: QueueOptions) {
    this.now = opts.now ?? Date.now;
    this.schedule = opts.schedule ?? ((fn, ms) => setTimeout(fn, ms));
    this.cancel = opts.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  get size(): number {
    return this.queue.length;
  }

  track(name: EventName, caseKey?: string | null, props?: EventProps): void {
    if (!this.opts.enabled()) return;
    const event: QueuedEvent = { name, at: this.now(), seq: this.seq++ };
    if (caseKey && CASE_KEY.test(caseKey)) event.case = caseKey;
    if (props) {
      const clean = cleanProps(props);
      if (Object.keys(clean).length) event.props = clean;
    }
    this.queue.push(event);
    if (this.queue.length > QUEUE_MAX) this.queue.splice(0, this.queue.length - QUEUE_MAX);
    if (this.queue.length >= BATCH_MAX && !this.sending) void this.flush();
    else this.arm();
  }

  /** Forget everything not sent yet (the player switched statistics off). */
  clear(): void {
    this.queue = [];
    this.disarm();
  }

  /**
   * Send what is queued. With keepalive (the page is going away) every batch goes out at once and
   * nothing waits for an answer; otherwise batches go one by one and a failure keeps the rest for later.
   */
  async flush(keepalive = false): Promise<void> {
    this.disarm();
    if (!this.opts.enabled()) {
      this.queue = [];
      return;
    }
    if (keepalive) {
      while (this.queue.length) {
        const batch = this.batch(this.queue.splice(0, BATCH_MAX));
        void this.opts.transport(batch, { keepalive: true }).catch(() => 'failed');
      }
      return;
    }
    if (this.sending) return;
    this.sending = true;
    try {
      while (this.queue.length) {
        const events = this.queue.splice(0, BATCH_MAX);
        let result: SendResult;
        try {
          result = await this.opts.transport(this.batch(events), { keepalive: false });
        } catch {
          result = 'failed';
        }
        if (result === 'failed') {
          this.queue.unshift(...events);
          if (this.queue.length > QUEUE_MAX) this.queue.splice(0, this.queue.length - QUEUE_MAX);
          this.delay = Math.min(this.delay * 2, MAX_BACKOFF_MS);
          return;
        }
        this.delay = FLUSH_MS;
      }
    } finally {
      this.sending = false;
      if (this.queue.length) this.arm();
    }
  }

  private batch(events: QueuedEvent[]): Batch {
    return { device_id: this.opts.deviceId(), session_id: this.opts.sessionId, app: this.opts.app, events };
  }

  private arm(): void {
    if (this.timer !== null) return;
    this.timer = this.schedule(() => {
      this.timer = null;
      void this.flush();
    }, this.delay);
  }

  private disarm(): void {
    if (this.timer === null) return;
    this.cancel(this.timer);
    this.timer = null;
  }
}

// ---------------------------------------------------------------------------
// The game's own queue

const TEST_OVERRIDE_KEY = 'redstring.telemetry.test';

/** Set in a test or a local check to send events from a dev build or under automation. */
function testOverride(): boolean {
  try {
    return globalThis.localStorage?.getItem(TEST_OVERRIDE_KEY) === '1';
  } catch {
    return false;
  }
}

function allowed(forced: boolean): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!BACKEND_CONFIGURED || !useSettings.getState().shareStats) return false;
  if (forced) return true;
  // Playwright and other drivers set navigator.webdriver: test runs never reach the live table.
  if (navigator.webdriver) return false;
  return import.meta.env.PROD || import.meta.env.VITE_TELEMETRY === '1';
}

function platformName(): string {
  const shell = desktop();
  return shell ? `desktop-${shell.platform}`.slice(0, 20) : 'web';
}

const fetchTransport: Transport = async (batch, { keepalive }) => {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(batch),
      keepalive,
    });
    if (res.ok) return 'sent';
    return res.status >= 500 ? 'failed' : 'rejected';
  } catch {
    return 'failed';
  }
};

let queue: EventQueue | null = null;

function gameQueue(): EventQueue | null {
  if (typeof window === 'undefined') return null;
  if (!queue) {
    const forced = testOverride();
    queue = new EventQueue({
      transport: fetchTransport,
      enabled: () => allowed(forced),
      deviceId: () => getDeviceId(browserStorage()),
      sessionId: uuid(),
      app: { version: __APP_COMMIT__, platform: platformName() },
    });
  }
  return queue;
}

/** Record one thing the player did. Does nothing when statistics are off. */
export function track(name: EventName, caseKey?: string | null, props?: EventProps): void {
  gameQueue()?.track(name, caseKey, props);
}

let started = false;

/** Call once at start-up: records the launch and sends what is left when the page goes away. */
export function initTelemetry(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  track('app_open', null, { theme: document.documentElement.dataset.theme ?? null });

  // Hiding the page is the last moment a phone reliably lets a page talk; pagehide covers closing.
  let away = false;
  const leave = () => {
    if (away) return;
    away = true;
    track('session_end');
    void gameQueue()?.flush(true);
  };
  window.addEventListener('pagehide', leave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave();
    else away = false;
  });

  useSettings.subscribe((now, before) => {
    if (before.shareStats && !now.shareStats) gameQueue()?.clear();
  });
}
