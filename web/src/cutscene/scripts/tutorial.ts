// The prologue: your first night on the night desk, and the call to the Hotel Cardinal.
import type { Cutscene } from '../types.ts';

export const tutorialCutscene: Cutscene = {
  id: 'tutorial',
  pages: [
    {
      id: 'city',
      columns: '1fr',
      rows: '1fr',
      areas: ["city"],
      panels: [
        {
          id: 'city',
          drift: 'in',
          layers: [
            { art: 'city', depth: 0.08 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 44, text: { en: "Calder City, 1948. A port town of a million people, built around its harbor.", nl: "Calder City, 1948. Een havenstad van een miljoen mensen, gebouwd rond haar haven.", fr: "Calder City, 1948. Une ville portuaire d’un million d’habitants, bâtie autour de son port.", de: "Calder City, 1948. Eine Hafenstadt mit einer Million Menschen, gebaut um ihren Hafen." } },
            { kind: 'caption', x: 53, y: 4, w: 44, text: { en: "Every crate that comes into the city comes over its piers. So does most of the money.", nl: "Elke kist die de stad binnenkomt, komt over haar pieren. Het meeste geld ook.", fr: "Chaque caisse qui entre dans la ville passe par ses quais. Presque tout l’argent aussi.", de: "Jede Kiste, die in die Stadt kommt, kommt über ihre Piers. Das meiste Geld auch." } },
            { kind: 'caption', x: 30.0, y: 94, w: 40, from: 'bottom', text: { en: "And most of the trouble.", nl: "En de meeste ellende.", fr: "Et presque tous les ennuis.", de: "Und der meiste Ärger." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "The harbor feeds everybody: the shipping families up in the Heights, the dockers of Riverside, the customs men, the lawyers and the newspapers.", nl: "De haven voedt iedereen: de redersfamilies boven in de Heights, de dokwerkers van Riverside, de douaniers, de advocaten en de kranten.", fr: "Le port nourrit tout le monde : les familles d’armateurs sur les Heights, les dockers de Riverside, les douaniers, les avocats et les journaux.", de: "Der Hafen ernährt alle: die Reederfamilien oben in den Heights, die Hafenarbeiter von Riverside, die Zöllner, die Anwälte und die Zeitungen." } },
            { kind: 'caption', x: 3, y: 94, w: 62, from: 'bottom', text: { en: "Where that much money changes hands, people lie for it, steal for it and, now and then, kill for it. Somebody has to find out who.", nl: "Waar zoveel geld van hand tot hand gaat, wordt ervoor gelogen, gestolen en af en toe gemoord. Iemand moet uitzoeken door wie.", fr: "Là où tant d’argent change de mains, on ment, on vole et, de temps en temps, on tue pour lui. Il faut bien que quelqu’un trouve qui.", de: "Wo so viel Geld den Besitzer wechselt, wird dafür gelogen, gestohlen und hin und wieder gemordet. Jemand muss herausfinden, von wem." } },
          ],
        },
      ],
    },
    {
      id: 'badge',
      columns: '1fr',
      rows: '1fr',
      areas: ["badge"],
      panels: [
        {
          id: 'badge',
          drift: 'in',
          layers: [
            { art: 'badge', depth: 0.08 },
            { art: 'badge-badge', depth: 0.55, enter: 'zoom', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 44, text: { en: "Two weeks ago you made detective.", nl: "Twee weken geleden werd je rechercheur.", fr: "Il y a deux semaines, vous êtes devenu inspecteur.", de: "Vor zwei Wochen wurdest du Detective." } },
            { kind: 'caption', x: 53, y: 4, w: 44, text: { en: "Central Station gave you the night desk: everything that happens in the city between dusk and dawn.", nl: "Central Station gaf je de nachtdienst: alles wat er in de stad gebeurt tussen zonsondergang en zonsopgang.", fr: "Central Station vous a confié la permanence de nuit : tout ce qui arrive en ville entre le crépuscule et l’aube.", de: "Central Station gab dir den Nachtdienst: alles, was in der Stadt zwischen Abend und Morgen geschieht." } },
            { kind: 'caption', x: 3, y: 22, w: 44, text: { en: "The new ones always get the night desk. The Captain likes to see who lasts.", nl: "De nieuwelingen krijgen altijd de nachtdienst. De Captain ziet graag wie het volhoudt.", fr: "Les nouveaux ont toujours la permanence de nuit. Le capitaine aime voir qui tient le coup.", de: "Die Neuen kriegen immer den Nachtdienst. Der Captain sieht gern, wer durchhält." } },
            { kind: 'caption', x: 3, y: 4, w: 44, clear: true, text: { en: "You have no partner and no name yet. You have a badge, a notebook, and a telephone that only rings when something has gone badly wrong.", nl: "Je hebt nog geen partner en geen naam. Je hebt een penning, een notitieboek en een telefoon die alleen gaat als er iets goed mis is.", fr: "Vous n’avez encore ni équipier ni réputation. Vous avez un insigne, un carnet et un téléphone qui ne sonne que lorsque quelque chose a très mal tourné.", de: "Du hast noch keinen Partner und keinen Namen. Du hast eine Marke, ein Notizbuch und ein Telefon, das nur klingelt, wenn etwas gründlich schiefgegangen ist." } },
            { kind: 'caption', x: 53, y: 4, w: 44, text: { en: "This is the story of your first two years on that desk. Eleven deaths, and one name that keeps turning up beside them.", nl: "Dit is het verhaal van je eerste twee jaar in die nachtdienst. Elf doden, en één naam die er steeds weer naast opduikt.", fr: "Voici l’histoire de vos deux premières années à ce poste. Onze morts, et un nom qui revient sans cesse à côté d’eux.", de: "Das ist die Geschichte deiner ersten zwei Jahre in diesem Dienst. Elf Tote und ein Name, der immer wieder neben ihnen auftaucht." } },
          ],
        },
      ],
    },
    {
      id: 'arrival',
      columns: '1.25fr 1fr',
      rows: '1fr 1fr',
      areas: ["street office", "street door"],
      panels: [
        {
          id: 'street',
          drift: 'in',
          layers: [
            { art: 'street-sky', depth: 0.05 },
            { art: 'street-detective', depth: 0.7, enter: 'left', delay: 0.35 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 4, y: 4, w: 62, text: { en: "Calder City, October 1948.", nl: "Calder City, oktober 1948.", fr: "Calder City, octobre 1948.", de: "Calder City, Oktober 1948." } },
            { kind: 'caption', x: 44, y: 76, w: 52, text: { en: "Three days of rain, and your first night on the night desk was nearly over.", nl: "Drie dagen regen, en je eerste nachtdienst zat er bijna op.", fr: "Trois jours de pluie, et votre première nuit de garde touchait presque à sa fin.", de: "Drei Tage Regen, und deine erste Nachtschicht war fast vorbei." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Wednesday, 13 October. All night the telephone had kept quiet. You were starting to think the job was easy.", nl: "Woensdag 13 oktober. De hele nacht had de telefoon gezwegen. Je begon te denken dat het werk meeviel.", fr: "Mercredi 13 octobre. Toute la nuit, le téléphone était resté muet. Vous commenciez à croire que le métier était facile.", de: "Mittwoch, 13. Oktober. Die ganze Nacht war das Telefon still geblieben. Du fingst an zu glauben, die Arbeit sei leicht." } },
            { kind: 'caption', x: 3, y: 94, w: 60, from: 'bottom', text: { en: "At a quarter to seven it rang.", nl: "Om kwart voor zeven ging hij.", fr: "À sept heures moins le quart, il a sonné.", de: "Um Viertel vor sieben klingelte es." } },
          ],
        },
        {
          id: 'office',
          drift: 'left',
          layers: [
            { art: 'office-wall', depth: 0.05 },
            { art: 'office-captain', depth: 0.35, enter: 'up', delay: 0.1 },
            { art: 'office-desk', depth: 0.6 },
            { art: 'office-light', depth: 0.85, enter: 'fade', delay: 0.2 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 50, text: { en: "Central Station, 6:45 a.m.", nl: "Central Station, 6.45 uur.", fr: "Central Station, 6 h 45.", de: "Central Station, 6:45 Uhr." } },
            { kind: 'balloon', x: 3, y: 26, w: 44, tail: { x: 52, y: 45 }, text: { en: "Hotel Cardinal, on Delancey. The owner's on his office floor.", nl: "Hotel Cardinal, op Delancey. De eigenaar ligt op de vloer van zijn kantoor.", fr: "Hôtel Cardinal, sur Delancey. Le patron est étendu par terre dans son bureau.", de: "Hotel Cardinal, in der Delancey. Der Besitzer liegt auf dem Boden seines Büros." } },
            { kind: 'balloon', x: 60, y: 6, w: 37, tail: { x: 58, y: 44 }, text: { en: "Your first case, Detective. Keep it simple.", nl: "Je eerste zaak, rechercheur. Hou het simpel.", fr: "Votre première affaire, inspecteur. Faites simple.", de: "Dein erster Fall, Detective. Halt es einfach." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "The Captain has run Central Station for twenty years. He hands out the cases, and he likes them closed quickly and quietly.", nl: "De Captain leidt Central Station al twintig jaar. Hij deelt de zaken uit, en hij ziet ze graag snel en stil gesloten.", fr: "Le capitaine dirige Central Station depuis vingt ans. C’est lui qui distribue les affaires, et il les aime bouclées vite et sans bruit.", de: "Der Captain leitet Central Station seit zwanzig Jahren. Er verteilt die Fälle, und er hat sie gern schnell und leise erledigt." } },
          ],
        },
        {
          id: 'door',
          drift: 'right',
          layers: [
            { art: 'door-lobby', depth: 0.08 },
            { art: 'door-doyle', depth: 0.45, enter: 'right', delay: 0.15 },
            { art: 'door-shoulder', depth: 0.9, enter: 'left', delay: 0.05 },
            { art: 'rain', depth: 1 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 5, w: 50, text: { en: "Delancey Street, 7:05 a.m.", nl: "Delancey Street, 7.05 uur.", fr: "Delancey Street, 7 h 05.", de: "Delancey Street, 7:05 Uhr." } },
            { kind: 'balloon', x: 20, y: 24, w: 34, tail: { x: 62, y: 40 }, text: { en: "Sergeant Doyle. I walk this beat.", nl: "Sergeant Doyle. Dit is mijn wijk.", fr: "Sergent Doyle. C'est mon secteur.", de: "Sergeant Doyle. Das ist mein Revier." } },
            { kind: 'balloon', x: 62, y: 58, w: 36, tail: { x: 66, y: 43 }, text: { en: "Walter meant to ring me this morning, about his safe. Too late now.", nl: "Walter wou me vanochtend bellen, over zijn kluis. Te laat nu.", fr: "Walter devait m'appeler ce matin, pour son coffre. Trop tard, maintenant.", de: "Walter wollte mich heute früh anrufen, wegen seines Safes. Jetzt ist es zu spät." } },
            { kind: 'caption', x: 3, y: 4, w: 92, clear: true, text: { en: "Doyle has walked Delancey Street for thirty years and knows every door on it. On this first case he shows you how the work is done.", nl: "Doyle loopt al dertig jaar zijn ronde door Delancey Street en kent er elke deur. Bij deze eerste zaak laat hij je zien hoe het werk gaat.", fr: "Doyle arpente Delancey Street depuis trente ans et en connaît chaque porte. Pour cette première affaire, il vous montre comment on travaille.", de: "Doyle geht seit dreißig Jahren Streife in der Delancey Street und kennt dort jede Tür. Bei diesem ersten Fall zeigt er dir, wie die Arbeit geht." } },
            { kind: 'caption', x: 3, y: 94, w: 92, from: 'bottom', text: { en: "The dead man is Walter Finch, fifty-eight. For twenty years he owned the Hotel Cardinal, and every evening he counted its safe himself.", nl: "De dode is Walter Finch, achtenvijftig. Twintig jaar was hij eigenaar van het Hotel Cardinal, en elke avond telde hij zelf de kluis.", fr: "Le mort s’appelle Walter Finch, cinquante-huit ans. Propriétaire de l’Hôtel Cardinal depuis vingt ans, il comptait lui-même le coffre chaque soir.", de: "Der Tote ist Walter Finch, achtundfünfzig. Zwanzig Jahre gehörte ihm das Hotel Cardinal, und jeden Abend zählte er selbst den Safe." } },
          ],
        },
      ],
    },
    {
      id: 'lobby',
      columns: '1fr',
      rows: '1fr',
      areas: ["lobby"],
      panels: [
        {
          id: 'lobby',
          drift: 'left',
          layers: [
            { art: 'lobby', depth: 0.08 },
            { art: 'lobby-people', depth: 0.45, enter: 'fade', delay: 0.15 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 50, text: { en: "Walter Finch was struck once on the head with the heavy brass doorstop from his own office door. The police surgeon says it happened at about eleven last night.", nl: "Walter Finch kreeg één klap op zijn hoofd met de zware koperen deurstop van zijn eigen kantoordeur. Volgens de politiearts gebeurde het gisteravond rond elf uur.", fr: "Walter Finch a reçu un seul coup à la tête, porté avec le lourd butoir en laiton de la porte de son bureau. D’après le médecin légiste, c’était hier soir vers onze heures.", de: "Walter Finch wurde einmal auf den Kopf geschlagen, mit dem schweren Messing-Türstopper seiner eigenen Bürotür. Der Polizeiarzt sagt, es geschah gestern Abend gegen elf." } },
            { kind: 'caption', x: 3, y: 4, w: 44, clear: true, text: { en: "Only two people were awake in the hotel at that hour.", nl: "Op dat uur waren er maar twee mensen wakker in het hotel.", fr: "À cette heure-là, deux personnes seulement étaient éveillées dans l’hôtel.", de: "Um diese Zeit waren nur zwei Menschen im Hotel wach." } },
            { kind: 'caption', x: 2, y: 94, w: 45, from: 'bottom', text: { en: "Margaret Finch, his sister. She runs the hotel with him and lives upstairs. She found him at half past six this morning. They had quarrelled: she wanted to sell the hotel, and he did not.", nl: "Margaret Finch, zijn zus. Ze runt het hotel met hem en woont boven. Ze vond hem vanochtend om half zeven. Ze hadden ruzie: zij wilde het hotel verkopen, hij niet.", fr: "Margaret Finch, sa sœur. Elle tient l’hôtel avec lui et vit à l’étage. Elle l’a trouvé ce matin à six heures et demie. Ils s’étaient disputés : elle voulait vendre l’hôtel, lui non.", de: "Margaret Finch, seine Schwester. Sie führt das Hotel mit ihm und wohnt oben. Sie fand ihn heute früh um halb sieben. Sie hatten gestritten: Sie wollte das Hotel verkaufen, er nicht." } },
            { kind: 'caption', x: 53, y: 94, w: 45, from: 'bottom', text: { en: "Leonard Pike, twenty-seven, the night clerk. He says he stood at the front desk from ten o’clock until morning and never left the lobby.", nl: "Leonard Pike, zevenentwintig, de nachtportier. Hij zegt dat hij van tien uur tot de ochtend achter de balie stond en de lobby geen moment verliet.", fr: "Leonard Pike, vingt-sept ans, le veilleur de nuit. Il dit être resté à la réception de dix heures jusqu’au matin, sans jamais quitter le hall.", de: "Leonard Pike, siebenundzwanzig, der Nachtportier. Er sagt, er habe von zehn Uhr bis zum Morgen an der Rezeption gestanden und die Lobby nie verlassen." } },
            { kind: 'caption', x: 3, y: 4, w: 44, clear: true, text: { en: "One of them went into that office at eleven. Both say they did not.", nl: "Een van hen ging om elf uur dat kantoor binnen. Allebei zeggen ze van niet.", fr: "L’un des deux est entré dans ce bureau à onze heures. Tous deux affirment que non.", de: "Einer von beiden ging um elf in dieses Büro. Beide sagen, sie waren es nicht." } },
          ],
        },
      ],
    },
    {
      id: 'notebook',
      columns: '1fr',
      rows: '1fr',
      areas: ["notebook"],
      panels: [
        {
          id: 'notebook',
          drift: 'in',
          layers: [
            { art: 'notebook', depth: 0.08 },
          ],
          beats: [
            { kind: 'caption', x: 3, y: 4, w: 58, text: { en: "Doyle’s advice was short. Look at everything. Ask everybody. Write it all down.", nl: "Het advies van Doyle was kort. Bekijk alles. Vraag iedereen. Schrijf alles op.", fr: "Le conseil de Doyle était bref. Tout regarder. Interroger tout le monde. Tout noter.", de: "Doyles Rat war kurz. Sieh dir alles an. Frag jeden. Schreib alles auf." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "This is how every case goes. First you search the rooms. Anything that looks out of place goes into your notebook as evidence.", nl: "Zo gaat elke zaak. Eerst doorzoek je de kamers. Alles wat niet op zijn plaats lijkt, gaat als bewijs in je notitieboek.", fr: "Chaque affaire se déroule ainsi. D’abord, vous fouillez les pièces. Tout ce qui semble ne pas être à sa place entre dans votre carnet comme indice.", de: "So läuft jeder Fall. Zuerst durchsuchst du die Räume. Alles, was fehl am Platz wirkt, kommt als Beweis in dein Notizbuch." } },
            { kind: 'caption', x: 3, y: 94, w: 62, from: 'bottom', text: { en: "Then you question the people. Everybody has a story about where they were. Put your evidence in front of them and see whose story cracks.", nl: "Daarna ondervraag je de mensen. Iedereen heeft een verhaal over waar hij was. Leg ze je bewijs voor en kijk wiens verhaal barst.", fr: "Ensuite, vous interrogez les gens. Chacun a son histoire sur l’endroit où il se trouvait. Mettez-leur vos indices sous les yeux et voyez quelle histoire se fissure.", de: "Dann befragst du die Leute. Jeder hat eine Geschichte darüber, wo er war. Leg ihnen deine Beweise vor und sieh, wessen Geschichte Risse bekommt." } },
            { kind: 'caption', x: 3, y: 4, w: 58, clear: true, text: { en: "Pin every clue to the board and tie together with red thread what belongs together. When the threads all point one way, make your accusation.", nl: "Prik elk spoor op het bord en verbind met rode draad wat bij elkaar hoort. Wijzen alle draden één kant op, beschuldig dan.", fr: "Épinglez chaque indice au tableau et reliez d’un fil rouge ce qui va ensemble. Quand tous les fils pointent dans la même direction, accusez.", de: "Steck jede Spur ans Brett und verbinde mit rotem Faden, was zusammengehört. Wenn alle Fäden in eine Richtung zeigen, erhebe Anklage." } },
            { kind: 'caption', x: 3, y: 94, w: 62, from: 'bottom', text: { en: "You must show three things: who did it, why, and how. And you only get to accuse once.", nl: "Je moet drie dingen aantonen: wie het deed, waarom, en hoe. En je mag maar één keer beschuldigen.", fr: "Vous devez montrer trois choses : qui l’a fait, pourquoi, et comment. Et vous n’avez droit qu’à une seule accusation.", de: "Du musst drei Dinge zeigen: wer es war, warum und wie. Und du darfst nur einmal anklagen." } },
          ],
        },
      ],
    },
    {
      id: 'title',
      columns: '1fr',
      rows: '1fr',
      areas: ["title"],
      panels: [
        {
          id: 'title',
          drift: 'out',
          titleCard: true,
          layers: [
            { art: 'floor', depth: 0.1 },
            { art: 'floor-doorstop', depth: 0.45, enter: 'zoom', delay: 0.1 },
          ],
          beats: [
            { kind: 'caption', x: 25.0, y: 94, w: 50, from: 'bottom', text: { en: "A small case, the Captain said. A good one to learn on.", nl: "Een kleine zaak, zei de Captain. Een goede om het vak op te leren.", fr: "Une petite affaire, a dit le capitaine. Parfaite pour apprendre.", de: "Ein kleiner Fall, sagte der Captain. Ein guter zum Lernen." } },
            { kind: 'caption', x: 27.0, y: 94, w: 46, from: 'bottom', clear: true, text: { en: "Somebody in that hotel was lying.", nl: "Iemand in dat hotel loog.", fr: "Quelqu’un dans cet hôtel mentait.", de: "Jemand in diesem Hotel log." } },
          ],
        },
      ],
    },
  ],
};
