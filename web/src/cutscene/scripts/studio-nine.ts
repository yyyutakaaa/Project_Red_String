// The comic strip that opens studio-nine. Panel art: src/assets/art/cutscenes/studio-nine/<layer>.webp.
import type { Cutscene } from '../types.ts';

export const studioNineCutscene: Cutscene = {
  id: 'studio-nine',
  pages: [
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
            { kind: 'caption', x: 2, y: 72, w: 40, text: { en: "9:00 p.m. 'Nightbeat' goes on the air.", nl: "21.00 uur. 'Nightbeat' gaat de lucht in.", fr: "21 h. « Nightbeat » prend l'antenne.", de: "21:00 Uhr. ‚Nightbeat‘ geht auf Sendung." } },
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
