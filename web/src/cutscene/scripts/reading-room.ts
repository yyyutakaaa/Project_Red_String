// The comic strip that opens reading-room. Panel art: src/assets/art/cutscenes/reading-room/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const readingRoomCutscene: Cutscene = {
  id: 'reading-room',
  pages: [
    {
      id: 'snow',
      columns: '1fr 1fr',
      rows: '1.1fr 1fr',
      areas: ["square square", "psalter key"],
      panels: [
        {
          id: 'square',
          drift: 'right',
          layers: [
            { art: 'square', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 6, w: 40, text: { en: "Founders Square, February 1950.", nl: "Founders Square, februari 1950.", fr: "Founders Square, février 1950.", de: "Founders Square, Februar 1950." } },
            { kind: 'caption', x: 60, y: 74, w: 37, text: { en: "One line of footprints in the snow.", nl: "Eén spoor voetstappen in de sneeuw.", fr: "Une seule ligne de pas dans la neige.", de: "Eine einzige Spur im Schnee." } },
          ],
        },
        {
          id: 'psalter',
          drift: 'in',
          layers: [
            { art: 'psalter', depth: 0.08 },
            { art: 'psalter-agnes', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 60, text: { en: "Agnes Thorne knew every book in the annex.", nl: "Agnes Thorne kende elk boek in het annex.", fr: "Agnes Thorne connaissait chaque livre de l'annexe.", de: "Agnes Thorne kannte jedes Buch im Anbau." } },
          ],
        },
        {
          id: 'key',
          drift: 'left',
          layers: [
            { art: 'key', depth: 0.08 },
            { art: 'key-hand', depth: 0.6, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 52, text: { en: "Under the courtyard ran an old tunnel.", nl: "Onder de binnenplaats liep een oude tunnel.", fr: "Sous la cour courait un vieux tunnel.", de: "Unter dem Hof verlief ein alter Tunnel." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["annex"],
      panels: [
        {
          id: 'annex',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'annex', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "In the morning she was dead, and the only footprints were her own.", nl: "'s Morgens was ze dood, en de enige voetstappen waren de hare.", fr: "Au matin elle était morte, et les seules traces de pas étaient les siennes.", de: "Am Morgen war sie tot, und die einzigen Spuren waren ihre eigenen." } },
          ],
        },
      ],
    },
  ],
};
