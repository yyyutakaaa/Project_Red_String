# Build report: Project Red String

> Question suspects in your own words. They can lie. You have to prove it.

Build date: 24 November 2026. Repository: `C:/Users/User/Documents/project-red-string` (local git only, nothing pushed). Supabase project `hbwvybkpdqliusxheiyg` (eu-central-1): 5 migrations applied, story cases seeded,
`interrogate` v6 and `generate-case` v8 deployed and live.

## What was built, per system

### Case format and validator (shared)
- One Zod schema (`supabase/functions/_shared/core/caseSchema.ts`) used unchanged by the web app (via the
  `@shared` alias), both edge functions (Deno) and the case generator. Objects are strict, so a stray key
  such as a `solution` block inside a suspect is rejected.
- Beyond the requested fields, each suspect has `deflections` (canned lines for provider failures), a hex
  `color` for the placeholder portrait, and `alibi_verification` (machine-checkable: confirmed or broken,
  by which evidence or clue). Revealable clues can hand over an evidence item (`evidence_id`). Timeline
  events have `visibility` (`public`, `private`, `hidden`) and `tags` (the crime is tagged `crime`).
- `validateCase()` (`_shared/core/validator.ts`) never throws and returns human-readable errors. It checks:
  every id reference resolves; unique ids; hotspots inside the scene; the culprit is a suspect; 2 to 4
  required evidence items, none a red herring, at least one pointing to the culprit, each obtainable
  without depending on question phrasing (from a hotspot, or from a `shown_evidence` clue whose trigger is
  itself obtainable); every clue reachable; a suspicious innocent exists; at least one red herring; a
  hidden `crime` event involving the culprit (opportunity); every alibi confirmed or broken by obtainable
  evidence or another person's clue, the culprit's broken by evidence; no suspect prompt data containing
  the solution's motive, method or reveal text.

### Story cases (`web/src/cases`)
| Case | Setting | Rooms | Suspects | Evidence (red herrings) | Clues | Required proof | Culprit |
|---|---|---|---|---|---|---|---|
| Ashgrove House (tutorial) | storm-bound country house, October 1948 | 5 | 3 | 8 (2) | 17 | 3 | Simon Whitlock |
| The Blue Lantern | Riverside jazz club, February 1949 | 5 | 4 | 10 (6) | 19 | 3 | Frank Dellow |
| Pier Seventeen | Ashgrove Shipping harbor office, April 1949 | 5 | 4 | 11 (6) | 19 | 4 | Ruth Calloway |

- Leonard Vance, the Ashgrove family's attorney, appears in all three. He is innocent of murder each time,
  but his secret grows from case to case: quietly borrowing from the Ashgrove trust (case 1), laundering
  it through the club's books (case 2), and finally a dossier that makes him the obvious suspect (case 3).
  Clara Ashgrove appears in cases 1 and 3.
- In case 2 Lena Marsh lies to protect her brother Danny.
- Hints run from gentle to explicit; case 1's hints teach "Show evidence" and the board's "Check theory".
- `web/src/engine/__tests__/cases.test.ts` enforces the authoring targets: validator clean with no
  warnings, required proof discoverable without exact phrasing, known asset keys, non-overlapping
  hotspots, depth per suspect, no solution text in any built prompt, the per-case counts, and a recurring
  character.

### Backend (Supabase)
- **Migrations** (`supabase/migrations`): `rate_limits`, `usage_log`, `generated_cases`, `conversations`
  (save, case, suspect, patience, mood, shown evidence, revealed clues, transcript), plus `eval_tokens`
  (hashed tokens for the eval tool) and `story_cases`. RLS is on for every table with no policies, table
  privileges are revoked from `anon` and `authenticated`, and all logic runs in `security invoker` RPCs
  executable only by `service_role`. The Supabase security advisor reports only the expected "RLS
  enabled, no policy" notices.
- **interrogate**: builds the system prompt from only that suspect's sheet plus public facts (public
  timeline, other people's public facts, the victim). It never includes the solution, hidden events,
  other suspects' private data or the alibi verification. Only clues whose condition is currently met are
  in the prompt. The player's text is wrapped as in-story speech and capped at 500 characters. The server
  keeps the transcript, so forged client history cannot steer the model. Replies stream over SSE
  (`delta` events, then one `final` event: `{ reply, revealed_clue_ids, all_revealed_clue_ids, mood,
  patience_used, patience_max, silent }`). Proposed clue ids are filtered against the suspect's clues and
  their conditions. Showing evidence deterministically reveals that suspect's `shown_evidence:<id>` clue
  and breaks them if it is in `breaks_on`. Replies are capped near 80 words and sanitised. A reply that
  echoes instructions or breaks character is replaced by an in-character deflection.
