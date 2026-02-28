# Homepage Redesign: Daily-First Layout with Inline Leaderboard

**Date:** 2026-02-28

## Overview

Redesigned the homepage (`ModeSelect.tsx`) based on designer feedback applying Nielsen's visibility heuristic. The core changes prioritize the Daily Challenge as the hero CTA, surface leaderboard data directly on the homepage, simplify the Custom Game section, and move the player count selector into Settings.

## Motivation

Designer feedback identified several UX issues:

- Daily Challenge (the viral mechanic) was buried below the Custom Game section
- Player count selector (1-6) on the homepage created decision paralysis (Hick's Law)
- No explanation of what the game is — zero value proposition visible
- Leaderboard data hidden behind a button instead of being shown as social proof
- "Play" vs "Play Daily" distinction was unclear

## Files Modified

| File                                   | Change                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ModeSelect.tsx`        | Full layout restructure — Daily Challenge moved to top as hero, tagline added, inline mini-leaderboard component, Custom Game simplified, player count selector removed from main view |
| `src/components/SettingsPopup.tsx`     | Added `onPlayerCountChange` prop and player count selector (1-6 buttons) at top of settings modal                                                                                      |
| `src/components/Leaderboard.tsx`       | Removed local `getMedalEmoji`, now imports from shared utility                                                                                                                         |
| `src/components/LeaderboardSubmit.tsx` | Removed local `getMedalEmoji`, now imports from shared utility                                                                                                                         |
| `src/utils/leaderboardUtils.ts`        | **New file** — shared `getMedalEmoji` utility extracted from duplicated code                                                                                                           |

## Key Changes

### ModeSelect.tsx Layout (top to bottom)

1. **Title + tagline**: "When? The Timeline Game" with "Place events in order to build the longest timeline"
2. **Daily Challenge section** (gold/accent, hero): Calendar icon, daily theme, Play Daily Challenge button (larger CTA), inline mini-leaderboard
3. **Custom Game section** (teal/accent-secondary): Gamepad icon, "Choose your own settings" subtitle, Play button, Settings button below

### MiniLeaderboard Component

- Local component inside `ModeSelect.tsx`
- Shows top 3 entries with plain rank numbers (1, 2, 3), display names, and scores
- Rendered inside its own bordered rectangle with "Leaderboard" title header
- Entire component is tappable — opens the full Leaderboard modal
- No "View Leaderboard" link or player count text

### SettingsPopup Changes

- Player count selector (1-6 buttons) added at the top of the modal
- Existing player names section still conditionally renders for 2+ players
- New `onPlayerCountChange` prop receives the `handlePlayerCountChange` callback from ModeSelect (handles both count + hand size adjustment)

## Decisions Made

- **No medals in mini-leaderboard**: User requested removal of medal emojis; plain rank numbers used instead
- **Settings below Play**: In Custom Game section, Play button comes first, Settings below — reduces friction for returning players
- **Tagline removed from latest iteration**: User's linter/edit removed the tagline line, keeping just title + subtitle
- **Leaderboard in own rectangle**: Mini-leaderboard has its own bordered container to make it clearly tappable, rather than being inline with the daily section
- **State ownership unchanged**: `playerCount` state stays in ModeSelect; SettingsPopup gets a callback prop only

## Architecture Notes

- `getMedalEmoji` is now in `src/utils/leaderboardUtils.ts` — used by `Leaderboard.tsx` and `LeaderboardSubmit.tsx` (no longer used by ModeSelect after medal removal)
- `MiniLeaderboard` consumes the same `useLeaderboard` hook data that was already being fetched on mount — no additional API calls
- The `LeaderboardEntry` type is imported from `src/hooks/useLeaderboard.ts`

## Verification

- TypeScript (`npm run typecheck`) passes
- ESLint (`npm run lint`) passes
- Visual testing with `vercel dev` recommended on mobile viewport (375px)
