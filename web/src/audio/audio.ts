// Procedural audio with the Web Audio API: rain ambience, a slow noir pad and small UI sounds.
// No audio files are required. If real recordings are dropped into src/assets/art/audio
// (see the asset registry), they replace the generated ambience and music.
import { audioArt } from '../assets/registry.ts';

export type SfxName = 'click' | 'hover' | 'pickup' | 'clue' | 'type' | 'pin' | 'string' | 'snap' | 'stamp' | 'error' | 'page';
export type Ambience = 'none' | 'menu' | 'rain' | 'club' | 'harbor' | 'house';

type Ctx = AudioContext;

const CHORDS: number[][] = [
  // A minor 9, F major 7, D minor 9, E7 flat 9 (MIDI note numbers)
  [45, 57, 60, 64, 71],
  [41, 57, 60, 64, 69],
  [38, 53, 57, 60, 64],
  [40, 56, 59, 62, 65],
];

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private rainNodes: AudioNode[] = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private bassTimer: ReturnType<typeof setInterval> | null = null;
  private chordIndex = 0;
  private current: Ambience = 'none';
  private wanted: Ambience = 'none';
  private fileMusic: HTMLAudioElement | null = null;
  private fileRain: HTMLAudioElement | null = null;
  private volumes = { master: 0.8, music: 0.5, sfx: 0.7 };
  private lastTypeAt = 0;

  /** Must be called from a user gesture at least once (browsers block audio before that). */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.ambienceBus = ctx.createGain();
      this.musicBus.connect(this.master);
      this.ambienceBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(ctx.destination);
      this.noiseBuffer = this.makeNoise(ctx, 2.5);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.wanted !== this.current) this.setAmbience(this.wanted);
  }

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.volumes = { master, music, sfx };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    const { master, music, sfx } = this.volumes;
    const t = this.ctx?.currentTime ?? 0;
    this.master?.gain.setTargetAtTime(master, t, 0.05);
    this.musicBus?.gain.setTargetAtTime(music * 0.55, t, 0.1);
    this.ambienceBus?.gain.setTargetAtTime(music * 0.7, t, 0.1);
    this.sfxBus?.gain.setTargetAtTime(sfx, t, 0.02);
    if (this.fileMusic) this.fileMusic.volume = Math.min(1, master * music);
    if (this.fileRain) this.fileRain.volume = Math.min(1, master * music * 0.8);
  }

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

  setAmbience(kind: Ambience): void {
    this.wanted = kind;
    if (!this.ctx || !this.unlocked) return;
    if (kind === this.current) return;
    this.stopAmbience();
    this.current = kind;
    if (kind === 'none') return;
    const fileMusic = audioArt(`music-${kind}`) ?? audioArt('music');
    const fileRain = audioArt(`ambience-${kind}`) ?? audioArt('ambience-rain');
    if (fileRain) this.fileRain = this.playFile(fileRain);
    else if (kind !== 'club') this.startRain(kind === 'harbor' ? 0.75 : kind === 'house' ? 0.55 : 0.6);
    else this.startRain(0.25);
    if (fileMusic) this.fileMusic = this.playFile(fileMusic);
    else this.startPad(kind === 'club');
    this.applyVolumes();
  }

  private playFile(url: string): HTMLAudioElement | null {
    try {
      const el = new Audio(url);
      el.loop = true;
      void el.play().catch(() => undefined);
      return el;
    } catch {
      return null;
    }
  }

  private stopAmbience(): void {
    const ctx = this.ctx;
    for (const n of this.rainNodes) {
      try {
        if (n instanceof AudioBufferSourceNode) n.stop(ctx ? ctx.currentTime + 0.6 : 0);
        else if (n instanceof GainNode && ctx) n.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      } catch {
        /* already stopped */
      }
    }
    this.rainNodes = [];
    if (this.musicTimer) clearInterval(this.musicTimer);
    if (this.bassTimer) clearInterval(this.bassTimer);
    this.musicTimer = null;
    this.bassTimer = null;
    this.fileMusic?.pause();
    this.fileRain?.pause();
    this.fileMusic = null;
    this.fileRain = null;
  }

  private startRain(level: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.16 * level, ctx.currentTime, 1.2);
    src.connect(hp).connect(lp).connect(g).connect(this.ambienceBus!);

    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = this.noiseBuffer;
    rumbleSrc.loop = true;
    rumbleSrc.playbackRate.value = 0.5;
    const rl = ctx.createBiquadFilter();
    rl.type = 'lowpass';
    rl.frequency.value = 220;
    const rg = ctx.createGain();
    rg.gain.value = 0;
    rg.gain.setTargetAtTime(0.22 * level, ctx.currentTime, 2);
    rumbleSrc.connect(rl).connect(rg).connect(this.ambienceBus!);
    src.start();
    rumbleSrc.start();
    this.rainNodes.push(src, rumbleSrc, g, rg);
  }

  private startPad(club: boolean): void {
    const ctx = this.ctx!;
    const playChord = () => {
      if (!this.ctx) return;
      const chord = CHORDS[this.chordIndex % CHORDS.length]!;
      this.chordIndex++;
      const now = ctx.currentTime;
      const dur = 7.5;
      chord.forEach((note, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = midiToHz(note);
        osc.detune.value = (Math.random() - 0.5) * 8;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 4.5 + Math.random();
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain).connect(osc.detune);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1100;
        const g = ctx.createGain();
        const peak = (i === 0 ? 0.07 : 0.035) * (club ? 0.8 : 1);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(peak, now + 2.2);
        g.gain.setTargetAtTime(0, now + dur - 2, 1.1);
        osc.connect(lp).connect(g).connect(this.musicBus!);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + dur + 3);
        lfo.stop(now + dur + 3);
      });
    };
    playChord();
    this.musicTimer = setInterval(playChord, 7000);
    if (club) {
      let step = 0;
      const walk = [0, 3, 5, 7, 10, 7, 5, 3];
      this.bassTimer = setInterval(() => {
        if (!this.ctx) return;
        const root = CHORDS[(this.chordIndex - 1 + CHORDS.length) % CHORDS.length]![0]!;
        this.pluck(midiToHz(root - 12 + walk[step % walk.length]!), 0.12);
        step++;
      }, 875);
    }
  }

  private pluck(freq: number, level: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.connect(g).connect(this.musicBus!);
    osc.start(now);
    osc.stop(now + 0.75);
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
