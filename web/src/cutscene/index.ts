// Which case has which cutscene, and its drawings.
import type { ComponentType } from 'react';
import { create } from 'zustand';
import type { LanguageCode } from '../i18n/languages.ts';
import type { Cutscene, Text } from './types.ts';
import { tutorialCutscene } from './scripts/tutorial.ts';
import { tutorialArt } from './art/tutorial.tsx';

interface Entry {
  cutscene: Cutscene;
  art: Record<string, ComponentType>;
}

const CUTSCENES: Record<string, Entry> = {
  tutorial: { cutscene: tutorialCutscene, art: tutorialArt },
};

export function cutsceneFor(caseId: string): Entry | null {
  return CUTSCENES[caseId] ?? null;
}

export function textIn(text: Text, language: LanguageCode): string {
  return text[language] ?? text.en;
}

/** True while a cutscene covers the screen, so the tutorial's guide waits until it is over. */
export const useCutscenePlaying = create<{ playing: boolean }>(() => ({ playing: false }));
