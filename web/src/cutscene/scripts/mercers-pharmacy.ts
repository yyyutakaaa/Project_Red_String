// The comic strip that opens mercers-pharmacy. Panel art: src/assets/art/cutscenes/mercers-pharmacy/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const mercersPharmacyCutscene: Cutscene = {
  id: 'mercers-pharmacy',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "The library, February. It was the deputy.", nl: "De bibliotheek, februari. Het was de plaatsvervanger.", fr: "La bibliothèque, février. C’était l’adjoint.", de: "Die Bibliothek, Februar. Es war der Stellvertreter." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Graham Oakes had been swapping the library’s rare books for cheap copies and selling the real ones. That evening Agnes Thorne opened one of them and knew at once it was not hers.", nl: "Graham Oakes verving de zeldzame boeken van de bibliotheek door goedkope exemplaren en verkocht de echte. Die avond sloeg Agnes Thorne er een open en zag meteen dat het niet het hare was.", fr: "Graham Oakes remplaçait les livres rares de la bibliothèque par des exemplaires bon marché et vendait les vrais. Ce soir-là, Agnes Thorne en a ouvert un et a su aussitôt que ce n’était pas le sien.", de: "Graham Oakes tauschte die seltenen Bücher der Bibliothek gegen billige Exemplare und verkaufte die echten. An jenem Abend schlug Agnes Thorne eines auf und wusste sofort, dass es nicht ihres war." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "She called him to her desk with the inventory. He took the tunnel key from the porter’s board and went under the courtyard through the old heating tunnel. Nobody walked on the snow.", nl: "Ze riep hem bij zich met de inventaris. Hij nam de tunnelsleutel van het bord van de portier en ging onder de binnenplaats door, via de oude verwarmingstunnel. Niemand liep door de sneeuw.", fr: "Elle l’a convoqué à son bureau avec l’inventaire. Il a pris la clé du tunnel au tableau du portier et il est passé sous la cour par l’ancien tunnel de chauffage. Personne n’a marché dans la neige.", de: "Sie rief ihn mit dem Inventar zu sich. Er nahm den Tunnelschlüssel vom Brett des Portiers und ging durch den alten Heizungstunnel unter dem Hof hindurch. Niemand ging durch den Schnee." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "But the whitewash of the tunnel was on his jacket, and Agnes had hidden a note inside the false book.", nl: "Maar de witkalk van de tunnel zat op zijn jasje, en Agnes had een briefje in het valse boek verstopt.", fr: "Mais la chaux du tunnel avait marqué sa veste, et Agnes avait caché un mot dans le faux livre.", de: "Aber die Tünche des Tunnels war an seiner Jacke, und Agnes hatte einen Zettel in dem falschen Buch versteckt." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Spring 1950. Nine cards on your board now. Four of them had the same name on them.", nl: "Voorjaar 1950. Negen kaarten op je bord nu. Op vier ervan stond dezelfde naam.", fr: "Printemps 1950. Neuf fiches au tableau, désormais. Quatre portaient le même nom.", de: "Frühjahr 1950. Jetzt neun Karten am Brett. Auf vier davon stand derselbe Name." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Leonard Vance. Ashgrove House, the Blue Lantern, Pier Seventeen, the Regent. Never the killer. Always in the room.", nl: "Leonard Vance. Ashgrove House, de Blue Lantern, Pier Seventeen, de Regent. Nooit de dader. Altijd in de kamer.", fr: "Leonard Vance. Ashgrove House, le Blue Lantern, le Pier Seventeen, le Regent. Jamais le coupable. Toujours dans la pièce.", de: "Leonard Vance. Ashgrove House, das Blue Lantern, Pier Seventeen, das Regent. Nie der Täter. Immer im Raum." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Four times you had a reason to look at him, and four times somebody else confessed. The Captain told you to leave a respectable lawyer alone.", nl: "Vier keer had je een reden om naar hem te kijken, en vier keer bekende iemand anders. De Captain zei dat je een nette advocaat met rust moest laten.", fr: "Quatre fois vous avez eu une raison de le regarder de près, et quatre fois quelqu’un d’autre a avoué. Le capitaine vous a dit de laisser tranquille un avocat respectable.", de: "Viermal hattest du einen Grund, ihn dir anzusehen, und viermal gestand jemand anderes. Der Captain sagte, du sollst einen ehrbaren Anwalt in Ruhe lassen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Then, in April, a pharmacist died on Calloway Street. And at your own station you found a small thing that would not let you go.", nl: "Toen stierf er in april een apotheker in Calloway Street. En op je eigen bureau vond je iets kleins dat je niet meer losliet.", fr: "Puis, en avril, un pharmacien est mort sur Calloway Street. Et dans votre propre commissariat, vous avez trouvé un petit détail qui ne vous a plus lâché.", de: "Dann starb im April ein Apotheker in der Calloway Street. Und auf deiner eigenen Wache fandest du eine Kleinigkeit, die dich nicht mehr losließ." } },
          ],
        },
      ],
    },
    {
      id: 'shop',
      columns: '1fr 1.25fr',
      rows: '1fr 1fr',
      areas: ["tonic files", "stairs files"],
      panels: [
        {
          id: 'tonic',
          drift: 'in',
          layers: [
            { art: 'tonic', depth: 0.08 },
            { art: 'tonic-spoon', depth: 0.6, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 2, w: 34, text: { en: "Mercer's Pharmacy, Calloway Street. April 1950.", nl: "Mercer's Pharmacy, Calloway Street. April 1950.", fr: "La pharmacie Mercer, Calloway Street. Avril 1950.", de: "Mercers Apotheke, Calloway Street. April 1950." } },
            { kind: 'caption', x: 40, y: 76, w: 56, text: { en: "Every night at nine, Edgar Mercer took one spoonful of his tonic.", nl: "Elke avond om negen uur nam Edgar Mercer één lepel van zijn tonicum.", fr: "Chaque soir à neuf heures, Edgar Mercer prenait une cuillerée de son tonique.", de: "Jeden Abend um neun nahm Edgar Mercer einen Löffel seines Tonikums." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Edgar Mercer, sixty-three, had stood behind that counter for thirty-nine years. He checked every prescription twice and never forgot a name.", nl: "Edgar Mercer, drieënzestig, stond al negenendertig jaar achter die toonbank. Hij controleerde elk recept twee keer en vergat nooit een naam.", fr: "Edgar Mercer, soixante-trois ans, se tenait derrière ce comptoir depuis trente-neuf ans. Il vérifiait chaque ordonnance deux fois et n’oubliait jamais un nom.", de: "Edgar Mercer, dreiundsechzig, stand seit neununddreißig Jahren hinter dieser Theke. Er prüfte jedes Rezept zweimal und vergaß nie einen Namen." } },
          ],
        },
        {
          id: 'stairs',
          drift: 'left',
          layers: [
            { art: 'stairs', depth: 0.08 },
            { art: 'stairs-doctor', depth: 0.5, enter: 'down', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "Dr. Pell's surgery was on the floor above.", nl: "De praktijk van dokter Pell zat een verdieping hoger.", fr: "Le cabinet du docteur Pell était à l'étage.", de: "Dr. Pells Praxis lag im Stock darüber." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Dr. Pell has had his surgery upstairs for twelve years. The pharmacy fills all his prescriptions.", nl: "Dokter Pell heeft al twaalf jaar zijn praktijk boven de zaak. De apotheek maakt al zijn recepten klaar.", fr: "Le docteur Pell a son cabinet à l’étage depuis douze ans. La pharmacie exécute toutes ses ordonnances.", de: "Dr. Pell hat seit zwölf Jahren seine Praxis im Stock darüber. Die Apotheke führt alle seine Rezepte aus." } },
          ],
        },
        {
          id: 'files',
          drift: 'right',
          layers: [
            { art: 'files', depth: 0.08 },
            { art: 'files-stack', depth: 0.6, enter: 'zoom', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "At Central Station, his complaint from last year was already a closed file.", nl: "Op Central Station was zijn aangifte van vorig jaar al een gesloten dossier.", fr: "À Central Station, sa plainte de l'an dernier était déjà un dossier classé.", de: "Auf der Central Station war seine Anzeige vom letzten Jahr längst eine geschlossene Akte." } },
            { kind: 'caption', x: 3, y: 76, w: 62, text: { en: "Nobody at the station could tell you who had closed it, or why.", nl: "Niemand op het bureau kon je zeggen wie het had gesloten, of waarom.", fr: "Personne au commissariat ne pouvait vous dire qui l’avait classé, ni pourquoi.", de: "Niemand auf dem Revier konnte dir sagen, wer sie geschlossen hatte, oder warum." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "A year earlier Edgar Mercer had walked into your own station to report something. The file was closed within a week.", nl: "Een jaar eerder was Edgar Mercer je eigen bureau binnengelopen om iets te melden. Het dossier werd binnen een week gesloten.", fr: "Un an plus tôt, Edgar Mercer était entré dans votre propre commissariat pour signaler quelque chose. Le dossier a été classé en une semaine.", de: "Ein Jahr zuvor war Edgar Mercer in deine eigene Wache gekommen, um etwas zu melden. Die Akte wurde binnen einer Woche geschlossen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "It is a small thing. You wrote it down anyway.", nl: "Het is iets kleins. Je schreef het toch op.", fr: "C’est un détail. Vous l’avez noté quand même.", de: "Es ist eine Kleinigkeit. Du hast sie trotzdem notiert." } },
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
          ],
          beats: [
            { kind: 'caption', x: 3, y: 94, w: 74, from: 'bottom', text: { en: "At ten past nine Edgar Mercer fell down behind his counter, and he was dead before the ambulance came. Strychnine, in the nerve tonic he took every night at nine. The question is not who was there at nine. It is when the poison went into the bottle.", nl: "Om tien over negen zakte Edgar Mercer achter zijn toonbank in elkaar, en hij was dood voor de ambulance er was. Strychnine, in het zenuwtonicum dat hij elke avond om negen uur nam. De vraag is niet wie er om negen uur was. De vraag is wanneer het gif in de fles ging.", fr: "À neuf heures dix, Edgar Mercer s’est effondré derrière son comptoir, et il était mort avant l’arrivée de l’ambulance. De la strychnine, dans le tonique qu’il prenait chaque soir à neuf heures. La question n’est pas de savoir qui était là à neuf heures, mais quand le poison est entré dans le flacon.", de: "Um zehn nach neun brach Edgar Mercer hinter seiner Theke zusammen, und er war tot, bevor der Krankenwagen kam. Strychnin, im Nerventonikum, das er jeden Abend um neun nahm. Die Frage ist nicht, wer um neun da war. Die Frage ist, wann das Gift in die Flasche kam." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Nathan Mercer, thirty-four, his son and partner. He says he was out on deliveries until half past eight, then did the accounts in the back.", nl: "Nathan Mercer, vierendertig, zijn zoon en partner. Hij zegt dat hij tot half negen bestellingen rondbracht en daarna achter de boekhouding deed.", fr: "Nathan Mercer, trente-quatre ans, son fils et associé. Il dit avoir fait les livraisons jusqu’à huit heures et demie, puis les comptes dans l’arrière-boutique.", de: "Nathan Mercer, vierunddreißig, sein Sohn und Partner. Er sagt, er sei bis halb neun auf Liefertour gewesen und habe dann hinten die Abrechnung gemacht." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Lucille, his wife. She says she spent the day with her sister in Eastbank and walked in on the ambulance.", nl: "Lucille, zijn vrouw. Ze zegt dat ze de dag bij haar zus in Eastbank doorbracht en binnenkwam toen de ambulance er al stond.", fr: "Lucille, sa femme. Elle dit avoir passé la journée chez sa sœur à Eastbank et être rentrée au moment où l’ambulance était là.", de: "Lucille, seine Frau. Sie sagt, sie habe den Tag bei ihrer Schwester in Eastbank verbracht und sei erst zum Krankenwagen zurückgekommen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Helen Voss runs the soda fountain and sees everyone who comes in. She closed at six and went home.", nl: "Helen Voss staat achter de frisdrankbar en ziet iedereen die binnenkomt. Ze sloot om zes uur en ging naar huis.", fr: "Helen Voss tient le comptoir à sodas et voit tous ceux qui entrent. Elle a fermé à six heures et elle est rentrée chez elle.", de: "Helen Voss führt die Sodabar und sieht jeden, der hereinkommt. Sie schloss um sechs und ging nach Hause." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Dr. Raymond Pell, from the surgery upstairs. He spent the whole evening at St. Columba’s Hospital, delivering a baby in front of three nurses.", nl: "Dokter Raymond Pell, van de praktijk boven. Hij was de hele avond in het St. Columba-ziekenhuis, waar hij een kind ter wereld hielp voor de ogen van drie verpleegsters.", fr: "Le docteur Raymond Pell, du cabinet à l’étage. Il a passé toute la soirée à l’hôpital St. Columba, à faire un accouchement devant trois infirmières.", de: "Dr. Raymond Pell aus der Praxis darüber. Er war den ganzen Abend im St.-Columba-Krankenhaus bei einer Entbindung, vor den Augen von drei Schwestern." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["front"],
      panels: [
        {
          id: 'front',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'front', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 25.0, y: 94, w: 50, from: 'bottom', text: { en: "At five past nine the tonic killed him.", nl: "Om vijf over negen werd het tonicum hem fataal.", fr: "À neuf heures cinq, le tonique l’a tué.", de: "Um fünf nach neun tötete ihn das Tonikum." } },
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', clear: true, text: { en: "Do not ask them where they were at nine o’clock. Ask them where they were when the poison went in.", nl: "Vraag ze niet waar ze om negen uur waren. Vraag ze waar ze waren toen het gif erin ging.", fr: "Ne leur demandez pas où ils étaient à neuf heures. Demandez-leur où ils étaient quand le poison a été versé.", de: "Frag sie nicht, wo sie um neun waren. Frag sie, wo sie waren, als das Gift hineinkam." } },
          ],
        },
      ],
    },
  ],
};
