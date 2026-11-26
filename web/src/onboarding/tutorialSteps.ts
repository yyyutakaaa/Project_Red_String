// The tutorial guide's script: for the screen the player is on and what they have done so far in
// the tutorial case, what the note says and which part of the screen its arrow points at.
// Pure: no React, no DOM, so it can be tested.
import type { CaseProgress } from '../engine/types.ts';
import type { MessageKey } from '../i18n/index.ts';

export interface TourStep {
  id: string;
  /** CSS selector of the element the arrow points at; null for a note without an arrow. */
  target: string | null;
  title: MessageKey;
  text: MessageKey;
  /** A hint underneath, for players who get stuck. */
  tip?: MessageKey;
  /** CSS selector of something the note must not cover, besides the target. */
  clear?: string;
}

const LOBBY = ['bell-note', 'switchboard-log', 'cash-envelope'];
const OFFICE = ['finch-diary', 'buyer-letter'];

const tid = (id: string) => `[data-testid="${id}"]`;
const nav = (to: string) => `[data-tour="nav-${to}"]`;
/** The question box and its buttons: the note stays off them while the player has to use them. */
const QUESTION = '[data-tour="composer"]';

/** The screen inside a case, from the path below /case/:key/ (rooms, room, suspects, ...). */
export type CaseScreen = 'briefing' | 'rooms' | 'room' | 'suspects' | 'interrogate' | 'board' | 'notebook' | 'accuse' | 'ending' | string;

