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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Radio Calder, October.", nl: "Radio Calder, oktober.", fr: "Radio Calder, octobre.", de: "Radio Calder, Oktober." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Dorothy Vale’s real name was Dora Valinski, and Vernon Clay had been blackmailing her over an old prison sentence. She put a record on the air and strangled him while the city listened.", nl: "Dorothy Vale heette eigenlijk Dora Valinski, en Vernon Clay chanteerde haar met een oude gevangenisstraf. Ze zette een plaat op en wurgde hem terwijl de stad luisterde.", fr: "Dorothy Vale s’appelait en réalité Dora Valinski, et Vernon Clay la faisait chanter avec une vieille condamnation. Elle a passé un disque à l’antenne et l’a étranglé pendant que la ville écoutait.", de: "Dorothy Vale hieß eigentlich Dora Valinski, und Vernon Clay erpresste sie mit einer alten Haftstrafe. Sie legte eine Platte auf und erwürgte ihn, während die Stadt zuhörte." } },
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
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Meanwhile Clara Ashgrove had been reading her father’s trust accounts. The figures were tidy. Too tidy.", nl: "Ondertussen las Clara Ashgrove de rekeningen van het fonds van haar vader. De cijfers klopten. Te mooi.", fr: "Pendant ce temps, Clara Ashgrove lisait les comptes du fonds de son père. Les chiffres étaient nets. Trop nets.", de: "Unterdessen las Clara Ashgrove die Konten des Fonds ihres Vaters. Die Zahlen waren sauber. Zu sauber." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "In December she hired an accountant, Gilbert Ames, to go through every page. Leonard Vance smiled and said she would find it all in order.", nl: "In december huurde ze een accountant in, Gilbert Ames, om elke bladzijde na te lopen. Leonard Vance glimlachte en zei dat ze alles in orde zou vinden.", fr: "En décembre, elle a engagé un comptable, Gilbert Ames, pour éplucher chaque page. Leonard Vance a souri et dit qu’elle trouverait tout en ordre.", de: "Im Dezember beauftragte sie einen Buchprüfer, Gilbert Ames, jede Seite durchzugehen. Leonard Vance lächelte und sagte, sie werde alles in Ordnung finden." } },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Gilbert Ames had been reading the Ashgrove trust books for three weeks. Now he was dead in Suite 1204.", nl: "Gilbert Ames las al drie weken de boeken van het Ashgrove-fonds. Nu lag hij dood in suite 1204.", fr: "Gilbert Ames lisait les livres du fonds Ashgrove depuis trois semaines. Il gisait maintenant mort dans la suite 1204.", de: "Gilbert Ames las seit drei Wochen die Bücher des Ashgrove-Fonds. Jetzt lag er tot in Suite 1204." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Clara Ashgrove had hired him. Leonard Vance was the man whose books he was reading.", nl: "Clara Ashgrove had hem ingehuurd. Leonard Vance was de man wiens boeken hij las.", fr: "Clara Ashgrove l’avait engagé. Leonard Vance était l’homme dont il lisait les livres.", de: "Clara Ashgrove hatte ihn beauftragt. Leonard Vance war der Mann, dessen Bücher er las." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Lorraine Ames, his wife, had been at the Ashgrove table all evening.", nl: "Lorraine Ames, zijn vrouw, zat de hele avond aan de tafel van Ashgrove.", fr: "Lorraine Ames, sa femme, avait passé la soirée à la table Ashgrove.", de: "Lorraine Ames, seine Frau, hatte den ganzen Abend am Ashgrove-Tisch gesessen." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "So had Howard Fowler, his partner of twenty years. All four swore they were in the ballroom at midnight.", nl: "Net als Howard Fowler, zijn partner van twintig jaar. Alle vier zwoeren ze dat ze om middernacht in de balzaal waren.", fr: "Tout comme Howard Fowler, son associé depuis vingt ans. Tous les quatre juraient être dans la salle de bal à minuit.", de: "Ebenso Howard Fowler, sein Partner seit zwanzig Jahren. Alle vier schworen, um Mitternacht im Ballsaal gewesen zu sein." } },
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
          ],
        },
      ],
    },
  ],
};
