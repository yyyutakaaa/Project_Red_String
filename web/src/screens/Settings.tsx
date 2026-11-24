import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import {
  TEXT_SPEED_CPS,
  systemPrefersReducedMotion,
  useReducedMotion,
  useSettings,
  type FontSize,
  type MotionPref,
  type ThemePref,
  systemPrefersLight,
  type Settings,
  type TextSpeed,
} from '../store/settings.ts';
import { sfx } from '../audio/audio.ts';
import styles from './Settings.module.css';

const PREVIEW_LINE = 'The rain had not stopped since Tuesday, and nobody in Calder City was telling the truth.';
const PREVIEW_PAUSE_MS = 1800;

const TEXT_SPEEDS: Array<{ value: TextSpeed; label: string }> = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
  { value: 'instant', label: 'Instant' },
];

const FONT_SIZES: Array<{ value: FontSize; label: string; scale: number }> = [
  { value: 'small', label: 'Small', scale: 0.9375 },
  { value: 'medium', label: 'Medium', scale: 1 },
  { value: 'large', label: 'Large', scale: 1.125 },
  { value: 'xlarge', label: 'Extra large', scale: 1.25 },
];

type VolumeKey = 'masterVolume' | 'musicVolume' | 'sfxVolume';

const VOLUMES: Array<{ key: VolumeKey; label: string; note: string }> = [
  { key: 'masterVolume', label: 'Master volume', note: 'Everything at once.' },
  { key: 'musicVolume', label: 'Music and rain', note: 'The piano and the weather.' },
  { key: 'sfxVolume', label: 'Sound effects', note: 'Paper, pins and stamps.' },
];

/**
 * Types the preview line at the chosen speed, then starts over after a pause. `instant` (instant speed or
 * reduced motion, matching the in-game typewriter) shows the whole line and keeps it still.
 */
