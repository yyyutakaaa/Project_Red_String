// The comic strip that opens pier-seventeen. Panel art: src/assets/art/cutscenes/pier-seventeen/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const pierSeventeenCutscene: Cutscene = {
  id: 'pier-seventeen',
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
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The Blue Lantern, February.", nl: "The Blue Lantern, februari.", fr: "Le Blue Lantern, février.", de: "The Blue Lantern, Februar." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Frank Dellow had been skimming the door for a year. When Kale found his notebook, Frank shot him under cover of the drums.", nl: "Frank Dellow roomde al een jaar de deurkas af. Toen Kale zijn notitieboek vond, schoot Frank hem neer in het lawaai van de drums.", fr: "Frank Dellow écrémait la caisse de l’entrée depuis un an. Quand Kale a trouvé son carnet, Frank l’a abattu sous le vacarme de la batterie.", de: "Frank Dellow hatte ein Jahr lang die Türkasse abgeschöpft. Als Kale sein Notizbuch fand, erschoss Frank ihn im Lärm des Schlagzeugs." } },
          ],
        },
        {
          id: 'board',
          drift: 'in',
          layers: [
            { art: 'shared/board-1', depth: 0.08 },
            { art: 'shared/board-1-detective', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "It was Vance who broke Frank’s alibi. He had been in Booth 9 all along, though at first he swore he wasn’t. He never said who he met there.", nl: "Het was Vance die Franks alibi brak. Hij had al die tijd in Booth 9 gezeten, al zwoer hij eerst van niet. Met wie hij daar zat, zei hij nooit.", fr: "C’est Vance qui a fait tomber l’alibi de Frank. Il était resté dans la box 9, même s’il l’avait d’abord nié. Il n’a jamais dit qui il y rencontrait.", de: "Es war Vance, der Franks Alibi zerlegte. Er hatte die ganze Zeit in Nische 9 gesessen, auch wenn er es erst abstritt. Mit wem, sagte er nie." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "A shipping family’s lawyer in a rum-runner’s club. You tied a red thread between the two cards. Your first.", nl: "De advocaat van een rederij in de club van een drankensmokkelaar. Je knoopte een rode draad tussen de twee kaarten. Je eerste.", fr: "L’avocat d’armateurs dans le club d’un ancien contrebandier. Vous avez tendu un fil rouge entre les deux fiches. Le premier.", de: "Der Anwalt einer Reederei im Club eines Rumschmugglers. Du hast einen roten Faden zwischen die beiden Karten gespannt. Deinen ersten." } },
          ],
        },
      ],
    },
    {
      id: 'fog',
      columns: '1fr 1fr',
      rows: '1.1fr 1fr',
      areas: ["pier pier", "clerk cape"],
      panels: [
        {
          id: 'pier',
          drift: 'right',
          layers: [
            { art: 'pier', depth: 0.08 },
            { art: 'pier-lamp', depth: 0.8, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 52, y: 4, w: 44, text: { en: "Pier Seventeen, April 1949.", nl: "Pier Seventeen, april 1949.", fr: "Pier Seventeen, avril 1949.", de: "Pier Seventeen, April 1949." } },
            { kind: 'caption', x: 2, y: 76, w: 40, text: { en: "A foghorn, somewhere out on the water.", nl: "Een misthoorn, ergens op het water.", fr: "Une corne de brume, quelque part sur l'eau.", de: "Ein Nebelhorn, irgendwo draußen auf dem Wasser." } },
          ],
        },
        {
          id: 'clerk',
          drift: 'in',
          layers: [
            { art: 'clerk', depth: 0.08 },
            { art: 'clerk-pike', depth: 0.4, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 4, w: 34, text: { en: "Harold Pike kept a carbon copy of everything.", nl: "Harold Pike hield van alles een doorslag bij.", fr: "Harold Pike gardait un double carbone de tout.", de: "Harold Pike behielt von allem einen Durchschlag." } },
          ],
        },
        {
          id: 'cape',
          drift: 'left',
          layers: [
            { art: 'cape', depth: 0.08 },
            { art: 'cape-woman', depth: 0.55, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 34, text: { en: "10:50 p.m.", nl: "22.50 uur.", fr: "22 h 50.", de: "22:50 Uhr." } },
          ],
        },
      ],
    },
    {
      id: 'stamp',
      columns: '1fr',
      rows: '1fr',
      areas: ["stamp"],
      panels: [
        {
          id: 'stamp',
          drift: 'in',
          layers: [
            { art: 'stamp', depth: 0.08 },
            { art: 'stamp-stamp', depth: 0.6, enter: 'down', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Nothing leaves a ship in Calder City until Harbor Customs has stamped it.", nl: "In Calder City gaat er niets van een schip af voordat de Havendouane er een stempel op heeft gezet.", fr: "À Calder City, rien ne quitte un navire avant que la douane du port l’ait tamponné.", de: "In Calder City verlässt nichts ein Schiff, bevor der Hafenzoll es abgestempelt hat." } },
            { kind: 'caption', x: 40, y: 76, w: 57, text: { en: "One stamp turns a crate into whatever the paper says. Machine parts. Tinned fish. Anything at all.", nl: "Eén stempel maakt van een kist wat er op het papier staat. Machineonderdelen. Blikvis. Wat dan ook.", fr: "Un coup de tampon transforme une caisse en ce que dit le papier. Pièces détachées. Poisson en conserve. N’importe quoi.", de: "Ein Stempel macht aus einer Kiste, was auf dem Papier steht. Maschinenteile. Fischkonserven. Alles Mögliche." } },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Clara Ashgrove ran Ashgrove Shipping now. Harold Pike had kept her father’s books for thirty-one years.", nl: "Clara Ashgrove leidde Ashgrove Shipping nu. Harold Pike hield al eenendertig jaar de boeken van haar vader bij.", fr: "Clara Ashgrove dirigeait Ashgrove Shipping. Harold Pike tenait les livres de son père depuis trente et un ans.", de: "Clara Ashgrove leitete jetzt Ashgrove Shipping. Harold Pike hatte dreißig Jahre lang die Bücher ihres Vaters geführt." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "She telephoned Leonard Vance before she telephoned anybody else.", nl: "Ze belde Leonard Vance voordat ze iemand anders belde.", fr: "Elle a appelé Leonard Vance avant d’appeler qui que ce soit d’autre.", de: "Sie rief Leonard Vance an, bevor sie irgendjemand anderen anrief." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Inspector Ruth Calloway of Harbor Customs had come at dawn to seal the warehouse, as the rules require.", nl: "Inspecteur Ruth Calloway van de Havendouane kwam bij het ochtendgloren de loods verzegelen, zoals het reglement wil.", fr: "L’inspectrice Ruth Calloway, de la douane du port, était venue à l’aube sceller l’entrepôt, comme l’exige le règlement.", de: "Inspektorin Ruth Calloway vom Hafenzoll war im Morgengrauen gekommen, um das Lager zu versiegeln, wie es die Vorschrift will." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Tommy Reyes, the night watchman, who smelled of peppermints at seven in the morning.", nl: "En Tommy Reyes, de nachtwaker, die om zeven uur ’s ochtends naar pepermunt rook.", fr: "Et Tommy Reyes, le veilleur de nuit, qui sentait la menthe à sept heures du matin.", de: "Und Tommy Reyes, der Nachtwächter, der um sieben Uhr morgens nach Pfefferminz roch." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["stairs"],
      panels: [
        {
          id: 'stairs',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'stairs', depth: 0.08 },
            { art: 'stairs-papers', depth: 0.4, enter: 'fade', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "By midnight, the clerk lay at the foot of the archive stairs.", nl: "Om middernacht lag de klerk onderaan de archieftrap.", fr: "À minuit, le commis gisait au pied de l'escalier des archives.", de: "Um Mitternacht lag der Buchhalter am Fuß der Archivtreppe." } },
          ],
        },
      ],
    },
  ],
};
