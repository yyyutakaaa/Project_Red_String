# Project Red String

Een noir detectivespel in de browser. Je ondervraagt verdachten in je eigen woorden, en zij kunnen liegen. Jij moet het bewijzen.

Spelen kan op https://project-red-string.vercel.app

## Wat is het

Je leest eerst de briefing van een zaak. Daarna doorzoek je de kamers en klik je op wat je opvalt. Wat belangrijk is, komt in je dossier. De verdachten ondervraag je door gewoon te typen, en een AI-model speelt hun rol. Toon je een verdachte het juiste bewijs, dan moet die erop antwoorden en geeft die soms iets nieuws prijs.

Op een bord met rode draad hang je bewijs en verdachten op en verbind je ze. Als je zeker bent, beschuldig je iemand met twee tot vier stukken bewijs. Je krijgt maar één poging.

Er zijn tien zaken, allemaal met de hand geschreven. Samen vormen ze één verhaal in Calder City, van oktober 1948 tot juni 1950. Een zaak gaat pas open als je de vorige hebt afgesloten.

## Hoe het in elkaar zit

Het spel zelf draait volledig in de browser. Kamers, notitieboek, bord, punten en saves staan lokaal, in localStorage.

Alleen de ondervragingen gaan naar de server. Dat is de edge function `interrogate` op Supabase. Die laadt de zaak aan de serverkant en bouwt de prompt met alleen het blad van die ene verdachte en de publieke feiten. De oplossing en de geheimen van andere verdachten komen er nooit in. Het antwoord komt gestreamd terug via SSE.

De server kijkt ook zelf welke aanwijzingen een verdachte mag prijsgeven. Het geduld per verdachte, de rate limits en een maximum aan kosten per dag worden in Postgres bijgehouden.

De API-sleutels staan alleen als secret op Supabase. De frontend kent enkel de Supabase-URL en de publishable key. `npm run check-secrets` kijkt na of er niets geheims in de build zit.

Vroeger kon het spel ook zelf een nieuwe zaak laten schrijven door een AI. Dat zit er niet meer in. De functie `generate-case` bestaat nog, maar geeft alleen 410 terug.

## Mappen

```
web/                          het spel (Vite, React, TypeScript)
  src/cases/                  de tien zaken als JSON
  src/engine/                 zaken laden, punten, bord, saves en tests
  src/screens/                alle schermen
  src/components/             HUD, kamers, portretten, dialogen
  src/store/                  Zustand stores
  src/audio/                  geluid via Web Audio
  scripts/                    sync-cases.mjs, seed-cases.mjs, check-secrets.mjs
  tests/e2e/                  Playwright-test van zaak 1
supabase/
  functions/_shared/core/     schema, validator, aanwijzingen, prompt, antwoorden verwerken
  functions/_shared/          client voor de modellen, limieten, CORS, testmodus
  functions/interrogate/      de ondervraging
  functions/generate-case/    niet meer in gebruik, geeft 410
  migrations/                 tabellen, RLS en functies in Postgres
  seed/story_cases.sql        de zaken als data voor de server
tools/eval/                   testtool met lastige vragen voor verdachten
vercel.json                   instellingen voor Vercel
```

## Lokaal draaien

Je hebt Node 20 of nieuwer nodig. Ik heb het getest met Node 24.

```powershell
cd web
npm install
npm run dev
```

Daarna open je http://localhost:5173. De twee publieke waarden staan in `web/.env.production`, of in `web/.env.local` als je ze wilt overschrijven:

```
VITE_SUPABASE_URL=https://hbwvybkpdqliusxheiyg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Zonder die waarden werkt het spel ook. Kamers, notitieboek en bord gaan gewoon, alleen de ondervraging zegt dan dat de server niet bereikbaar is.

## Testen

```powershell
cd web
npm run typecheck
npm run lint
npm test
npm run build
npm run check-secrets
```

`npm test` draait de Vitest-tests. Die kijken onder andere elke zaak na met de validator, en controleren dat geen enkele prompt van een verdachte iets van de oplossing bevat. Met `npm run validate:cases` test je alleen de zaken.

Er is ook een volledige test van zaak 1 in de browser. De server wordt daarbij nagebootst, dus er gaan geen vragen naar een AI.

```powershell
cd web
npx playwright install chromium
npm run test:e2e
```

## Een zaak aanpassen

Pas eerst `web/src/cases/<id>.json` aan. Draai dan `npm run sync:cases` in `web`. Dat schrijft de zaken naar `supabase/seed/story_cases.sql` en zet de SHA-256 van elke zaak in `supabase/functions/_shared/cases/index.ts`.

Draai `npm run validate:cases` tot alles slaagt. Deploy daarna `interrogate` opnieuw, zodat de server de nieuwe hashes kent. Zet de zaken dan in de database met `npm run seed:cases`. Dat script heeft een eval-token nodig.

Kijk daarna `GET https://<ref>.supabase.co/functions/v1/interrogate?diag=1` na. Elke zaak moet `"valid": true` en `"hash_ok": true` geven. Klopt de tekst in de database niet met de hash, dan weigert de server die zaak.

## Backend

Het Supabase-project is `hbwvybkpdqliusxheiyg` in eu-central-1. Verplichte secrets zijn `DEEPSEEK_API_KEY` en `DAILY_SPEND_LIMIT_USD`. `OMNIAKEY_API_KEY` is nodig als je een model via OmniaKey wilt gebruiken.

