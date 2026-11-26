// The prologue: your first night on the night desk, and the call to the Hotel Cardinal.
import type { Cutscene } from '../types.ts';

export const tutorialCutscene: Cutscene = {
  id: 'tutorial',
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
          x: 3,
          y: 4,
          w: 30,
          text: { en: 'Calder City, October 1948.', nl: 'Calder City, oktober 1948.', fr: 'Calder City, octobre 1948.', de: 'Calder City, Oktober 1948.' },
        },
        {
          kind: 'caption',
          x: 58,
          y: 76,
          w: 39,
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
      id: 'station',
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
          y: 4,
          w: 33,
          text: { en: 'Central Station, 6:45 a.m.', nl: 'Central Station, 6.45 uur.', fr: 'Central Station, 6 h 45.', de: 'Central Station, 6:45 Uhr.' },
        },
        {
          kind: 'balloon',
          x: 6,
          y: 19,
          w: 34,
          tail: { x: 54, y: 44 },
          text: {
            en: "Hotel Cardinal, on Delancey. The owner's on his office floor.",
            nl: 'Hotel Cardinal, op Delancey. De eigenaar ligt op de vloer van zijn kantoor.',
            fr: 'Hôtel Cardinal, sur Delancey. Le patron est étendu par terre dans son bureau.',
            de: 'Hotel Cardinal, in der Delancey. Der Besitzer liegt auf dem Boden seines Büros.',
          },
        },
        {
          kind: 'balloon',
          x: 70,
          y: 8,
          w: 27,
          tail: { x: 59, y: 43 },
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
          x: 66,
          y: 4,
          w: 31,
          text: { en: 'Delancey Street, 7:05 a.m.', nl: 'Delancey Street, 7.05 uur.', fr: 'Delancey Street, 7 h 05.', de: 'Delancey Street, 7:05 Uhr.' },
        },
        {
          kind: 'balloon',
          x: 26,
          y: 8,
          w: 27,
          tail: { x: 61, y: 39 },
          text: { en: 'Sergeant Doyle. I walk this beat.', nl: 'Sergeant Doyle. Dit is mijn wijk.', fr: "Sergent Doyle. C'est mon secteur.", de: 'Sergeant Doyle. Das ist mein Revier.' },
        },
        {
          kind: 'balloon',
          x: 68,
          y: 50,
          w: 29,
          tail: { x: 65, y: 40 },
          text: {
            en: 'Walter meant to ring me this morning, about his safe. Too late now.',
            nl: 'Walter wou me vanochtend bellen, over zijn kluis. Te laat nu.',
            fr: "Walter devait m'appeler ce matin, pour son coffre. Trop tard, maintenant.",
            de: 'Walter wollte mich heute früh anrufen, wegen seines Safes. Jetzt ist es zu spät.',
          },
        },
      ],
    },
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
          x: 31,
          y: 85,
          w: 38,
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
};
