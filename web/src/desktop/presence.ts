// What the desktop app shows on Discord ("Rich Presence"). Pure: from the current path, the open
// save and the player's choice, build two short lines. The desktop shell adds the logo, the timer
// and the "Play Red String" button. Nothing here names a culprit or a clue.
import type { CaseFile } from '@shared/caseSchema.ts';
import type { SaveSlotData } from '../engine/types.ts';

export type PresenceMode = 'full' | 'minimal' | 'off';

export interface PresenceStatus {
  details: string;
  state?: string;
}
// No start time and no small icon are sent on purpose. The shell then counts from when the game was
// opened, so the timer on Discord runs on steadily instead of jumping back to 0:00 whenever the
// player walks into a case or back to the menu.

const MENU_LINES: Record<string, string> = {
  '/': 'In the main menu',
  '/cases': 'Choosing a case file',
  '/slots': 'Going through the save drawers',
  '/settings': 'Adjusting the settings',
  '/account': 'At the records office',
  '/credits': 'Reading the credits',
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
    if (mode === 'minimal') return { details: 'In the menus' };
    return { details: MENU_LINES[pathname] ?? 'In the menus' };
  }

  if (mode === 'minimal') return { details: 'Working a case' };

  const caseKey = decodeURIComponent(match[1]!);
  const screen = match[2] ?? '';
  const param = match[3] ? decodeURIComponent(match[3]) : '';
  const c = caseFile(caseKey);
  if (!c) return { details: 'Working a case' };

  const progress = slot?.progress[caseKey];
  let state: string;
  switch (screen) {
    case 'briefing':
      state = 'Reading the briefing';
      break;
    case 'rooms':
      state = 'Choosing a scene to search';
      break;
    case 'room': {
      const room = c.rooms.find((r) => r.id === param);
      state = room ? `At the scene: ${room.name}` : 'Searching the scenes';
      break;
    }
    case 'suspects':
      state = 'Looking over the lineup';
      break;
    case 'interrogate': {
      const suspect = c.suspects.find((s) => s.id === param);
      state = suspect ? `Questioning ${suspect.name}` : 'In the interview room';
      break;
    }
    case 'board':
      state = 'Tying strings on the board';
      break;
    case 'notebook':
      state = 'Going through the notebook';
      break;
    case 'accuse':
      state = 'Making the accusation';
      break;
    case 'ending': {
      const verdict = progress?.accusation;
      if (!verdict) state = 'Waiting for the verdict';
      else if (verdict.outcome === 'correct') state = `Case closed. Rank ${verdict.rank}`;
      else state = 'Case closed. It did not hold';
      break;
    }
    default:
      state = 'On the case';
  }

  return { details: `Case: ${c.title}`, state };
}
