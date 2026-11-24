// Game store: the active save slot and every action that changes it.
// Every meaningful action autosaves the slot to localStorage (streaming text updates are batched).
import { create } from 'zustand';
import type { CaseFile, Hotspot, Mood } from '@shared/caseSchema.ts';
import { syncPins } from '../engine/board.ts';
import { discoveredCount, evaluateAccusation, questionsUsed, scoreProgress, totalDiscoverables, totalPatience } from '../engine/scoring.ts';
import {
  browserStorage,
  continueSlot,
  deleteSlot,
  getDeviceId,
  loadSlot,
  newCaseProgress,
  newSlot,
  recordCompletion,
  uuid,
  writeSlot,
  type KeyValueStorage,
} from '../engine/save.ts';
import type { AccusationRecord, BoardState, CaseProgress, CaseSource, ChatMessage, ConversationState, SaveSlotData } from '../engine/types.ts';
import { sfx } from '../audio/audio.ts';

export interface Toast {
  id: string;
  text: string;
  kind: 'evidence' | 'clue' | 'info' | 'error' | 'save';
}

interface GameStore {
  storage: KeyValueStorage;
  deviceId: string;
  slot: SaveSlotData | null;
  lastSavedAt: number | null;
  toasts: Toast[];

  /** Load slot n, creating it if empty, and make it active. */
  activateSlot: (n: number) => SaveSlotData;
  /** Start a fresh save in slot n (overwrites). */
  createSlot: (n: number) => SaveSlotData;
  removeSlot: (n: number) => void;
  /** The active slot, or the last used one, or a new slot 1. */
  ensureActiveSlot: () => SaveSlotData;
  /** Load the slot "Continue" points at, if any. */
  continueLast: () => SaveSlotData | null;
  saveNow: () => void;
  /** Copy the current game into slot n and continue there. */
  saveToSlot: (n: number) => void;

  ensureProgress: (caseKey: string, source: CaseSource) => CaseProgress;
  restartCase: (caseKey: string, source: CaseSource) => CaseProgress;
  /** Apply a change to one case's progress. save=false skips the write (used while text streams). */
  update: (caseKey: string, fn: (p: CaseProgress) => CaseProgress, save?: boolean) => void;
  setActiveCase: (caseKey: string | null) => void;

  pushToast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;
}

const storage = browserStorage();

/** Listeners for every slot write and delete. The account store uses them to mirror saves to the cloud. */
export const saveEvents = {
  written: new Set<(slot: SaveSlotData) => void>(),
  deleted: new Set<(n: number) => void>(),
};
const emitWritten = (slot: SaveSlotData) => saveEvents.written.forEach((fn) => fn(slot));

export const useGame = create<GameStore>((set, get) => {
  const write = (slot: SaveSlotData) => {
    try {
      const stamped = writeSlot(get().storage, slot);
      set({ slot: stamped, lastSavedAt: stamped.updatedAt });
      emitWritten(stamped);
    } catch {
      set({ slot });
      get().pushToast('Could not write the save. Storage may be full or disabled.', 'error');
    }
  };

  return {
    storage,
    deviceId: getDeviceId(storage),
    slot: null,
    lastSavedAt: null,
    toasts: [],

    activateSlot: (n) => {
      const existing = loadSlot(get().storage, n);
      const slot = existing ?? newSlot(n);
      write(slot);
      return get().slot!;
    },
    createSlot: (n) => {
      write(newSlot(n));
      return get().slot!;
    },
    removeSlot: (n) => {
      deleteSlot(get().storage, n);
      if (get().slot?.slot === n) set({ slot: null });
      saveEvents.deleted.forEach((fn) => fn(n));
    },
    ensureActiveSlot: () => {
      const current = get().slot;
      if (current) return current;
      const last = continueSlot(get().storage);
      if (last) {
        set({ slot: last });
        return last;
      }
      return get().activateSlot(1);
    },
    continueLast: () => {
      const last = continueSlot(get().storage);
      if (last) set({ slot: last });
      return last;
    },
    saveNow: () => {
      const slot = get().slot;
      if (!slot) return;
      write(slot);
      get().pushToast(`Saved to slot ${slot.slot}.`, 'save');
    },
    saveToSlot: (n) => {
      const slot = get().slot;
      if (!slot) return;
      if (n === slot.slot) {
        get().saveNow();
        return;
      }
      // The copy gets fresh run ids so the two slots never share server-side interrogation state;
      // parentRunId lets the server carry over patience, clues and transcripts from the original run.
      const progress = Object.fromEntries(
        Object.entries(slot.progress).map(([key, p]) => [key, { ...p, runId: uuid(), parentRunId: p.runId }]),
      );
      write({ ...slot, slot: n, progress });
      get().pushToast(`Saved to slot ${n}.`, 'save');
    },

    ensureProgress: (caseKey, source) => {
      const slot = get().ensureActiveSlot();
      const existing = slot.progress[caseKey];
      if (existing) {
        if (slot.activeCaseKey !== caseKey) write({ ...slot, activeCaseKey: caseKey });
        return existing;
      }
      const p = newCaseProgress(caseKey, source);
      write({ ...slot, activeCaseKey: caseKey, progress: { ...slot.progress, [caseKey]: p } });
      return p;
    },
    restartCase: (caseKey, source) => {
      const slot = get().ensureActiveSlot();
      const p = newCaseProgress(caseKey, source);
      write({ ...slot, activeCaseKey: caseKey, progress: { ...slot.progress, [caseKey]: p } });
      return p;
    },
    update: (caseKey, fn, save = true) => {
      const slot = get().slot;
      const current = slot?.progress[caseKey];
      if (!slot || !current) return;
      const next = { ...fn(current), updatedAt: Date.now() };
      const nextSlot = { ...slot, progress: { ...slot.progress, [caseKey]: next } };
      if (save) write(nextSlot);
      else set({ slot: nextSlot });
    },
    setActiveCase: (caseKey) => {
      const slot = get().slot;
      if (!slot || slot.activeCaseKey === caseKey) return;
      write({ ...slot, activeCaseKey: caseKey });
    },

    pushToast: (text, kind = 'info') => {
      const id = uuid();
      set({ toasts: [...get().toasts.slice(-3), { id, text, kind }] });
      setTimeout(() => get().dismissToast(id), kind === 'error' ? 6500 : 4200);
    },
    dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  };
});

