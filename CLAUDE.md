# CLAUDE.md

"When" is a mobile-first timeline game where players place historical events in chronological order. React 19 + TypeScript + Tailwind CSS. Deployed on Vercel. iOS app via Capacitor.

For detailed architecture (component hierarchy, hooks, utils, API routes, z-index, dependencies): see [docs/architecture-reference.md](docs/architecture-reference.md)

## Commands

```bash
vercel dev                   # Full-stack dev (frontend + API routes)
npm start                    # Frontend-only dev server (no API)
npm run build                # Production build
npm test                     # Tests (watch mode)
npm run lint                 # ESLint check
npm run typecheck            # TypeScript check
npm run format               # Prettier format
npm run release              # Bump version (auto-detect from commits)
```

## Release & Deployment

- **Production deploys on every push to `main`** (Vercel default Git integration; `vercel.json` has only rewrites, no deploy config). Merging a PR to `main` ships to production — the release step below is separate version/changelog/tag bookkeeping, not what deploys the app.
- **Versioning** uses `commit-and-tag-version` (config in `.versionrc.json`). Run `./scripts/release.sh [patch|minor|major]` (or `npm run release[:patch|:minor|:major]`). It bumps `package.json`, regenerates `CHANGELOG.md`, runs the `postchangelog` hook (`scripts/inject-version.js` + `generate-rss.js` → updates `public/feed.xml`, `src/version.ts`, `public/version.json`, `public/service-worker.js`), commits `chore(release): x.y.z`, tags `vX.Y.Z`, and pushes with `--follow-tags`.
- **Bump auto-detect** reads Conventional Commits since the last tag: `feat` → minor, `fix`/`perf` → patch; `docs`/`refactor`/`chore`/`ci`/etc. are hidden from the changelog. Squash-merge PRs with a conventional title (e.g. `feat: …`) so `main` history stays clean and auto-detect works; otherwise pass an explicit bump type.
- **Releasing from a phone / cloud (Claude Code on the web) session:** sandboxed/cloud sessions are org-policy-blocked from pushing to `main` (`git push` → HTTP 403), so they can open+merge PRs but cannot run the release directly. Use the **Release GitHub Action** (`.github/workflows/release.yml`, `workflow_dispatch`): GitHub → **Actions → Release → Run workflow** → pick the bump. It runs the release in CI with `GITHUB_TOKEN`, which *can* push to `main`. The GitHub **mobile app can't trigger workflows** — use mobile web: `github.com/Edward-Muir/when/actions/workflows/release.yml`. (`main` is currently unprotected.)

## Key Architecture

- **Game phases**: `loading` -> `modeSelect` -> `transitioning` -> `playing` -> `gameOver` -> `viewTimeline`
- **Game modes**: Daily (seeded, one play/day), Sudden Death, Freeplay
- **State**: All in `src/hooks/useWhenGame.ts` — `WhenGameState` tracks phase, timeline, players, deck, streaks
- **Routes**: `/` (main), `/daily` (auto-start daily mode) — defined in `src/index.tsx`
- **API**: Leaderboard endpoints in `api/leaderboard/` (Upstash Redis). Needs `vercel dev` to run locally.

## Styling

- Colors: CSS custom properties in `src/index.css`, referenced by Tailwind. Use `bg-bg`, `text-text`, `bg-accent` etc. No `dark:` prefixes needed.
- Fonts: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (DM Mono)
- Animations: `shake`, `screen-shake`, `entrance`, `streak-pulse`, `streak-glow`

## Mobile

- Touch targets: min 44x44px, 8px spacing between targets
- Viewport: `--vh` CSS variable in App.tsx for iOS Safari, `dvh` units in Tailwind
- Events: JSON files in `public/events/`, 6 categories, loaded via `manifest.json`
- Event `friendly_name` is capped at 35 chars (`MAX_FRIENDLY_NAME_LENGTH`) so it fits the card without an ellipsis; enforced by `src/utils/eventNameLength.test.ts`
