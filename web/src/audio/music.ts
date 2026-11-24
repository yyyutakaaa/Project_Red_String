// The written music: two pieces, and the function that turns a bar number into the notes to play.
// Nothing in this file touches the Web Audio API, so it runs (and is unit tested) in plain node.
// The sound of each instrument lives in instruments.ts; the clock that plays these notes in musicPlayer.ts.
//
// Notes are MIDI numbers (60 = middle C, 69 = the A at 440 Hz). Positions and lengths are in beats.

export type Voice = 'keys' | 'bass' | 'lead' | 'vibes' | 'celesta' | 'pad' | 'brush';
export type PieceId = 'menu' | 'case';
/** The four in-case ambiences. They share one piece; the mood only changes how it is played. */
export type CaseMood = 'rain' | 'house' | 'harbor' | 'club';

export interface NoteEvent {
  voice: Voice;
  /** MIDI pitch. For the brush (a noise tap, no pitch) it sets how bright the tap is. */
  midi: number;
  /** Start, in beats from the start of the bar. Always inside the bar. */
  beat: number;
  /** Length in beats. May run past the end of the bar (a held note). */
  dur: number;
  /** Loudness, 0 to 1. */
  vel: number;
}

export interface Piece {
  id: PieceId;
  title: string;
  key: string;
  /** Pitch class of the key note (0 = C, 2 = D). */
  tonic: number;
  bpm: number;
  beatsPerBar: number;
  /** Where the off-beat eighth note falls inside the beat: 0.5 is straight, 0.62 is a lazy swing. */
  swing: number;
  /** Length of the harmonic form in bars. After this many bars the chords start over. */
  bars: number;
}

/** Slow, smoky ballad for the menus. */
export const MENU_THEME: Piece = {
  id: 'menu',
  title: 'Last Call',
  key: 'C minor',
  tonic: 0,
  bpm: 66,
  beatsPerBar: 4,
  swing: 0.62,
  bars: 16,
};

/** Investigation music for inside a case: faster, straight, a low D that will not go away. */
export const CASE_THEME: Piece = {
  id: 'case',
  title: 'Paper Trail',
  key: 'D minor',
  tonic: 2,
  bpm: 84,
  beatsPerBar: 4,
  swing: 0.5,
  bars: 32,
};

export const PIECES: Record<PieceId, Piece> = { menu: MENU_THEME, case: CASE_THEME };

/** Lowest and highest MIDI note each voice is ever given. The unit test holds the music to this. */
export const VOICE_RANGE: Record<Voice, readonly [number, number]> = {
  keys: [45, 76],
  bass: [28, 55],
  lead: [55, 86],
  vibes: [57, 88],
  celesta: [60, 96],
  pad: [31, 72],
  brush: [84, 100],
};

/** A written line: [start beat, length in beats, MIDI note]. An empty line is a bar of rest. */
type Line = ReadonlyArray<readonly [beat: number, dur: number, midi: number]>;

// ---------------------------------------------------------------------------------------------
// Menu theme: "Last Call". C minor, 66 bpm, swung. 16 bars: A (8) then B (8).
// Instruments: electric piano (chords), upright bass, muted trumpet (lead), brushes in B only.
// ---------------------------------------------------------------------------------------------

interface MenuChord {
  name: string;
  /** Root for the bass. */
  bass: number;
  /** Semitones from the root to the third and the fifth, for the walking bass. */
  third: number;
  fifth: number;
  /** Left-hand piano voicing without the root (the bass has it), kept close to its neighbours. */
  keys: readonly number[];
}