- **Limits**: patience per suspect per save (atomic in Postgres); 30 per minute and 400 per day per
  device; 90 per minute and 2000 per day per IP hash; max output tokens; a race-free global daily spend
  ceiling from `DAILY_SPEND_LIMIT_USD`. The worst-case cost is reserved under an advisory lock before each
  model call and settled to the real cost after; failed calls keep their estimated cost. On provider error
  or timeout the player gets a canned deflection with `silent: true`, and no patience is used.
- **generate-case**: the generator model gets the JSON Schema (generated from the Zod schema), the
  validator rules and the asset keys. It must return a fenced JSON block, which is parsed defensively and
  validated. Validator errors are sent back for up to 2 repairs, one model call per request (a job id ties
  the rounds together) so each call fits the edge function time limit. Valid cases are stored in
  `generated_cases`. Limits: 5 new cases per device per day, 3 per minute and 15 per day per IP, a global
  daily cap (`GLOBAL_GENERATIONS_PER_DAY`, default 60), and the spend ceiling.
- **OmniaKey client** (`_shared/omniakey.ts`): OpenAI-compatible `POST /v1/chat/completions` with
  `Authorization: Bearer`, streaming SSE parsing, and usage read from `prompt_tokens`/`completion_tokens`
  or `input_tokens`/`output_tokens` (estimated when absent). It also parses content-part arrays and
  Responses-style events. The docs do not mention structured output, so the client uses fenced JSON plus
  one retry for the metadata. Model ids are config: `SUSPECT_MODEL` (default `claude-haiku-5-5`) and
  `GENERATOR_MODEL` (default `claude-haiku-5-5`; see "Models tried live" below). Model ids starting
  with `deepseek-` are sent straight to the DeepSeek API with the `DEEPSEEK_API_KEY` secret.
- The OmniaKey key exists only as a Supabase secret. The frontend has only the Supabase URL and the
  publishable key. `check-secrets.mjs` runs in the Vercel build and fails it if anything secret-looking
  reaches `web/dist`.

### Game (web)
- Vite 8, React 19, TypeScript strict (`noUncheckedIndexedAccess`), Zustand 5, React Router 7, CSS
  modules on one design-token file. Screens load lazily (main bundle 468 kB, 148 kB gzipped).
- **Screens**: main menu (Continue, Story Cases, New Case, Save Slots, Settings, Credits), save slots,
  case select (unlock in order, completion stamp, best score and rank, generated-case shelf), briefing
  case file, scene picker, room screen, suspect lineup, interrogation, red-string board, notebook,
  accusation, ending, settings, credits, a route error screen and a not-found page. A locked story case
  cannot be opened by URL.
- **Rooms**: layered procedural SVG scenes for 22 background keys (wall treatments, perspective floors,
  windows with rain, lamps with flickering light cones, vignette, grain). Hotspots are accessible buttons
  with hover and focus highlights, drawn as one of 40+ prop silhouettes chosen from the label. Evidence
  pickup shows a toast.
- **Interrogation**: portrait, mood indicator, patience meter, chat log, 500-character input, "Show
  evidence" picker, streamed reply with typewriter effect, waiting indicator, revealed-clue chips, offline
  banner, and a "falls silent" banner on provider failure. Replies in flight cannot write into another
  slot or run.
- **Board**: SVG pins for suspects and found evidence. Connect pins by dragging from a knob, by tapping
  two pins, or with the keyboard; move pins by dragging or with the arrow keys; click a string to cut it.
  "Check theory" marks each link supported or unsupported against `points_to` (suspect-to-suspect links
  are neutral). An accessible connections list is included.
- **Notebook**: tabs for evidence, clues by suspect, suspect facts, public timeline, free notes (autosaved)
  and hints taken. The clue counter is always in the HUD.
- **Accusation and scoring**: pick a culprit and 2 to 4 pieces of evidence. The outcome is correct, weak
  proof (right person, required evidence not covered) or wrong suspect. The score combines the verdict
  (1000 / 450 / 100), thoroughness (up to 300 for evidence and clues found), efficiency (up to 300 for
  questions not used, only on a correct solve) and minus 75 per hint, for a rank of S to D. The breakdown
  is frozen at the moment of accusation.
