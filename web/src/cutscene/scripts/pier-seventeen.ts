// The comic strip that opens pier-seventeen. Panel art: src/assets/art/cutscenes/pier-seventeen/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const pierSeventeenCutscene: Cutscene = {
  id: 'pier-seventeen',
  pages: [
    {
      id: 'fog',
      columns: '1fr 1fr',
      rows: '1.1fr 1fr',
      areas: ["pier pier", "clerk cape"],
      panels: [
        {
          id: 'pier',
          drift: 'right',
          layers: [
            { art: 'pier', depth: 0.08 },
            { art: 'pier-lamp', depth: 0.8, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 52, y: 4, w: 44, text: { en: "Pier Seventeen, April 1949.", nl: "Pier Seventeen, april 1949.", fr: "Pier Seventeen, avril 1949.", de: "Pier Seventeen, April 1949." } },
            { kind: 'caption', x: 2, y: 76, w: 40, text: { en: "A foghorn, somewhere out on the water.", nl: "Een misthoorn, ergens op het water.", fr: "Une corne de brume, quelque part sur l'eau.", de: "Ein Nebelhorn, irgendwo draußen auf dem Wasser." } },
          ],
        },
        {
          id: 'clerk',
          drift: 'in',
          layers: [
            { art: 'clerk', depth: 0.08 },
            { art: 'clerk-pike', depth: 0.4, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 4, w: 34, text: { en: "Harold Pike kept a carbon copy of everything.", nl: "Harold Pike hield van alles een doorslag bij.", fr: "Harold Pike gardait un double carbone de tout.", de: "Harold Pike behielt von allem einen Durchschlag." } },
          ],
        },
        {
          id: 'cape',
          drift: 'left',
          layers: [
            { art: 'cape', depth: 0.08 },
            { art: 'cape-woman', depth: 0.55, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 34, text: { en: "10:50 p.m.", nl: "22.50 uur.", fr: "22 h 50.", de: "22:50 Uhr." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["stairs"],
      panels: [
        {
          id: 'stairs',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'stairs', depth: 0.08 },
            { art: 'stairs-papers', depth: 0.4, enter: 'fade', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "By midnight, the clerk lay at the foot of the archive stairs.", nl: "Om middernacht lag de klerk onderaan de archieftrap.", fr: "À minuit, le commis gisait au pied de l'escalier des archives.", de: "Um Mitternacht lag der Buchhalter am Fuß der Archivtreppe." } },
          ],
        },
      ],
    },
  ],
};
