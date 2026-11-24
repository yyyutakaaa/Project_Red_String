// Ordinary things a room would have anyway, drawn exactly like the places worth searching, so the
// drawing does not give away where the clues are. They are never named to the player and never hold
// anything: clicking one is a miss like clicking a bare wall.
//
// The labels are English drawing names (see propKindFor in Props.tsx), not text anyone reads.
import type { Hotspot } from '@shared/caseSchema.ts';
import { hashString, propKindFor, seededRandom, type PropKind } from './Props.tsx';

export const DECOY_PREFIX = 'decoy-';

const DECOYS: Record<string, string[]> = {
  'dining-room': ['Side table', 'Vase', 'Candle', 'Chair', 'Clock', 'Potted plant', 'Painting'],
  study: ['Floor lamp', 'Ashtray', 'Books', 'Clock', 'Chair', 'Potted plant', 'Radio'],
  conservatory: ['Potted plant', 'Watering can', 'Bench', 'Vase', 'Statue', 'Lantern'],
  kitchen: ['Kettle', 'Bottles', 'Crate', 'Bin', 'Stool', 'Clock'],
  bedroom: ['Wardrobe', 'Chair', 'Table lamp', 'Mirror', 'Vase', 'Suitcase', 'Clock'],
  bathroom: ['Towel', 'Bin', 'Mirror', 'Bottles', 'Stool'],
  library: ['Armchair', 'Floor lamp', 'Books', 'Ladder', 'Clock', 'Statue'],
  hallway: ['Coat stand', 'Umbrella', 'Painting', 'Side table', 'Vase', 'Clock', 'Bench'],
  terrace: ['Bench', 'Potted plant', 'Statue', 'Lantern', 'Chair'],
  garden: ['Bench', 'Statue', 'Watering can', 'Shovel', 'Lantern', 'Potted plant'],
  stage: ['Music stand', 'Chair', 'Spotlight', 'Crate', 'Drum', 'Microphone'],
  bar: ['Stool', 'Bottles', 'Glasses', 'Ashtray', 'Radio', 'Clock', 'Poster'],
  office: ['Filing cabinet', 'Chair', 'Floor lamp', 'Calendar', 'Ashtray', 'Wastebasket', 'Clock'],
  'dressing-room': ['Mirror', 'Hat', 'Vase', 'Suitcase', 'Chair', 'Poster', 'Coat stand'],
  alley: ['Crate', 'Barrel', 'Bin', 'Sack', 'Oil drum', 'Bicycle'],
  lobby: ['Armchair', 'Potted plant', 'Floor lamp', 'Newspaper', 'Side table', 'Clock', 'Suitcase'],
  'hotel-room': ['Suitcase', 'Table lamp', 'Chair', 'Radio', 'Mirror', 'Bin'],
  warehouse: ['Crate', 'Barrel', 'Sack', 'Cart', 'Ladder', 'Oil drum'],
  dock: ['Crate', 'Barrel', 'Coil of rope', 'Sack', 'Lantern', 'Oil drum'],
  archive: ['Filing cabinet', 'Books', 'Ladder', 'Crate', 'Table lamp', 'Chair'],
  cellar: ['Barrel', 'Crate', 'Wine rack', 'Sack', 'Lantern', 'Bottles'],
  'train-corridor': ['Suitcase', 'Hat', 'Newspaper', 'Bin'],
  'dining-car': ['Glasses', 'Vase', 'Menu', 'Teapot', 'Bottles', 'Chair'],
  'lounge-car': ['Armchair', 'Ashtray', 'Newspaper', 'Table lamp', 'Glasses', 'Radio'],
  pharmacy: ['Scales', 'Bottles', 'Cabinet', 'Stool', 'Clock', 'Calendar'],
  dispensary: ['Bottles', 'Scales', 'Basin', 'Cabinet', 'Stool', 'Towel'],
  surgery: ['Basin', 'Bottles', 'Cabinet', 'Stool', 'Towel', 'Clock'],
  gatehouse: ['Stool', 'Lantern', 'Calendar', 'Radio', 'Bin'],
  courtyard: ['Bench', 'Barrel', 'Bicycle', 'Lantern', 'Potted plant', 'Crate'],
  'courtyard-snow': ['Bench', 'Barrel', 'Bicycle', 'Lantern', 'Crate'],
};
const DEFAULT_DECOYS = ['Chair', 'Crate', 'Clock', 'Potted plant', 'Bottles'];

/** Hung on the wall. */
const ON_WALL = new Set<PropKind>(['painting', 'clock', 'mirror']);
/** Small enough to stand on something. */
const SMALL = new Set<PropKind>(['ashtray', 'vase', 'candle', 'glass', 'bottle', 'letter', 'book', 'phone', 'radio', 'decanter', 'hat', 'scale', 'cloth', 'tool']);

/** Where along the room the decoys go, in percent: spread out, furthest from the real places first. */
const SLOTS = [10, 28, 50, 72, 90];

/**
 * Three or four decoys for a room, never of a kind the room already has a place to search of
 * (one fireplace is enough). The same room always gets the same ones.
 */
export function decoysFor(sceneKey: string, hotspots: readonly Hotspot[]): Hotspot[] {
  const taken = new Set(hotspots.map((h) => propKindFor(h.label)));
  const pool = (DECOYS[sceneKey] ?? DEFAULT_DECOYS).filter((label, i, all) => {
    const kind = propKindFor(label);
    return !taken.has(kind) && all.findIndex((l) => propKindFor(l) === kind) === i;
  });
  const rand = seededRandom(hashString(`decoys/${sceneKey}/${hotspots.map((h) => h.id).join(',')}`));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const count = Math.min(pool.length, 4, Math.max(3, 8 - hotspots.length));
  const centres = hotspots.map((h) => h.x + h.width / 2);
  const away = (x: number) => Math.min(...centres.map((c) => Math.abs(c - x)), 100);
  const slots = [...SLOTS].sort((a, b) => away(b) - away(a));
  return pool.slice(0, count).map((label, i) => {
    const kind = propKindFor(label);
    const size = SMALL.has(kind) ? { w: 7, h: 9, y: 50 } : ON_WALL.has(kind) ? { w: 10, h: 15, y: 16 } : { w: 13, h: 26, y: 38 };
    const centre = slots[i % slots.length]!;
    return {
      id: `${DECOY_PREFIX}${i}`,
      label,
      x: Math.max(0, Math.min(100 - size.w, centre - size.w / 2)),
      y: size.y,
      width: size.w,
      height: size.h,
      description: label,
      evidence_id: null,
    };
  });
}
