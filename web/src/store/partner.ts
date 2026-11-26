// Sergeant Doyle, the partner, out loud. engine/partner.ts decides what he could remark on; this store
// picks one remark when several come at once, asks the `partner` function to put it into words in the
// player's language, falls back on the game's own line when that does not come in time, and holds the
// line the bubble (components/PartnerBubble.tsx) shows.
import { create } from 'zustand';
import type { CaseFile } from '@shared/caseSchema.ts';
import { remarkOnClues, remarkOnEvidence, remarkOnReply, type Remark, type RemarkKind } from '../engine/partner.ts';
import { discoveryEvents, markPartnerSaid, useGame } from './game.ts';
import { useSettings } from './settings.ts';
import { askPartner } from '../lib/api.ts';
import { englishOf, t, type MessageKey } from '../i18n/index.ts';

export interface PartnerLine {
  id: number;
  caseKey: string;
  text: string;
  kind: RemarkKind;
}

interface PartnerState {
  line: PartnerLine | null;
  dismiss: () => void;
}

export const usePartner = create<PartnerState>((set) => ({
  line: null,
  dismiss: () => set({ line: null }),
}));

/** When several remarks come at once (a reply that also gave clues and evidence), the most telling one wins. */
const PRIORITY: Record<RemarkKind, number> = {
  contradicts: 6,
  changedStory: 5,
  explains: 4,
  confirms: 3,
  askAbout: 2,
  holdingOut: 1,
};

const FALLBACK: Record<RemarkKind, MessageKey> = {
  explains: 'partner.explains',
  contradicts: 'partner.contradicts',
  confirms: 'partner.confirms',
  askAbout: 'partner.askAbout',
  changedStory: 'partner.changedStory',
  holdingOut: 'partner.holdingOut',
};

interface Pending {
  c: CaseFile;
  caseKey: string;
  remark: Remark;
  said?: string;
}

/** Remarks gather for a moment, then the best one is said. */
const GATHER_MS = 500;
let pending: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;

function progressOf(caseKey: string) {
  return useGame.getState().slot?.progress[caseKey] ?? null;
}

/** The game's own line for a remark, in the player's language. */
export function fallbackLine(c: CaseFile, r: Remark): string {
  const name = c.suspects.find((s) => s.id === r.suspectId)?.name ?? '';
  const evidence = c.evidence.find((e) => e.id === r.evidenceId)?.name ?? '';
  return t(FALLBACK[r.kind], { name, evidence });
}

async function speak(p: Pending): Promise<void> {
  const progress = progressOf(p.caseKey);
  if (!progress || progress.accusation || progress.partnerSaid?.includes(p.remark.key)) return;
  markPartnerSaid(p.caseKey, p.remark.key);
  const r = p.remark;
  const words = await askPartner({
    case_id: p.c.id,
    device_id: useGame.getState().deviceId,
    kind: r.kind,
    suspect_id: r.suspectId ?? null,
    speaker_id: r.speakerId ?? null,
    evidence_id: r.evidenceId ?? null,
    clue_id: r.clueId ?? null,
    said: p.said ?? null,
  });
  // The player may have switched him off or left the case while he was thinking.
  if (!useSettings.getState().partner || progressOf(p.caseKey)?.runId !== progress.runId) return;
  usePartner.setState({ line: { id: nextId++, caseKey: p.caseKey, text: words ?? fallbackLine(p.c, r), kind: r.kind } });
}

function flush(): void {
  timer = null;
  const best = pending.reduce<Pending | null>((a, b) => (!a || PRIORITY[b.remark.kind] > PRIORITY[a.remark.kind] ? b : a), null);
  pending = [];
  if (best) void speak(best);
}

/** Offer a remark. Nothing happens when he is switched off, already said it, or has nothing to say. */
export function offerRemark(c: CaseFile, caseKey: string, remark: Remark | null, said?: string): void {
  if (!remark || !useSettings.getState().partner) return;
  pending.push({ c, caseKey, remark, said });
  if (!timer) timer = setTimeout(flush, GATHER_MS);
}

/** After a reply in the interview room (the clues and evidence it gave arrive through discoveryEvents). */
export function remarkAfterReply(
  c: CaseFile,
  caseKey: string,
  suspectId: string,
  evidenceId: string | null,
  effect: Parameters<typeof remarkOnReply>[4],
  challenge: Parameters<typeof remarkOnReply>[5],
  reply: string,
): void {
  const p = progressOf(caseKey);
  if (!p) return;
  offerRemark(c, caseKey, remarkOnReply(englishOf(c), p, suspectId, evidenceId, effect, challenge), reply);
}

// What the player finds out reaches the partner through the game store's discovery events.
discoveryEvents.evidence.add((c, caseKey, evidenceId) => {
  const p = progressOf(caseKey);
  if (p) offerRemark(c, caseKey, remarkOnEvidence(englishOf(c), p, evidenceId));
});
discoveryEvents.clues.add((c, caseKey, clueIds, newEvidence) => {
  const p = progressOf(caseKey);
  if (!p) return;
  const english = englishOf(c);
  offerRemark(c, caseKey, remarkOnClues(english, p, clueIds));
  for (const e of newEvidence) offerRemark(c, caseKey, remarkOnEvidence(english, p, e));
});
