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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "The Heights, August. It was his wife.", nl: "De Heights, augustus. Het was zijn vrouw.", fr: "Les Heights, août. C’était sa femme.", de: "Die Heights, August. Es war seine Frau." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "It had nothing to do with the harbor. The judge had found Beatrice’s love letters to the bandleader and was starting a divorce. Under their marriage contract she would have left with nothing.", nl: "Het had niets met de haven te maken. De rechter had Beatrices liefdesbrieven aan de orkestleider gevonden en begon een scheiding. Volgens hun huwelijkscontract zou ze met niets vertrekken.", fr: "Cela n’avait rien à voir avec le port. Le juge avait trouvé les lettres d’amour de Beatrice au chef d’orchestre et entamait un divorce. D’après leur contrat de mariage, elle serait partie sans rien.", de: "Es hatte nichts mit dem Hafen zu tun. Der Richter hatte Beatrices Liebesbriefe an den Bandleader gefunden und leitete die Scheidung ein. Nach ihrem Ehevertrag wäre sie mit nichts gegangen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "She said she was dancing the last waltz at ten. But a broken cello string had moved that waltz to twenty to ten. At ten she was at the lily pond with a croquet mallet.", nl: "Ze zei dat ze om tien uur de laatste wals danste. Maar door een gebroken cellosnaar was die wals naar tien over half tien verschoven. Om tien uur stond ze bij de lelievijver, met een croquethamer.", fr: "Elle disait danser la dernière valse à dix heures. Mais une corde de violoncelle cassée avait avancé cette valse à dix heures moins vingt. À dix heures, elle était au bassin aux nénuphars, un maillet de croquet à la main.", de: "Sie sagte, sie habe um zehn den letzten Walzer getanzt. Aber eine gerissene Cellosaite hatte den Walzer auf zwanzig vor zehn verschoben. Um zehn stand sie am Seerosenteich, mit einem Krocketschläger." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "The bandleader’s own program gave the true time, and her muddy glove lay in a stone urn by the path.", nl: "Het eigen programma van de orkestleider gaf het echte uur, en haar modderige handschoen lag in een stenen vaas langs het pad.", fr: "Le programme du chef d’orchestre donnait l’heure véritable, et son gant boueux se trouvait dans une urne de pierre au bord de l’allée.", de: "Das Programm des Bandleaders verriet die wahre Zeit, und ihr schlammiger Handschuh lag in einer Steinurne am Weg." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "But the commission had lost its chairman, and the hearings were put off until spring. Somebody on the waterfront slept better for it.", nl: "Maar de commissie was haar voorzitter kwijt, en de hoorzittingen werden uitgesteld tot het voorjaar. Iemand aan de haven sliep er beter door.", fr: "Mais la commission avait perdu son président, et les audiences ont été reportées au printemps. Quelqu’un, sur le port, en a mieux dormi.", de: "Aber die Kommission hatte ihren Vorsitzenden verloren, und die Anhörungen wurden auf das Frühjahr verschoben. Jemand am Hafen schlief deshalb besser." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Not every death in Calder City belonged on your board. You were learning to tell the difference.", nl: "Niet elke dode in Calder City hoorde op jouw bord. Je leerde het verschil te zien.", fr: "Toutes les morts de Calder City n’avaient pas leur place sur votre tableau. Vous appreniez à faire la différence.", de: "Nicht jeder Tote in Calder City gehörte an dein Brett. Du lerntest, den Unterschied zu erkennen." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "A whole year on the night desk now. Five cases closed. The Captain had stopped calling it luck.", nl: "Een heel jaar nachtdienst nu. Vijf zaken gesloten. De Captain noemde het geen geluk meer.", fr: "Une année entière de permanence de nuit. Cinq affaires bouclées. Le capitaine ne parlait plus de chance.", de: "Jetzt ein ganzes Jahr Nachtdienst. Fünf Fälle gelöst. Der Captain nannte es nicht mehr Glück." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "In October the telephone rang from the Courier Building, where Irene Brandt now ran her husband’s paper.", nl: "In oktober ging de telefoon vanuit het Courier-gebouw, waar Irene Brandt nu de krant van haar man leidde.", fr: "En octobre, le téléphone a sonné depuis l’immeuble du Courier, où Irene Brandt dirigeait désormais le journal de son mari.", de: "Im Oktober klingelte das Telefon aus dem Courier-Gebäude, wo Irene Brandt nun die Zeitung ihres Mannes leitete." } },
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
            { kind: 'caption', x: 3, y: 4, w: 46, text: { en: "The Courier Building on Harbor Avenue: Irene Brandt’s newspaper downstairs, Radio Calder on the ninth floor.", nl: "Het Courier-gebouw aan Harbor Avenue: beneden de krant van Irene Brandt, op de negende verdieping Radio Calder.", fr: "L’immeuble du Courier, sur Harbor Avenue : en bas, le journal d’Irene Brandt ; au neuvième étage, Radio Calder.", de: "Das Courier-Gebäude an der Harbor Avenue: unten Irene Brandts Zeitung, im neunten Stock Radio Calder." } },
            { kind: 'caption', x: 52, y: 94, w: 45, from: 'bottom', text: { en: "Every Friday at half past nine, Radio Calder plays ‘Nightbeat’, a crime serial, live from Studio Nine. Half a million people listen.", nl: "Elke vrijdag om half tien speelt Radio Calder ‘Nightbeat’, een misdaadhoorspel, live vanuit Studio Nine. Een half miljoen mensen luisteren.", fr: "Chaque vendredi à neuf heures et demie, Radio Calder joue « Nightbeat », un feuilleton policier, en direct du Studio Nine. Un demi-million de personnes écoutent.", de: "Jeden Freitag um halb zehn spielt Radio Calder „Nightbeat“, eine Krimiserie, live aus Studio Nine. Eine halbe Million Menschen hören zu." } },
            { kind: 'caption', x: 3, y: 4, w: 46, clear: true, text: { en: "Vernon Clay, forty-seven, produced it. Clever, smooth, and mean with money and with people.", nl: "Vernon Clay, zevenenveertig, produceerde het. Slim, glad, en gierig met geld en met mensen.", fr: "Vernon Clay, quarante-sept ans, le produisait. Habile, onctueux, et mesquin avec l’argent comme avec les gens.", de: "Vernon Clay, siebenundvierzig, produzierte sie. Klug, glatt und kleinlich mit Geld und mit Menschen." } },
            { kind: 'caption', x: 52, y: 94, w: 45, from: 'bottom', text: { en: "He kept a locked drawer in his office, and half the building wondered what was in it.", nl: "Hij had een afgesloten lade in zijn kantoor, en het halve gebouw vroeg zich af wat erin zat.", fr: "Il gardait un tiroir fermé à clé dans son bureau, et la moitié de l’immeuble se demandait ce qu’il contenait.", de: "Er hatte eine verschlossene Schublade in seinem Büro, und das halbe Haus fragte sich, was darin lag." } },
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
            { kind: 'caption', x: 40, y: 4, w: 57, clear: true, text: { en: "A live show means everybody is at their post for thirty minutes: the actors at the microphone, the sound man at his table, the engineer at the board. Nobody can leave.", nl: "Een live-uitzending betekent dat iedereen dertig minuten op zijn post is: de acteurs aan de microfoon, de geluidsman aan zijn tafel, de technicus aan het paneel. Niemand kan weg.", fr: "Une émission en direct, c’est tout le monde à son poste pendant trente minutes : les acteurs au micro, le bruiteur à sa table, l’ingénieur à la console. Personne ne peut partir.", de: "Eine Livesendung heißt: Dreißig Minuten lang ist jeder auf seinem Posten, die Schauspieler am Mikrofon, der Geräuschemacher an seinem Tisch, der Techniker am Pult. Niemand kann weg." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "A record can play a voice that is not in the room. That is why the sponsor forbids records on ‘Nightbeat’.", nl: "Een plaat kan een stem laten horen die niet in de kamer is. Daarom verbiedt de sponsor platen bij ‘Nightbeat’.", fr: "Un disque peut faire entendre une voix qui n’est pas dans la pièce. C’est pourquoi le sponsor interdit les disques dans « Nightbeat ».", de: "Eine Platte kann eine Stimme spielen, die nicht im Raum ist. Deshalb verbietet der Sponsor Platten bei „Nightbeat“." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "At five past ten Vernon Clay was found at his desk, strangled with a length of microphone cable.", nl: "Om vijf over tien werd Vernon Clay aan zijn bureau gevonden, gewurgd met een stuk microfoonkabel.", fr: "À dix heures cinq, on a trouvé Vernon Clay à son bureau, étranglé avec un câble de microphone.", de: "Um fünf nach zehn wurde Vernon Clay an seinem Schreibtisch gefunden, erdrosselt mit einem Stück Mikrofonkabel." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "He died between half past nine and ten. Exactly the half hour the show was on the air.", nl: "Hij stierf tussen half tien en tien. Precies het halfuur dat het hoorspel in de lucht was.", fr: "Il est mort entre neuf heures et demie et dix heures. Exactement la demi-heure où l’émission était à l’antenne.", de: "Er starb zwischen halb zehn und zehn. Genau die halbe Stunde, in der die Sendung lief." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "Four people were still on the ninth floor. Three of them were in the broadcast, and the whole city can swear to it.", nl: "Er waren nog vier mensen op de negende verdieping. Drie van hen zaten in de uitzending, en de hele stad kan dat bezweren.", fr: "Quatre personnes étaient encore au neuvième étage. Trois d’entre elles participaient à l’émission, et toute la ville peut en jurer.", de: "Vier Menschen waren noch im neunten Stock. Drei von ihnen waren in der Sendung, und die ganze Stadt kann es beschwören." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Dorothy Vale, thirty-nine, the star of the show. Half a million people know her voice. She says she was at the microphone from half past nine until ten.", nl: "Dorothy Vale, negenendertig, de ster van het hoorspel. Een half miljoen mensen kennen haar stem. Ze zegt dat ze van half tien tot tien aan de microfoon stond.", fr: "Dorothy Vale, trente-neuf ans, la vedette de l’émission. Un demi-million de personnes connaissent sa voix. Elle dit être restée au micro de neuf heures et demie à dix heures.", de: "Dorothy Vale, neununddreißig, der Star der Sendung. Eine halbe Million Menschen kennen ihre Stimme. Sie sagt, sie habe von halb zehn bis zehn am Mikrofon gestanden." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Eddie Fenn makes the footsteps, the doors and the gunshots. He says he never left his effects table.", nl: "Eddie Fenn maakt de voetstappen, de deuren en de schoten. Hij zegt dat hij zijn geluidstafel niet verliet.", fr: "Eddie Fenn fait les pas, les portes et les coups de feu. Il dit n’avoir jamais quitté sa table de bruitage.", de: "Eddie Fenn macht die Schritte, die Türen und die Schüsse. Er sagt, er habe seinen Geräuschetisch nie verlassen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Sam Okada, the engineer, ran the control board that night. He says you do not leave the board.", nl: "Sam Okada, de technicus, bediende die avond het regelpaneel. Hij zegt dat je het paneel niet verlaat.", fr: "Sam Okada, l’ingénieur, tenait la console ce soir-là. Il dit qu’on ne quitte pas la console.", de: "Sam Okada, der Techniker, bediente an diesem Abend das Regiepult. Er sagt, das Pult verlässt man nicht." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Nora Quill, twenty-three, a young actress waiting for an appointment with Clay. She opened his door and found him.", nl: "Nora Quill, drieëntwintig, een jonge actrice die wachtte op een afspraak met Clay. Ze deed zijn deur open en vond hem.", fr: "Nora Quill, vingt-trois ans, une jeune actrice qui attendait un rendez-vous avec Clay. Elle a ouvert sa porte et l’a trouvé.", de: "Nora Quill, dreiundzwanzig, eine junge Schauspielerin, die auf einen Termin bei Clay wartete. Sie öffnete seine Tür und fand ihn." } },
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
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', clear: true, text: { en: "Irene Brandt lost her husband on the night train. Now a man lies dead in her own building.", nl: "Irene Brandt verloor haar man in de nachttrein. Nu ligt er een dode in haar eigen gebouw.", fr: "Irene Brandt a perdu son mari dans le train de nuit. À présent, un homme gît mort dans son propre immeuble.", de: "Irene Brandt verlor ihren Mann im Nachtzug. Jetzt liegt ein Toter in ihrem eigenen Haus." } },
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', clear: true, text: { en: "Everybody has an alibi that half a million people heard. One of them is counting on that.", nl: "Iedereen heeft een alibi dat een half miljoen mensen hoorden. Een van hen rekent daarop.", fr: "Chacun a un alibi qu’un demi-million de personnes ont entendu. L’un d’eux compte là-dessus.", de: "Jeder hat ein Alibi, das eine halbe Million Menschen gehört haben. Einer von ihnen verlässt sich darauf." } },
          ],
        },
      ],
    },
  ],
};
