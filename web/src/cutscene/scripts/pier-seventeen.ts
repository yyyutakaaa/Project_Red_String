// The comic strip that opens pier-seventeen. Panel art: src/assets/art/cutscenes/pier-seventeen/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const pierSeventeenCutscene: Cutscene = {
  id: 'pier-seventeen',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "The Blue Lantern, February. It was the manager.", nl: "The Blue Lantern, februari. Het was de manager.", fr: "Le Blue Lantern, février. C’était le gérant.", de: "The Blue Lantern, Februar. Es war der Geschäftsführer." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Frank Dellow had been skimming the door money for a year, and kept the true count in a black notebook. Kale found it, and told Frank he was finished on Monday.", nl: "Frank Dellow roomde al een jaar het deurgeld af, en hield de echte telling bij in een zwart notitieboekje. Kale vond het, en zei Frank dat hij maandag kon vertrekken.", fr: "Frank Dellow écrémait la recette de l’entrée depuis un an et tenait le vrai compte dans un carnet noir. Kale l’a trouvé et a dit à Frank qu’il était fini lundi.", de: "Frank Dellow zweigte seit einem Jahr Eintrittsgeld ab und führte die echte Zählung in einem schwarzen Notizbuch. Kale fand es und sagte Frank, am Montag sei er erledigt." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Frank ordered the long drum solo himself. Under its noise he took the club revolver from the bar safe, shot Kale in his office, and slipped out through the alley.", nl: "Frank bestelde de lange drumsolo zelf. Onder dat lawaai nam hij de clubrevolver uit de barkluis, schoot Kale neer in zijn kantoor, en glipte weg door de steeg.", fr: "Frank avait lui-même commandé le long solo de batterie. Sous ce vacarme, il a pris le revolver du club dans le coffre du bar, abattu Kale dans son bureau et filé par la ruelle.", de: "Frank bestellte das lange Schlagzeugsolo selbst. In dem Lärm nahm er den Clubrevolver aus dem Barsafe, erschoss Kale in seinem Büro und verschwand durch die Gasse." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "He walked round the block in the rain and came back in at the front, as if he had never left the door.", nl: "Hij liep in de regen het blok om en kwam vooraan weer binnen, alsof hij nooit van de deur was weggeweest.", fr: "Il a fait le tour du pâté de maisons sous la pluie et il est rentré par devant, comme s’il n’avait jamais quitté la porte.", de: "Er ging im Regen um den Block und kam vorn wieder herein, als hätte er die Tür nie verlassen." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "It was Vance who broke Frank’s alibi. He had been sitting in Booth 9 all along, though at first he swore he had left. From there he saw Frank go down the corridor.", nl: "Het was Vance die Franks alibi brak. Hij zat al die tijd in Booth 9, al zwoer hij eerst dat hij vertrokken was. Van daaruit zag hij Frank de gang in lopen.", fr: "C’est Vance qui a brisé l’alibi de Frank. Il était resté tout ce temps dans la box 9, bien qu’il ait d’abord juré être parti. De là, il a vu Frank s’engager dans le couloir.", de: "Es war Vance, der Franks Alibi zerbrach. Er hatte die ganze Zeit in Nische 9 gesessen, obwohl er erst schwor, er sei gegangen. Von dort sah er Frank den Gang hinuntergehen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "He never said who he was meeting in that booth. You asked. He smiled and talked about client privilege.", nl: "Hij zei nooit met wie hij in dat zitje had afgesproken. Je vroeg het. Hij glimlachte en begon over zijn beroepsgeheim.", fr: "Il n’a jamais dit qui il retrouvait dans cette box. Vous avez demandé. Il a souri et parlé de secret professionnel.", de: "Er sagte nie, wen er in dieser Nische traf. Du hast gefragt. Er lächelte und sprach vom Anwaltsgeheimnis." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "A shipping family’s lawyer in a rum-runner’s club. Twice now he had been under the same roof when somebody died.", nl: "De advocaat van een redersfamilie in de club van een rumsmokkelaar. Al twee keer was hij onder hetzelfde dak toen er iemand stierf.", fr: "L’avocat d’une famille d’armateurs dans le club d’un ancien contrebandier. Deux fois déjà, il se trouvait sous le même toit quand quelqu’un est mort.", de: "Der Anwalt einer Reederfamilie im Club eines Rumschmugglers. Schon zweimal war er unter demselben Dach, als jemand starb." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "You tied a red thread between the two cards. Your first. Two months later the fog came in, and the Ashgrove name came back with it.", nl: "Je spande een rode draad tussen de twee kaarten. Je eerste. Twee maanden later kwam de mist opzetten, en daarmee kwam de naam Ashgrove terug.", fr: "Vous avez tendu un fil rouge entre les deux fiches. Votre premier. Deux mois plus tard, le brouillard est arrivé, et le nom Ashgrove est revenu avec lui.", de: "Du hast einen roten Faden zwischen die beiden Karten gespannt. Deinen ersten. Zwei Monate später kam der Nebel, und mit ihm kam der Name Ashgrove zurück." } },
          ],
        },
      ],
    },
    {
      id: 'fog',
      columns: '1fr 1fr',
      rows: '1.1fr 1fr',
      areas: ["pier pier", "clerk cape"],
      panels: [
        {
          id: 'pier',
          drift: 'right',
          layers: [
            { art: 'pier', depth: 0.08 },
            { art: 'pier-lamp', depth: 0.8, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 52, y: 4, w: 44, text: { en: "Pier Seventeen, April 1949.", nl: "Pier Seventeen, april 1949.", fr: "Pier Seventeen, avril 1949.", de: "Pier Seventeen, April 1949." } },
            { kind: 'caption', x: 2, y: 76, w: 40, text: { en: "A foghorn, somewhere out on the water.", nl: "Een misthoorn, ergens op het water.", fr: "Une corne de brume, quelque part sur l'eau.", de: "Ein Nebelhorn, irgendwo draußen auf dem Wasser." } },
            { kind: 'caption', x: 40, y: 4, w: 57, clear: true, text: { en: "Pier Seventeen is the heart of Ashgrove Shipping: the harbor office, the bonded warehouse, and thirty-one years of ledgers. Clara Ashgrove runs it now.", nl: "Pier Seventeen is het hart van Ashgrove Shipping: het havenkantoor, het douane-entrepot, en eenendertig jaar aan grootboeken. Clara Ashgrove leidt het nu.", fr: "Le Pier Seventeen est le cœur d’Ashgrove Shipping : le bureau du port, l’entrepôt sous douane et trente et un ans de registres. C’est Clara Ashgrove qui le dirige désormais.", de: "Pier Seventeen ist das Herz von Ashgrove Shipping: das Hafenbüro, das Zolllager und einunddreißig Jahre Geschäftsbücher. Jetzt leitet es Clara Ashgrove." } },
          ],
        },
        {
          id: 'clerk',
          drift: 'in',
          layers: [
            { art: 'clerk', depth: 0.08 },
            { art: 'clerk-pike', depth: 0.4, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 2, y: 4, w: 34, text: { en: "Harold Pike kept a carbon copy of everything.", nl: "Harold Pike hield van alles een doorslag bij.", fr: "Harold Pike gardait un double carbone de tout.", de: "Harold Pike behielt von allem einen Durchschlag." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Harold Pike, fifty-eight, chief clerk. A widower who lived for his ledgers. Every evening he checked the cargo against the paper, crate by crate.", nl: "Harold Pike, achtenvijftig, hoofdklerk. Een weduwnaar die leefde voor zijn boeken. Elke avond legde hij de lading naast het papier, kist voor kist.", fr: "Harold Pike, cinquante-huit ans, chef comptable. Un veuf qui vivait pour ses registres. Chaque soir, il comparait la cargaison aux papiers, caisse par caisse.", de: "Harold Pike, achtundfünfzig, Bürovorsteher. Ein Witwer, der für seine Bücher lebte. Jeden Abend verglich er die Fracht mit den Papieren, Kiste für Kiste." } },
            { kind: 'caption', x: 3, y: 94, w: 60, from: 'bottom', text: { en: "Last night, something did not add up.", nl: "Gisteravond klopte er iets niet.", fr: "Hier soir, quelque chose ne collait pas.", de: "Gestern Abend stimmte etwas nicht." } },
          ],
        },
        {
          id: 'cape',
          drift: 'left',
          layers: [
            { art: 'cape', depth: 0.08 },
            { art: 'cape-woman', depth: 0.55, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 34, text: { en: "10:50 p.m.", nl: "22.50 uur.", fr: "22 h 50.", de: "22:50 Uhr." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Late that night somebody in a rain cape crossed the pier in the fog.", nl: "Laat die avond stak iemand in een regencape de pier over in de mist.", fr: "Tard ce soir-là, quelqu’un en cape de pluie a traversé le quai dans le brouillard.", de: "Spät an diesem Abend ging jemand in einem Regencape im Nebel über den Pier." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Nobody was supposed to be there at that hour.", nl: "Op dat uur hoorde daar niemand te zijn.", fr: "À cette heure, personne n’était censé se trouver là.", de: "Um diese Zeit hatte dort niemand etwas zu suchen." } },
          ],
        },
      ],
    },
    {
      id: 'stamp',
      columns: '1fr',
      rows: '1fr',
      areas: ["stamp"],
      panels: [
        {
          id: 'stamp',
          drift: 'in',
          layers: [
            { art: 'stamp', depth: 0.08 },
            { art: 'stamp-stamp', depth: 0.6, enter: 'down', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 58, text: { en: "Nothing leaves a ship in Calder City until Harbor Customs has stamped it. An inspector checks the crates against the list, then signs and stamps the paper.", nl: "Niets verlaat een schip in Calder City voordat de havendouane het heeft gestempeld. Een inspecteur legt de kisten naast de lijst, en tekent en stempelt dan het papier.", fr: "Rien ne quitte un navire à Calder City sans le tampon de la douane du port. Un inspecteur compare les caisses à la liste, puis signe et tamponne le document.", de: "Nichts verlässt in Calder City ein Schiff, bevor der Hafenzoll es gestempelt hat. Ein Inspektor vergleicht die Kisten mit der Liste, dann unterschreibt und stempelt er das Papier." } },
            { kind: 'caption', x: 40, y: 94, w: 57, from: 'bottom', text: { en: "One stamp turns a crate into whatever the paper says. Machine parts. Tinned fish. Anything at all.", nl: "Eén stempel maakt van een kist wat er op het papier staat. Machineonderdelen. Vis in blik. Wat je maar wilt.", fr: "Un seul tampon fait d’une caisse ce que dit le papier. Des pièces de machines. Du poisson en conserve. N’importe quoi.", de: "Ein Stempel macht aus einer Kiste, was auf dem Papier steht. Maschinenteile. Fischkonserven. Was auch immer." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "So a man who wanted to bring something into the city unseen no longer needed a dark beach, like Victor Kale in the twenties.", nl: "Wie iets ongezien de stad in wilde brengen, had dus geen donker strand meer nodig, zoals Victor Kale in de jaren twintig.", fr: "Celui qui voulait faire entrer quelque chose en ville sans être vu n’avait donc plus besoin d’une plage obscure, comme Victor Kale dans les années vingt.", de: "Wer etwas ungesehen in die Stadt bringen wollte, brauchte also keinen dunklen Strand mehr wie Victor Kale in den Zwanzigern." } },
            { kind: 'caption', x: 40, y: 94, w: 57, from: 'bottom', text: { en: "He needed one friendly stamp, and a shipping line so respectable that nobody looked twice.", nl: "Hij had één bevriende stempel nodig, en een rederij die zo netjes was dat niemand twee keer keek.", fr: "Il lui fallait un tampon complaisant, et une compagnie maritime si respectable que personne n’y regardait à deux fois.", de: "Er brauchte einen gefälligen Stempel und eine Reederei, die so ehrbar war, dass niemand zweimal hinsah." } },
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
            { kind: 'caption', x: 3, y: 94, w: 74, from: 'bottom', text: { en: "At six in the morning Harold Pike was found at the foot of the iron stairs in the ledger archive. It was telephoned in as a fall. But the police surgeon found a blow to the temple that no stair had given him. He died between a quarter to eleven and half past eleven.", nl: "Om zes uur ’s ochtends werd Harold Pike gevonden onder aan de ijzeren trap in het archief. Het werd gemeld als een val. Maar de politiearts vond een klap op de slaap die geen trede hem had gegeven. Hij stierf tussen kwart voor elf en half twaalf.", fr: "À six heures du matin, on a trouvé Harold Pike au pied de l’escalier de fer des archives. On a signalé une chute. Mais le médecin légiste a relevé à la tempe un coup qu’aucune marche ne lui avait donné. Il est mort entre onze heures moins le quart et onze heures et demie.", de: "Um sechs Uhr morgens wurde Harold Pike am Fuß der Eisentreppe im Archiv gefunden. Gemeldet wurde ein Sturz. Aber der Polizeiarzt fand einen Schlag an der Schläfe, den ihm keine Stufe versetzt hatte. Er starb zwischen Viertel vor elf und halb zwölf." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Clara Ashgrove, head of Ashgrove Shipping since her father’s death. Pike had kept the family’s books for thirty-one years. She says she was at a dinner at the Mariners’ Club.", nl: "Clara Ashgrove, hoofd van Ashgrove Shipping sinds de dood van haar vader. Pike hield al eenendertig jaar de boeken van de familie bij. Ze zegt dat ze op een diner in de Mariners’ Club was.", fr: "Clara Ashgrove, à la tête d’Ashgrove Shipping depuis la mort de son père. Pike tenait les livres de la famille depuis trente et un ans. Elle dit qu’elle était à un dîner au Mariners’ Club.", de: "Clara Ashgrove, Chefin von Ashgrove Shipping seit dem Tod ihres Vaters. Pike führte seit einunddreißig Jahren die Bücher der Familie. Sie sagt, sie sei bei einem Dinner im Mariners’ Club gewesen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Leonard Vance, the firm’s lawyer. Clara telephoned him before she telephoned anybody else. He says he spent the evening at home.", nl: "Leonard Vance, de advocaat van het bedrijf. Clara belde hem voordat ze iemand anders belde. Hij zegt dat hij de avond thuis doorbracht.", fr: "Leonard Vance, l’avocat de la compagnie. Clara l’a appelé avant d’appeler qui que ce soit d’autre. Il dit avoir passé la soirée chez lui.", de: "Leonard Vance, der Anwalt der Firma. Clara rief ihn an, bevor sie irgendjemand anderen anrief. Er sagt, er habe den Abend zu Hause verbracht." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Inspector Ruth Calloway of Harbor Customs. She came at dawn to seal the warehouse, as the rules require. She says she was filing reports at the Customs House until after midnight.", nl: "Inspecteur Ruth Calloway van de havendouane. Ze kwam bij zonsopgang het entrepot verzegelen, zoals de regels eisen. Ze zegt dat ze tot na middernacht rapporten zat in te vullen in het douanekantoor.", fr: "L’inspectrice Ruth Calloway, de la douane du port. Elle est venue à l’aube sceller l’entrepôt, comme l’exige le règlement. Elle dit avoir rempli des rapports à l’hôtel des douanes jusqu’après minuit.", de: "Inspektorin Ruth Calloway vom Hafenzoll. Sie kam im Morgengrauen, um das Lager zu versiegeln, wie die Vorschrift es verlangt. Sie sagt, sie habe bis nach Mitternacht im Zollamt Berichte abgelegt." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Tommy Reyes, the night watchman, who smells of peppermints at seven in the morning. He says he walked his rounds all night.", nl: "Tommy Reyes, de nachtwaker, die om zeven uur ’s ochtends naar pepermunt ruikt. Hij zegt dat hij de hele nacht zijn rondes liep.", fr: "Tommy Reyes, le veilleur de nuit, qui sent la menthe à sept heures du matin. Il dit avoir fait ses rondes toute la nuit.", de: "Tommy Reyes, der Nachtwächter, der um sieben Uhr morgens nach Pfefferminz riecht. Er sagt, er sei die ganze Nacht seine Runden gegangen." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["stairs"],
      panels: [
        {
          id: 'stairs',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'stairs', depth: 0.08 },
            { art: 'stairs-papers', depth: 0.4, enter: 'fade', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 22.0, y: 94, w: 56, from: 'bottom', text: { en: "By midnight, the clerk lay at the foot of the archive stairs.", nl: "Tegen middernacht lag de klerk onder aan de archieftrap.", fr: "À minuit, le comptable gisait au pied de l’escalier des archives.", de: "Um Mitternacht lag der Bürovorsteher am Fuß der Archivtreppe." } },
            { kind: 'caption', x: 20.0, y: 94, w: 60, from: 'bottom', clear: true, text: { en: "What did Harold Pike find in his ledgers last evening? Pin every story to the clock, and find out who came to the pier in the fog.", nl: "Wat vond Harold Pike gisteravond in zijn boeken? Leg elk verhaal naast de klok, en zoek uit wie in de mist naar de pier kwam.", fr: "Qu’a trouvé Harold Pike dans ses registres hier soir ? Confrontez chaque récit à l’horloge, et découvrez qui est venu au quai dans le brouillard.", de: "Was fand Harold Pike gestern Abend in seinen Büchern? Leg jede Geschichte an die Uhr und finde heraus, wer im Nebel zum Pier kam." } },
          ],
        },
      ],
    },
  ],
};
