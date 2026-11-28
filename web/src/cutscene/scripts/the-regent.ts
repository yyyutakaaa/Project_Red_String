// The comic strip that opens the-regent. Panel art: src/assets/art/cutscenes/the-regent/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const theRegentCutscene: Cutscene = {
  id: 'the-regent',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Radio Calder, October. It was the star.", nl: "Radio Calder, oktober. Het was de ster.", fr: "Radio Calder, octobre. C’était la vedette.", de: "Radio Calder, Oktober. Es war der Star." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Dorothy Vale’s real name was Dora Valinski. In 1938 she had done six months for passing bad cheques. Vernon Clay found out, and took two hundred dollars a month from her to keep quiet.", nl: "Dorothy Vale heette eigenlijk Dora Valinski. In 1938 had ze zes maanden gezeten voor valse cheques. Vernon Clay kwam erachter, en liet haar tweehonderd dollar per maand betalen voor zijn zwijgen.", fr: "Dorothy Vale s’appelait en réalité Dora Valinski. En 1938, elle avait fait six mois de prison pour chèques sans provision. Vernon Clay l’a appris et lui prenait deux cents dollars par mois pour se taire.", de: "Dorothy Vale hieß in Wahrheit Dora Valinski. 1938 hatte sie sechs Monate wegen ungedeckter Schecks gesessen. Vernon Clay fand es heraus und nahm ihr zweihundert Dollar im Monat für sein Schweigen ab." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "That night he doubled his price. But she had recorded her long speech on a disc that afternoon. While the record played on the air, she walked two doors down the corridor and strangled him.", nl: "Die avond verdubbelde hij zijn prijs. Maar ze had die middag haar lange monoloog op een plaat laten opnemen. Terwijl de plaat in de uitzending draaide, liep ze twee deuren verder de gang in en wurgde hem.", fr: "Ce soir-là, il a doublé son prix. Mais elle avait fait enregistrer son long monologue sur disque l’après-midi même. Pendant que le disque passait à l’antenne, elle a longé le couloir jusqu’à deux portes plus loin et l’a étranglé.", de: "An diesem Abend verdoppelte er seinen Preis. Aber sie hatte am Nachmittag ihren langen Monolog auf Platte aufnehmen lassen. Während die Platte auf Sendung lief, ging sie zwei Türen weiter den Gang hinunter und erdrosselte ihn." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "She was back at the microphone for her last lines. But one pearl earring lay under his desk.", nl: "Ze stond op tijd terug aan de microfoon voor haar laatste zinnen. Maar onder zijn bureau lag één pareloorbel.", fr: "Elle était revenue au micro pour ses dernières répliques. Mais une boucle d’oreille en perle était restée sous son bureau.", de: "Für ihre letzten Sätze stand sie wieder am Mikrofon. Aber unter seinem Schreibtisch lag ein Perlenohrring." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Meanwhile, on Pier Seventeen, Clara Ashgrove had been reading the accounts of her father’s trust. The figures were tidy. Too tidy.", nl: "Intussen zat Clara Ashgrove op Pier Seventeen de rekeningen van het fonds van haar vader te lezen. De cijfers waren netjes. Te netjes.", fr: "Pendant ce temps, au Pier Seventeen, Clara Ashgrove lisait les comptes du fonds de son père. Les chiffres étaient soignés. Trop soignés.", de: "Inzwischen las Clara Ashgrove auf Pier Seventeen die Abrechnungen des Fonds ihres Vaters. Die Zahlen waren ordentlich. Zu ordentlich." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "She remembered the codicil her father never signed, and Harold Pike’s folder that nobody ever found.", nl: "Ze dacht aan het codicil dat haar vader nooit tekende, en aan de map van Harold Pike die niemand ooit terugvond.", fr: "Elle repensait au codicille que son père n’avait jamais signé, et au dossier de Harold Pike que personne n’avait jamais retrouvé.", de: "Sie dachte an das Kodizill, das ihr Vater nie unterschrieb, und an Harold Pikes Mappe, die nie jemand fand." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "In December she hired an accountant, Gilbert Ames, to go through every page. Slow, thorough, and honest to the point of being dull.", nl: "In december huurde ze een accountant in, Gilbert Ames, om elke bladzijde na te lopen. Traag, grondig, en zo eerlijk dat het saai werd.", fr: "En décembre, elle a engagé un comptable, Gilbert Ames, pour vérifier chaque page. Lent, minutieux, et honnête jusqu’à l’ennui.", de: "Im Dezember engagierte sie einen Buchprüfer, Gilbert Ames, der jede Seite durchgehen sollte. Langsam, gründlich und ehrlich bis zur Langeweile." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Leonard Vance smiled and said she would find it all in order.", nl: "Leonard Vance glimlachte en zei dat ze alles in orde zou vinden.", fr: "Leonard Vance a souri et lui a dit qu’elle trouverait tout en ordre.", de: "Leonard Vance lächelte und sagte, sie werde alles in Ordnung finden." } },
          ],
        },
      ],
    },
    {
      id: 'ball',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["clock watch", "clock phone"],
      panels: [
        {
          id: 'clock',
          drift: 'in',
          layers: [
            { art: 'clock', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 60, text: { en: "The Regent Hotel, New Year's Eve, 1949.", nl: "Het Regent Hotel, oudejaarsavond 1949.", fr: "L'hôtel Regent, la Saint-Sylvestre 1949.", de: "Das Regent Hotel, Silvester 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Ashgrove Shipping threw the party, and everyone came.", nl: "Ashgrove Shipping gaf het feest, en iedereen kwam.", fr: "Ashgrove Shipping donnait la fête, et tout le monde était venu.", de: "Ashgrove Shipping gab das Fest, und alle kamen." } },
            { kind: 'caption', x: 3, y: 4, w: 62, clear: true, text: { en: "The Starlight Ballroom: a band, three hundred guests, a countdown and fireworks over the river. Clara had invited her accountant and his wife to her own table.", nl: "De Starlight Ballroom: een orkest, driehonderd gasten, aftellen en vuurwerk boven de rivier. Clara had haar accountant en zijn vrouw aan haar eigen tafel gevraagd.", fr: "La salle de bal Starlight : un orchestre, trois cents invités, un compte à rebours et un feu d’artifice sur le fleuve. Clara avait invité son comptable et sa femme à sa propre table.", de: "Der Starlight-Ballsaal: eine Band, dreihundert Gäste, ein Countdown und Feuerwerk über dem Fluss. Clara hatte ihren Buchprüfer und seine Frau an ihren eigenen Tisch gebeten." } },
            { kind: 'caption', x: 36, y: 94, w: 60, from: 'bottom', text: { en: "The big clock on the ballroom wall told everybody when to cheer.", nl: "De grote klok aan de wand van de balzaal vertelde iedereen wanneer ze moesten juichen.", fr: "La grande horloge au mur de la salle disait à tout le monde quand acclamer.", de: "Die große Uhr an der Wand des Ballsaals sagte allen, wann sie jubeln sollten." } },
          ],
        },
        {
          id: 'watch',
          drift: 'left',
          layers: [
            { art: 'watch', depth: 0.08 },
            { art: 'watch-man', depth: 0.6, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 3, y: 6, w: 42, tail: { x: 30, y: 40 }, text: { en: "Ten! Nine! Eight!", nl: "Tien! Negen! Acht!", fr: "Dix ! Neuf ! Huit !", de: "Zehn! Neun! Acht!" } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "The whole room counted down together and kissed at midnight. Or at what the ballroom called midnight.", nl: "De hele zaal telde samen af en kuste om middernacht. Of om wat de balzaal middernacht noemde.", fr: "Toute la salle a compté ensemble et s’est embrassée à minuit. Ou à ce que la salle de bal appelait minuit.", de: "Der ganze Saal zählte gemeinsam herunter und küsste sich um Mitternacht. Oder zu dem, was der Ballsaal Mitternacht nannte." } },
          ],
        },
        {
          id: 'phone',
          drift: 'right',
          layers: [
            { art: 'phone', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 56, text: { en: "Upstairs, in Suite 1204, nobody answered.", nl: "Boven, in suite 1204, nam niemand op.", fr: "En haut, dans la suite 1204, personne ne répondait.", de: "Oben, in Suite 1204, ging niemand ran." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Gilbert Ames had gone up to his suite. He rang the switchboard and asked for the house detective. Then the receiver fell.", nl: "Gilbert Ames was naar zijn suite gegaan. Hij belde de centrale en vroeg om de hoteldetective. Toen viel de hoorn.", fr: "Gilbert Ames était monté dans sa suite. Il a appelé le standard et demandé le détective de l’hôtel. Puis le combiné est tombé.", de: "Gilbert Ames war in seine Suite hinaufgegangen. Er rief die Vermittlung an und verlangte den Hoteldetektiv. Dann fiel der Hörer." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "He was found beside the telephone, struck twice with a champagne bottle.", nl: "Hij werd naast de telefoon gevonden, twee keer geslagen met een champagnefles.", fr: "On l’a trouvé près du téléphone, frappé deux fois avec une bouteille de champagne.", de: "Er wurde neben dem Telefon gefunden, zweimal mit einer Champagnerflasche geschlagen." } },
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
            { kind: 'caption', x: 3, y: 94, w: 74, from: 'bottom', text: { en: "Gilbert Ames had been reading the Ashgrove trust books for three weeks. Now he lay dead in Suite 1204. Four people from the Ashgrove table swear they were in the ballroom at midnight. All four are telling the truth about the countdown.", nl: "Gilbert Ames las al drie weken de boeken van het Ashgrove-fonds. Nu lag hij dood in suite 1204. Vier mensen van de Ashgrove-tafel zweren dat ze om middernacht in de balzaal waren. Over het aftellen spreken ze alle vier de waarheid.", fr: "Gilbert Ames épluchait les comptes du fonds Ashgrove depuis trois semaines. Il gisait maintenant, mort, dans la suite 1204. Quatre personnes de la table Ashgrove jurent qu’elles étaient dans la salle de bal à minuit. Toutes les quatre disent vrai sur le compte à rebours.", de: "Gilbert Ames las seit drei Wochen die Bücher des Ashgrove-Fonds. Jetzt lag er tot in Suite 1204. Vier Leute vom Ashgrove-Tisch schwören, sie seien um Mitternacht im Ballsaal gewesen. Was den Countdown angeht, sagen alle vier die Wahrheit." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Clara Ashgrove, who hired him, and whose party it was. She says she never left her table.", nl: "Clara Ashgrove, die hem inhuurde, en van wie het feest was. Ze zegt dat ze haar tafel niet verliet.", fr: "Clara Ashgrove, qui l’avait engagé, et dont c’était la fête. Elle dit n’avoir jamais quitté sa table.", de: "Clara Ashgrove, die ihn engagiert hatte und deren Fest es war. Sie sagt, sie habe ihren Tisch nie verlassen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Leonard Vance, the trustee. It was his books that Ames was reading. He made a short speech at the table.", nl: "Leonard Vance, de beheerder van het fonds. Het waren zijn boeken die Ames las. Hij hield een korte toespraak aan tafel.", fr: "Leonard Vance, l’administrateur du fonds. C’étaient ses comptes qu’Ames épluchait. Il a prononcé un bref discours à table.", de: "Leonard Vance, der Treuhänder. Es waren seine Bücher, die Ames las. Er hielt am Tisch eine kurze Rede." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Lorraine Ames, his wife. She sat at the Ashgrove table all evening and says she never went upstairs.", nl: "Lorraine Ames, zijn vrouw. Ze zat de hele avond aan de Ashgrove-tafel en zegt dat ze niet naar boven ging.", fr: "Lorraine Ames, sa femme. Elle est restée toute la soirée à la table Ashgrove et dit n’être jamais montée.", de: "Lorraine Ames, seine Frau. Sie saß den ganzen Abend am Ashgrove-Tisch und sagt, sie sei nie nach oben gegangen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Howard Fowler, his partner of twenty years at Ames and Fowler. He sang Auld Lang Syne between Lorraine and Clara.", nl: "Howard Fowler, al twintig jaar zijn partner bij Ames en Fowler. Hij zong Auld Lang Syne tussen Lorraine en Clara in.", fr: "Howard Fowler, son associé depuis vingt ans chez Ames et Fowler. Il a chanté Auld Lang Syne entre Lorraine et Clara.", de: "Howard Fowler, seit zwanzig Jahren sein Partner bei Ames und Fowler. Er sang Auld Lang Syne zwischen Lorraine und Clara." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["toast"],
      panels: [
        {
          id: 'toast',
          drift: 'out',
          titleCard: true,
          titleTop: 62,
          layers: [
            { art: 'toast', depth: 0.08 },
            { art: 'toast-clara', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 4, y: 6, w: 36, tail: { x: 66, y: 16 }, text: { en: "To a better year, Detective.", nl: "Op een beter jaar, rechercheur.", fr: "À une meilleure année, inspecteur.", de: "Auf ein besseres Jahr, Detective." } },
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', clear: true, text: { en: "The fourth time you find Leonard Vance in the room. This time the dead man was reading his books.", nl: "De vierde keer dat je Leonard Vance in de kamer aantreft. Dit keer las de dode zijn boeken.", fr: "La quatrième fois que vous trouvez Leonard Vance dans la pièce. Cette fois, le mort épluchait ses comptes.", de: "Das vierte Mal, dass du Leonard Vance im Raum findest. Diesmal las der Tote seine Bücher." } },
            { kind: 'caption', x: 25.0, y: 94, w: 50, from: 'bottom', clear: true, text: { en: "Find out exactly when midnight was in each room of this hotel.", nl: "Zoek uit wanneer het precies middernacht was in elke kamer van dit hotel.", fr: "Découvrez à quelle heure exacte il était minuit dans chaque pièce de cet hôtel.", de: "Finde heraus, wann genau in jedem Raum dieses Hotels Mitternacht war." } },
          ],
        },
      ],
    },
  ],
};
