import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { ToastHost } from './components/ToastHost.tsx';
import { audio } from './audio/audio.ts';
import { applySettingsToDocument, useSettings } from './store/settings.ts';
import { MainMenu } from './screens/MainMenu.tsx';
import { NotFound } from './screens/NotFound.tsx';


// Screens load on demand so the menu appears quickly; story case data ships with the case screens.
function screen<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  const C: ComponentType = lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));
  return <C />;
}
const page = (node: ReactNode) => <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">Opening the file...</div>}>{node}</Suspense>;

function Root() {
  const fontSize = useSettings((s) => s.fontSize);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const masterVolume = useSettings((s) => s.masterVolume);
  const musicVolume = useSettings((s) => s.musicVolume);
  const sfxVolume = useSettings((s) => s.sfxVolume);

  useEffect(() => {
    applySettingsToDocument({ fontSize, reducedMotion });
  }, [fontSize, reducedMotion]);

  useEffect(() => {
    audio.setVolumes(masterVolume, musicVolume, sfxVolume);
  }, [masterVolume, musicVolume, sfxVolume]);

  useEffect(() => {
    // Browsers only allow audio after a user gesture.
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <>
      <Outlet />
      <ToastHost />
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <MainMenu /> },
      { path: '/slots', element: page(screen(() => import('./screens/SaveSlots.tsx'), 'SaveSlots')) },
      { path: '/cases', element: page(screen(() => import('./screens/CaseSelect.tsx'), 'CaseSelect')) },
      { path: '/new-case', element: page(screen(() => import('./screens/NewCase.tsx'), 'NewCase')) },
      { path: '/settings', element: page(screen(() => import('./screens/Settings.tsx'), 'SettingsScreen')) },
      { path: '/credits', element: page(screen(() => import('./screens/Credits.tsx'), 'Credits')) },
      {
        path: '/case/:caseKey',
        element: page(screen(() => import('./screens/CaseLayout.tsx'), 'CaseLayout')),
        children: [
          { path: 'briefing', element: page(screen(() => import('./screens/Briefing.tsx'), 'Briefing')) },
          { path: 'rooms', element: page(screen(() => import('./screens/RoomSelect.tsx'), 'RoomSelect')) },
          { path: 'room/:roomId', element: page(screen(() => import('./screens/Room.tsx'), 'Room')) },
          { path: 'suspects', element: page(screen(() => import('./screens/Suspects.tsx'), 'Suspects')) },
          { path: 'interrogate/:suspectId', element: page(screen(() => import('./screens/Interrogation.tsx'), 'Interrogation')) },
          { path: 'board', element: page(screen(() => import('./screens/Board.tsx'), 'Board')) },
          { path: 'notebook', element: page(screen(() => import('./screens/Notebook.tsx'), 'Notebook')) },
          { path: 'accuse', element: page(screen(() => import('./screens/Accusation.tsx'), 'Accusation')) },
          { path: 'ending', element: page(screen(() => import('./screens/Ending.tsx'), 'Ending')) },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
