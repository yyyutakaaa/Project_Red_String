// Which case has which cutscene, and its drawings. Only the prologue has drawn placeholders; the
// other cases use painted art files only (src/assets/art/cutscenes/<case>/).
import type { ComponentType } from 'react';
import { create } from 'zustand';
import type { LanguageCode } from '../i18n/languages.ts';
import type { Cutscene, Text } from './types.ts';
import { tutorialCutscene } from './scripts/tutorial.ts';
import { tutorialArt } from './art/tutorial.tsx';
import { ashgroveHouseCutscene } from './scripts/ashgrove-house.ts';
import { blueLanternCutscene } from './scripts/blue-lantern.ts';
import { pierSeventeenCutscene } from './scripts/pier-seventeen.ts';
import { nightExpressCutscene } from './scripts/night-express.ts';
import { hollisGardenCutscene } from './scripts/hollis-garden.ts';
import { studioNineCutscene } from './scripts/studio-nine.ts';
import { theRegentCutscene } from './scripts/the-regent.ts';
import { readingRoomCutscene } from './scripts/reading-room.ts';
import { mercersPharmacyCutscene } from './scripts/mercers-pharmacy.ts';
import { vanceAndPryorCutscene } from './scripts/vance-and-pryor.ts';

interface Entry {
  cutscene: Cutscene;
  art: Record<string, ComponentType>;
}

const CUTSCENES: Record<string, Entry> = {
  tutorial: { cutscene: tutorialCutscene, art: tutorialArt },
  'ashgrove-house': { cutscene: ashgroveHouseCutscene, art: {} },
  'blue-lantern': { cutscene: blueLanternCutscene, art: {} },
  'pier-seventeen': { cutscene: pierSeventeenCutscene, art: {} },
  'night-express': { cutscene: nightExpressCutscene, art: {} },
  'hollis-garden': { cutscene: hollisGardenCutscene, art: {} },
  'studio-nine': { cutscene: studioNineCutscene, art: {} },
  'the-regent': { cutscene: theRegentCutscene, art: {} },
  'reading-room': { cutscene: readingRoomCutscene, art: {} },
  'mercers-pharmacy': { cutscene: mercersPharmacyCutscene, art: {} },
  'vance-and-pryor': { cutscene: vanceAndPryorCutscene, art: {} },
};

export function cutsceneFor(caseId: string): Entry | null {
  return CUTSCENES[caseId] ?? null;
}

export function textIn(text: Text, language: LanguageCode): string {
  return text[language] ?? text.en;
}

/** True while a cutscene covers the screen, so the tutorial's guide waits until it is over. */
export const useCutscenePlaying = create<{ playing: boolean }>(() => ({ playing: false }));
