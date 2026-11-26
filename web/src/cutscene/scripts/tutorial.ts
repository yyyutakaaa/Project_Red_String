// The prologue: your first night on the night desk, and the call to the Hotel Cardinal.
import type { Cutscene } from '../types.ts';

export const tutorialCutscene: Cutscene = {
  id: 'tutorial',
  pages: [
    {
      id: 'arrival',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ['street office', 'street door'],
      panels: [
        {
          id: 'street',
          drift: 'in',
          layers: [
            { art: 'street-sky', depth: 0.05 },
            { art: 'street-city', depth: 0.2 },
            { art: 'street-hotel', depth: 0.4, enter: 'fade', delay: 0.1 },
            { art: 'street-detective', depth: 0.7, enter: 'left', delay: 0.35 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            {
              kind: 'caption',
              x: 4,
              y: 4,
              w: 62,
              text: { en: 'Calder City, October 1948.', nl: 'Calder City, oktober 1948.', fr: 'Calder City, octobre 1948.', de: 'Calder City, Oktober 1948.' },
            },
            {
              kind: 'caption',
              x: 44,
              y: 76,
              w: 52,
              text: {
                en: 'Three days of rain, and your first night on the night desk was nearly over.',
                nl: 'Drie dagen regen, en je eerste nachtdienst zat er bijna op.',
                fr: 'Trois jours de pluie, et votre première nuit de garde touchait presque à sa fin.',
                de: 'Drei Tage Regen, und deine erste Nachtschicht war fast vorbei.',
              },
            },
          ],
        },
        {
          id: 'office',
          drift: 'left',
          layers: [
            { art: 'office-wall', depth: 0.05 },
            { art: 'office-captain', depth: 0.35, enter: 'up', delay: 0.1 },
            { art: 'office-desk', depth: 0.6 },
            { art: 'office-light', depth: 0.85, enter: 'fade', delay: 0.2 },
          ],
          beats: [
            {
              kind: 'caption',
              x: 3,
              y: 5,
              w: 50,
              text: { en: 'Central Station, 6:45 a.m.', nl: 'Central Station, 6.45 uur.', fr: 'Central Station, 6 h 45.', de: 'Central Station, 6:45 Uhr.' },
            },
            {
              kind: 'balloon',
              x: 3,
              y: 26,
              w: 44,
              tail: { x: 52, y: 45 },
              text: {
                en: "Hotel Cardinal, on Delancey. The owner's on his office floor.",
                nl: 'Hotel Cardinal, op Delancey. De eigenaar ligt op de vloer van zijn kantoor.',
                fr: 'Hôtel Cardinal, sur Delancey. Le patron est étendu par terre dans son bureau.',
                de: 'Hotel Cardinal, in der Delancey. Der Besitzer liegt auf dem Boden seines Büros.',
              },
            },
            {
              kind: 'balloon',
              x: 60,
              y: 6,
              w: 37,
              tail: { x: 58, y: 44 },
              text: {
                en: 'Your first case, Detective. Keep it simple.',
                nl: 'Je eerste zaak, rechercheur. Hou het simpel.',
                fr: 'Votre première affaire, inspecteur. Faites simple.',
                de: 'Dein erster Fall, Detective. Halt es einfach.',
              },
            },
          ],
        },
        {
          id: 'door',
          drift: 'right',
          layers: [
            { art: 'door-lobby', depth: 0.08 },
            { art: 'door-frame', depth: 0.25 },
            { art: 'door-doyle', depth: 0.45, enter: 'right', delay: 0.15 },
            { art: 'door-shoulder', depth: 0.9, enter: 'left', delay: 0.05 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            {
              kind: 'caption',
              x: 3,
              y: 5,
              w: 50,
              text: { en: 'Delancey Street, 7:05 a.m.', nl: 'Delancey Street, 7.05 uur.', fr: 'Delancey Street, 7 h 05.', de: 'Delancey Street, 7:05 Uhr.' },
            },
            {
              kind: 'balloon',
              x: 20,
              y: 24,
              w: 34,
              tail: { x: 62, y: 40 },
              text: { en: 'Sergeant Doyle. I walk this beat.', nl: 'Sergeant Doyle. Dit is mijn wijk.', fr: "Sergent Doyle. C'est mon secteur.", de: 'Sergeant Doyle. Das ist mein Revier.' },
            },
            {
              kind: 'balloon',
              x: 62,
              y: 58,
              w: 36,
              tail: { x: 66, y: 43 },
              text: {
                en: 'Walter meant to ring me this morning, about his safe. Too late now.',
                nl: 'Walter wou me vanochtend bellen, over zijn kluis. Te laat nu.',
                fr: "Walter devait m'appeler ce matin, pour son coffre. Trop tard, maintenant.",
                de: 'Walter wollte mich heute früh anrufen, wegen seines Safes. Jetzt ist es zu spät.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ['title'],
      panels: [
        {
          id: 'title',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'floor', depth: 0.1 },
            { art: 'floor-doorstop', depth: 0.45, enter: 'zoom', delay: 0.1 },
          ],
          beats: [
            {
              kind: 'caption',
              x: 27,
              y: 83,
              w: 46,
              text: {
                en: 'Somebody in that hotel was lying.',
                nl: 'Iemand in dat hotel loog.',
                fr: 'Quelqu’un dans cet hôtel mentait.',
                de: 'Jemand in diesem Hotel log.',
              },
            },
          ],
        },
      ],
    },
  ],
};
