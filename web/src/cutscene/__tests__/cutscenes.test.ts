import { describe, expect, it } from 'vitest';
import { AVAILABLE_LANGUAGES } from '../../i18n/index.ts';
import { getStoryCase, TUTORIAL_ID } from '../../engine/caseLoader.ts';
import { cutsceneArt } from '../../assets/registry.ts';
import { cutsceneFor } from '../index.ts';

const CASE_IDS = [TUTORIAL_ID, 'ashgrove-house', 'blue-lantern', 'pier-seventeen', 'night-express', 'hollis-garden', 'studio-nine', 'the-regent', 'reading-room', 'mercers-pharmacy', 'vance-and-pryor'];

describe.each(CASE_IDS)('the cutscene of %s', (caseId) => {
  const entry = cutsceneFor(caseId);

  it('exists and belongs to a case', () => {
    expect(entry).not.toBeNull();
    expect(entry!.cutscene.id).toBe(caseId);
    expect(getStoryCase(entry!.cutscene.id)).not.toBeNull();
  });

  it('every panel has its place in its page', () => {
    for (const page of entry!.cutscene.pages) {
      const names = new Set(page.areas.join(' ').split(/\s+/));
      expect([...names].sort(), page.id).toEqual(page.panels.map((p) => p.id).sort());
    }
  });

  it('every layer has a drawing or a painted file', () => {
    for (const panel of entry!.cutscene.pages.flatMap((p) => p.panels)) {
      for (const layer of panel.layers) {
        if (layer.art === 'rain') continue;
        const found = entry!.art[layer.art] ?? cutsceneArt(caseId, layer.art);
        expect(found, `${panel.id}/${layer.art}`).toBeTruthy();
      }
    }
  });

  it('every caption and balloon is written in every language and sits inside the panel', () => {
    for (const panel of entry!.cutscene.pages.flatMap((p) => p.panels)) {
      for (const beat of panel.beats) {
        for (const l of AVAILABLE_LANGUAGES) expect(beat.text[l.code], `${panel.id}: ${beat.text.en} (${l.code})`).toBeTruthy();
        expect(beat.x).toBeGreaterThanOrEqual(0);
        expect(beat.x + beat.w).toBeLessThanOrEqual(100);
        expect(beat.y).toBeGreaterThanOrEqual(0);
        expect(beat.y).toBeLessThan(95);
      }
    }
  });
});
