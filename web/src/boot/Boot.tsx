import { useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '../components/LoadingScreen.tsx';
import { runBoot, useBoot } from './boot.ts';

/** Holds the game behind the start-up screen until everything is loaded (and at least 1.5 s). */
export function Boot({ children }: { children: ReactNode }) {
  const { progress, status, done } = useBoot();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    void runBoot();
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 450);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <>
      {done && children}
      {!gone && <LoadingScreen masthead title="Project Red String" progress={progress} status={status} leaving={done} />}
    </>
  );
}
