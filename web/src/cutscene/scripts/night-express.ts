// The comic strip that opens night-express. Panel art: src/assets/art/cutscenes/night-express/<layer>.webp (shared/ for the board).
import type { Cutscene } from '../types.ts';

export const nightExpressCutscene: Cutscene = {
  id: 'night-express',
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
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Pier Seventeen, April. It was the customs inspector.", nl: "Pier Seventeen, april. Het was de douane-inspecteur.", fr: "Pier Seventeen, avril. C’était l’inspectrice des douanes.", de: "Pier Seventeen, April. Es war die Zollinspektorin." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Ruth Calloway had been paid to stamp smuggled cargo through on Ashgrove ships. Crates of rye whiskey, cleared as machine parts. Six sailings since November.", nl: "Ruth Calloway werd betaald om smokkelwaar op Ashgrove-schepen door te stempelen. Kisten whiskey, ingeklaard als machineonderdelen. Zes afvaarten sinds november.", fr: "Ruth Calloway était payée pour tamponner de la contrebande sur les navires Ashgrove. Des caisses de whisky, dédouanées comme pièces de machines. Six traversées depuis novembre.", de: "Ruth Calloway wurde dafür bezahlt, Schmuggelware auf Ashgrove-Schiffen durchzustempeln. Kisten mit Whiskey, abgefertigt als Maschinenteile. Sechs Fahrten seit November." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "Harold Pike found her signature on every false paper. A decent man, he telephoned to warn her. She walked over through the fog and sent him down the stairs.", nl: "Harold Pike vond haar handtekening op elk vals papier. Als fatsoenlijk man belde hij om haar te waarschuwen. Ze kwam door de mist gelopen en duwde hem de trap af.", fr: "Harold Pike a trouvé sa signature sur chaque faux document. En homme honnête, il l’a appelée pour la prévenir. Elle est venue à pied dans le brouillard et l’a précipité dans l’escalier.", de: "Harold Pike fand ihre Unterschrift auf jedem falschen Papier. Als anständiger Mann rief er an, um sie zu warnen. Sie kam durch den Nebel herüber und stieß ihn die Treppe hinunter." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', clear: true, text: { en: "She burned the stamped papers, but she never knew about his carbon copy. And the watchman had seen her rain cape under the pier lamp.", nl: "Ze verbrandde de gestempelde papieren, maar van zijn doorslag wist ze niets. En de nachtwaker had haar regencape onder de pierlamp gezien.", fr: "Elle a brûlé les papiers tamponnés, mais elle ignorait l’existence de son double au carbone. Et le veilleur avait vu sa cape de pluie sous le lampadaire du quai.", de: "Sie verbrannte die gestempelten Papiere, aber von seinem Durchschlag wusste sie nichts. Und der Wächter hatte ihr Regencape unter der Pierlampe gesehen." } },
          ],
        },
        {
          id: 'board',
          drift: 'out',
          layers: [
            { art: 'news', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 92, text: { en: "Who paid her, she never said. And Vance had been on the pier that night after all, to buy back a folder Pike kept on the Ashgrove trust money. He left before Pike died.", nl: "Wie haar betaalde, zei ze nooit. En Vance was die avond toch op de pier geweest, om een map terug te kopen die Pike bijhield over het geld van het Ashgrove-fonds. Hij vertrok voordat Pike stierf.", fr: "Qui la payait, elle ne l’a jamais dit. Et Vance était bel et bien venu au quai ce soir-là, pour racheter un dossier que Pike tenait sur l’argent du fonds Ashgrove. Il est parti avant la mort de Pike.", de: "Wer sie bezahlte, sagte sie nie. Und Vance war an jenem Abend doch auf dem Pier gewesen, um eine Mappe zurückzukaufen, die Pike über das Geld des Ashgrove-Fonds führte. Er ging, bevor Pike starb." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "A third card on your board, and a second red thread to the same name.", nl: "Een derde kaart op je bord, en een tweede rode draad naar dezelfde naam.", fr: "Une troisième fiche au tableau, et un deuxième fil rouge vers le même nom.", de: "Eine dritte Karte am Brett und ein zweiter roter Faden zum selben Namen." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "The Calder Courier ran the smuggling story for weeks. The State answered with a Waterfront Commission, to hear in public who was getting rich on the piers.", nl: "De Calder Courier schreef wekenlang over de smokkel. De staat antwoordde met een Havencommissie, die in het openbaar zou horen wie er rijk werd op de pieren.", fr: "Le Calder Courier a parlé de la contrebande pendant des semaines. L’État a répondu par une Commission du port, chargée d’entendre en public qui s’enrichissait sur les quais.", de: "Der Calder Courier berichtete wochenlang über den Schmuggel. Der Staat antwortete mit einer Hafenkommission, die öffentlich anhören sollte, wer an den Piers reich wurde." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "Walter Brandt, the paper’s owner, had a file of his own for that commission. In June he took the night train to hand it over himself.", nl: "Walter Brandt, de eigenaar van de krant, had zelf een dossier voor die commissie. In juni nam hij de nachttrein om het persoonlijk af te geven.", fr: "Walter Brandt, le propriétaire du journal, avait son propre dossier pour cette commission. En juin, il a pris le train de nuit pour le remettre en personne.", de: "Walter Brandt, der Besitzer der Zeitung, hatte für diese Kommission ein eigenes Dossier. Im Juni nahm er den Nachtzug, um es selbst zu übergeben." } },
          ],
        },
      ],
    },
    {
      id: 'train',
      columns: '1fr 1.25fr',
      rows: '1fr 1fr',
      areas: ["line knife", "brandt knife"],
      panels: [
        {
          id: 'line',
          drift: 'left',
          layers: [
            { art: 'line', depth: 0.08 },
            { art: 'line-train', depth: 0.5, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 60, text: { en: "The Calder Limited, June 1949.", nl: "The Calder Limited, juni 1949.", fr: "Le Calder Limited, juin 1949.", de: "Der Calder Limited, Juni 1949." } },
            { kind: 'caption', x: 40, y: 76, w: 56, text: { en: "The overnight sleeper to Harmon Junction.", nl: "De nachttrein naar Harmon Junction.", fr: "Le train de nuit pour Harmon Junction.", de: "Der Nachtzug nach Harmon Junction." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "One sleeping car, one dining car, one lounge car. It left Calder City at nine in the evening and was due at Harmon Junction at seven.", nl: "Eén slaapwagen, één restauratiewagen, één salonwagen. Hij vertrok om negen uur ’s avonds uit Calder City en zou om zeven uur in Harmon Junction zijn.", fr: "Une voiture-lits, une voiture-restaurant, une voiture-salon. Il a quitté Calder City à neuf heures du soir et devait arriver à Harmon Junction à sept heures.", de: "Ein Schlafwagen, ein Speisewagen, ein Salonwagen. Er verließ Calder City um neun Uhr abends und sollte um sieben in Harmon Junction sein." } },
          ],
        },
        {
          id: 'brandt',
          drift: 'in',
          layers: [
            { art: 'brandt', depth: 0.08 },
            { art: 'brandt-brandt', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 58, y: 4, w: 39, text: { en: "Walter Brandt had a file for the Waterfront Commission.", nl: "Walter Brandt had een dossier voor de Waterfront Commission.", fr: "Walter Brandt avait un dossier pour la Waterfront Commission.", de: "Walter Brandt hatte eine Akte für die Waterfront Commission." } },
            { kind: 'balloon', x: 56, y: 54, w: 40, tail: { x: 40, y: 36 }, text: { en: "Item seven, Paul.", nl: "Punt zeven, Paul.", fr: "Point sept, Paul.", de: "Punkt sieben, Paul." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Brandt, fifty-four: loud, stubborn and hard to frighten. Eight months of work on waterfront contracts were in that file.", nl: "Brandt, vierenvijftig: luid, koppig en niet snel bang. In dat dossier zat acht maanden werk over havencontracten.", fr: "Brandt, cinquante-quatre ans : bruyant, têtu et difficile à effrayer. Ce dossier contenait huit mois de travail sur les contrats du port.", de: "Brandt, vierundfünfzig: laut, stur und schwer einzuschüchtern. In diesem Dossier steckten acht Monate Arbeit über Hafenverträge." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "That evening he went through it one last time with his star reporter, in Compartment C.", nl: "Die avond nam hij het nog één keer door met zijn sterverslaggever, in coupé C.", fr: "Ce soir-là, il l’a relu une dernière fois avec son reporter vedette, dans le compartiment C.", de: "An diesem Abend ging er es ein letztes Mal mit seinem Starreporter durch, in Abteil C." } },
          ],
        },
        {
          id: 'knife',
          drift: 'right',
          layers: [
            { art: 'knife', depth: 0.08 },
            { art: 'knife-hand', depth: 0.6, enter: 'right', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 60, text: { en: "In the dining car, nobody counted the knives.", nl: "In de restauratiewagen telde niemand de messen.", fr: "Au wagon-restaurant, personne ne comptait les couteaux.", de: "Im Speisewagen zählte niemand die Messer." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "At five past midnight the porter brought coffee to Compartment C and found Brandt dead in his berth, stabbed once under the ribs.", nl: "Om vijf over twaalf bracht de conducteur koffie naar coupé C en vond Brandt dood in zijn bed, één keer gestoken onder de ribben.", fr: "À minuit cinq, le steward a apporté du café au compartiment C et a trouvé Brandt mort sur sa couchette, poignardé une fois sous les côtes.", de: "Um fünf nach zwölf brachte der Schaffner Kaffee in Abteil C und fand Brandt tot in seinem Bett, einmal unter die Rippen gestochen." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "The knife was gone. The train was stopped at Ferris Crossing, and nobody has left the sleeping car since.", nl: "Het mes was weg. De trein werd stilgezet bij Ferris Crossing, en sindsdien heeft niemand de slaapwagen verlaten.", fr: "Le couteau avait disparu. Le train a été arrêté à Ferris Crossing, et depuis, personne n’a quitté la voiture-lits.", de: "Das Messer war weg. Der Zug wurde in Ferris Crossing angehalten, und seitdem hat niemand den Schlafwagen verlassen." } },
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
            { kind: 'caption', x: 3, y: 4, w: 70, text: { en: "Four people were in that sleeping car with him. You came out on the engine of the milk train to question them before the train moves again.", nl: "Vier mensen zaten met hem in die slaapwagen. Je kwam op de locomotief van de melktrein om ze te ondervragen voordat de trein weer vertrekt.", fr: "Quatre personnes se trouvaient avec lui dans cette voiture-lits. Vous êtes venu sur la locomotive du train du lait pour les interroger avant que le train ne reparte.", de: "Vier Menschen waren mit ihm in diesem Schlafwagen. Du bist auf der Lok des Milchzugs gekommen, um sie zu befragen, bevor der Zug weiterfährt." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', text: { en: "Irene Brandt, his wife. She had not wanted him to go. She says she took a sleeping powder at eleven and heard nothing.", nl: "Irene Brandt, zijn vrouw. Ze had niet gewild dat hij ging. Ze zegt dat ze om elf uur een slaappoeder nam en niets hoorde.", fr: "Irene Brandt, sa femme. Elle ne voulait pas qu’il parte. Elle dit avoir pris un somnifère à onze heures et n’avoir rien entendu.", de: "Irene Brandt, seine Frau. Sie hatte nicht gewollt, dass er fährt. Sie sagt, sie habe um elf ein Schlafpulver genommen und nichts gehört." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Paul Sutter, twenty-nine, his star reporter, who carried the Courier’s half of the file. He says he was writing in the lounge car until midnight.", nl: "Paul Sutter, negenentwintig, zijn sterverslaggever, die de helft van het dossier bij zich had. Hij zegt dat hij tot middernacht in de salonwagen zat te schrijven.", fr: "Paul Sutter, vingt-neuf ans, son reporter vedette, qui portait la moitié du dossier. Il dit avoir écrit dans la voiture-salon jusqu’à minuit.", de: "Paul Sutter, neunundzwanzig, sein Starreporter, der die Hälfte des Dossiers bei sich trug. Er sagt, er habe bis Mitternacht im Salonwagen geschrieben." } },
            { kind: 'caption', x: 2, y: 94, w: 47, from: 'bottom', clear: true, text: { en: "Conrad Teague built half the waterfront. His name is all over that file, and he was travelling to the same hearing. He says he played cards with the conductor.", nl: "Conrad Teague bouwde de halve haven. Zijn naam staat overal in dat dossier, en hij reisde naar dezelfde hoorzitting. Hij zegt dat hij zat te kaarten met de treinchef.", fr: "Conrad Teague a construit la moitié du port. Son nom est partout dans ce dossier, et il se rendait à la même audience. Il dit avoir joué aux cartes avec le chef de train.", de: "Conrad Teague hat den halben Hafen gebaut. Sein Name steht überall in diesem Dossier, und er fuhr zur selben Anhörung. Er sagt, er habe mit dem Zugführer Karten gespielt." } },
            { kind: 'caption', x: 51, y: 94, w: 47, from: 'bottom', text: { en: "Gus Malloy, the porter, twenty-two years on this car. He says he sat on his seat at the end of the corridor all night. Nobody could pass him unseen.", nl: "Gus Malloy, de conducteur, al tweeëntwintig jaar op deze wagen. Hij zegt dat hij de hele nacht op zijn stoel aan het eind van de gang zat. Niemand kon ongezien langs hem.", fr: "Gus Malloy, le steward, vingt-deux ans sur cette voiture. Il dit être resté toute la nuit sur son siège au bout du couloir. Personne ne pouvait passer sans qu’il le voie.", de: "Gus Malloy, der Schaffner, seit zweiundzwanzig Jahren auf diesem Wagen. Er sagt, er habe die ganze Nacht auf seinem Platz am Ende des Gangs gesessen. Niemand kam ungesehen an ihm vorbei." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["stop"],
      panels: [
        {
          id: 'stop',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'stop', depth: 0.08 },
            { art: 'stop-crew', depth: 0.5, enter: 'left', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 25.0, y: 94, w: 50, from: 'bottom', text: { en: "Twelve minutes at the water stop.", nl: "Twaalf minuten bij de waterstop.", fr: "Douze minutes à l’arrêt de ravitaillement en eau.", de: "Zwölf Minuten am Wasserhalt." } },
            { kind: 'caption', x: 21.0, y: 94, w: 58, from: 'bottom', clear: true, text: { en: "Somebody went into Compartment C while nobody was watching the corridor. Find out when that was, and who.", nl: "Iemand ging coupé C binnen terwijl niemand op de gang lette. Zoek uit wanneer dat was, en wie.", fr: "Quelqu’un est entré dans le compartiment C pendant que personne ne surveillait le couloir. Découvrez quand, et qui.", de: "Jemand ging in Abteil C, während niemand den Gang im Blick hatte. Finde heraus, wann das war und wer." } },
          ],
        },
      ],
    },
  ],
};
