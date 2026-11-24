// What the desktop app shows on Discord ("Rich Presence"). Pure: from the current path, the open
// save and the player's choice, build two short lines. The desktop shell adds the logo, the timer
// and the "Play Red String" button. Nothing here names a culprit or a clue.
import type { CaseFile } from '@shared/caseSchema.ts';
import type { SaveSlotData } from '../engine/types.ts';
import { t, type MessageKey } from '../i18n/index.ts';

export type PresenceMode = 'full' | 'minimal' | 'off';

export interface PresenceStatus {
  details: string;
  state?: string;
}
// No start time and no small icon are sent on purpose. The shell then counts from when the game was
// opened, so the timer on Discord runs on steadily instead of jumping back to 0:00 whenever the
// player walks into a case or back to the menu.

const MENU_LINES: Record<string, MessageKey> = {
  '/': 'presence.mainMenu',
  '/cases': 'presence.cases',
  '/slots': 'presence.slots',
  '/settings': 'presence.settings',
  '/account': 'presence.account',
  '/credits': 'presence.credits',
};

export interface PresenceInput {
  pathname: string;
  mode: PresenceMode;
  slot: SaveSlotData | null;
  /** Looks up a case by key; null when it does not exist. */
  caseFile: (caseKey: string) => CaseFile | null;
}

export function describePresence({ pathname, mode, slot, caseFile }: PresenceInput): PresenceStatus | null {
  if (mode === 'off') return null;
  const match = /^\/case\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?/.exec(pathname);

  if (!match) {
    if (mode === 'minimal') return { details: t('presence.menus') };
    return { details: t(MENU_LINES[pathname] ?? 'presence.menus') };
  }

  if (mode === 'minimal') return { details: t('presence.working') };

  const caseKey = decodeURIComponent(match[1]!);
  const screen = match[2] ?? '';
  const param = match[3] ? decodeURIComponent(match[3]) : '';
  const c = caseFile(caseKey);
  if (!c) return { details: t('presence.working') };

  const progress = slot?.progress[caseKey];
  let state: string;
  switch (screen) {
    case 'briefing':
      state = t('presence.briefing');
      break;
    case 'rooms':
      state = t('presence.rooms');
      break;
    case 'room': {
      const room = c.rooms.find((r) => r.id === param);
      state = room ? t('presence.atScene', { room: room.name }) : t('presence.searching');
      break;
    }
    case 'suspects':
      state = t('presence.lineup');
      break;
    case 'interrogate': {
      const suspect = c.suspects.find((s) => s.id === param);
      state = suspect ? t('presence.questioning', { name: suspect.name }) : t('presence.interview');
      break;
    }
    case 'board':
      state = t('presence.board');
      break;
    case 'notebook':
      state = t('presence.notebook');
      break;
    case 'accuse':
      state = t('presence.accuse');
      break;
    case 'ending': {
      const verdict = progress?.accusation;
      if (!verdict) state = t('presence.waiting');
      else if (verdict.outcome === 'correct') state = t('presence.closedRank', { rank: verdict.rank });
      else state = t('presence.closedFailed');
      break;
    }
    default:
      state = t('presence.onCase');
  }

  return { details: t('presence.case', { title: c.title }), state };
}
