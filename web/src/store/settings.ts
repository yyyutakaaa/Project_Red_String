import { create } from 'zustand';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type MotionPref = 'system' | 'reduced' | 'full';

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  textSpeed: TextSpeed;
  fontSize: FontSize;
  reducedMotion: MotionPref;
}

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  textSpeed: 'normal',
  fontSize: 'medium',
  reducedMotion: 'system',
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

/** Reflect settings onto <html> so CSS can react. Call once at startup and on change. */
export function applySettingsToDocument(s: Pick<Settings, 'fontSize' | 'reducedMotion'>): void {
  const root = document.documentElement;
  root.dataset.fontSize = s.fontSize;
  root.dataset.motion = s.reducedMotion === 'system' ? (systemPrefersReducedMotion() ? 'reduced' : 'system') : s.reducedMotion;
}
