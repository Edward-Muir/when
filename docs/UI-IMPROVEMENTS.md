# UI Improvements - Wordle-Inspired Minimalism

Tracking UI simplification work to reduce visual clutter and match Wordle's minimal design aesthetic.

---

## Completed

### Phase 1: Top Bar Simplification ✓

**Goal:** Reduce header icons from 5 to 3

**Before:**

```
When?                    [+] [↗] [i] [☀] [🏠]
```

**After:**

```
When?                           [☀] [🏠] [☰]
```

**Changes made:**

- Created `src/components/Menu.tsx` - Slide-in drawer with Framer Motion
- Refactored `src/components/TopBar.tsx` - Simplified to 3 icons
- Moved Share, Install, and How to Play into hamburger menu
- Added swipe-to-dismiss gesture support

### Phase 4: General Polish ✓

**Goal:** Overall consistency and reduced visual noise

**Changes made:**

Typography consolidation (strict 14px minimum):

- Updated Tailwind config font sizes (`ui-label`, `ui-caption`, `ui-card-title`) to 14px
- Replaced all `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` with `text-sm`
- Applied across Card, TimelineEvent, PlayerInfo, GameOverControls, ResultBanner, Menu, ModeSelect

Shadow simplification:

- Standardized on `shadow-sm` throughout (replacing `shadow-md`, `shadow-lg`, `shadow-xl`)
- Reduced dark mode shadow intensity in `tailwind.config.js`

Spacing consistency:

- Changed `p-5` to `p-4` in ModeSelect and Menu modals for 8-point grid alignment

**Files modified:**

- `tailwind.config.js` - Font sizes and shadow definitions
- `src/components/Card.tsx`
- `src/components/Timeline/TimelineEvent.tsx`
- `src/components/PlayerInfo.tsx`
- `src/components/GameOverControls.tsx`
- `src/components/ResultBanner.tsx`
- `src/components/Menu.tsx`
- `src/components/ModeSelect.tsx`

---

## Planned

### Phase 2: Monochrome Timeline

**Goal:** Reduce category color prominence on timeline cards

**Current state:**

- Cards use category-specific colors (conflict=red, cultural=purple, etc.)
- Multiple visual elements competing for attention

**Proposed changes:**

- Remove category colors from timeline card borders/backgrounds
- Use neutral borders and shadows instead
- Keep category color only in expanded card view (on tap)
- Consider subtle category indicator (small dot or icon)

**Files to modify:**

- `src/components/Timeline/TimelineEvent.tsx`
- `src/components/Card.tsx`
- Possibly `tailwind.config.js` for new neutral card styles

---

### Phase 3: Mode Select Cleanup

**Goal:** Simplify the home screen layout

**Current state:**

- Multiple nested sections with different background colors
- Play section (blue tint) and Daily section (gold tint)
- Dense player selector with 6 buttons

**Proposed changes:**

- Use whitespace instead of background color changes
- Simplify player selector styling (less prominent borders)
- Single accent color throughout
- More breathing room between sections

**Files to modify:**

- `src/components/ModeSelect.tsx`

---

## Design Principles (from game-feel skill)

Reference: `.claude/skills/game-feel/mobile-design.md`

- **Touch targets:** Minimum 44x44px
- **Spacing:** 8-point grid system
- **Typography:** Body text never below 16px
- **Dark mode:** Use #121212 not pure black, #E4E4E4 not pure white
- **Hierarchy:** Single primary CTA per screen
- **Navigation:** Primary actions in thumb zone (bottom/center)
