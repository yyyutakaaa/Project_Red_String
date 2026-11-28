// The comic strip that opens hollis-garden. Panel art: src/assets/art/cutscenes/hollis-garden/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const hollisGardenCutscene: Cutscene = {
  id: 'hollis-garden',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Harmon Junction, June. It was the reporter.", nl: "Harmon Junction, juni. Het was de verslaggever.", fr: "Harmon Junction, juin. C’était le reporter.", de: "Harmon Junction, Juni. Es war der Reporter." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Paul Sutter had been selling his own paper’s secrets to Teague Construction. A cheque for two thousand five hundred dollars had gone into his account.", nl: "Paul Sutter verkocht de geheimen van zijn eigen krant aan Teague Construction. Er was een cheque van tweeduizend vijfhonderd dollar op zijn rekening gezet.", fr: "Paul Sutter vendait les secrets de son propre journal à Teague Construction. Un chèque de deux mille cinq cents dollars avait été versé sur son compte.", de: "Paul Sutter verkaufte die Geheimnisse seiner eigenen Zeitung an Teague Construction. Ein Scheck über zweitausendfünfhundert Dollar war auf sein Konto gegangen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Walter Brandt found the deposit slip and showed it to him that night. Paul took a steak knife from the dining car and waited for the water stop, when the porter always leaves his seat.", nl: "Walter Brandt vond het stortingsbewijs en liet het hem die avond zien. Paul nam een steakmes mee uit de restauratiewagen en wachtte op de waterstop, waar de conducteur altijd zijn stoel verlaat.", fr: "Walter Brandt a trouvé le bordereau de dépôt et le lui a montré ce soir-là. Paul a pris un couteau à viande au wagon-restaurant et a attendu l’arrêt à l’eau, quand le steward quitte toujours son siège.", de: "Walter Brandt fand den Einzahlungsbeleg und zeigte ihn ihm an jenem Abend. Paul nahm ein Steakmesser aus dem Speisewagen und wartete auf den Wasserhalt, bei dem der Schaffner immer seinen Platz verlässt." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "He said he was writing in the lounge car. But the lounge car was dark by then, and the barman had written down the time of his last drink.", nl: "Hij zei dat hij in de salonwagen zat te schrijven. Maar de salonwagen was toen al donker, en de barman had het uur van zijn laatste glas genoteerd.", fr: "Il disait écrire dans la voiture-salon. Mais elle était déjà éteinte, et le barman avait noté l’heure de son dernier verre.", de: "Er sagte, er habe im Salonwagen geschrieben. Aber der Salonwagen war da schon dunkel, und der Barmann hatte die Zeit seines letzten Drinks notiert." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Irene Brandt handed the file to the commission herself, then took over the Courier. Conrad Teague kept his contracts. He had paid for news, and nothing tied him to the knife.", nl: "Irene Brandt gaf het dossier zelf aan de commissie, en nam daarna de Courier over. Conrad Teague hield zijn contracten. Hij had voor nieuws betaald, en niets verbond hem met het mes.", fr: "Irene Brandt a remis elle-même le dossier à la commission, puis elle a repris le Courier. Conrad Teague a gardé ses contrats. Il avait payé pour des informations, et rien ne le reliait au couteau.", de: "Irene Brandt übergab das Dossier selbst der Kommission und übernahm dann den Courier. Conrad Teague behielt seine Aufträge. Er hatte für Nachrichten bezahlt, und nichts verband ihn mit dem Messer." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Somebody was buying customs inspectors and reporters. You still did not know who stood at the top.", nl: "Iemand kocht douane-inspecteurs en verslaggevers om. Wie er bovenaan stond, wist je nog steeds niet.", fr: "Quelqu’un achetait des inspecteurs des douanes et des journalistes. Vous ne saviez toujours pas qui se tenait au sommet.", de: "Jemand kaufte Zollinspektoren und Reporter. Wer ganz oben stand, wusstest du noch immer nicht." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "The commission got a new chairman: Judge Arthur Hollis, thirty years on the bench and afraid of nobody. He wanted Teague’s books, and everybody else’s.", nl: "De commissie kreeg een nieuwe voorzitter: rechter Arthur Hollis, dertig jaar rechter en voor niemand bang. Hij wilde de boeken van Teague zien, en die van alle anderen.", fr: "La commission a eu un nouveau président : le juge Arthur Hollis, trente ans de magistrature et peur de personne. Il voulait les comptes de Teague, et ceux de tous les autres.", de: "Die Kommission bekam einen neuen Vorsitzenden: Richter Arthur Hollis, dreißig Jahre im Amt und vor niemandem bang. Er wollte Teagues Bücher sehen und die aller anderen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "In August he gave his yearly garden party in the Heights. Everyone who mattered in Calder City was there.", nl: "In augustus gaf hij zijn jaarlijkse tuinfeest in de Heights. Iedereen die ertoe deed in Calder City was er.", fr: "En août, il a donné sa garden-party annuelle sur les Heights. Tout ce qui comptait à Calder City y était.", de: "Im August gab er sein jährliches Gartenfest in den Heights. Jeder, der in Calder City zählte, war da." } },
          ],
        },
      ],
    },
    {
      id: 'party',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["waltz band", "waltz urn"],
      panels: [
        {
          id: 'waltz',
          drift: 'in',
          layers: [
            { art: 'waltz', depth: 0.08 },
            { art: 'waltz-couple', depth: 0.6, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "The Heights, August 1949.", nl: "The Heights, augustus 1949.", fr: "The Heights, août 1949.", de: "The Heights, August 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Judge Hollis's summer party, and the waltzes were printed on the dance cards.", nl: "Het zomerfeest van rechter Hollis, en de walsen stonden op de danskaartjes.", fr: "La fête d'été du juge Hollis, et les valses étaient imprimées sur les carnets de bal.", de: "Das Sommerfest von Richter Hollis, und die Walzer standen auf den Tanzkarten." } },
            { kind: 'caption', x: 3, y: 4, w: 62, clear: true, text: { en: "A dance band on the terrace, champagne on the lawn, fireworks at twenty past ten. Every guest had a printed card with the order of the dances.", nl: "Een dansorkest op het terras, champagne op het gazon, vuurwerk om tien voor half elf. Elke gast had een gedrukt kaartje met de volgorde van de dansen.", fr: "Un orchestre de danse sur la terrasse, du champagne sur la pelouse, un feu d’artifice à dix heures vingt. Chaque invité avait un carton imprimé avec l’ordre des danses.", de: "Eine Tanzkapelle auf der Terrasse, Champagner auf dem Rasen, Feuerwerk um zwanzig nach zehn. Jeder Gast hatte eine gedruckte Karte mit der Reihenfolge der Tänze." } },
            { kind: 'caption', x: 36, y: 94, w: 60, from: 'bottom', text: { en: "At a party everyone remembers the music. Hardly anyone remembers the time.", nl: "Op een feest onthoudt iedereen de muziek. Bijna niemand onthoudt het uur.", fr: "À une fête, tout le monde se souvient de la musique. Presque personne ne se souvient de l’heure.", de: "Auf einem Fest erinnert sich jeder an die Musik. Kaum jemand erinnert sich an die Uhrzeit." } },
          ],
        },
        {
          id: 'band',
          drift: 'left',
          layers: [
            { art: 'band', depth: 0.08 },
            { art: 'band-leader', depth: 0.5, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "9:40 p.m. A string snapped.", nl: "21.40 uur. Een snaar knapte.", fr: "21 h 40. Une corde cassa.", de: "21:40 Uhr. Eine Saite riss." } },
            { kind: 'balloon', x: 54, y: 62, w: 42, tail: { x: 48, y: 40 }, text: { en: "Swap the next two!", nl: "Wissel de volgende twee om!", fr: "On inverse les deux suivants !", de: "Die nächsten zwei tauschen!" } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "The cellist broke a string, so the bandleader changed the order of the dances. Hardly anybody noticed.", nl: "De cellist brak een snaar, dus de orkestleider veranderde de volgorde van de dansen. Bijna niemand merkte het.", fr: "Le violoncelliste a cassé une corde, et le chef d’orchestre a donc changé l’ordre des danses. Presque personne ne l’a remarqué.", de: "Dem Cellisten riss eine Saite, also änderte der Bandleader die Reihenfolge der Tänze. Kaum jemand bemerkte es." } },
          ],
        },
        {
          id: 'urn',
          drift: 'right',
          layers: [
            { art: 'urn', depth: 0.08 },
            { art: 'urn-glove', depth: 0.6, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "By the lily pond.", nl: "Bij de lelievijver.", fr: "Près du bassin aux nénuphars.", de: "Am Seerosenteich." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "When the first rocket went up, his daughter went down the garden to fetch him for the toast.", nl: "Toen de eerste vuurpijl opging, liep zijn dochter de tuin in om hem te halen voor de toost.", fr: "Quand la première fusée est partie, sa fille est descendue au jardin le chercher pour le toast.", de: "Als die erste Rakete stieg, ging seine Tochter in den Garten hinunter, um ihn zum Toast zu holen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "He lay face down among the lilies. He had been struck from behind and had drowned. A croquet mallet was missing from the lawn.", nl: "Hij lag voorover tussen de lelies. Hij was van achteren geslagen en verdronken. Op het gazon ontbrak een croquethamer.", fr: "Il gisait face contre l’eau parmi les nénuphars. On l’avait frappé par-derrière et il s’était noyé. Un maillet de croquet manquait sur la pelouse.", de: "Er lag mit dem Gesicht nach unten zwischen den Seerosen. Er war von hinten geschlagen worden und ertrunken. Auf dem Rasen fehlte ein Krocketschläger." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "The guests were sent home with their names taken. Four people stayed behind. Each of them remembers exactly which dance was playing.", nl: "De gasten werden naar huis gestuurd nadat hun namen waren genoteerd. Vier mensen bleven achter. Elk van hen weet nog precies welke dans er speelde.", fr: "Les invités ont été renvoyés chez eux après qu’on eut pris leurs noms. Quatre personnes sont restées. Chacune se rappelle exactement quelle danse on jouait.", de: "Die Gäste wurden nach Hause geschickt, ihre Namen notiert. Vier Menschen blieben zurück. Jeder von ihnen weiß noch genau, welcher Tanz gerade lief." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Beatrice Hollis, forty-six, his second wife, twenty years younger than him. She says she was dancing the last waltz at ten o’clock.", nl: "Beatrice Hollis, zesenveertig, zijn tweede vrouw, twintig jaar jonger dan hij. Ze zegt dat ze om tien uur de laatste wals danste.", fr: "Beatrice Hollis, quarante-six ans, sa seconde épouse, de vingt ans sa cadette. Elle dit qu’à dix heures elle dansait la dernière valse.", de: "Beatrice Hollis, sechsundvierzig, seine zweite Frau, zwanzig Jahre jünger als er. Sie sagt, sie habe um zehn den letzten Walzer getanzt." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Celia, his daughter, twenty-four, who sang with the band that night. She found him.", nl: "Celia, zijn dochter, vierentwintig, die die avond met het orkest zong. Zij vond hem.", fr: "Celia, sa fille, vingt-quatre ans, qui chantait avec l’orchestre ce soir-là. C’est elle qui l’a trouvé.", de: "Celia, seine Tochter, vierundzwanzig, die an diesem Abend mit der Band sang. Sie fand ihn." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Rex Danner, the bandleader, who knew the order of every song. He says he never left the bandstand.", nl: "Rex Danner, de orkestleider, die de volgorde van elk nummer kende. Hij zegt dat hij het podium niet verliet.", fr: "Rex Danner, le chef d’orchestre, qui connaissait l’ordre de chaque morceau. Il dit n’avoir jamais quitté l’estrade.", de: "Rex Danner, der Bandleader, der die Reihenfolge jedes Stücks kannte. Er sagt, er habe das Podium nie verlassen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Philip Hollis, the judge’s nephew and law clerk, who typed his letters. He says he danced the waltz with his aunt, then poured champagne in the kitchen.", nl: "Philip Hollis, de neef en griffier van de rechter, die zijn brieven typte. Hij zegt dat hij de wals met zijn tante danste en daarna champagne inschonk in de keuken.", fr: "Philip Hollis, le neveu et greffier du juge, qui tapait ses lettres. Il dit avoir dansé la valse avec sa tante, puis servi le champagne à la cuisine.", de: "Philip Hollis, Neffe und Referendar des Richters, der seine Briefe tippte. Er sagt, er habe den Walzer mit seiner Tante getanzt und dann in der Küche Champagner eingeschenkt." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["paper"],
      panels: [
        {
          id: 'paper',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'paper', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 18, y: 4, w: 64, text: { en: "By morning the whole city was sure it knew why the judge had died.", nl: "Tegen de ochtend was de hele stad zeker dat ze wist waarom de rechter dood was.", fr: "Au matin, toute la ville était sûre de savoir pourquoi le juge était mort.", de: "Am Morgen war sich die ganze Stadt sicher, zu wissen, warum der Richter tot war." } },
            { kind: 'caption', x: 22, y: 83, w: 56, text: { en: "Judge Hollis was found face down in his own lily pond.", nl: "Rechter Hollis werd voorover in zijn eigen lelievijver gevonden.", fr: "Le juge Hollis fut retrouvé face contre l’eau dans son propre bassin.", de: "Richter Hollis wurde mit dem Gesicht nach unten in seinem eigenen Seerosenteich gefunden." } },
            { kind: 'caption', x: 20.0, y: 94, w: 60, from: 'bottom', clear: true, text: { en: "The chairman of the Waterfront Commission, dead two months after he took the chair. Was it the harbor? Or something much closer to home?", nl: "De voorzitter van de Havencommissie, dood twee maanden nadat hij voorzitter werd. Was het de haven? Of iets veel dichter bij huis?", fr: "Le président de la Commission du port, mort deux mois après sa nomination. Était-ce le port ? Ou quelque chose de bien plus proche ?", de: "Der Vorsitzende der Hafenkommission, tot zwei Monate nach seinem Amtsantritt. War es der Hafen? Oder etwas viel Näheres?" } },
          ],
        },
      ],
    },
  ],
};
