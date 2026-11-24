import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useNavigate } from 'react-router-dom';
import { ToastHost } from './components/ToastHost.tsx';
import { TooSmall } from './components/TooSmall.tsx';
import { UpdatePopup } from './desktop/UpdatePopup.tsx';
import { Boot } from './boot/Boot.tsx';
import { LaunchOverlay } from './boot/LaunchOverlay.tsx';
import { Cinema } from './cinema/Cinema.tsx';
import { desktop } from './desktop/bridge.ts';
import { TitleBar } from './desktop/TitleBar.tsx';
import { usePresence } from './desktop/usePresence.ts';
import { audio } from './audio/audio.ts';
import { applySettingsToDocument, useSettings } from './store/settings.ts';
import { MainMenu } from './screens/MainMenu.tsx';
import { NotFound } from './screens/NotFound.tsx';
// Loaded eagerly: it has to render even when a screen's chunk could not be fetched.
import { RouteError } from './screens/RouteError.tsx';
import { t } from './i18n/index.ts';

// Screens load on demand so the menu appears quickly; story case data ships with the case screens.
function screen<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  const C: ComponentType = lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));
  return <C />;
}
const page = (node: ReactNode) => <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">{t('route.opening')}</div>}>{node}</Suspense>;

function Root() {
  const navigate = useNavigate();
  usePresence();
  const fontSize = useSettings((s) => s.fontSize);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const theme = useSettings((s) => s.theme);
  const masterVolume = useSettings((s) => s.masterVolume);
  const musicVolume = useSettings((s) => s.musicVolume);
  const sfxVolume = useSettings((s) => s.sfxVolume);

  useEffect(() => {
    applySettingsToDocument({ fontSize, reducedMotion, theme });
    if (theme !== 'system') return;
    // Follow the system when it switches between light and dark.
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    const onChange = () => applySettingsToDocument({ fontSize, reducedMotion, theme });
    media?.addEventListener('change', onChange);
    return () => media?.removeEventListener('change', onChange);
  }, [fontSize, reducedMotion, theme]);

  useEffect(() => {
    audio.setVolumes(masterVolume, musicVolume, sfxVolume);
  }, [masterVolume, musicVolume, sfxVolume]);

  // The desktop app's menu (Settings…, Account…) opens game screens.
  useEffect(() => desktop()?.onNavigate?.((route) => navigate(route)), [navigate]);

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
      <LaunchOverlay />
      <Cinema />
      <ToastHost />
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <MainMenu /> },
      { path: '/slots', element: page(screen(() => import('./screens/SaveSlots.tsx'), 'SaveSlots')) },
      { path: '/cases', element: page(screen(() => import('./screens/CaseSelect.tsx'), 'CaseSelect')) },
      { path: '/account', element: page(screen(() => import('./screens/Account.tsx'), 'AccountScreen')) },
      { path: '/settings', element: page(screen(() => import('./screens/Settings.tsx'), 'SettingsScreen')) },
      { path: '/credits', element: page(screen(() => import('./screens/Credits.tsx'), 'Credits')) },
      {
        path: '/case/:caseKey',
        element: page(screen(() => import('./screens/CaseLayout.tsx'), 'CaseLayout')),
        errorElement: <RouteError />,
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
  return (
    <>
      <TitleBar />
      <Boot>
        <RouterProvider router={router} />
      </Boot>
      <TooSmall />
      <UpdatePopup />
    </>
  );
}
