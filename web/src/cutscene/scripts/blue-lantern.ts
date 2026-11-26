// The comic strip that opens blue-lantern. Panel art: src/assets/art/cutscenes/blue-lantern/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const blueLanternCutscene: Cutscene = {
  id: 'blue-lantern',
  pages: [
    {
      id: 'club',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["sax drums", "sax booth"],
      panels: [
        {
          id: 'sax',
          drift: 'in',
          layers: [
            { art: 'sax', depth: 0.08 },
            { art: 'sax-player', depth: 0.55, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 52, y: 4, w: 44, text: { en: "The Blue Lantern, Riverside, February 1949.", nl: "The Blue Lantern, Riverside, februari 1949.", fr: "Le Blue Lantern, Riverside, février 1949.", de: "The Blue Lantern, Riverside, Februar 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Victor Kale ran the best club on the river, and he never sat with his back to the door.", nl: "Victor Kale had de beste club aan de rivier, en hij zat nooit met zijn rug naar de deur.", fr: "Victor Kale tenait le meilleur club du fleuve, et ne tournait jamais le dos à la porte.", de: "Victor Kale führte den besten Club am Fluss und saß nie mit dem Rücken zur Tür." } },
          ],
        },
        {
          id: 'drums',
          drift: 'right',
          layers: [
            { art: 'drums', depth: 0.08 },
            { art: 'drums-drummer', depth: 0.5, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "11:20 p.m. The drum solo.", nl: "23.20 uur. De drumsolo.", fr: "23 h 20. Le solo de batterie.", de: "23:20 Uhr. Das Schlagzeugsolo." } },
            { kind: 'caption', x: 50, y: 78, w: 47, text: { en: "Behind the stage, a door closed.", nl: "Achter het podium ging een deur dicht.", fr: "Derrière la scène, une porte se referma.", de: "Hinter der Bühne fiel eine Tür zu." } },
          ],
        },
        {
          id: 'booth',
          drift: 'left',
          layers: [
            { art: 'booth', depth: 0.08 },
            { art: 'booth-men', depth: 0.45, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 34, text: { en: "Booth 9.", nl: "Booth 9.", fr: "Box 9.", de: "Nische 9." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["sign"],
      panels: [
        {
          id: 'sign',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'sign', depth: 0.08 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 24, y: 83, w: 52, text: { en: "Nobody heard a thing.", nl: "Niemand hoorde iets.", fr: "Personne n'avait rien entendu.", de: "Niemand hatte etwas gehört." } },
          ],
        },
      ],
    },
  ],
};
