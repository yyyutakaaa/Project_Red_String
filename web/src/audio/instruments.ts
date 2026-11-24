// The instruments: how each voice of the music is made from oscillators, filters and gain envelopes.
// Every note builds its own few nodes, starts silent, fades in, fades out, and is disconnected once
// it has stopped, so nothing clicks and nothing is left behind.
// The only noise in here is the brush: a tap of a few hundredths of a second. There is no noise bed.
import type { ScheduledNote, Voice } from './music.ts';

type Ctx = BaseAudioContext;

const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** A release is treated as finished after this many time constants (about 60 dB down). */
const RELEASE_TAUS = 7;

function oscillator(ctx: Ctx, type: OscillatorType, freq: number, detune = 0): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  return osc;
}

function gainNode(ctx: Ctx, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

interface Envelope {
  attack: number;
  peak: number;
  /** Time constant of the fall from the peak towards `sustain` (a fraction of the peak). */
  decay: number;
  sustain: number;
  /** Time constant of the fade after the note is let go. */
  release: number;
}

/**
 * Shape a gain from silence, up, and back to silence. Returns the time at which the sound is gone
 * and its oscillators can be stopped.
 */
function shape(param: AudioParam, start: number, dur: number, env: Envelope): number {
  const top = start + env.attack;
  const letGo = Math.max(start + dur, top + 0.01);
  param.setValueAtTime(0, start);
  param.linearRampToValueAtTime(env.peak, top);
  param.setTargetAtTime(env.peak * env.sustain, top, env.decay);
  param.setTargetAtTime(0, letGo, env.release);
  return letGo + env.release * RELEASE_TAUS;
}

/** Start the sources, stop them when the note has faded, and take the whole note apart afterwards. */
function run(sources: AudioScheduledSourceNode[], others: AudioNode[], start: number, end: number): void {
  for (const s of sources) {
    s.start(start);
    s.stop(end);
  }
  const first = sources[0];
  if (!first) return;
  first.onended = () => {
    for (const n of sources) n.disconnect();
    for (const n of others) n.disconnect();
  };
}

/** Electric piano: a sine bent by a second sine (FM). The bend is strong at the strike and fades, like a tine. */
function keys(ctx: Ctx, out: AudioNode, n: ScheduledNote): void {
  const f = midiToHz(n.midi);
  const carrier = oscillator(ctx, 'sine', f, (Math.random() - 0.5) * 6);
  const bender = oscillator(ctx, 'sine', f);
  const depth = gainNode(ctx, 0);
  depth.gain.setValueAtTime(f * (0.4 + 1.4 * n.vel), n.time);
  depth.gain.setTargetAtTime(f * 0.2, n.time, 0.2);
  const amp = gainNode(ctx, 0);
  const end = shape(amp.gain, n.time, n.dur, { attack: 0.006, peak: n.vel, decay: 0.9, sustain: 0.35, release: 0.15 });
  bender.connect(depth).connect(carrier.frequency);
  carrier.connect(amp).connect(out);
  run([carrier, bender], [depth, amp], n.time, end);
}

/**
 * Upright bass: a triangle with a little sawtooth, through a filter that snaps shut after the pluck.
 * The filter never closes below 320 Hz so the note still has overtones a laptop speaker can play.
 */
function bass(ctx: Ctx, out: AudioNode, n: ScheduledNote): void {
  const f = midiToHz(n.midi);
  const body = oscillator(ctx, 'triangle', f);
  const edge = oscillator(ctx, 'sawtooth', f);
  const edgeLevel = gainNode(ctx, 0.28);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(Math.min(1800, f * 10), n.time);
  filter.frequency.setTargetAtTime(Math.max(320, f * 4), n.time, 0.1);
  const amp = gainNode(ctx, 0);
  const end = shape(amp.gain, n.time, n.dur, { attack: 0.008, peak: n.vel, decay: 0.6, sustain: 0.2, release: 0.06 });
  body.connect(filter);
  edge.connect(edgeLevel).connect(filter);
  filter.connect(amp).connect(out);
  run([body, edge], [edgeLevel, filter, amp], n.time, end);
}

/**
 * Muted trumpet: a sawtooth through a filter that opens with the breath. Each note is scooped up from
 * a little flat, and a slow vibrato comes in late on long notes. The nasal "mute" colour is added once
 * for the whole voice in voiceTone().
 */
function lead(ctx: Ctx, out: AudioNode, n: ScheduledNote): void {
  const f = midiToHz(n.midi);
  const osc = oscillator(ctx, 'sawtooth', f);
  osc.detune.setValueAtTime(-45, n.time);
  osc.detune.linearRampToValueAtTime(0, n.time + 0.08);
  const sources: AudioScheduledSourceNode[] = [osc];
  const others: AudioNode[] = [];
  if (n.dur > 0.45) {
    const vibrato = oscillator(ctx, 'sine', 5 + Math.random() * 0.6);
    const cents = gainNode(ctx, 0);
    cents.gain.setValueAtTime(0, n.time + 0.25);
    cents.gain.linearRampToValueAtTime(13, n.time + Math.min(n.dur, 0.8));
    vibrato.connect(cents).connect(osc.detune);
    sources.push(vibrato);
    others.push(cents);
  }
  const bright = 1100 + 1500 * n.vel;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(450, n.time);
  filter.frequency.linearRampToValueAtTime(bright, n.time + 0.07);
  filter.frequency.setTargetAtTime(bright * 0.7, n.time + 0.07, 0.35);
  const amp = gainNode(ctx, 0);
  const end = shape(amp.gain, n.time, n.dur, { attack: 0.045, peak: n.vel, decay: 0.4, sustain: 0.8, release: 0.08 });
  osc.connect(filter).connect(amp).connect(out);
  others.push(filter, amp);
  run(sources, others, n.time, end);
}

/** Vibraphone and celesta: a sine with one high partial that dies away faster than the note itself. */
function bell(ctx: Ctx, out: AudioNode, n: ScheduledNote, ring: number, partial: number, partialLevel: number): void {
  const f = midiToHz(n.midi);
  const tone = oscillator(ctx, 'sine', f);
  const over = oscillator(ctx, 'sine', f * partial);
  const overAmp = gainNode(ctx, 0);
  overAmp.gain.setValueAtTime(0, n.time);
  overAmp.gain.linearRampToValueAtTime(partialLevel, n.time + 0.004);
  overAmp.gain.setTargetAtTime(0, n.time + 0.004, ring / 4);
  const amp = gainNode(ctx, 0);
  // No sustain: a struck bar only rings down. Letting go damps what is left.
  const end = shape(amp.gain, n.time, n.dur, { attack: 0.004, peak: n.vel, decay: ring, sustain: 0, release: 0.25 });
  tone.connect(amp);
  over.connect(overAmp).connect(amp);
  amp.connect(out);
  run([tone, over], [overAmp, amp], n.time, end);
}

/** Low strings: two sawtooths a few cents apart, a slow bow, and a filter that opens and closes over the note. */
function pad(ctx: Ctx, out: AudioNode, n: ScheduledNote): void {
  const f = midiToHz(n.midi);
  const a = oscillator(ctx, 'sawtooth', f, -7);
  const b = oscillator(ctx, 'sawtooth', f, 7);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(260, n.time);
  filter.frequency.linearRampToValueAtTime(420 + 700 * n.vel, n.time + n.dur * 0.5);
  filter.frequency.linearRampToValueAtTime(320, n.time + n.dur + 1);
  const amp = gainNode(ctx, 0);
  const attack = Math.min(1.8, n.dur * 0.35);
  amp.gain.setValueAtTime(0, n.time);
  amp.gain.linearRampToValueAtTime(n.vel * 0.5, n.time + attack);
  amp.gain.setTargetAtTime(0, n.time + n.dur, 0.6);
  a.connect(filter);
  b.connect(filter);
  filter.connect(amp).connect(out);
  run([a, b], [filter, amp], n.time, n.time + n.dur + 0.6 * RELEASE_TAUS);
}

/** Brush: one short tap of filtered noise. `midi` picks the centre of the band (93 is about 1.8 kHz). */
function brush(ctx: Ctx, out: AudioNode, n: ScheduledNote, noise: AudioBuffer): void {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = midiToHz(n.midi);
  band.Q.value = 0.8;
  const top = ctx.createBiquadFilter();
  top.type = 'lowpass';
  top.frequency.value = 4500; // keeps the tap soft; nothing up where hiss lives
  const amp = gainNode(ctx, 0);
  const fall = Math.max(0.012, n.dur / 4);
  amp.gain.setValueAtTime(0, n.time);
  amp.gain.linearRampToValueAtTime(n.vel, n.time + 0.005);
  amp.gain.setTargetAtTime(0, n.time + 0.005, fall);
  src.connect(band).connect(top).connect(amp).connect(out);
  src.start(n.time, Math.random() * Math.max(0, noise.duration - 1));
  src.stop(n.time + 0.005 + fall * RELEASE_TAUS);
  src.onended = () => {
    for (const node of [src, band, top, amp]) node.disconnect();
  };
}

/** Play one note of one voice into `out`. `noise` is only needed for the brush. */
export function playNote(ctx: Ctx, out: AudioNode, note: ScheduledNote, noise: AudioBuffer | null): void {
  switch (note.voice) {
    case 'keys':
      keys(ctx, out, note);
      break;
    case 'bass':
      bass(ctx, out, note);
      break;
    case 'lead':
      lead(ctx, out, note);
      break;
    case 'vibes':
      bell(ctx, out, note, 1.2, 4, 0.12);
      break;
    case 'celesta':
      bell(ctx, out, note, 0.45, 3, 0.2);
      break;
    case 'pad':
      pad(ctx, out, note);
      break;
    case 'brush':
      if (noise) brush(ctx, out, note, noise);
      break;
  }
}

export interface VoiceTone {
  /** Last node of the chain; connect this onward. */
  output: AudioNode;
  /** Everything that was created, so the caller can take it apart again. */
  nodes: AudioNode[];
  /** Oscillators that run for as long as the voice exists (they only move a gain, they make no sound). */
  running: OscillatorNode[];
}

/**
 * The part of an instrument's sound that is the same for every note, built once per voice:
 * the mute on the trumpet, the soft top of the electric piano, the turning fans of the vibraphone.
 */
export function voiceTone(ctx: Ctx, voice: Voice, input: AudioNode): VoiceTone {
  const nodes: AudioNode[] = [];
  const running: OscillatorNode[] = [];
  let output = input;
  const filter = (type: BiquadFilterType, freq: number, q: number, gainDb = 0): void => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.gain.value = gainDb;
    output.connect(f);
    output = f;
    nodes.push(f);
  };
  if (voice === 'keys') {
    // Bending a sine with a sine of the same pitch leaves a small constant offset; the high-pass removes it.
    filter('highpass', 40, 0.7);
    filter('lowpass', 2600, 0.5);
  } else if (voice === 'lead') {
    // A mute takes away the body of the horn and leaves a narrow, nasal peak.
    filter('highpass', 300, 0.7);
    filter('peaking', 1600, 1.8, 5);
    filter('lowpass', 3400, 0.7);
  } else if (voice === 'vibes') {
    const tremolo = gainNode(ctx, 0.85);
    const fan = oscillator(ctx, 'sine', 4.6);
    const depth = gainNode(ctx, 0.15);
    fan.connect(depth).connect(tremolo.gain);
    fan.start();
    output.connect(tremolo);
    output = tremolo;
    nodes.push(tremolo, depth);
    running.push(fan);
  }
  return { output, nodes, running };
}

/**
 * A dark room to put the band in: the impulse response for a ConvolverNode. It is a burst of noise
 * that dies away, but it is never heard as noise: the convolver only uses it to smear the notes.
 * The burst is scaled to unit energy before the top is filtered off, which makes the reverb about
 * as loud as what is sent into it, on every browser (the convolver's own normalising is turned off).
 */
export function makeRoomImpulse(ctx: Ctx, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const preDelay = Math.floor(ctx.sampleRate * 0.02);
  const fall = (seconds / 6.9) * ctx.sampleRate; // 60 dB down at the end
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let energy = 0;
    for (let i = preDelay; i < length; i++) {
      const v = (Math.random() * 2 - 1) * Math.exp(-(i - preDelay) / fall);
      data[i] = v;
      energy += v * v;
    }
    const scale = 1 / Math.sqrt(energy || 1);
    // One-pole low-pass at about 2.5 kHz: a room full of smoke and heavy curtains.
    const k = 1 - Math.exp((-2 * Math.PI * 2500) / ctx.sampleRate);
    let low = 0;
    for (let i = preDelay; i < length; i++) {
      low += k * ((data[i] as number) * scale - low);
      data[i] = low;
    }
  }
  return buffer;
}