const MENU_FORM: readonly MenuChord[] = [
  // A: a slow walk around the circle of fifths and home again.
  { name: 'Cm9', bass: 36, third: 3, fifth: 7, keys: [51, 55, 58, 62] }, // Eb G Bb D
  { name: 'Fm9', bass: 41, third: 3, fifth: 7, keys: [51, 55, 56, 60] }, // Eb G Ab C
  { name: 'Bb13', bass: 34, third: 4, fifth: 7, keys: [50, 55, 56, 60] }, // D G Ab C
  { name: 'Ebmaj9', bass: 39, third: 4, fifth: 7, keys: [50, 53, 55, 58] }, // D F G Bb
  { name: 'Abmaj7', bass: 44, third: 4, fifth: 7, keys: [48, 51, 55, 58] }, // C Eb G Bb
  { name: 'Dm7b5', bass: 38, third: 3, fifth: 6, keys: [53, 56, 60, 62] }, // F Ab C D
  { name: 'G7b9b13', bass: 43, third: 4, fifth: 7, keys: [53, 56, 59, 63] }, // F Ab B Eb
  { name: 'Cm6/9', bass: 36, third: 3, fifth: 7, keys: [51, 55, 57, 62] }, // Eb G A D
  // B: starts away from home, slides down through Db9, and ends on the dominant so the loop falls back to Cm9.
  { name: 'Abmaj9', bass: 44, third: 4, fifth: 7, keys: [48, 51, 55, 58] }, // C Eb G Bb
  { name: 'Db9', bass: 37, third: 4, fifth: 7, keys: [53, 56, 59, 63] }, // F Ab Cb Eb
  { name: 'Cm9', bass: 36, third: 3, fifth: 7, keys: [51, 55, 58, 62] }, // Eb G Bb D
  { name: 'C7b9', bass: 36, third: 4, fifth: 7, keys: [52, 55, 58, 61] }, // E G Bb Db
  { name: 'Fm9', bass: 41, third: 3, fifth: 7, keys: [51, 55, 56, 60] }, // Eb G Ab C
  { name: 'Ab13', bass: 44, third: 4, fifth: 7, keys: [48, 53, 54, 58] }, // C F Gb Bb
  { name: 'G7sus4b9', bass: 43, third: 5, fifth: 7, keys: [53, 56, 60, 62] }, // F Ab C D
  { name: 'G7b9', bass: 43, third: 4, fifth: 7, keys: [53, 56, 59, 62] }, // F Ab B D
];

// The trumpet tune, one line per bar. Two takes: the player picks one per four-bar phrase, or lays out.
const MENU_LEAD_HIGH: readonly Line[] = [
  [[1, 0.5, 67], [1.5, 0.5, 70], [2, 1.5, 74]], // Cm9: G Bb, then a long D (the ninth)
  [[0.5, 1, 72], [2.5, 0.5, 68], [3, 1, 67]], // Fm9: C, Ab G
  [[0, 1, 65], [2, 0.5, 62], [2.5, 0.5, 65], [3, 1, 68]], // Bb13: F, D F Ab
  [[0, 2, 67]], // Ebmaj9: G, and half a bar of nothing
  [[0.5, 0.5, 63], [1, 0.5, 67], [1.5, 0.5, 70], [2, 1.5, 72]], // Abmaj7: Eb G Bb C
  [[1, 1, 77], [2.5, 0.5, 72], [3, 1, 68]], // Dm7b5: F, C Ab
  [[0, 1, 71], [2, 0.5, 68], [2.5, 0.5, 65], [3, 1, 63]], // G7b9b13: B, Ab F Eb
  [[0, 2, 62]], // Cm6/9: D
  [[0.5, 1, 75], [1.5, 0.5, 72], [2, 1.5, 79]], // Abmaj9: Eb C, up to G
  [[0, 1.5, 77], [3, 1, 71]], // Db9: F, Cb
  [[0, 1.5, 70], [3, 0.5, 67], [3.5, 0.5, 70]], // Cm9: Bb, G Bb
  [[0, 1, 73], [1, 0.5, 72], [1.5, 0.5, 70], [2, 1.5, 76]], // C7b9: Db C Bb, E
  [[0, 1.5, 77], [2.5, 0.5, 75], [3, 1, 72]], // Fm9: F, Eb C
  [[0, 1, 72], [2, 0.5, 70], [2.5, 1.5, 66]], // Ab13: C, Bb Gb
  [[0, 1, 65], [2.5, 0.5, 67], [3, 1, 68]], // G7sus4b9: F, G Ab
  [[0, 1, 71], [1.5, 0.5, 68], [2, 1, 62]], // G7b9: B, Ab D
];

