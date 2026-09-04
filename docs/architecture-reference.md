# Architecture Reference

Detailed reference for the "When" codebase. See [../CLAUDE.md](../CLAUDE.md) for the essentials.

## Component Hierarchy

`ls src/components/`, `src/hooks/` and `src/utils/` for the full inventory — an exhaustive
list here only goes stale. What follows is the spine plus the relationships you would
guess wrong.

```
index.tsx                      # BrowserRouter + 13 routes
├── App.tsx                    # Phase router, viewport height fix
│   ├── ModeSelect.tsx         # Tab pager (Daily/Archive/Custom/Stats/Timeline)
│   │   ├── DailyCta.tsx            # Daily hero's Play / Share / Submit button
│   │   ├── panels/CustomPanel.tsx → CustomGameSettings.tsx  # Custom tab: filters + Play
│   │   ├── Leaderboard.tsx         # (mounted here, NOT under Game)
│   │   ├── panels/                 # Archive, Custom, Stats, Timeline panels — one per tab
│   │   │   └── stats/AchievementsSection.tsx # Last card of StatsPanel (was /achievements)
│   │   ├── ArchiveDeckRow.tsx      # One past deck on the Archive timeline (not an event Card)
│   │   └── HowToPlayModal.tsx      # The rules; also mounted by Game and Menu
│   ├── GameStartTransition.tsx # Animated transition into gameplay
│   └── Game.tsx               # Main gameplay, owns the DndContext
│       ├── ActiveCardDisplay.tsx → DraggableCard.tsx → Card.tsx
│       ├── HintStrip.tsx      # The one-line hint pill (also inline on each home tab)
│       ├── Timeline/          # Timeline.tsx, TimelineEvent.tsx, TombstoneRow.tsx
│       ├── GamePopup.tsx      # Correct/incorrect/description/gameOver
│       │   └── LeaderboardSubmit.tsx   # (child of the popup, not of Game)
│       ├── TopBar.tsx         # Home + nav; scrolls the pager or routes to a tab's path
│       │   ├── Menu.tsx                # Burger menu: theme, share, install, How to Play, Help & FAQ, legal
│       │   └── UpdatePopup.tsx         # (child of TopBar, not of Game)
│       └── PlayerInfo.tsx, GameOverControls.tsx, Toast.tsx
├── routes/DailyRoute.tsx      # /daily — auto-starts the daily
├── routes/ChallengeRoute.tsx  # /challenge/:code — decodes a share link into a GameConfig
└── pages/                     # Standalone routes, not App children (Home = the pager,
                               # Support, ImageQc, CardReports, …)
```

