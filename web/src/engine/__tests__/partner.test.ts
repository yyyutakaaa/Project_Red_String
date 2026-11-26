import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { buildPartnerPrompt, cleanPartnerLine, PARTNER_KINDS } from '@shared/partnerPrompt.ts';
import { autoLinks, emptyBoard, removeLink, suspectsNamedIn, syncAutoLinks, syncPins, linkId } from '../board.ts';
import { remarkOnClues, remarkOnEvidence, remarkOnReply } from '../partner.ts';
import { newCaseProgress } from '../save.ts';
import type { CaseProgress, ConversationState } from '../types.ts';
import tutorialJson from '../../cases/tutorial.json';
import ashgroveJson from '../../cases/ashgrove-house.json';

const tutorial = CaseFile.parse(tutorialJson);
const ashgrove = CaseFile.parse(ashgroveJson);

function talkedTo(...ids: string[]): Record<string, ConversationState> {
  return Object.fromEntries(
    ids.map((id) => [id, { messages: [{ id: 'q', role: 'detective', text: 'Where were you?', at: 0 }], patienceUsed: 1, patienceMax: 16, mood: 'calm', shownEvidence: [] } as ConversationState]),
  );
}

function progress(patch: Partial<CaseProgress>): CaseProgress {
  return { ...newCaseProgress('tutorial', 'story', 0), ...patch };
}

describe('strings the board ties by itself', () => {
  it('ties evidence to the suspect it names, by a name nobody else in the case carries', () => {
    const named = (id: string) => suspectsNamedIn(tutorial, tutorial.evidence.find((e) => e.id === id)!);
    expect(named('finch-diary')).toEqual(['pike']);
    expect(named('buyer-letter')).toEqual(['margaret']);
    // "Miss Finch" shares the surname with the victim: that ties nobody.
    expect(named('switchboard-log')).toEqual([]);
    // Clara Ashgrove shares her surname with the house and the victim, but her first name is hers.
    expect(suspectsNamedIn(ashgrove, ashgrove.evidence.find((e) => e.id === 'empty-shelf')!)).toEqual([]);
  });

  it('ties a suspect to the evidence that made them give way, and to what they handed over', () => {
    const p = progress({
      foundEvidence: ['bell-note', 'finch-diary', 'switchboard-log'],
      revealedClues: ['pike-left-desk'],
      conversations: { pike: { ...talkedTo('pike').pike!, evidenceEffects: { 'finch-diary': 'gave' } } },
    });
    const links = autoLinks(tutorial, p).map((l) => `${l.reason}:${linkId(l.from, l.to)}`).sort();
    // The diary both names Pike and broke him: one string, tied for the reaction.
    expect(links).toEqual(['reacted:bell-note~pike', 'reacted:finch-diary~pike']);
  });

  it('never ties more than what was found out, and a string the player cut stays cut', () => {
    const p = progress({ foundEvidence: ['finch-diary'] });
    let board = syncPins(emptyBoard(), tutorial, p.foundEvidence);
    board = syncAutoLinks(board, autoLinks(tutorial, p));
    expect(board.links.map((l) => l.id)).toEqual(['finch-diary~pike']);
    expect(board.links[0]!.auto).toBe('named');
    board = removeLink(board, 'finch-diary~pike');
    expect(board.cutAuto).toEqual(['finch-diary~pike']);
    expect(syncAutoLinks(board, autoLinks(tutorial, p)).links).toEqual([]);
  });

  it('does not give the case away: it also ties people who did not do it', () => {
    // The strings record facts, they are not the answer key.
    const p = progress({ foundEvidence: ashgrove.evidence.map((e) => e.id) });
    const links = autoLinks(ashgrove, p);
    const culprit = ashgrove.solution.culprit_id;
    expect(links.some((l) => l.from !== culprit && l.to !== culprit)).toBe(true);
  });
});

describe('the partner', () => {
  it('points out that a find does not fit the story of someone the player has heard', () => {
    const heard = progress({ foundEvidence: ['bell-note'], conversations: talkedTo('pike') });
    expect(remarkOnEvidence(tutorial, heard, 'bell-note')).toMatchObject({ kind: 'contradicts', suspectId: 'pike' });
    // Before the player heard Pike out, there is no story to compare with.
    const notYet = progress({ foundEvidence: ['bell-note'] });
    expect(remarkOnEvidence(tutorial, notYet, 'bell-note')).toBeNull();
  });

  it('suggests asking the person a find names, until it was shown to them', () => {
    const p = progress({ foundEvidence: ['buyer-letter'] });
    expect(remarkOnEvidence(tutorial, p, 'buyer-letter')).toMatchObject({ kind: 'askAbout', suspectId: 'margaret' });
    const shown = progress({ foundEvidence: ['buyer-letter'], conversations: { margaret: { ...talkedTo('margaret').margaret!, shownEvidence: ['buyer-letter'] } } });
    expect(remarkOnEvidence(tutorial, shown, 'buyer-letter')).toBeNull();
  });

  it('says what a clue explains, and does not say the same thing twice', () => {
    const p = progress({ foundEvidence: ['bell-note'], revealedClues: ['pike-left-desk'] });
    const r = remarkOnClues(tutorial, p, ['pike-left-desk']);
    expect(r).not.toBeNull();
    expect(remarkOnClues(tutorial, { ...p, partnerSaid: [r!.key] }, ['pike-left-desk'])?.key).not.toBe(r!.key);
  });

  it('notices a changed story when evidence breaks a suspect', () => {
    const p = progress({ foundEvidence: ['bell-note'] });
    expect(remarkOnReply(tutorial, p, 'pike', 'bell-note', 'gave', null)).toMatchObject({ kind: 'changedStory', suspectId: 'pike' });
    expect(remarkOnReply(tutorial, p, 'margaret', 'bell-note', 'none', null)).toBeNull();
  });

  it('is never told the solution or anyone\'s secrets', () => {
    for (const c of [tutorial, ashgrove]) {
      const forbidden = [
        c.solution.motive,
        c.solution.method,
        c.solution.reveal,
        ...c.suspects.flatMap((s) => [...s.never_reveal, ...s.secrets, ...s.private_knowledge, ...s.lies.map((l) => l.truth), s.alibi_verification.note]),
        ...c.timeline.filter((e) => e.visibility === 'hidden').map((e) => e.what),
      ];
      for (const kind of PARTNER_KINDS) {
        for (const s of c.suspects) {
          for (const e of c.evidence) {
            for (const clue of c.suspects.flatMap((x) => x.revealable_clues)) {
              const speaker = c.suspects.find((x) => x.revealable_clues.includes(clue))!.id;
              const prompt = buildPartnerPrompt({ caseFile: c, kind, language: 'nl', suspectId: s.id, speakerId: speaker, evidenceId: e.id, clueId: clue.clue_id });
              if (!prompt) continue;
              const text = prompt.system + prompt.user;
              for (const f of forbidden) expect(text).not.toContain(f);
              expect(text).toContain('Dutch');
            }
          }
        }
      }
    }
  });

  it('cleans what the model sends back into one spoken line', () => {
    expect(cleanPartnerLine('Doyle: "Ah, dat verklaart het briefje."')).toBe('Ah, dat verklaart het briefje.');
    expect(cleanPartnerLine('*strokes his moustache* Hm — interesting.')).toBe('Hm, interesting.');
  });
});
