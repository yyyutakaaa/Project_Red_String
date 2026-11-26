// The comic strip that opens ashgrove-house. Panel art: src/assets/art/cutscenes/ashgrove-house/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const ashgroveHouseCutscene: Cutscene = {
  id: 'ashgrove-house',
  pages: [
    {
      id: 'storm',
      columns: '1.3fr 1fr',
      rows: '1fr',
      areas: ["road booth"],
      panels: [
        {
          id: 'road',
          drift: 'in',
          layers: [
            { art: 'road', depth: 0.08 },
            { art: 'road-car', depth: 0.6, enter: 'right', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The coast road north of Calder City, October 1948.", nl: "De kustweg ten noorden van Calder City, oktober 1948.", fr: "La route côtière au nord de Calder City, octobre 1948.", de: "Die Küstenstraße nördlich von Calder City, Oktober 1948." } },
            { kind: 'caption', x: 40, y: 78, w: 56, text: { en: "The storm had cut the telephone line to Ashgrove House.", nl: "De storm had de telefoonlijn naar Ashgrove House doorgesneden.", fr: "La tempête avait coupé la ligne téléphonique d'Ashgrove House.", de: "Der Sturm hatte die Telefonleitung nach Ashgrove House gekappt." } },
          ],
        },
        {
          id: 'booth',
          drift: 'left',
          layers: [
            { art: 'booth', depth: 0.08 },
            { art: 'booth-vance', depth: 0.45, enter: 'fade', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 50, text: { en: "11:40 p.m.", nl: "23.40 uur.", fr: "23 h 40.", de: "23:40 Uhr." } },
            { kind: 'balloon', x: 4, y: 62, w: 44, tail: { x: 66, y: 30 }, text: { en: "They are all still in the house, Detective. Edmund Ashgrove is dead.", nl: "Ze zijn allemaal nog in het huis, rechercheur. Edmund Ashgrove is dood.", fr: "Ils sont tous encore dans la maison, inspecteur. Edmund Ashgrove est mort.", de: "Sie sind alle noch im Haus, Detective. Edmund Ashgrove ist tot." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["cake"],
      panels: [
        {
          id: 'cake',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'cake', depth: 0.08 },
            { art: 'cake-cake', depth: 0.45, enter: 'zoom', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 24, y: 83, w: 52, text: { en: "Edmund Ashgrove turned sixty-five that night.", nl: "Edmund Ashgrove werd die avond vijfenzestig.", fr: "Edmund Ashgrove avait eu soixante-cinq ans ce soir-là.", de: "Edmund Ashgrove wurde an diesem Abend fünfundsechzig." } },
          ],
        },
      ],
    },
  ],
};
