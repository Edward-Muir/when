# CLAUDE.md

"When" is a mobile-first timeline game where players place historical events in chronological order. React 19 + TypeScript + Tailwind CSS. Deployed on Vercel. iOS app via Capacitor.

For detailed architecture (component hierarchy, hooks, utils, API routes, z-index, dependencies): see [docs/architecture-reference.md](docs/architecture-reference.md)

Before changing anything about how card images are fetched or sized (`src/utils/cloudinaryImage.ts`, preloading, the service-worker image cache): see [docs/cloudinary-cost-controls.md](docs/cloudinary-cost-controls.md) — the rung ladder has hard rules (no `dpr_auto`, never an uncapped width, keep both rungs square) that exist because breaking them ran the account toward a shutdown.

To drive/play the app end-to-end with Playwright (smoke tests, or playing the live daily) — including the drag-and-drop recipe, the proxy/TLS workaround, and a copy-pasteable script: see [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md)

## Commands

```bash
vercel dev                   # Full-stack dev (frontend + API routes)
npm start                    # Frontend-only dev server (no API)
npm run build                # Production build
npm test                     # Tests (watch mode)
npm run lint                 # ESLint check (covers src AND api)
npm run typecheck            # TypeScript check (src only — tsconfig `include` is ["src"])
npm run typecheck:api        # TypeScript check for api/ (not covered by `typecheck`)
npm run format               # Prettier format
npm run release              # Bump version (auto-detect from commits)
```

## Release & Deployment

- **Production deploys on every push to `main`** (Vercel default Git integration; `vercel.json` has only rewrites, no deploy config). Merging a PR to `main` ships to production — the release step below is separate version/changelog/tag bookkeeping, not what deploys the app.
- **Versioning** uses `commit-and-tag-version` (config in `.versionrc.json`). Run `./scripts/release.sh [patch|minor|major]` (or `npm run release[:patch|:minor|:major]`). It bumps `package.json`, regenerates `CHANGELOG.md`, runs the `postchangelog` hook (`scripts/inject-version.js` + `generate-rss.js` → updates `public/feed.xml`, `src/version.ts`, `public/version.json`, `public/service-worker.js`), commits `chore(release): x.y.z`, tags `vX.Y.Z`, and pushes with `--follow-tags`.
- **Bump auto-detect** reads Conventional Commits since the last tag: `feat` → minor, `fix`/`perf` → patch; `docs`/`refactor`/`chore`/`ci`/etc. are hidden from the changelog. Squash-merge PRs with a conventional title (e.g. `feat: …`) so `main` history stays clean and auto-detect works; otherwise pass an explicit bump type.
- **Automatic release on merge:** the **Release GitHub Action** (`.github/workflows/release.yml`) runs in CI with `GITHUB_TOKEN` (which _can_ push to `main`). On push to `main`, it auto-releases **only when the merge contains a `feat`/`fix`/`perf` commit** (auto-detecting minor/patch); docs/chore/ci/refactor-only merges are skipped. So squash-merging a PR with a `feat:`/`fix:` title ships a release with no further action.
- **Manual release:** the same workflow also has `workflow_dispatch` — GitHub → **Actions → Release → Run workflow** → pick the bump (forces any version, and releases a merge that auto-skipped). The GitHub **mobile app can't trigger workflows** — use mobile web: `github.com/Edward-Muir/when/actions/workflows/release.yml`.
- **Why CI, not local:** sandboxed/cloud (Claude Code on the web) sessions are org-policy-blocked from pushing to `main` (`git push` → HTTP 403), so they open+merge PRs but never run the release directly — the Action does it. (`main` is currently unprotected.)

## Key Architecture

