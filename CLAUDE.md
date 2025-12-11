# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start development server (default port 3000)
npm run build      # Production build to /build
npm test           # Run tests in watch mode
```

## Architecture

"When" is a mobile-first, single-player timeline game built with React + TypeScript + Tailwind CSS. Players place historical events in chronological order over 8 turns.

### Game Flow

The game progresses through phases managed by `useWhenGame` hook:
- `loading` → Events loading from JSON
- `ready` → Start screen shown
- `playing` → Active gameplay (8 turns)
- `gameOver` → Final score displayed

### State Management

All game state lives in `src/hooks/useWhenGame.ts`:
- `WhenGameState` tracks timeline, active card, deck, turn count, and score
- `placeCard(insertionIndex)` validates placement, triggers animations via `isAnimating` flag, then updates state after delay
- Timeline always sorted by year; cards insert at correct position regardless of where player tapped

### Key Data Flow

1. Events load from `public/events/*.json` via `eventLoader.ts`
2. On game start: 1 event goes to timeline, 8 to deck, first deck card becomes `activeCard`
3. Player taps `PlacementButton` → `placeCard()` validates → animations play → card inserts at correct position
4. After 8 turns, game ends with score

### Component Structure

```
App.tsx              # Phase router (StartScreen | Game | GameOver)
└── Game.tsx         # Main game layout, handles animations (confetti/shake)
    ├── Header.tsx   # Turn counter and score
    ├── ActiveCard.tsx # Featured card to place (year hidden)
    └── Timeline/
        ├── Timeline.tsx        # Vertical scrollable list
        ├── TimelineEvent.tsx   # Placed cards (year shown)
        └── PlacementButton.tsx # Tap targets between events
```

### Event Data

Historical events stored in `public/events/` as JSON files by category (conflict, cultural, diplomatic, disasters, exploration, infrastructure). Each event has: `name`, `friendly_name`, `year`, `category`, `description`, `difficulty`, optional `image_url`.

### Styling

- Tailwind CSS with custom config in `tailwind.config.js`
- Museum theme: cream background, gold borders, IM Fell Great Primer SC font
- Animations defined in Tailwind config: `shake`, `flip`, `entrance`, `screen-shake`
- Category colors: conflict=red, disasters=gray, exploration=teal, cultural=purple, infrastructure=amber, diplomatic=blue
