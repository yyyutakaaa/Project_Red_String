import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { describeProp } from '../Props.tsx';
import { SCENE_H, SCENE_HORIZON, SCENE_W, placeProps, seatOf, type Rect } from '../scenePlacement.ts';

interface Hot { id: string; label: string; x: number; y: number; width: number; height: number }
interface CaseJson { id: string; rooms: Array<{ id: string; background: string; hotspots: Hot[] }> }

const dir = new URL('../../cases/', import.meta.url).pathname;
const cases: CaseJson[] = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(dir + f, 'utf8')) as CaseJson);
const OPEN_AIR = new Set(['terrace', 'garden', 'alley', 'dock']);

const rectOf = (h: Hot): Rect => ({ x: h.x * 10, y: h.y * 6, w: h.width * 10, h: h.height * 6 });
const rooms = cases.flatMap((c) =>
  c.rooms.map((r) => {
    const inputs = r.hotspots.map((h) => {
      const info = describeProp(h.label, rectOf(h));
      return { kind: info.kind, variant: info.variant, rect: rectOf(h) };
    });
    return { name: `${c.id}/${r.id}`, hotspots: r.hotspots, inputs, placed: placeProps(inputs, OPEN_AIR.has(r.background)), openAir: OPEN_AIR.has(r.background) };
  }),
);

describe('placeProps, over every room of every story case', () => {
  it('keeps everything inside the picture', () => {
    for (const room of rooms) {
      for (const p of room.placed) {
        expect(p.box.x, room.name).toBeGreaterThanOrEqual(0);
        expect(p.box.y, room.name).toBeGreaterThanOrEqual(0);
        expect(p.box.x + p.box.w, room.name).toBeLessThanOrEqual(SCENE_W + 0.5);
        expect(p.box.y + p.box.h, room.name).toBeLessThanOrEqual(SCENE_H + 0.5);
        expect(p.box.w).toBeGreaterThan(20);
        expect(p.box.h).toBeGreaterThan(20);
      }
    }
  });

  it('hangs wall things on the wall and stands furniture on the floor', () => {
    for (const room of rooms) {
      room.placed.forEach((p, i) => {
        const what = `${room.name}: ${room.hotspots[i]!.label}`;
        const bottom = p.box.y + p.box.h;
        if (p.seat === 'wall') expect(bottom, what).toBeLessThan(SCENE_HORIZON);
        if (p.seat === 'opening') expect(Math.abs(bottom - SCENE_HORIZON), what).toBeLessThanOrEqual(3);
        if (p.seat === 'floor') expect(bottom, what).toBeGreaterThan(SCENE_HORIZON);
        if (p.seat === 'flat') expect(p.box.y, what).toBeGreaterThanOrEqual(SCENE_HORIZON);
      });
    }
  });

  it('never leaves a small thing hanging in the air', () => {
    for (const room of rooms) {
      room.placed.forEach((p, i) => {
        if (p.seat !== 'small') return;
        const what = `${room.name}: ${room.hotspots[i]!.label}`;
        const bottom = p.box.y + p.box.h;
        const onFurniture = room.placed.some((f) => f.seat === 'floor' && bottom > f.box.y && bottom < f.box.y + f.box.h && p.box.x + p.box.w / 2 > f.box.x && p.box.x + p.box.w / 2 < f.box.x + f.box.w);
        const supported = p.shelf !== null || p.stand !== null || onFurniture || bottom > SCENE_HORIZON;
        expect(supported, what).toBe(true);
        // on the wall it has a shelf; a shelf exists only indoors
        if (bottom <= SCENE_HORIZON && !onFurniture) expect(p.shelf, what).not.toBeNull();
        if (p.shelf) expect(room.openAir, what).toBe(false);
      });
    }
  });

  it('caps small things: a ledger is not the size of a bed', () => {
    for (const room of rooms) {
      for (const p of room.placed) if (p.seat === 'small') expect(Math.max(p.box.w, p.box.h), room.name).toBeLessThanOrEqual(121);
    }
  });

  it('gives every hotspot somewhere to click', () => {
    for (const room of rooms) for (const p of room.placed) expect(p.hit.w * p.hit.h, room.name).toBeGreaterThan(1500);
  });
});

describe('seatOf', () => {
  const r: Rect = { x: 100, y: 100, w: 100, h: 100 };
  it('knows how things sit', () => {
    expect(seatOf('window', 'sash', r)).toBe('wall');
    expect(seatOf('window', 'roof', r)).toBe('ceiling');
    expect(seatOf('door', '', r)).toBe('opening');
    expect(seatOf('door', 'hatch', r)).toBe('wall');
    expect(seatOf('desk', '', r)).toBe('floor');
    expect(seatOf('clock', 'tall', r)).toBe('floor');
    expect(seatOf('clock', 'wall', r)).toBe('wall');
    expect(seatOf('glass', '', r)).toBe('small');
    expect(seatOf('rug', '', r)).toBe('flat');
  });

  it('puts a door on the floor line whatever the case file says', () => {
    const [door] = placeProps([{ kind: 'door', variant: '', rect: { x: 400, y: 380, w: 300, h: 200 } }], false);
    expect(door!.box.y + door!.box.h).toBeCloseTo(SCENE_HORIZON + 2, 0);
    expect(door!.box.w / door!.box.h).toBeLessThan(0.6);
  });

  it('stands a glass on the desk under it', () => {
    const placed = placeProps(
      [
        { kind: 'desk', variant: '', rect: { x: 300, y: 380, w: 300, h: 160 } },
        { kind: 'glass', variant: '', rect: { x: 420, y: 330, w: 60, h: 70 } },
      ],
      false,
    );
    const desk = placed[0]!.box;
    const glass = placed[1]!.box;
    expect(glass.y + glass.h).toBeGreaterThan(desk.y);
    expect(glass.y + glass.h).toBeLessThan(desk.y + desk.h * 0.5);
    expect(placed[1]!.shelf).toBeNull();
    expect(placed[1]!.stand).toBeNull();
  });
});
