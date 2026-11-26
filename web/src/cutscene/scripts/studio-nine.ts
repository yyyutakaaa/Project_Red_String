// The comic strip that opens studio-nine. Panel art: src/assets/art/cutscenes/studio-nine/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const studioNineCutscene: Cutscene = {
  id: 'studio-nine',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The Heights, August.", nl: "The Heights, augustus.", fr: "Les Heights, août.", de: "Die Heights, August." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "It had nothing to do with the harbor. The judge had found his wife’s love letters, and under their marriage contract she would have left with nothing.", nl: "Het had niets met de haven te maken. De rechter had de liefdesbrieven van zijn vrouw gevonden, en volgens hun huwelijkscontract zou ze met niets vertrekken.", fr: "Cela n’avait rien à voir avec le port. Le juge avait trouvé les lettres d’amour de sa femme, et leur contrat de mariage l’aurait laissée sans rien.", de: "Mit dem Hafen hatte es nichts zu tun. Der Richter hatte die Liebesbriefe seiner Frau gefunden, und laut Ehevertrag wäre sie mit nichts gegangen." } },
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
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "But the commission lost its chairman, and the hearings were put off until spring. Somebody on the waterfront slept better.", nl: "Maar de commissie verloor haar voorzitter, en de zittingen werden uitgesteld tot de lente. Iemand in de haven sliep beter.", fr: "Mais la commission avait perdu son président, et les audiences furent repoussées au printemps. Quelqu’un, sur le port, dormait mieux.", de: "Aber die Kommission verlor ihren Vorsitzenden, und die Anhörungen wurden auf den Frühling verschoben. Jemand am Hafen schlief besser." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "Not every death in Calder City belonged on your board. You were learning to tell the difference.", nl: "Niet elke dode in Calder City hoorde op je bord. Je leerde het verschil te zien.", fr: "Toutes les morts de Calder City n’avaient pas leur place au tableau. Vous appreniez à faire la différence.", de: "Nicht jeder Tote in Calder City gehörte an dein Brett. Du lerntest, den Unterschied zu sehen." } },
          ],
        },
      ],
    },
    {
      id: 'clay',
      columns: '1fr',
      rows: '1fr',
      areas: ["clay"],
      panels: [
        {
          id: 'clay',
          drift: 'left',
          layers: [
            { art: 'clay', depth: 0.08 },
            { art: 'clay-clay', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 46, text: { en: "The Courier Building on Harbor Avenue: Irene Brandt’s newspaper downstairs, Radio Calder on the ninth floor.", nl: "Het Courier-gebouw aan Harbor Avenue: de krant van Irene Brandt beneden, Radio Calder op de negende verdieping.", fr: "L’immeuble du Courier, sur Harbor Avenue : le journal d’Irene Brandt en bas, Radio Calder au neuvième étage.", de: "Das Courier-Gebäude an der Harbor Avenue: Irene Brandts Zeitung unten, Radio Calder im neunten Stock." } },
            { kind: 'caption', x: 52, y: 76, w: 45, text: { en: "Vernon Clay produced ‘Nightbeat’, the city’s favorite crime serial. He kept a locked drawer, and half the building wondered what was in it.", nl: "Vernon Clay maakte ‘Nightbeat’, het geliefdste misdaadhoorspel van de stad. Hij had een la op slot, en het halve gebouw vroeg zich af wat erin zat.", fr: "Vernon Clay produisait « Nightbeat », le feuilleton policier préféré de la ville. Il avait un tiroir fermé à clé, et la moitié de l’immeuble se demandait ce qu’il contenait.", de: "Vernon Clay produzierte „Nightbeat“, die beliebteste Krimiserie der Stadt. Er hatte eine verschlossene Schublade, und das halbe Haus fragte sich, was darin war." } },
          ],
        },
      ],
    },
    {
      id: 'air',
      columns: '1fr 1fr',
      rows: '1.1fr 1fr',
      areas: ["onair onair", "record pearl"],
      panels: [
        {
          id: 'onair',
          drift: 'right',
          focus: 'xMidYMin',
          layers: [
            { art: 'onair', depth: 0.08 },
            { art: 'onair-lamp', depth: 0.3, enter: 'fade', delay: 0.3 },
          ],
          beats: [
            { kind: 'caption', x: 50, y: 4, w: 46, text: { en: "Radio Calder, ninth floor of the Courier Building. October 1949.", nl: "Radio Calder, negende verdieping van het Courier-gebouw. Oktober 1949.", fr: "Radio Calder, neuvième étage du Courier Building. Octobre 1949.", de: "Radio Calder, neunter Stock des Courier-Gebäudes. Oktober 1949." } },
            { kind: 'caption', x: 2, y: 72, w: 40, text: { en: "9:30 p.m. 'Nightbeat' goes on the air.", nl: "21.30 uur. ‘Nightbeat’ gaat de lucht in.", fr: "21 h 30. « Nightbeat » passe à l’antenne.", de: "21:30 Uhr. „Nightbeat“ geht auf Sendung." } },
          ],
        },
        {
          id: 'record',
          drift: 'in',
          focus: 'xMidYMax',
          layers: [
            { art: 'record', depth: 0.08 },
            { art: 'record-turntable', depth: 0.6, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 4, w: 50, text: { en: "Half a million listeners heard Dorothy Vale's voice.", nl: "Een half miljoen luisteraars hoorde de stem van Dorothy Vale.", fr: "Un demi-million d’auditeurs entendirent la voix de Dorothy Vale.", de: "Eine halbe Million Hörer hörte die Stimme von Dorothy Vale." } },
            { kind: 'caption', x: 60, y: 4, w: 37, text: { en: "Nobody stood at the microphone.", nl: "Niemand stond aan de microfoon.", fr: "Personne ne se tenait au micro.", de: "Niemand stand am Mikrofon." } },
          ],
        },
        {
          id: 'pearl',
          drift: 'left',
          layers: [
            { art: 'pearl', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 52, text: { en: "Under the producer's desk.", nl: "Onder het bureau van de producer.", fr: "Sous le bureau du producteur.", de: "Unter dem Schreibtisch des Produzenten." } },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Dorothy Vale, the star of the show. Half a million people knew her voice.", nl: "Dorothy Vale, de ster van de show. Een half miljoen mensen kende haar stem.", fr: "Dorothy Vale, la vedette de l’émission. Un demi-million de personnes connaissaient sa voix.", de: "Dorothy Vale, der Star der Sendung. Eine halbe Million Menschen kannte ihre Stimme." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Eddie Fenn made the footsteps, the doors and the gunshots.", nl: "Eddie Fenn maakte de voetstappen, de deuren en de schoten.", fr: "Eddie Fenn faisait les pas, les portes et les coups de feu.", de: "Eddie Fenn machte die Schritte, die Türen und die Schüsse." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Sam Okada ran the control board that night.", nl: "Sam Okada zat die avond aan de regeltafel.", fr: "Sam Okada tenait la console ce soir-là.", de: "Sam Okada saß an diesem Abend am Mischpult." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "And Nora Quill, a young actress waiting for an appointment, who opened the wrong door.", nl: "En Nora Quill, een jonge actrice die op een afspraak wachtte, en de verkeerde deur opendeed.", fr: "Et Nora Quill, une jeune actrice qui attendait un rendez-vous et a ouvert la mauvaise porte.", de: "Und Nora Quill, eine junge Schauspielerin, die auf einen Termin wartete und die falsche Tür öffnete." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["lift"],
      panels: [
        {
          id: 'lift',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'lift', depth: 0.08 },
            { art: 'lift-irene', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 6, y: 62, w: 40, tail: { x: 60, y: 44 }, text: { en: "Another dead man in my building, Detective.", nl: "Weer een dode in mijn gebouw, rechercheur.", fr: "Encore un mort dans mon immeuble, inspecteur.", de: "Schon wieder ein Toter in meinem Haus, Detective." } },
          ],
        },
      ],
    },
  ],
};
