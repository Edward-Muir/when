# Game Start Transition Animation - Implementation Summary

## Overview

Added a cinematic transition animation between the main menu (ModeSelect) and the game screen. The animation shows a scrolling timeline with real historical events and an overlay displaying "Loading events from across time..." with an animated ellipsis.

## Files Modified

| File                                                                                | Changes                                                                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [src/types/index.ts](../src/types/index.ts)                                         | Added `'transitioning'` to `GamePhase` type                                                                           |
| [src/hooks/useWhenGame.ts](../src/hooks/useWhenGame.ts)                             | Added `completeTransition()` function; changed `startGame()` to set phase to `'transitioning'` instead of `'playing'` |
| [src/App.tsx](../src/App.tsx)                                                       | Added conditional rendering for `GameStartTransition` when phase is `'transitioning'`                                 |
| [src/components/GameStartTransition.tsx](../src/components/GameStartTransition.tsx) | New component - the main transition animation                                                                         |

## How It Works

### Animation Flow

1. User clicks Play → `startGame()` sets phase to `'transitioning'`
2. `GameStartTransition` renders with random historical events
3. Timeline scrolls upward at a constant (linear) rate for 6 seconds
4. After 3 seconds, `onComplete` is called → phase changes to `'playing'`
5. Game screen renders

### Key Design Decisions

- **Reuses `TimelineEvent` component** - Same visual style as the actual game
- **Random events sorted by year** - 20 events shuffled then sorted chronologically
- **66% scroll distance** - Scrolls through ~13 cards, leaving ~7 visible at the end
- **Linear easing** - Constant scroll speed (no acceleration/deceleration)
- **Semi-transparent overlay** - Text box with backdrop blur for readability
- **Animated ellipsis** - Wave animation on the three dots (bouncing effect)

### Animation Constants

```typescript
const TOTAL_DURATION = 3000; // ms before transitioning to game
const SCROLL_DURATION = 6.0; // seconds for scroll animation
const EVENT_COUNT = 20; // random events to show
const SCROLL_PERCENTAGE = 0.66; // scroll through 66% of cards
const EVENT_HEIGHT = 88; // ~80px card + 8px padding
```

## Accessibility

- `useReducedMotion()` hook detects user preference
- Reduced motion users see a static screen with the loading message
- Auto-completes after 500ms for reduced motion users

## Visual Elements

- Full-screen timeline matching game aesthetic
- Vertical timeline line at 96px (matches game)
- Top and bottom fade gradients
- Centered text overlay with:
  - "Loading events from across time"
  - Animated bouncing ellipsis (...)
  - Semi-transparent background with blur
  - Rounded corners and subtle border

## Iteration History

1. **Initial**: Flashing year counter animation
2. **v2**: Vertical scrolling year labels (like timeline)
3. **v3**: Reuse actual `TimelineEvent` component with random events
4. **v4**: Changed from downward to upward scroll direction
5. **v5**: Slowed animation, changed to linear easing for constant speed
6. **Final**: Tuned timing (3s transition, 6s scroll, 20 events, 66% scroll distance)
