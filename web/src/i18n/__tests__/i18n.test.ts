import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { listStoryCases } from '../../engine/caseLoader.ts';
import { caseStrings, englishOf, localizeCase } from '../caseText.ts';
import { en } from '../en.ts';
import { t, tn, useLanguage } from '../index.ts';
import { LANGUAGES, pickLanguage } from '../languages.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const placeholders = (s: string) => [...s.matchAll(/\{[a-zA-Z0-9_]+\}/g)].map((m) => m[0]).sort();

afterEach(() => useLanguage.setState({ language: 'en', messages: {}, cases: {} }));

describe('t and tn', () => {
  it('fills placeholders and falls back to English', () => {
    expect(t('common.slot', { n: 2 })).toBe('Slot 2');
    useLanguage.setState({ language: 'nl', messages: { 'common.slot': 'Lade {n}' } });
    expect(t('common.slot', { n: 2 })).toBe('Lade 2');
    expect(t('menu.continue')).toBe(en['menu.continue']);
  });

  it('picks the plural form by the language rules', () => {
    expect(tn('room.left', 1)).toBe('One place left to search.');
    expect(tn('room.left', 3)).toBe('3 places left to search.');
    useLanguage.setState({ language: 'fr', messages: { 'room.left.one': '{count} endroit', 'room.left.other': '{count} endroits' } });
    // French counts 0 as singular.
    expect(tn('room.left', 0)).toBe('0 endroit');
    expect(tn('room.left', 2)).toBe('2 endroits');
  });

  it('chooses a shipped language from browser preferences', () => {
    expect(pickLanguage(['nl-BE', 'en'])).toBe('nl');
    expect(pickLanguage(['pt-BR', 'de'])).toBe('de');
    expect(pickLanguage(['ja'])).toBe('en');
  });
});

describe('case text', () => {
  const cases = listStoryCases();

  it('round-trips: laying the English strings over a case changes nothing', () => {
    for (const c of cases) expect(localizeCase(c, caseStrings(c))).toEqual(c);
  });

  it('translates only text and keeps the drawings English', () => {
    const c = cases[0]!;
    const room = c.rooms[0]!;
    const hotspot = room.hotspots[0]!;
    const evidence = c.evidence[0]!;
    const out = localizeCase(c, {
      title: 'Titel',
      [`rooms.${room.id}.name`]: 'Kamer',
      [`rooms.${room.id}.hotspots.${hotspot.id}.label`]: 'Ding',
      [`evidence.${evidence.id}.name`]: 'Bewijs',
    });
    expect(out.title).toBe('Titel');
    expect(out.id).toBe(c.id);
    expect(out.solution).toEqual(c.solution);
    expect(out.rooms[0]!.name).toBe('Kamer');
    expect(englishOf(out.rooms[0]!).name).toBe(room.name);
    expect(englishOf(out.rooms[0]!.hotspots[0]!).label).toBe(hotspot.label);
    expect(englishOf(out.evidence[0]!).name).toBe(evidence.name);
    expect(englishOf(out).setting).toBe(c.setting);
    // Suspect sheets the model reads stay untouched.
    expect(out.suspects.map((s) => s.lies)).toEqual(c.suspects.map((s) => s.lies));
  });
});

describe('shipped translations', () => {
  const localeDir = path.resolve(here, '../locales');
  const caseDir = path.resolve(here, '../../cases');
  const cases = listStoryCases();

  for (const { code } of LANGUAGES.filter((l) => l.code !== 'en')) {
    it(`${code}: interface strings match the English keys and placeholders`, () => {
      const file = path.join(localeDir, `${code}.json`);
      if (!existsSync(file)) return;
      const strings = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
      for (const [key, value] of Object.entries(strings)) {
        expect(en, `unknown key ${key}`).toHaveProperty(key);
        expect(placeholders(value), key).toEqual(placeholders(en[key as keyof typeof en]));
      }
    });

    it(`${code}: case strings match their cases`, () => {
      const dir = path.join(caseDir, 'i18n', code);
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        const c = cases.find((x) => `${x.id}.json` === name);
        expect(c, `no case for ${name}`).toBeTruthy();
        const source = caseStrings(c!);
        const strings = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as Record<string, string>;
        for (const [key, value] of Object.entries(strings)) {
          expect(source, `${name}: unknown key ${key}`).toHaveProperty(key);
          expect(value.trim().length, `${name}: empty ${key}`).toBeGreaterThan(0);
        }
      }
    });
  }
});
