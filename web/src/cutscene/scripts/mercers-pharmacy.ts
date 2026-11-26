// The comic strip that opens mercers-pharmacy. Panel art: src/assets/art/cutscenes/mercers-pharmacy/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const mercersPharmacyCutscene: Cutscene = {
  id: 'mercers-pharmacy',
  pages: [
    {
      id: 'before',
      columns: '1fr 1fr',
      rows: '1fr',
      areas: ["recap board"],
      panels: [
        {
          id: 'recap',
          drift: 'in',
          layers: [
            { art: 'recap', depth: 0.08 },
            { art: 'recap-people', depth: 0.5, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The library, February.", nl: "De bibliotheek, februari.", fr: "La bibliothèque, février.", de: "Die Bibliothek, Februar." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Graham Oakes had been swapping rare books for cheap copies and selling the real ones. When Agnes Thorne found out, he came to her through the old tunnel under the snow.", nl: "Graham Oakes ruilde zeldzame boeken in voor goedkope exemplaren en verkocht de echte. Toen Agnes Thorne het ontdekte, kwam hij naar haar toe door de oude tunnel onder de sneeuw.", fr: "Graham Oakes remplaçait les livres rares par des exemplaires bon marché et vendait les vrais. Quand Agnes Thorne l’a découvert, il l’a rejointe par le vieux tunnel sous la neige.", de: "Graham Oakes tauschte seltene Bücher gegen billige Exemplare und verkaufte die echten. Als Agnes Thorne es merkte, kam er durch den alten Tunnel unter dem Schnee zu ihr." } },
          ],
        },
        {
          id: 'board',
          drift: 'in',
          layers: [
            { art: 'shared/board-2', depth: 0.08 },
            { art: 'shared/board-2-detective', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Spring. Nine cards on your board now. Four of them had the same name on them.", nl: "Lente. Negen kaarten op je bord nu. Op vier ervan stond dezelfde naam.", fr: "Le printemps. Neuf fiches au tableau. Sur quatre d’entre elles, le même nom.", de: "Frühling. Neun Karten an deinem Brett. Auf vieren stand derselbe Name." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "Leonard Vance. Ashgrove House, the Blue Lantern, Pier Seventeen, the Regent. Never the killer. Always in the room.", nl: "Leonard Vance. Ashgrove House, de Blue Lantern, Pier Seventeen, the Regent. Nooit de dader. Altijd in de kamer.", fr: "Leonard Vance. Ashgrove House, le Blue Lantern, le Pier Seventeen, le Regent. Jamais le meurtrier. Toujours dans la pièce.", de: "Leonard Vance. Ashgrove House, das Blue Lantern, Pier Seventeen, das Regent. Nie der Täter. Immer im Raum." } },
          ],
        },
      ],
    },
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
            { kind: 'caption', x: 3, y: 76, w: 62, text: { en: "Nobody at the station could tell you who had closed it, or why.", nl: "Niemand op het bureau kon je zeggen wie het had gesloten, of waarom.", fr: "Personne au commissariat ne pouvait vous dire qui l’avait classé, ni pourquoi.", de: "Niemand auf dem Revier konnte dir sagen, wer sie geschlossen hatte, oder warum." } },
          ],
        },
      ],
    },
    {
      id: 'people',
      columns: '1fr',
      rows: '1fr',
      areas: ["cast"],
      panels: [
        {
          id: 'cast',
          drift: 'left',
          layers: [
            { art: 'cast', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Edgar Mercer had stood behind that counter for thirty-nine years. He checked every prescription twice.", nl: "Edgar Mercer stond al negenendertig jaar achter die toonbank. Hij controleerde elk recept twee keer.", fr: "Edgar Mercer se tenait derrière ce comptoir depuis trente-neuf ans. Il vérifiait chaque ordonnance deux fois.", de: "Edgar Mercer stand seit neununddreißig Jahren hinter diesem Tresen. Er prüfte jedes Rezept zweimal." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Dr. Raymond Pell had the surgery upstairs. He spent the whole evening at St. Columba’s, delivering a baby.", nl: "Dokter Raymond Pell had de praktijk boven. Hij was de hele avond in St. Columba’s, bij een bevalling.", fr: "Le docteur Raymond Pell avait son cabinet à l’étage. Il avait passé la soirée à St. Columba’s, à mettre un bébé au monde.", de: "Dr. Raymond Pell hatte die Praxis oben. Er war den ganzen Abend im St. Columba’s und holte ein Baby auf die Welt." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Nathan, his son and partner. Lucille, his wife.", nl: "Nathan, zijn zoon en vennoot. Lucille, zijn vrouw.", fr: "Nathan, son fils et associé. Lucille, sa femme.", de: "Nathan, sein Sohn und Partner. Lucille, seine Frau." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Helen Voss, who ran the soda fountain and saw everyone who came in.", nl: "En Helen Voss, die de frisdrankbar deed en iedereen zag die binnenkwam.", fr: "Et Helen Voss, qui tenait la fontaine à soda et voyait tous ceux qui entraient.", de: "Und Helen Voss, die den Limonadentresen führte und jeden sah, der hereinkam." } },
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
