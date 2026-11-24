import { useEffect, useId, useState, type KeyboardEvent } from 'react';
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
  type DiscordPref,
  systemPrefersLight,
  type Settings,
  type TextSpeed,
} from '../store/settings.ts';
import { sfx } from '../audio/audio.ts';
import { desktop, useDesktopFullscreen } from '../desktop/bridge.ts';
import styles from './Settings.module.css';
import { AVAILABLE_LANGUAGES, setLanguage, t, useT, type LanguageCode, type MessageKey } from '../i18n/index.ts';

const PREVIEW_PAUSE_MS = 1800;

type SectionId = 'language' | 'display' | 'sound' | 'text' | 'theme' | 'discord' | 'motion' | 'search' | 'stats';

const TEXT_SPEEDS: Array<{ value: TextSpeed; label: MessageKey }> = [
  { value: 'slow', label: 'settings.speedSlow' },
  { value: 'normal', label: 'settings.speedNormal' },
  { value: 'fast', label: 'settings.speedFast' },
  { value: 'instant', label: 'settings.speedInstant' },
];

const FONT_SIZES: Array<{ value: FontSize; label: MessageKey; scale: number }> = [
  { value: 'small', label: 'settings.sizeSmall', scale: 0.9375 },
  { value: 'medium', label: 'settings.sizeMedium', scale: 1 },
  { value: 'large', label: 'settings.sizeLarge', scale: 1.125 },
  { value: 'xlarge', label: 'settings.sizeXlarge', scale: 1.25 },
];

type VolumeKey = 'masterVolume' | 'musicVolume' | 'sfxVolume';

