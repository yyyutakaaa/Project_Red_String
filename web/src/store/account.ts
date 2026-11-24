// Account store: who is signed in, and the cloud copy of their saves.
//
// Guests play exactly as before: saves live in this browser only. Signed-in players keep the same
// local saves as a working copy, and every write is mirrored to the cloud (debounced). On sign-in
// and at start-up the local and cloud slots are merged (see engine/cloudSync.ts). Signing out
// uploads what is pending, then clears the saves from this device; they stay in the account.
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { clearSlots, deleteSlot, listSlots, loadSlot, putSlot } from '../engine/save.ts';
import { parseRemote, planMerge, readSyncRecord, writeSyncRecord, type RemoteRow } from '../engine/cloudSync.ts';
import type { SaveSlotData } from '../engine/types.ts';
import { createAccount, signIn as authSignIn, usernameFromEmail } from '../lib/account.ts';
import { supabase } from '../lib/supabase.ts';
import { saveEvents, useGame } from './game.ts';
import { t } from '../i18n/index.ts';

export type SyncState = 'local' | 'syncing' | 'synced' | 'offline';

export interface AccountUser {
  id: string;
  username: string;
}

interface AccountStore {
  /** False until the stored session has been checked at start-up. */
  ready: boolean;
  user: AccountUser | null;
  sync: SyncState;
  lastSyncedAt: number | null;

  /** Restore the session and merge saves. Safe to call more than once. */
  init: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const UPLOAD_DEBOUNCE_MS = 1500;
const RETRY_MS = 15_000;

const storage = () => useGame.getState().storage;

function userFromSession(session: Session | null): AccountUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = u.user_metadata as { username?: unknown } | undefined;
  const username = typeof meta?.username === 'string' ? meta.username : usernameFromEmail(u.email);
  return { id: u.id, username };
}

// ---------------------------------------------------------------------------
// Upload queue

const pending = new Map<number, SaveSlotData | 'delete'>();
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

function markSynced(slot: number, updatedAt: number | null): void {
  const user = useAccount.getState().user;
  if (!user) return;
  const record = readSyncRecord(storage());
  record.owner = user.id;
  if (updatedAt === null) delete record.synced[slot];
  else record.synced[slot] = updatedAt;
  writeSyncRecord(storage(), record);
}

function schedule(delay = UPLOAD_DEBOUNCE_MS): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), delay);
}

async function flushOnce(): Promise<void> {
  const c = supabase();
  const user = useAccount.getState().user;
  if (!c || !user || pending.size === 0) return;
  useAccount.setState({ sync: 'syncing' });
  const batch = [...pending.entries()];
  pending.clear();
  const failed: typeof batch = [];
  for (const [n, item] of batch) {
    const { error } =
      item === 'delete'
        ? await c.from('cloud_saves').delete().eq('slot', n)
        : await c.from('cloud_saves').upsert({ user_id: user.id, slot: n, data: item }, { onConflict: 'user_id,slot' });
    if (error) failed.push([n, item]);
    else markSynced(n, item === 'delete' ? null : item.updatedAt);
  }
  // Keep failed items unless a newer change for the same slot arrived meanwhile.
  for (const [n, item] of failed) if (!pending.has(n)) pending.set(n, item);
  if (failed.length > 0) {
    useAccount.setState({ sync: 'offline' });
    schedule(RETRY_MS);
  } else if (pending.size === 0) {
    useAccount.setState({ sync: 'synced', lastSyncedAt: Date.now() });
  }
}

/** Upload everything queued. Concurrent callers share one run. */
function flush(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!flushing) {
    flushing = flushOnce()
      .catch(() => {
        useAccount.setState({ sync: 'offline' });
        schedule(RETRY_MS);
      })
      .finally(() => {
        flushing = null;
      });
  }
  return flushing;
}

saveEvents.written.add((slot) => {
  if (!useAccount.getState().user) return;
  pending.set(slot.slot, slot);
  schedule();
});
saveEvents.deleted.add((n) => {
  if (!useAccount.getState().user) return;
  pending.set(n, 'delete');
  schedule(0);
});

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (pending.size > 0) void flush();
  });
  // Push the last moves out when the tab or app goes to the background.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pending.size > 0) void flush();
  });
}