const MENU_LEAD_LOW: readonly Line[] = [
  [[0, 1.5, 63], [2.5, 0.5, 62], [3, 1, 60]], // Cm9: Eb, D C
  [[0.5, 0.5, 60], [1, 0.5, 63], [1.5, 1.5, 67]], // Fm9: C Eb G
  [[0, 1, 65], [1, 0.5, 62], [1.5, 1.5, 60]], // Bb13: F D C
  [[2, 0.5, 58], [2.5, 0.5, 62], [3, 1, 65]], // Ebmaj9: a pick-up, Bb D F
  [[0, 1.5, 67], [3, 0.5, 65], [3.5, 0.5, 63]], // Abmaj7: G, F Eb
  [[0, 1.5, 60], [2.5, 0.5, 62], [3, 1, 65]], // Dm7b5: C, D F
  [[0, 1, 68], [1, 1, 67], [2.5, 0.5, 65], [3, 1, 59]], // G7b9b13: Ab G, F B
  [[0, 2, 60]], // Cm6/9: C
  [[1, 1, 72], [2, 1.5, 67]], // Abmaj9: C G
  [[1, 1, 71], [2, 1.5, 65]], // Db9: Cb F
  [[0.5, 0.5, 63], [1, 0.5, 67], [1.5, 1.5, 70]], // Cm9: Eb G Bb
  [[1, 0.5, 70], [1.5, 0.5, 67], [2, 1.5, 64]], // C7b9: Bb G E
  [[0, 2, 65]], // Fm9: F
  [[0.5, 0.5, 63], [1, 0.5, 66], [1.5, 1.5, 70]], // Ab13: Eb Gb Bb
  [[0, 1.5, 72], [3, 1, 68]], // G7sus4b9: C, Ab
  [[0, 2, 67]], // G7b9: G
];

// ---------------------------------------------------------------------------------------------
// Case music: "Paper Trail". D minor, 84 bpm, straight. 32 bars: A A B A, eight bars each.
// Instruments: low strings (pad), plucked bass on a pedal D, vibraphone, celesta.
// In A the bass refuses to leave D while the strings move above it; the seventh bar rubs
// (A7b9 over the D) and the eighth lets go. In B the bass finally walks down: Bb, G, E, A.
// ---------------------------------------------------------------------------------------------

interface CaseChord {
  name: string;
  /** String notes. Empty when the bar only holds on to the chord before it. */
  pad: readonly number[];
  /** How many bars the strings hold this chord. */
  hold: number;
  /** The written bass line for the bar. */
  bass: Line;
  /** Five notes, low to high, that sound right on the vibraphone over this chord. */
  color: readonly [number, number, number, number, number];
  /** The written vibraphone tune for the bar. */
  theme: Line;
}

const CASE_A: readonly CaseChord[] = [
  {
    name: 'Dm(add9)', // D A E
    pad: [50, 57, 64],
    hold: 2,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 45], [3, 1, 48]], // D D, A C
    color: [65, 69, 72, 74, 76],
    theme: [[1, 1, 69], [2, 0.5, 74], [2.5, 1.5, 76]], // the question: A D E
  },
  {
    name: 'Dm(add9)',
    pad: [],
    hold: 0,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 41], [3, 1, 40]], // D D, F E
    color: [65, 69, 72, 74, 76],
    theme: [[1, 0.5, 77], [1.5, 2.5, 76]], // F, falling back to E
  },
  {
    name: 'Bb/D', // D Bb F
    pad: [50, 58, 65],
    hold: 2,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 41], [3, 1, 46]], // D D, F Bb
    color: [65, 69, 70, 74, 77],
    theme: [[1, 1, 69], [2, 0.5, 74], [2.5, 1.5, 77]], // asked again, a step higher: A D F
  },
  {
    name: 'Bb/D',
    pad: [],
    hold: 0,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 46], [3, 1, 45]], // D D, Bb A
    color: [65, 69, 70, 74, 77],
    theme: [[1, 0.5, 76], [1.5, 2.5, 74]], // E D
  },
  {
    name: 'Gm6/D', // D G Bb E
    pad: [50, 55, 58, 64],
    hold: 2,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 43], [3, 1, 46]], // D D, G Bb
    color: [67, 70, 74, 76, 79],
    theme: [[0.5, 0.5, 79], [1, 1, 76], [2.5, 1.5, 70]], // G E, down a tritone to Bb
  },
  {
    name: 'Gm6/D',
    pad: [],
    hold: 0,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 43], [3, 1, 40]], // D D, G E
    color: [67, 70, 74, 76, 79],
    theme: [[1.5, 2.5, 67]], // G
  },
  {
    name: 'A7b9/D', // C# G Bb E over the D that will not move: the rub
    pad: [49, 55, 58, 64],
    hold: 1,
    bass: [[0, 1.5, 38], [1.5, 0.5, 38], [2.5, 0.5, 46], [3, 1, 43]], // D D, Bb G
    color: [67, 70, 73, 76, 79],
    theme: [[0, 1, 73], [1, 1, 76], [2, 2, 79]], // C# E G, climbing
  },
  {
    name: 'A7', // C# G A E, and the bass gives in and goes to A
    pad: [49, 55, 57, 64],
    hold: 1,
    bass: [[0, 1.5, 33], [1.5, 0.5, 33], [2.5, 0.5, 40], [3, 1, 37]], // A A, E C#
    color: [64, 67, 69, 73, 76],
    theme: [[0.5, 3, 81]], // a high A, left hanging
  },
];

