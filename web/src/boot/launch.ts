// Opening a case or a save goes through a short loading screen of at least LAUNCH_MIN_MS. While it
// shows, the case screens are fetched, so the case opens complete instead of piece by piece.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { audio } from '../audio/audio.ts';
import { markSeen, seenBefore, skippableDelay } from './skip.ts';

export const LAUNCH_MIN_MS = 2000;

interface LaunchState {
  active: boolean;
  leaving: boolean;
  kicker: string;
  title: string;
  /** The painted backdrop behind the loading card: the case's own scene, or the street. */
  scene: string;
  startedAt: number;
  /** The player has seen this screen before and may skip the wait. */
  skippable: boolean;
  skipped: boolean;
}

export const useLaunchState = create<LaunchState>(() => ({ active: false, leaving: false, kicker: '', title: '', scene: 'street', startedAt: 0, skippable: false, skipped: false }));

let skipWait: (() => void) | null = null;

/** End the minimum wait of the loading screen that is showing. What is still loading finishes first. */
export function skipLaunch(): void {
  if (!useLaunchState.getState().skippable || !skipWait) return;
  useLaunchState.setState({ skipped: true });
  skipWait();
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Every screen inside a case, so they are cached before the player arrives. */
export function preloadCaseScreens(): Promise<unknown> {
  return Promise.all([
    import('../screens/CaseLayout.tsx'),
    import('../screens/Briefing.tsx'),
    import('../screens/RoomSelect.tsx'),
    import('../screens/Room.tsx'),
    import('../screens/Suspects.tsx'),
    import('../screens/Interrogation.tsx'),
    import('../screens/Board.tsx'),
    import('../screens/Notebook.tsx'),
    import('../screens/Accusation.tsx'),
    import('../screens/Ending.tsx'),
  ]).catch(() => undefined); // A failed chunk shows the route error screen after navigating.
}

export interface LaunchInfo {
  kicker?: string;
  title: string;
  /** Extra work to finish before arriving. */
  prepare?: () => Promise<unknown>;
}

/** Returns launch(to, info): show the loading screen, load, wait the minimum, then navigate. */
export function useLaunch() {
  const navigate = useNavigate();
  return useCallback(
    async (to: string, info: LaunchInfo) => {
      if (useLaunchState.getState().active) return;
      const wait = skippableDelay(LAUNCH_MIN_MS);
      skipWait = wait.skip;
      useLaunchState.setState({
        active: true,
        leaving: false,
        kicker: info.kicker ?? '',
        title: info.title,
        scene: /^\/case\/([^/]+)/.exec(to)?.[1] ?? 'street',
        startedAt: performance.now(),
        skippable: seenBefore('launch'),
        skipped: false,
      });
      // Going into a case: the music hands over during the loading screen, so the case opens with
      // its own music already playing. The case screen then sets the exact mood of the room.
      if (to.startsWith('/case/')) audio.setAmbience('rain');
      await Promise.all([wait.done, preloadCaseScreens(), info.prepare?.().catch(() => undefined)]);
      skipWait = null;
      markSeen('launch');
      navigate(to);
      // Cover the first paint of the new screen, then fade out.
      await delay(120);
      useLaunchState.setState({ leaving: true });
      await delay(450);
      useLaunchState.setState({ active: false, leaving: false });
    },
    [navigate],
  );
}
