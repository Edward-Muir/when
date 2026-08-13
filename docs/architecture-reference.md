# Architecture Reference

Detailed reference for the "When" codebase. See [../CLAUDE.md](../CLAUDE.md) for the essentials.

## Component Hierarchy

```
index.tsx                      # BrowserRouter + routes
├── App.tsx                    # Phase router, viewport height fix
│   ├── ModeSelect.tsx         # Tab pager (Daily/Custom/Stats/Achievements/Timeline) + filter config
│   ├── GameStartTransition.tsx # Animated transition into gameplay
│   └── Game.tsx               # Main gameplay with DndContext
│       ├── TopBar.tsx         # Home button, title
│       ├── PlayerInfo.tsx     # Turn/round/score/streak display
│       ├── ActiveCardDisplay.tsx  # Card stack + cycle button
│       │   ├── DraggableCard.tsx  # Draggable wrapper
│       │   └── Card.tsx          # Card rendering
│       ├── Timeline/
│       │   ├── Timeline.tsx       # Vertical scrollable drop zone
│       │   └── TimelineEvent.tsx  # Placed cards with year
│       ├── GamePopup.tsx      # Correct/incorrect/description/gameOver popups
│       ├── StatsPopup.tsx     # Streak and stats display
│       ├── GameOverControls.tsx   # Restart/share buttons
│       ├── Leaderboard.tsx    # Daily leaderboard display
│       ├── LeaderboardSubmit.tsx  # Name entry for leaderboard
│       ├── FilterPopup.tsx    # Category/era/difficulty filters
│       ├── Menu.tsx           # Game rules
│       ├── Toast.tsx          # Toast notifications
│       ├── UpdatePopup.tsx    # Version update notification
│       └── CategoryIcon.tsx   # Category badge icons
├── DailyRoute.tsx             # /daily route wrapper (auto-starts daily)
├── ChallengeRoute.tsx         # /challenge/:code — decodes a share link into a GameConfig
└── pages/Timeline.tsx         # /timeline route; renders ViewTimeline.tsx (not an App child)
```

## Hooks

| Hook              | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `useWhenGame`     | Main game state machine (phases, placement, scoring) |
| `useDragAndDrop`  | Drag state, insertion index calculation              |
| `useLeaderboard`  | Fetch/submit daily leaderboard via API               |
| `useHaptics`      | iOS haptic feedback via Capacitor                    |
| `useTheme`        | Dark/light theme toggle                              |
| `useScreenShake`  | Screen shake animation effect                        |
| `useVersionCheck` | App version update detection                         |
| `usePWAInstall`   | PWA install prompt handling                          |

## Utils

| Util                | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `gameLogic`         | Shuffling primitives, seeded RNG, hand/turn rules       |
| `deckBuilder`       | Composes the ramped deck (difficulty curve + spacing)   |
| `difficultyScore`   | Composite difficulty: recognition label + placeability  |
| `dailyPool`         | The themed, filtered pool a given day draws from        |
| `dailyRecency`      | Seven-day no-repeat chain for the daily                 |
| `placementLogic`    | Card placement validation and results                   |
| `eventLoader`       | Load event JSON files, deduplication                    |
| `playerStorage`     | localStorage for scores, daily results, streaks         |
| `statsStorage`      | Persisted lifetime stats and achievement progress       |
| `challengeCode`     | Encode/decode share links (mode, filters, player count) |
| `puzzleDate`        | Local-calendar puzzle day and rollover timing           |
| `dailyConfig`       | Daily mode game configuration + deck                    |
| `dailyTheme`        | Seeded daily theme selection (category or "Everything") |
| `share`             | Share text/emoji grid generation                        |
| `streakFeedback`    | Streak tier config (visual feedback tiers)              |
| `deviceFingerprint` | Unique device ID for leaderboard                        |
| `dndSensors`        | Custom drag/drop sensor config                          |
| `eras`              | Era definitions and filtering                           |

## Type Definitions (types/index.ts)

Core types: `HistoricalEvent`, `Player`, `WhenGameState`, `GameConfig`, `GamePhase`, `GamePopupType`, `AnimationPhase`, `PlacementResult`, `Category`, `Difficulty`, `Era`, `GameMode`

## API Routes (Vercel Serverless)

Located in `api/`. Requires `vercel dev` to run locally.

