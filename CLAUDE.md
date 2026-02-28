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
