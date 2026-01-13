# Timeline Stats Feature

Added timeline stats to the bottom bar in Sudden Death mode with a tappable popup for details.

## What Was Added

In single-player Sudden Death mode, the bottom-left area shows:

- **Cards left** (Hand icon) - Cards remaining in your hand
- **Current timeline length** (Ruler icon) - Events in your timeline
- **High score** (Trophy icon) - Your longest timeline ever

Tapping this area opens a popup with larger stats and explanations.

## Stats Popup

The popup displays three stats with descriptions:

- Cards remaining in hand
- Events in your timeline
- Your longest timeline ever (high score)

Same animation feel as card popups (spring scale animation). Dismiss by tapping backdrop or pressing Escape.

## Files Modified

| File                            | Changes                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `src/utils/playerStorage.ts`    | Added `getTimelineHighScore()` and `saveTimelineHighScore()` localStorage utilities |
| `src/components/PlayerInfo.tsx` | Stats UI in `GameInfoCompact`, tappable button wrapper                              |
| `src/components/StatsPopup.tsx` | New popup component for stats display                                               |
| `src/components/Game.tsx`       | Passes props to `GameInfoCompact`, manages popup state, renders `StatsPopup`        |
| `src/hooks/useWhenGame.ts`      | Saves high score to localStorage when Sudden Death game ends                        |

## localStorage

High score is stored with key `when-timeline-high-score` as a simple integer string.

## Visibility

The stats only appear when:

- Game mode is Sudden Death
- Single-player (not multiplayer)
