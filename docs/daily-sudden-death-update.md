# Daily Mode: Sudden Death Rules Update

## Overview

The daily challenge mode has been updated to use **sudden death mechanics** instead of the standard freeplay rules. This makes the daily challenge more exciting and skill-based, where players must build the longest possible timeline streak.

## Changes

### Game Mechanics

| Aspect                 | Before                  | After                                   |
| ---------------------- | ----------------------- | --------------------------------------- |
| Starting cards         | 5                       | 3                                       |
| On correct placement   | Remove card from hand   | Draw a new card (hand stays same size)  |
| On incorrect placement | Draw a replacement card | No replacement (hand shrinks)           |
| Win condition          | Empty your hand         | Build longest streak before elimination |
| Game over              | After placing all cards | When hand becomes empty                 |

### First-Time Rules Popup

A new "How to Play" popup now appears the first time a player starts any game mode. This helps new players understand the rules before playing.

- Shows mode-specific rules (sudden death rules for daily/sudden death, standard rules for freeplay)
- Dismisses with a tap anywhere
- Only appears once per mode (tracked in localStorage)
- Can still access rules anytime via the info button in the top bar

## Technical Implementation

### Files Modified

| File                                                       | Change                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/utils/dailyStorage.ts` → `src/utils/playerStorage.ts` | Renamed and extended with modes-played tracking                                     |
| `src/hooks/useWhenGame.ts`                                 | Daily uses 3 cards + sudden death mechanics via `usesSuddenDeathMechanics()` helper |
| `src/utils/gameLogic.ts`                                   | `shouldGameEnd()` and `processEndOfRound()` include daily mode                      |
| `src/components/TopBar.tsx`                                | Exported `GameRules` component, updated rules text for daily                        |
| `src/components/GamePopup.tsx`                             | Game over popup uses sudden death messaging for daily                               |
| `src/components/ResultBanner.tsx`                          | Result banner uses sudden death styling for daily                                   |
| `src/utils/share.ts`                                       | Share text shows "Streak: X" instead of "X/Y correct"                               |
| `src/components/ModeSelect.tsx`                            | Updated import path, daily config uses 3 cards                                      |
| `src/components/Game.tsx`                                  | Added first-time rules popup                                                        |

### localStorage Keys

Two keys are used for player data:

1. `when-daily-result` - Stores today's daily game result (unchanged)
2. `when-modes-played` - Tracks which modes have been played (new)

```typescript
// Example of modes-played data structure
{
  "daily": true,
  "suddenDeath": true,
  "freeplay": false
}
```

### Helper Function

A new helper function centralizes the sudden death mechanics check:

```typescript
const usesSuddenDeathMechanics = (mode: GameMode | null): boolean =>
  mode === 'suddenDeath' || mode === 'daily';
```

This is used throughout the codebase to determine if a game mode should use sudden death rules.

## User Experience

### Share Text

The share text for daily mode now reflects the sudden death mechanics:

**Before:**

```
When #2025-01-04 📅
Theme: Ancient Civilizations
🟢🟢🔴🟢🔴
3/5 correct
```

**After:**

```
When #2025-01-04 📅
Theme: Ancient Civilizations
🟢🟢🔴🟢🔴
🔥 Streak: 3
```

### Game Over Screen

- Shows "Game Over" (not "You Won!") since there's no traditional win state
- Displays streak count instead of correct/total ratio
- Uses the same styling as sudden death mode
