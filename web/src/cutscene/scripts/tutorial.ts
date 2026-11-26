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
            { kind: 'caption', x: 3, y: 4, w: 46, text: { en: "Calder City, 1948. A port town of a million people, built around its harbor.", nl: "Calder City, 1948. Een havenstad van een miljoen mensen, gebouwd rond de haven.", fr: "Calder City, 1948. Une ville portuaire d’un million d’habitants, bâtie autour de son port.", de: "Calder City, 1948. Eine Hafenstadt mit einer Million Menschen, gebaut um ihren Hafen." } },
            { kind: 'caption', x: 52, y: 4, w: 45, text: { en: "Every crate that comes into the city comes over its piers. So does most of the money.", nl: "Elke kist die de stad binnenkomt, komt over de pieren. Net als het meeste geld.", fr: "Chaque caisse qui entre dans la ville passe par ses quais. Comme presque tout l’argent.", de: "Jede Kiste, die in die Stadt kommt, kommt über die Piers. Genau wie das meiste Geld." } },
            { kind: 'caption', x: 28, y: 80, w: 44, text: { en: "And most of the trouble.", nl: "En de meeste ellende.", fr: "Et presque tous les ennuis.", de: "Und der meiste Ärger." } },
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
            { kind: 'caption', x: 3, y: 4, w: 44, text: { en: "Two weeks ago you made detective.", nl: "Twee weken geleden werd je rechercheur.", fr: "Il y a deux semaines, vous êtes passé inspecteur.", de: "Vor zwei Wochen bist du Detective geworden." } },
            { kind: 'caption', x: 53, y: 4, w: 44, text: { en: "Central Station gave you the night desk: everything that happens in the city between dusk and dawn.", nl: "Central Station gaf je de nachtdienst: alles wat er in de stad gebeurt tussen zonsondergang en zonsopgang.", fr: "Central Station vous a confié la permanence de nuit : tout ce qui arrive en ville entre le crépuscule et l’aube.", de: "Die Central Station gab dir den Nachtdienst: alles, was in der Stadt zwischen Abend und Morgen passiert." } },
            { kind: 'caption', x: 3, y: 22, w: 44, text: { en: "The new ones always get the night desk. The Captain likes to see who lasts.", nl: "De nieuwe krijgen altijd de nachtdienst. De Captain kijkt graag wie het volhoudt.", fr: "Les nouveaux ont toujours la permanence de nuit. Le capitaine aime voir qui tient le coup.", de: "Die Neuen kriegen immer den Nachtdienst. Der Captain sieht gern, wer durchhält." } },
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
            { kind: 'caption', x: 2, y: 3, w: 44, text: { en: "Only two people were awake in the Hotel Cardinal at eleven last night.", nl: "Om elf uur gisteravond waren er maar twee mensen wakker in het Hotel Cardinal.", fr: "À onze heures hier soir, deux personnes seulement étaient éveillées à l’Hôtel Cardinal.", de: "Um elf Uhr gestern Abend waren nur zwei Menschen im Hotel Cardinal wach." } },
            { kind: 'caption', x: 2, y: 77, w: 44, text: { en: "Margaret Finch, Walter’s sister. She runs the hotel with him, lives upstairs, and found him at half past six.", nl: "Margaret Finch, Walters zus. Ze runt het hotel met hem, woont boven, en vond hem om half zeven.", fr: "Margaret Finch, la sœur de Walter. Elle tient l’hôtel avec lui, vit à l’étage et l’a trouvé à six heures et demie.", de: "Margaret Finch, Walters Schwester. Sie führt das Hotel mit ihm, wohnt oben und fand ihn um halb sieben." } },
            { kind: 'caption', x: 54, y: 77, w: 44, text: { en: "Leonard Pike, the night clerk. He says he never left the front desk.", nl: "Leonard Pike, de nachtportier. Hij zegt dat hij de balie geen moment verliet.", fr: "Leonard Pike, le veilleur de nuit. Il dit n’avoir jamais quitté la réception.", de: "Leonard Pike, der Nachtportier. Er sagt, er habe die Rezeption nie verlassen." } },
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
            { kind: 'caption', x: 3, y: 4, w: 60, text: { en: "Doyle’s advice was short. Look at everything. Ask everybody. Write it all down.", nl: "Het advies van Doyle was kort. Bekijk alles. Vraag iedereen. Schrijf alles op.", fr: "Le conseil de Doyle était bref. Tout regarder. Interroger tout le monde. Tout noter.", de: "Doyles Rat war kurz. Sieh dir alles an. Frag jeden. Schreib alles auf." } },
            { kind: 'caption', x: 3, y: 72, w: 58, text: { en: "Pin every clue to the board and tie together what belongs together. When the threads all point one way, make your accusation.", nl: "Prik elk spoor op het bord en knoop vast wat bij elkaar hoort. Wijzen alle draadjes één kant op, beschuldig dan.", fr: "Épinglez chaque indice au tableau et reliez ce qui va ensemble. Quand tous les fils pointent dans la même direction, accusez.", de: "Steck jede Spur ans Brett und verbinde, was zusammengehört. Wenn alle Fäden in eine Richtung zeigen, erhebe Anklage." } },
            { kind: 'caption', x: 64, y: 72, w: 33, text: { en: "You only get one.", nl: "Je krijgt maar één kans.", fr: "Vous n’avez droit qu’à une seule.", de: "Du hast nur eine." } },
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
            { kind: 'caption', x: 27, y: 83, w: 46, text: { en: "Somebody in that hotel was lying.", nl: "Iemand in dat hotel loog.", fr: "Quelqu’un dans cet hôtel mentait.", de: "Jemand in diesem Hotel log." } },
          ],
        },
      ],
    },
  ],
};
