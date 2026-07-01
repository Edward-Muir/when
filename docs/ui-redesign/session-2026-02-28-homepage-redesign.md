# Homepage Redesign: Daily-First Layout with Inline Leaderboard

**Date:** 2026-02-28

## Overview

Redesigned the homepage (`ModeSelect.tsx`) through three iterations, arriving at a clean NYT Games-inspired card layout. The core changes prioritize the Daily Challenge as the hero CTA, surface leaderboard data directly on the homepage, simplify the Custom Game section, and move the player count selector into Settings. Late-session refinements added one-liner subtitles for context and reordered/restyled the Settings modal.

## Motivation

Designer feedback identified several UX issues:

- Daily Challenge (the viral mechanic) was buried below the Custom Game section
- Player count selector (1-6) on the homepage created decision paralysis (Hick's Law)
- No explanation of what the game is — zero value proposition visible
- Leaderboard data hidden behind a button instead of being shown as social proof
- "Play" vs "Play Daily" distinction was unclear

## Design Iterations

### V1: Initial Restructure (too cluttered)

- Daily Challenge moved to top as hero with gold tint background (`bg-accent/10`)
- Icon circles (Calendar, Gamepad2), teal tint on Custom Game section
- Mini-leaderboard in its own bordered card inside the Daily section
- Result: Three levels of nested borders, `text-xs` throughout, too many fonts competing

### V2: Stripped Down (too bare)

- Removed outer card container, all borders, icon circles, subtitles
- Custom Game reduced to two ghost-style inline buttons (no card)
- Settings became icon-only (gear with no label)
- Result: Too empty, Custom Game section lost and disconnected, looked ugly

### V3: NYT Games-Inspired (final)

- Two clean sibling cards with neutral backgrounds (`bg-surface rounded-2xl border border-border p-5`)
- No colored tints — accent color reserved for CTA buttons and theme name only
- Full-width buttons, generous padding, restrained typography
- Settings button restored with full text label
- One-liner subtitles re-added for context (see below)

## Files Modified

| File                                   | Change                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ModeSelect.tsx`        | Three-iteration redesign — final state is NYT-inspired card layout with inline heading ("Daily Challenge: {theme}"), one-liner subtitles, full-width buttons, restored Settings label |
| `src/components/SettingsPopup.tsx`     | Added `onPlayerCountChange` prop, player count selector moved below Starting Cards, recolored to gold (`bg-accent`) to match other settings                                           |
| `src/components/Leaderboard.tsx`       | Removed local `getMedalEmoji`, now imports from shared utility                                                                                                                        |
| `src/components/LeaderboardSubmit.tsx` | Removed local `getMedalEmoji`, now imports from shared utility                                                                                                                        |
| `src/utils/leaderboardUtils.ts`        | **New file** — shared `getMedalEmoji` utility extracted from duplicated code                                                                                                          |

## Current ModeSelect.tsx Layout (final)

1. **Title**: "When?" (`text-4xl font-display`) + "The Timeline Game" (`text-sm font-body`) with `mb-8` spacing
2. **Daily Challenge card** (`bg-surface rounded-2xl border border-border p-5`):
   - "Daily Challenge: {theme}" inline heading (`text-lg font-semibold`, theme in `text-accent`)
   - Subtitle: "Same puzzle for everyone, every day" (`text-sm text-text-muted`)
   - Full-width gold CTA button (`py-3 px-4 rounded-xl`) — "Play Daily Challenge" or "Challenge a Friend" (share)
   - MiniLeaderboard below a neutral divider (`border-t border-border`)
3. **Custom Game card** (same card shell as Daily):
   - "Custom Game" heading (`text-lg font-semibold`)
   - Subtitle: "Choose eras, categories & multiplayer" (`text-sm text-text-muted`)
   - Full-width teal Play button (`bg-accent-secondary`)
   - Full-width outlined Settings button with text label and gear icon

### MiniLeaderboard Component

- Inline component inside `ModeSelect.tsx`
- Shows top 3 entries with plain rank numbers, display names, and accent-colored scores
- Separated by a neutral `border-t border-border` divider (not its own bordered card)
- Entire area is tappable — opens the full Leaderboard modal
- All text at `text-sm` minimum (no `text-xs`)

### SettingsPopup Layout (top to bottom)

1. "Game Settings" title + close button
2. Classic Mode toggle (hourglass icon, bg-accent/10 card)
3. Starting Cards slider (sudden death) or Starting Hand Size slider (classic)
4. Players selector (1-6 buttons, gold `bg-accent` when selected)
5. Player Names inputs (conditional, only for 2+ players)
6. Filter Controls (Difficulty, Category, Era)
7. Deck card counter + Done button

## Decisions Made

- **No colored card tints**: Removed `bg-accent/10` and `bg-accent-secondary/10` — accent color only on buttons and theme name (NYT-inspired restraint)
- **Neutral borders over colored borders**: `border-border` everywhere, not `border-accent/20`
- **Inline heading for Daily**: "Daily Challenge: {theme}" on one line — theme in accent gold
- **One-liner subtitles re-added**: "Same puzzle for everyone, every day" and "Choose eras, categories & multiplayer" — provides context for new/organic visitors without cluttering
- **No icon circles**: Removed Calendar and Gamepad2 icon circles — cleaner without them
- **Full Settings button**: Icon-only gear was too hidden; restored full-width button with "Settings" text
- **Players selector moved below Starting Cards**: More logical flow — game mode first, then hand size, then player count
- **Players selector recolored to gold**: Was teal (`bg-accent-secondary`), now gold (`bg-accent`) to match other settings elements (toggle, difficulty buttons)
- **Typography system**: `text-lg` headings, `text-base` CTA buttons, `text-sm` secondary text. No `text-xs`, no `font-mono` on homepage. Only `font-display` on the title.
- **Generous padding**: Cards use `p-5` (20px), buttons use `py-3 px-4` with `rounded-xl`
- **No medals in mini-leaderboard**: Plain rank numbers used instead of medal emojis
- **State ownership unchanged**: `playerCount` state stays in ModeSelect; SettingsPopup gets a callback prop only

## Architecture Notes

- `getMedalEmoji` is now in `src/utils/leaderboardUtils.ts` — used by `Leaderboard.tsx` and `LeaderboardSubmit.tsx`
- `MiniLeaderboard` consumes the same `useLeaderboard` hook data already fetched on mount — no additional API calls
- The `LeaderboardEntry` type is imported from `src/hooks/useLeaderboard.ts`
- Icons reduced to: `Settings`, `Play`, `Share2`, `Check`, `Trophy` (removed `Calendar`, `Gamepad2`)

## Verification

- TypeScript (`npm run typecheck`) passes
- ESLint (`npm run lint`) passes
- Visual testing with `vercel dev` recommended on mobile viewport (375px)
- Check both light and dark modes
