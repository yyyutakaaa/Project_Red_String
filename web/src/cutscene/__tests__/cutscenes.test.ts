import { describe, expect, it } from 'vitest';
import { AVAILABLE_LANGUAGES } from '../../i18n/index.ts';
import { getStoryCase, TUTORIAL_ID } from '../../engine/caseLoader.ts';
import { cutsceneFor } from '../index.ts';

describe('cutscenes', () => {
  const entry = cutsceneFor(TUTORIAL_ID);

  it('the prologue has one', () => {
    expect(entry).not.toBeNull();
    expect(getStoryCase(entry!.cutscene.id)).not.toBeNull();
  });

  it('every layer has a drawing', () => {
    for (const panel of entry!.cutscene.panels) {
      for (const layer of panel.layers) {
        if (layer.art === 'rain') continue;
        expect(entry!.art[layer.art], `${panel.id}/${layer.art}`).toBeTypeOf('function');
      }
    }
  });

  it('every caption and balloon is written in every language and sits inside the panel', () => {
    for (const panel of entry!.cutscene.panels) {
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
