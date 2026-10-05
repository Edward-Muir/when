# CLAUDE.md

"When" is a mobile-first timeline game where players place historical events in chronological order. React 19 + TypeScript + Tailwind CSS. Deployed on Vercel. iOS and Android apps via Capacitor, loading the live site.

This file holds the rules and the traps. The detail lives in `docs/`: [docs/index.md](docs/index.md) indexes one digest per area, each recording the decisions behind that area rather than a change log, and [docs/architecture-reference.md](docs/architecture-reference.md) covers components, hooks, utils, routes, API and the release mechanics. Read the relevant digest before any non-trivial change; several encode traps that cost a previous session real time.

## Read before touching

| Before changing…                                                                                        | Read                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How card images are fetched or sized (`cloudinaryImage.ts`, preloading, the service-worker image cache) | [cloudinary-cost-controls.md](docs/cloudinary-cost-controls.md): no `dpr_auto`, never an uncapped width, keep both rungs square                                                                    |
| `dailyTheme.ts`, `dailyPool.ts`, the daily's deck options, or curated themes                            | [curated-themes/](docs/curated-themes/index.md). Scheduling a theme is a workflow dispatch, never a commit; the seeded menu (`dailyThemeMenu.json`) changes only by a new dated epoch              |
| `eventDetail.ts`, `GamePopup`, `scripts/events/detail-*.js`                                             | [event-detail/](docs/event-detail/index.md)                                                                                                                                                        |
| Deck composition or how a placement is judged                                                           | [gameplay-feel/](docs/gameplay-feel/index.md), and the header comments in `deckBuilder.ts`, `difficultyScore.ts`, `dailyRecency.ts`, `gameLogic.ts`                                                |
| The challenge-code encoding, or the wording of any share                                                | [sharing-challenges/](docs/sharing-challenges/index.md)                                                                                                                                            |
| Region tags, the Custom/Timeline region filter, or the 7th challenge-code word                          | [regions/](docs/regions/index.md), and [tagging-spec.md](docs/regions/tagging-spec.md) with the `tag-event-regions` skill before tagging                                                           |
| Onboarding hints                                                                                        | [ui-redesign/](docs/ui-redesign/index.md#onboarding-hints-2026-09)                                                                                                                                 |
| Bulk edits to event text, or "fixing" an event record                                                   | [events-images/](docs/events-images/index.md) and its [catalogue-error-backlog.md](docs/events-images/catalogue-error-backlog.md): every known error was resolved on 2026-10-01, so check it first |
| Release notes or `scripts/release-notes*.js`                                                            | [release-notes.md](docs/release-notes.md)                                                                                                                                                          |
| Driving the app with Playwright                                                                         | [driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md)                                                                                                                      |

## Commands

```bash
vercel dev                   # Full-stack dev (frontend + API routes)
npm start                    # Frontend-only dev server (no API)
npm run build                # Production build (see CI=true note below)
npm test                     # Tests (watch mode). CI=true npm test -- --watchAll=false for one pass
npm run lint                 # ESLint check (src, api and lib)
npm run typecheck            # TypeScript check (src only — tsconfig `include` is ["src"])
npm run typecheck:api        # TypeScript check for api/ (not covered by `typecheck`)
npm run format               # Prettier format
npm run release              # Bump version (auto-detect from commits)
```

- **Verify a production build with `CI=true npm run build`.** Vercel sets `CI=true`, which turns every CRA warning into a hard error; a plain build prints the same warning above a cheerful success banner, so don't `tail` the output.
- **Run tests through npm, never `npx jest` / `npx react-scripts test`.** The `test` script pins `TZ=America/Los_Angeles`, and the date suites assert real US DST transitions.

## Release & deployment

- **Every push to `main` deploys to production** (Vercel's Git integration). Merging a PR ships it; the release is separate version/changelog bookkeeping.
- **Every release needs a human note, or it aborts.** Append one short sentence per notable change to `unreleased` in `public/release-notes.json`, in the same commit as the change. `scripts/check-release-notes.js` enforces the format (20-120 chars, one sentence, no commit prefixes, links, SHAs, em dashes or second person).
- **Squash-merge with a Conventional Commit title.** The Release Action auto-releases a merge containing `feat`/`fix`/`perf` and skips docs/chore/ci/refactor. Cloud sessions cannot push to `main`, so they merge PRs and leave the release to the Action. Details: [architecture-reference.md](docs/architecture-reference.md#versioning--releases).

## Vocabulary

Use these terms, in planning and in prose. The right-hand column is what the code calls it.

| Player sees                 | Meaning                                                                                                                                                                                         | In code                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Home**, five tabs         | Daily · Archive · Custom · Stats · My Timeline, swiped as one pager                                                                                                                             | `modeSelect` phase, `ModeSelect.tsx`, `ModePager.tsx`, `panels/` |
| **Daily Challenge**         | One deck per local calendar day, the same for everyone, with a leaderboard                                                                                                                      | `GameMode` `daily`; the "puzzle day" (`puzzleDate.ts`)           |
| **Theme**                   | What the day's deck is drawn from, named in a pill beside the logo: a **curated theme** (Mondays and Fridays) or a **seeded theme** (Everything, a category, a region, a country, or a pairing) | `dailyTheme.ts`, `curatedThemes.ts`, `dailyThemeMenu.json`       |
| **Archive**                 | Past curated themes, replayable from the day after they ran                                                                                                                                     | `suddenDeath` + `curatedThemeId`, `themeReplay.ts`               |
| **Custom**                  | A deck built from filters: difficulty, category, era, region, country; shareable as a challenge code                                                                                            | `suddenDeath`, `useCustomGameSettings.ts`, `challengeCode.ts`    |
| **Hand**, "cards left"      | Five cards; only the top one drags. A miss costs one, and the game ends when none are left                                                                                                      | `players[n].hand`, `PlayerInfo.tsx`                              |
| **Swap**                    | The button on the hand that cycles to the next card                                                                                                                                             | `cycleHand`                                                      |
| **Tombstone**               | A missed card, greyed at its true slot; it never counts as placed                                                                                                                               | `failedPlacements`                                               |
| **Events placed**           | The score: correct placements, not counting the starting card. Shown with the best streak                                                                                                       | `placementHistory`, `correctCount`                               |
| **Close enough**            | A placement inside an event's evidence window counts as correct                                                                                                                                 | `closeEnough`, `year` / `year_end`                               |
| **Expert**, **Renaissance** | The labels for the `very-hard` difficulty and the `earlyModern` era                                                                                                                             | `FilterControls.tsx`, `eras.ts`                                  |
| **Category**                | One of 21, the player-facing grouping. Event **files** are storage shards with unrelated names                                                                                                  | `ALL_CATEGORIES`; `public/events/manifest.json`                  |
| **Hint**                    | A one-line pill that teaches one step, once per install. **How to Play** is the menu's rules page                                                                                               | `useOnboardingHints.ts`, `hintCopy.ts`, `HowToPlayModal.tsx`     |

## Key architecture

- **Game phases**: `loading` → `modeSelect` → `transitioning` → `playing` → `gameOver` (`GamePhase` in `src/types/index.ts`). The timeline view is a route/tab, not a phase.
- **Game modes**: `GameMode` is exactly `daily` and `suddenDeath`, with identical mechanics: a hand of N, a correct placement draws a replacement, a wrong one shrinks the hand, and the game ends when it empties. They differ only in how the deck is built: `daily` from the calendar date, `suddenDeath` from the Custom page's filters, or from a past curated theme's pool for an **Archive** replay (`GameConfig.curatedThemeId`, `src/utils/themeReplay.ts`). The player-facing entry points are the **Daily**, **Archive** and **Custom** tabs; "Sudden Death" appears only on `/support`, deliberately.
- **Multiplayer** is fully implemented in the engine (turn hand-off, elimination, round reprieve), and no screen offers it: `playerCount` defaults to 1 in `useCustomGameSettings.ts`. A challenge code with `playerCount > 1`, opened as `/challenge/:code` or pasted into Custom, starts one. Don't treat those branches as dead.
- **Deck composition** is not a plain shuffle: `deckBuilder.ts` ramps the first 24 cards from an easy, well-spread opening; `difficultyScore.ts` blends the `difficulty` label with how crowded the timeline is around each event; the daily never repeats a card within 7 days (`dailyRecency.ts`).
- **State**: game state lives in `src/hooks/useWhenGame.ts`, with the pure turn logic in `gameLogic.ts` and `placementLogic.ts`. Persisted state is in `statsStorage.ts` and `playerStorage.ts`, and **every Web Storage access goes through `src/utils/storage.ts`**, which never throws.
- **Popups**: every overlay except the Menu drawer renders inside `src/components/ui/Modal.tsx`. Keep it mounted and drive `open`; a conditional mount loses the exit animation.
- **Onboarding hints** are keyed in one object, `when-hints-seen`, in `playerStorage.ts`. The in-game logic is `useOnboardingHints.ts`, because `Game.tsx` sits on the ESLint `complexity` ceiling.
- **Routes**: listed in [architecture-reference.md](docs/architecture-reference.md#routes-srcindextsx). A new client route also needs a rewrite in `vercel.json`, or it 404s on direct load in production.
- **API**: `api/leaderboard/`, `api/card-reports/` and `api/themes/`, on Upstash Redis. Needs `vercel dev` locally.

## Styling

- Colours are CSS custom properties in `src/index.css`, referenced by Tailwind: `bg-bg`, `text-text`, `bg-accent`. No `dark:` prefixes needed.
- **Opacity modifiers on those tokens compile to nothing.** `bg-accent/20`, `text-text-muted/60` and friends are dropped from the built CSS entirely, so the element gets no colour at all from them. Use `opacity-*` on the element, or a `color-mix()` utility in `index.css` (`.bg-player-row` and `.scrim-band` are the precedents). Standard colours (`bg-black/50`, `white`) are fine. Dead instances remain in `src/`; don't add more. See [gameplay-feel/](docs/gameplay-feel/index.md).
- Fonts: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (DM Mono).
- Animations: `animate-shake` and `animate-screen-shake` in `tailwind.config.js` are unused; the live shake is `animate-shake-{light,medium,heavy}` in `index.css`, via `useScreenShake.ts`. Grep `index.css` for the current set.

## Mobile

- Touch targets at least 44x44px, with 8px between targets.
- Viewport: the `--vh` CSS variable (set in `App.tsx`) for iOS Safari, and `dvh` units in Tailwind.

## Event data

- Events are the JSON files listed in `public/events/manifest.json`. `ALL_CATEGORIES` in `src/types/index.ts` is the source of truth for categories, and there are four difficulties including `very-hard`. **Never infer a category from a filename:** the files are storage shards whose names match no category. `deprecated.json` is deliberately absent from the manifest.
- `friendly_name` is capped at 35 chars (`MAX_FRIENDLY_NAME_LENGTH`). **Neither `friendly_name` nor `description` may state a date**, since both show before the card is placed. Both rules are enforced by tests.
- **Detail prose** (the two paragraphs on a placed card) is a lazily fetched sidecar under `public/events/detail/`, never inlined into the event JSON. It may state dates because it is unreachable before placement. Before writing any, read [writing-spec.md](docs/event-detail/writing-spec.md) and use the `write-event-detail` skill; `scripts/events/detail-spec.js` enforces the rules. Research each entry rather than recalling it, and never pass `wikipedia_url` to a writer. New prose runs on the `event-detail-writer` sub-agent. Never run `detail-placeholder.js` against a complete corpus.
- **Every event carries `regions`**: where it happened on today's map, as readable names (`["Bahamas", "Spain"]`, `["Turkey", "Europe"]`, `["China", "Global"]`), never codes. The taxonomy is `src/data/regions.json`, shared by `src/utils/regions.ts` and `scripts/events/region-spec.js`. Global is a footprint, not importance, and evolutionary milestones are Global rather than their fossil site. `REQUIRE_REGIONS` is on in `eventRegions.test.ts`, so a new event must be tagged. Tags are written by `event-region-tagger` sub-agents into maps applied by `scripts/events/region-apply.js`, never by hand.
- **Category changes and duplicate retirements go through `scripts/events/backlog-apply.js`**, which validates against `ALL_CATEGORIES` and takes a retired card's prose and ledger line with it. Names and descriptions go through `date-clues-apply.js`. Never hand-edit the catalogue.
- **`year` / `year_end` are an evidence window**, and `year` is simply its start. There is no cap on window width. `year` alone drives difficulty, deck composition, era filtering and recency, so moving it needs a `reason` and a re-measured `deckBuilder.test.ts` bound. Placement is judged against running bounds, never the two adjacent cards: see the header comment in `src/utils/gameLogic.ts` and its property test. Windows are written with `scripts/events/year-range-report.js` / `-apply.js`, and every decision is recorded in `scripts/events/year-range-decided.json`; a future pass reviews only what the report lists, never the whole corpus.
