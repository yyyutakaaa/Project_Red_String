import { describe, expect, it } from 'vitest';
import {
  CASE_THEME,
  MENU_THEME,
  PIECES,
  VOICE_RANGE,
  barSeconds,
  beatSeconds,
  chordAt,
  collectDue,
  loopBeats,
  loopSeconds,
  musicForAmbience,
  notesForBar,
  startTransport,
  type CaseMood,
  type NoteEvent,
  type Piece,
  type ScheduledNote,
} from '../music.ts';
import { PHRASE_BARS, VOICE_RANGE as RANGE_FOR_ENDING, endingFor, nextPhraseBar } from '../music.ts';
import { MIX } from '../musicPlayer.ts';

const SEED = 1947;
const MOODS: CaseMood[] = ['rain', 'house', 'harbor', 'club'];
const pieces: Piece[] = [MENU_THEME, CASE_THEME];

/** Every bar of the first `loops` times through the form. */
function bars(piece: Piece, loops: number, seed = SEED, mood: CaseMood = 'rain'): NoteEvent[][] {
  return Array.from({ length: piece.bars * loops }, (_, bar) => notesForBar(piece, bar, seed, mood));
}

const pitchClasses = (piece: Piece): Set<number> =>
  new Set(
    bars(piece, 1)
      .flat()
      .filter((n) => n.voice !== 'brush')
      .map((n) => n.midi % 12),
  );

