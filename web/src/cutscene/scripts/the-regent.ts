// The comic strip that opens the-regent. Panel art: src/assets/art/cutscenes/the-regent/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const theRegentCutscene: Cutscene = {
  id: 'the-regent',
  pages: [
    {
      id: 'ball',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["clock watch", "clock phone"],
      panels: [
        {
          id: 'clock',
          drift: 'in',
          layers: [
            { art: 'clock', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 60, text: { en: "The Regent Hotel, New Year's Eve, 1949.", nl: "Het Regent Hotel, oudejaarsavond 1949.", fr: "L'hôtel Regent, la Saint-Sylvestre 1949.", de: "Das Regent Hotel, Silvester 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Ashgrove Shipping threw the party, and everyone came.", nl: "Ashgrove Shipping gaf het feest, en iedereen kwam.", fr: "Ashgrove Shipping donnait la fête, et tout le monde était venu.", de: "Ashgrove Shipping gab das Fest, und alle kamen." } },
          ],
        },
        {
          id: 'watch',
          drift: 'left',
          layers: [
            { art: 'watch', depth: 0.08 },
            { art: 'watch-man', depth: 0.6, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 3, y: 6, w: 42, tail: { x: 30, y: 40 }, text: { en: "Ten! Nine! Eight!", nl: "Tien! Negen! Acht!", fr: "Dix ! Neuf ! Huit !", de: "Zehn! Neun! Acht!" } },
          ],
        },
        {
          id: 'phone',
          drift: 'right',
          layers: [
            { art: 'phone', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "Upstairs, in suite 612, nobody answered.", nl: "Boven, in suite 612, nam niemand op.", fr: "En haut, dans la suite 612, personne ne répondait.", de: "Oben, in Suite 612, nahm niemand ab." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["toast"],
      panels: [
        {
          id: 'toast',
          drift: 'out',
          titleCard: true,
          titleTop: 62,
          layers: [
            { art: 'toast', depth: 0.08 },
            { art: 'toast-clara', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 4, y: 6, w: 36, tail: { x: 66, y: 16 }, text: { en: "To a better year, Detective.", nl: "Op een beter jaar, rechercheur.", fr: "À une meilleure année, inspecteur.", de: "Auf ein besseres Jahr, Detective." } },
          ],
        },
      ],
    },
  ],
};