| Endpoint                   | Method | Purpose                                                               |
| -------------------------- | ------ | --------------------------------------------------------------------- |
| `/api/leaderboard/[date]`  | GET    | Fetch daily leaderboard (with bot generation, names filtered on read) |
| `/api/leaderboard/submit`  | POST   | Submit daily score                                                    |
| `/api/card-reports/submit` | POST   | Report a problem with a card's data                                   |
| `/api/card-reports/list`   | GET    | Read reports (feeds the hidden `/card-reports` page) — **key-gated**  |

Backend uses **Upstash Redis** for leaderboard storage. Bot players are auto-generated per date via `botGeneration.ts`.

Display names go through `nameFilter.ts` (built on `obscenity`) on **both** write and read — a blocked name is silently swapped for a deterministic generated one rather than rejected. Filtering on read is deliberate: the sorted set's member is the JSON entry itself, so masking on the way out cleans entries stored before the filter existed and makes any later word-list addition apply retroactively. See [Display Name Filter](leaderboard-daily/session-2026-08-10-display-name-filter.md).

Card reports store only an event id + reason id + timestamp under `cardreport:*` keys — no device id, no IP, no free text. Every key is TTL'd or capped. Abuse controls are a per-device-per-card dedup (30d) and a per-IP rate limit (20/hour); the IP is SHA-256 hashed and used only as an expiring rate-limit key. `npm run typecheck:api` type-checks `api/` (it is not covered by `npm run lint` or `npm run typecheck`).

Environment variables in `.env`:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis connection
- `REPORTS_ADMIN_KEY` - Shared secret for reading card reports (see below)
- `CLOUDINARY_*` - Image hosting
- `WIKI_*` - Wikipedia API access

`/api/card-reports/submit` is public — it is the player-facing write path. `/api/card-reports/list` requires `REPORTS_ADMIN_KEY`, checked before any Redis call so a rejected request costs no Upstash commands (the reason for the gate: Upstash bills per command, and an open GET runs a `ZRANGE` + `LRANGE` for anyone who loops it). Generate a key with `openssl rand -hex 24` and set it in the Vercel project for **both Production and Preview** — previews are a separate environment. With the variable unset the endpoint returns 503 in production (fails closed) but allows through elsewhere, so `vercel dev` needs no setup. The `/card-reports` page takes the key from `?key=…` once (then strips it from the URL) or from a paste-in field, and stores it in localStorage under `when-reports-key`.

## Z-Index Hierarchy (Game.tsx & Timeline.tsx)

| Layer                   | Z-Index | Component    |
| ----------------------- | ------- | ------------ |
| Timeline scroll content | z-10    | Timeline.tsx |
| Timeline fade overlays  | z-30    | Timeline.tsx |
| Left panel (hand zone)  | z-40    | Game.tsx     |
| Card stack container    | z-40    | Game.tsx     |
| Placement vignette      | z-45    | Game.tsx     |
| Cycle button            | z-50    | Game.tsx     |

## Drag and Drop

Uses `@dnd-kit/core` with custom sensors in `utils/dndSensors.ts`. The `useDragAndDrop` hook manages drag state and calculates insertion index based on Y position relative to timeline events.

## Capacitor (iOS)

Native iOS wrapper in `ios/` directory. Key commands:

```bash
npm run cap:sync            # Sync web build to native project
npm run cap:open:ios        # Open Xcode project
```

Haptic feedback via `@capacitor/haptics` (see `useHaptics` hook).

## Dependencies

**Frontend**: `react`, `react-dom`, `react-router-dom`, `@dnd-kit/core`, `@dnd-kit/utilities`, `framer-motion`, `lucide-react`, `react-confetti-explosion`, `tailwindcss`

**Backend**: `@vercel/node`, `@upstash/redis`, `obscenity` (display-name filtering; server-only, never bundled into the client)

**Mobile**: `@capacitor/core`, `@capacitor/haptics`, `@capacitor/ios`, `@capacitor/splash-screen`, `@capacitor/status-bar`

**Dev**: `typescript`, `husky`, `lint-staged`, `prettier`, `eslint`, `commit-and-tag-version`

## Versioning & Releases

Uses conventional commits with `commit-and-tag-version` for semantic versioning.

On release: bumps `package.json` version, updates `CHANGELOG.md`, regenerates `public/feed.xml` (RSS), creates git tag.

Key files: `src/version.ts` (auto-generated), `.versionrc.json` (config), `scripts/inject-version.js`, `scripts/generate-rss.js`

## Event Editor (`tools/event-editor/`)

Standalone web tool for managing historical events. Browse/edit/add/delete events, move between categories, fetch image dimensions and Wikipedia pageviews.

```bash
cd tools/event-editor
npm install
npm run dev
```

See [event-editor-tool.md](event-editor-tool.md) for full documentation.
