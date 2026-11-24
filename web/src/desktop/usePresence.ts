import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveCase } from '../hooks/useCase.ts';
import { useGame } from '../store/game.ts';
import { useSettings } from '../store/settings.ts';
import { desktop } from './bridge.ts';
import { describePresence } from './presence.ts';

/** Keep the Discord status in step with the screen. Does nothing outside the desktop app. */
export function usePresence(): void {
  const { pathname } = useLocation();
  const mode = useSettings((s) => s.discordPresence);
  const slot = useGame((s) => s.slot);
  useEffect(() => {
    const send = desktop()?.setPresence;
    if (!send) return;
    send(
      describePresence({
        pathname,
        mode,
        slot,
        caseFile: (k) => resolveCase(k)?.caseFile ?? null,
      }),
    );
  }, [pathname, mode, slot]);
}
