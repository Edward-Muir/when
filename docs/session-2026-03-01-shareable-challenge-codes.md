# Session Summary: Shareable Challenge Codes

**Date**: 2026-03-01

## Overview

Added shareable seeded custom games using 3-word challenge codes (e.g., `adeem-jamb-ramose`). Every custom game now generates a deterministic seed, and players can share a link like `play-when.com/challenge/adeem-jamb-ramose` so others play the exact same game (same cards, same order). Inspired by Rimworld's seed-sharing system.

## How It Works

### Encoding (33 bits packed into 3 words)

All game settings + a random seed are packed into 33 bits, then split into 3 x 11-bit indices that map to words from three 2048-word lists:

| Bits  | Field        | Range                     |
| ----- | ------------ | ------------------------- |
| 0     | Game mode    | 0=suddenDeath, 1=freeplay |
| 1-3   | Hand size    | 1-8 (stored as value-1)   |
| 4-6   | Player count | 1-6 (stored as value-1)   |
| 7-10  | Difficulties | 4-bit bitmask             |
| 11-16 | Categories   | 6-bit bitmask             |
| 17-24 | Eras         | 8-bit bitmask             |
| 25-32 | Random seed  | 0-255                     |

### Flow

1. **Creating**: User starts custom game -> `ModeSelect.handlePlayStart()` generates random 8-bit seed, encodes all settings into 3-word code, attaches as `challengeSeed` and `challengeCode` on `GameConfig`
2. **Playing**: `useWhenGame.startGame()` detects `challengeSeed` and uses `shuffleArraySeeded()` (existing Mulberry32 PRNG) for deterministic deck ordering
3. **Sharing**: At game over, share button generates URL with `/challenge/{code}`. Button label changes from "Share" to "Challenge"
4. **Receiving**: `/challenge/:code` route decodes the 3-word code back to settings, auto-starts the game via `App.autoStartChallenge` prop

## Files Created

### `src/utils/wordlists.ts`

Three arrays of exactly 2048 English words each, sourced from the system dictionary (`/usr/share/dict/words`), partitioned alphabetically (a-h, i-q, r-z). Order is immutable -- changing it breaks existing codes. ~19KB bundle impact.

### `src/utils/challengeCode.ts`

Core encode/decode module:

- `ChallengeConfig` interface (mode, handSize, playerCount, difficulties, categories, eras, seed)
- `encodeChallengeCode()` - packs config into 33 bits, maps to 3 word indices
- `decodeChallengeCode()` - reverse lookup via Maps, unpacks bits, validates
- `generateChallengeSeed()` - returns random 0-255
- `challengeConfigToGameConfig()` - converts decoded config to `GameConfig` for `startGame()`
- Uses regular number arithmetic (not BigInt) due to ES target < ES2020

### `src/routes/ChallengeRoute.tsx`

Route handler for `/challenge/:code`. Mirrors `DailyRoute.tsx` pattern -- decodes the code, redirects home if invalid, renders `<App autoStartChallenge={config} />` if valid.

## Files Modified

### `src/types/index.ts`

- Added `challengeSeed?: string` and `challengeCode?: string` to `GameConfig` interface

### `src/hooks/useWhenGame.ts`

- Extended shuffle logic in `startGame()`: if `config.challengeSeed` exists, uses `shuffleArraySeeded()` instead of `shuffleArray()`

### `src/components/ModeSelect.tsx`

- `handlePlayStart()` now generates a challenge code via `encodeChallengeCode()` and attaches `challengeSeed` + `challengeCode` to the game config

### `src/utils/share.ts`

- Added `CHALLENGE_URL` constant
- `generateShareText()` now appends `/challenge/{code}` URL for custom games with a challenge code (instead of generic home URL)

### `src/components/GameOverControls.tsx`

- Share button label shows "Challenge" when `state.lastConfig?.challengeCode` exists (not just for daily mode)

### `src/components/GamePopup.tsx`

- Added challenge code display in `GameOverContent` (between stats and leaderboard sections) -- shows code in monospace accent color

### `src/App.tsx`

- Added `autoStartChallenge` and `challengeCode` props
- Added `useEffect` for auto-starting challenge games (mirrors daily auto-start pattern)
- Imports `ChallengeConfig` and `challengeConfigToGameConfig` from challengeCode utils

### `src/index.tsx`

- Added `ChallengeRoute` import and `/challenge/:code` route

### `vercel.json`

- Added rewrite rule: `{ "source": "/challenge/:code", "destination": "/index.html" }`

## Key Decisions

- **3 words, not 4**: User preferred shorter codes. 2048-word lists (11 bits each) x 3 = 33 bits. This gives 8 bits for random seed (256 unique games per settings combo) -- modest but sufficient.
- **Preserve player count**: Shared challenges include the original player count (not forced single-player). Recipients can play multiplayer if they have friends around.
- **Restart = new seed**: Restart button generates a fresh random seed with the same settings, not a replay of the exact same game.
- **Regular arithmetic, not BigInt**: The TypeScript target is < ES2020, so BigInt literals aren't available. Used multiplication/division instead (safe since 33 bits << 53-bit JS safe integer limit).
- **System dictionary for wordlists**: Sourced from `/usr/share/dict/words` to get real English words. Partitioned alphabetically into 3 non-overlapping groups of 2048.
- **UI-only rename already done**: "Sudden Death" was renamed to "Marathon" in user-facing text in a prior session. Internal variable names (`isSuddenDeath`, etc.) remain unchanged.

## Verification

- TypeScript typecheck passes cleanly
- Production build succeeds (+19KB bundle from wordlists)
- Encode/decode round-trip verified for multiple configs (sudden death, freeplay, various filter combos)
- Invalid codes correctly return null (redirect to home)
- Same code deterministically produces same output

## Potential Future Work

- Event set changes could cause a challenge code to produce a different game if events are added/removed from JSON files (same as daily mode behavior)
- Could add a "Copy Code" button on game over for manual sharing
- Could persist challenge history in localStorage
- Could add a visual indicator when playing a challenge (e.g., "Challenge Mode" header)
- Word quality could be improved by curating the lists to prefer more common/recognizable words
