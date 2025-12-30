# Layout Redesign Summary

## Overview

Redesigned the "When" timeline game layout from a 40/60 horizontal split to a full-width vertical layout with a bottom bar for the active card.

## Before vs After

### Before (Old Layout)

```
+------------------+------------------------+
|     Left 40%     |      Right 60%        |
|  - Title         |      - Timeline       |
|  - PlayerInfo    |        (vertical)     |
|  - ResultBanner  |                       |
|  - spacer        |                       |
|  - ActiveCard    |                       |
+------------------+------------------------+
```

### After (New Layout)

```
+---------------------------------------------+
|  TopBar (icons top-right)                   |
+---------------------------------------------+
| Year |  Card (landscape, wide)              |
| 123 -|================================      |
| 453 -|================================      |
| 2021-|================================      |
|  ^   ^                                      |
|  |   Golden line (20% from left)            |
+---------------------------------------------+
|  [Cards Icon]  |     [Active Card]    [C]   |
|  cards left    |     (wide landscape)       |
+---------------------------------------------+
```

## Key Changes

### Card Dimensions

| Type                 | Mobile    | Desktop   | Aspect |
| -------------------- | --------- | --------- | ------ |
| Portrait (unchanged) | 144x176px | 160x192px | ~9:11  |
| **Landscape (new)**  | 240x80px  | 280x96px  | 3:1    |

### Files Modified

1. **Card.tsx** - Added `landscape` size with horizontal layout (image left 40%, title right 60%)

2. **DraggableCard.tsx** - Added `size` prop passthrough

3. **Timeline.tsx** - Full-width layout, golden line at 20% from left, updated GhostCard

4. **TimelineEvent.tsx** - Landscape cards with 20/80 year/card split

5. **PlayerInfo.tsx** - Added `GameInfoCompact` component with vertically stacked icon and "cards left" text

6. **ActiveCardDisplay.tsx** - Horizontal card stack with cycle button in top-right corner

7. **Game.tsx** - Changed from `flex-row` to `flex-col`, timeline takes `flex-1`, bottom bar (120-140px) contains game info + active cards

8. **useDragAndDrop.ts** - Updated drop zone ID from `hand-zone` to `bottom-bar-zone`

## Bottom Bar Layout

- **Left side**: Game info compact (player name if multiplayer, hand icon with count, "cards left" text)
- **Right side**: Active card with horizontal fan stack, cycle button in top-right corner
- **Height**: 120px mobile, 140px desktop
- **Safe area**: `pb-safe` for notched devices

## Design Decisions

- Timeline line positioned at 20% from left edge
- Cards are fixed-width (not stretched) aligned to the golden line
- Horizontal card stack fans to the right with slight rotation
- Cycle button repositioned to top-right of active card area
- Simplified game info shows only essential information (card count)
- Removed PlayerInfo list and ResultBanner from gameplay view