const CASE_B: readonly CaseChord[] = [
  {
    name: 'Bbmaj7#11', // F A D E
    pad: [53, 57, 62, 64],
    hold: 2,
    bass: [[0, 2, 34], [2.5, 0.5, 41], [3, 1, 46]], // Bb, F Bb
    color: [64, 65, 69, 74, 76],
    theme: [[0, 1.5, 76], [1.5, 0.5, 74], [2, 2, 69]], // E D A, a falling figure
  },
  {
    name: 'Bbmaj7#11',
    pad: [],
    hold: 0,
    bass: [[0, 2, 34], [2.5, 0.5, 41], [3, 1, 45]], // Bb, F A
    color: [64, 65, 69, 74, 76],
    theme: [[2, 0.5, 65], [2.5, 1.5, 69]], // F A
  },
  {
    name: 'Gm9', // F Bb D
    pad: [53, 58, 62],
    hold: 2,
    bass: [[0, 2, 43], [2.5, 0.5, 38], [3, 1, 41]], // G, D F
    color: [65, 69, 70, 74, 77],
    theme: [[0, 1.5, 77], [1.5, 0.5, 74], [2, 2, 70]], // the same figure a step up: F D Bb
  },
  {
    name: 'Gm9',
    pad: [],
    hold: 0,
    bass: [[0, 2, 43], [2.5, 0.5, 46], [3, 1, 41]], // G, Bb F
    color: [65, 69, 70, 74, 77],
    theme: [[2, 0.5, 69], [2.5, 1.5, 74]], // A D
  },
  {
    name: 'Em7b5', // D G Bb
    pad: [50, 55, 58],
    hold: 2,
    bass: [[0, 2, 40], [2.5, 0.5, 46], [3, 1, 43]], // E, Bb G
    color: [64, 67, 70, 74, 76],
    theme: [[0, 1.5, 79], [1.5, 0.5, 76], [2, 2, 70]], // and once more, higher: G E Bb
  },
  {
    name: 'Em7b5',
    pad: [],
    hold: 0,
    bass: [[0, 2, 40], [2.5, 0.5, 43], [3, 1, 34]], // E, G, and Bb leaning on the A to come
    color: [64, 67, 70, 74, 76],
    theme: [[1, 1, 74], [2, 2, 76]], // D E
  },
  {
    name: 'A7sus4b9', // D G Bb E
    pad: [50, 55, 58, 64],
    hold: 1,
    bass: [[0, 2, 33], [2.5, 0.5, 40], [3, 1, 45]], // A, E A
    color: [64, 67, 70, 74, 76],
    theme: [[0, 2, 74], [2, 2, 76]], // D E
  },
  {
    name: 'A7b9', // C# G Bb E: the D in the strings drops to C#, and the next bar is home
    pad: [49, 55, 58, 64],
    hold: 1,
    bass: [[0, 1.5, 33], [1.5, 0.5, 33], [2.5, 0.5, 40], [3, 1, 37]], // A A, E C#
    color: [64, 67, 70, 73, 76],
    theme: [[0, 1, 73], [1, 1, 70], [2, 2, 69]], // C# Bb A
  },
];

const CASE_FORM: ReadonlyArray<readonly CaseChord[]> = [CASE_A, CASE_A, CASE_B, CASE_A];
const CASE_SECTION_BARS = 8;

// Small vibraphone figures for when the written tune rests: [start beat, length, index into the chord's colour notes].
const VIBES_FIGURES: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [[0.5, 1, 2], [1.5, 2.5, 3]],
  [[2, 0.5, 4], [2.5, 0.5, 3], [3, 1, 1]],
  [[0, 1.5, 0], [1.5, 1, 2], [3, 1, 4]],
  [[3, 0.5, 2], [3.5, 0.5, 3]],
  [[1, 3, 4]],
  [[0, 0.5, 1], [0.5, 0.5, 2], [1, 0.5, 3], [1.5, 2.5, 4]],
  [[2, 2, 1]],
  [[0, 1, 3], [2, 2, 2]],
];

