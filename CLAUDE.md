# CLAUDE.md

"When" is a mobile-first timeline game where players place historical events in chronological order. React 19 + TypeScript + Tailwind CSS. Deployed on Vercel. iOS app via Capacitor.

For detailed architecture (component hierarchy, hooks, utils, API routes, z-index, dependencies): see [docs/architecture-reference.md](docs/architecture-reference.md)

[docs/index.md](docs/index.md) indexes the rest — one digest per area, each holding the decisions and constraints behind that area rather than a change log. Worth a look before any non-trivial change; several encode traps that cost a previous session real time.

Before changing anything about how card images are fetched or sized (`src/utils/cloudinaryImage.ts`, preloading, the service-worker image cache): see [docs/cloudinary-cost-controls.md](docs/cloudinary-cost-controls.md) — the rung ladder has hard rules (no `dpr_auto`, never an uncapped width, keep both rungs square) that exist because breaking them ran the account toward a shutdown.

Daily themes can be hand-authored: a named list of event slugs pinned to explicit dates, stored in Redis and published via a GitHub Action (no code change) — scheduling a theme is a dispatch, never a commit, and the maintainer scripts cache-bust their `/api/themes` read because that endpoint is shared-cached and a stale read fails the publish. Before touching `src/utils/dailyTheme.ts`, `dailyPool.ts` or the daily's deck options: see [docs/curated-themes/index.md](docs/curated-themes/index.md) — the curated lookup must stay ahead of the seeded RNG, and both builder call sites must share `getDailyBuildOptions`.

To drive/play the app end-to-end with Playwright (smoke tests, or playing the live daily) — including the drag-and-drop recipe, the proxy/TLS workaround, and a copy-pasteable script: see [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md)

## Commands

```bash
vercel dev                   # Full-stack dev (frontend + API routes)
npm start                    # Frontend-only dev server (no API)
npm run build                # Production build
npm test                     # Tests (watch mode). CI=true npm test -- --watchAll=false for one pass
npm run lint                 # ESLint check (covers src AND api)
npm run typecheck            # TypeScript check (src only — tsconfig `include` is ["src"])
npm run typecheck:api        # TypeScript check for api/ (not covered by `typecheck`)
npm run format               # Prettier format
npm run release              # Bump version (auto-detect from commits)
```

**Always run tests through npm, never `npx react-scripts test` / `npx jest` directly.** The
`test` script pins `TZ=America/Los_Angeles`, and the `puzzleDate` / `dailyConfig` /
`dailyReminder` suites assert real US DST transitions. Bypassing npm drops the pin and fails
5 tests across 3 suites that are not actually broken.

## Release & Deployment

- **Production deploys on every push to `main`** (Vercel default Git integration; `vercel.json` has only rewrites, no deploy config). Merging a PR to `main` ships to production — the release step below is separate version/changelog/tag bookkeeping, not what deploys the app.
- **Versioning** uses `commit-and-tag-version` (config in `.versionrc.json`). Run `./scripts/release.sh [patch|minor|major]` (or `npm run release[:patch|:minor|:major]`). It bumps `package.json`, regenerates `CHANGELOG.md`, runs the `postchangelog` hook (`scripts/inject-version.js` + `generate-rss.js` → updates `public/feed.xml`, `src/version.ts`, `public/version.json`, `public/service-worker.js`), commits `chore(release): x.y.z`, tags `vX.Y.Z`, and pushes with `--follow-tags`.
- **Bump auto-detect** reads Conventional Commits since the last tag: `feat` → minor, `fix`/`perf` → patch; `docs`/`refactor`/`chore`/`ci`/etc. are hidden from the changelog. Squash-merge PRs with a conventional title (e.g. `feat: …`) so `main` history stays clean and auto-detect works; otherwise pass an explicit bump type.
- **Automatic release on merge:** the **Release GitHub Action** (`.github/workflows/release.yml`) runs in CI with `GITHUB_TOKEN` (which _can_ push to `main`). On push to `main`, it auto-releases **only when the merge contains a `feat`/`fix`/`perf` commit** (auto-detecting minor/patch); docs/chore/ci/refactor-only merges are skipped. So squash-merging a PR with a `feat:`/`fix:` title ships a release with no further action.
- **Manual release:** the same workflow also has `workflow_dispatch` — GitHub → **Actions → Release → Run workflow** → pick the bump (forces any version, and releases a merge that auto-skipped). The GitHub **mobile app can't trigger workflows** — use mobile web: `github.com/Edward-Muir/when/actions/workflows/release.yml`.
- **Why CI, not local:** sandboxed/cloud (Claude Code on the web) sessions are org-policy-blocked from pushing to `main` (`git push` → HTTP 403), so they open+merge PRs but never run the release directly — the Action does it. (`main` is currently unprotected.)