- **Saves**: autosave after every meaningful action, a manual Save button, three slots in localStorage
  (chat logs, patience, evidence, clues, board, notes, hints). "Save to slot N" gives the copy new run
  ids and forks the server-side state, so slots never share patience. The device id is a random UUID in
  localStorage. Corrupted saves are ignored safely.
- **New Case**: generation screen with cancel, redraft progress and per-step timeouts. The returned case
  is validated in the browser too, kept on the device for replay, and never evicted while a run is open.
- **Settings**: master, music and sfx volume, text speed, font size (4 steps), reduced motion (system,
  reduce, full), persisted in localStorage.
- **Audio**: procedural Web Audio (rain, a noir chord pad, a walking bass in the club, UI sounds),
  started only after a user gesture.
- **Accessibility**: keyboard access everywhere (hotspots, pins, strings, tabs, dialogs), a visible
  focus ring, a skip link, live regions that announce once per reply, focus kept after navigation and
  removals, reduced motion respected in CSS and JS, and contrast-checked tokens.
- **Offline**: rooms, notebook and board are fully local. Interrogation shows a clear banner when the
  backend is unreachable, and a failed request can be retried without duplicating the question.
- **Asset registry**: drop real art into `web/src/assets/art/{rooms,portraits,audio}` and it replaces the
  procedural placeholders (see README for CC0 sources).

### Eval tool (`tools/eval`)
`run-eval.mjs` sends 31 adversarial probes per suspect (341 per model) to the deployed function and
reports leaks, culprit naming, out-of-character replies, invented facts (judge), wrong language, length and
time to first token, comparing several model ids. Eval mode is gated by a hashed token in
`public.eval_tokens`; a token for this machine is in `tools/eval/.env.local` (gitignored).

The full comparison run was stopped part-way (gpt-6.2-sol was removed for cost), so there is no complete
results table. A 3-probe smoke run on claude-haiku-5-5 with the judge on reported 0 leaks, 0 out of
character, 0 invented facts, average time to first token 2.9 s. Run the command under "How to run" for
full numbers; the eval token may select claude-haiku-5-5, mimo-v2.6-flash, deepseek-chat and deepseek-flash.

### Models tried live
| Model | Use | Result |
|---|---|---|
| claude-haiku-5-5 | suspects (default) | works; first token about 2.6 to 3.3 s; about $0.0004 per question |
| deepseek-chat (DeepSeek direct) | suspects | works; first token 1.2 to 1.5 s; answered in Dutch to a Dutch question and stayed in character on an "ignore your instructions" probe |
| mimo-v2.6-flash | suspects | not usable as configured: spent the 320-token budget on reasoning and returned empty replies |
| claude-opus-5-5 | case generator | failed 3 times (about $0.27): spent the whole output budget on thinking on both the OpenAI-compatible and the Anthropic-native route |
| claude-haiku-5-5 | case generator (default) | works with the compact case prompt: valid case on the third attempt, 271 s in total, about 1 to 2 cents |
| deepseek-chat (DeepSeek direct) | case generator | failed once: the name is now served by deepseek-flash, which thinks by default and spent all 8192 output tokens on reasoning |
| deepseek-flash, thinking off | case generator | works: valid case ("The Last Set at the Vermillion") on the third attempt, 63 s in total, about $0.021; no dashes or not-X-but-Y lines in the text |

DeepSeek calls now send `"thinking": {"type": "disabled"}` (set `DEEPSEEK_THINKING=1` to turn it back on).
DeepSeek prices are the peak list prices from api-docs.deepseek.com (2026-11-24); off-peak is half.
The eval tool can pick the case writer as well: `X-Eval-Model` works on `generate-case` too.

### Writing style
Player-visible story text (briefings, rooms, evidence, hints, endings, deflections) and some UI lines were
edited against a list of AI-writing patterns: 40 passages rewritten, mostly sentences that explained a clue
after showing it and staged closing lines. Suspect sheets beyond the deflections, and most UI copy, were
pattern-scanned but not edited line by line. The suspect prompt and the generator prompt carry the same
style rules, and the server replaces dash connectors and curly quotes in every reply.

## Verification performed

