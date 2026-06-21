# Session Summary — Achievement Cards (Visual Design, Session 1)

**Date:** 2026-06-21
**Branch:** `feature/people`
**Scope:** Build the _look_ of Wingspan-style achievement cards + a preview harness to iterate on. Real unlock logic / stats tracking / in-app page are explicitly **out of scope** (later sessions).

---

## Overview

Created a data-driven achievement-card component and a standalone preview page (`/cards-preview`)
so we can dial in the visual design before wiring up the real achievements feature described in
`docs/stats-achievements-plan.md`.

Key decisions locked in with the user:

- **Use raw Cloudinary event art** in a plain circle (Wingspan style). **No custom/AI medal
  generation** — the CSV's `gemini_prompt` column is ignored.
- **Tiers subtly drive visuals** via a metallic `conic-gradient` ring (pure CSS, no new art).
  Bronze → silver → gold → platinum → iridescent **diamond** (which slowly shimmers), plus
  steel/copper/obsidian/verdigris. Premium tiers (gold/platinum/diamond/obsidian) get a soft glow.
- Cards show **only**: circular framed art → serif title → "how to unlock" criterion line.
  (Earlier iterations had an arced unlock date and a tier text chip — both **removed** per feedback.)
- **Locked state:** drained/dormant art (`grayscale` + reduced brightness/contrast + slight
  transparency + dark veil) behind a **frosted lock chip** (dark disc, white ring, soft shadow,
  centered lock icon). Still shows the criterion. You get a faint glimpse of the art (the "tease").

---

## Files Created

| File                                 | Purpose                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/achievements.ts`           | **Auto-generated** typed config (`ACHIEVEMENTS: AchievementDef[]`, plus `AchievementTier` / `AchievementFamily` types) derived from the CSV. Each entry: `id, name, family, tier, unlockCriteria, eventName, imageUrl`. Image URL embedded directly so the preview is self-contained (no async event load). **36 badges.** |
| `src/data/achievementTiers.ts`       | `TIER_STYLES` map (per-tier `conic-gradient` ring + optional `glow`/`shimmer` + label/labelColor) and `LOCKED_RING` (muted neutral ring). This is the file to tweak when iterating on tier looks.                                                                                                                          |
| `src/components/AchievementCard.tsx` | The card component. Props: `{ achievement, unlocked }`. Layers: metallic ring (own layer so diamond can `animate-tier-spin` without rotating the art) → circular `object-cover` art via `getImageUrl(url, 'detail')` → locked veil + lock chip.                                                                            |
| `src/pages/CardsPreview.tsx`         | Dev-only harness. Mode toggles (Mixed / All unlocked / All locked), light/dark toggle (`useTheme`), "Completed" + "Locked" sections, responsive grid (2 → 5 cols), gradient backdrop to judge the frosted glass. **Not linked from game UI.**                                                                              |

## Files Modified

| File                                 | Change                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.tsx`                      | Registered `<Route path="/cards-preview" element={<CardsPreview />} />` and its import.                                                                    |
| `src/index.css`                      | Added `@keyframes tierSpin` + `.animate-tier-spin` (14s linear) for the diamond ring shimmer.                                                              |
| `when-achievement-badge-prompts.csv` | Renamed badges, quantified one criterion, added 3 rows, swapped one image (details below). **Source of truth** — `achievements.ts` is regenerated from it. |

---

## CSV / Naming Changes (kept in sync with `achievements.ts`)

**Renames** (the bad/numbered families; no more I/II/III):

- Placer I/II/III → **Bricklayer / Stonemason / Master Builder** (building theme; matches wall/pyramid art)
- Chronologist I–V → **Good Timing / Clockwork / Well-Oiled / Horologist / Time Lord** (clock-art ladder)
- Hard Mode → **Peak Performance** (Everest); Habit → **Daily Grind**; Eternal → **Time Immemorial**;
  Loyal → **Old Faithful**

**Quantified:** Old Faithful "Play on many distinct days" → **"Play on 50 distinct days"** (placeholder number, easy to change).