## Key Architecture

- **Game phases**: `loading` -> `modeSelect` -> `transitioning` -> `playing` -> `gameOver` (`GamePhase` in `src/types/index.ts`). The timeline view is a route/tab, not a phase.
- **Game modes**: `GameMode` has exactly two values, `daily` and `suddenDeath`, and there is no mode picker anywhere in the UI. Both run identical mechanics — hand of N, correct placement draws a replacement, a wrong one shrinks the hand, game over when the hand empties. They differ only in how the deck is built: `daily` is seeded from the calendar date (one play/day), `suddenDeath` from the Custom page's filters — or, for an **Archive** replay of a past curated theme, from that theme's pool (`GameConfig.curatedThemeId`, see `src/utils/themeReplay.ts`). So the three player-facing entry points are **Daily**, **Archive** and **Custom**, not different rule-sets.
  - **Naming.** `suddenDeath` has no player-facing name left except **"Sudden Death"** on `/support` — a deliberate UI-only name, not a bug to fix. It used to surface as **"Marathon"** in share text; that was removed in 2026-08 because naming a mode implies a choice of rule-sets the UI does not offer. Everything that is not the Daily is a Custom game (an Archive replay included), and the share text says so by saying nothing.
  - A third mode, `freeplay` (empty your hand to win), was removed once it became UI-unreachable. Legacy share links still set its bit, so `src/utils/challengeCode.ts` keeps bit 0 reserved — read the note there before touching that encoding.
  - **Multiplayer** is fully implemented in the engine (turn handoff, elimination, round reprieve) but no UI reaches it: `playerCount` is pinned to 1 in `ModeSelect.tsx` and its control is hidden. It's only reachable via a challenge code encoding `playerCount > 1`. Don't treat those branches as dead, and don't expect to exercise them from the app.
- **Deck composition**: decks are not a plain shuffle. `src/utils/deckBuilder.ts` composes the first 24 cards so the game opens with an easy, well-spread placement and ramps from there; the rest of the pool follows as a seeded shuffle. Difficulty is scored in `src/utils/difficultyScore.ts` by blending the `difficulty` label with how crowded the timeline is around each event — the label alone grades fame, which anti-correlates with how hard a card is to place. The daily additionally guarantees no card repeats within 7 days (`src/utils/dailyRecency.ts`). Read the header comments in those three files before retuning any of it.
- **State**: Game state lives in `src/hooks/useWhenGame.ts` — `WhenGameState` tracks phase, timeline, players, deck, streaks. Persisted state (stats, streaks, settings) lives in `src/utils/statsStorage.ts` and `src/utils/playerStorage.ts`.
- **Routes**: 13 routes in `src/index.tsx`, plus a catch-all redirect to `/`. Player-facing: `/:tab?` (the home pager: `/`, `/archive`, `/custom`, `/stats`, `/timeline` open it on that tab, and the URL follows the swipe — `src/pages/Home.tsx`; `/achievements` is retired and redirects to `/stats`, the badges live there now), `/daily`, `/challenge/:code`, `/privacy`, `/terms`, `/support`. Unlinked maintainer tools: `/image-qc`, `/card-reports`, `/cards-preview`, `/unlock-preview`, `/anim-jig`, `/reminder-preview`, `/share-preview`. A new client route also needs a rewrite in `vercel.json` or it 404s on direct load in production — **`/cards-preview`, `/unlock-preview`, `/anim-jig`, `/reminder-preview` and `/share-preview` currently have no rewrite and no in-app link**, so they are unreachable in production and only usable in local dev. The TopBar shows the same five tab buttons (Home, Archive, Custom, Stats, Timeline) plus Menu on every non-game page; every tab path has a rewrite, and so does `/achievements` so the redirect can run on a hard load.
- **API**: `api/leaderboard/` (daily scores) and `api/card-reports/` (player-reported card problems), both on Upstash Redis. Needs `vercel dev` to run locally.