describe('the two pieces', () => {
  it('are different music: other tempo, other key, other feel, other band', () => {
    expect(MENU_THEME.bpm).not.toBe(CASE_THEME.bpm);
    expect(MENU_THEME.tonic).not.toBe(CASE_THEME.tonic);
    expect(MENU_THEME.swing).not.toBe(CASE_THEME.swing);
    expect(MENU_THEME.bars).not.toBe(CASE_THEME.bars);

    const voices = (piece: Piece) => new Set(bars(piece, 2).flat().map((n) => n.voice));
    expect(voices(MENU_THEME)).toContain('lead');
    expect(voices(MENU_THEME)).toContain('keys');
    expect(voices(CASE_THEME)).toContain('pad');
    expect(voices(CASE_THEME)).toContain('vibes');
    expect(voices(CASE_THEME)).not.toContain('lead');
    expect(voices(MENU_THEME)).not.toContain('pad');

    // Different key: the menu bass starts on C, the case bass on D, and the two use different sets of notes.
    const firstBass = (piece: Piece) => notesForBar(piece, 0, SEED).find((n) => n.voice === 'bass')?.midi;
    expect((firstBass(MENU_THEME) ?? -1) % 12).toBe(MENU_THEME.tonic);
    expect((firstBass(CASE_THEME) ?? -1) % 12).toBe(CASE_THEME.tonic);
    expect(pitchClasses(MENU_THEME)).not.toEqual(pitchClasses(CASE_THEME));
  });

  it('are in the tempo range that was asked for', () => {
    expect(MENU_THEME.bpm).toBeGreaterThanOrEqual(60);
    expect(MENU_THEME.bpm).toBeLessThanOrEqual(75);
    expect(CASE_THEME.bpm).toBeGreaterThan(MENU_THEME.bpm);
  });

  it('use a real chord progression, not one chord', () => {
    for (const piece of pieces) {
      const names = new Set(Array.from({ length: piece.bars }, (_, bar) => chordAt(piece, bar)));
      expect(names.size).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('looping', () => {
  it.each(pieces)('$title is a whole number of bars long', (piece) => {
    expect(Number.isInteger(piece.bars)).toBe(true);
    expect(Number.isInteger(piece.beatsPerBar)).toBe(true);
    expect(loopBeats(piece) % piece.beatsPerBar).toBe(0);
    expect(loopBeats(piece) / piece.beatsPerBar).toBe(piece.bars);
    expect(loopSeconds(piece)).toBeCloseTo(piece.bars * barSeconds(piece), 9);
    expect(barSeconds(piece)).toBeCloseTo(piece.beatsPerBar * beatSeconds(piece), 12);
  });

  it.each(pieces)('$title has the same chords every time around', (piece) => {
    for (let bar = 0; bar < piece.bars; bar++) {
      expect(chordAt(piece, bar + piece.bars)).toBe(chordAt(piece, bar));
      expect(chordAt(piece, bar + 7 * piece.bars)).toBe(chordAt(piece, bar));
    }
  });

  it.each(pieces)('$title starts every bar of every loop with something to play', (piece) => {
    // No silent bar at the seam (or anywhere else): the last bar leads into the first without a hole.
    for (const mood of MOODS) {
      bars(piece, 6, SEED, mood).forEach((notes, bar) => {
        expect(notes.length, `bar ${bar} (${mood})`).toBeGreaterThan(0);
      });
    }
  });

  it('has the bass on the key note at the top of every loop, straight after the dominant', () => {
    for (const piece of pieces) {
      const lastChord = chordAt(piece, piece.bars - 1);
      expect(lastChord.startsWith(piece.id === 'menu' ? 'G7' : 'A7')).toBe(true);
      for (let loop = 0; loop < 5; loop++) {
        // The lowest note of the bass or the strings: in later loops the case bass may sit a section out.
        const first = notesForBar(piece, loop * piece.bars, SEED);
        const low = first.filter((n) => n.voice === 'bass' || n.voice === 'pad').sort((a, b) => a.midi - b.midi)[0];
        expect((low?.midi ?? -1) % 12).toBe(piece.tonic);
      }
    }
  });

  it('does not play the same thing every time around (ten minutes should not be one loop on repeat)', () => {
    for (const piece of pieces) {
      const loops = Math.ceil(600 / loopSeconds(piece));
      const fingerprints = new Set<string>();
      for (let loop = 0; loop < loops; loop++) {
        const notes = Array.from({ length: piece.bars }, (_, i) => notesForBar(piece, loop * piece.bars + i, SEED));
        // Leave out the tiny timing and loudness nudges: only what is played, and on which beat.
        fingerprints.add(notes.map((bar) => bar.map((n) => `${n.voice}${n.midi}@${n.beat.toFixed(1)}`).join(' ')).join('|'));
      }
      expect(fingerprints.size).toBeGreaterThanOrEqual(Math.min(loops, 5));
    }
  });
});

describe('every scheduled note', () => {
  it('has a positive length, starts inside its bar, and sits in the range of its instrument', () => {
    for (const piece of pieces) {
      for (const seed of [0, 1, SEED, 0x7fffffff]) {
        for (const mood of MOODS) {
          for (const notes of bars(piece, 8, seed, mood)) {
            for (const n of notes) {
              expect(n.dur).toBeGreaterThan(0);
              expect(Number.isFinite(n.dur)).toBe(true);
              expect(n.beat).toBeGreaterThanOrEqual(0);
              expect(n.beat).toBeLessThan(piece.beatsPerBar);
              expect(n.vel).toBeGreaterThan(0);
              expect(n.vel).toBeLessThanOrEqual(1);
              const [low, high] = VOICE_RANGE[n.voice];
              expect(n.midi, `${n.voice} in ${piece.title}`).toBeGreaterThanOrEqual(low);
              expect(n.midi, `${n.voice} in ${piece.title}`).toBeLessThanOrEqual(high);
              expect(Number.isInteger(n.midi)).toBe(true);
            }
          }
        }
      }
    }
  });

  it('keeps the instruments where they belong: bass low, chords in the middle, tune on top', () => {
    const range = (piece: Piece, voice: string) => {
      const midi = bars(piece, 8).flat().filter((n) => n.voice === voice).map((n) => n.midi);
      return [Math.min(...midi), Math.max(...midi)];
    };
    for (const piece of pieces) {
      const [bassLow, bassHigh] = range(piece, 'bass');
      expect(bassLow).toBeGreaterThanOrEqual(28);
      expect(bassHigh).toBeLessThanOrEqual(52);
    }
    expect(range(MENU_THEME, 'keys')[0]).toBeGreaterThanOrEqual(48);
    expect(range(MENU_THEME, 'keys')[1]).toBeLessThanOrEqual(72);
    expect(range(MENU_THEME, 'lead')[0]).toBeGreaterThanOrEqual(57);
    expect(range(MENU_THEME, 'lead')[1]).toBeLessThanOrEqual(84);
    expect(range(CASE_THEME, 'vibes')[0]).toBeGreaterThanOrEqual(60);
    expect(range(CASE_THEME, 'vibes')[1]).toBeLessThanOrEqual(84);
  });

  it('comes out sorted by start', () => {
    for (const piece of pieces) {
      for (const notes of bars(piece, 4)) {
        for (let i = 1; i < notes.length; i++) {
          expect(notes[i]!.beat).toBeGreaterThanOrEqual(notes[i - 1]!.beat);
        }
      }
    }
  });

  it('leaves the trumpet room to breathe', () => {
    // A written melody with rests: in every four-bar phrase the lead is silent for at least a quarter of the time.
    for (let phrase = 0; phrase < 24; phrase++) {
      let sounding = 0;
      for (let bar = phrase * 4; bar < phrase * 4 + 4; bar++) {
        for (const n of notesForBar(MENU_THEME, bar, SEED)) if (n.voice === 'lead') sounding += n.dur;
      }
      expect(sounding).toBeLessThanOrEqual(12);
    }
  });

  it('only uses noise as short taps with silence between them', () => {
    for (const piece of pieces) {
      for (const mood of MOODS) {
        for (const notes of bars(piece, 4, SEED, mood)) {
          const taps = notes.filter((n) => n.voice === 'brush');
          const sounding = taps.reduce((sum, n) => sum + n.dur, 0);
          for (const tap of taps) expect(tap.dur * beatSeconds(piece)).toBeLessThan(0.15);
          expect(sounding).toBeLessThan(piece.beatsPerBar * 0.15);
        }
      }
    }
  });
});

describe('repeatability', () => {
  it('gives the same notes for the same bar and seed', () => {
    for (const piece of pieces) {
      for (const mood of MOODS) {
        for (const bar of [0, 1, 7, 15, 16, 31, 32, 100, 1000]) {
          expect(notesForBar(piece, bar, SEED, mood)).toEqual(notesForBar(piece, bar, SEED, mood));
        }
      }
    }
  });

  it('does not depend on which bars were asked for before', () => {
    const fresh = notesForBar(CASE_THEME, 40, SEED);
    for (let bar = 0; bar < 40; bar++) notesForBar(CASE_THEME, bar, SEED);
    expect(notesForBar(CASE_THEME, 40, SEED)).toEqual(fresh);
  });

  it('gives a different performance for a different seed', () => {
    for (const piece of pieces) {
      const one = JSON.stringify(bars(piece, 4, 1));
      const two = JSON.stringify(bars(piece, 4, 2));
      expect(one).not.toBe(two);
    }
  });
});

describe('ambience mapping', () => {
  it('plays the menu theme in the menus and the case music in a case', () => {
    expect(musicForAmbience('menu')?.piece).toBe('menu');
    for (const kind of MOODS) {
      expect(musicForAmbience(kind)).toEqual({ piece: 'case', mood: kind });
    }
    expect(musicForAmbience('none')).toBeNull();
    expect(PIECES.menu).toBe(MENU_THEME);
    expect(PIECES.case).toBe(CASE_THEME);
  });

  it('gives the club brushes and leaves the other places without any noise at all', () => {
    const hasBrush = (mood: CaseMood) => bars(CASE_THEME, 2, SEED, mood).flat().some((n) => n.voice === 'brush');
    expect(hasBrush('club')).toBe(true);
    expect(hasBrush('rain')).toBe(false);
    expect(hasBrush('house')).toBe(false);
    expect(hasBrush('harbor')).toBe(false);
  });
});

describe('the transport (look-ahead scheduler)', () => {
  const TICK = 0.04;
  const LOOKAHEAD = 0.2;

  /** Run the scheduler the way the timer does, from `from` to `to` seconds. */
  function run(piece: Piece, tr: ReturnType<typeof startTransport>, from: number, to: number, out: ScheduledNote[]): void {
    for (let now = from; now < to; now += TICK) {
      out.push(...collectDue(tr, piece, now, now + LOOKAHEAD, (bar) => notesForBar(piece, bar, SEED)));
    }
  }

  it.each(pieces)('plays every note of $title exactly once, at its exact time, across the loop seam', (piece) => {
    const start = 0.12;
    const tr = startTransport(start, 0);
    const played: ScheduledNote[] = [];
    const totalBars = piece.bars * 2 + 3; // through the seam twice
    run(piece, tr, 0, start + totalBars * barSeconds(piece) - LOOKAHEAD - TICK, played);

    const expected: Array<{ voice: string; midi: number; time: number }> = [];
    for (let bar = 0; bar < totalBars; bar++) {
      for (const n of notesForBar(piece, bar, SEED)) {
        const time = start + bar * barSeconds(piece) + n.beat * beatSeconds(piece);
        expected.push({ voice: n.voice, midi: n.midi, time });
      }
    }
    // The run stops a little before the end of the last bar, so compare what should have been reached.
    const reached = expected.filter((e) => e.time < played[played.length - 1]!.time + 1e-9);
    expect(played.length).toBe(reached.length);
    played.forEach((p, i) => {
      expect(p.voice).toBe(reached[i]!.voice);
      expect(p.midi).toBe(reached[i]!.midi);
      // No drift: bar 60 is as exact as bar 0.
      expect(Math.abs(p.time - reached[i]!.time)).toBeLessThan(1e-9);
      expect(p.dur).toBeGreaterThan(0);
    });
  });

  it('never schedules a note in the past or beyond the look-ahead', () => {
    const piece = CASE_THEME;
    const tr = startTransport(0.12, 0);
    for (let now = 0; now < 30; now += TICK) {
      for (const n of collectDue(tr, piece, now, now + LOOKAHEAD, (bar) => notesForBar(piece, bar, SEED))) {
        expect(n.time).toBeGreaterThanOrEqual(now);
        expect(n.time).toBeLessThan(now + LOOKAHEAD);
      }
    }
  });

  it('does not pile up notes after the tab was away for a minute', () => {
    const piece = MENU_THEME;
    const tr = startTransport(0.12, 0);
    const before: ScheduledNote[] = [];
    run(piece, tr, 0, 10, before);
    const barBefore = tr.bar;

    // Nothing ran between t = 10 and t = 70 (a throttled or frozen tab without a suspended clock).
    const back = 70;
    const burst = collectDue(tr, piece, back, back + LOOKAHEAD, (bar) => notesForBar(piece, bar, SEED));
    // At most what fits in one look-ahead window, not a minute's worth of notes at once.
    expect(burst.length).toBeLessThan(12);
    for (const n of burst) expect(n.time).toBeGreaterThanOrEqual(back);
    // The music moved on by a bar or two; it did not replay the sixteen-odd bars that were missed.
    expect(tr.bar - barBefore).toBeLessThanOrEqual(2);

    // And it keeps playing normally afterwards.
    const after: ScheduledNote[] = [];
    run(piece, tr, back + TICK, back + 12, after);
    expect(after.length).toBeGreaterThan(20);
    for (let i = 1; i < after.length; i++) expect(after[i]!.time).toBeGreaterThanOrEqual(after[i - 1]!.time - 1e-9);
  });

  it('carries on from the next bar when a piece comes back', () => {
    const piece = CASE_THEME;
    const tr = startTransport(0.12, 0);
    run(piece, tr, 0, 20, []);
    const resumed = startTransport(100, tr.bar + 1);
    const first = collectDue(resumed, piece, 99.9, 100.1, (bar) => notesForBar(piece, bar, SEED));
    expect(resumed.bar).toBe(tr.bar + 1);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0]!.time).toBeCloseTo(100, 1);
  });
});

describe('leaving and coming back', () => {
  it('ends each piece on its own key note, with voices the piece really has', () => {
    for (const piece of [PIECES.menu, PIECES.case]) {
      const notes = endingFor(piece);
      expect(notes.length).toBeGreaterThan(2);
      const bass = notes.find((n) => n.voice === 'bass')!;
      expect(((bass.midi % 12) + 12) % 12).toBe(piece.tonic);
      for (const n of notes) {
        expect(MIX[piece.id][n.voice], `${piece.id} has a ${n.voice}`).toBeDefined();
        const [lo, hi] = RANGE_FOR_ENDING[n.voice];
        expect(n.midi).toBeGreaterThanOrEqual(lo);
        expect(n.midi).toBeLessThanOrEqual(hi);
        expect(n.dur).toBeGreaterThan(0);
        expect(n.beat).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('comes back at the top of the next phrase', () => {
    expect(nextPhraseBar(0)).toBe(PHRASE_BARS);
    expect(nextPhraseBar(PHRASE_BARS - 1)).toBe(PHRASE_BARS);
    expect(nextPhraseBar(PHRASE_BARS)).toBe(PHRASE_BARS * 2);
    expect(nextPhraseBar(13) % PHRASE_BARS).toBe(0);
  });
});