| Check | Result |
|---|---|
| `npm run typecheck` (strict) | passes |
| `npm run lint` | 0 errors, 0 warnings |
| `npm test` (Vitest) | 76 tests in 8 files pass: validator (valid and broken cases), all three story cases, save and load round trip, scoring, board link checks, clue filtering, prompt hygiene, reply parsing, generator prompt |
| Deno type check of both functions | passes (`npm run check:functions`) |
| Deno tests of the model client | 10 pass (`npm run test:functions`) |
| `npm run build` + `check-secrets` | builds; no secrets in `dist` |
| Playwright (`npm run test:e2e`) | 6 pass: full case 1 playthrough with the interrogate endpoint mocked, sealed-case guard and offline handling, each at desktop (1280x800) and tablet (820x1180, touch) |
| Live interrogate (deployed) | streams in character (first token about 2.6 s); showing the telephone pad broke Simon, forced the evidence clue, and recovered the earlier clue in `all_revealed_clue_ids`; spend reserved and settled (about $0.0004 per question on Haiku) |
| Live generate-case (deployed) | works with claude-haiku-5-5: "The Alder Ridge Nightcap" (3 suspects, 3 rooms, 6 evidence) passed the validator on attempt 3 after two repairs, 271 s in total; a suspect in that generated case then answered in character |
| Database | RPCs exercised directly: patience limit, device mismatch, transcript trimming, save forks, spend reservation refusal |
| Adversarial review | 3 reviewers plus 3 skeptic verifiers; 23 confirmed findings, all fixed except the CORS note below |

## How to run

```powershell
cd web
npm install
npm run dev
```

Open http://localhost:5173. The public Supabase URL and publishable key are in `web/.env.production` and
`web/.env.example` (copy to `.env.local`).

Tests:

```powershell
cd web
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run check:functions
npm run test:functions
```

Eval (from the repository root; needs `tools/eval/.env.local` with `RS_EVAL_TOKEN`):

```powershell
node tools/eval/run-eval.mjs --models claude-haiku-5-5,mimo-v2.6-flash --judge
```

## Deploy to Vercel (not done: the project is kept local for now)

1. Push this repository to GitHub, GitLab or Bitbucket.
2. vercel.com, Add New, Project, import the repository. Name it `project-red-string` (the edge functions
   allow `https://project-red-string.vercel.app` and its preview URLs). Keep the root directory as the
   repository root; install, build and output settings come from `vercel.json`.
3. No environment variables are required (`web/.env.production` holds the public values). Deploy.
4. Open the site, start Ashgrove House and ask a suspect a question to confirm CORS and streaming.
5. For a custom domain, add it in Vercel and set the Supabase secret `ALLOWED_ORIGINS=https://your.domain`.

CLI alternative: `npx vercel login`, then `npx vercel` and `npx vercel --prod` from the repository root.

## What could not be verified, and how to check it

- **Vercel deployment**: intentionally not deployed; the project stays local for now. Follow the steps above, then play one interrogation on
  the deployed URL. If the browser reports a CORS error, set `ALLOWED_ORIGINS` or `VERCEL_PROJECT_NAME`.
- **Real screen readers**: live regions, labels and focus handling were reviewed in code and checked in
  Chromium, but not with NVDA, JAWS or VoiceOver. Check one interrogation and one board session.
- **Safari and Firefox**: tests ran in Chromium only. `npx playwright install firefox webkit` and add the
  projects to `playwright.config.ts` to cover them.
- **Gameplay length and fairness with real players**: each case was play-tested by review agents and a
  scripted playthrough, not by humans. Time a first-time player on each case.
- **The spend ceiling at its limit**: the reservation logic was tested in SQL, not by exhausting the real
  budget. Set `DAILY_SPEND_LIMIT_USD` very low on a test project and confirm the 503 `spend_limit` path.

## Known limitations

- The whole case, including the solution, ships to the browser (scoring is local). A player who reads the
  bundle can spoil a case. The server only protects the AI prompts.
- Suspects are a language model playing a sheet; the full adversarial eval has not been run to completion, so the rate of slips is not measured. The sanitiser
  replaces replies that echo instructions, but streamed text is visible before the final event replaces
  it.
- Rate limits trust a client-chosen device id; the per-IP limits and the global spend ceiling are the real
  backstops. CORS also allows `localhost` so local development works against the live backend; CORS is
  not a security boundary against scripts.
- Generated cases are compact (3 suspects, 3 rooms, 6 evidence, about 15 to 20 minutes) so the model can finish inside the time limit. The one live success needed all 3 attempts and 4.5 minutes; a
  failure says so and can be retried (it may count toward the daily 5).
- Placeholder art is procedural SVG; no human-made art or recorded audio is included.
- Story case data lives in both `web/src/cases` (source of truth) and `public.story_cases`; after editing
  a case, re-run the seed and redeploy `interrogate` (hash mismatch makes the server refuse a stale case).
