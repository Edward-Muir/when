# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"When" is a mobile-first timeline game where players place historical events in chronological order. Supports single-player and multiplayer modes.

## Commands

```bash
npm start                    # Dev server on port 3000
npm run build                # Production build to /build
npm test                     # Tests in watch mode
npm test -- --watchAll=false # Tests once (CI mode)
npm test -- Card.test        # Run specific test file
npm run lint                 # ESLint check
npm run lint:fix             # ESLint with auto-fix
npm run typecheck            # TypeScript type check
npm run format               # Prettier format all files
npm run find-duplicates      # Check for duplicate events in JSON
```

## Architecture

React 19 + TypeScript + Tailwind CSS. Create React App toolchain. Pre-commit hooks via Husky + lint-staged.

### Game Modes

- **Daily**: Seeded shuffle for consistent daily challenge (all players get same cards)
- **Sudden Death**: Wrong answers shrink your hand; run out and you're eliminated
- **Freeplay**: Configurable turns, filter by difficulty/category/era

### Daily Mode Play-Once Restriction

Daily mode uses localStorage to enforce one play per day (Wordle-style):

- **Storage**: `src/utils/dailyStorage.ts` saves/retrieves `DailyResult` with key `when-daily-result`
- **Save trigger**: `useWhenGame.ts` has a `useEffect` that saves when `phase === 'gameOver' && gameMode === 'daily'`
- **UI**: `ModeSelect.tsx` checks `getTodayResult()` and shows completed state instead of play button
- **Data stored**: date, theme, won, correctCount, totalAttempts, emojiGrid

If adding new game modes or modifying daily mode, ensure:

1. Results are saved to localStorage on game completion
2. ModeSelect correctly detects and displays completed state
3. Share functionality works from both game over screen and mode select

### State Management

All game state in `src/hooks/useWhenGame.ts`:

- `WhenGameState` tracks phase, timeline, players, deck, turn/round count
- `placeCard(insertionIndex)` validates placement, triggers animations via `isAnimating`/`animationPhase`, updates state after delay
- Players have a `hand[]` of cards; first card is the active card, `cycleHand()` rotates

### Game Phases

`loading` → `modeSelect` → `playing` → `gameOver`

### Component Hierarchy

```
App.tsx                    # Phase router, viewport height fix
├── ModeSelect.tsx         # Mode selection + filter config
└── Game.tsx               # Main gameplay with DndContext
    ├── TopBar.tsx         # Home button, title
    ├── PlayerInfo.tsx     # Turn/round/score display
    ├── ResultBanner.tsx   # Correct/incorrect feedback
    ├── ActiveCardDisplay.tsx  # Draggable card + cycle button
    ├── Timeline/
    │   ├── Timeline.tsx       # Vertical scrollable drop zone
    │   └── TimelineEvent.tsx  # Placed cards with year
    ├── GameOverControls.tsx   # Restart/share buttons
    └── ExpandedCard.tsx       # Modal for card details
```

### Event Data

Historical events in `public/events/` as JSON files:

- Categories: conflict, cultural, diplomatic, disasters, exploration, infrastructure
- Fields: `name` (ID), `friendly_name`, `year`, `category`, `description`, `difficulty`, optional `image_url`
- Loaded via `manifest.json`, deduplicated by `name`

### Era Definitions (utils/eras.ts)

Events filterable by era: prehistory, ancient, medieval, earlyModern, industrial, worldWars, coldWar, modern

### Type Definitions (types/index.ts)

Core types: `HistoricalEvent`, `Player`, `WhenGameState`, `GameConfig`, `Category`, `Difficulty`, `Era`, `GameMode`

### Styling

Custom Tailwind in `tailwind.config.js`:

- Theme colors: `light-*` / `dark-*` semantic tokens, `accent` / `accent-dark`
- Category colors: conflict=red, disasters=gray, exploration=teal, cultural=purple, infrastructure=amber, diplomatic=blue
- Fonts: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (DM Mono)
- Custom animations: `shake`, `screen-shake`, `entrance`

### Z-Index Hierarchy (Game.tsx & Timeline.tsx)

Critical for preventing overlap issues:

| Layer                   | Z-Index | Component    |
| ----------------------- | ------- | ------------ |
| Left panel (hand zone)  | z-40    | Game.tsx     |
| Timeline scroll content | z-10    | Timeline.tsx |
| Timeline fade overlays  | z-30    | Timeline.tsx |
| Card stack container    | z-40    | Game.tsx     |
| Cycle button            | z-50    | Game.tsx     |

### Drag and Drop

Uses `@dnd-kit/core` with custom sensors in `utils/dndSensors.ts`. The `useDragAndDrop` hook in `hooks/useDragAndDrop.ts` manages drag state and calculates insertion index based on Y position relative to timeline events.

## Mobile Development Guidelines

This is a mobile-first web app.

### Touch Targets

- Minimum **44x44px** (Apple HIG) or **48x48px** (Material Design) for interactive elements
- Use padding to extend touch areas beyond visual bounds
- Maintain **8px minimum spacing** between touch targets

### Viewport Handling

- **Implemented**: `--vh` CSS variable in App.tsx for iOS Safari
- **Implemented**: `dvh` units with `screen-safe` fallbacks in Tailwind config
- Use `env(safe-area-inset-*)` for notched devices

### Dependencies

- `@dnd-kit/core` + `@dnd-kit/utilities`: Drag and drop
- `framer-motion`: Animations
- `lucide-react`: Icons
- `react-confetti-explosion`: Win celebration
- `cloudinary`: Image hosting
