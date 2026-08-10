# Session Summary — Bounding the Intro Animation's Image Pool

**Date:** 2026-08-10
**Branch:** `claude/daily-cached-loading-images-jswjvh`
**Status:** ✅ Complete — typecheck, lint, and all tests pass.

## Overview

Follow-on to the [Cloudinary Bandwidth Audit](session-2026-08-10-cloudinary-bandwidth-audit.md)
earlier the same day. That session fixed **bandwidth** (per-session cost fell ~7×, projecting
~0.41 GB/30 days against a 25 GB allowance). It did not fix **transformations**, and in one
respect made them more urgent: changing every transform string invalidated every
previously-minted derived asset, so the whole catalogue was queued to re-mint from scratch.

The remaining driver was the game-start intro animation (`GameStartTransition`, the 3-second
scrolling timeline). It picked **20 events uniformly at random from all 5,291** on every entry
to `modeSelect` — once per game, again on every Play Again, and on the `/daily` and
`/challenge/:code` auto-start routes, which both pass through `modeSelect` — then eagerly
warmed all 20 thumbnails via `useImagePrefetch`.

Transformations bill **once per derived asset created** (×3 formats on this account), so a
purely decorative screen had a ceiling of the entire catalogue and a burn rate that grew
linearly with traffic. At only ~20 home-screen entries/day site-wide that is ~385 distinct
images/day → **~1,150 transformations/day ≈ 35 credits/month**, over the whole 25-credit
allowance on transformations alone. It matches the audit's observed 930/day and is the
mechanism behind its "organic reach into a 5,291-image catalogue" attribution.

## The fix: lock the pool, not the set

The obvious move is to lock the intro selection to the day so everyone sees the same cards.
That is right in spirit but wrong in detail, for two reasons:

- **It doesn't help across players.** Cloudinary bills bytes delivered from its CDN to each
  device, so a second player pays full freight whether or not a first player "warmed" the
  image. Cross-player sharing saves transformations, never bandwidth. (Per-device caching
  does save bandwidth: `max-age=2592000` plus the SW `when-images` cache.)
- **A once-a-day player saves nothing**, because they get 20 brand-new images every day — and
  they'd watch a byte-identical intro on every replay.

So the bound is on the **pool**, not the draw:

- `INTRO_POOL_SIZE = 3 × INTRO_EVENT_COUNT = 60` images, seeded per Monday-aligned week.
- Each game draws a **disjoint** 20 from that week's pool, walked by a monotonic
  `introRotation` counter bumped when the intro finishes.

Cost becomes `POOL_SIZE × rungs × formats` per rotation — **~783 transformations/month, flat
and independent of traffic**, versus ~35,000/month unbounded. A returning daily player's
intro bandwidth drops from ~15 MB/month to ~6.5 MB/month, and freshness is preserved: three
repeat-free intros per day, new art each Monday.

Measured basis: the `thumbnail` rung averages **24.9 KB** over a 30-image spread sample of the
catalogue, so one intro roll ≈ 0.50 MB — essentially the entire 0.47 MB of a post-audit
home-screen visit, and ~54% of the 0.93 MB `/daily` session.

## Changes

