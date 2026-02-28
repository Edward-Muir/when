# Architecture Reference

Detailed reference for the "When" codebase. See [../CLAUDE.md](../CLAUDE.md) for the essentials.

## Component Hierarchy

```
index.tsx                      # BrowserRouter + routes
├── App.tsx                    # Phase router, viewport height fix
│   ├── ModeSelect.tsx         # Mode selection + filter config
│   ├── GameStartTransition.tsx # Animated transition between modes
│   ├── ViewTimeline.tsx       # Read-only timeline of all events
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
│       ├── SettingsPopup.tsx  # Theme and settings
│       ├── FilterPopup.tsx    # Category/era/difficulty filters
│       ├── Menu.tsx           # Game rules
│       ├── Toast.tsx          # Toast notifications
│       ├── UpdatePopup.tsx    # Version update notification
│       └── CategoryIcon.tsx   # Category badge icons
└── DailyRoute.tsx             # /daily route wrapper (auto-starts daily)
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
| `gameLogic`         | Shuffling, deck building, game rules                    |
| `placementLogic`    | Card placement validation and results                   |
| `eventLoader`       | Load event JSON files, deduplication                    |
| `playerStorage`     | localStorage for scores, daily results, streaks         |
| `dailyConfig`       | Daily mode game configuration builder                   |
| `dailyTheme`        | Seeded daily theme selection (category or "Everything") |
| `share`             | Share text/emoji grid generation                        |
| `streakFeedback`    | Streak tier config (visual feedback tiers)              |
| `deviceFingerprint` | Unique device ID for leaderboard                        |
| `dndSensors`        | Custom drag/drop sensor config                          |
| `eras`              | Era definitions and filtering                           |

## Type Definitions (types/index.ts)

Core types: `HistoricalEvent`, `Player`, `WhenGameState`, `GameConfig`, `GamePhase`, `GamePopupType`, `AnimationPhase`, `PlacementResult`, `Category`, `Difficulty`, `Era`, `GameMode`

## API Routes (Vercel Serverless)

Located in `api/leaderboard/`. Requires `vercel dev` to run locally.

| Endpoint                  | Method | Purpose                                       |
| ------------------------- | ------ | --------------------------------------------- |
| `/api/leaderboard/[date]` | GET    | Fetch daily leaderboard (with bot generation) |
| `/api/leaderboard/submit` | POST   | Submit daily score                            |

Backend uses **Upstash Redis** for leaderboard storage. Bot players are auto-generated per date via `botGeneration.ts`. Environment variables in `.env`:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis connection
- `CLOUDINARY_*` - Image hosting
- `WIKI_*` - Wikipedia API access

## Z-Index Hierarchy (Game.tsx & Timeline.tsx)

| Layer                   | Z-Index | Component    |
| ----------------------- | ------- | ------------ |
| Timeline scroll content | z-10    | Timeline.tsx |
| Timeline fade overlays  | z-30    | Timeline.tsx |
| Left panel (hand zone)  | z-40    | Game.tsx     |
| Card stack container    | z-40    | Game.tsx     |
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

**Backend**: `@vercel/node`, `@upstash/redis`

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
