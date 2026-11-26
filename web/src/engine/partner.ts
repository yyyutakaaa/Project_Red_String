// The partner: Sergeant Doyle walks the case with the detective and now and then says what strikes
// him. He thinks along, he never solves: every remark is about something the player has just found
// out (a clue that explains a piece of evidence, a statement that does not fit someone's story,
// a name worth asking about, a suspect who changed their story), never about who did it.
//
// This file decides when he speaks and what about. Pure: no React, no store, so it can be tested.
// The words come from the `partner` edge function, or from the lines in i18n when it cannot be reached.
import { parseCondition, type CaseFile, type Suspect } from '@shared/caseSchema.ts';
import type { EvidenceEffect } from '@shared/clues.ts';
import { suspectsNamedIn } from './board.ts';
import type { CaseProgress } from './types.ts';

export const PARTNER_NAME = 'Doyle';

export type RemarkKind =
  /** What a suspect just told explains a piece of evidence. */
  | 'explains'
  /** A clue or a piece of evidence does not fit what a suspect said about where they were. */
  | 'contradicts'
  /** A clue or a piece of evidence backs up what a suspect said about where they were. */
  | 'confirms'
  /** Someone is named in a clue or a piece of evidence and has not been asked about it. */
  | 'askAbout'
  /** A suspect gave way and told a different story than before. */
  | 'changedStory'
  /** A suspect is holding out against the evidence on the table. */
  | 'holdingOut';

export interface Remark {
  /** One remark per key per run: he does not say the same thing twice. */
  key: string;
  kind: RemarkKind;
  /** The suspect the remark is about (whose story, who changed it, who to ask). */
  suspectId?: string;
  /** The suspect who said the clue, when there is one. */
  speakerId?: string;
  evidenceId?: string;
  clueId?: string;
}

type Progress = Pick<CaseProgress, 'foundEvidence' | 'revealedClues' | 'conversations'> & { partnerSaid?: string[] };

const said = (p: Progress, key: string) => (p.partnerSaid ?? []).includes(key);
const questioned = (p: Progress, suspectId: string) => Boolean(p.conversations[suspectId]?.messages.some((m) => m.role === 'detective'));

function clueOwner(c: CaseFile, clueId: string): { suspect: Suspect; text: string; condition: string } | null {
  for (const s of c.suspects) {
    const clue = s.revealable_clues.find((cl) => cl.clue_id === clueId);
    if (clue) return { suspect: s, text: clue.text, condition: clue.condition };
  }
  return null;
}

/** Suspects (other than `except`) named in a line of text, by full name, first name or an unshared surname. */
function suspectsNamedInText(c: CaseFile, text: string, except: string): string[] {
  // Reuse the evidence rule by wrapping the text as a nameless piece of evidence.
  return suspectsNamedIn(c, { id: 'x', name: '', description: text, found_in: 'x', points_to: [], is_red_herring: false }).filter((id) => id !== except);
}

/** The first remark worth making from a list, skipping what he already said. */
function first(p: Progress, candidates: Remark[]): Remark | null {
  return candidates.find((r) => !said(p, r.key)) ?? null;
}

/** After a suspect revealed clues. Pass the English case and the progress after the clues were added. */
export function remarkOnClues(c: CaseFile, p: Progress, clueIds: readonly string[]): Remark | null {
  const out: Remark[] = [];
  for (const clueId of clueIds) {
    const owner = clueOwner(c, clueId);
    if (!owner) continue;
    const speaker = owner.suspect.id;
    // Testimony that bears on someone else's alibi: the case file says whether it breaks or backs it.
    for (const s of c.suspects) {
      if (s.id === speaker || !s.alibi_verification.clue_ids.includes(clueId)) continue;
      const kind = s.alibi_verification.status === 'broken' ? 'contradicts' : 'confirms';
      out.push({ key: `${kind}:${s.id}:${clueId}`, kind, suspectId: s.id, speakerId: speaker, clueId });
    }
    const cond = parseCondition(owner.condition);
    if (cond.kind === 'shown_evidence' && p.foundEvidence.includes(cond.evidenceId)) {
      out.push({ key: `explains:${clueId}`, kind: 'explains', speakerId: speaker, suspectId: speaker, evidenceId: cond.evidenceId, clueId });
    }
    for (const other of suspectsNamedInText(c, owner.text, speaker)) {
      out.push({ key: `ask:${other}:${clueId}`, kind: 'askAbout', suspectId: other, speakerId: speaker, clueId });
    }
  }
  return first(p, out);
}

/** After a piece of evidence was found. */
export function remarkOnEvidence(c: CaseFile, p: Progress, evidenceId: string): Remark | null {
  const e = c.evidence.find((x) => x.id === evidenceId);
  if (!e) return null;
  const out: Remark[] = [];
  // Only once the player has heard that person's own story.
  for (const s of c.suspects) {
    if (!s.alibi_verification.evidence_ids.includes(evidenceId) || !questioned(p, s.id)) continue;
    const kind = s.alibi_verification.status === 'broken' ? 'contradicts' : 'confirms';
    out.push({ key: `${kind}:${s.id}:${evidenceId}`, kind, suspectId: s.id, evidenceId });
  }
  for (const s of suspectsNamedIn(c, e)) {
    if (p.conversations[s]?.shownEvidence.includes(evidenceId)) continue;
    out.push({ key: `ask:${s}:${evidenceId}`, kind: 'askAbout', suspectId: s, evidenceId });
  }
  return first(p, out);
}

/** After a reply in the interview room: did the evidence on the table change their story, or are they holding out? */
export function remarkOnReply(
  c: CaseFile,
  p: Progress,
  suspectId: string,
  evidenceId: string | null,
  effect: EvidenceEffect | null | undefined,
  challenge: 'caught' | 'failed' | null | undefined,
): Remark | null {
  const s = c.suspects.find((x) => x.id === suspectId);
  if (!s || !evidenceId) return null;
  const out: Remark[] = [];
  if (challenge === 'caught' || (effect === 'gave' && s.breaks_on.includes(evidenceId))) {
    out.push({ key: `changed:${suspectId}:${evidenceId}`, kind: 'changedStory', suspectId, evidenceId });
  }
  // Holding out is said once per suspect: after that the player knows how it works.
  if (effect === 'holding') out.push({ key: `holding:${suspectId}`, kind: 'holdingOut', suspectId, evidenceId });
  return first(p, out);
}
