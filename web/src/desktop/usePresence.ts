import { useEffect, useRef } from 'react';
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
  // The Discord timer counts from when the player walked into the current case.
  const entered = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const send = desktop()?.setPresence;
    if (!send) return;
    const key = /^\/case\/([^/]+)/.exec(pathname)?.[1] ?? null;
    if (!key) entered.current = null;
    else if (entered.current?.key !== key) entered.current = { key, at: Date.now() };
    send(
      describePresence({
        pathname,
        mode,
        slot,
        caseFile: (k) => resolveCase(k)?.caseFile ?? null,
        caseEnteredAt: entered.current?.at,
      }),
    );
  }, [pathname, mode, slot]);
}
