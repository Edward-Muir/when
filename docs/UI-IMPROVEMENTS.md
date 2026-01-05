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

### Phase 4: General Polish

**Goal:** Overall consistency and reduced visual noise

**Typography consolidation:**

- Reduce custom font sizes (currently 7+ sizes including 9px, 10px, 11px)
- Establish 3-4 size scale: body (16px), small (14px), title (24px), display (32px)
- Remove tiny text sizes that hurt readability

**Shadow reduction:**

- Simplify shadow system (currently `shadow-md`, `shadow-xl`, custom dark shadows)
- Consider removing shadows entirely for flatter look
- Use subtle borders instead where needed

**Spacing consistency:**

- Audit padding/margins for 8-point grid alignment
- Standardize component spacing

**Files to modify:**

- `tailwind.config.js`
- Various components for typography/shadow updates

---

## Design Principles (from game-feel skill)

Reference: `.claude/skills/game-feel/mobile-design.md`

- **Touch targets:** Minimum 44x44px
- **Spacing:** 8-point grid system
- **Typography:** Body text never below 16px
- **Dark mode:** Use #121212 not pure black, #E4E4E4 not pure white
- **Hierarchy:** Single primary CTA per screen
- **Navigation:** Primary actions in thumb zone (bottom/center)