const VOLUMES: Array<{ key: VolumeKey; label: MessageKey; note: MessageKey }> = [
  { key: 'masterVolume', label: 'settings.volMaster', note: 'settings.volMasterNote' },
  { key: 'musicVolume', label: 'settings.volMusic', note: 'settings.volMusicNote' },
  { key: 'sfxVolume', label: 'settings.volSfx', note: 'settings.volSfxNote' },
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
        aria-valuetext={t('settings.percent', { n: percent })}
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
  const { language } = useT();
  const PREVIEW_LINE = t('settings.preview');
  const typed = usePreviewTyping(PREVIEW_LINE, TEXT_SPEED_CPS[settings.textSpeed], reduced);
  const [systemReduced] = useState(() => systemPrefersReducedMotion());
  const [systemLight] = useState(() => systemPrefersLight());
  const themeNoteId = useId();
  const discordNoteId = useId();
  const statsNoteId = useId();
  const languageNoteId = useId();
  const searchNoteId = useId();
  // Only desktop shells with presence support (v1.0.5 and later) can talk to Discord.
  const [hasDiscord] = useState(() => Boolean(desktop()?.setPresence));
  // Desktop shells with a fixed window size let the player pick a window or full screen.
  const [hasDisplay] = useState(() => Boolean(desktop()?.setFullscreen));
  const fullscreen = useDesktopFullscreen((s) => s.on);
  const displayNoteId = useId();
  // One panel at a time, picked from the index on the left, so the whole screen fits the window.
  const tabs: Array<{ id: SectionId; label: string }> = [
    { id: 'language', label: t('settings.language') },
    ...(hasDisplay ? [{ id: 'display' as const, label: t('settings.display') }] : []),
    { id: 'sound', label: t('settings.sound') },
    { id: 'text', label: t('settings.text') },
    { id: 'theme', label: t('settings.lighting') },
    ...(hasDiscord ? [{ id: 'discord' as const, label: 'Discord' }] : []),
    { id: 'motion', label: t('settings.motion') },
    { id: 'search', label: t('settings.search') },
    { id: 'stats', label: t('settings.stats') },
  ];
  const [active, setActive] = useState<SectionId>('language');
  const tabsId = useId();
  const tabId = (id: SectionId) => `${tabsId}-tab-${id}`;
  const panelId = (id: SectionId) => `${tabsId}-panel-${id}`;
  const panelProps = (id: SectionId) => ({
    id: panelId(id),
    role: 'tabpanel' as const,
    'aria-labelledby': tabId(id),
    hidden: active !== id,
    className: styles.panel,
  });
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : step ? (index + step + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault();
    const next = tabs[to]!;
    setActive(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  useEffect(() => {
    document.title = `${t('settings.title')} - Project Red String`;
  }, [language]);

  const back = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const patch = (p: Partial<Settings>) => set(p);

  const themeOptions: Array<{ value: ThemePref; label: string; note: string }> = [
    { value: 'dark', label: t('settings.night'), note: t('settings.nightNote') },
    { value: 'light', label: t('settings.day'), note: t('settings.dayNote') },
    { value: 'system', label: t('settings.followSystem'), note: t(systemLight ? 'settings.systemLight' : 'settings.systemDark') },
  ];

  const discordOptions: Array<{ value: DiscordPref; label: string; note: string }> = [
    { value: 'full', label: t('settings.discordFull'), note: t('settings.discordFullNote') },
    { value: 'minimal', label: t('settings.discordMinimal'), note: t('settings.discordMinimalNote') },
    { value: 'off', label: t('settings.discordOff'), note: t('settings.discordOffNote') },
  ];

  const displayOptions: Array<{ value: 'window' | 'fullscreen'; label: string; note: string }> = [
    { value: 'window', label: t('settings.displayWindow'), note: t('settings.displayWindowNote') },
    { value: 'fullscreen', label: t('settings.displayFull'), note: t('settings.displayFullNote') },
  ];

  const searchOptions: Array<{ value: 'hidden' | 'shown'; label: string; note: string }> = [
    { value: 'hidden', label: t('settings.searchHidden'), note: t('settings.searchHiddenNote') },
    { value: 'shown', label: t('settings.searchShown'), note: t('settings.searchShownNote') },
  ];

  const statsOptions: Array<{ value: 'on' | 'off'; label: string; note: string }> = [
    { value: 'on', label: t('settings.statsOn'), note: t('settings.statsOnNote') },
    { value: 'off', label: t('settings.statsOff'), note: t('settings.statsOffNote') },
  ];

  const motionOptions: Array<{ value: MotionPref; label: string; note: string }> = [
    { value: 'system', label: t('settings.followSystem'), note: t(systemReduced ? 'settings.motionSystemReduce' : 'settings.motionSystemFull') },
    { value: 'reduced', label: t('settings.motionReduce'), note: t('settings.motionReduceNote') },
    { value: 'full', label: t('settings.motionFull'), note: t('settings.motionFullNote') },
  ];

  const languageOptions: Array<{ value: LanguageCode; label: string; note: string }> = AVAILABLE_LANGUAGES.map((l) => ({
    value: l.code,
    label: l.name,
    note: l.code === 'en' ? t('settings.languageOriginal') : t('settings.languageTranslated'),
  }));

  return (
    <>
      <RainBackdrop lamp="right" intensity="soft" />
      <ScreenFrame
        title={t('settings.title')}
        kicker={t('settings.kicker')}
        actions={
          <Button variant="ghost" onClick={back}>
            {t('common.back')}
          </Button>
        }
      >
        <div className={styles.layout}>
          <div className={styles.tabs} role="tablist" aria-orientation="vertical" aria-label={t('settings.title')}>
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                aria-selected={active === tab.id}
                aria-controls={panelId(tab.id)}
                tabIndex={active === tab.id ? 0 : -1}
                className={styles.tab}
                data-testid={`settings-tab-${tab.id}`}
                onClick={() => {
                  sfx('click');
                  setActive(tab.id);
                }}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        <div className={styles.grid}>
          <section {...panelProps('language')}>
            <h2 className={styles.panelTitle}>
              {t('settings.language')}
              {/* Also in English, so a player who cannot read the current language still finds the switch. */}
              {language !== 'en' && (
                <span className={styles.panelTitleNote} lang="en">
                  {' '}
                  · Language
                </span>
              )}
            </h2>
            <p id={languageNoteId} className={styles.panelNote}>
              {t('settings.languageNote')}
            </p>
            <RadioCards
              legend={t('settings.languageLegend')}
              name="language"
              value={language}
              options={languageOptions}
              onChange={(code) => void setLanguage(code)}
              describedBy={languageNoteId}
              stack
            />
          </section>

          {hasDisplay && (
            <section {...panelProps('display')}>
              <h2 className={styles.panelTitle}>{t('settings.display')}</h2>
              <p id={displayNoteId} className={styles.panelNote}>
                {t('settings.displayNote')}
              </p>
              <RadioCards
                legend={t('settings.display')}
                name="display"
                value={fullscreen ? 'fullscreen' : 'window'}
                options={displayOptions}
                onChange={(v) => desktop()?.setFullscreen?.(v === 'fullscreen')}
                describedBy={displayNoteId}
                stack
              />
            </section>
          )}

          <section {...panelProps('sound')}>
            <h2 className={styles.panelTitle}>
              {t('settings.sound')}
            </h2>
            {VOLUMES.map((v) => (
              <VolumeSlider
                key={v.key}
                id={`volume-${v.key.replace('Volume', '')}`}
                label={t(v.label)}
                note={t(v.note)}
                value={settings[v.key]}
                onChange={(value) => patch({ [v.key]: value })}
              />
            ))}
            <Button onClick={() => sfx('pickup')} data-testid="test-sound">
              {t('settings.testSound')}
            </Button>
          </section>

          <section {...panelProps('text')}>
            <h2 className={styles.panelTitle}>
              {t('settings.text')}
            </h2>
            <RadioCards
              legend={t('settings.textSpeed')}
              name="text-speed"
              value={settings.textSpeed}
              options={TEXT_SPEEDS.map((s) => ({ value: s.value, label: t(s.label) }))}
              onChange={(textSpeed) => patch({ textSpeed })}
              describedBy={reduced ? `text-preview-label ${previewNoteId}` : 'text-preview-label'}
            />
            <figure className={`paper ${styles.preview}`}>
              <figcaption id="text-preview-label" className={styles.previewLabel}>
                {t('settings.previewLabel')}
              </figcaption>
              <p className={styles.previewLine} aria-hidden="true">
                {PREVIEW_LINE.slice(0, typed)}
                <span className={styles.previewRest}>{PREVIEW_LINE.slice(typed)}</span>
              </p>
              <p className="visually-hidden">{PREVIEW_LINE}</p>
            </figure>
            {reduced && (
              <p id={previewNoteId} className={styles.panelNote} data-testid="text-speed-reduced-note">
                {t('settings.instantNote')}
              </p>
            )}

            <RadioCards
              legend={t('settings.typeSize')}
              name="font-size"
              value={settings.fontSize}
              options={FONT_SIZES.map((f) => ({ value: f.value, label: t(f.label), sample: f.scale }))}
              onChange={(fontSize) => patch({ fontSize })}
            />
          </section>

          <section {...panelProps('theme')}>
            <h2 className={styles.panelTitle}>
              {t('settings.lighting')}
            </h2>
            <p id={themeNoteId} className={styles.panelNote}>
              {t('settings.lightingNote')}
            </p>
            <RadioCards
              legend={t('settings.theme')}
              name="theme"
              value={settings.theme}
              options={themeOptions}
              onChange={(theme) => patch({ theme })}
              describedBy={themeNoteId}
              stack
            />
          </section>

          {hasDiscord && (
            <section {...panelProps('discord')}>
              <h2 className={styles.panelTitle}>
                Discord
              </h2>
              <p id={discordNoteId} className={styles.panelNote}>
                {t('settings.discordNote')}
              </p>
              <RadioCards
                legend={t('settings.discordStatus')}
                name="discord"
                value={settings.discordPresence}
                options={discordOptions}
                onChange={(discordPresence) => patch({ discordPresence })}
                describedBy={discordNoteId}
                stack
              />
            </section>
          )}

          <section {...panelProps('motion')}>
            <h2 className={styles.panelTitle}>
              {t('settings.motion')}
            </h2>
            <p id={motionNoteId} className={styles.panelNote}>
              {t('settings.motionNote')}
            </p>
            <RadioCards
              legend={t('settings.reducedMotion')}
              name="motion"
              value={settings.reducedMotion}
              options={motionOptions}
              onChange={(reducedMotion) => patch({ reducedMotion })}
              describedBy={motionNoteId}
              stack
            />
          </section>

          <section {...panelProps('search')}>
            <h2 className={styles.panelTitle}>
              {t('settings.search')}
            </h2>
            <p id={searchNoteId} className={styles.panelNote}>
              {t('settings.searchNote')}
            </p>
            <RadioCards
              legend={t('settings.searchLegend')}
              name="search"
              value={settings.searchAid ? 'shown' : 'hidden'}
              options={searchOptions}
              onChange={(v) => patch({ searchAid: v === 'shown' })}
              describedBy={searchNoteId}
              stack
            />
          </section>

          <section {...panelProps('stats')}>
            <h2 className={styles.panelTitle}>
              {t('settings.stats')}
            </h2>
            <p id={statsNoteId} className={styles.panelNote}>
              {t('settings.statsNote')}
            </p>
            <RadioCards
              legend={t('settings.stats')}
              name="stats"
              value={settings.shareStats ? 'on' : 'off'}
              options={statsOptions}
              onChange={(v) => patch({ shareStats: v === 'on' })}
              describedBy={statsNoteId}
              stack
            />
          </section>
        </div>
        </div>

        <div className={styles.footer}>
          <Button
            onClick={() => {
              reset();
              setAnnouncement(t('settings.resetDone'));
            }}
            data-testid="reset-settings"
          >
            {t('settings.reset')}
          </Button>
          <p className={styles.saved}>{t('settings.saved')}</p>
          <p className="visually-hidden" role="status" aria-live="polite">
            {announcement}
          </p>
        </div>
      </ScreenFrame>
    </>
  );
}
