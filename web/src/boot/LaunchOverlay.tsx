import { useEffect, useState } from 'react';
import { LoadingScreen } from '../components/LoadingScreen.tsx';
import { LAUNCH_MIN_MS, useLaunchState } from './launch.ts';
import { useT, type MessageKey } from '../i18n/index.ts';

const STATUSES: MessageKey[] = ['launch.drawer', 'launch.photos', 'launch.string'];

/** The loading screen shown by useLaunch(). Lives inside the router, above every screen. */
export function LaunchOverlay() {
  const { active, leaving, kicker, title, startedAt } = useLaunchState();
  const [progress, setProgress] = useState(0);
  const { t } = useT();

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      setProgress(Math.min(1, (performance.now() - startedAt) / LAUNCH_MIN_MS));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, startedAt]);

  if (!active) return null;
  const status = t(progress >= 1 ? 'launch.door' : STATUSES[Math.min(STATUSES.length - 1, Math.floor(progress * STATUSES.length))]!);
  return <LoadingScreen progress={progress} kicker={kicker} title={title} status={status} leaving={leaving} />;
}
