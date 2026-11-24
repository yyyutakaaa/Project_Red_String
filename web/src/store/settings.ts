import { create } from 'zustand';
import { desktop } from '../desktop/bridge.ts';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type MotionPref = 'system' | 'reduced' | 'full';
export type ThemePref = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';
export type DiscordPref = 'full' | 'minimal' | 'off';

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  textSpeed: TextSpeed;
  fontSize: FontSize;
  reducedMotion: MotionPref;
  theme: ThemePref;
  /** Desktop app only: what Discord friends see. */
  discordPresence: DiscordPref;
  /** Send anonymous play statistics (src/lib/telemetry.ts). */
  shareStats: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  textSpeed: 'normal',
  fontSize: 'medium',
  reducedMotion: 'system',
  theme: 'dark',
  discordPresence: 'full',
  shareStats: true,
};

const KEY = 'redstring.settings';

/** Characters per second for the typewriter effect. */
export const TEXT_SPEED_CPS: Record<TextSpeed, number> = { slow: 28, normal: 55, fast: 110, instant: Infinity };

function clamp01(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

export function parseSettings(raw: string | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const d = JSON.parse(raw) as Partial<Settings>;
    return {
      masterVolume: clamp01(d.masterVolume, DEFAULT_SETTINGS.masterVolume),
      musicVolume: clamp01(d.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp01(d.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      textSpeed: (['slow', 'normal', 'fast', 'instant'] as const).includes(d.textSpeed as TextSpeed)
        ? (d.textSpeed as TextSpeed)
        : DEFAULT_SETTINGS.textSpeed,
      fontSize: (['small', 'medium', 'large', 'xlarge'] as const).includes(d.fontSize as FontSize)
        ? (d.fontSize as FontSize)
        : DEFAULT_SETTINGS.fontSize,
      reducedMotion: (['system', 'reduced', 'full'] as const).includes(d.reducedMotion as MotionPref)
        ? (d.reducedMotion as MotionPref)
        : DEFAULT_SETTINGS.reducedMotion,
      theme: (['dark', 'light', 'system'] as const).includes(d.theme as ThemePref) ? (d.theme as ThemePref) : DEFAULT_SETTINGS.theme,
      discordPresence: (['full', 'minimal', 'off'] as const).includes(d.discordPresence as DiscordPref)
        ? (d.discordPresence as DiscordPref)
        : DEFAULT_SETTINGS.discordPresence,
      shareStats: typeof d.shareStats === 'boolean' ? d.shareStats : DEFAULT_SETTINGS.shareStats,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function readStored(): Settings {
  try {
    return parseSettings(globalThis.localStorage?.getItem(KEY) ?? null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...readStored(),
  set: (patch) => {
    set(patch);
    persist(get());
  },
  reset: () => {
    set({ ...DEFAULT_SETTINGS });
    persist(get());
  },
}));

function persist(s: Settings): void {
  const data: Settings = {
    masterVolume: s.masterVolume,
    musicVolume: s.musicVolume,
    sfxVolume: s.sfxVolume,
    textSpeed: s.textSpeed,
    fontSize: s.fontSize,
    reducedMotion: s.reducedMotion,
    theme: s.theme,
    discordPresence: s.discordPresence,
    shareStats: s.shareStats,
  };
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: settings last for this session only */
  }
}

export function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function isReducedMotion(pref: MotionPref): boolean {
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;
  return systemPrefersReducedMotion();
}

/** Hook: true when animations should be minimised. */
export function useReducedMotion(): boolean {
  const pref = useSettings((s) => s.reducedMotion);
  return isReducedMotion(pref);
}

export function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches === true;
}

export function resolveTheme(pref: ThemePref): Theme {
  if (pref === 'system') return systemPrefersLight() ? 'light' : 'dark';
  return pref;
}

/** Window-bar colours per theme. The desktop app paints its title bar with these. */
export const THEME_CHROME: Record<Theme, { background: string; symbol: string }> = {
  dark: { background: '#0b0f17', symbol: '#ebe5d8' },
  light: { background: '#e9e2d4', symbol: '#2a2620' },
};

/** Reflect settings onto <html> so CSS can react. Call once at startup and on change. */
export function applySettingsToDocument(s: Pick<Settings, 'fontSize' | 'reducedMotion' | 'theme'>): void {
  const root = document.documentElement;
  const theme = resolveTheme(s.theme);
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_CHROME[theme].background);
  desktop()?.setTheme?.(theme);
  root.dataset.fontSize = s.fontSize;
  root.dataset.motion = s.reducedMotion === 'system' ? (systemPrefersReducedMotion() ? 'reduced' : 'system') : s.reducedMotion;
}
