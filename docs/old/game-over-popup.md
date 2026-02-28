# Game Over Popup Implementation

Added a game over popup that displays when the game ends, showing winner(s) and per-player stats.

## Features

- Reuses existing `GamePopup` component pattern (same animations, styling, dismiss behavior)
- Shows trophy icon (amber for winners, muted for losses)
- Displays winner text appropriate to game mode
- Shows per-player stats in multiplayer, overall stats in single player
- Tap anywhere to dismiss (consistent with other popups)

## Files Modified

### 1. `src/types/index.ts`

- Added `'gameOver'` to `GamePopupType` union
- Added `placementHistory: boolean[]` to `Player` interface for per-player stat tracking
- Made `event` nullable in `GamePopupData` (null for game over type)
- Added optional `gameState?: WhenGameState` to `GamePopupData`

### 2. `src/utils/gameLogic.ts`

- Initialize `placementHistory: []` for each player in `initializePlayers()`

### 3. `src/hooks/useWhenGame.ts`

- Track per-player placements: `player.placementHistory = [...player.placementHistory, isCorrect]` in both correct and incorrect placement handlers
- Added `showGameOverPopup()` function that sets pending popup with type `'gameOver'` and current game state

### 4. `src/components/GamePopup.tsx`

- Added `gameState` prop
- Added `GameOverContent` sub-component with:
  - Trophy icon (amber background for winners)
  - Dynamic winner text based on mode and player count
  - Stats display (X/N correct for single player, per-player breakdown for multiplayer)
- Updated main component to conditionally render `GameOverContent` when `type === 'gameOver'`

### 5. `src/components/Game.tsx`

- Added `showGameOverPopup` prop
- Added `gameOverPopupShown` state to prevent duplicate popups
- Added `useEffect` to trigger popup when `state.phase === 'gameOver'`
- Pass `gameState` prop to `GamePopup`

### 6. `src/App.tsx`

- Destructure `showGameOverPopup` from `useWhenGame()`
- Pass it to `Game` component

## Display Logic

| Mode              | Winner Display                         | Stats Display  |
| ----------------- | -------------------------------------- | -------------- |
| Daily (1P)        | "You Won!" / "Game Over"               | X/N correct    |
| Freeplay (1P)     | "You Won!" / "Game Over"               | X/N correct    |
| Freeplay (MP)     | "Player X Wins!" / "Player X & Y Win!" | Per-player X/N |
| Sudden Death (1P) | "Game Over"                            | Streak: X      |
| Sudden Death (MP) | "Player X Wins!"                       | Per-player X/N |

## UI Details

- Uses existing popup styling: `w-[85vw] max-w-[340px] sm:max-w-[400px]`
- Spring animation on enter/exit (framer-motion)
- Dark mode support via semantic color tokens
- Trophy icon from `lucide-react`
- Winners highlighted with amber background in multiplayer stats
