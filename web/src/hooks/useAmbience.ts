import { useEffect } from 'react';
import { audio, type Ambience } from '../audio/audio.ts';

/** Set the background ambience while a screen is mounted. */
export function useAmbience(kind: Ambience): void {
  useEffect(() => {
    audio.setAmbience(kind);
  }, [kind]);
}
