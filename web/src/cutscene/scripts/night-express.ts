// The comic strip that opens night-express. Panel art: src/assets/art/cutscenes/night-express/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const nightExpressCutscene: Cutscene = {
  id: 'night-express',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Pier Seventeen, April.", nl: "Pier Seventeen, april.", fr: "Pier Seventeen, avril.", de: "Pier Seventeen, April." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Ruth Calloway had been paid to let smuggled cargo through on Ashgrove ships. Harold Pike found her stamp on the false papers, so she sent him down the stairs.", nl: "Ruth Calloway werd betaald om smokkelwaar door te laten op schepen van Ashgrove. Harold Pike vond haar stempel op de valse papieren, dus duwde ze hem van de trap.", fr: "Ruth Calloway était payée pour laisser passer la contrebande des navires Ashgrove. Harold Pike a trouvé son tampon sur les faux papiers ; elle l’a poussé dans l’escalier.", de: "Ruth Calloway wurde bezahlt, um Schmuggelware auf Ashgrove-Schiffen durchzulassen. Harold Pike fand ihren Stempel auf den falschen Papieren, also stieß sie ihn die Treppe hinunter." } },
          ],
        },
        {
          id: 'board',
          drift: 'out',
          layers: [
            { art: 'news', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Who paid her, she never said. The Calder Courier ran the story for weeks.", nl: "Wie haar betaalde, zei ze nooit. De Calder Courier bracht het verhaal wekenlang.", fr: "Qui la payait, elle ne l’a jamais dit. Le Calder Courier en a fait sa une pendant des semaines.", de: "Wer sie bezahlte, sagte sie nie. Der Calder Courier brachte die Geschichte wochenlang." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "The State answered with a Waterfront Commission. Walter Brandt, the paper’s owner, had a file for it of his own.", nl: "De staat antwoordde met een Havencommissie. Walter Brandt, de eigenaar van de krant, had er zelf een dossier voor.", fr: "L’État a répondu par une Commission du port. Walter Brandt, le propriétaire du journal, avait son propre dossier pour elle.", de: "Der Staat antwortete mit einer Hafenkommission. Walter Brandt, dem die Zeitung gehörte, hatte eine eigene Akte dafür." } },
          ],
        },
      ],
    },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Irene Brandt, his wife. She had not wanted him to go.", nl: "Irene Brandt, zijn vrouw. Ze had niet gewild dat hij ging.", fr: "Irene Brandt, sa femme. Elle ne voulait pas qu’il y aille.", de: "Irene Brandt, seine Frau. Sie hatte nicht gewollt, dass er fährt." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Paul Sutter, his star reporter, carried the Courier’s half of the file.", nl: "Paul Sutter, zijn beste verslaggever, droeg de helft van het dossier van de Courier.", fr: "Paul Sutter, son meilleur reporter, portait la moitié du dossier du Courier.", de: "Paul Sutter, sein bester Reporter, trug die Hälfte der Courier-Akte." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Conrad Teague built half the waterfront. His name was all over that file, and he was going to the same hearing.", nl: "Conrad Teague bouwde de halve haven. Zijn naam stond overal in dat dossier, en hij ging naar dezelfde zitting.", fr: "Conrad Teague avait construit la moitié du port. Son nom était partout dans ce dossier, et il allait à la même audience.", de: "Conrad Teague hatte den halben Hafen gebaut. Sein Name stand überall in dieser Akte, und er fuhr zur selben Anhörung." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Gus Malloy, who had worked this car for twenty-two years and knew every sound it made.", nl: "En Gus Malloy, die al tweeëntwintig jaar in deze wagon werkte en elk geluid ervan kende.", fr: "Et Gus Malloy, qui travaillait dans cette voiture depuis vingt-deux ans et en connaissait chaque bruit.", de: "Und Gus Malloy, der seit zweiundzwanzig Jahren in diesem Wagen arbeitete und jedes Geräusch kannte." } },
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
