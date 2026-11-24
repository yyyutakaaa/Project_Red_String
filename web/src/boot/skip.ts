// Loading screens are part of the show the first time. After that the player may skip the wait
// with a click or a key; the loading itself still finishes first.
const KEY = 'rs.loadingSeen';

export type LoadingKind = 'boot' | 'launch';

function read(): string[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Has this kind of loading screen been sat through before on this device? */
export function seenBefore(kind: LoadingKind): boolean {
  return read().includes(kind);
}

export function markSeen(kind: LoadingKind): void {
  const list = read();
  if (list.includes(kind)) return;
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify([...list, kind]));
  } catch {
    /* without storage every loading screen plays in full */
  }
}

/** A wait of `ms` that `skip()` ends early. */
export function skippableDelay(ms: number): { done: Promise<void>; skip: () => void } {
  let skip = () => undefined as void;
  const done = new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    skip = () => {
      clearTimeout(timer);
      resolve();
    };
  });
  return { done, skip };
}
