// The comic strip that opens ashgrove-house. Panel art: src/assets/art/cutscenes/ashgrove-house/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const ashgroveHouseCutscene: Cutscene = {
  id: 'ashgrove-house',
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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The Hotel Cardinal, three days earlier.", nl: "Het Hotel Cardinal, drie dagen eerder.", fr: "L’Hôtel Cardinal, trois jours plus tôt.", de: "Das Hotel Cardinal, drei Tage zuvor." } },
            { kind: 'caption', x: 3, y: 66, w: 64, text: { en: "Leonard Pike had been borrowing from the safe to pay his debts at the card table in Rudy’s bar. When Walter Finch caught him, he grabbed the doorstop.", nl: "Leonard Pike leende uit de kluis om zijn schulden aan de kaarttafel van Rudy’s bar te betalen. Toen Walter Finch hem betrapte, greep hij de deurstop.", fr: "Leonard Pike empruntait dans le coffre pour payer ses dettes à la table de jeu du bar de Rudy. Quand Walter Finch l’a surpris, il a saisi le butoir de porte.", de: "Leonard Pike nahm Geld aus dem Safe, um seine Schulden am Kartentisch in Rudys Bar zu bezahlen. Als Walter Finch ihn erwischte, griff er zum Türstopper." } },
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
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Your first case, closed before breakfast. The Captain called it beginner’s luck.", nl: "Je eerste zaak, gesloten voor het ontbijt. De Captain noemde het beginnersgeluk.", fr: "Votre première affaire, bouclée avant le petit-déjeuner. Le capitaine a parlé de chance du débutant.", de: "Dein erster Fall, gelöst vor dem Frühstück. Der Captain nannte es Anfängerglück." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "You pinned the card to a board above your desk anyway. Three nights later the telephone rang again.", nl: "Je prikte de kaart toch op een bord boven je bureau. Drie nachten later ging de telefoon weer.", fr: "Vous avez quand même épinglé la fiche au-dessus de votre bureau. Trois nuits plus tard, le téléphone a sonné de nouveau.", de: "Du hast die Karte trotzdem über deinem Schreibtisch angepinnt. Drei Nächte später klingelte wieder das Telefon." } },
          ],
        },
      ],
    },
    {
      id: 'storm',
      columns: '1.3fr 1fr',
      rows: '1fr',
      areas: ["road booth"],
      panels: [
        {
          id: 'road',
          drift: 'in',
          layers: [
            { art: 'road', depth: 0.08 },
            { art: 'road-car', depth: 0.6, enter: 'right', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "The coast road north of Calder City, October 1948.", nl: "De kustweg ten noorden van Calder City, oktober 1948.", fr: "La route côtière au nord de Calder City, octobre 1948.", de: "Die Küstenstraße nördlich von Calder City, Oktober 1948." } },
            { kind: 'caption', x: 40, y: 78, w: 56, text: { en: "The storm had cut the telephone line to Ashgrove House.", nl: "De storm had de telefoonlijn naar Ashgrove House doorgesneden.", fr: "La tempête avait coupé la ligne téléphonique d'Ashgrove House.", de: "Der Sturm hatte die Telefonleitung nach Ashgrove House gekappt." } },
          ],
        },
        {
          id: 'booth',
          drift: 'left',
          layers: [
            { art: 'booth', depth: 0.08 },
            { art: 'booth-vance', depth: 0.45, enter: 'fade', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 50, text: { en: "11:40 p.m.", nl: "23.40 uur.", fr: "23 h 40.", de: "23:40 Uhr." } },
            { kind: 'balloon', x: 4, y: 62, w: 44, tail: { x: 66, y: 30 }, text: { en: "They are all still in the house, Detective. Edmund Ashgrove is dead.", nl: "Ze zijn allemaal nog in het huis, rechercheur. Edmund Ashgrove is dood.", fr: "Ils sont tous encore dans la maison, inspecteur. Edmund Ashgrove est mort.", de: "Sie sind alle noch im Haus, Detective. Edmund Ashgrove ist tot." } },
            { kind: 'caption', x: 3, y: 15, w: 46, text: { en: "Leonard Vance, the family’s lawyer, had driven down the cliff road to the nearest telephone.", nl: "Leonard Vance, de advocaat van de familie, was de klifweg afgereden naar de dichtstbijzijnde telefoon.", fr: "Leonard Vance, l’avocat de la famille, avait descendu la route de la falaise jusqu’au téléphone le plus proche.", de: "Leonard Vance, der Anwalt der Familie, war die Klippenstraße hinunter zum nächsten Telefon gefahren." } },
          ],
        },
      ],
    },
    {
      id: 'house',
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Edmund Ashgrove built Ashgrove Shipping from a single boat. Half the cargo on the Calder waterfront sails under his flag.", nl: "Edmund Ashgrove bouwde Ashgrove Shipping op uit één boot. De helft van de lading in de haven van Calder vaart onder zijn vlag.", fr: "Edmund Ashgrove a bâti Ashgrove Shipping à partir d’un seul bateau. La moitié des cargaisons du port de Calder navigue sous son pavillon.", de: "Edmund Ashgrove hat Ashgrove Shipping aus einem einzigen Boot aufgebaut. Die Hälfte der Fracht im Hafen von Calder fährt unter seiner Flagge." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Leonard Vance, the family lawyer. He manages the Ashgrove Family Trust, where most of the money is kept.", nl: "Leonard Vance, de advocaat van de familie. Hij beheert het Ashgrove-familiefonds, waar het meeste geld zit.", fr: "Leonard Vance, l’avocat de la famille. Il gère le fonds familial Ashgrove, où se trouve presque tout l’argent.", de: "Leonard Vance, der Anwalt der Familie. Er verwaltet den Ashgrove-Familienfonds, in dem das meiste Geld liegt." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Clara Ashgrove, his daughter. She runs the company’s offices on Pier Seventeen.", nl: "Clara Ashgrove, zijn dochter. Zij leidt de kantoren van het bedrijf op Pier Seventeen.", fr: "Clara Ashgrove, sa fille. Elle dirige les bureaux de la compagnie sur le Pier Seventeen.", de: "Clara Ashgrove, seine Tochter. Sie leitet die Büros der Firma auf Pier Seventeen." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "Simon Whitlock, her husband. Charming, well dressed, and always a little short of money.", nl: "Simon Whitlock, haar man. Charmant, goed gekleed, en altijd een beetje krap bij kas.", fr: "Simon Whitlock, son mari. Charmant, bien habillé, et toujours un peu à court d’argent.", de: "Simon Whitlock, ihr Mann. Charmant, gut gekleidet und immer ein wenig knapp bei Kasse." } },
          ],
        },
      ],
    },
    {
      id: 'study',
      columns: '1fr',
      rows: '1fr',
      areas: ["study"],
      panels: [
        {
          id: 'study',
          drift: 'in',
          layers: [
            { art: 'study', depth: 0.08 },
            { art: 'study-paper', depth: 0.55, enter: 'zoom', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "On Edmund’s desk lay a codicil to his will, dated that same day. Nobody had signed it.", nl: "Op Edmunds bureau lag een aanvulling op zijn testament, van die dag zelf. Niemand had haar getekend.", fr: "Sur le bureau d’Edmund, un codicille à son testament, daté du jour même. Personne ne l’avait signé.", de: "Auf Edmunds Schreibtisch lag ein Nachtrag zu seinem Testament, vom selben Tag. Niemand hatte ihn unterschrieben." } },
            { kind: 'caption', x: 3, y: 21, w: 56, text: { en: "Edmund wrote everything down. Tonight, one of those notes might be enough to hang somebody.", nl: "Edmund schreef alles op. Vannacht kon één van die notities genoeg zijn om iemand te laten hangen.", fr: "Edmund notait tout. Cette nuit, une seule de ces notes pouvait suffire à envoyer quelqu’un à la potence.", de: "Edmund schrieb alles auf. Heute Nacht konnte eine dieser Notizen genügen, um jemanden an den Galgen zu bringen." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["cake"],
      panels: [
        {
          id: 'cake',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'cake', depth: 0.08 },
            { art: 'cake-cake', depth: 0.45, enter: 'zoom', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 24, y: 83, w: 52, text: { en: "Edmund Ashgrove turned sixty-five that night.", nl: "Edmund Ashgrove werd die avond vijfenzestig.", fr: "Edmund Ashgrove avait eu soixante-cinq ans ce soir-là.", de: "Edmund Ashgrove wurde an diesem Abend fünfundsechzig." } },
          ],
        },
      ],
    },
  ],
};
