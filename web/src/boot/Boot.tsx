import { useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '../components/LoadingScreen.tsx';
import { runBoot, useBoot } from './boot.ts';
import { useT } from '../i18n/index.ts';

/** Holds the game behind the start-up screen until everything is loaded (and at least 1.5 s). */
export function Boot({ children }: { children: ReactNode }) {
  const { progress, status, done } = useBoot();
  const [gone, setGone] = useState(false);
  const { t } = useT();

  useEffect(() => {
    void runBoot();
  }, []);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setGone(true), 450);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <>
      {done && children}
      {!gone && <LoadingScreen masthead title="Project Red String" progress={progress} status={t(status)} leaving={done} />}
    </>
  );
}