export function tutorialStep(screen: CaseScreen, target: string | null, p: CaseProgress): TourStep {
  const found = new Set(p.foundEvidence);
  const has = (ids: string[]) => ids.every((id) => found.has(id));
  const asked = (s: string) => Boolean(p.conversations[s]?.messages.some((m) => m.role === 'detective'));
  const shown = (s: string, e: string) => Boolean(p.conversations[s]?.shownEvidence.includes(e));
  const pikeDone = shown('pike', 'bell-note') && shown('pike', 'finch-diary');
  const margaretDone = asked('margaret') && shown('margaret', 'buyer-letter');
  const searched = has(LOBBY) && has(OFFICE);

  const toSuspects: TourStep = { id: 'to-suspects', target: nav('suspects'), title: 'tour.toSuspectsTitle', text: 'tour.toSuspectsText' };
  const toBoard: TourStep = { id: 'to-board', target: nav('board'), title: 'tour.toBoardTitle', text: 'tour.toBoardText' };
  const needEvidence: TourStep = { id: 'need-evidence', target: nav('rooms'), title: 'tour.needEvidenceTitle', text: 'tour.needEvidenceText' };

  switch (screen) {
    case 'briefing':
      return { id: 'briefing', target: tid('begin-investigation'), title: 'tour.briefingTitle', text: 'tour.briefingText', tip: 'tour.briefingTip' };

    case 'rooms':
      if (!has(LOBBY)) return { id: 'rooms', target: tid('room-link-lobby'), title: 'tour.roomsTitle', text: 'tour.roomsText' };
      if (!has(OFFICE)) return { id: 'rooms-office', target: tid('room-link-office'), title: 'tour.roomsTitle', text: 'tour.roomsOfficeText' };
      return toSuspects;

    case 'room':
      if (target === 'lobby') {
        if (!LOBBY.some((id) => found.has(id))) {
          return { id: 'search', target: tid('hotspot-front-desk'), title: 'tour.searchTitle', text: 'tour.searchText', tip: 'tour.searchTip' };
        }
        if (!found.has('switchboard-log')) return { id: 'found', target: tid('hotspot-switchboard'), title: 'tour.foundTitle', text: 'tour.foundText' };
        if (!found.has('cash-envelope')) return { id: 'coat', target: tid('hotspot-coat-rack'), title: 'tour.coatTitle', text: 'tour.coatText' };
        if (!has(OFFICE)) return { id: 'to-office', target: tid('room-tab-office'), title: 'tour.toOfficeTitle', text: 'tour.toOfficeText' };
        return toSuspects;
      }
      if (target === 'office') {
        if (!found.has('finch-diary')) return { id: 'desk', target: tid('hotspot-writing-desk'), title: 'tour.deskTitle', text: 'tour.deskText' };
        if (!found.has('buyer-letter')) return { id: 'waste', target: tid('hotspot-wastebasket'), title: 'tour.wasteTitle', text: 'tour.wasteText', tip: 'tour.wasteTip' };
        if (!has(LOBBY)) return { id: 'to-lobby', target: tid('room-tab-lobby'), title: 'tour.toLobbyTitle', text: 'tour.toLobbyText' };
        return toSuspects;
      }
      return needEvidence;

    case 'suspects':
      if (!searched) return { ...needEvidence, id: 'suspects-early', text: 'tour.suspectsEarlyText' };
      if (!pikeDone) return { id: 'suspects', target: tid('interrogate-pike'), title: 'tour.suspectsTitle', text: 'tour.suspectsText', tip: 'tour.hintTip' };
      if (!margaretDone) return { id: 'suspects-margaret', target: tid('interrogate-margaret'), title: 'tour.suspectsTitle', text: 'tour.suspectsMargaretText' };
      return toBoard;

    case 'interrogate':
      if (target === 'pike') {
        if (!asked('pike')) return { id: 'ask', target: tid('question-input'), title: 'tour.askTitle', text: 'tour.askText', tip: 'tour.askTip' };
        if (!shown('pike', 'bell-note')) {
          if (!found.has('bell-note')) return needEvidence;
          return { id: 'show', target: tid('show-evidence-button'), title: 'tour.showTitle', text: 'tour.showText', tip: 'tour.showTip', clear: QUESTION };
        }
        if (!shown('pike', 'finch-diary')) {
          if (!found.has('finch-diary')) return needEvidence;
          return { id: 'show-diary', target: tid('show-evidence-button'), title: 'tour.showDiaryTitle', text: 'tour.showDiaryText', clear: QUESTION };
        }
        if (!margaretDone) return { id: 'pike-done', target: tid('switch-suspect-margaret'), title: 'tour.pikeDoneTitle', text: 'tour.pikeDoneText' };
        return toBoard;
      }
      if (target === 'margaret') {
        if (!asked('margaret')) return { id: 'ask-margaret', target: tid('question-input'), title: 'tour.askMargaretTitle', text: 'tour.askMargaretText' };
        if (!shown('margaret', 'buyer-letter')) {
          if (!found.has('buyer-letter')) return needEvidence;
          return { id: 'show-letter', target: tid('show-evidence-button'), title: 'tour.showLetterTitle', text: 'tour.showLetterText', tip: 'tour.showLetterTip', clear: QUESTION };
        }
        if (!pikeDone) return { id: 'to-pike', target: tid('switch-suspect-pike'), title: 'tour.toPikeTitle', text: 'tour.toPikeText' };
        return toBoard;
      }
      return toSuspects;

    case 'board':
      if (!p.board.links.some((l) => !l.auto)) return { id: 'board', target: tid('pin-pike'), title: 'tour.boardTitle', text: 'tour.boardText', tip: 'tour.boardTip' };
      if (!p.board.lastCheck) return { id: 'check', target: tid('check-theory'), title: 'tour.checkTitle', text: 'tour.checkText' };
      return { id: 'to-accuse', target: nav('accuse'), title: 'tour.toAccuseTitle', text: 'tour.toAccuseText' };

    case 'notebook':
      return { id: 'notebook', target: null, title: 'tour.notebookTitle', text: 'tour.notebookText' };

    case 'accuse':
      return { id: 'accuse', target: '[data-testid^="accuse-suspect-"]', title: 'tour.accuseTitle', text: 'tour.accuseText', tip: 'tour.accuseTip' };

    case 'ending':
      return { id: 'ending', target: `${tid('next-case')}, ${tid('to-main-menu')}`, title: 'tour.endingTitle', text: 'tour.endingText' };

    default:
      return { id: 'other', target: null, title: 'tour.otherTitle', text: 'tour.otherText' };
  }
}