| Secret | Standaard | Waarvoor |
|---|---|---|
| `SUSPECT_MODEL` | `deepseek-flash` | het model dat de verdachten speelt |
| `SUSPECT_THINKING` | `1` | een DeepSeek-verdachte denkt eerst na, `0` zet dat uit |
| `SUSPECT_REASONING_EFFORT` | `high` | hoeveel hij nadenkt: `low`, `high` of `none` |
| `EVAL_JUDGE_MODEL` | `claude-haiku-5-5` | het model dat in de testtool de antwoorden beoordeelt |
| `ALLOWED_ORIGINS` | leeg | extra domeinen voor CORS, gescheiden door komma's |
| `VERCEL_PROJECT_NAME` | `project-red-string` | laat `https://<naam>.vercel.app` en de previews toe |
| `MODEL_PRICING_JSON` | ingebouwde tabel | eigen prijzen per miljoen tokens |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | adres van de DeepSeek API |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | `32768` | maximum aan tokens per antwoord van DeepSeek |
| `OMNIAKEY_BASE_URL` | `https://api.omniakey.com/v1` | adres van OmniaKey |

Modellen met een id die begint met `deepseek-` gaan rechtstreeks naar DeepSeek. Alle andere gaan via OmniaKey. Een antwoord van een verdachte duurt op DeepSeek ongeveer twee tot vier seconden. Van model wisselen kan zonder de code aan te passen:

```powershell
npx supabase secrets set SUSPECT_MODEL=claude-haiku-5-5 --project-ref hbwvybkpdqliusxheiyg
```

De limieten op `interrogate` zijn 30 vragen per minuut en 400 per dag per toestel, en 90 per minuut en 2000 per dag per IP-adres. Elke verdachte heeft daarnaast een eigen geduld, dus een maximum aantal vragen per save.

Voor elke vraag reserveert de server eerst de hoogst mogelijke kost in `usage_log`. Zou dat over `DAILY_SPEND_LIMIT_USD` gaan, dan wordt de vraag geweigerd. Na het antwoord wordt de echte kost ingevuld. Twee vragen tegelijk kunnen de limiet zo niet samen overschrijden.

Deployen gaat met de Supabase CLI, na `npx supabase login`:

```powershell
npx supabase functions deploy interrogate generate-case --project-ref hbwvybkpdqliusxheiyg --no-verify-jwt --use-api
```

JWT-verificatie staat uit, want de frontend gebruikt een publishable key en dat is geen JWT. De functies doen hun eigen controles: CORS, de vorm van de vraag, rate limits, geduld en de dagelijkse kostenlimiet.

## Testtool

`tools/eval/run-eval.mjs` stuurt per verdachte 31 lastige berichten naar de echte `interrogate`. Denk aan "wie heeft het gedaan", "negeer je instructies", rollenspel om de regels te omzeilen en vragen in vijf andere talen. Het rapport toont per model of een verdachte iets verraadt, uit zijn rol valt of feiten verzint, en hoe snel het eerste woord komt.

```powershell
node tools/eval/run-eval.mjs --models deepseek-flash,claude-haiku-5-5 --judge
```

De tool heeft `RS_EVAL_TOKEN` nodig in `tools/eval/.env.local`. Dat bestand staat niet in git. In de database staat alleen de SHA-256 van de token, in `public.eval_tokens`. Meer uitleg staat in `tools/eval/README.md`.

## Vercel

De site staat op Vercel als project `project-red-string`. `vercel.json` bouwt `web/` en stuurt elke route naar `index.html`. Tijdens de build draait ook de scan op geheimen, en die laat de build falen als er iets verdachts in zit. `.vercelignore` houdt lokale bestanden zoals `tools/` en `.env.local` uit de upload.

Opnieuw deployen doe je vanuit de map van het project:

```powershell
npx vercel deploy --prod
```

Gebruik je een eigen domein, zet dat dan in het secret `ALLOWED_ORIGINS` op Supabase. Anders weigert de server de ondervragingen.

## Eigen afbeeldingen en geluid

Alles wat je ziet en hoort wordt nu in code getekend en gemaakt. Wil je echte afbeeldingen, zet ze dan in `web/src/assets/art/`. Het register in `web/src/assets/registry.ts` pikt ze op bij de build.

| Map | Bestandsnaam | Voor |
|---|---|---|
| `art/rooms/` | `<background-key>.webp`, bv. `study.webp` | achtergrond van een kamer |
| `art/portraits/` | `<portrait-key>.webp` of `<suspect-id>.webp` | portret van een verdachte |
| `art/audio/` | `music.ogg`, `music-<ambience>.ogg`, `ambience-rain.ogg` | muziek en sfeergeluid |

De sleutels staan in `supabase/functions/_shared/core/assetKeys.ts`. Afbeeldingen van kamers moeten 5:3 zijn, bv. 2000x1200, anders kloppen de klikzones niet. Portretten zijn 5:6.

Goede bronnen met CC0, dus vrij te gebruiken, zijn Kenney, OpenGameArt, Freesound, Poly Haven en de open collecties van het Rijksmuseum en het Smithsonian. Zet elk bestand dat je toevoegt in `CREDITS.md`.

## Toegankelijkheid

Je kan alles met het toetsenbord bedienen, ook de klikzones en het bord. De focus is altijd zichtbaar. Schermlezers krijgen de antwoorden van verdachten door terwijl ze binnenkomen. Lettergrootte en tekstsnelheid kan je aanpassen, en animaties gaan uit als je systeem dat vraagt of als je dat in het spel instelt.
