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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "The Regent, New Year’s Eve. It was the partner.", nl: "The Regent, oudejaarsavond. Het was de partner.", fr: "Le Regent, la Saint-Sylvestre. C’était l’associé.", de: "Das Regent, Silvester. Es war der Partner." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Howard Fowler had taken sixty-one thousand dollars from his own clients. Gilbert Ames found out over Christmas, and gave him until after midnight to sign a confession.", nl: "Howard Fowler had eenenzestigduizend dollar van zijn eigen klanten gestolen. Gilbert Ames ontdekte het met Kerstmis, en gaf hem tot na middernacht om een bekentenis te tekenen.", fr: "Howard Fowler avait détourné soixante et un mille dollars de ses propres clients. Gilbert Ames l’a découvert à Noël et lui a laissé jusqu’après minuit pour signer des aveux.", de: "Howard Fowler hatte einundsechzigtausend Dollar von seinen eigenen Mandanten genommen. Gilbert Ames entdeckte es über Weihnachten und gab ihm bis nach Mitternacht Zeit, ein Geständnis zu unterschreiben." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "The ballroom clock ran ten minutes fast, so the room cheered at ten to twelve. In the noise Fowler went upstairs, killed his partner, and was back at the table when the real midnight came.", nl: "De klok in de balzaal liep tien minuten voor, dus de zaal juichte om tien voor twaalf. In het lawaai ging Fowler naar boven, doodde zijn partner, en zat weer aan tafel toen het echt middernacht werd.", fr: "L’horloge de la salle de bal avançait de dix minutes ; la salle a donc acclamé à minuit moins dix. Dans le vacarme, Fowler est monté, a tué son associé, et il était de retour à table au vrai minuit.", de: "Die Uhr im Ballsaal ging zehn Minuten vor, also jubelte der Saal um zehn vor zwölf. Im Lärm ging Fowler nach oben, tötete seinen Partner und saß wieder am Tisch, als die echte Mitternacht kam." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "The switchboard clock proved Ames was still alive after the countdown. And Fowler’s spattered gloves had his laundry mark in them.", nl: "De klok van de telefooncentrale bewees dat Ames na het aftellen nog leefde. En in Fowlers bespatte handschoenen zat zijn wasmerk.", fr: "L’horloge du standard a prouvé qu’Ames vivait encore après le compte à rebours. Et les gants tachés de Fowler portaient sa marque de blanchisserie.", de: "Die Uhr der Vermittlung bewies, dass Ames nach dem Countdown noch lebte. Und in Fowlers bespritzten Handschuhen war sein Wäschezeichen." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "So it was not Vance. Again. He raised his glass to you and went home.", nl: "Het was dus niet Vance. Alweer niet. Hij hief zijn glas naar je en ging naar huis.", fr: "Ce n’était donc pas Vance. Encore une fois. Il a levé son verre à votre santé et il est rentré chez lui.", de: "Es war also nicht Vance. Wieder nicht. Er hob sein Glas auf dich und ging nach Hause." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "But Clara took Gilbert Ames’s folder home in her own briefcase. He had only got halfway through the trust.", nl: "Maar Clara nam de map van Gilbert Ames mee naar huis in haar eigen aktetas. Hij was maar tot de helft van het fonds gekomen.", fr: "Mais Clara a emporté le dossier de Gilbert Ames chez elle, dans sa propre serviette. Il n’était arrivé qu’à la moitié du fonds.", de: "Aber Clara nahm Gilbert Ames’ Mappe in ihrer eigenen Aktentasche mit nach Hause. Er war nur bis zur Hälfte des Fonds gekommen." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Halfway was enough. For years, small sums had left her father’s money, always signed off by the trustee himself.", nl: "De helft was genoeg. Jarenlang waren er kleine bedragen uit het geld van haar vader verdwenen, telkens afgetekend door de beheerder zelf.", fr: "La moitié suffisait. Pendant des années, de petites sommes avaient quitté l’argent de son père, toujours validées par l’administrateur lui-même.", de: "Die Hälfte genügte. Jahrelang waren kleine Summen aus dem Geld ihres Vaters verschwunden, immer vom Treuhänder selbst abgezeichnet." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "She did not know yet who she could tell. And in February the city found you another death, one that had nothing to do with any of it.", nl: "Ze wist nog niet wie ze het kon vertellen. En in februari bezorgde de stad je weer een dode, een die er helemaal niets mee te maken had.", fr: "Elle ne savait pas encore à qui en parler. Et en février, la ville vous a trouvé une autre mort, qui n’avait rien à voir avec tout cela.", de: "Sie wusste noch nicht, wem sie es sagen konnte. Und im Februar fand die Stadt einen weiteren Toten für dich, einen, der mit alldem nichts zu tun hatte." } },
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
            { kind: 'caption', x: 3, y: 4, w: 56, clear: true, text: { en: "The Calder City Public Library stays open late on Fridays. That night it began to snow at a quarter to eight, and almost nobody came.", nl: "De openbare bibliotheek van Calder City blijft op vrijdag laat open. Die avond begon het om kwart voor acht te sneeuwen, en er kwam bijna niemand.", fr: "La bibliothèque municipale de Calder City ferme tard le vendredi. Ce soir-là, il s’est mis à neiger à huit heures moins le quart, et presque personne n’est venu.", de: "Die Stadtbibliothek von Calder City hat freitags lange geöffnet. An diesem Abend begann es um Viertel vor acht zu schneien, und es kam fast niemand." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Miss Agnes Thorne, sixty-one, keeper of the rare books for thirty years. Small, sharp, and terrifying to anyone who touched a book with unwashed hands.", nl: "Juffrouw Agnes Thorne, eenenzestig, al dertig jaar beheerder van de zeldzame boeken. Klein, scherp, en de schrik van iedereen die een boek aanraakte met ongewassen handen.", fr: "Mlle Agnes Thorne, soixante et un ans, conservatrice des livres rares depuis trente ans. Petite, vive, et la terreur de quiconque touchait un livre sans s’être lavé les mains.", de: "Miss Agnes Thorne, einundsechzig, seit dreißig Jahren Hüterin der seltenen Bücher. Klein, scharf und der Schrecken aller, die ein Buch mit ungewaschenen Händen anfassten." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "She worked alone in the annex, a small building across the courtyard.", nl: "Ze werkte alleen in het bijgebouw, een klein gebouw aan de overkant van de binnenplaats.", fr: "Elle travaillait seule dans l’annexe, un petit bâtiment de l’autre côté de la cour.", de: "Sie arbeitete allein im Anbau, einem kleinen Gebäude auf der anderen Seite des Hofs." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "At twenty-five past nine she was found dead at her desk, struck with her own brass book press. She died between half past eight and nine.", nl: "Om vijf voor half tien werd ze dood aan haar bureau gevonden, geslagen met haar eigen koperen boekenpers. Ze stierf tussen half negen en negen.", fr: "À neuf heures vingt-cinq, on l’a trouvée morte à son bureau, frappée avec sa propre presse à livres en laiton. Elle est morte entre huit heures et demie et neuf heures.", de: "Um fünf vor halb zehn wurde sie tot an ihrem Schreibtisch gefunden, erschlagen mit ihrer eigenen Buchpresse aus Messing. Sie starb zwischen halb neun und neun." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Before that, only one line of footprints crossed the snow to the annex: her own.", nl: "Daarvoor liep er maar één spoor van voetstappen door de sneeuw naar het bijgebouw: dat van haarzelf.", fr: "Avant cela, une seule ligne de pas traversait la neige jusqu’à l’annexe : la sienne.", de: "Davor führte nur eine einzige Fußspur durch den Schnee zum Anbau: ihre eigene." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "So how did the killer reach her? Five people were in the library that evening, and none of them walked on the snow.", nl: "Hoe kwam de moordenaar dan bij haar? Die avond waren er vijf mensen in de bibliotheek, en geen van hen liep door de sneeuw.", fr: "Alors comment le meurtrier l’a-t-il rejointe ? Cinq personnes se trouvaient à la bibliothèque ce soir-là, et aucune n’a marché dans la neige.", de: "Wie kam der Mörder dann zu ihr? Fünf Menschen waren an diesem Abend in der Bibliothek, und keiner von ihnen ging durch den Schnee." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Graham Oakes, forty-five, her deputy. He says he was on the reference desk all evening.", nl: "Graham Oakes, vijfenveertig, haar plaatsvervanger. Hij zegt dat hij de hele avond aan de inlichtingenbalie zat.", fr: "Graham Oakes, quarante-cinq ans, son adjoint. Il dit être resté toute la soirée au bureau des renseignements.", de: "Graham Oakes, fünfundvierzig, ihr Stellvertreter. Er sagt, er habe den ganzen Abend an der Auskunft gesessen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Oliver Prentice, a dealer in rare books. He had an appointment with her at nine, and arrived late by taxi.", nl: "Oliver Prentice, handelaar in zeldzame boeken. Hij had om negen uur een afspraak met haar, en kwam te laat aan met een taxi.", fr: "Oliver Prentice, marchand de livres rares. Il avait rendez-vous avec elle à neuf heures et il est arrivé en retard, en taxi.", de: "Oliver Prentice, ein Händler für seltene Bücher. Er hatte um neun einen Termin bei ihr und kam verspätet mit dem Taxi." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Rosa Lindqvist, a history student, reads at the window table every night. From there she can see the courtyard.", nl: "Rosa Lindqvist, studente geschiedenis, leest elke avond aan de tafel bij het raam. Van daaruit ziet ze de binnenplaats.", fr: "Rosa Lindqvist, étudiante en histoire, lit chaque soir à la table près de la fenêtre. De là, elle voit la cour.", de: "Rosa Lindqvist, Geschichtsstudentin, liest jeden Abend am Fenstertisch. Von dort sieht sie den Hof." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Abe Kowalski, the night porter, keeps the keys of the building on a board in the cellar.", nl: "Abe Kowalski, de nachtportier, bewaart de sleutels van het gebouw op een bord in de kelder.", fr: "Abe Kowalski, le portier de nuit, garde les clés du bâtiment sur un tableau à la cave.", de: "Abe Kowalski, der Nachtportier, verwahrt die Schlüssel des Gebäudes an einem Brett im Keller." } },
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
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', text: { en: "In the morning she was dead, and the only footprints were her own.", nl: "’s Ochtends was ze dood, en de enige voetstappen waren die van haarzelf.", fr: "Au matin elle était morte, et les seules traces de pas étaient les siennes.", de: "Am Morgen war sie tot, und die einzigen Fußspuren waren ihre eigenen." } },
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', clear: true, text: { en: "Somebody reached that annex without walking on the snow. Find out how, and you will know who.", nl: "Iemand bereikte dat bijgebouw zonder door de sneeuw te lopen. Zoek uit hoe, en je weet wie.", fr: "Quelqu’un a atteint cette annexe sans marcher dans la neige. Trouvez comment, et vous saurez qui.", de: "Jemand erreichte diesen Anbau, ohne durch den Schnee zu gehen. Finde heraus, wie, und du weißt, wer." } },
          ],
        },
      ],
    },
  ],
};
