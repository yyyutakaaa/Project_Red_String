// The comic strip that opens reading-room. Panel art: src/assets/art/cutscenes/reading-room/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const readingRoomCutscene: Cutscene = {
  id: 'reading-room',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The Regent, New Year’s Eve.", nl: "The Regent, oudejaarsavond.", fr: "Le Regent, la Saint-Sylvestre.", de: "Das Regent, Silvester." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Howard Fowler had stolen sixty thousand dollars from his own clients. When his partner found out, Fowler killed him while the ballroom clock ran ten minutes fast.", nl: "Howard Fowler had zestigduizend dollar van zijn eigen klanten gestolen. Toen zijn partner het ontdekte, doodde Fowler hem terwijl de klok in de balzaal tien minuten voorliep.", fr: "Howard Fowler avait volé soixante mille dollars à ses propres clients. Quand son associé l’a découvert, Fowler l’a tué pendant que l’horloge de la salle avançait de dix minutes.", de: "Howard Fowler hatte seinen eigenen Kunden sechzigtausend Dollar gestohlen. Als sein Partner es herausfand, tötete Fowler ihn, während die Ballsaaluhr zehn Minuten vorging." } },
          ],
        },
        {
          id: 'board',
          drift: 'in',
          layers: [
            { art: 'meanwhile', depth: 0.08 },
            { art: 'meanwhile-clara', depth: 0.5, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Clara took Gilbert Ames’s folder home in her own briefcase. He had only got halfway through the trust.", nl: "Clara nam de map van Gilbert Ames mee naar huis, in haar eigen aktetas. Hij was maar halverwege het fonds gekomen.", fr: "Clara a emporté le dossier de Gilbert Ames chez elle, dans sa propre serviette. Il n’avait examiné que la moitié du fonds.", de: "Clara nahm Gilbert Ames’ Mappe in ihrer eigenen Aktentasche mit nach Hause. Er war nur bis zur Hälfte des Fonds gekommen." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "Halfway was enough. For years, small sums had left her father’s money, always signed off by the trustee. She didn’t know yet who she could tell.", nl: "Halverwege was genoeg. Al jaren gingen er kleine bedragen uit het geld van haar vader, altijd afgetekend door de beheerder. Ze wist nog niet wie ze het kon vertellen.", fr: "La moitié suffisait. Depuis des années, de petites sommes quittaient l’argent de son père, toujours visées par l’administrateur. Elle ne savait pas encore à qui le dire.", de: "Die Hälfte reichte. Seit Jahren flossen kleine Beträge aus dem Geld ihres Vaters ab, immer vom Verwalter abgezeichnet. Sie wusste noch nicht, wem sie es sagen konnte." } },
          ],
        },
      ],
    },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "And Calder City kept on killing for its own reasons. Miss Agnes Thorne had kept the library’s rare books for thirty years.", nl: "En Calder City bleef doden om eigen redenen. Juffrouw Agnes Thorne beheerde al dertig jaar de zeldzame boeken van de bibliotheek.", fr: "Et Calder City continuait de tuer pour ses propres raisons. Mlle Agnes Thorne gardait les livres rares de la bibliothèque depuis trente ans.", de: "Und Calder City tötete weiter aus eigenen Gründen. Miss Agnes Thorne hütete seit dreißig Jahren die seltenen Bücher der Bibliothek." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Graham Oakes, her deputy, was on the reference desk all evening.", nl: "Graham Oakes, haar adjunct, zat de hele avond aan de informatiebalie.", fr: "Graham Oakes, son adjoint, était au bureau de renseignements toute la soirée.", de: "Graham Oakes, ihr Stellvertreter, saß den ganzen Abend an der Auskunft." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Oliver Prentice, a dealer in rare books, had an appointment with her at nine.", nl: "Oliver Prentice, handelaar in zeldzame boeken, had om negen uur een afspraak met haar.", fr: "Oliver Prentice, marchand de livres rares, avait rendez-vous avec elle à neuf heures.", de: "Oliver Prentice, Händler für seltene Bücher, hatte um neun einen Termin bei ihr." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "Rosa Lindqvist read at the window table every night. Abe Kowalski, the night porter, kept the keys.", nl: "Rosa Lindqvist las elke avond aan de tafel bij het raam. Abe Kowalski, de nachtportier, beheerde de sleutels.", fr: "Rosa Lindqvist lisait chaque soir à la table près de la fenêtre. Abe Kowalski, le gardien de nuit, avait les clés.", de: "Rosa Lindqvist las jeden Abend am Fenstertisch. Abe Kowalski, der Nachtpförtner, verwaltete die Schlüssel." } },
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