Easy to get wrong: `FilterPopup` is mounted by `panels/TimelinePanel`, not `Game`.
`CategoryIcon` has five importers across the tree. "How to Play" is one component,
`HowToPlayModal`, mounted three times (Game for the first-run showing, Menu, and ModeSelect
for the Daily tab's link); the rules copy `GameRules` lives in that file, not in `Menu.tsx`.

## Hooks

`src/hooks/` — `useWhenGame` (the state machine: phases, placement, scoring) is the one to
read first; `useGameStatsRecorder` is where a finished game reaches `statsStorage`. The
rest are single-purpose and named for what they do (`useDragAndDrop`, `useLeaderboard`,
`useHaptics`, `useTheme`, `useScreenShake`, `useVersionCheck`, `usePWAInstall`, `useToday`,
`useImagePrefetch`, `useDailyReminder`, `useEndOfGameSequence` — the post-game screen queue:
milestones, achievements, then always the share; `useOnboardingHints` — the in-game one-shot
hint machine, kept out of `Game.tsx` because Game sits on the ESLint complexity ceiling;
`useTabHint` — a home tab's first-visit strip, gated on `active`).

## Utils

`src/utils/` — the ones with non-obvious contracts, each carrying a load-bearing header
comment worth reading before you change it:

| Util              | Why it needs care                                                            |
| ----------------- | ---------------------------------------------------------------------------- |
| `deckBuilder`     | Decks are composed, not shuffled — opening ramp + spacing                    |
| `difficultyScore` | Composite: recognition label blended with timeline crowding                  |
| `dailyRecency`    | Seven-day no-repeat chain for the daily                                      |
| `puzzleDate`      | **Local** calendar day, never `toISOString()` — see the header comment       |
| `challengeCode`   | Positional bit-packed share links; bit 0 is a reserved legacy mode bit       |
| `cloudinaryImage` | Transform rung ladder with hard cost rules — see cloudinary-cost-controls.md |
| `statsStorage`    | Persisted lifetime stats, achievements, and a legacy-shape fold on read      |
| `themeReplay`     | Archive replays: why they are `suddenDeath`, reshuffled, and never dated     |
| `themeBests`      | Per-curated-theme personal bests (`when-theme-bests`)                        |

Everything else (`gameLogic`, `placementLogic`, `eventLoader`, `playerStorage`,
`dailyPool`, `dailyConfig`, `dailyTheme`, `share`, `streakFeedback`, `deviceFingerprint`,
`dndSensors`, `eras`, `eventNameLength`, `introEvents`, `timelineRows`, `eventColor`, …)
does what its name says.

## Type Definitions (types/index.ts)

Core types: `HistoricalEvent`, `Player`, `WhenGameState`, `GameConfig`, `GamePhase`, `GamePopupType`, `AnimationPhase`, `PlacementResult`, `Category` (20 values), `Difficulty` (4, incl. `very-hard`), `Era` (8), `GameMode` (2 — `daily` and `suddenDeath`, same mechanics, different deck source).

`GameConfig.totalTurns` is written by three callers and read by none — it is a leftover, not a turn limit. There is no turn cap in either mode.

## API Routes (Vercel Serverless)

Located in `api/`. Requires `vercel dev` to run locally.

| Endpoint                   | Method | Purpose                                                               |
| -------------------------- | ------ | --------------------------------------------------------------------- |
| `/api/leaderboard/[date]`  | GET    | Fetch daily leaderboard (with bot generation, names filtered on read) |
| `/api/leaderboard/submit`  | POST   | Submit daily score                                                    |
| `/api/card-reports/submit` | POST   | Report a problem with a card's data                                   |
| `/api/card-reports/list`   | GET    | Read reports (feeds the hidden `/card-reports` page) — **key-gated**  |

Backend uses **Upstash Redis** for leaderboard storage. Bot players are auto-generated per date via `botGeneration.ts`.

Display names go through `nameFilter.ts` (built on `obscenity`) on **both** write and read — a blocked name is silently swapped for a deterministic generated one rather than rejected. Filtering on read is deliberate: the sorted set's member is the JSON entry itself, so masking on the way out cleans entries stored before the filter existed and makes any later word-list addition apply retroactively. See [Leaderboard & Daily Mode](leaderboard-daily/index.md).

Card reports store only an event id + reason id + timestamp under `cardreport:*` keys — no device id, no IP, no free text. Every key is TTL'd or capped. Abuse controls are a per-device-per-card dedup (30d) and a per-IP rate limit (20/hour); the IP is SHA-256 hashed and used only as an expiring rate-limit key. `npm run typecheck:api` type-checks `api/`, which `npm run typecheck` does not cover (root `tsconfig.json` has `"include": ["src"]`). `npm run lint` **does** cover it — it runs `eslint src api`.

Environment variables in `.env`:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis connection
- `REPORTS_ADMIN_KEY` - Shared secret for reading card reports (see below)
- `CLOUDINARY_*` - Image hosting
- `WIKI_*` - Wikipedia API access

`/api/card-reports/submit` is public — it is the player-facing write path. `/api/card-reports/list` requires `REPORTS_ADMIN_KEY`, checked before any Redis call so a rejected request costs no Upstash commands (the reason for the gate: Upstash bills per command, and an open GET runs a `ZRANGE` + `LRANGE` for anyone who loops it). Generate a key with `openssl rand -hex 24` and set it in the Vercel project for **both Production and Preview** — previews are a separate environment. With the variable unset the endpoint returns 503 in production (fails closed) but allows through elsewhere, so `vercel dev` needs no setup. The `/card-reports` page takes the key from `?key=…` once (then strips it from the URL) or from a paste-in field, and stores it in localStorage under `when-reports-key`.

## Z-Index Hierarchy

Low to high. Verify against source before relying on it — grep `z-` in the three files.

| Layer                       | Z-Index | File                                           |
| --------------------------- | ------- | ---------------------------------------------- |
| Timeline spine              | z-0     | Timeline.tsx:400                               |
| Card stack (back/mid/front) | z-0/1/2 | ActiveCardDisplay.tsx                          |
| Timeline scroll content     | z-10    | Timeline.tsx:409                               |
| Timeline fade overlays      | z-30    | Timeline.tsx:392, 471                          |
| Onboarding hint strip       | z-[35]  | HintStrip.tsx (in Game's timeline area)        |
| Bottom bar (hand zone)      | z-40    | Game.tsx                                       |
| Placement vignette          | z-[45]  | Game.tsx                                       |
| Cycle button                | z-50    | ActiveCardDisplay:33                           |
| Leave-game confirm modal    | z-50    | Game.tsx (`HomeConfirmModal`)                  |
| Confetti burst              | z-50    | Game.tsx                                       |
| How-to-play modal           | z-[60]  | HowToPlayModal.tsx (`ui/Modal` `reveal` layer) |

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

**Dev**: `husky`, `lint-staged`, `prettier`, `commit-and-tag-version`, `eslint-plugin-security`, `puppeteer`, `sharp`. Note `typescript` sits in `dependencies`, not `devDependencies`, and `eslint` itself is not a declared dependency at all — it arrives transitively via `react-scripts`.

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

See [events-images/event-editor-tool.md](events-images/event-editor-tool.md) for full documentation.
