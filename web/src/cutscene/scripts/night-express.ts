// The comic strip that opens night-express. Panel art: src/assets/art/cutscenes/night-express/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const nightExpressCutscene: Cutscene = {
  id: 'night-express',
  pages: [
    {
      id: 'train',
      columns: '1fr 1.25fr',
      rows: '1fr 1fr',
      areas: ["line knife", "brandt knife"],
      panels: [
        {
          id: 'line',
          drift: 'left',
          layers: [
            { art: 'line', depth: 0.08 },
            { art: 'line-train', depth: 0.5, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 60, text: { en: "The Calder Limited, June 1949.", nl: "The Calder Limited, juni 1949.", fr: "Le Calder Limited, juin 1949.", de: "Der Calder Limited, Juni 1949." } },
            { kind: 'caption', x: 40, y: 76, w: 56, text: { en: "The overnight sleeper to Harmon Junction.", nl: "De nachttrein naar Harmon Junction.", fr: "Le train de nuit pour Harmon Junction.", de: "Der Nachtzug nach Harmon Junction." } },
          ],
        },
        {
          id: 'brandt',
          drift: 'in',
          layers: [
            { art: 'brandt', depth: 0.08 },
            { art: 'brandt-brandt', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 58, y: 4, w: 39, text: { en: "Walter Brandt had a file for the Waterfront Commission.", nl: "Walter Brandt had een dossier voor de Waterfront Commission.", fr: "Walter Brandt avait un dossier pour la Waterfront Commission.", de: "Walter Brandt hatte eine Akte für die Waterfront Commission." } },
            { kind: 'balloon', x: 56, y: 54, w: 40, tail: { x: 40, y: 36 }, text: { en: "Item seven, Paul.", nl: "Punt zeven, Paul.", fr: "Point sept, Paul.", de: "Punkt sieben, Paul." } },
          ],
        },
        {
          id: 'knife',
          drift: 'right',
          layers: [
            { art: 'knife', depth: 0.08 },
            { art: 'knife-hand', depth: 0.6, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 60, text: { en: "In the dining car, nobody counted the knives.", nl: "In de restauratiewagen telde niemand de messen.", fr: "Au wagon-restaurant, personne ne comptait les couteaux.", de: "Im Speisewagen zählte niemand die Messer." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["stop"],
      panels: [
        {
          id: 'stop',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'stop', depth: 0.08 },
            { art: 'stop-crew', depth: 0.5, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "Twelve minutes at the water stop.", nl: "Twaalf minuten stilstand bij de watertoren.", fr: "Douze minutes d'arrêt au château d'eau.", de: "Zwölf Minuten Halt am Wasserturm." } },
          ],
        },
      ],
    },
  ],
};
