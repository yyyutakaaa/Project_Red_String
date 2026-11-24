// Plays the written music (music.ts) on the instruments (instruments.ts).
//
// Timing: a timer wakes up every 40 ms and schedules only the notes that start in the next 200 ms,
// always at times on the AudioContext clock. The timer itself may be late or early; the notes are not.
//
// Each piece has its own channel with its own place in the music. Changing piece fades one channel
// out and the other in. A piece that comes back carries on from where it was, it does not start over.
import {
  PIECES,
  beatSeconds,
  collectDue,
  endingFor,
  nextPhraseBar,
  notesForBar,
  startTransport,
  type CaseMood,
  type PieceId,
  type Piece,
  type Transport,
  type Voice,
} from './music.ts';
import { makeRoomImpulse, playNote, voiceTone } from './instruments.ts';

const TICK_MS = 40;
const LOOKAHEAD = 0.2;
/** A piece that starts (or comes back) plays its first note this long after being asked. */
const START_DELAY = 0.12;
// Fades are exponential approaches (setTargetAtTime): they need no knowledge of the current value, so a
// fade can be turned around halfway without a jump.
//
// Changing piece is staged like a film cut with a sound bridge:
//   1. On its next beat the old piece plays its ending (one held chord on its key note) and stops
//      scheduling anything else. A low-pass filter then closes slowly over it, as if a door shut.
//   2. A moment after the ending chord, the new piece comes in quietly with its own filter opening,
//      as if walking into the next room. A piece that comes back starts at the top of a phrase.
// So nothing is ever cut off mid-note, and the two pieces never play their tunes over each other.
const FADE_IN_TAU = 0.9;
/** The very first piece (nothing to hand over from) comes in quicker. */
const FIRST_FADE_IN_TAU = 0.6;
const FADE_OUT_TAU = 1.1;
/** The ending chord rings this long before the old piece starts to fade. */
const ENDING_RING = 0.7;
/** The new piece starts this long after the ending chord. */
const HANDOVER = 1.0;
/** Low-pass corner of an open channel, and how far it closes when the piece leaves or arrives. */
const OPEN_HZ = 16000;
const CLOSED_HZ = 420;
const SWEEP_OUT_SECONDS = 3.2;
const SWEEP_IN_SECONDS = 2.6;

interface VoiceMix {
  /** Gain of the voice. Notes peak around their velocity (0 to 1) before this. */
  level: number;
  /** Place in the stereo picture, -1 left to 1 right. */
  pan: number;
  /** How much of the voice goes to the reverb. */
  room: number;
}

// The balance of each band. Rendered offline in Chrome for two minutes, the loudest instant of either
// piece is about 0.3 here, before the music bus and the sliders turn it down further (see audio.ts).
// The bass is kept modest on purpose: most of its energy is below 100 Hz, where headphones are
// generous and laptop speakers play nothing at all.
export const MIX: Record<PieceId, Partial<Record<Voice, VoiceMix>>> = {
  menu: {
    keys: { level: 0.085, pan: -0.25, room: 0.25 },
    bass: { level: 0.14, pan: 0, room: 0.03 },
    lead: { level: 0.125, pan: 0.2, room: 0.4 },
    brush: { level: 0.15, pan: 0.3, room: 0.15 },
  },
  case: {
    pad: { level: 0.1, pan: 0, room: 0.3 },
    bass: { level: 0.12, pan: 0, room: 0.03 },
    vibes: { level: 0.13, pan: 0.3, room: 0.45 },
    celesta: { level: 0.1, pan: -0.35, room: 0.45 },
    brush: { level: 0.13, pan: 0.25, room: 0.15 },
  },
};

interface Channel {
  piece: Piece;
  /** Dry sound of the piece; the crossfade happens here. */
  fade: GainNode;
  /** The door: a low-pass that closes when the piece leaves and opens when it arrives. */
  door: BiquadFilterNode;
  /** What the piece sends to the reverb. Faded together with `fade`. */
  roomFade: GainNode;
  /** Where the notes of each voice go in. */
  inputs: Partial<Record<Voice, GainNode>>;
  nodes: AudioNode[];
  running: OscillatorNode[];
  transport: Transport | null;
  /** True while notes are being scheduled. */
  active: boolean;
  /** When a leaving piece stops being scheduled (its ending is already handed to the clock); null while it plays. */
  stopAt: number | null;
}

export class MusicPlayer {
  private readonly channels = new Map<PieceId, Channel>();
  private readonly room: GainNode;
  private readonly roomNodes: AudioNode[] = [];
  private target: PieceId | null = null;
  private mood: CaseMood = 'rain';
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;

