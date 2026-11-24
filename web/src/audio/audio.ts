// Sound for the whole game, made in the browser with the Web Audio API: the music and the small UI sounds.
// No audio files are required. The music is written out in music.ts, played by musicPlayer.ts on the
// instruments in instruments.ts. There is no rain or other noise bed: the only noise left is the short
// burst inside some sound effects and the brush taps in the music.
// If real recordings are dropped into src/assets/art/audio (see the asset registry), they replace the
// generated music, and an ambience recording plays alongside.
import { audioArt } from '../assets/registry.ts';
import { musicForAmbience } from './music.ts';
import { MusicPlayer } from './musicPlayer.ts';

export type SfxName = 'click' | 'hover' | 'pickup' | 'clue' | 'type' | 'pin' | 'string' | 'snap' | 'stamp' | 'error' | 'page';
/** What a screen asks for. 'menu' plays the menu theme; 'rain', 'club', 'harbor' and 'house' play the case music, each in its own mood. */
export type Ambience = 'none' | 'menu' | 'rain' | 'club' | 'harbor' | 'house';

type Ctx = AudioContext;

// Music bus gain with the music slider at full. At the default sliders (master 0.8, music 0.5) the
// music then averages about -36 dBFS and peaks near -20 dBFS: under the sound effects (a stamp peaks
// around -12 dBFS), and far from clipping even with every slider at full.
const MUSIC_TRIM = 1.3;

// A limiter on the way out, so music plus a loud effect can never clip. It does nothing below -3 dB.
// Browsers add a fixed make-up gain to a compressor: 0.6 times the reduction a full-scale signal would
// get, which with a hard knee is threshold * (1 - 1/ratio) dB. LIMITER_TRIM takes exactly that off
// again, so quiet sound passes through at its own level.
const LIMITER_THRESHOLD_DB = -3;
const LIMITER_RATIO = 20;
const LIMITER_TRIM = Math.pow(10, (0.6 * LIMITER_THRESHOLD_DB * (1 - 1 / LIMITER_RATIO)) / 20);

/** After the tab is hidden the sound fades for this long, then the audio clock is stopped. */
const SUSPEND_AFTER_MS = 200;

/** A recording from the asset registry, playing in a loop. */
interface LoopFile {
  url: string;
  el: HTMLAudioElement;
}

class AudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private player: MusicPlayer | null = null;
  private current: Ambience = 'none';
  private wanted: Ambience = 'none';
  private fileMusic: LoopFile | null = null;
  private fileAmbience: LoopFile | null = null;
  private volumes = { master: 0.8, music: 0.5, sfx: 0.7 };
  private lastTypeAt = 0;
  /** True while the tab is hidden: everything is silent and the music is not being scheduled. */
  private asleep = false;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;

  /** Must be called from a user gesture at least once (browsers block audio before that). */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx && !this.build()) return;
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'suspended' && !this.asleep) void ctx.resume().catch(() => undefined);
    this.applyAmbience();
  }

  /** Create the audio context and the fixed part of the graph. False when the browser has no Web Audio. */
  private build(): boolean {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    let ctx: Ctx;
    try {
      ctx = new AC();
    } catch {
      return false;
    }
    this.ctx = ctx;
    // music and effects -> master (the master slider) -> limiter -> speakers
    const master = ctx.createGain();
    const musicBus = ctx.createGain();
    const sfxBus = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = LIMITER_THRESHOLD_DB;
    limiter.knee.value = 0;
    limiter.ratio.value = LIMITER_RATIO;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    const trim = ctx.createGain();
    trim.gain.value = LIMITER_TRIM;
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(limiter).connect(trim).connect(ctx.destination);
    // Start at the chosen volumes instead of gliding there from full.
    master.gain.value = this.volumes.master;
    musicBus.gain.value = this.volumes.music * MUSIC_TRIM;
    sfxBus.gain.value = this.volumes.sfx;
    this.master = master;
    this.musicBus = musicBus;
    this.sfxBus = sfxBus;
    this.noiseBuffer = this.makeNoise(ctx, 2.5);
    this.player = new MusicPlayer(ctx, musicBus, this.noiseBuffer);
    this.asleep = document.visibilityState === 'hidden';
    if (this.asleep) this.player.pause();
    document.addEventListener('visibilitychange', this.onVisibility);
    return true;
  }

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.volumes = { master, music, sfx };
    this.applyVolumes();
  }

  // The sliders work on gain nodes after the instruments, so a change is heard at once, also on notes
  // that are already sounding. The short glide keeps a dragged slider from crackling.
  private applyVolumes(): void {
    const { master, music, sfx } = this.volumes;
    const t = this.ctx?.currentTime ?? 0;
    this.master?.gain.setTargetAtTime(this.asleep ? 0 : master, t, 0.05);
    this.musicBus?.gain.setTargetAtTime(music * MUSIC_TRIM, t, 0.1);
    this.sfxBus?.gain.setTargetAtTime(sfx, t, 0.02);
    if (this.fileMusic) this.fileMusic.el.volume = Math.min(1, master * music);
    if (this.fileAmbience) this.fileAmbience.el.volume = Math.min(1, master * music * 0.8);
  }

  // Noise for the short bursts in the sound effects and the brush taps. It is never played as a loop.
  private makeNoise(ctx: Ctx, seconds: number): AudioBuffer {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.97 * b0 + 0.03 * white; // a touch of pinking
      data[i] = white * 0.6 + b0 * 2.2;
    }
    return buf;
  }

  /**
   * Choose the music for the current screen. Asking for what already plays changes nothing, so moving
   * between two menu screens (or two screens of a case) never restarts the music.
   */
  setAmbience(kind: Ambience): void {
    this.wanted = kind;
    // Before the first click or key press there is no audio context yet; unlock() picks this up.
    if (this.ctx) this.applyAmbience();
  }

  private applyAmbience(): void {
    const kind = this.wanted;
    if (kind === this.current) return;
    this.current = kind;
    const musicUrl = kind === 'none' ? null : (audioArt(`music-${kind}`) ?? audioArt('music'));
    const ambienceUrl = kind === 'none' ? null : (audioArt(`ambience-${kind}`) ?? audioArt('ambience-rain'));
    this.fileMusic = this.swapFile(this.fileMusic, musicUrl);
    this.fileAmbience = this.swapFile(this.fileAmbience, ambienceUrl);
    // A recording replaces the generated music. Otherwise the player crossfades to the right piece.
    const music = musicUrl ? null : musicForAmbience(kind);
    this.player?.play(music?.piece ?? null, music?.mood);
    this.applyVolumes();
  }

  /** Keep a recording playing when the next screen wants the same one; otherwise stop it and start the new one. */
  private swapFile(playing: LoopFile | null, url: string | null): LoopFile | null {
    if (playing && playing.url === url) return playing;
    playing?.el.pause();
    if (!url) return null;
    try {
      const el = new Audio(url);
      el.loop = true;
      if (!this.asleep) void el.play().catch(() => undefined);
      return { url, el };
    } catch {
      return null;
    }
  }

  // A hidden tab runs its timers about once a second, far too slow to schedule music, so nothing plays
  // while hidden: fade out, stop scheduling, stop the audio clock. Because the clock stands still, the
  // music carries on from the same bar when the tab comes back, with no pile of late notes.
  private onVisibility = (): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.suspendTimer !== null) clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    this.asleep = document.visibilityState === 'hidden';
    if (this.asleep) {
      this.player?.pause();
      this.fileMusic?.el.pause();
      this.fileAmbience?.el.pause();
      this.applyVolumes(); // glides the master to silence
      this.suspendTimer = setTimeout(() => {
        if (this.asleep) void ctx.suspend().catch(() => undefined);
      }, SUSPEND_AFTER_MS);
    } else {
      // If the browser refuses to resume without a gesture, the next click does it (see unlock).
      void ctx.resume().catch(() => undefined);
      this.applyVolumes();
      this.player?.resume();
      void this.fileMusic?.el.play().catch(() => undefined);
      void this.fileAmbience?.el.play().catch(() => undefined);
    }
  };

  /** Stop everything and release the audio context. Only used when the module is replaced during development. */
  shutdown(): void {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.suspendTimer !== null) clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    this.player?.dispose();
    this.player = null;
    this.fileMusic?.el.pause();
    this.fileAmbience?.el.pause();
    this.fileMusic = null;
    this.fileAmbience = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.current = 'none';
  }

  private tone(freq: number, dur: number, level: number, type: OscillatorType = 'sine', delay = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noiseBurst(dur: number, level: number, freq: number, q = 1, type: BiquadFilterType = 'bandpass'): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus!);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  play(name: SfxName): void {
    if (!this.ctx || !this.unlocked) return;
    switch (name) {
      case 'click':
        this.noiseBurst(0.05, 0.25, 2400, 2);
        break;
      case 'hover':
        this.noiseBurst(0.03, 0.06, 3200, 3);
        break;
      case 'type': {
        const now = performance.now();
        if (now - this.lastTypeAt < 45) return;
        this.lastTypeAt = now;
        this.noiseBurst(0.025, 0.12, 1800 + Math.random() * 900, 4);
        break;
      }
      case 'pickup':
        this.tone(660, 0.35, 0.12, 'triangle');
        this.tone(990, 0.5, 0.09, 'triangle', 0.09);
        break;
      case 'clue':
        this.tone(523, 0.3, 0.1, 'sine');
        this.tone(784, 0.45, 0.09, 'sine', 0.08);
        this.tone(1046, 0.6, 0.06, 'sine', 0.16);
        break;
      case 'pin':
        this.tone(140, 0.12, 0.25, 'sine');
        this.noiseBurst(0.04, 0.15, 900, 1);
        break;
      case 'string':
        this.tone(220, 0.5, 0.12, 'sawtooth');
        this.noiseBurst(0.08, 0.1, 1500, 6);
        break;
      case 'snap':
        this.noiseBurst(0.07, 0.3, 3000, 1, 'highpass');
        break;
      case 'stamp':
        this.tone(90, 0.25, 0.4, 'sine');
        this.noiseBurst(0.12, 0.35, 500, 0.7, 'lowpass');
        break;
      case 'error':
        this.tone(130, 0.25, 0.16, 'square');
        this.tone(123, 0.3, 0.12, 'square', 0.12);
        break;
      case 'page':
        this.noiseBurst(0.22, 0.12, 4000, 0.5, 'highpass');
        break;
    }
  }
}

export const audio = new AudioEngine();

export function sfx(name: SfxName): void {
  audio.play(name);
}

/** Map a case setting to an ambience. */
export function ambienceForBackground(key: string | undefined): Ambience {
  if (!key) return 'rain';
  if (['stage', 'bar', 'dressing-room'].includes(key)) return 'club';
  if (['dock', 'warehouse', 'alley'].includes(key)) return 'harbor';
  if (['dining-room', 'study', 'conservatory', 'bedroom', 'hallway', 'library', 'kitchen', 'bathroom'].includes(key)) return 'house';
  return 'rain';
}

// During development Vite replaces this module when it (or the music) is edited. Without this the old
// engine would keep playing next to the new one.
if (import.meta.hot) {
  import.meta.hot.dispose(() => audio.shutdown());
}
