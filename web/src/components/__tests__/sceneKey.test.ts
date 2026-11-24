import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { sceneKeyFor } from '../sceneKey.ts';
import { describeProp } from '../Props.tsx';

interface Room { id: string; name: string; background: string; description: string; hotspots: Array<{ label: string }> }
interface CaseJson { id: string; setting: string; rooms: Room[]; evidence: Array<{ name: string }> }

const dir = new URL('../../cases/', import.meta.url).pathname;
const cases: CaseJson[] = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(dir + f, 'utf8')) as CaseJson);
const room = (caseId: string, roomId: string) => {
  const c = cases.find((x) => x.id === caseId)!;
  const r = c.rooms.find((x) => x.id === roomId)!;
  return sceneKeyFor(r.background, { name: r.name, description: r.description, setting: c.setting });
};

describe('sceneKeyFor', () => {
  it('keeps the case file key when nothing more specific fits', () => {
    expect(sceneKeyFor('study')).toBe('study');
    expect(room('ashgrove-house', 'study')).toBe('study');
    expect(room('blue-lantern', 'office')).toBe('office');
  });

  it('draws the rooms of the train as a train', () => {
    expect(room('night-express', 'corridor')).toBe('train-corridor');
    expect(room('night-express', 'dining-car')).toBe('dining-car');
    expect(room('night-express', 'lounge-car')).toBe('lounge-car');
    expect(room('night-express', 'compartment-c')).toBe('train-car');
  });

  it('draws the pharmacy as a pharmacy', () => {
    expect(room('mercers-pharmacy', 'shop')).toBe('pharmacy');
    expect(room('mercers-pharmacy', 'dispensary')).toBe('dispensary');
    expect(room('mercers-pharmacy', 'surgery')).toBe('surgery');
  });

  it('knows the other special rooms', () => {
    expect(room('pier-seventeen', 'gatehouse')).toBe('gatehouse');
    expect(room('reading-room', 'courtyard')).toBe('courtyard-snow');
    expect(room('reading-room', 'rare-book-room')).toBe('rare-books');
    expect(room('reading-room', 'tunnel')).toBe('boiler-room');
    expect(room('studio-nine', 'studio-nine')).toBe('radio-studio');
    expect(room('the-regent', 'ballroom')).toBe('ballroom');
    expect(room('the-regent', 'laundry')).toBe('laundry');
    expect(room('vance-and-pryor', 'records-room')).toBe('records-room');
  });

  it('does not mistake an ordinary hallway or shop for a special one', () => {
    expect(sceneKeyFor('hallway', { name: 'Front hallway', setting: 'A country house' })).toBe('hallway');
    expect(sceneKeyFor('lobby', { name: 'The shop', setting: 'A bookshop on Mill Street' })).toBe('lobby');
  });
});

describe('prop drawings', () => {
  it('gives every hotspot in every story case a real drawing, not the nameless box', () => {
    const nameless = cases.flatMap((c) => c.rooms.flatMap((r) => r.hotspots.map((h) => h.label))).filter((label) => describeProp(label, { x: 0, y: 0, w: 100, h: 100 }).kind === 'item');
    expect(nameless).toEqual([]);
  });

  it('knows the objects stories turn on', () => {
    const kind = (label: string) => describeProp(label, { x: 0, y: 0, w: 100, h: 100 });
    expect(kind('Pearl drop earring')).toMatchObject({ kind: 'jewel', variant: 'earring' });
    expect(kind('Gold cufflink')).toMatchObject({ kind: 'jewel', variant: 'cufflink' });
    expect(kind('Wet stage shoes').kind).toBe('shoes');
    expect(kind('Muddy evening glove').kind).toBe('glove');
    expect(kind('Gloves').kind).toBe('glove');
    expect(kind('Croquet mallet').kind).toBe('mallet');
    expect(kind('Watchman\'s clock dial')).toMatchObject({ kind: 'clock', variant: 'dial' });
    expect(kind('Insurance policy')).toMatchObject({ kind: 'letter', variant: 'policy' });
    expect(kind('Rialto ticket stubs')).toMatchObject({ kind: 'letter', variant: 'ticket' });
    expect(kind('Key board').kind).toBe('keyrack');
    expect(kind('Soda fountain').kind).toBe('fountain');
    expect(kind('Lily pond').kind).toBe('pond');
    expect(kind('Champagne trays')).toMatchObject({ kind: 'tray', variant: 'glasses' });
    expect(kind('Brandy glass').kind).toBe('glass');
    expect(kind('Medicine cabinet')).toMatchObject({ kind: 'cabinet', variant: 'glazed' });
  });
});