- **Game phases**: `loading` -> `modeSelect` -> `transitioning` -> `playing` -> `gameOver` (`GamePhase` in `src/types/index.ts`). The timeline view is a route/tab, not a phase.
- **Game modes**: `GameMode` has exactly two values, `daily` and `suddenDeath`, and there is no mode picker anywhere in the UI. Both run identical mechanics — hand of N, correct placement draws a replacement, a wrong one shrinks the hand, game over when the hand empties. They differ only in how the deck is built: `daily` is seeded from the calendar date (one play/day), `suddenDeath` from the Custom page's filters. So the two player-facing entry points are **Daily** and **Custom**, not two rule-sets.
  - **Naming.** `suddenDeath` surfaces to players as **"Marathon"** in share text and **"Sudden Death"** on `/support`. Both are deliberate UI-only names — the mismatch with the internal identifier is not a bug to fix.
  - A third mode, `freeplay` (empty your hand to win), was removed once it became UI-unreachable. Legacy share links still set its bit, so `src/utils/challengeCode.ts` keeps bit 0 reserved — read the note there before touching that encoding.
  - **Multiplayer** is fully implemented in the engine (turn handoff, elimination, round reprieve) but no UI reaches it: `playerCount` is pinned to 1 in `ModeSelect.tsx` and its control is hidden. It's only reachable via a challenge code encoding `playerCount > 1`. Don't treat those branches as dead, and don't expect to exercise them from the app.
- **Deck composition**: decks are not a plain shuffle. `src/utils/deckBuilder.ts` composes the first 24 cards so the game opens with an easy, well-spread placement and ramps from there; the rest of the pool follows as a seeded shuffle. Difficulty is scored in `src/utils/difficultyScore.ts` by blending the `difficulty` label with how crowded the timeline is around each event — the label alone grades fame, which anti-correlates with how hard a card is to place. The daily additionally guarantees no card repeats within 7 days (`src/utils/dailyRecency.ts`). Read the header comments in those three files before retuning any of it.
- **State**: Game state lives in `src/hooks/useWhenGame.ts` — `WhenGameState` tracks phase, timeline, players, deck, streaks. Persisted state (stats, streaks, settings) lives in `src/utils/statsStorage.ts` and `src/utils/playerStorage.ts`.
- **Routes**: 15 routes in `src/index.tsx`, plus a catch-all redirect to `/`. Player-facing: `/`, `/daily`, `/challenge/:code`, `/stats`, `/achievements`, `/timeline`, `/privacy`, `/terms`, `/support`. Unlinked maintainer tools: `/image-qc`, `/card-reports`, `/cards-preview`, `/unlock-preview`, `/anim-jig`, `/reminder-preview`. A new client route also needs a rewrite in `vercel.json` or it 404s on direct load in production — **`/stats`, `/achievements`, `/timeline`, `/cards-preview`, `/unlock-preview`, `/anim-jig` and `/reminder-preview` currently have no rewrite**. Of those, `/stats`, `/achievements` and `/timeline` still work via in-app navigation (`TopBar.tsx` routes to them); `/cards-preview`, `/unlock-preview`, `/anim-jig` and `/reminder-preview` have **no rewrite and no in-app link**, so they are unreachable in production and only usable in local dev.
- **API**: `api/leaderboard/` (daily scores) and `api/card-reports/` (player-reported card problems), both on Upstash Redis. Needs `vercel dev` to run locally.

## Styling

- Colors: CSS custom properties in `src/index.css`, referenced by Tailwind. Use `bg-bg`, `text-text`, `bg-accent` etc. No `dark:` prefixes needed.
- Fonts: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (DM Mono)
- Animations come from two places, and the split matters:
  - **Tailwind keyframes** (`tailwind.config.js`): `animate-entrance` is used; `animate-shake` and `animate-screen-shake` are defined but have **zero usages** — don't reach for them.
  - **Hand-written classes** (`src/index.css`): the shake actually in use is `animate-shake-{light,medium,heavy}` via `useScreenShake.ts`. Also live: `animate-streak-pulse`, `animate-streak-glow`, plus success-glow, error-pulse, vignette-pulse, shine-sweep, halo-pulse and tier-spin. Grep `src/index.css` for the current set rather than trusting a list here.

## Mobile

- Touch targets: min 44x44px, 8px spacing between targets
- Viewport: `--vh` CSS variable in App.tsx for iOS Safari, `dvh` units in Tailwind
- Events: 17 JSON files in `public/events/`, loaded via `manifest.json`. There are **20 categories** (`ALL_CATEGORIES` in `src/types/index.ts` — the source of truth) and **4 difficulties** including `very-hard`. Filenames no longer map to categories: the taxonomy was re-clustered in June 2026 and the files were never re-split, so every file holds a mix. Never infer a category from a filename. `deprecated.json` is deliberately absent from the manifest.
- Event `friendly_name` is capped at 35 chars (`MAX_FRIENDLY_NAME_LENGTH`) so it fits the card without an ellipsis; enforced by `src/utils/eventNameLength.test.ts`
