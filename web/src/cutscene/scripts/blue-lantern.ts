// The comic strip that opens blue-lantern. Panel art: src/assets/art/cutscenes/blue-lantern/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const blueLanternCutscene: Cutscene = {
  id: 'blue-lantern',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Ashgrove House, October. It was the son-in-law.", nl: "Ashgrove House, oktober. Het was de schoonzoon.", fr: "Ashgrove House, octobre. C’était le gendre.", de: "Ashgrove House, Oktober. Es war der Schwiegersohn." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Simon Whitlock owed his brokers thirty-eight thousand dollars. To stay afloat he forged Edmund’s name on a forty-thousand-dollar loan at the Calder Harbor Trust.", nl: "Simon Whitlock was zijn makelaars achtendertigduizend dollar schuldig. Om het hoofd boven water te houden, vervalste hij Edmunds naam op een lening van veertigduizend dollar bij de Calder Harbor Trust.", fr: "Simon Whitlock devait trente-huit mille dollars à ses courtiers. Pour ne pas couler, il a imité la signature d’Edmund sur un prêt de quarante mille dollars à la Calder Harbor Trust.", de: "Simon Whitlock schuldete seinen Maklern achtunddreißigtausend Dollar. Um sich über Wasser zu halten, fälschte er Edmunds Namen auf einem Kredit über vierzigtausend Dollar bei der Calder Harbor Trust." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "The bank wrote to Edmund, and the old man knew he had never signed. He told Simon he would go to the police on Monday. So Simon emptied the heart drops into his brandy glass.", nl: "De bank schreef Edmund aan, en de oude man wist dat hij nooit getekend had. Hij zei Simon dat hij maandag naar de politie ging. Dus goot Simon de hartdruppels in zijn cognacglas.", fr: "La banque a écrit à Edmund, et le vieil homme savait qu’il n’avait jamais signé. Il a dit à Simon qu’il irait à la police lundi. Alors Simon a vidé les gouttes pour le cœur dans son verre de cognac.", de: "Die Bank schrieb Edmund, und der alte Mann wusste, dass er nie unterschrieben hatte. Er sagte Simon, er gehe am Montag zur Polizei. Also leerte Simon die Herztropfen in sein Brandyglas." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Simon said he had been on the telephone to his broker. But the storm had cut the line at half past eight, and Edmund had written that down too.", nl: "Simon zei dat hij met zijn makelaar aan de telefoon had gezeten. Maar de storm had de lijn om half negen gebroken, en ook dat had Edmund opgeschreven.", fr: "Simon disait avoir été au téléphone avec son courtier. Mais la tempête avait coupé la ligne à huit heures et demie, et cela aussi, Edmund l’avait noté.", de: "Simon sagte, er habe mit seinem Makler telefoniert. Aber der Sturm hatte die Leitung um halb neun gekappt, und auch das hatte Edmund notiert." } },
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Clara Ashgrove took over her father’s company. The codicil was never signed, so Leonard Vance stayed on as keeper of the family money.", nl: "Clara Ashgrove nam het bedrijf van haar vader over. Het codicil werd nooit getekend, dus Leonard Vance bleef het familiegeld beheren.", fr: "Clara Ashgrove a repris la compagnie de son père. Le codicille n’a jamais été signé, et Leonard Vance est donc resté gardien de l’argent de la famille.", de: "Clara Ashgrove übernahm die Firma ihres Vaters. Das Kodizill wurde nie unterschrieben, also verwaltete Leonard Vance weiter das Familiengeld." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Nobody asked what that codicil had been for. Not yet.", nl: "Niemand vroeg waar dat codicil voor was geweest. Nog niet.", fr: "Personne n’a demandé à quoi servait ce codicille. Pas encore.", de: "Niemand fragte, wozu dieses Kodizill gedacht war. Noch nicht." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Two cards on your board now. Then four quiet months of burglaries, bar fights and missing husbands.", nl: "Twee kaarten op je bord nu. Daarna vier rustige maanden met inbraken, kroegruzies en vermiste echtgenoten.", fr: "Deux fiches au tableau, désormais. Puis quatre mois calmes de cambriolages, de bagarres de bar et de maris disparus.", de: "Jetzt zwei Karten am Brett. Dann vier ruhige Monate mit Einbrüchen, Kneipenschlägereien und verschwundenen Ehemännern." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Until a Saturday night in February 1949, when a nightclub owner was shot in the middle of a drum solo.", nl: "Tot een zaterdagnacht in februari 1949, toen een clubeigenaar werd neergeschoten midden in een drumsolo.", fr: "Jusqu’à un samedi soir de février 1949, où un patron de club a été abattu en plein solo de batterie.", de: "Bis zu einer Samstagnacht im Februar 1949, als ein Clubbesitzer mitten in einem Schlagzeugsolo erschossen wurde." } },
          ],
        },
      ],
    },
    {
      id: 'kale',
      columns: '1fr',
      rows: '1fr',
      areas: ["kale"],
      panels: [
        {
          id: 'kale',
          drift: 'right',
          layers: [
            { art: 'kale', depth: 0.08 },
            { art: 'kale-kale', depth: 0.5, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 46, text: { en: "Victor Kale started out in the twenties, when liquor was against the law. He ran rum across the Sound by night and sold it by the crate.", nl: "Victor Kale begon in de jaren twintig, toen drank verboden was. Hij smokkelde ’s nachts rum over de Sound en verkocht die per kist.", fr: "Victor Kale a débuté dans les années vingt, quand l’alcool était interdit. La nuit, il passait du rhum par le détroit et le vendait à la caisse.", de: "Victor Kale fing in den Zwanzigern an, als Alkohol verboten war. Nachts schmuggelte er Rum über den Sund und verkaufte ihn kistenweise." } },
            { kind: 'caption', x: 52, y: 94, w: 45, from: 'bottom', text: { en: "When the law changed, he bought a liquor license, then a club. He was generous with drinks and merciless with debts.", nl: "Toen de wet veranderde, kocht hij een drankvergunning, en daarna een club. Gul met drank, genadeloos met schulden.", fr: "Quand la loi a changé, il a acheté une licence, puis un club. Généreux sur les verres, impitoyable sur les dettes.", de: "Als das Gesetz sich änderte, kaufte er eine Schanklizenz, dann einen Club. Großzügig mit Drinks, gnadenlos bei Schulden." } },
            { kind: 'caption', x: 3, y: 4, w: 46, clear: true, text: { en: "By 1949 he was forty-nine and almost respectable. He had a lawyer from a good firm, a manager who ran his door, and a singer who had once loved him.", nl: "In 1949 was hij negenenveertig en bijna een net man. Hij had een advocaat van een goed kantoor, een manager die zijn deur deed, en een zangeres die ooit van hem had gehouden.", fr: "En 1949, il avait quarante-neuf ans et était presque respectable. Il avait un avocat d’un bon cabinet, un gérant qui tenait sa porte, et une chanteuse qui l’avait aimé autrefois.", de: "1949 war er neunundvierzig und beinahe ehrbar. Er hatte einen Anwalt aus einer guten Kanzlei, einen Geschäftsführer für die Tür und eine Sängerin, die ihn einmal geliebt hatte." } },
            { kind: 'caption', x: 52, y: 94, w: 45, from: 'bottom', text: { en: "He trusted none of them.", nl: "Hij vertrouwde geen van hen.", fr: "Il ne faisait confiance à aucun d’eux.", de: "Er traute keinem von ihnen." } },
          ],
        },
      ],
    },
    {
      id: 'club',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["sax drums", "sax booth"],
      panels: [
        {
          id: 'sax',
          drift: 'in',
          layers: [
            { art: 'sax', depth: 0.08 },
            { art: 'sax-player', depth: 0.55, enter: 'up', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 52, y: 4, w: 44, text: { en: "The Blue Lantern, Riverside, February 1949.", nl: "The Blue Lantern, Riverside, februari 1949.", fr: "Le Blue Lantern, Riverside, février 1949.", de: "The Blue Lantern, Riverside, Februar 1949." } },
            { kind: 'caption', x: 36, y: 80, w: 60, text: { en: "Victor Kale ran the best club on the river, and he never sat with his back to the door.", nl: "Victor Kale had de beste club aan de rivier, en hij zat nooit met zijn rug naar de deur.", fr: "Victor Kale tenait le meilleur club du fleuve, et ne tournait jamais le dos à la porte.", de: "Victor Kale führte den besten Club am Fluss und saß nie mit dem Rücken zur Tür." } },
            { kind: 'caption', x: 36, y: 4, w: 60, clear: true, text: { en: "It had rained for three days. On Saturdays the Blue Lantern was full to the doors: thirty little tables, a band, and Lena Marsh singing the first set at nine.", nl: "Het regende al drie dagen. Op zaterdag zat de Blue Lantern tot de deur vol: dertig tafeltjes, een band, en Lena Marsh die om negen uur de eerste set zong.", fr: "Il pleuvait depuis trois jours. Le samedi, le Blue Lantern était plein à craquer : trente petites tables, un orchestre, et Lena Marsh qui chantait le premier set à neuf heures.", de: "Es regnete seit drei Tagen. Samstags war das Blue Lantern bis zur Tür voll: dreißig kleine Tische, eine Band und Lena Marsh, die um neun das erste Set sang." } },
          ],
        },
        {
          id: 'drums',
          drift: 'right',
          layers: [
            { art: 'drums', depth: 0.08 },
            { art: 'drums-drummer', depth: 0.5, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 46, text: { en: "11:35 p.m. The drum solo.", nl: "23.35 uur. De drumsolo.", fr: "23 h 35. Le solo de batterie.", de: "23:35 Uhr. Das Schlagzeugsolo." } },
            { kind: 'caption', x: 50, y: 78, w: 47, text: { en: "Behind the stage, a door closed.", nl: "Achter het podium ging een deur dicht.", fr: "Derrière la scène, une porte se referma.", de: "Hinter der Bühne fiel eine Tür zu." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "For twelve minutes the drummer played so loud that nobody could hear the person at the next table.", nl: "Twaalf minuten lang speelde de drummer zo hard dat niemand zijn buurman nog kon verstaan.", fr: "Pendant douze minutes, le batteur a joué si fort que personne n’entendait plus son voisin de table.", de: "Zwölf Minuten lang spielte der Schlagzeuger so laut, dass niemand mehr seinen Tischnachbarn verstand." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "In the office behind the stage, somebody shot Victor Kale once in the chest. He was found at five past midnight.", nl: "In het kantoor achter het podium schoot iemand Victor Kale één keer in de borst. Hij werd om vijf over twaalf gevonden.", fr: "Dans le bureau derrière la scène, quelqu’un a tiré une balle dans la poitrine de Victor Kale. On l’a trouvé à minuit cinq.", de: "Im Büro hinter der Bühne schoss jemand Victor Kale einmal in die Brust. Er wurde um fünf nach zwölf gefunden." } },
          ],
        },
        {
          id: 'booth',
          drift: 'left',
          layers: [
            { art: 'booth', depth: 0.08 },
            { art: 'booth-men', depth: 0.45, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 34, text: { en: "Booth 9.", nl: "Booth 9.", fr: "Box 9.", de: "Nische 9." } },
            { kind: 'caption', x: 3, y: 76, w: 62, text: { en: "Leonard Vance, the Ashgrove lawyer, and a man nobody could name.", nl: "Leonard Vance, de advocaat van de Ashgroves, en een man die niemand kende.", fr: "Leonard Vance, l’avocat des Ashgrove, et un homme que personne ne connaissait.", de: "Leonard Vance, der Anwalt der Ashgroves, und ein Mann, den niemand kannte." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Booth 9 is the dark one at the back, with a view down the corridor to Kale’s office.", nl: "Booth 9 is het donkere zitje achterin, met zicht op de gang naar Kales kantoor.", fr: "La box 9 est la plus sombre, au fond, avec vue sur le couloir qui mène au bureau de Kale.", de: "Nische 9 ist die dunkle ganz hinten, mit Blick in den Gang zu Kales Büro." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Who was the man sitting with Vance that night? Nobody in the club could tell you. Remember him.", nl: "Wie was de man die die avond bij Vance zat? Niemand in de club kon het je zeggen. Onthoud hem.", fr: "Qui était l’homme assis avec Vance ce soir-là ? Personne au club n’a su vous le dire. Souvenez-vous de lui.", de: "Wer war der Mann, der an diesem Abend bei Vance saß? Niemand im Club konnte es dir sagen. Merk ihn dir." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "Four people who mattered were still in the club when you got there. Each of them says they were somewhere else during the drum solo.", nl: "Toen je aankwam, waren er nog vier mensen in de club die ertoe deden. Elk van hen zegt dat hij tijdens de drumsolo ergens anders was.", fr: "À votre arrivée, quatre personnes qui comptaient étaient encore au club. Chacune affirme qu’elle était ailleurs pendant le solo de batterie.", de: "Als du ankamst, waren noch vier Leute im Club, auf die es ankam. Jeder von ihnen sagt, er sei während des Schlagzeugsolos woanders gewesen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Frank Dellow, manager for twelve years. He runs the door, the staff and the night’s takings. He says he stood at the front door all through the solo.", nl: "Frank Dellow, al twaalf jaar manager. Hij doet de deur, het personeel en de kas van de avond. Hij zegt dat hij de hele solo bij de voordeur stond.", fr: "Frank Dellow, gérant depuis douze ans. Il s’occupe de la porte, du personnel et de la recette du soir. Il dit être resté à l’entrée pendant tout le solo.", de: "Frank Dellow, seit zwölf Jahren Geschäftsführer. Er macht die Tür, das Personal und die Abendkasse. Er sagt, er habe das ganze Solo über am Eingang gestanden." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Lena Marsh, the singer, once Kale’s girl. She says she was alone in her dressing room.", nl: "Lena Marsh, de zangeres, ooit Kales vriendin. Ze zegt dat ze alleen in haar kleedkamer zat.", fr: "Lena Marsh, la chanteuse, autrefois la compagne de Kale. Elle dit qu’elle était seule dans sa loge.", de: "Lena Marsh, die Sängerin, einst Kales Freundin. Sie sagt, sie sei allein in ihrer Garderobe gewesen." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Danny Marsh, her kid brother, tends the bar. He found the body. He says he never left the bar.", nl: "Danny Marsh, haar kleine broer, staat achter de bar. Hij vond het lichaam. Hij zegt dat hij de bar niet verliet.", fr: "Danny Marsh, son petit frère, tient le bar. C’est lui qui a trouvé le corps. Il dit n’avoir jamais quitté le bar.", de: "Danny Marsh, ihr kleiner Bruder, steht hinter der Bar. Er fand die Leiche. Er sagt, er habe die Bar nie verlassen." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Leonard Vance, the Ashgrove lawyer, and Kale’s lawyer too. He says he left before the solo began. Frank telephoned him, and he came back through the rain.", nl: "Leonard Vance, de advocaat van de Ashgroves, en ook die van Kale. Hij zegt dat hij vertrok voor de solo begon. Frank belde hem, en hij kwam terug door de regen.", fr: "Leonard Vance, l’avocat des Ashgrove, et aussi celui de Kale. Il dit être parti avant le début du solo. Frank lui a téléphoné, et il est revenu sous la pluie.", de: "Leonard Vance, der Anwalt der Ashgroves und auch der von Kale. Er sagt, er sei vor dem Solo gegangen. Frank rief ihn an, und er kam durch den Regen zurück." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["sign"],
      panels: [
        {
          id: 'sign',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'sign', depth: 0.08 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 23.0, y: 94, w: 54, from: 'bottom', text: { en: "A gun went off in a room full of people. Nobody heard a thing.", nl: "Er ging een schot af in een zaal vol mensen. Niemand hoorde iets.", fr: "Un coup de feu est parti dans une salle pleine de monde. Personne n’a rien entendu.", de: "In einem Saal voller Menschen fiel ein Schuss. Niemand hörte etwas." } },
            { kind: 'caption', x: 21.0, y: 94, w: 58, from: 'bottom', clear: true, text: { en: "Find the gun and find the reason. Then find out who was not where they said they were.", nl: "Vind het wapen en vind de reden. Zoek dan uit wie niet was waar hij zei dat hij was.", fr: "Trouvez l’arme et trouvez le mobile. Puis découvrez qui n’était pas là où il prétendait être.", de: "Finde die Waffe und finde den Grund. Dann finde heraus, wer nicht dort war, wo er angeblich war." } },
          ],
        },
      ],
    },
  ],
};
