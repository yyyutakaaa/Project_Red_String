import { useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/audio.ts';
import { TEXT_SPEED_CPS, useReducedMotion, useSettings } from '../store/settings.ts';
import styles from './Interrogation.parts.module.css';

interface TypewriterProps {
  /** The text to reveal. It may keep growing while a reply streams in. */
  text: string;
  /** False renders the whole text at once. */
  animate?: boolean;
  /** True while more text is still expected: keeps the caret visible once the reveal catches up. */
  streaming?: boolean;
  /** Play the soft key tick while revealing. */
  sound?: boolean;
  className?: string;
}

/** Reveal a tick every few characters, not on every one. The audio engine also throttles. */
const SOUND_EVERY = 4;

/**
 * Progressive text reveal. Speed follows the text speed setting; instant speed and reduced motion show
 * everything at once. Screen readers get the full text from a visually hidden copy, filled once the stream
 * has finished, while the animated copy is hidden from them, so nothing is read out letter by letter.
 */
export function Typewriter({ text, animate = true, streaming = false, sound = true, className }: TypewriterProps) {
  const speed = useSettings((s) => s.textSpeed);
  const reduced = useReducedMotion();
  const cps = TEXT_SPEED_CPS[speed];
  const instant = !animate || reduced || !Number.isFinite(cps) || cps <= 0;
  const target = text.length;

  const [shown, setShown] = useState(() => (instant ? target : 0));
  // Mutable animation state shared with the frame loop, so growing text does not restart the loop.
  const live = useRef({ shown: instant ? target : 0, target, cps, sound, raf: 0 });

  useEffect(() => {
    const s = live.current;
    s.target = target;
    s.cps = cps;
    s.sound = sound;
    if (instant) {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.shown = target;
      return;
    }
    if (s.shown > target) {
      // The text was replaced by something shorter (the final reply can differ from the stream).
      s.shown = target;
      setShown(target);
    }
    if (s.raf !== 0 || s.shown >= target) return;

    let last: number | null = null;
    let carry = 0;
    let sinceTick = 0;
    const step = (now: number) => {
      if (last !== null) carry += ((now - last) * s.cps) / 1000;
      last = now;
      const whole = Math.floor(carry);
      if (whole > 0) {
        carry -= whole;
        const next = Math.min(s.target, s.shown + whole);
        sinceTick += next - s.shown;
        s.shown = next;
        setShown(next);
        if (s.sound && sinceTick >= SOUND_EVERY) {
          sinceTick = 0;
          sfx('type');
        }
      }
      s.raf = s.shown < s.target ? requestAnimationFrame(step) : 0;
    };
    s.raf = requestAnimationFrame(step);
  }, [instant, cps, target, sound]);

  useEffect(() => {
    const s = live.current;
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  const visible = instant ? target : Math.min(shown, target);
  const showCaret = !reduced && (visible < target || streaming);

  return (
    <span className={`${styles.typewriter} ${className ?? ''}`}>
      {/* Left empty until the stream ends: inside a live region every delta would otherwise be read out. */}
      <span className="visually-hidden">{streaming ? '' : text}</span>
      <span aria-hidden="true">
        {text.slice(0, visible)}
        {showCaret && <span className={styles.caret} />}
      </span>
    </span>
  );
}
