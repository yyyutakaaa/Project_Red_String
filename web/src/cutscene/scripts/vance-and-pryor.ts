// The comic strip that opens vance-and-pryor. Panel art: src/assets/art/cutscenes/vance-and-pryor/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const vanceAndPryorCutscene: Cutscene = {
  id: 'vance-and-pryor',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Calloway Street, April.", nl: "Calloway Street, april.", fr: "Calloway Street, avril.", de: "Calloway Street, April." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Dr. Pell had been writing morphine prescriptions for dead patients. When Edgar Mercer noticed, Pell poisoned his tonic and made sure he was at the hospital when it worked.", nl: "Dokter Pell schreef morfine voor op naam van dode patiënten. Toen Edgar Mercer het merkte, vergiftigde Pell zijn tonicum en zorgde hij dat hij in het ziekenhuis was toen het werkte.", fr: "Le docteur Pell prescrivait de la morphine au nom de patients morts. Quand Edgar Mercer l’a remarqué, Pell a empoisonné son tonique et s’est arrangé pour être à l’hôpital quand il a agi.", de: "Dr. Pell verschrieb Morphium auf die Namen toter Patienten. Als Edgar Mercer es bemerkte, vergiftete Pell sein Tonikum und sorgte dafür, dass er im Krankenhaus war, als es wirkte." } },
          ],
        },
        {
          id: 'board',
          drift: 'left',
          layers: [
            { art: 'meanwhile', depth: 0.08 },
            { art: 'meanwhile-people', depth: 0.5, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "In May, Clara Ashgrove took Gilbert Ames’s folder to Vance and Pryor. Not to Leonard Vance.", nl: "In mei bracht Clara Ashgrove de map van Gilbert Ames naar Vance and Pryor. Niet naar Leonard Vance.", fr: "En mai, Clara Ashgrove a porté le dossier de Gilbert Ames chez Vance and Pryor. Pas à Leonard Vance.", de: "Im Mai brachte Clara Ashgrove Gilbert Ames’ Mappe zu Vance and Pryor. Nicht zu Leonard Vance." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "She gave it to his partner, Martin Pryor, the one man there she still trusted. He read it and asked for two weeks.", nl: "Ze gaf hem aan zijn partner, Martin Pryor, de enige daar die ze nog vertrouwde. Hij las hem en vroeg om twee weken.", fr: "Elle l’a confié à son associé, Martin Pryor, le seul homme du cabinet en qui elle avait encore confiance. Il l’a lu et a demandé deux semaines.", de: "Sie gab sie seinem Partner Martin Pryor, dem einzigen dort, dem sie noch traute. Er las sie und bat um zwei Wochen." } },
          ],
        },
      ],
    },
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
      id: 'board3',
      columns: '1fr',
      rows: '1fr',
      areas: ["board3"],
      panels: [
        {
          id: 'board3',
          drift: 'in',
          layers: [
            { art: 'shared/board-3', depth: 0.08 },
            { art: 'shared/board-3-detective', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Ashgrove House. Booth 9. Pier Seventeen. The Regent. Every time, somebody else went to prison.", nl: "Ashgrove House. Booth 9. Pier Seventeen. The Regent. Elke keer ging iemand anders de cel in.", fr: "Ashgrove House. La box 9. Le Pier Seventeen. Le Regent. À chaque fois, quelqu’un d’autre allait en prison.", de: "Ashgrove House. Nische 9. Pier Seventeen. Das Regent. Jedes Mal ging jemand anderes ins Gefängnis." } },
            { kind: 'caption', x: 3, y: 78, w: 56, text: { en: "Every time, Leonard Vance went home.", nl: "Elke keer ging Leonard Vance naar huis.", fr: "À chaque fois, Leonard Vance rentrait chez lui.", de: "Jedes Mal ging Leonard Vance nach Hause." } },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Leonard Vance, Martin Pryor’s partner for twenty-six years.", nl: "Leonard Vance, zesentwintig jaar de partner van Martin Pryor.", fr: "Leonard Vance, l’associé de Martin Pryor depuis vingt-six ans.", de: "Leonard Vance, seit sechsundzwanzig Jahren Martin Pryors Partner." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Clara Ashgrove, whose family money the note talked about.", nl: "Clara Ashgrove, over wier familiegeld het briefje ging.", fr: "Clara Ashgrove, dont le mot parlait de l’argent de famille.", de: "Clara Ashgrove, um deren Familiengeld es in dem Brief ging." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Miss June Hartley, the firm’s secretary, who unlocked the office and found him.", nl: "Juffrouw June Hartley, de secretaresse van het kantoor, die de deur opende en hem vond.", fr: "Mlle June Hartley, la secrétaire du cabinet, qui a ouvert le bureau et l’a trouvé.", de: "Miss June Hartley, die Sekretärin der Kanzlei, die aufschloss und ihn fand." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Tommy Reyes, once the watchman on Pier Seventeen, now running the night elevator in this building.", nl: "En Tommy Reyes, ooit nachtwaker op Pier Seventeen, nu liftman ’s nachts in dit gebouw.", fr: "Et Tommy Reyes, autrefois veilleur au Pier Seventeen, aujourd’hui liftier de nuit dans cet immeuble.", de: "Und Tommy Reyes, früher Wächter auf Pier Seventeen, jetzt Nachtliftführer in diesem Gebäude." } },
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