function usePreviewTyping(text: string, cps: number, instant: boolean): number {
  const [count, setCount] = useState(0);
  const [run, setRun] = useState(0);
  const still = instant || !Number.isFinite(cps) || cps <= 0;
  useEffect(() => {
    if (still) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const start = performance.now();
    let raf = 0;
    let timer = 0;
    const tick = (t: number) => {
      const n = Math.min(text.length, Math.floor(((t - start) / 1000) * cps));
      setCount(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
      else timer = window.setTimeout(() => setRun((r) => r + 1), PREVIEW_PAUSE_MS);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [text, cps, run, still]);
  return still ? text.length : count;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: string; note?: string; sample?: number }>;
  onChange: (value: T) => void;
  describedBy?: string;
  stack?: boolean;
}

function RadioCards<T extends string>({ legend, name, value, options, onChange, describedBy, stack = false }: RadioGroupProps<T>) {
  return (
    <fieldset className={styles.radioGroup} aria-describedby={describedBy}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={stack ? styles.radioStack : styles.radioRow}>
        {options.map((o) => (
          <label key={o.value} className={`${styles.radio} ${value === o.value ? styles.radioOn : ''}`}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => {
                sfx('click');
                onChange(o.value);
              }}
              className="visually-hidden"
              data-testid={`${name}-${o.value}`}
            />
            {o.sample !== undefined && (
              <span className={styles.sample} style={{ fontSize: `${o.sample * 1.35}rem` }} aria-hidden="true">
                Aa
              </span>
            )}
            <span className={styles.radioLabel}>{o.label}</span>
            {o.note && <span className={styles.radioNote}>{o.note}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function VolumeSlider({ id, label, note, value, onChange }: { id: string; label: string; note: string; value: number; onChange: (v: number) => void }) {
  const percent = Math.round(value * 100);
  return (
    <div className={styles.slider}>
      <div className={styles.sliderHead}>
        <label htmlFor={id} className={styles.sliderLabel}>
          {label}
        </label>
        <span className={styles.sliderValue} aria-hidden="true">
          {percent}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        className={styles.range}
        style={{ ['--fill' as string]: `${percent}%` }}
        aria-valuetext={`${percent} percent`}
        aria-describedby={`${id}-note`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        data-testid={id}
      />
      <p id={`${id}-note`} className={styles.sliderNote}>
        {note}
      </p>
    </div>
  );
}

export function SettingsScreen() {
  useAmbience('menu');
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const set = useSettings((s) => s.set);
  const reset = useSettings((s) => s.reset);
  const [announcement, setAnnouncement] = useState('');
  const motionNoteId = useId();
  const previewNoteId = useId();
  const reduced = useReducedMotion();
  const typed = usePreviewTyping(PREVIEW_LINE, TEXT_SPEED_CPS[settings.textSpeed], reduced);
  const [systemReduced] = useState(() => systemPrefersReducedMotion());
  const [systemLight] = useState(() => systemPrefersLight());
  const themeNoteId = useId();

  useEffect(() => {
    document.title = 'Settings - Project Red String';
  }, []);

  const back = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const patch = (p: Partial<Settings>) => set(p);

  const themeOptions: Array<{ value: ThemePref; label: string; note: string }> = [
    { value: 'dark', label: 'Night shift', note: 'Dark streets, lamp light. The way it was made.' },
    { value: 'light', label: 'Day shift', note: 'Bright and warm, easier in a sunny room.' },
    { value: 'system', label: 'Follow system', note: `Your device is in ${systemLight ? 'light' : 'dark'} mode now.` },
  ];

  const motionOptions: Array<{ value: MotionPref; label: string; note: string }> = [
    { value: 'system', label: 'Follow system', note: `Your device says: ${systemReduced ? 'reduce' : 'full'}.` },
    { value: 'reduced', label: 'Reduce', note: 'No flicker, no drift, no rain in motion.' },
    { value: 'full', label: 'Full', note: 'Every lamp and every drop.' },
  ];

  return (
    <>
      <RainBackdrop lamp="right" intensity="soft" />
      <ScreenFrame
        title="Settings"
        kicker="Desk drawer"
        actions={
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        }
      >
        <div className={styles.grid}>
          <section className={styles.panel} aria-labelledby="sound-heading">
            <h2 id="sound-heading" className={styles.panelTitle}>
              Sound
            </h2>
            {VOLUMES.map((v) => (
              <VolumeSlider
                key={v.key}
                id={`volume-${v.key.replace('Volume', '')}`}
                label={v.label}
                note={v.note}
                value={settings[v.key]}
                onChange={(value) => patch({ [v.key]: value })}
              />
            ))}
            <Button onClick={() => sfx('pickup')} data-testid="test-sound">
              Test sound
            </Button>
          </section>

          <section className={styles.panel} aria-labelledby="text-heading">
            <h2 id="text-heading" className={styles.panelTitle}>
              Text
            </h2>
            <RadioCards
              legend="Text speed"
              name="text-speed"
              value={settings.textSpeed}
              options={TEXT_SPEEDS}
              onChange={(textSpeed) => patch({ textSpeed })}
              describedBy={reduced ? `text-preview-label ${previewNoteId}` : 'text-preview-label'}
            />
            <figure className={`paper ${styles.preview}`}>
              <figcaption id="text-preview-label" className={styles.previewLabel}>
                Preview
              </figcaption>
              <p className={styles.previewLine} aria-hidden="true">
                {PREVIEW_LINE.slice(0, typed)}
                <span className={styles.previewRest}>{PREVIEW_LINE.slice(typed)}</span>
              </p>
              <p className="visually-hidden">{PREVIEW_LINE}</p>
            </figure>
            {reduced && (
              <p id={previewNoteId} className={styles.panelNote} data-testid="text-speed-reduced-note">
                Text appears instantly while motion is reduced.
              </p>
            )}

            <RadioCards
              legend="Type size"
              name="font-size"
              value={settings.fontSize}
              options={FONT_SIZES.map((f) => ({ value: f.value, label: f.label, sample: f.scale }))}
              onChange={(fontSize) => patch({ fontSize })}
            />
          </section>

          <section className={styles.panel} aria-labelledby="theme-heading">
            <h2 id="theme-heading" className={styles.panelTitle}>
              Lighting
            </h2>
            <p id={themeNoteId} className={styles.panelNote}>
              Work the night shift or the day shift. Case files and photographs stay the same.
            </p>
            <RadioCards
              legend="Colour theme"
              name="theme"
              value={settings.theme}
              options={themeOptions}
              onChange={(theme) => patch({ theme })}
              describedBy={themeNoteId}
              stack
            />
          </section>

          <section className={styles.panel} aria-labelledby="motion-heading">
            <h2 id="motion-heading" className={styles.panelTitle}>
              Motion
            </h2>
            <p id={motionNoteId} className={styles.panelNote}>
              Lamp flicker, falling rain and fades. Reduce keeps the picture still.
            </p>
            <RadioCards
              legend="Reduced motion"
              name="motion"
              value={settings.reducedMotion}
              options={motionOptions}
              onChange={(reducedMotion) => patch({ reducedMotion })}
              describedBy={motionNoteId}
              stack
            />
          </section>
        </div>

        <div className={styles.footer}>
          <Button
            onClick={() => {
              reset();
              setAnnouncement('Settings put back the way they came.');
            }}
            data-testid="reset-settings"
          >
            Reset to defaults
          </Button>
          <p className={styles.saved}>Changes are kept on this device as you make them.</p>
          <p className="visually-hidden" role="status" aria-live="polite">
            {announcement}
          </p>
        </div>
      </ScreenFrame>
    </>
  );
}
