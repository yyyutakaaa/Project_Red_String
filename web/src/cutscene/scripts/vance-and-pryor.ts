// The comic strip that opens vance-and-pryor. Panel art: src/assets/art/cutscenes/vance-and-pryor/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const vanceAndPryorCutscene: Cutscene = {
  id: 'vance-and-pryor',
  pages: [
    {
      id: 'sunday',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["tower captain", "tower door"],
      panels: [
        {
          id: 'tower',
          drift: 'in',
          layers: [
            { art: 'tower', depth: 0.08 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "The Harbor Exchange Building, a Sunday evening in June 1950.", nl: "Het Harbor Exchange-gebouw, een zondagavond in juni 1950.", fr: "Le Harbor Exchange Building, un dimanche soir de juin 1950.", de: "Das Harbor Exchange Building, ein Sonntagabend im Juni 1950." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "One light on, on the sixth floor.", nl: "Eén licht aan, op de zesde verdieping.", fr: "Une seule lumière, au sixième étage.", de: "Ein einziges Licht, im sechsten Stock." } },
          ],
        },
        {
          id: 'captain',
          drift: 'left',
          layers: [
            { art: 'captain', depth: 0.08 },
            { art: 'captain-captain', depth: 0.4, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 56, y: 6, w: 40, tail: { x: 52, y: 34 }, text: { en: "Suicide. Sign it and go home.", nl: "Zelfmoord. Teken het en ga naar huis.", fr: "Suicide. Signez et rentrez chez vous.", de: "Selbstmord. Unterschreib und geh nach Hause." } },
          ],
        },
        {
          id: 'door',
          drift: 'right',
          layers: [
            { art: 'door', depth: 0.08 },
            { art: 'door-clara', depth: 0.5, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 4, y: 8, w: 42, tail: { x: 58, y: 34 }, text: { en: "This came this morning. From Martin.", nl: "Dit kwam vanochtend. Van Martin.", fr: "Ceci est arrivé ce matin. De Martin.", de: "Das kam heute Morgen. Von Martin." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["street"],
      panels: [
        {
          id: 'street',
          drift: 'out',
          titleCard: true,
          titleTop: 44,
          layers: [
            { art: 'street', depth: 0.08 },
            { art: 'street-vance', depth: 0.5, enter: 'right', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "Martin Pryor had been dead since Sunday evening.", nl: "Martin Pryor was al dood sinds zondagavond.", fr: "Martin Pryor était mort depuis dimanche soir.", de: "Martin Pryor war seit Sonntagabend tot." } },
          ],
        },
      ],
    },
  ],
};