// A quiet celesta pattern, grouped 3 + 3 + 2 like a clock that cannot keep even time:
// [start beat, index into the chord's colour notes].
const TICK_PATTERN: ReadonlyArray<readonly [number, number]> = [
  [0, 3],
  [0.5, 1],
  [1.5, 3],
  [2, 1],
  [3, 2],
];

interface MoodSettings {
  /** Chance per bar that the vibraphone plays a figure when the written tune is resting. */
  vibes: number;
  /** Chance that a vibraphone note is doubled an octave up on the celesta. */
  celesta: number;
  /** Chance per A section that the ticking celesta pattern plays. */
  tick: number;
  /** Chance per section of a long, low horn-like string note at its start. */
  horn: number;
  /** How loud (and so how bright) the strings play. */
  pad: number;
  brushes: boolean;
  busyBass: boolean;
}

const MOODS: Record<CaseMood, MoodSettings> = {
  rain: { vibes: 0.55, celesta: 0.12, tick: 0.25, horn: 0, pad: 0.55, brushes: false, busyBass: false },
  // Indoors: more celesta (a music box, a hallway clock).
  house: { vibes: 0.5, celesta: 0.35, tick: 0.5, horn: 0, pad: 0.55, brushes: false, busyBass: false },
  // The docks: darker and emptier, with a far-off horn.
  harbor: { vibes: 0.35, celesta: 0.05, tick: 0.15, horn: 0.6, pad: 0.45, brushes: false, busyBass: false },
  // The club: brushes on the backbeat, a busier bass and vibraphone.
  club: { vibes: 0.7, celesta: 0.1, tick: 0.2, horn: 0, pad: 0.5, brushes: true, busyBass: true },
};

// ---------------------------------------------------------------------------------------------
// Seeded randomness. The same seed and bar always give the same notes, so the music can be tested,
// and a bar that is asked for twice (for example after the tab was hidden) does not change.
// ---------------------------------------------------------------------------------------------

function mix(parts: readonly number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    h = Math.imul(h ^ (p | 0), 0x01000193);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
  }
  return h >>> 0;
}

