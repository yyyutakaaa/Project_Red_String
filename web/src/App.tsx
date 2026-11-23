import { useEffect } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { ToastHost } from './components/ToastHost.tsx';
import { audio } from './audio/audio.ts';
import { applySettingsToDocument, useSettings } from './store/settings.ts';
import { MainMenu } from './screens/MainMenu.tsx';
import { SaveSlots } from './screens/SaveSlots.tsx';
import { CaseSelect } from './screens/CaseSelect.tsx';
import { NewCase } from './screens/NewCase.tsx';
import { SettingsScreen } from './screens/Settings.tsx';
import { Credits } from './screens/Credits.tsx';
import { CaseLayout } from './screens/CaseLayout.tsx';
import { Briefing } from './screens/Briefing.tsx';
import { RoomSelect } from './screens/RoomSelect.tsx';
import { Room } from './screens/Room.tsx';
import { Suspects } from './screens/Suspects.tsx';
import { Interrogation } from './screens/Interrogation.tsx';
import { Board } from './screens/Board.tsx';
import { Notebook } from './screens/Notebook.tsx';
import { Accusation } from './screens/Accusation.tsx';
import { Ending } from './screens/Ending.tsx';
import { NotFound } from './screens/NotFound.tsx';

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
      { path: '/slots', element: <SaveSlots /> },
      { path: '/cases', element: <CaseSelect /> },
      { path: '/new-case', element: <NewCase /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '/credits', element: <Credits /> },
      {
        path: '/case/:caseKey',
        element: <CaseLayout />,
        children: [
          { path: 'briefing', element: <Briefing /> },
          { path: 'rooms', element: <RoomSelect /> },
          { path: 'room/:roomId', element: <Room /> },
          { path: 'suspects', element: <Suspects /> },
          { path: 'interrogate/:suspectId', element: <Interrogation /> },
          { path: 'board', element: <Board /> },
          { path: 'notebook', element: <Notebook /> },
          { path: 'accuse', element: <Accusation /> },
          { path: 'ending', element: <Ending /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
