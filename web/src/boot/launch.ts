// Opening a case or a save goes through a short loading screen of at least LAUNCH_MIN_MS. While it
// shows, the case screens are fetched, so the case opens complete instead of piece by piece.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { audio } from '../audio/audio.ts';

export const LAUNCH_MIN_MS = 2000;

interface LaunchState {
  active: boolean;
  leaving: boolean;
  kicker: string;
  title: string;
  startedAt: number;
}

export const useLaunchState = create<LaunchState>(() => ({ active: false, leaving: false, kicker: '', title: '', startedAt: 0 }));

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
      useLaunchState.setState({ active: true, leaving: false, kicker: info.kicker ?? '', title: info.title, startedAt: performance.now() });
      // Going into a case: the music hands over during the loading screen, so the case opens with
      // its own music already playing. The case screen then sets the exact mood of the room.
      if (to.startsWith('/case/')) audio.setAmbience('rain');
      await Promise.all([delay(LAUNCH_MIN_MS), preloadCaseScreens(), info.prepare?.().catch(() => undefined)]);
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