| File                                  | Change                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/utils/introEvents.ts`            | `INTRO_POOL_SIZE`, `pickIntroPool(events, weekKey)`, options-object `pickIntroEvents`. Week-seeded pool → day-seeded ordering → rotation window → year sort. |
| `src/utils/dailyConfig.ts`            | Extracted `buildDailyDeck(allEvents, dateString)` from `getDailyPreviewEvent`, which now returns `[0]` of it.                                                |
| `src/App.tsx`                         | `useState` + effect → frozen `introDate`, `introRotation`, and two `useMemo`s.                                                                               |
| `src/hooks/useImagePrefetch.ts`       | Warm the intro during `gameOver` as well as `modeSelect`.                                                                                                    |
| `src/utils/introEvents.test.ts`       | New. 10 tests, including the pool-size cost invariant.                                                                                                       |
| `src/utils/introSpoilerGuard.test.ts` | New. Real-catalogue proof that the intro never shows a card from that day's daily deck.                                                                      |

Notes on the non-obvious ones:

**Seeded shuffle.** Reuses `shuffleArraySeeded` from `gameLogic.ts` under namespaced seeds
(`intro-pool-<week>`, `intro-day-<date>`) kept distinct from the bare `YYYY-MM-DD` that
`buildDailyConfig`/`getDailyTheme` use, so intro ordering is never correlated with the daily
deck's. This also fixes a latent bug: the old selection used
`sort(() => Math.random() - 0.5)`, the biased comparator shuffle, not a real one.

Determinism across devices depends on `allEvents` having a stable order. It does —
`loadAllEvents` uses `Promise.all(files.map(...))` (input-ordered) with an order-stable dedup
and filter — and the daily deck already relies on the same property.

**Week key.** A monotonic Monday-aligned epoch-week integer, not an ISO week number, so there
are no year-boundary or week-numbering edge cases. It is derived from the same date string the
daily ordering uses, so the two can never disagree about which week a day belongs to.

**Only Cloudinary-backed events are eligible.** A handful of catalogue entries are Wikimedia
or image-less; under determinism one of those would sit in the pool showing a `CategoryIcon`
placeholder to everyone for a whole week, and it would break the pool-size cost invariant.

## Two problems determinism creates, and their fixes

**A deterministic spoiler is much worse than a random one.** The intro renders
`friendly_name` + `formatYear(event.year)` — literally the answer. As a random fluke a
collision affects one player once; made deterministic it spoils that day's
_leaderboard-scored_ daily for **everyone**, on every replay.

Measured on the real catalogue over 120 days × 3 rotations: **21 of 120 days collide**, about
**one day in six** — considerably worse than the back-of-envelope `20 × 13 / 5291` suggests,
because the daily deck is drawn from a theme-filtered slice rather than the whole catalogue,
and three rotations a day each get a roll of the dice. Fixed by excluding the first
`DAILY_SPOILER_DEPTH = 15` cards of today's deck (a game reaches at most 13: seed + 5-card
hand + 7 draws). Exclusion happens _after_ the pool is drawn, so replacements come from the
same 60 and the image budget is untouched.

`introSpoilerGuard.test.ts` asserts both halves against the real event JSON: that collisions
_do_ occur unguarded (so the exclusion can't be deleted as dead weight without the test
noticing) and that none survive the guard.

**`restartGame` bypasses `modeSelect`.** It starts the next game straight from `gameOver`.
That path was free while the intro set was held in state across games; once rotation makes the
next intro a different 20, it would render a screenful of unwarmed images with no lead time.
Hence warming on `gameOver` too, using the game-over popup dwell as the lead.

## Do not wire day-rollover into the intro

`ModeSelect` refreshes its `today` on `visibilitychange` / `appResume` / a timer to UTC
midnight, and the Daily tab needs that. **The intro must not copy it.** `introDate` is
deliberately frozen for the App's lifetime:

- A rollover firing during `transitioning` swaps the cards mid-scroll (`GameStartTransition`
  keys on `event.name`) and fires 20 cold requests.
- One firing on an idle home screen eagerly fetches a new set for a game that may never start.
- On iOS the Capacitor WKWebView keeps React state alive for days, so this would recur.

Carrying yesterday's intro into a session that crossed midnight is the cheaper outcome and is
invisible — those images are already cached, and nothing labels the intro with a date.

## Side effect: the service worker cache stops being poisoned

`public/service-worker.js` trims `when-images` in **insertion order**, not LRU, capped at 400.
Every game start used to insert 20 entries drawn uniformly from 5,291 that would essentially
never be hit again, evicting 20 older entries that likely would have been. A fixed weekly pool
converts that into ~60 stable, repeatedly-hit entries (15% of the cache) and ~0 new inserts
per day after the first game or two.

## Known-unfixed: ~5 intro rows are never seen

Scroll travel is `20 × 88 × 0.66 = 1161.6px` over `SCROLL_DURATION = 6s`, cut off by
`TOTAL_DURATION = 3000ms`, so only indices ≤ 14 ever enter the viewport — yet all 20 are
eagerly warmed, and `loading="lazy"` doesn't save them (row 19 sits inside Chrome's ~1250px
lazy threshold). Deliberately left alone: it is entangled with two pre-existing bugs — scroll
distance is derived from `events.length`, so cutting the count also slows the scroll and
re-hides the tail, and `EVENT_HEIGHT = 88` is mobile-only while `TimelineEvent` is
`sm:h-[96px]`, under-computing distance by ~18% on desktop. With the pool bounded, those rows
now cost **zero** marginal transformations and ~0.12 MB on a visitor's first day of the week.
Fix the scroll maths separately.

## Verification

Beyond `lint` / `typecheck` / tests, the load-bearing assertion is in
`src/utils/introEvents.test.ts`: the union of every day × every rotation within one week is
`≤ INTRO_POOL_SIZE`. That is the cost invariant, in executable form. The checked-in expected
name list is equally important — it pins the seeded-shuffle output, so a future change to
`shuffleArraySeeded` or `stringToSeed` surfaces as a test failure rather than as a silent
re-mint of the whole catalogue.

Also driven end-to-end against the running dev server with Playwright, stubbing every
`res.cloudinary.com` hit with a 1×1 PNG and recording the URLs (aborting instead trips the
`<img>` `onError` path and unmounts the image, so nothing is observable). Home screen → start
a game → quit home → observe the next warm:

```
rotation 0 size                : 20   (expect 20)
rotation 1 size                : 20   (expect 20)
overlap between rotations      : 0    (expect 0)
union size                     : 40   (expect 40, <= 60)
outside the predicted 60-pool  : 0    (expect 0)
```

The pool was computed independently in Node straight from `public/events/*.json` and the week
seed, so this checks the running app against the intended selection, not against itself.

One thing that looks alarming and isn't: during the transition the DOM holds ~59 `w_400`
images. Those are the achievements panel's badge art — `ModeSelect`'s pager pre-mounts all
five panels at idle. They are `loading="lazy"` and off-screen, so they are never requested;
actual gameplay warms during a full game were 22 thumbnails.

After deploy, `npm run cloudinary:usage` should show transformations/day collapse toward a
flat ~26/day average and stop tracking traffic.
