// The comic strip that opens hollis-garden. Panel art: src/assets/art/cutscenes/hollis-garden/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const hollisGardenCutscene: Cutscene = {
  id: 'hollis-garden',
  pages: [
    {
      id: 'party',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["waltz band", "waltz urn"],
      panels: [
        {
          id: 'waltz',
          drift: 'in',
          layers: [
            { art: 'waltz', depth: 0.08 },
            { art: 'waltz-couple', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "The Heights, August 1949.", nl: "The Heights, augustus 1949.", fr: "The Heights, août 1949.", de: "The Heights, August 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Judge Hollis's summer party, and the waltzes were printed on the dance cards.", nl: "Het zomerfeest van rechter Hollis, en de walsen stonden op de danskaartjes.", fr: "La fête d'été du juge Hollis, et les valses étaient imprimées sur les carnets de bal.", de: "Das Sommerfest von Richter Hollis, und die Walzer standen auf den Tanzkarten." } },
          ],
        },
        {
          id: 'band',
          drift: 'left',
          layers: [
            { art: 'band', depth: 0.08 },
            { art: 'band-leader', depth: 0.5, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "9:40 p.m. A string snapped.", nl: "21.40 uur. Een snaar knapte.", fr: "21 h 40. Une corde cassa.", de: "21:40 Uhr. Eine Saite riss." } },
            { kind: 'balloon', x: 54, y: 62, w: 42, tail: { x: 48, y: 40 }, text: { en: "Swap the next two!", nl: "Wissel de volgende twee om!", fr: "On inverse les deux suivants !", de: "Die nächsten zwei tauschen!" } },
          ],
        },
        {
          id: 'urn',
          drift: 'right',
          layers: [
            { art: 'urn', depth: 0.08 },
            { art: 'urn-glove', depth: 0.6, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "By the lily pond.", nl: "Bij de lelievijver.", fr: "Près du bassin aux nénuphars.", de: "Am Seerosenteich." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["paper"],
      panels: [
        {
          id: 'paper',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'paper', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "Judge Hollis was found face down in his own lily pond.", nl: "Rechter Hollis werd voorover in zijn eigen lelievijver gevonden.", fr: "Le juge Hollis fut retrouvé face contre l’eau dans son propre bassin.", de: "Richter Hollis wurde mit dem Gesicht nach unten in seinem eigenen Seerosenteich gefunden." } },
          ],
        },
      ],
    },
  ],
};
