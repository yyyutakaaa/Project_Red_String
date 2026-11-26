// The comic strip that opens mercers-pharmacy. Panel art: src/assets/art/cutscenes/mercers-pharmacy/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const mercersPharmacyCutscene: Cutscene = {
  id: 'mercers-pharmacy',
  pages: [
    {
      id: 'shop',
      columns: '1fr 1.25fr',
      rows: '1fr 1fr',
      areas: ["tonic files", "stairs files"],
      panels: [
        {
          id: 'tonic',
          drift: 'in',
          layers: [
            { art: 'tonic', depth: 0.08 },
            { art: 'tonic-spoon', depth: 0.6, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 2, w: 34, text: { en: "Mercer's Pharmacy, Calloway Street. April 1950.", nl: "Mercer's Pharmacy, Calloway Street. April 1950.", fr: "La pharmacie Mercer, Calloway Street. Avril 1950.", de: "Mercers Apotheke, Calloway Street. April 1950." } },
            { kind: 'caption', x: 40, y: 76, w: 56, text: { en: "Every night at nine, Edgar Mercer took one spoonful of his tonic.", nl: "Elke avond om negen uur nam Edgar Mercer één lepel van zijn tonicum.", fr: "Chaque soir à neuf heures, Edgar Mercer prenait une cuillerée de son tonique.", de: "Jeden Abend um neun nahm Edgar Mercer einen Löffel seines Tonikums." } },
          ],
        },
        {
          id: 'stairs',
          drift: 'left',
          layers: [
            { art: 'stairs', depth: 0.08 },
            { art: 'stairs-doctor', depth: 0.5, enter: 'down', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "Dr. Pell's surgery was on the floor above.", nl: "De praktijk van dokter Pell zat een verdieping hoger.", fr: "Le cabinet du docteur Pell était à l'étage.", de: "Dr. Pells Praxis lag im Stock darüber." } },
          ],
        },
        {
          id: 'files',
          drift: 'right',
          layers: [
            { art: 'files', depth: 0.08 },
            { art: 'files-stack', depth: 0.6, enter: 'zoom', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "At Central Station, his complaint from last year was already a closed file.", nl: "Op Central Station was zijn aangifte van vorig jaar al een gesloten dossier.", fr: "À Central Station, sa plainte de l'an dernier était déjà un dossier classé.", de: "Auf der Central Station war seine Anzeige vom letzten Jahr längst eine geschlossene Akte." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["front"],
      panels: [
        {
          id: 'front',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'front', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "At five past nine the tonic killed him.", nl: "Om vijf over negen doodde het tonicum hem.", fr: "À neuf heures cinq, le tonique le tua.", de: "Um fünf nach neun tötete ihn das Tonikum." } },
          ],
        },
      ],
    },
  ],
};
