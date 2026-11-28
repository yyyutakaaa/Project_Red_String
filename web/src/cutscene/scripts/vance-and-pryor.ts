// The comic strip that opens vance-and-pryor. Panel art: src/assets/art/cutscenes/vance-and-pryor/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const vanceAndPryorCutscene: Cutscene = {
  id: 'vance-and-pryor',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Calloway Street, April. It was the doctor.", nl: "Calloway Street, april. Het was de dokter.", fr: "Calloway Street, avril. C’était le médecin.", de: "Calloway Street, April. Es war der Arzt." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Dr. Pell had been taking morphine for three years. He got it by writing prescriptions for patients who were already dead, and Mercer’s Pharmacy filled them.", nl: "Dokter Pell gebruikte al drie jaar morfine. Hij kwam eraan door recepten te schrijven voor patiënten die al dood waren, en Mercer’s Pharmacy maakte ze klaar.", fr: "Le docteur Pell prenait de la morphine depuis trois ans. Il s’en procurait en rédigeant des ordonnances pour des patients déjà morts, et la pharmacie Mercer les exécutait.", de: "Dr. Pell nahm seit drei Jahren Morphium. Er bekam es, indem er Rezepte für Patienten schrieb, die schon tot waren, und Mercer’s Pharmacy führte sie aus." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Edgar Mercer recognised a name from the death notices and said he would report it on Monday. At half past five Pell was alone with the tonic bottle for eight minutes. By seven he was at the hospital.", nl: "Edgar Mercer herkende een naam uit de overlijdensberichten en zei dat hij het maandag zou melden. Om half zes was Pell acht minuten alleen met de fles tonicum. Om zeven uur stond hij in het ziekenhuis.", fr: "Edgar Mercer a reconnu un nom lu dans les avis de décès et a dit qu’il le signalerait lundi. À cinq heures et demie, Pell est resté seul huit minutes avec le flacon de tonique. À sept heures, il était à l’hôpital.", de: "Edgar Mercer erkannte einen Namen aus den Todesanzeigen und sagte, er werde es am Montag melden. Um halb sechs war Pell acht Minuten allein mit der Tonikumflasche. Um sieben war er im Krankenhaus." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "His alibi was perfect, for the wrong hour. And his own poison ledger was thirty-eight tablets short.", nl: "Zijn alibi was perfect, maar voor het verkeerde uur. En in zijn eigen gifregister ontbraken achtendertig tabletten.", fr: "Son alibi était parfait, mais pour la mauvaise heure. Et il manquait trente-huit comprimés à son propre registre des poisons.", de: "Sein Alibi war perfekt, nur für die falsche Stunde. Und in seinem eigenen Giftbuch fehlten achtunddreißig Tabletten." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "In May, Clara Ashgrove finally took Gilbert Ames’s folder to the offices of Vance and Pryor. Not to Leonard Vance.", nl: "In mei bracht Clara Ashgrove de map van Gilbert Ames eindelijk naar het kantoor van Vance en Pryor. Niet naar Leonard Vance.", fr: "En mai, Clara Ashgrove a enfin porté le dossier de Gilbert Ames au cabinet Vance et Pryor. Pas à Leonard Vance.", de: "Im Mai brachte Clara Ashgrove die Mappe von Gilbert Ames endlich in die Kanzlei Vance und Pryor. Nicht zu Leonard Vance." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "She gave it to his partner, Martin Pryor, the one man there she still trusted.", nl: "Ze gaf hem aan zijn partner, Martin Pryor, de enige daar die ze nog vertrouwde.", fr: "Elle l’a confié à son associé, Martin Pryor, le seul homme du cabinet en qui elle avait encore confiance.", de: "Sie gab sie seinem Partner Martin Pryor, dem einzigen dort, dem sie noch traute." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Martin Pryor, sixty-one: a quiet, old-fashioned lawyer who wrote everything by hand and had trusted his partner completely for twenty-six years.", nl: "Martin Pryor, eenenzestig: een stille, ouderwetse advocaat die alles met de hand schreef en zijn partner zesentwintig jaar lang volledig had vertrouwd.", fr: "Martin Pryor, soixante et un ans : un avocat discret, à l’ancienne, qui écrivait tout à la main et faisait entièrement confiance à son associé depuis vingt-six ans.", de: "Martin Pryor, einundsechzig: ein stiller, altmodischer Anwalt, der alles von Hand schrieb und seinem Partner sechsundzwanzig Jahre lang völlig vertraut hatte." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "He read the folder, went pale, and asked her for two weeks.", nl: "Hij las de map, werd bleek, en vroeg haar om twee weken.", fr: "Il a lu le dossier, il a pâli, et il lui a demandé deux semaines.", de: "Er las die Mappe, wurde blass und bat sie um zwei Wochen." } },
          ],
        },
      ],
    },
    {
      id: 'sunday',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["tower captain", "tower door"],
      panels: [
        {
          id: 'tower',
          drift: 'in',
          layers: [
            { art: 'tower', depth: 0.08 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "The Harbor Exchange Building, a Sunday evening in June 1950.", nl: "Het Harbor Exchange-gebouw, een zondagavond in juni 1950.", fr: "Le Harbor Exchange Building, un dimanche soir de juin 1950.", de: "Das Harbor Exchange Building, ein Sonntagabend im Juni 1950." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "One light on, on the sixth floor.", nl: "Eén licht aan, op de zesde verdieping.", fr: "Une seule lumière, au sixième étage.", de: "Ein einziges Licht, im sechsten Stock." } },
            { kind: 'caption', x: 3, y: 4, w: 62, clear: true, text: { en: "The offices of Vance and Pryor are on the sixth floor. On a Sunday the building is empty, apart from the night elevator man.", nl: "Het kantoor van Vance en Pryor ligt op de zesde verdieping. Op zondag is het gebouw leeg, op de liftman van de nacht na.", fr: "Le cabinet Vance et Pryor est au sixième étage. Le dimanche, l’immeuble est vide, à part le liftier de nuit.", de: "Die Kanzlei Vance und Pryor liegt im sechsten Stock. Sonntags ist das Gebäude leer, bis auf den Nachtliftführer." } },
            { kind: 'caption', x: 36, y: 94, w: 60, from: 'bottom', text: { en: "On Monday morning the secretary unlocked the door and found Martin Pryor dead in his chair, his own revolver in his hand.", nl: "Maandagochtend deed de secretaresse de deur open en vond Martin Pryor dood in zijn stoel, met zijn eigen revolver in zijn hand.", fr: "Lundi matin, la secrétaire a ouvert la porte et a trouvé Martin Pryor mort dans son fauteuil, son propre revolver à la main.", de: "Am Montagmorgen schloss die Sekretärin auf und fand Martin Pryor tot in seinem Stuhl, den eigenen Revolver in der Hand." } },
          ],
        },
        {
          id: 'captain',
          drift: 'left',
          layers: [
            { art: 'captain', depth: 0.08 },
            { art: 'captain-captain', depth: 0.4, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 56, y: 6, w: 40, tail: { x: 52, y: 34 }, text: { en: "Suicide. Sign it and go home.", nl: "Zelfmoord. Teken het en ga naar huis.", fr: "Suicide. Signez et rentrez chez vous.", de: "Selbstmord. Unterschreib und geh nach Hause." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "A typed note lay on his blotter. It said he could not face what he had done to the Ashgrove Family Trust.", nl: "Op zijn vloeiblad lag een getypt briefje. Er stond in dat hij niet kon leven met wat hij het Ashgrove-familiefonds had aangedaan.", fr: "Un mot tapé à la machine était posé sur son sous-main. Il y disait ne pas pouvoir assumer ce qu’il avait fait au fonds familial Ashgrove.", de: "Auf seiner Schreibunterlage lag ein getippter Brief. Darin stand, er könne nicht ertragen, was er dem Ashgrove-Familienfonds angetan habe." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "The Captain wants it closed as suicide. He sent you only because of the name on that trust.", nl: "De Captain wil het sluiten als zelfmoord. Hij stuurde jou alleen vanwege de naam op dat fonds.", fr: "Le capitaine veut classer l’affaire comme un suicide. Il ne vous a envoyé qu’à cause du nom qui figure sur ce fonds.", de: "Der Captain will es als Selbstmord abschließen. Er hat dich nur wegen des Namens auf diesem Fonds geschickt." } },
          ],
        },
        {
          id: 'door',
          drift: 'right',
          layers: [
            { art: 'door', depth: 0.08 },
            { art: 'door-clara', depth: 0.5, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'balloon', x: 4, y: 8, w: 42, tail: { x: 58, y: 34 }, text: { en: "This came this morning. From Martin.", nl: "Dit kwam vanochtend. Van Martin.", fr: "Ceci est arrivé ce matin. De Martin.", de: "Das kam heute Morgen. Von Martin." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Clara Ashgrove was waiting for you with a letter in Martin Pryor’s own handwriting, posted on Saturday.", nl: "Clara Ashgrove wachtte je op met een brief in het handschrift van Martin Pryor zelf, zaterdag op de post gedaan.", fr: "Clara Ashgrove vous attendait avec une lettre de la main même de Martin Pryor, postée samedi.", de: "Clara Ashgrove erwartete dich mit einem Brief in Martin Pryors eigener Handschrift, am Samstag aufgegeben." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "A man who writes to say what he has found does not usually shoot himself the next day.", nl: "Wie schrijft wat hij gevonden heeft, schiet zich de dag erna meestal niet dood.", fr: "Un homme qui écrit pour dire ce qu’il a découvert ne se tire pas, d’ordinaire, une balle le lendemain.", de: "Wer schreibt, was er gefunden hat, erschießt sich gewöhnlich nicht am nächsten Tag." } },
          ],
        },
      ],
    },
    {
      id: 'board3',
      columns: '1fr',
      rows: '1fr',
      areas: ["board3"],
      panels: [
        {
          id: 'board3',
          drift: 'in',
          layers: [
            { art: 'shared/board-3', depth: 0.08 },
            { art: 'shared/board-3-detective', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Two years. Eleven cards. Ashgrove House. Booth 9. Pier Seventeen. The Regent. Every time, somebody else went to prison.", nl: "Twee jaar. Elf kaarten. Ashgrove House. Booth 9. Pier Seventeen. De Regent. Elke keer ging iemand anders de cel in.", fr: "Deux ans. Onze fiches. Ashgrove House. La box 9. Le Pier Seventeen. Le Regent. À chaque fois, quelqu’un d’autre allait en prison.", de: "Zwei Jahre. Elf Karten. Ashgrove House. Nische 9. Pier Seventeen. Das Regent. Jedes Mal ging jemand anderes ins Gefängnis." } },
            { kind: 'caption', x: 3, y: 94, w: 44, from: 'bottom', text: { en: "Every time, Leonard Vance went home.", nl: "Elke keer ging Leonard Vance naar huis.", fr: "À chaque fois, Leonard Vance rentrait chez lui.", de: "Jedes Mal ging Leonard Vance nach Hause." } },
            { kind: 'caption', x: 3, y: 4, w: 56, clear: true, text: { en: "Edmund Ashgrove died with a codicil unsigned. Harold Pike kept a folder that disappeared. Gilbert Ames died halfway through the books. Now Martin Pryor, two weeks after he opened them.", nl: "Edmund Ashgrove stierf met een ongetekend codicil. Harold Pike hield een map bij die verdween. Gilbert Ames stierf halverwege de boeken. En nu Martin Pryor, twee weken nadat hij ze opensloeg.", fr: "Edmund Ashgrove est mort avec un codicille non signé. Harold Pike tenait un dossier qui a disparu. Gilbert Ames est mort à mi-chemin des comptes. Et maintenant Martin Pryor, deux semaines après les avoir ouverts.", de: "Edmund Ashgrove starb mit einem nicht unterschriebenen Kodizill. Harold Pike führte eine Mappe, die verschwand. Gilbert Ames starb mitten in den Büchern. Und jetzt Martin Pryor, zwei Wochen nachdem er sie aufschlug." } },
            { kind: 'caption', x: 3, y: 94, w: 56, from: 'bottom', text: { en: "Four people looked into the Ashgrove money. All four are dead. Tonight you stop looking at the cards and look at the thread.", nl: "Vier mensen keken naar het geld van de Ashgroves. Alle vier zijn ze dood. Vanavond kijk je niet meer naar de kaarten, maar naar de draad.", fr: "Quatre personnes se sont penchées sur l’argent des Ashgrove. Toutes les quatre sont mortes. Ce soir, vous cessez de regarder les fiches pour regarder le fil.", de: "Vier Menschen sahen sich das Geld der Ashgroves an. Alle vier sind tot. Heute Abend schaust du nicht mehr auf die Karten, sondern auf den Faden." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "Martin Pryor died on Sunday evening, between seven and ten. Four people could have been in that building, and you know every one of them.", nl: "Martin Pryor stierf zondagavond, tussen zeven en tien. Vier mensen konden in dat gebouw zijn geweest, en je kent ze alle vier.", fr: "Martin Pryor est mort dimanche soir, entre sept et dix heures. Quatre personnes ont pu se trouver dans cet immeuble, et vous les connaissez toutes.", de: "Martin Pryor starb am Sonntagabend zwischen sieben und zehn. Vier Menschen können in diesem Gebäude gewesen sein, und du kennst jeden von ihnen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Leonard Vance, his partner for twenty-six years. He says he was at the Harbor Commission dinner at the Yacht Club from half past six until after eleven.", nl: "Leonard Vance, zesentwintig jaar zijn partner. Hij zegt dat hij van half zeven tot na elf op het diner van de Havencommissie in de Yacht Club was.", fr: "Leonard Vance, son associé depuis vingt-six ans. Il dit avoir été au dîner de la Commission du port, au Yacht Club, de six heures et demie jusqu’après onze heures.", de: "Leonard Vance, seit sechsundzwanzig Jahren sein Partner. Er sagt, er sei von halb sieben bis nach elf beim Dinner der Hafenkommission im Yacht Club gewesen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Clara Ashgrove, whose family money the note talks about. She gave the main speech at that same dinner at nine.", nl: "Clara Ashgrove, over wier familiegeld het briefje gaat. Zij hield om negen uur de toespraak op datzelfde diner.", fr: "Clara Ashgrove, dont le mot évoque l’argent de famille. Elle a prononcé le discours principal de ce même dîner à neuf heures.", de: "Clara Ashgrove, um deren Familiengeld es in dem Brief geht. Sie hielt um neun die Hauptrede bei demselben Dinner." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Miss June Hartley, the firm’s secretary, who types every letter in the office. She unlocked the door and found him.", nl: "Juffrouw June Hartley, de secretaresse, die elke brief van het kantoor typt. Zij deed de deur open en vond hem.", fr: "Mlle June Hartley, la secrétaire, qui tape toutes les lettres du cabinet. C’est elle qui a ouvert la porte et l’a trouvé.", de: "Miss June Hartley, die Sekretärin, die jeden Brief der Kanzlei tippt. Sie schloss auf und fand ihn." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Tommy Reyes, once the watchman on Pier Seventeen, now runs the night elevator here. Every passenger goes into his book.", nl: "Tommy Reyes, ooit nachtwaker op Pier Seventeen, bedient hier nu ’s nachts de lift. Elke passagier komt in zijn boek.", fr: "Tommy Reyes, autrefois veilleur au Pier Seventeen, est aujourd’hui liftier de nuit ici. Chaque passager est inscrit dans son registre.", de: "Tommy Reyes, früher Wächter auf Pier Seventeen, fährt hier jetzt nachts den Aufzug. Jeder Fahrgast kommt in sein Buch." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["street"],
      panels: [
        {
          id: 'street',
          drift: 'out',
          titleCard: true,
          titleTop: 44,
          layers: [
            { art: 'street', depth: 0.08 },
            { art: 'street-vance', depth: 0.5, enter: 'right', delay: 0.15 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', text: { en: "Martin Pryor had been dead since Sunday evening.", nl: "Martin Pryor was al sinds zondagavond dood.", fr: "Martin Pryor était mort depuis dimanche soir.", de: "Martin Pryor war seit Sonntagabend tot." } },
            { kind: 'caption', x: 20.0, y: 94, w: 60, from: 'bottom', clear: true, text: { en: "If Martin Pryor did not write that note, somebody in this building wanted you to believe he did. This is the case your board has been waiting for.", nl: "Als Martin Pryor dat briefje niet schreef, wilde iemand in dit gebouw dat je dat geloofde. Dit is de zaak waar je bord op heeft gewacht.", fr: "Si Martin Pryor n’a pas écrit ce mot, quelqu’un dans cet immeuble voulait vous le faire croire. Voici l’affaire que votre tableau attendait.", de: "Wenn Martin Pryor diesen Brief nicht schrieb, wollte jemand in diesem Gebäude, dass du es glaubst. Das ist der Fall, auf den dein Brett gewartet hat." } },
          ],
        },
      ],
    },
  ],
};