// ---------------------------------------------------------------------------
// Selectors and derived helpers

export function useProgress(caseKey: string | undefined): CaseProgress | null {
  return useGame((s) => (caseKey ? s.slot?.progress[caseKey] ?? null : null));
}

export function defaultConversation(c: CaseFile, suspectId: string): ConversationState {
  const s = c.suspects.find((x) => x.id === suspectId);
  return { messages: [], patienceUsed: 0, patienceMax: s?.patience ?? 10, mood: 'calm', shownEvidence: [] };
}

export function getConversation(p: CaseProgress, c: CaseFile, suspectId: string): ConversationState {
  return p.conversations[suspectId] ?? defaultConversation(c, suspectId);
}

export function evidenceName(c: CaseFile, id: string): string {
  return c.evidence.find((e) => e.id === id)?.name ?? id;
}

export function clueById(c: CaseFile, clueId: string) {
  for (const s of c.suspects) {
    const clue = s.revealable_clues.find((cl) => cl.clue_id === clueId);
    if (clue) return { suspect: s, clue };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Actions (all autosave)

const G = () => useGame.getState();

export function markBriefingSeen(caseKey: string): void {
  G().update(caseKey, (p) => (p.briefingSeen ? p : { ...p, briefingSeen: true }));
}

export function visitRoom(caseKey: string, roomId: string): void {
  G().update(caseKey, (p) => (p.visitedRooms.includes(roomId) ? p : { ...p, visitedRooms: [...p.visitedRooms, roomId] }));
}

/** Examine a hotspot. Returns the evidence id if this examination found new evidence. */
export function examineHotspot(c: CaseFile, caseKey: string, roomId: string, hotspot: Hotspot): string | null {
  const key = `${roomId}/${hotspot.id}`;
  let found: string | null = null;
  G().update(caseKey, (p) => {
    const examined = p.examinedHotspots.includes(key) ? p.examinedHotspots : [...p.examinedHotspots, key];
    let foundEvidence = p.foundEvidence;
    if (hotspot.evidence_id && !p.foundEvidence.includes(hotspot.evidence_id)) {
      found = hotspot.evidence_id;
      foundEvidence = [...p.foundEvidence, hotspot.evidence_id];
    }
    if (examined === p.examinedHotspots && foundEvidence === p.foundEvidence) return p;
    return { ...p, examinedHotspots: examined, foundEvidence, board: syncPins(p.board, c, foundEvidence) };
  });
  if (found) {
    G().pushToast(`Evidence added: ${evidenceName(c, found)}`, 'evidence');
    sfx('pickup');
  }
  return found;
}

/** Record clues revealed by a suspect, plus any evidence those clues hand over. Returns newly added clue ids. */
export function applyRevealedClues(c: CaseFile, caseKey: string, clueIds: readonly string[]): string[] {
  const added: string[] = [];
  const newEvidence: string[] = [];
  G().update(caseKey, (p) => {
    const revealed = [...p.revealedClues];
    const found = [...p.foundEvidence];
    for (const id of clueIds) {
      const hit = clueById(c, id);
      if (!hit || revealed.includes(id)) continue;
      revealed.push(id);
      added.push(id);
      const ev = hit.clue.evidence_id;
      if (ev && !found.includes(ev)) {
        found.push(ev);
        newEvidence.push(ev);
      }
    }
    if (added.length === 0) return p;
    return { ...p, revealedClues: revealed, foundEvidence: found, board: syncPins(p.board, c, found) };
  });
  if (added.length) {
    G().pushToast(added.length === 1 ? 'New clue noted in your notebook.' : `${added.length} new clues noted in your notebook.`, 'clue');
    sfx('clue');
  }
  for (const ev of newEvidence) G().pushToast(`Evidence added: ${evidenceName(c, ev)}`, 'evidence');
  return added;
}

export function addChatMessage(c: CaseFile, caseKey: string, suspectId: string, msg: ChatMessage, save = true): void {
  G().update(
    caseKey,
    (p) => {
      const conv = getConversation(p, c, suspectId);
      return { ...p, conversations: { ...p.conversations, [suspectId]: { ...conv, messages: [...conv.messages, msg] } } };
    },
    save,
  );
}

export function patchChatMessage(
  c: CaseFile,
  caseKey: string,
  suspectId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
  save = false,
): void {
  G().update(
    caseKey,
    (p) => {
      const conv = getConversation(p, c, suspectId);
      const messages = conv.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m));
      return { ...p, conversations: { ...p.conversations, [suspectId]: { ...conv, messages } } };
    },
    save,
  );
}