## Styling

- Colors: CSS custom properties in `src/index.css`, referenced by Tailwind. Use `bg-bg`, `text-text`, `bg-accent` etc. No `dark:` prefixes needed.
- **Opacity modifiers on those tokens compile to nothing at all.** `bg-accent/20`, `text-text-muted/60` and friends don't emit a flat colour — Tailwind can't parse `var(--color-x)` as a colour (the tokens have no `<alpha-value>` channel), so it **drops the entire rule**: `.bg-accent\/20` is simply absent from the built CSS. The element therefore gets **no** background/border/text colour from that utility and falls back to inherited or nothing, which is louder than a wrong colour — a `bg-*/NN` card is fully transparent, not merely opaque. Verify with `grep -o '\.bg-accent\\/20{[^}]*}' build/static/css/*.css` after a build; it fails silently otherwise. Use `opacity-60` on the element, or a `color-mix()` utility in `index.css` — `.bg-player-row` (opaque, for the sticky leaderboard row) and `.scrim-band` (translucent, for the game-start loading scrim) are the two precedents. Standard Tailwind colors (`bg-black/50`, and `white`/`black`, which are plain hex here) are fine. ~66 dead instances remain in `src/` and the count keeps drifting upward; don't add more.
- Fonts: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (DM Mono)
- Animations come from two places, and the split matters:
  - **Tailwind keyframes** (`tailwind.config.js`): `animate-entrance` is used; `animate-shake` and `animate-screen-shake` are defined but have **zero usages** — don't reach for them.
  - **Hand-written classes** (`src/index.css`): the shake actually in use is `animate-shake-{light,medium,heavy}` via `useScreenShake.ts`. Also live: `animate-streak-pulse`, `animate-streak-glow`, plus success-glow, error-pulse, vignette-pulse, shine-sweep, halo-pulse and tier-spin. Grep `src/index.css` for the current set rather than trusting a list here.

## Mobile

- Touch targets: min 44x44px, 8px spacing between targets
- Viewport: `--vh` CSS variable in App.tsx for iOS Safari, `dvh` units in Tailwind
- Events: 17 JSON files in `public/events/`, loaded via `manifest.json`. There are **20 categories** (`ALL_CATEGORIES` in `src/types/index.ts` — the source of truth) and **4 difficulties** including `very-hard`. Filenames no longer map to categories: the taxonomy was re-clustered in June 2026 and the files were never re-split, so every file holds a mix. Never infer a category from a filename. `deprecated.json` is deliberately absent from the manifest.
- Event `friendly_name` is capped at 35 chars (`MAX_FRIENDLY_NAME_LENGTH`) so it fits the card without an ellipsis; enforced by `src/utils/eventNameLength.test.ts`. Neither `friendly_name` nor `description` may state a date (year, decade, century, `NNN CE/BCE`) — both are shown before the card is placed, so a date there is the answer; enforced by `src/utils/eventDateClues.test.ts`, and see [docs/events-images/index.md](docs/events-images/index.md) before bulk-editing event text
