# Session Summary — Sports Category via Sub-Agent Research + Game-Wide Duplicate Sweep

**Date:** 2026-07-12
**Branch:** `claude/sports-events-sub-agents-derqro`

## Overview

Added a brand-new **`sports`** event category, populated it to **374 events** (2600 BCE → 2023) using a sub-agent research pipeline, and then ran a **game-wide duplicate audit** over all ~5,600 events. Work landed across several commits on the branch above and was merged into `dev`.

Three things were built:

1. **A real `sports` category** wired through the code (not just a data file).
2. **A repeatable sub-agent research + dedup method** — fan out research agents, merge, deduplicate against each other and the existing corpus, curate.
3. **A whole-corpus duplicate sweep** that surfaced ~489 pre-existing duplicate clusters in the game's own content (left for a follow-up "keep which?" jig).

## The `sports` category

- `category` is a fixed 20-value union in `src/types/index.ts`; the manifest filenames are just storage buckets (each event's own `category` field is authoritative — see `eventLoader.ts:46-48`). There was **no** sports category — existing sports content sat in `games-sport.json` tagged `media`/`warfare`/etc.
- Added `'sports'` (appended to the `Category` union and `ALL_CATEGORIES` — appending is required so challenge-code bitmask indices stay stable, `challengeCode.ts:19-21`).
- Touch points: `src/types/index.ts`, `src/components/CategoryIcon.tsx` (`Trophy` icon — the `Record<Category,…>` is compile-enforced), `public/events/manifest.json` (+`sports.json`), `src/utils/eventNameLength.test.ts` (EVENT_FILES allowlist), `src/data/achievements.ts` (a `cat-sports` badge + bumped the "all 20 categories" strings to 21). Everything else (filter UI, daily theme, display name, achievement test logic) derives from `ALL_CATEGORIES` automatically.
- **Re-tagged** the 50 genuine sports already inside `games-sport.json` (Olympics, World Cup, Wimbledon, …) to `category: "sports"`. These keep their Cloudinary images, so the category is **playable immediately** (50 events); the researched additions are image-less and stay hidden until the image follow-up (`eventLoader.ts:60` filters to Cloudinary-backed events).

## Final composition (374)

| | |
| --- | --- |
| Source | 324 researched (`sports.json`) + 50 re-tagged (`games-sport.json`) |
| Span | 2600 BCE → 2023 |
| Difficulty | easy 35 · medium 197 · hard 131 · very-hard 11 |

**Era spread:** Ancient 26 · Medieval 21 · Early Modern 20 · Industrial 95 · World Wars 48 · Cold War 115 · Modern 49. Modern (1992+) was deliberately kept small to avoid a contemporary skew.

## The research method (what worked, in order)

Implemented as `Workflow` scripts (deterministic fan-out/dedup orchestration):

1. **Seed exclusion list** — read all ~5,300 existing events; isolate the genuine-sports subset already present so agents don't re-research them.
2. **Research fan-out** — schema-forced agents (structured output, web-verified years) each return `{name, friendly_name(≤35), year, description(80-150), difficulty, sport, notability}`.
3. **Dedup** — deterministic (title + description Jaccard) against the corpus and intra-batch, then a **per-era LLM semantic pass**.
4. **Curate** — era-balanced selection with a modern cap.

Waves run this session: an initial ~200, a historical top-up, and a **deep by-sport expansion** toward 400. After dedup attrition the category settled at 374 (we stopped there rather than pad past the "until they get too obscure" quality bar).

## Key lessons

- **Reworded duplicates are the hard problem.** Two entries for the same event with different wording (e.g. "Naismith Invents Basketball" vs "Basketball Invented", "First F1 World Championship" vs "First Formula One Championship") share almost no title tokens, so **similarity thresholds miss them**. Deterministic Jaccard is fine for catching obvious repeats but cannot be trusted alone. The reliable fix is an **LLM semantic dedup pass** (chunked, returning *names to keep* so nothing is rewritten/hallucinated).
- **Seed data needs descriptions.** An early expansion passed the exclusion list without descriptions, so description-based dedup against existing events was dead and the workflow's own dedup removed only 12 of 344. Always give the dedup stage full text of what already exists.
- **Agent-count vs overlap (design tradeoff).** A 45-agent wave that mixed *three* partition axes (by-sport × by-milestone-type × by-region) produced heavy cross-agent overlap — the same event surfaced by multiple agents. Re-running with **19 agents on a single clean axis** (by-sport/era, every event belongs to exactly one bucket) cut the self-overlap. *But* a by-sport partition then re-derives each sport's canonical milestones (FA 1863, FIFA 1904…), which are mostly already in the set — so it traded intra-wave overlap for overlap-with-existing. Net: **partitioning helps, but robust dedup matters more than agent count.**
- **A final same-event sweep is worth it.** Even after per-wave dedup, a windowed LLM sweep (events sorted by year, overlapping windows, "keep-which" per cluster) caught a handful of survivors each time. Same-event dupes are always close in year, so **year-ordered windows** are an efficient way to find them without O(n²) LLM calls.
- **Safe keep-rule for deletions.** When removing dupes, prefer the **image-backed (playable)** copy, **never delete both**, and **never auto-delete when multiple copies are playable** — surface those for human review. This kept the game-wide sweep from damaging curated content.

## Game-wide duplicate audit (follow-up material)

Ran a 6-slice sweep over all **5,621** events (100-event overlapping batches, ~72 judge-agents). Result: **492 duplicate clusters covering 1,063 events** (429 pairs, 51 three-way, 9 four-way, 2 five-way — Galileo's telescope & Kepler's laws — and 1 six-way — the windmill).

- Only **3** originated from this session's sports work (Nika Riots, First Modern Olympics, NASCAR founding — each duplicating an existing cultural/conflict entry). **Those 3 were removed.**
- The other **489 are pre-existing** duplication in the game's own content, the largest being the `earth-life.json` ↔ `exploration.json` overlap (both redundantly cover prehistory: cyanobacteria, Cambrian, first fish/mammals, domestication, writing…).
- **Not auto-deleted** — deduping all of them would drop ~570 events (>10% of the game) and the groupings include false positives that need a human call (`seed-drill` ≠ `agricultural-revolution`, `watt-separate-condenser` ≠ `steam-engine`, `code-hammurabi` ≠ `building-code`).

Full audit committed at **[`duplicate-clusters-review.csv`](duplicate-clusters-review.csv)** — columns: `cluster, size, year, title, category_file, has_image, name`. Sort by `cluster` to see each group together; `has_image = NO` marks events currently hidden from play. Intended to feed a follow-up "choose which duplicate to keep" jig.

## Follow-ups (not done this session)

- **Images for the 324 researched sports events** — run the existing pipeline (`scripts/generate_images.py` → Cloudinary → `extract_event_colors.py` / `fetch-image-dimensions.js` → `update-cloudinary-urls.js`; needs Cloudinary + image-gen keys). Until then they sit in `sports.json` unplayed.
- **Resolve the 489 duplicate clusters** via the review CSV + a keep-which jig.
- Optionally push the sports set to ~400 with one more clean by-sport wave (steep dedup attrition remains).

## Verification (end of session)

`npm run typecheck` clean · 39 tests pass (`eventNameLength`, `achievementLogic`, `challengeCode`) · production build compiles · 0 exact-name duplicates within `sports` · same-event LLM sweep applied.
