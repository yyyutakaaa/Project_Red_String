import { describe, expect, it } from 'vitest';
import { newCaseProgress } from '../../engine/save.ts';
import type { CaseProgress, ConversationState } from '../../engine/types.ts';
import { firstRunStep, parseOnboarding, type OnboardingState } from '../onboarding.ts';
import { tutorialStep } from '../tutorialSteps.ts';

const fresh: OnboardingState = { languageChosen: false, accountAsked: false, tutorialSeen: false, tutorialDone: false };
const user = { id: 'u1', username: 'sam', prefs: {} };

describe('first start', () => {
  it('asks for the language, then an account, then the tutorial', () => {
    expect(firstRunStep(fresh, null, true)).toBe('language');
    expect(firstRunStep({ ...fresh, languageChosen: true }, null, true)).toBe('account');
    expect(firstRunStep({ ...fresh, languageChosen: true, accountAsked: true }, null, true)).toBe('tutorial');
    expect(firstRunStep({ ...fresh, languageChosen: true, accountAsked: true, tutorialSeen: true }, null, true)).toBeNull();
  });

  it('skips the account popup when signed in or when the game has no accounts', () => {
    expect(firstRunStep({ ...fresh, languageChosen: true }, user, true)).toBe('tutorial');
    expect(firstRunStep({ ...fresh, languageChosen: true }, null, false)).toBe('tutorial');
  });

  it('never offers a tutorial that was played', () => {
    expect(firstRunStep({ ...fresh, languageChosen: true, accountAsked: true, tutorialDone: true }, null, true)).toBeNull();
  });

  it('reads only true flags from storage', () => {
    expect(parseOnboarding('{"languageChosen":true,"tutorialDone":"yes"}')).toEqual({ ...fresh, languageChosen: true });
    expect(parseOnboarding('not json')).toBeNull();
  });
});

function progress(patch: Partial<CaseProgress> = {}): CaseProgress {
  return { ...newCaseProgress('tutorial', 'story'), ...patch };
}
function talk(asked: boolean, shown: string[]): ConversationState {
  return {
    messages: asked ? [{ id: 'm', role: 'detective', text: 'Where were you?', at: 1 }] : [],
    patienceUsed: 0,
    patienceMax: 16,
    mood: 'calm',
    shownEvidence: shown,
  };
}
const ALL = ['bell-note', 'switchboard-log', 'cash-envelope', 'finch-diary', 'buyer-letter'];

describe('tutorial guide', () => {
  it('starts at the briefing and points at the button', () => {
    expect(tutorialStep('briefing', null, progress()).target).toBe('[data-testid="begin-investigation"]');
  });

  it('walks the lobby one place at a time, then sends the player on', () => {
    expect(tutorialStep('room', 'lobby', progress()).target).toContain('hotspot-front-desk');
    expect(tutorialStep('room', 'lobby', progress({ foundEvidence: ['bell-note'] })).target).toContain('hotspot-switchboard');
    expect(tutorialStep('room', 'lobby', progress({ foundEvidence: ['bell-note', 'switchboard-log'] })).target).toContain('hotspot-coat-rack');
    expect(tutorialStep('room', 'lobby', progress({ foundEvidence: ['bell-note', 'switchboard-log', 'cash-envelope'] })).target).toContain('room-tab-office');
    expect(tutorialStep('room', 'office', progress({ foundEvidence: ALL })).target).toBe('[data-tour="nav-suspects"]');
  });

  it('teaches asking, then showing evidence, then the other suspect', () => {
    const base = { foundEvidence: ALL };
    expect(tutorialStep('interrogate', 'pike', progress(base)).id).toBe('ask');
    expect(tutorialStep('interrogate', 'pike', progress({ ...base, conversations: { pike: talk(true, []) } })).id).toBe('show');
    expect(tutorialStep('interrogate', 'pike', progress({ ...base, conversations: { pike: talk(true, ['bell-note']) } })).id).toBe('show-diary');
    expect(tutorialStep('interrogate', 'pike', progress({ ...base, conversations: { pike: talk(true, ['bell-note', 'finch-diary']) } })).id).toBe('pike-done');
  });

  it('sends the player back to search when the evidence to show is missing', () => {
    expect(tutorialStep('interrogate', 'pike', progress({ conversations: { pike: talk(true, []) } })).id).toBe('need-evidence');
  });

  it('goes from the board to the accusation', () => {
    const p = progress({ foundEvidence: ALL });
    expect(tutorialStep('board', null, p).id).toBe('board');
    const linked = { ...p, board: { ...p.board, links: [{ id: 'l', from: 'pike', to: 'finch-diary', status: null }] } };
    expect(tutorialStep('board', null, linked).id).toBe('check');
    const checked = { ...linked, board: { ...linked.board, lastCheck: { total: 1, supported: 1, unsupported: 0, neutral: 0 } } };
    expect(tutorialStep('board', null, checked).target).toBe('[data-tour="nav-accuse"]');
  });
});