  /**
   * @param output where the music goes (the music bus)
   * @param noise  a buffer of noise for the brush taps
   * @param seed   decides the choices the music makes; the same seed plays the same performance
   */
  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly output: AudioNode,
    private readonly noise: AudioBuffer | null,
    private readonly seed: number = Math.floor(Math.random() * 0x7fffffff),
  ) {
    this.room = ctx.createGain();
    this.roomNodes.push(this.room);
    try {
      const reverb = ctx.createConvolver();
      reverb.normalize = false; // must be set before the buffer; the impulse is already scaled
      reverb.buffer = makeRoomImpulse(ctx, 2.4);
      const back = ctx.createGain();
      back.gain.value = 0.8;
      this.room.connect(reverb).connect(back).connect(output);
      this.roomNodes.push(reverb, back);
    } catch {
      // No reverb on this browser: the music still plays, only drier.
    }
  }

  /**
   * Choose what plays. `null` fades everything out. Asking for the piece that is already playing
   * changes nothing audible except the mood, which takes effect from the next bar.
   */
  play(piece: PieceId | null, mood: CaseMood = this.mood): void {
    this.mood = mood;
    if (piece !== this.target) {
      this.target = piece;
      const now = this.ctx.currentTime;
      // The latest moment an old piece ends; the new one starts after that.
      let handover: number | null = null;
      for (const ch of this.channels.values()) {
        if (ch.piece.id !== piece && ch.active && ch.stopAt === null) {
          const end = this.leave(ch, now);
          handover = Math.max(handover ?? 0, end);
        }
      }
      if (piece) {
        const ch = this.channel(piece);
        const returning = ch.active && ch.stopAt !== null && now < ch.stopAt;
        if (returning) {
          // Called back before its ending sounded: it simply stays.
          ch.stopAt = null;
          this.ramp(ch, 1, now, FIRST_FADE_IN_TAU);
          this.sweep(ch, OPEN_HZ, now, 0.6);
        } else {
          const start = handover !== null ? handover + HANDOVER : now + START_DELAY;
          if (!ch.active) {
            // First time: bar 0. Coming back after leaving: the top of the next phrase.
            ch.transport = startTransport(start, ch.transport ? nextPhraseBar(ch.transport.bar) : 0);
            ch.active = true;
          }
          ch.stopAt = null;
          if (handover !== null) {
            // Walk in: start quiet and muffled, open up. If this piece was still ringing out from an
            // earlier exit, its tail is brought down quickly rather than cut, so there is no click.
            for (const g of [ch.fade.gain, ch.roomFade.gain]) {
              g.cancelScheduledValues(now);
              g.setValueAtTime(g.value, now);
              g.setTargetAtTime(0, now, 0.12);
            }
            this.ramp(ch, 1, start, FADE_IN_TAU);
            ch.door.frequency.cancelScheduledValues(now);
            ch.door.frequency.setValueAtTime(ch.door.frequency.value, now);
            ch.door.frequency.setTargetAtTime(CLOSED_HZ, now, 0.12);
            ch.door.frequency.setValueAtTime(CLOSED_HZ, start);
            ch.door.frequency.exponentialRampToValueAtTime(OPEN_HZ, start + SWEEP_IN_SECONDS);
          } else {
            this.ramp(ch, 1, now, FIRST_FADE_IN_TAU);
            this.sweep(ch, OPEN_HZ, now, 0.3);
          }
        }
      }
    }
    this.wake();
  }

  /**
   * The piece leaves: on its next beat it plays its ending and stops scheduling, then the door closes
   * and it fades. Returns when the ending chord starts.
   */
  private leave(ch: Channel, now: number): number {
    const tr = ch.transport;
    const beat = beatSeconds(ch.piece);
    // The next beat on the piece's own grid, far enough ahead that nothing is late.
    let at = now + 0.08;
    if (tr) {
      const sinceOrigin = Math.max(0, at - tr.originTime);
      at = tr.originTime + Math.ceil(sinceOrigin / beat) * beat;
      if (at < now + 0.06) at += beat;
    }
    for (const note of endingFor(ch.piece)) {
      const input = ch.inputs[note.voice];
      if (input) playNote(this.ctx, input, { voice: note.voice, midi: note.midi, vel: note.vel, time: at + note.beat * beat, dur: note.dur * beat }, this.noise);
    }
    ch.stopAt = at;
    const fadeFrom = at + ENDING_RING;
    ch.fade.gain.cancelScheduledValues(now);
    ch.roomFade.gain.cancelScheduledValues(now);
    ch.fade.gain.setValueAtTime(ch.fade.gain.value, now);
    ch.roomFade.gain.setValueAtTime(ch.roomFade.gain.value, now);
    ch.fade.gain.setTargetAtTime(0, fadeFrom, FADE_OUT_TAU);
    // the reverb tail lingers a little longer than the dry sound
    ch.roomFade.gain.setTargetAtTime(0, fadeFrom, FADE_OUT_TAU * 1.5);
    ch.door.frequency.cancelScheduledValues(now);
    ch.door.frequency.setValueAtTime(Math.max(CLOSED_HZ, ch.door.frequency.value), at);
    ch.door.frequency.exponentialRampToValueAtTime(CLOSED_HZ, at + SWEEP_OUT_SECONDS);
    return at;
  }

  /** Stop scheduling (the tab is hidden). Notes already handed to the audio clock still sound. */
  pause(): void {
    this.paused = true;
    this.sleep();
  }

  resume(): void {
    this.paused = false;
    this.wake();
  }

  /**
   * Schedule every note that starts before `horizon` (audio-clock seconds). The timer calls this with
   * a short look-ahead. It is public so the music can also be rendered offline in one call.
   * Returns false when nothing is playing any more.
   */
  schedule(now: number, horizon: number): boolean {
    let busy = false;
    for (const ch of this.channels.values()) {
      if (!ch.active || !ch.transport) continue;
      if (ch.stopAt !== null && now >= ch.stopAt) {
        // Its ending is already on the clock; the regular notes stop here.
        ch.active = false;
        continue;
      }
      busy = true;
      const piece = ch.piece;
      const due = collectDue(ch.transport, piece, now, horizon, (bar) => notesForBar(piece, bar, this.seed, this.mood));
      for (const note of due) {
        const input = ch.inputs[note.voice];
        if (input) playNote(this.ctx, input, note, this.noise);
      }
    }
    return busy;
  }

  /** Take everything apart (used when the audio engine is thrown away). */
  dispose(): void {
    this.sleep();
    for (const ch of this.channels.values()) {
      for (const osc of ch.running) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
      for (const n of [...ch.nodes, ...ch.running]) n.disconnect();
    }
    this.channels.clear();
    for (const n of this.roomNodes) n.disconnect();
    this.target = null;
  }

  private ramp(ch: Channel, value: number, now: number, tau: number): void {
    ch.fade.gain.setTargetAtTime(value, now, tau);
    ch.roomFade.gain.setTargetAtTime(value, now, tau);
  }

  private sweep(ch: Channel, hz: number, now: number, tau: number): void {
    ch.door.frequency.cancelScheduledValues(now);
    ch.door.frequency.setTargetAtTime(hz, now, tau);
  }

  private wake(): void {
    if (this.paused || this.timer !== null) return;
    const tick = (): void => {
      const now = this.ctx.currentTime;
      if (!this.schedule(now, now + LOOKAHEAD)) this.sleep();
    };
    this.timer = setInterval(tick, TICK_MS);
    tick();
  }

  private sleep(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  /** The channel of a piece, built the first time the piece is asked for. */
  private channel(id: PieceId): Channel {
    const existing = this.channels.get(id);
    if (existing) return existing;
    const ctx = this.ctx;
    const fade = ctx.createGain();
    fade.gain.value = 0;
    const door = ctx.createBiquadFilter();
    door.type = 'lowpass';
    door.frequency.value = OPEN_HZ;
    door.Q.value = 0.5;
    fade.connect(door).connect(this.output);
    const roomFade = ctx.createGain();
    roomFade.gain.value = 0;
    roomFade.connect(this.room);
    const ch: Channel = {
      piece: PIECES[id],
      fade,
      door,
      roomFade,
      inputs: {},
      nodes: [fade, door, roomFade],
      running: [],
      transport: null,
      active: false,
      stopAt: null,
    };
    for (const [voice, mix] of Object.entries(MIX[id]) as Array<[Voice, VoiceMix]>) {
      const input = ctx.createGain();
      input.gain.value = mix.level;
      const tone = voiceTone(ctx, voice, input);
      const send = ctx.createGain();
      send.gain.value = mix.room;
      tone.output.connect(send).connect(roomFade);
      ch.nodes.push(input, send, ...tone.nodes);
      ch.running.push(...tone.running);
      // Older Safari has no StereoPannerNode; the voice then sits in the middle.
      if (typeof ctx.createStereoPanner === 'function') {
        const pan = ctx.createStereoPanner();
        pan.pan.value = mix.pan;
        tone.output.connect(pan).connect(fade);
        ch.nodes.push(pan);
      } else {
        tone.output.connect(fade);
      }
      ch.inputs[voice] = input;
    }
    this.channels.set(id, ch);
    return ch;
  }
}
