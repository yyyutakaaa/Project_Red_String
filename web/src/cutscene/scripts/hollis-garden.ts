// The comic strip that opens hollis-garden. Panel art: src/assets/art/cutscenes/hollis-garden/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const hollisGardenCutscene: Cutscene = {
  id: 'hollis-garden',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Harmon Junction, June.", nl: "Harmon Junction, juni.", fr: "Harmon Junction, juin.", de: "Harmon Junction, Juni." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Paul Sutter had been selling his own paper’s secrets to Teague Construction. When Walter Brandt found the deposit slip, Paul killed him.", nl: "Paul Sutter verkocht de geheimen van zijn eigen krant aan Teague Construction. Toen Walter Brandt het stortingsbewijs vond, doodde Paul hem.", fr: "Paul Sutter vendait les secrets de son propre journal à Teague Construction. Quand Walter Brandt a trouvé le bordereau de dépôt, Paul l’a tué.", de: "Paul Sutter verkaufte die Geheimnisse seiner eigenen Zeitung an Teague Construction. Als Walter Brandt den Einzahlungsbeleg fand, tötete Paul ihn." } },
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
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Irene Brandt handed the file to the commission herself, then took over the Courier. Conrad Teague kept his contracts. Nothing tied him to the knife.", nl: "Irene Brandt gaf het dossier zelf aan de commissie en nam daarna de Courier over. Conrad Teague hield zijn contracten. Niets verbond hem met het mes.", fr: "Irene Brandt a remis elle-même le dossier à la commission, puis a repris le Courier. Conrad Teague a gardé ses contrats. Rien ne le reliait au couteau.", de: "Irene Brandt übergab die Akte selbst der Kommission und übernahm dann den Courier. Conrad Teague behielt seine Aufträge. Nichts verband ihn mit dem Messer." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "The commission got a new chairman: Judge Arthur Hollis, thirty years on the bench and afraid of nobody. He wanted Teague’s books.", nl: "De commissie kreeg een nieuwe voorzitter: rechter Arthur Hollis, dertig jaar rechter en voor niemand bang. Hij wilde de boeken van Teague zien.", fr: "La commission a eu un nouveau président : le juge Arthur Hollis, trente ans de magistrature et peur de personne. Il voulait les livres de Teague.", de: "Die Kommission bekam einen neuen Vorsitzenden: Richter Arthur Hollis, dreißig Jahre im Amt und vor niemandem bange. Er wollte Teagues Bücher sehen." } },
          ],
        },
      ],
    },
    {
      id: 'party',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["waltz band", "waltz urn"],
      panels: [
        {
          id: 'waltz',
          drift: 'in',
          layers: [
            { art: 'waltz', depth: 0.08 },
            { art: 'waltz-couple', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "The Heights, August 1949.", nl: "The Heights, augustus 1949.", fr: "The Heights, août 1949.", de: "The Heights, August 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Judge Hollis's summer party, and the waltzes were printed on the dance cards.", nl: "Het zomerfeest van rechter Hollis, en de walsen stonden op de danskaartjes.", fr: "La fête d'été du juge Hollis, et les valses étaient imprimées sur les carnets de bal.", de: "Das Sommerfest von Richter Hollis, und die Walzer standen auf den Tanzkarten." } },
          ],
        },
        {
          id: 'band',
          drift: 'left',
          layers: [
            { art: 'band', depth: 0.08 },
            { art: 'band-leader', depth: 0.5, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "9:40 p.m. A string snapped.", nl: "21.40 uur. Een snaar knapte.", fr: "21 h 40. Une corde cassa.", de: "21:40 Uhr. Eine Saite riss." } },
            { kind: 'balloon', x: 54, y: 62, w: 42, tail: { x: 48, y: 40 }, text: { en: "Swap the next two!", nl: "Wissel de volgende twee om!", fr: "On inverse les deux suivants !", de: "Die nächsten zwei tauschen!" } },
          ],
        },
        {
          id: 'urn',
          drift: 'right',
          layers: [
            { art: 'urn', depth: 0.08 },
            { art: 'urn-glove', depth: 0.6, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "By the lily pond.", nl: "Bij de lelievijver.", fr: "Près du bassin aux nénuphars.", de: "Am Seerosenteich." } },
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
            { art: 'cast-people', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Beatrice Hollis, the judge’s second wife, twenty years younger than him.", nl: "Beatrice Hollis, de tweede vrouw van de rechter, twintig jaar jonger dan hij.", fr: "Beatrice Hollis, la seconde épouse du juge, de vingt ans sa cadette.", de: "Beatrice Hollis, die zweite Frau des Richters, zwanzig Jahre jünger als er." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Celia, his daughter, who sang with the band that night.", nl: "Celia, zijn dochter, die die avond met de band zong.", fr: "Celia, sa fille, qui chantait avec l’orchestre ce soir-là.", de: "Celia, seine Tochter, die an diesem Abend mit der Band sang." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Rex Danner, the bandleader, who knew the order of every song.", nl: "Rex Danner, de bandleider, die de volgorde van elk nummer kende.", fr: "Rex Danner, le chef d’orchestre, qui connaissait l’ordre de chaque morceau.", de: "Rex Danner, der Bandleader, der die Reihenfolge jedes Stücks kannte." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Philip Hollis, the judge’s nephew and law clerk, who typed his letters.", nl: "En Philip Hollis, de neef en griffier van de rechter, die zijn brieven typte.", fr: "Et Philip Hollis, neveu et greffier du juge, qui tapait ses lettres.", de: "Und Philip Hollis, Neffe und Schreiber des Richters, der seine Briefe tippte." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["paper"],
      panels: [
        {
          id: 'paper',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'paper', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "Judge Hollis was found face down in his own lily pond.", nl: "Rechter Hollis werd voorover in zijn eigen lelievijver gevonden.", fr: "Le juge Hollis fut retrouvé face contre l’eau dans son propre bassin.", de: "Richter Hollis wurde mit dem Gesicht nach unten in seinem eigenen Seerosenteich gefunden." } },
            { kind: 'caption', x: 18, y: 4, w: 64, text: { en: "By morning the whole city was sure it knew why the judge had died.", nl: "Tegen de ochtend was de hele stad zeker dat ze wist waarom de rechter dood was.", fr: "Au matin, toute la ville était sûre de savoir pourquoi le juge était mort.", de: "Am Morgen war sich die ganze Stadt sicher, zu wissen, warum der Richter tot war." } },
          ],
        },
      ],
    },
  ],
};
