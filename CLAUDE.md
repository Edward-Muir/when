# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains "When" - a mobile-first, single-player timeline game where players place historical events in chronological order. The active project is in `when/`.

## Commands

All commands should be run from the `when/` directory:

```bash
cd when
npm start          # Start development server (port 3000)
npm run build      # Production build to /build
npm test           # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
```

## Architecture

React 19 + TypeScript + Tailwind CSS. Create React App toolchain.

### Game Modes

- **Daily**: Seeded shuffle for consistent daily challenge
- **Sudden Death**: One wrong answer ends the game
- **Freeplay**: Configurable turns (default 8), filter by difficulty/category/era

### State Management

All game state in `when/src/hooks/useWhenGame.ts`:
- `WhenGameState` tracks phase, timeline, activeCard, deck, turn count, score
- `placeCard(insertionIndex)` validates placement, triggers animations via `isAnimating`, updates state after delay
- Timeline maintained sorted by year; cards insert at correct chronological position

### Game Phases

`loading` → `modeSelect` → `playing` → `gameOver`

### Component Hierarchy

```
App.tsx              # Phase router
├── ModeSelect.tsx   # Game mode selection with filters
└── Game.tsx         # Main gameplay
    ├── Header.tsx   # Turn/score display, settings popup
    ├── Card.tsx     # Active card (year hidden)
    ├── Timeline/
    │   ├── Timeline.tsx        # Vertical scrollable list with drag-and-drop
    │   ├── TimelineEvent.tsx   # Placed cards (year shown)
    │   └── GhostCard.tsx       # Drop target indicator
    └── GameOver.tsx # Final score
```

### Event Data

Historical events in `when/public/events/` as JSON files by category:
- Categories: conflict, cultural, diplomatic, disasters, exploration, infrastructure
- Fields: `name`, `friendly_name`, `year`, `category`, `description`, `difficulty`, optional `image_url`
- Loaded via `manifest.json`, deduplicated by `name`

### Era Definitions (utils/eras.ts)

Events filterable by era: prehistory, ancient, medieval, earlyModern (Renaissance), industrial, worldWars, coldWar, modern

### Styling

- Custom Tailwind colors: `cream`, `paper`, `sketch`
- Category colors: conflict=red, disasters=gray, exploration=teal, cultural=purple, infrastructure=amber, diplomatic=blue
- Custom animations: `shake`, `flip`, `entrance`, `screen-shake`, `pulse-glow`, `slide-in`

## Mobile Development Guidelines

This is a mobile-first web app. Follow these best practices:

### Touch Targets

- Minimum **44x44px** (Apple HIG) or **48x48px** (Material Design) for all interactive elements
- Use padding to extend touch areas beyond visual bounds (e.g., 24px icon with padding to reach 48px tap target)
- Maintain **8px minimum spacing** between touch targets to prevent mis-taps
- Use larger targets (48px+) at screen edges where touch precision is lower
- Use `@media (any-pointer: coarse) { }` for touch-specific sizing adjustments

### Touch Interaction

- Apply `touch-action: manipulation` CSS to eliminate the 300ms tap delay
- Provide clear visual feedback for all touch interactions
- Design for thumb-friendly navigation - keep primary actions in the bottom half of the screen on mobile

### Viewport Handling

- **Already implemented**: `--vh` CSS variable for iOS Safari viewport issues (set in App.tsx)
- **Already implemented**: `dvh` units with `screen-safe` fallbacks in Tailwind config
- Use `env(safe-area-inset-*)` padding for notched devices (iPhone X+)
- Test orientation changes - the app handles this with delayed resize events

### Performance

- Lazy load images below the fold
- Use modern image formats (WebP) where possible
- Optimize for slow/unreliable networks - consider offline fallback states
- Keep animations performant (use `transform` and `opacity` for GPU acceleration)

### Accessibility

- Ensure sufficient color contrast (WCAG AA minimum)
- Support keyboard navigation for all interactive elements
- Use semantic HTML and ARIA roles appropriately
- Test with screen readers on mobile (VoiceOver/TalkBack)

### Dependencies

- `@dnd-kit/core` + `@dnd-kit/utilities`: Drag and drop for card placement
- `lucide-react`: Icons
- `react-confetti-explosion`: Win celebration
- `cloudinary`: Image hosting for event images
