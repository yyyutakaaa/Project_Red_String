// Start-up: everything the menu needs before it appears, with a floor of BOOT_MIN_MS so the
// loading screen never just flashes. Runs once per page load; progress goes to a small store.
import { create } from 'zustand';
import { useAccount } from '../store/account.ts';
import { initialLanguage, setLanguage, type MessageKey } from '../i18n/index.ts';
import { markSeen, seenBefore, skippableDelay } from './skip.ts';

export const BOOT_MIN_MS = 1500;

interface BootState {
  progress: number;
  status: MessageKey;
  done: boolean;
  /** The player has seen the start-up screen before and may skip the rest of the wait. */
  skippable: boolean;
}

export const useBoot = create<BootState>(() => ({ progress: 0, status: 'boot.lamps', done: false, skippable: false }));

let skipped = false;
let skipFloor: (() => void) | null = null;

/** Skip what is left of the minimum time. The loading itself still finishes. */
export function skipBoot(): void {
  if (!useBoot.getState().skippable) return;
  skipped = true;
  useBoot.setState({ skippable: false });
  skipFloor?.();
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resolve when `p` settles or after `ms`, whichever is first. Boot never hangs on one task. */
function capped(p: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([p.then(() => undefined, () => undefined), delay(ms)]);
}

function fontsReady(): Promise<unknown> {
  const fonts = document.fonts;
  if (!fonts) return Promise.resolve();
  const families = ['1em Limelight', '1em "Libre Baskerville"', 'italic 1em "Libre Baskerville"', '1em "Courier Prime"'];
  return Promise.all([...families.map((f) => fonts.load(f)), fonts.ready]);
}

interface Task {
  status: MessageKey;
  run: () => Promise<unknown>;
  capMs: number;
}

const TASKS: Task[] = [
  // The language first: the rest of this screen is written in it.
  { status: 'boot.lamps', run: () => setLanguage(initialLanguage(), false), capMs: 6000 },
  { status: 'boot.lamps', run: fontsReady, capMs: 3000 },
  { status: 'boot.badge', run: () => useAccount.getState().init(), capMs: 8000 },
  {
    status: 'boot.files',
    run: () =>
      Promise.all([
        import('../screens/CaseSelect.tsx'),
        import('../screens/SaveSlots.tsx'),
        import('../screens/Account.tsx'),
        import('../screens/Settings.tsx'),
      ]),
    capMs: 8000,
  },
];

let running: Promise<void> | null = null;

export function runBoot(): Promise<void> {
  if (running) return running;
  running = (async () => {
    const started = performance.now();
    useBoot.setState({ skippable: seenBefore('boot') });
    let finished = 0;
    const doneFlags = TASKS.map(() => false);
    // Step through the labels with the bar, but never past a task that is still running.
    const labels: MessageKey[] = [...TASKS.map((t) => t.status), 'boot.office'];
    const status = (shown: number) => {
      const byBar = Math.min(labels.length - 1, Math.floor(shown * labels.length));
      const firstOpen = doneFlags.indexOf(false);
      return labels[firstOpen === -1 ? byBar : Math.min(byBar, firstOpen)]!;
    };

    // Progress follows whichever is behind: the work, or the minimum time.
    let raf = 0;
    const tick = () => {
      const byTime = skipped ? 1 : Math.min(1, (performance.now() - started) / BOOT_MIN_MS);
      const byWork = finished / TASKS.length;
      const shown = Math.min(byTime, byWork, 0.999);
      useBoot.setState({ progress: shown, status: status(shown) });
      raf = requestAnimationFrame(tick);
    };
    tick();

    await Promise.all(
      TASKS.map((t, i) =>
        capped(t.run(), t.capMs).then(() => {
          doneFlags[i] = true;
          finished += 1;
        }),
      ),
    );
    const left = BOOT_MIN_MS - (performance.now() - started);
    if (left > 0 && !skipped) {
      const floor = skippableDelay(left);
      skipFloor = floor.skip;
      await floor.done;
      skipFloor = null;
    }
    cancelAnimationFrame(raf);
    markSeen('boot');
    useBoot.setState({ progress: 1, status: 'boot.office', skippable: false });
    if (!skipped) await delay(350); // let the keyhole light up
    useBoot.setState({ done: true });
  })();
  return running;
}