**New "Difficulty" family** (ring escalates with prestige) — Peak Performance regrouped into it (Collection → Difficulty), plus 3 new badges:
| Name | Criterion | Tier | Event art |
|---|---|---|---|
| Warm-Up | Place 80 easy events | Bronze | `hot-air-balloon` (pun: hot air) |
| Hitting Your Stride | Place 40 medium events | Silver | `domestication-horses` |
| Uphill Battle | Place 20 hard events | Gold | `hannibal-crosses-alps` |
| Peak Performance | Place 10 very-hard events | Obsidian | `everest` (existing) |

**Image swap:** Dedicated (#03) Statue of Liberty → **Angkor Wat** (`angkor-wat-temple`). The statue's head cropped badly in the circle; Angkor Wat is symmetrical/centered and fills the frame cleanly. Chosen after center-crop-previewing 6 candidates.

---

## Regeneration Workflow (important for future edits)

`src/data/achievements.ts` is **auto-generated from the CSV**. To change names/criteria/images,
edit `when-achievement-badge-prompts.csv` then re-run the generator (a Python script using `csv` +
the `tier_map` lowercasing, `—` → `'none'`). The generator emits the union types, the
`AchievementDef` interface, and the `ACHIEVEMENTS` array. Hand-editing `achievements.ts` directly
works too but will be overwritten on the next regen.

`achievementTiers.ts` is **hand-authored** (not generated) — safe to edit freely.

---

## Verification Done

- `npm run typecheck` ✅ and `npm run lint` ✅ after each change.
- Rendered via Puppeteer (system Chrome at `/Applications/Google Chrome.app/...`, `headless: 'shell'`,
  `userDataDir: /tmp/pptr-when-profile`) against the running dev server on **port 3000** (a dev
  server was already running for the whole session — not started by us). Confirmed: light/dark
  themes, 2-col mobile width, unlocked/locked states, tier rings escalate, all 36 cards, the new
  difficulty ladder, Angkor Wat crop, and the new lock chip. No console/page errors.

---

## Current Card Look (final state this session)

- **Shell:** `rounded-2xl border border-border bg-surface/60 backdrop-blur-md shadow-sm`, centered.
- **Badge:** `w-28 h-28`, ring as `inset-0` layer, art `inset-[5px]` (5px ring band), `rounded-full`.
- **Unlocked:** full-colour art + tier ring (+ glow/shimmer for premium).
- **Locked:** art `grayscale brightness-[0.62] contrast-[0.82] opacity-85`, dark veil
  (`from-black/25 via-black/35 to-black/50`), lock chip (`w-11 h-11` disc, `bg-black/35`,
  `ring-1 ring-white/30`, lock `18px`), `LOCKED_RING`.
- **Text:** `font-display` bold title (muted when locked) + `font-body text-xs` criterion (always shown).

---

## Unfinished / Next Steps

1. **Remaining naming passes** (offered, not yet done): the **Category Buff: X** family (the word
   "Buff" is gamey — could become per-category puns like Warmonger / Wordsmith / Diplomat) and the
   **streak ladder** (On a Roll / Momentum / Rampage / Juggernaut / Unstoppable).
2. **Confirm the "50 distinct days"** number for Old Faithful.
3. **Optional visual knobs:** ring thickness (`inset-[5px]`), circle size (`w-28 h-28`), push locked
   desaturation further (full black-out), lock chip size.
4. **Then (later sessions, per `docs/stats-achievements-plan.md`):** `src/utils/statsStorage.ts`,
   `recordGameResult(state)` hook, per-badge `test(stats)` unlock logic, the real in-app
   Achievements page + TopBar/nav entry point, and the museum/collection view (restyled
   `ViewTimeline`). The `eventName` field on each `AchievementDef` is retained for wiring this.

---

## Pointers / Reuse

- `src/utils/cloudinaryImage.ts` → `getImageUrl(url, 'detail')` for the circular image source.
- `src/hooks/useTheme.ts` → light/dark class on `documentElement` (used by the preview).
- Styling tokens: `bg-surface`, `border-border`, `text-text`, `text-text-muted`, `font-display`,
  `font-body` (defined in `src/index.css` / `tailwind.config.js`, `darkMode: 'class'`).
- Plan file for this work: `~/.claude/plans/users-emuir-documents-github-vibes-time-linked-fern.md`.
- Feature spec: `docs/stats-achievements-plan.md`.
