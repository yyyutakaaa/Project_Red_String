// The film look that sits over every screen: moving grain, and a venetian-blind wipe that opens
// onto each new scene. Decorative only; nothing here takes pointer events.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLaunchState } from '../boot/launch.ts';
import { useReducedMotion } from '../store/settings.ts';
import styles from './Cinema.module.css';

const SLATS = 9;

/** Walking from one room to the next, or one suspect to the next, is not a new scene. */
function sceneOf(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'case') return `case/${parts[1] ?? ''}/${parts[2] ?? ''}`;
  return parts[0] ?? '';
}

function Blinds() {
  const { pathname } = useLocation();
  const launching = useLaunchState((s) => s.active);
  const [scene, setScene] = useState(() => sceneOf(pathname));
  const [run, setRun] = useState(0);

  const next = sceneOf(pathname);
  if (next !== scene) {
    setScene(next);
    // The launch screen fades by itself; no second transition on top of it.
    if (!launching) setRun((r) => r + 1);
  }

  if (run === 0) return null;
  return (
    <div key={run} className={styles.blinds} aria-hidden="true">
      {Array.from({ length: SLATS }, (_, i) => (
        <span key={i} style={{ ['--i' as string]: i }} />
      ))}
    </div>
  );
}

export function Cinema() {
  const reduced = useReducedMotion();
  return (
    <>
      {!reduced && <Blinds />}
      <div className={styles.grain} data-still={reduced || undefined} aria-hidden="true" />
    </>
  );
}
