// Plays the written music (music.ts) on the instruments (instruments.ts).
//
// Timing: a timer wakes up every 40 ms and schedules only the notes that start in the next 200 ms,
// always at times on the AudioContext clock. The timer itself may be late or early; the notes are not.
//
// Each piece has its own channel with its own place in the music. Changing piece fades one channel
// out and the other in. A piece that comes back carries on from where it was, it does not start over.
import {
  PIECES,
  collectDue,
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
// fade can be turned around halfway without a jump. With these time constants a crossfade is
// practically done in 1.5 to 2 seconds.
const FADE_IN_TAU = 0.6;
const FADE_OUT_TAU = 0.45;
/** A faded-out piece stops being scheduled after this long (by then it is more than 45 dB down). */
const FADE_OUT_HOLD = 2.5;

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
  /** What the piece sends to the reverb. Faded together with `fade`. */
  roomFade: GainNode;
  /** Where the notes of each voice go in. */
  inputs: Partial<Record<Voice, GainNode>>;
  nodes: AudioNode[];
  running: OscillatorNode[];
  transport: Transport | null;
  /** True while notes are being scheduled. */
  active: boolean;
  /** When a fading-out piece stops being scheduled; null while it is the one playing. */
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
      for (const ch of this.channels.values()) {
        if (ch.piece.id !== piece && ch.active && ch.stopAt === null) {
          ch.stopAt = now + FADE_OUT_HOLD;
          this.ramp(ch, 0, now, FADE_OUT_TAU);
        }
      }
      if (piece) {
        const ch = this.channel(piece);
        if (!ch.active) {
          // First time: bar 0. Coming back after a full fade-out: the bar after the last one played.
          ch.transport = startTransport(now + START_DELAY, ch.transport ? ch.transport.bar + 1 : 0);
          ch.active = true;
        }
        // Also covers a piece that was still fading out: it turns around and keeps its place.
        ch.stopAt = null;
        this.ramp(ch, 1, now, FADE_IN_TAU);
      }
    }
    this.wake();
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
    fade.connect(this.output);
    const roomFade = ctx.createGain();
    roomFade.gain.value = 0;
    roomFade.connect(this.room);
    const ch: Channel = {
      piece: PIECES[id],
      fade,
      roomFade,
      inputs: {},
      nodes: [fade, roomFade],
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
