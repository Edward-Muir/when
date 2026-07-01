# When Game - Code Simplification Findings

Analysis performed December 2024. Goal: identify dead code and unnecessary complexity.

---

## Part 1: Unused Files to Delete (~600 lines)

| File                                    | Lines | Why Unused                                                                              |
| --------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| `src/hooks/useElasticScroll.ts`         | 296   | Complex scroll physics hook never imported. Timeline uses native CSS `overflow-y-auto`. |
| `src/components/Header.tsx`             | 129   | Never imported. Header UI is already in Game.tsx.                                       |
| `src/components/TurnBanner.tsx`         | 83    | Never imported. Has multiplayer props for features that don't exist.                    |
| `src/components/GameOver.tsx`           | 75    | Never imported. Game over UI is handled in Game.tsx.                                    |
| `src/components/Timeline/GhostCard.tsx` | 17    | Never imported. Ghost card is implemented inline in Timeline.tsx.                       |

---

## Part 2: Unused Functions to Remove

| Location                   | Function                        | Lines   |
| -------------------------- | ------------------------------- | ------- |
| `src/utils/eras.ts`        | `getEraDefinition()`            | 22-24   |
| `src/hooks/useWhenGame.ts` | `clearLastResult`               | 158-160 |
| `src/utils/gameLogic.ts`   | `getCategoryBorderColorClass()` | 135-137 |
| `src/components/Game.tsx`  | `console.log('Share clicked')`  | 258     |

---

## Part 3: Unused CSS & Tailwind Config

### Unused CSS classes in `src/index.css`:

- `.long-press-active` (lines 130-134)
- `.drop-zone` and `.drop-zone-expanded` (lines 209-216)
- `.draggable-card` (lines 218-225)

### Unused animations in `tailwind.config.js`:

- `animate-card-hover`
- `animate-pulse-glow`
- `animate-slide-in`
- `animate-fade-out`
- `animate-flip`
- `animate-slide-to-position`

### Unused box-shadows in `tailwind.config.js`:

- `shadow-sketch`, `shadow-sketch-lg`
- `shadow-card-rest`, `shadow-card-hover`, `shadow-card-dragging`, `shadow-card-placed`

---

## Part 4: Duplicate Code to Consolidate

### Category color functions duplicated in two files:

**Card.tsx** (lines 14-36) and **TimelineEvent.tsx** (lines 13-35) both define:

- `getCategoryBorderColor()`
- `getCategoryTitleBg()`

These are identical. Move to `src/utils/gameLogic.ts` and import in both components.

---

## Summary

| Action                     | Lines Removed  |
| -------------------------- | -------------- |
| Delete 5 unused files      | ~600           |
| Remove unused exports      | ~10            |
| Remove unused CSS/Tailwind | ~40            |
| Consolidate duplicates     | ~25            |
| **Total**                  | **~675 lines** |

---

## What NOT to Change

These were considered but rejected as adding complexity without benefit:

- **Breaking up Game.tsx** - 305 lines but cohesive; splitting would scatter related logic
- **Adding Redux/Context** - Overkill for this app size
- **Extracting animation timing constants** - Adds a new file for minimal gain
- **Refactoring ModeSelect state** - Works fine, abstraction not worth it

---

## Files Summary

### Delete:

```
src/hooks/useElasticScroll.ts
src/components/GameOver.tsx
src/components/TurnBanner.tsx
src/components/Header.tsx
src/components/Timeline/GhostCard.tsx
```

### Modify:

```
src/utils/eras.ts
src/utils/gameLogic.ts
src/hooks/useWhenGame.ts
src/components/Game.tsx
src/components/Card.tsx
src/components/Timeline/TimelineEvent.tsx
src/index.css
tailwind.config.js
```