/** A random number generator (mulberry32) whose sequence depends only on the numbers given. */
function random(...parts: number[]): () => number {
  let a = mix(parts);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One number per kind of decision, so the decisions do not follow each other.
const SALT = { menuBar: 11, menuLead: 12, caseSection: 21, caseBar: 22, human: 31 } as const;

const mod = (n: number, m: number): number => ((n % m) + m) % m;

function at<T>(list: readonly T[], index: number): T {
  return list[mod(index, list.length)] as T;
}

/** Move the off-beat eighth later inside its beat. Strictly increasing, so lengths stay positive. */
function swung(beat: number, swing: number): number {
  const whole = Math.floor(beat);
  const frac = beat - whole;
  return whole + (frac < 0.5 ? frac * 2 * swing : swing + (frac - 0.5) * 2 * (1 - swing));
}

function put(out: NoteEvent[], piece: Piece, voice: Voice, beat: number, dur: number, midi: number, vel: number): void {
  const start = swung(beat, piece.swing);
  out.push({ voice, midi, beat: start, dur: swung(beat + dur, piece.swing) - start, vel });
}

// ---------------------------------------------------------------------------------------------
// Bar builders
// ---------------------------------------------------------------------------------------------

/** Which take of the tune the trumpet plays in a four-bar phrase: 0 high, 1 low, 2 lays out. */
function leadTake(seed: number, phrase: number): 0 | 1 | 2 {
  const raw = (p: number): 0 | 1 | 2 => {
    const u = random(seed, SALT.menuLead, p)();
    return u < 0.45 ? 0 : u < 0.85 ? 1 : 2;
  };
  if (phrase <= 0) return 0; // the first thing the player hears is the tune itself
  const take = raw(phrase);
  // Never two silent phrases in a row: eight bars without the tune sounds like something broke.
  if (take === 2 && raw(phrase - 1) === 2) return 0;
  return take;
}

function menuBar(bar: number, seed: number): NoteEvent[] {
  const piece = MENU_THEME;
  const out: NoteEvent[] = [];
  const pos = mod(bar, piece.bars);
  const chord = at(MENU_FORM, pos);
  const next = at(MENU_FORM, pos + 1);
  const bridge = pos >= 8;
  const r = random(seed, SALT.menuBar, bar);

  // Electric piano. Each chord is rolled upward a little, the way a hand lands on the keys.
  const strike = (beat: number, dur: number, notes: readonly number[], vel: number): void => {
    notes.forEach((n, i) => put(out, piece, 'keys', beat + i * 0.03, dur, n, vel * (i === notes.length - 1 ? 1.1 : 1)));
  };
  const comp = r();
  if (comp < 0.4) {
    strike(0, 3.5, chord.keys, 0.6);
  } else if (comp < 0.65) {
    strike(0, 1.5, chord.keys, 0.6);
    strike(2.5, 1.25, chord.keys, 0.45);
  } else if (comp < 0.8) {
    strike(0.5, 3, chord.keys, 0.55); // late, behind the beat
  } else {
    strike(0, 2.5, chord.keys, 0.6);
    strike(3.5, 0.4, next.keys, 0.4); // leans into the next chord early
  }

  // Upright bass. Two notes a bar in A; in B it sometimes walks in quarter notes.
  const sameRoot = next.bass === chord.bass;
  const approach = next.bass + (r() < 0.5 ? -1 : 1);
  const walks = bridge && r() < 0.5;
  const pickup = r() < 0.35;
  if (walks) {
    put(out, piece, 'bass', 0, 0.9, chord.bass, 0.85);
    put(out, piece, 'bass', 1, 0.9, chord.bass + chord.third, 0.65);
    put(out, piece, 'bass', 2, 0.9, chord.bass + chord.fifth, 0.75);
    put(out, piece, 'bass', 3, 0.9, sameRoot ? chord.bass + chord.third : approach, 0.65);
  } else {
    put(out, piece, 'bass', 0, 1.75, chord.bass, 0.85);
    put(out, piece, 'bass', 2, 1.4, chord.bass + chord.fifth, 0.7);
    if (pickup && !sameRoot) put(out, piece, 'bass', 3.5, 0.45, approach, 0.55);
  }

  // Muted trumpet.
  const take = leadTake(seed, Math.floor(bar / 4));
  if (take !== 2) {
    const line = at(take === 0 ? MENU_LEAD_HIGH : MENU_LEAD_LOW, pos);
    for (const [beat, dur, midi] of line) {
      const u = r();
      // Now and then a short passing note is left out; the line keeps its long notes.
      if (dur <= 0.5 && line.length > 2 && u < 0.1) continue;
      // Now and then a quick note from a half step below slides into a long one.
      if (dur >= 1 && beat >= 0.5 && u > 0.82) put(out, piece, 'lead', beat - 0.2, 0.2, midi - 1, 0.4);
      put(out, piece, 'lead', beat, dur * 0.95, midi, dur >= 1.5 ? 0.7 : 0.6);
    }
  }

  // Brushes: only in B, a soft tap on two and four. Short hits with silence between them.
  if (bridge) {
    put(out, piece, 'brush', 1, 0.12, 93, 0.5);
    put(out, piece, 'brush', 3, 0.12, 93, 0.5);
    if (r() < 0.4) put(out, piece, 'brush', 3.5, 0.08, 96, 0.28);
  }
  return out;
}

function caseBar(bar: number, seed: number, mood: CaseMood): NoteEvent[] {
  const piece = CASE_THEME;
  const out: NoteEvent[] = [];
  const m = MOODS[mood];
  const pos = mod(bar, piece.bars);
  const inSection = pos % CASE_SECTION_BARS;
  const sectionOfForm = Math.floor(pos / CASE_SECTION_BARS);
  const pedal = sectionOfForm !== 2; // the A sections
  const chord = at(at(CASE_FORM, sectionOfForm), inSection);
  // Counted from the very first bar, not from the top of the loop, so each time around is arranged differently.
  const section = Math.floor(bar / CASE_SECTION_BARS);

  // Decisions for the whole eight-bar section.
  const s = random(seed, SALT.caseSection, section);
  const uTheme = s();
  const uBass = s();
  const uTick = s();
  const uHorn = s();
  const playsTheme = section <= 0 || uTheme < 0.5;
  const bassOn = !(pedal && section > 0 && uBass < 0.15); // sometimes the floor drops away
  const ticking = pedal && section > 0 && uTick < m.tick;

  const r = random(seed, SALT.caseBar, bar);

  // Low strings. Each chord overlaps the next by most of a beat so one fades into the other.
  for (const n of chord.pad) put(out, piece, 'pad', 0, chord.hold * piece.beatsPerBar + 0.75, n, m.pad);
  if (inSection === 0 && uHorn < m.horn) {
    const root = at(chord.bass, 0)[2];
    put(out, piece, 'pad', 0, 7, root, 0.42);
    put(out, piece, 'pad', 0, 7, root + 7, 0.3);
  }

  // Plucked bass.
  const dropRepeat = r() < 0.2;
  if (bassOn) {
    let onThree = false;
    for (const [beat, dur, midi] of chord.bass) {
      if (beat === 1.5 && dropRepeat) continue;
      if (beat === 2) onThree = true;
      put(out, piece, 'bass', beat, dur, midi, beat === 0 ? 0.85 : 0.65);
    }
    if (m.busyBass && !onThree) put(out, piece, 'bass', 2, 0.45, at(chord.bass, 0)[2], 0.5);
  }

  // Vibraphone: the written tune, or a small figure, or nothing.
  const uFigure = r();
  const figure = at(VIBES_FIGURES, Math.floor(r() * VIBES_FIGURES.length));
  const tune: Line = playsTheme
    ? chord.theme
    : uFigure < m.vibes
      ? figure.map(([beat, dur, index]) => [beat, dur, at(chord.color, index)] as const)
      : [];
  for (const [beat, dur, midi] of tune) {
    const uDouble = r();
    put(out, piece, 'vibes', beat, dur, midi, dur >= 1.5 ? 0.65 : 0.55);
    if (uDouble < m.celesta) put(out, piece, 'celesta', beat, Math.min(dur, 1), midi + 12, 0.4);
  }

  if (ticking) {
    for (const [beat, index] of TICK_PATTERN) put(out, piece, 'celesta', beat, 0.35, at(chord.color, index), 0.28);
  }

  if (m.brushes) {
    put(out, piece, 'brush', 1, 0.12, 93, 0.45);
    put(out, piece, 'brush', 3, 0.12, 93, 0.45);
    if (r() < 0.4) put(out, piece, 'brush', 2.5, 0.08, 96, 0.25);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------------------------

export function beatSeconds(piece: Piece): number {
  return 60 / piece.bpm;
}

export function barSeconds(piece: Piece): number {
  return beatSeconds(piece) * piece.beatsPerBar;
}

/** Length of the form in beats. Always a whole number of bars, which is what makes the loop seamless. */
export function loopBeats(piece: Piece): number {
  return piece.bars * piece.beatsPerBar;
}

export function loopSeconds(piece: Piece): number {
  return loopBeats(piece) * beatSeconds(piece);
}

/** Name of the chord under a bar. Bars count on forever; the chords repeat every `piece.bars`. */
export function chordAt(piece: Piece, bar: number): string {
  const pos = mod(bar, piece.bars);
  if (piece.id === 'menu') return at(MENU_FORM, pos).name;
  return at(at(CASE_FORM, Math.floor(pos / CASE_SECTION_BARS)), pos % CASE_SECTION_BARS).name;
}

/**
 * The notes of one bar, sorted by start. `bar` counts from 0 and never wraps: the chords repeat every
 * `piece.bars`, but the choices (which take of the tune, which figures, who lays out) are made per bar,
 * phrase or section from `seed`, so the hundredth bar is not a copy of the fourth.
 */
export function notesForBar(piece: Piece, bar: number, seed: number, mood: CaseMood = 'rain'): NoteEvent[] {
  const notes = piece.id === 'menu' ? menuBar(bar, seed) : caseBar(bar, seed, mood);
  // No player is a machine: nudge each note a few milliseconds and vary how hard it is hit.
  const h = random(seed, SALT.human, piece.tonic, bar);
  const last = piece.beatsPerBar - 0.001;
  for (const n of notes) {
    const nudge = (h() - 0.5) * 0.02;
    const touch = 0.92 + h() * 0.16;
    if (n.voice !== 'pad') n.beat = Math.min(last, Math.max(0, n.beat + nudge));
    n.vel = Math.min(1, n.vel * touch);
  }
  return notes.sort((a, b) => a.beat - b.beat);
}

/** Which piece, and which way of playing it, belongs to an ambience. `null` means silence. */
/** Bars per phrase: a piece that comes back starts at the top of a phrase, not halfway through one. */
export const PHRASE_BARS = 4;

/** The first bar of the next phrase after `bar`. */
export function nextPhraseBar(bar: number): number {
  return Math.ceil((bar + 1) / PHRASE_BARS) * PHRASE_BARS;
}

/**
 * How a piece stops when the player leaves: one held chord on its own key note, so the music ends
 * instead of being cut off. Beats are counted from the beat the ending starts on. Lengths run past
 * one bar on purpose; the instruments' own releases and the fade-out take care of the tail.
 */
export function endingFor(piece: Piece): NoteEvent[] {
  if (piece.id === 'menu') {
    const home = MENU_FORM[0]!; // Cm9
    return [
      { voice: 'bass', midi: home.bass, beat: 0, dur: 4, vel: 0.62 },
      ...home.keys.map((midi, i) => ({ voice: 'keys' as const, midi, beat: i * 0.06, dur: 6, vel: 0.5 })),
      // the trumpet's last word: the fifth, held, under a fading vibrato
      { voice: 'lead', midi: 67, beat: 0.5, dur: 3.5, vel: 0.42 },
    ];
  }
  const home = CASE_A[0]!; // Dm(add9)
  return [
    { voice: 'bass', midi: 38, beat: 0, dur: 4, vel: 0.6 },
    ...home.pad.map((midi) => ({ voice: 'pad' as const, midi, beat: 0, dur: 7, vel: 0.5 })),
    // one vibraphone note on the ninth, left hanging: the case is not closed yet
    { voice: 'vibes', midi: 76, beat: 1, dur: 4, vel: 0.45 },
  ];
}

export function musicForAmbience(kind: string): { piece: PieceId; mood: CaseMood } | null {
  switch (kind) {
    case 'menu':
      return { piece: 'menu', mood: 'rain' };
    case 'rain':
    case 'house':
    case 'harbor':
    case 'club':
      return { piece: 'case', mood: kind };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------
// The transport: turns "what time is it on the audio clock" into "which notes are due".
// Kept here, away from the Web Audio code, so the bar arithmetic can be tested.
// ---------------------------------------------------------------------------------------------

export interface Transport {
  /** Audio-clock time at which bar `originBar` starts. Every other bar is measured from here, so rounding errors cannot add up. */
  originTime: number;
  originBar: number;
  /** The bar whose notes are in `queue`. */
  bar: number;
  queue: NoteEvent[];
  /** Index in `queue` of the next note to hand out. */
  next: number;
}

export interface ScheduledNote {
  voice: Voice;
  midi: number;
  vel: number;
  /** Start on the audio clock, in seconds. */
  time: number;
  /** Length in seconds. */
  dur: number;
}

/** A note this late is not played any more. */
const LATE_TOLERANCE = 0.02;
/** ...unless it still has at least this long to sound (a held string chord): then it comes in late. */
const LATE_BUT_LONG = 0.6;
/** After a long stall the music picks up this far in the future. */
const RESYNC_DELAY = 0.05;

/** A transport whose next bar is `bar`, starting at `time`. */
export function startTransport(time: number, bar: number): Transport {
  return { originTime: time, originBar: bar, bar: bar - 1, queue: [], next: 0 };
}

/**
 * Hand out every note that starts before `horizon`, each exactly once, and move on to following bars as
 * needed. Call it often with `horizon` a little ahead of `now` (the usual look-ahead scheduler).
 * If the caller was away for a while (a frozen tab, a long stall) the missed notes are dropped, not
 * played all at once, and after more than a bar away the music simply carries on from the next bar.
 */
export function collectDue(
  tr: Transport,
  piece: Piece,
  now: number,
  horizon: number,
  notes: (bar: number) => NoteEvent[],
): ScheduledNote[] {
  const beat = beatSeconds(piece);
  const barLength = barSeconds(piece);
  const due: ScheduledNote[] = [];
  for (;;) {
    if (tr.next >= tr.queue.length) {
      const nextBar = tr.bar + 1;
      const start = tr.originTime + (nextBar - tr.originBar) * barLength;
      if (start >= horizon) break;
      if (start + barLength < now) {
        tr.originTime = now + RESYNC_DELAY;
        tr.originBar = nextBar;
      }
      tr.bar = nextBar;
      tr.queue = notes(nextBar);
      tr.next = 0;
      continue;
    }
    const ev = tr.queue[tr.next] as NoteEvent;
    const time = tr.originTime + (tr.bar - tr.originBar) * barLength + ev.beat * beat;
    if (time >= horizon) break;
    tr.next++;
    const dur = ev.dur * beat;
    if (time >= now - LATE_TOLERANCE) {
      due.push({ voice: ev.voice, midi: ev.midi, vel: ev.vel, time: Math.max(time, now), dur });
    } else if (time + dur > now + LATE_BUT_LONG) {
      due.push({ voice: ev.voice, midi: ev.midi, vel: ev.vel, time: now, dur: time + dur - now });
    }
  }
  return due;
}
