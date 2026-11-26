import { describe, expect, it } from 'vitest';
import { CaseFile } from '@shared/caseSchema.ts';
import { buildSuspectPrompt, buildUserTurn, MAX_PLAYER_MESSAGE_CHARS } from '@shared/suspectPrompt.ts';
import { miniCase } from './fixtures/miniCase.ts';

const c = CaseFile.parse(miniCase());
const ctx = { patienceUsedBefore: 0, shownEvidenceNow: null, shownEvidenceBefore: [], alreadyRevealed: [] };

describe('suspect prompt', () => {
  it('never contains the solution, hidden events or private data of other suspects', () => {
    for (const s of c.suspects) {
      const prompt = buildSuspectPrompt({ caseFile: c, suspectId: s.id, ctx, mood: 'calm', shownEvidence: null });
      expect(prompt).not.toContain(c.solution.motive);
      expect(prompt).not.toContain(c.solution.method);
      expect(prompt).not.toContain(c.solution.reveal);
      for (const e of c.timeline.filter((t) => t.visibility === 'hidden')) expect(prompt).not.toContain(e.what);
      for (const other of c.suspects.filter((o) => o.id !== s.id)) {
        for (const secret of [...other.private_knowledge, ...other.secrets, ...other.never_reveal]) expect(prompt).not.toContain(secret);
        for (const lie of other.lies) expect(prompt).not.toContain(lie.truth);
        for (const clue of other.revealable_clues) expect(prompt).not.toContain(clue.text);
      }
      for (const e of c.timeline.filter((t) => t.visibility === 'private' && !t.who.includes(s.id))) {
        expect(prompt).not.toContain(e.what);
      }
      expect(prompt).not.toContain(s.alibi_verification.note);
    }
  });

  it('only lists clues whose condition is met', () => {
    const calm = buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null });
    expect(calm).not.toContain('nora-debts');
    expect(calm).not.toContain('nora-return');
    const shown = c.evidence.find((e) => e.id === 'ben-note')!;
    const confronted = buildSuspectPrompt({
      caseFile: c,
      suspectId: 'nora',
      ctx: { ...ctx, shownEvidenceNow: 'ben-note' },
      mood: 'calm',
      shownEvidence: shown,
    });
    expect(confronted).toContain('MUST reveal');
    expect(confronted).toContain('nora-return');
  });

  it('tells an innocent suspect they have nothing to hide outside their lies and secrets', () => {
    const ben = buildSuspectPrompt({ caseFile: c, suspectId: 'ben', ctx: { ...ctx, innocent: true }, mood: 'calm', shownEvidence: null });
    expect(ben).toContain('You have nothing to hide about the rest');
    expect(ben).toContain('Things you know and can tell now');
    expect(ben).not.toContain('Things you can let slip now');
    const nora = buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null });
    expect(nora).not.toContain('nothing to hide');
    expect(nora).toContain('Things you can let slip now');
  });

  it('wraps and truncates the detective message', () => {
    const turn = buildUserTurn('x'.repeat(2000), null);
    expect(turn).toContain('<detective_says>');
    expect(turn.length).toBeLessThan(MAX_PLAYER_MESSAGE_CHARS + 60);
  });

  it('tells a suspect to shrug at evidence that has nothing to do with them', () => {
    const slips = c.evidence.find((e) => e.id === 'racing-slips')!;
    const ticket = c.evidence.find((e) => e.id === 'pawn-ticket')!;
    const shown = (e: typeof slips) => buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx: { ...ctx, shownEvidenceNow: e.id }, mood: 'calm', shownEvidence: e });
    expect(shown(slips)).toContain('This evidence means nothing to you');
    expect(shown(ticket)).not.toContain('This evidence means nothing to you');
  });

  it('makes a caught suspect admit the lie, and lets a wrong call bounce off', () => {
    const ticket = c.evidence.find((e) => e.id === 'pawn-ticket')!;
    const nora = c.suspects.find((s) => s.id === 'nora')!;
    const base = { caseFile: c, suspectId: 'nora', ctx: { ...ctx, shownEvidenceNow: ticket.id }, mood: 'calm' as const, shownEvidence: ticket };
    const caught = buildSuspectPrompt({ ...base, challenge: { statement: 'I never pawned a thing.', caught: true, truth: nora.lies[0]?.truth ?? 'the truth' } });
    expect(caught).toContain('You have been caught in a lie');
    expect(caught).toContain('I never pawned a thing.');
    const failed = buildSuspectPrompt({ ...base, challenge: { statement: 'I like tea.', caught: false } });
    expect(failed).toContain('The detective says you lied');
    expect(failed).not.toContain('You have been caught in a lie');
  });
});

describe('the language the suspect answers in', () => {
  it('tells the suspect the player\'s language, in the sheet and right before the reply', () => {
    const prompt = buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null, language: 'nl' });
    expect(prompt).toContain('Speak Dutch');
    expect(buildUserTurn('Kijk hier eens naar.', null, 'nl')).toMatch(/\[Reply in Dutch, unless/);
    // Earlier turns in the history carry no reminder.
    expect(buildUserTurn('Kijk hier eens naar.', null)).not.toContain('Reply in');
  });

  it('falls back on the language of the question when the game does not say', () => {
    const prompt = buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null });
    expect(prompt).toContain('Answer in the same language the detective writes in');
  });

  it('keeps the training case strictly to the sheet', () => {
    const tutorial = { ...c, id: 'tutorial' };
    expect(buildSuspectPrompt({ caseFile: tutorial, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null })).toContain('# This is the training case');
    expect(buildSuspectPrompt({ caseFile: c, suspectId: 'nora', ctx, mood: 'calm', shownEvidence: null })).not.toContain('training case');
  });
});
