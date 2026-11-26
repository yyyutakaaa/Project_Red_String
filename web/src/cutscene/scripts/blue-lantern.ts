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
            { kind: 'caption', x: 3, y: 4, w: 56, text: { en: "Ashgrove House, October.", nl: "Ashgrove House, oktober.", fr: "Ashgrove House, octobre.", de: "Ashgrove House, Oktober." } },
            { kind: 'caption', x: 3, y: 64, w: 64, text: { en: "Simon Whitlock had forged Edmund’s name on a forty-thousand-dollar loan. When the old man found out, Simon emptied his heart drops into the brandy.", nl: "Simon Whitlock had Edmunds naam vervalst op een lening van veertigduizend dollar. Toen de oude man het ontdekte, goot Simon zijn hartdruppels in de cognac.", fr: "Simon Whitlock avait imité la signature d’Edmund sur un prêt de quarante mille dollars. Quand le vieil homme l’a découvert, Simon a vidé ses gouttes pour le cœur dans le cognac.", de: "Simon Whitlock hatte Edmunds Namen auf einem Kredit über vierzigtausend Dollar gefälscht. Als der alte Mann es herausfand, schüttete Simon die Herztropfen in den Brandy." } },
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
            { kind: 'caption', x: 4, y: 4, w: 90, text: { en: "Clara Ashgrove took over her father’s company. Leonard Vance stayed on as keeper of the family money.", nl: "Clara Ashgrove nam het bedrijf van haar vader over. Leonard Vance bleef het familiegeld beheren.", fr: "Clara Ashgrove a repris la compagnie de son père. Leonard Vance est resté gardien de l’argent de la famille.", de: "Clara Ashgrove übernahm die Firma ihres Vaters. Leonard Vance verwaltete weiter das Familiengeld." } },
            { kind: 'caption', x: 4, y: 74, w: 90, text: { en: "Two cards on your board. Then four quiet months, until a nightclub owner was shot in the middle of a drum solo.", nl: "Twee kaarten op je bord. Daarna vier rustige maanden, tot een clubeigenaar werd neergeschoten midden in een drumsolo.", fr: "Deux fiches au tableau. Puis quatre mois calmes, jusqu’à ce qu’un patron de club soit abattu en plein solo de batterie.", de: "Zwei Karten am Brett. Dann vier ruhige Monate, bis ein Clubbesitzer mitten in einem Schlagzeugsolo erschossen wurde." } },
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
            { kind: 'caption', x: 3, y: 4, w: 46, text: { en: "Victor Kale started out in the twenties, running rum across the Sound by night.", nl: "Victor Kale begon in de jaren twintig, met rum die hij ’s nachts over de Sound smokkelde.", fr: "Victor Kale avait commencé dans les années vingt, en passant du rhum à travers le détroit, de nuit.", de: "Victor Kale fing in den Zwanzigern an und schmuggelte nachts Rum über den Sund." } },
            { kind: 'caption', x: 52, y: 76, w: 45, text: { en: "When the law changed, he bought a liquor license, then a club. He was generous with drinks and merciless with debts.", nl: "Toen de wet veranderde, kocht hij een drankvergunning, en daarna een club. Gul met drank, genadeloos met schulden.", fr: "Quand la loi a changé, il a acheté une licence, puis un club. Généreux avec l’alcool, impitoyable avec les dettes.", de: "Als sich das Gesetz änderte, kaufte er eine Schanklizenz und dann einen Club. Großzügig mit Drinks, gnadenlos mit Schulden." } },
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
            { kind: 'caption', x: 2, y: 54, w: 47, text: { en: "Four people who mattered were still in the club when you got there.", nl: "Toen je aankwam, waren er nog vier mensen in de club die ertoe deden.", fr: "Quatre personnes qui comptaient étaient encore au club à votre arrivée.", de: "Vier Menschen, auf die es ankam, waren noch im Club, als du ankamst." } },
            { kind: 'caption', x: 51, y: 54, w: 47, text: { en: "Leonard Vance, Kale’s lawyer too. Frank had telephoned him first, and he came back through the rain.", nl: "Leonard Vance, ook Kales advocaat. Frank had hem als eerste gebeld, en hij kwam terug door de regen.", fr: "Leonard Vance, l’avocat de Kale aussi. Frank l’avait appelé en premier, et il était revenu sous la pluie.", de: "Leonard Vance, auch Kales Anwalt. Frank hatte ihn zuerst angerufen, und er kam durch den Regen zurück." } },
            { kind: 'caption', x: 2, y: 76, w: 47, text: { en: "Frank Dellow, the manager. He ran the door, the staff and the night’s takings.", nl: "Frank Dellow, de manager. Hij deed de deur, het personeel en de kas van de avond.", fr: "Frank Dellow, le gérant. Il tenait la porte, le personnel et la caisse du soir.", de: "Frank Dellow, der Geschäftsführer. Er machte die Tür, das Personal und die Abendkasse." } },
            { kind: 'caption', x: 51, y: 76, w: 47, text: { en: "Lena Marsh sang there. She had been Kale’s girl once. Her kid brother Danny tended bar.", nl: "Lena Marsh zong er. Ze was ooit Kales vriendin geweest. Haar kleine broer Danny stond achter de bar.", fr: "Lena Marsh y chantait. Elle avait été la petite amie de Kale. Son jeune frère Danny tenait le bar.", de: "Lena Marsh sang dort. Sie war einmal Kales Freundin gewesen. Ihr kleiner Bruder Danny stand hinter der Bar." } },
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
            { kind: 'caption', x: 24, y: 83, w: 52, text: { en: "Nobody heard a thing.", nl: "Niemand hoorde iets.", fr: "Personne n'avait rien entendu.", de: "Niemand hatte etwas gehört." } },
          ],
        },
      ],
    },
  ],
};
