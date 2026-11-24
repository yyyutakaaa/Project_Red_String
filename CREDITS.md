# Credits and licenses

Project Red String uses no external art or audio packs. Everything you see and hear in the default build is
original work created for this project, or a font or library under the license listed below.

## Original content

| Content | Source | License |
|---|---|---|
| Story cases "Ashgrove House", "The Blue Lantern", "Pier Seventeen" (`web/src/cases/*.json`) | Written for this project | Same as the project |
| Room scenes, prop drawings, suspect silhouettes, board and UI graphics | Procedural SVG and CSS drawn in code (`web/src/components`) | Same as the project |
| Music pad, rain ambience and all sound effects | Synthesised at runtime with the Web Audio API (`web/src/audio/audio.ts`) | Same as the project |
| Favicon | Hand-written SVG (`web/public/favicon.svg`) | Same as the project |

Suspect dialogue in interrogations is generated at play time by an AI language model through the
OmniaKey API, constrained by the hand-written suspect sheets. Cases in "New Case" mode are written by an
AI model and checked by the game's validator before play.

## Fonts (Google Fonts)

| Font | Designer | License |
|---|---|---|
| Limelight (display titles) | Eduardo Tunni | SIL Open Font License 1.1 |
| Libre Baskerville (body text) | Impallari Type | SIL Open Font License 1.1 |
| Courier Prime (typewriter notes and case files) | Alan Dague-Greene for Quote-Unquote Apps | SIL Open Font License 1.1 |

The fonts are loaded from fonts.googleapis.com at runtime and are not redistributed in this repository.

## Software

| Package | License |
|---|---|
| React, React DOM | MIT |
| React Router | MIT |
| Zustand | MIT |
| Zod | MIT |
| Vite, @vitejs/plugin-react | MIT |
| TypeScript | Apache-2.0 |
| Vitest | MIT |
| Playwright | Apache-2.0 |
| ESLint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals | MIT |
| @supabase/supabase-js (edge functions) | MIT |
| Deno / Supabase Edge Runtime | MIT |

## Replacement art (optional, not included)

The asset registry (`web/src/assets/registry.ts`) picks up real art when files are dropped into
`web/src/assets/art/`. Recommended CC0 sources are listed in the README section "Replacing placeholder art".
If you add third-party files, list each one here with its author, source URL and license.

| File | Author | Source | License |
|---|---|---|---|
| (none yet) | | | |