// ---------------------------------------------------------------------------
// Merge on sign-in / start-up

/** Reload the slot the game has open, in case the merge replaced it. */
function refreshOpenSlot(): void {
  const open = useGame.getState().slot;
  if (!open) return;
  useGame.setState({ slot: loadSlot(storage(), open.slot) });
}

async function pullAndMerge(user: AccountUser): Promise<void> {
  const c = supabase();
  if (!c) return;
  useAccount.setState({ sync: 'syncing' });
  const { data, error } = await c.from('cloud_saves').select('slot, data');
  if (error) throw error;
  const store = storage();
  const record = readSyncRecord(store);
  const remote = parseRemote((data ?? []) as RemoteRow[]);
  const plan = planMerge(listSlots(store), remote, record, user.id);

  if (record.owner !== user.id) {
    // Saves from a guest or another account: start a fresh record for this account.
    writeSyncRecord(store, { owner: user.id, synced: {} });
  }
  for (const n of plan.deleteLocal) {
    deleteSlot(store, n);
    markSynced(n, null);
  }
  for (const slot of plan.writeLocal) {
    putSlot(store, slot);
    markSynced(slot.slot, slot.updatedAt);
  }
  // Slots already equal on both sides count as synced too.
  for (const local of listSlots(store)) {
    if (local && remote.get(local.slot)?.updatedAt === local.updatedAt) markSynced(local.slot, local.updatedAt);
  }
  refreshOpenSlot();

  for (const slot of plan.upload) pending.set(slot.slot, slot);
  if (pending.size > 0) await flush();
  else useAccount.setState({ sync: 'synced', lastSyncedAt: Date.now() });
}

// ---------------------------------------------------------------------------

let initPromise: Promise<void> | null = null;
let listening = false;

/** Sign-out refused: some moves have not reached the cloud yet and would be lost. */
export class SignOutBlocked extends Error {
  constructor() {
    super(t('account.signOutBlocked'));
    this.name = 'SignOutBlocked';
  }
}

export const useAccount = create<AccountStore>((set, get) => ({
  ready: false,
  user: null,
  sync: 'local',
  lastSyncedAt: null,

  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const c = supabase();
      if (!c) {
        set({ ready: true });
        return;
      }
      if (!listening) {
        listening = true;
        c.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT') set({ user: null, sync: 'local' });
          else if (session && event === 'TOKEN_REFRESHED') set({ user: userFromSession(session) });
        });
      }
      try {
        const { data } = await c.auth.getSession();
        const user = userFromSession(data.session);
        set({ user, sync: user ? 'syncing' : 'local' });
        if (user) await pullAndMerge(user);
      } catch {
        if (get().user) set({ sync: 'offline' });
      } finally {
        set({ ready: true });
      }
    })();
    return initPromise;
  },

  signIn: async (username, password) => {
    await authSignIn(username, password);
    const { data } = await supabase()!.auth.getSession();
    const user = userFromSession(data.session);
    set({ user });
    if (user) {
      try {
        await pullAndMerge(user);
      } catch {
        set({ sync: 'offline' });
      }
    }
  },

  signUp: async (username, password) => {
    await createAccount(username, password);
    const { data } = await supabase()!.auth.getSession();
    const user = userFromSession(data.session);
    set({ user });
    if (user) {
      try {
        await pullAndMerge(user);
      } catch {
        set({ sync: 'offline' });
      }
    }
  },

  signOut: async () => {
    const c = supabase();
    if (!c) return;
    // Get the latest moves into the account before the saves leave this device.
    if (pending.size > 0) await flush();
    if (pending.size > 0) throw new SignOutBlocked();
    // Clear the device first: the auth listener flips the screen to "guest" during signOut().
    pending.clear();
    const store = storage();
    clearSlots(store);
    writeSyncRecord(store, { owner: null, synced: {} });
    useGame.setState({ slot: null, lastSavedAt: null });
    await c.auth.signOut({ scope: 'local' });
    set({ user: null, sync: 'local', lastSyncedAt: null });
  },

  syncNow: async () => {
    const user = get().user;
    if (!user) return;
    try {
      await pullAndMerge(user);
    } catch {
      set({ sync: 'offline' });
    }
  },
}));
