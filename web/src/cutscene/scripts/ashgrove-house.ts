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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "The Hotel Cardinal, three days earlier. Your first case.", nl: "Het Hotel Cardinal, drie dagen eerder. Je eerste zaak.", fr: "L’Hôtel Cardinal, trois jours plus tôt. Votre première affaire.", de: "Das Hotel Cardinal, drei Tage zuvor. Dein erster Fall." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "It was the night clerk. Leonard Pike had been taking money from the office safe with the second key, to pay his debts at the card table in Rudy’s bar.", nl: "Het was de nachtportier. Leonard Pike haalde met de tweede sleutel geld uit de kluis, om zijn schulden aan de kaarttafel van Rudy’s bar te betalen.", fr: "C’était le veilleur de nuit. Leonard Pike prenait de l’argent dans le coffre avec la seconde clé, pour payer ses dettes à la table de jeu du bar de Rudy.", de: "Es war der Nachtportier. Leonard Pike nahm mit dem zweiten Schlüssel Geld aus dem Safe, um seine Schulden am Kartentisch in Rudys Bar zu bezahlen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Walter Finch found out and meant to call the police in the morning. At eleven Pike crept in to put money back. Finch was still there.", nl: "Walter Finch kwam erachter en wilde de volgende ochtend de politie bellen. Om elf uur sloop Pike naar binnen om geld terug te leggen. Finch zat er nog.", fr: "Walter Finch l’a découvert et comptait appeler la police le lendemain matin. À onze heures, Pike s’est glissé dans le bureau pour remettre de l’argent. Finch y était encore.", de: "Walter Finch kam dahinter und wollte am Morgen die Polizei rufen. Um elf schlich Pike hinein, um Geld zurückzulegen. Finch war noch da." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Pike swore he never left the desk. But a guest had stood there ringing the bell for a quarter of an hour, and left a note to say so. That note broke his story.", nl: "Pike zwoer dat hij de balie niet had verlaten. Maar een gast had er een kwartier staan bellen, en liet een briefje achter om dat te melden. Dat briefje brak zijn verhaal.", fr: "Pike jurait n’avoir jamais quitté la réception. Mais un client y avait sonné pendant un quart d’heure et avait laissé un mot pour le dire. Ce mot a brisé son histoire.", de: "Pike schwor, er habe die Rezeption nie verlassen. Aber ein Gast hatte dort eine Viertelstunde geklingelt und einen Zettel hinterlassen. Dieser Zettel brachte seine Geschichte zu Fall." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Your first case, closed before breakfast. The Captain called it beginner’s luck.", nl: "Je eerste zaak, gesloten voor het ontbijt. De Captain noemde het beginnersgeluk.", fr: "Votre première affaire, bouclée avant le petit-déjeuner. Le capitaine a parlé de chance du débutant.", de: "Dein erster Fall, gelöst vor dem Frühstück. Der Captain nannte es Anfängerglück." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "You pinned the card to a board above your desk anyway. A habit you would keep.", nl: "Je prikte de kaart toch op een bord boven je bureau. Een gewoonte die je zou houden.", fr: "Vous avez quand même épinglé la fiche au-dessus de votre bureau. Une habitude que vous alliez garder.", de: "Du hast die Karte trotzdem über deinem Schreibtisch angepinnt. Eine Gewohnheit, die du behalten würdest." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "It taught you the rule of this job: everybody has a story for the hour that matters. Your work is to find the one thing that does not fit it.", nl: "Het leerde je de regel van dit vak: iedereen heeft een verhaal voor het uur dat ertoe doet. Jouw werk is het ene ding vinden dat er niet in past.", fr: "Vous y avez appris la règle du métier : chacun a une histoire pour l’heure qui compte. Votre travail est de trouver le seul détail qui n’y entre pas.", de: "Es lehrte dich die Regel dieses Berufs: Jeder hat eine Geschichte für die Stunde, auf die es ankommt. Deine Arbeit ist, das eine zu finden, das nicht hineinpasst." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Three nights later, on Saturday 16 October, the telephone rang again. This time it was no small hotel.", nl: "Drie nachten later, op zaterdag 16 oktober, ging de telefoon weer. Dit keer was het geen klein hotel.", fr: "Trois nuits plus tard, le samedi 16 octobre, le téléphone a sonné de nouveau. Cette fois, ce n’était pas un petit hôtel.", de: "Drei Nächte später, am Samstag, dem 16. Oktober, klingelte das Telefon wieder. Diesmal war es kein kleines Hotel." } },
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
            { kind: 'caption', x: 3, y: 4, w: 60, clear: true, text: { en: "Ashgrove House stands on the cliffs twelve miles north of the city, at the end of a road that was more mud than gravel that night.", nl: "Ashgrove House staat op de kliffen, twintig kilometer ten noorden van de stad, aan het eind van een weg die die nacht meer modder was dan grind.", fr: "Ashgrove House se dresse sur les falaises, à vingt kilomètres au nord de la ville, au bout d’une route qui, cette nuit-là, était plus boue que gravier.", de: "Ashgrove House steht auf den Klippen, zwanzig Kilometer nördlich der Stadt, am Ende einer Straße, die in dieser Nacht mehr Schlamm als Kies war." } },
            { kind: 'caption', x: 37, y: 94, w: 60, from: 'bottom', text: { en: "Inside, a birthday dinner for four had ended with one of them dead in his chair.", nl: "Binnen was een verjaardagsdiner voor vier geëindigd met een van hen dood in zijn stoel.", fr: "À l’intérieur, un dîner d’anniversaire à quatre s’était achevé avec l’un d’eux mort dans son fauteuil.", de: "Drinnen hatte ein Geburtstagsessen zu viert damit geendet, dass einer von ihnen tot in seinem Sessel saß." } },
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
            { kind: 'caption', x: 3, y: 15, w: 46, text: { en: "Leonard Vance, the family’s lawyer, had driven down the cliff road to the nearest telephone.", nl: "Leonard Vance, de advocaat van de familie, was de klifweg afgereden naar de dichtstbijzijnde telefoon.", fr: "Leonard Vance, l’avocat de la famille, avait descendu la route de la falaise jusqu’au téléphone le plus proche.", de: "Leonard Vance, der Anwalt der Familie, war die Klippenstraße hinunter zum nächsten Telefon gefahren." } },
            { kind: 'balloon', x: 4, y: 62, w: 44, tail: { x: 66, y: 30 }, text: { en: "They are all still in the house, Detective. Edmund Ashgrove is dead.", nl: "Ze zijn allemaal nog in het huis, rechercheur. Edmund Ashgrove is dood.", fr: "Ils sont tous encore dans la maison, inspecteur. Edmund Ashgrove est mort.", de: "Sie sind alle noch im Haus, Detective. Edmund Ashgrove ist tot." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "This is the first time you meet Leonard Vance. Polite, calm and very helpful. Remember his face. You will see it again.", nl: "Dit is de eerste keer dat je Leonard Vance ontmoet. Beleefd, kalm en heel behulpzaam. Onthoud zijn gezicht. Je gaat het vaker zien.", fr: "C’est la première fois que vous rencontrez Leonard Vance. Poli, calme et très serviable. Retenez son visage. Vous le reverrez.", de: "Hier begegnest du Leonard Vance zum ersten Mal. Höflich, ruhig und sehr hilfsbereit. Merk dir sein Gesicht. Du wirst es wiedersehen." } },
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
            { kind: 'caption', x: 3, y: 94, w: 70, from: 'bottom', text: { en: "The dead man is Edmund Ashgrove, sixty-five today. He built Ashgrove Shipping from a single boat, and half the cargo on the Calder waterfront now sails under his flag. He was hard, proud, and he wrote everything down.", nl: "De dode is Edmund Ashgrove, vandaag vijfenzestig. Hij bouwde Ashgrove Shipping op uit één boot, en de helft van de lading in de haven van Calder vaart nu onder zijn vlag. Hij was hard, trots, en hij schreef alles op.", fr: "Le mort est Edmund Ashgrove, soixante-cinq ans aujourd’hui. Il a bâti Ashgrove Shipping à partir d’un seul bateau, et la moitié des cargaisons du port de Calder navigue sous son pavillon. Dur, fier, il notait tout.", de: "Der Tote ist Edmund Ashgrove, heute fünfundsechzig. Er hat Ashgrove Shipping aus einem einzigen Boot aufgebaut, und die Hälfte der Fracht im Hafen von Calder fährt unter seiner Flagge. Er war hart, stolz und schrieb alles auf." } },
            { kind: 'caption', x: 3, y: 4, w: 70, clear: true, text: { en: "He had a weak heart and lived on digitalis drops. Tonight somebody emptied the whole bottle into his after-dinner brandy. Three people had sat at his table.", nl: "Hij had een zwak hart en leefde op digitalisdruppels. Vanavond goot iemand het hele flesje in zijn cognac na het eten. Drie mensen hadden bij hem aan tafel gezeten.", fr: "Il avait le cœur fragile et vivait de gouttes de digitaline. Ce soir, quelqu’un a vidé tout le flacon dans son cognac d’après dîner. Trois personnes étaient à sa table.", de: "Er hatte ein schwaches Herz und lebte von Digitalistropfen. Heute Abend hat jemand die ganze Flasche in seinen Brandy nach dem Essen geleert. Drei Menschen hatten an seinem Tisch gesessen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Clara Ashgrove, thirty-two, his daughter. She runs the company’s offices on Pier Seventeen, and expects to run all of it one day.", nl: "Clara Ashgrove, tweeëndertig, zijn dochter. Ze leidt de kantoren van het bedrijf op Pier Seventeen, en rekent erop ooit alles te leiden.", fr: "Clara Ashgrove, trente-deux ans, sa fille. Elle dirige les bureaux de la compagnie sur le Pier Seventeen et compte bien tout diriger un jour.", de: "Clara Ashgrove, zweiunddreißig, seine Tochter. Sie leitet die Büros der Firma auf Pier Seventeen und rechnet damit, eines Tages alles zu leiten." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Simon Whitlock, her husband. An investor: charming, well dressed, and always a little short of money.", nl: "Simon Whitlock, haar man. Een belegger: charmant, goed gekleed, en altijd een beetje krap bij kas.", fr: "Simon Whitlock, son mari. Un investisseur : charmant, bien habillé, et toujours un peu à court d’argent.", de: "Simon Whitlock, ihr Mann. Ein Investor: charmant, gut gekleidet und immer ein wenig knapp bei Kasse." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Leonard Vance, the family lawyer. He manages the Ashgrove Family Trust, the fund where most of the family’s money is kept.", nl: "Leonard Vance, de advocaat van de familie. Hij beheert het Ashgrove-familiefonds, waar het meeste geld van de familie in zit.", fr: "Leonard Vance, l’avocat de la famille. Il gère le fonds familial Ashgrove, où se trouve presque tout l’argent de la famille.", de: "Leonard Vance, der Anwalt der Familie. Er verwaltet den Ashgrove-Familienfonds, in dem das meiste Geld der Familie liegt." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "All three were in the house between nine and ten. All three say they never went near his glass.", nl: "Alle drie waren ze tussen negen en tien in huis. Alle drie zeggen ze dat ze niet bij zijn glas kwamen.", fr: "Tous trois étaient dans la maison entre neuf et dix heures. Tous trois affirment ne pas s’être approchés de son verre.", de: "Alle drei waren zwischen neun und zehn im Haus. Alle drei sagen, sie seien nie in die Nähe seines Glases gekommen." } },
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
            { kind: 'caption', x: 3, y: 4, w: 58, text: { en: "Edmund was found at five to ten in his armchair by the study fire, his brandy glass beside him. Everybody in the house knew that glass. He filled it himself at half past nine, every night.", nl: "Edmund werd om vijf voor tien gevonden in zijn leunstoel bij het haardvuur, met zijn cognacglas naast zich. Iedereen in huis kende dat glas. Hij schonk het elke avond om half tien zelf in.", fr: "Edmund a été trouvé à dix heures moins cinq dans son fauteuil, près du feu, son verre de cognac à côté de lui. Toute la maison connaissait ce verre. Il le remplissait lui-même à neuf heures et demie, chaque soir.", de: "Edmund wurde um fünf vor zehn in seinem Sessel am Kamin gefunden, das Brandyglas neben sich. Jeder im Haus kannte dieses Glas. Er füllte es jeden Abend um halb zehn selbst." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "On his desk lay a codicil, a change to his will, dated that same day. It would have put the family money in other hands. Nobody had signed it.", nl: "Op zijn bureau lag een codicil, een wijziging van zijn testament, van die dag zelf. Het zou het familiegeld in andere handen hebben gelegd. Niemand had het getekend.", fr: "Sur son bureau, un codicille, une modification de son testament, daté du jour même. Il aurait confié l’argent de la famille à d’autres mains. Personne ne l’avait signé.", de: "Auf seinem Schreibtisch lag ein Kodizill, eine Änderung seines Testaments, vom selben Tag. Es hätte das Familiengeld in andere Hände gelegt. Niemand hatte es unterschrieben." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "Edmund wrote everything down: telephone calls, visitors, the time of day. Tonight, one of those notes might be enough to hang somebody.", nl: "Edmund schreef alles op: telefoontjes, bezoek, het uur van de dag. Vannacht kon één van die notities genoeg zijn om iemand te laten hangen.", fr: "Edmund notait tout : les appels, les visites, l’heure qu’il était. Cette nuit, une seule de ces notes pouvait suffire à envoyer quelqu’un à la potence.", de: "Edmund schrieb alles auf: Anrufe, Besucher, die Uhrzeit. Heute Nacht konnte eine dieser Notizen genügen, um jemanden an den Galgen zu bringen." } },
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
            { kind: 'caption', x: 24.0, y: 94, w: 52, from: 'bottom', text: { en: "Edmund Ashgrove turned sixty-five that night.", nl: "Edmund Ashgrove werd die avond vijfenzestig.", fr: "Edmund Ashgrove fêtait ses soixante-cinq ans ce soir-là.", de: "Edmund Ashgrove wurde an diesem Abend fünfundsechzig." } },
            { kind: 'caption', x: 21.0, y: 94, w: 58, from: 'bottom', clear: true, text: { en: "Search the house and question the three of them. Find out who went near that glass, why, and how.", nl: "Doorzoek het huis en ondervraag ze alle drie. Zoek uit wie bij dat glas kwam, waarom, en hoe.", fr: "Fouillez la maison et interrogez-les tous les trois. Découvrez qui s’est approché de ce verre, pourquoi, et comment.", de: "Durchsuche das Haus und befrage alle drei. Finde heraus, wer an dieses Glas kam, warum und wie." } },
          ],
        },
      ],
    },
  ],
};