export function removeChatMessage(c: CaseFile, caseKey: string, suspectId: string, messageId: string): void {
  G().update(caseKey, (p) => {
    const conv = getConversation(p, c, suspectId);
    return {
      ...p,
      conversations: { ...p.conversations, [suspectId]: { ...conv, messages: conv.messages.filter((m) => m.id !== messageId) } },
    };
  });
}

export function setConversationState(
  c: CaseFile,
  caseKey: string,
  suspectId: string,
  patch: Partial<Pick<ConversationState, 'patienceUsed' | 'patienceMax' | 'mood' | 'shownEvidence'>>,
): void {
  G().update(caseKey, (p) => {
    const conv = getConversation(p, c, suspectId);
    return { ...p, conversations: { ...p.conversations, [suspectId]: { ...conv, ...patch } } };
  });
}

export function setBoard(caseKey: string, board: BoardState, save = true): void {
  G().update(caseKey, (p) => ({ ...p, board }), save);
}

export function setNotes(caseKey: string, notes: string): void {
  G().update(caseKey, (p) => ({ ...p, notes }));
}

/** Reveal the next hint (costs score). Returns its text, or null when all hints are used. */
export function takeHint(c: CaseFile, caseKey: string): string | null {
  const p = G().slot?.progress[caseKey];
  if (!p || p.hintsUsed >= c.hints.length) return null;
  const text = c.hints[p.hintsUsed] ?? null;
  G().update(caseKey, (prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  return text;
}

export function hintsShown(c: CaseFile, p: CaseProgress): string[] {
  return c.hints.slice(0, p.hintsUsed);
}

/** Close the case. Records the accusation, the score and the completion (which unlocks the next case). */
export function accuse(c: CaseFile, caseKey: string, culpritId: string, evidenceIds: string[]): AccusationRecord | null {
  const p = G().slot?.progress[caseKey];
  if (!p) return null;
  const verdict = evaluateAccusation(c, culpritId, evidenceIds);
  const score = scoreProgress(c, p, verdict.outcome);
  const record: AccusationRecord = {
    culpritId,
    evidenceIds,
    outcome: verdict.outcome,
    score: score.total,
    rank: score.rank,
    at: Date.now(),
    breakdown: {
      base: score.base,
      thoroughness: score.thoroughness,
      efficiency: score.efficiency,
      hintPenalty: score.hintPenalty,
      discovered: discoveredCount(p),
      discoverable: totalDiscoverables(c),
      questionsUsed: questionsUsed(p),
      questionBudget: totalPatience(c),
      hintsUsed: p.hintsUsed,
    },
  };
  const slot = G().slot!;
  const withProgress: SaveSlotData = {
    ...slot,
    progress: { ...slot.progress, [caseKey]: { ...p, accusation: record, updatedAt: Date.now() } },
  };
  const withCompletion = recordCompletion(withProgress, caseKey, verdict.outcome, score.total, score.rank);
  try {
    const stamped = writeSlot(G().storage, withCompletion);
    useGame.setState({ slot: stamped, lastSavedAt: stamped.updatedAt });
    emitWritten(stamped);
  } catch {
    useGame.setState({ slot: withCompletion });
  }
  sfx('stamp');
  return record;
}

export function moodLabel(m: Mood): string {
  return { calm: 'Calm', nervous: 'Nervous', angry: 'Angry', broken: 'Broken' }[m];
}
