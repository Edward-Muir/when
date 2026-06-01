# Session — Refresh Daily Leaderboard & Theme on Day Rollover / App Resume

**Date:** 2026-06-01
**Branch:** main (working tree)
**Plan file:** `~/.claude/plans/users-emuir-documents-github-vibes-time-validated-truffle.md`
**Companion summary:** `docs/session-2026-06-01-persist-custom-settings.md` (earlier session
the same day, separate task)

## Overview

The user reported that opening the iPhone app the next day shows yesterday's daily
leaderboard and yesterday's daily theme/preview image — i.e. the Daily tab does not refresh
when the WKWebView is resumed after a day rollover. They also asked whether the web app has
the same issue.

Investigation confirmed **both platforms are affected**; the iPhone just exposes it more
obviously because Capacitor's WKWebView preserves React state across background/foreground
(no implicit reload like Safari may do on a backgrounded tab). It's a lifecycle bug, not a
caching bug — the service worker is already network-first for `/api/*`.

Fix: hold "today" as state in `ModeSelect`, refresh it on `appResume` (already dispatched
by `App.tsx` via `@capacitor/app`), `document.visibilitychange`, and a one-shot UTC-midnight
timer, then make the leaderboard fetch and daily theme/preview memos depend on it.

## Files Modified

### `src/components/ModeSelect.tsx`

- Replaced the render-time `const dailySeed = new Date().toISOString().split('T')[0];`
  with a `useState` initialized lazily to today's UTC date string.
- Added one `useEffect` that:
  - Listens for `'appResume'` on `window` (dispatched by `src/App.tsx:48-64` via
    `@capacitor/app`'s native `resume` event — pre-existing wiring, no Capacitor changes
    needed).
  - Listens for `document.visibilitychange` (web tab refocus / iOS Safari tab restore;
    only refreshes when `!document.hidden`).
  - Schedules a one-shot `setTimeout` to fire `+1s` after the next UTC midnight as a
    safety net for users who stay foregrounded across the rollover.
  - All three call a single `refresh()` that recomputes today and `setToday(curr => curr
=== next ? curr : next)` — functional setter form so no spurious re-renders when the
    date hasn't actually changed.
- Changed the leaderboard prefetch effect:
  - Was: `useEffect(() => { fetchLeaderboard(new Date()…); }, [fetchLeaderboard]);`
  - Now: `useEffect(() => { fetchLeaderboard(today); }, [fetchLeaderboard, today]);`
- Keyed the daily theme + preview memos on `today`:
  - `dailyTheme   = useMemo(() => getDailyTheme(today),               [today]);`
  - `previewEvent = useMemo(() => getDailyPreviewEvent(allEvents, today), [allEvents, today]);`
- `getTodayResult()` is still called once per render (unchanged) and naturally re-evaluates
  on the re-render triggered by `setToday`, so the Daily CTA flips from "Challenge a Friend"
  back to "Play Daily Challenge" automatically.

### `src/utils/dailyConfig.ts`

- `getDailyPreviewEvent` now takes an optional second argument:
  ```ts
  getDailyPreviewEvent(
    allEvents: HistoricalEvent[],
    dateString: string = new Date().toISOString().split('T')[0]
  ): HistoricalEvent | null
  ```
- Default keeps existing callers (`buildDailyConfig` flow / any future call sites) working
  unchanged. ModeSelect's call now passes `today` explicitly, which both forces correct
  recomputation on rollover and silences the `react-hooks/exhaustive-deps` lint warning
  that was hiding the dependency behind an internal `new Date()`.

## Key Decisions

- **Lifecycle, not caching.** Diagnosed early: `public/service-worker.js:71-80` is
  network-first for `/api/*` and `/events/*`, so the SW is not preventing fresh data — the
  component just never asks. Avoided touching the SW.
- **State in `ModeSelect`, not a shared hook.** Only this one component cares about the
  date rolling over (mid-game daily completion still uses `state.lastConfig.dailySeed`
  captured at game start, intentionally). A reusable `useToday()` can be extracted later
  if a second consumer appears.
- **Three triggers, not one.** `appResume` covers Capacitor; `visibilitychange` covers
  web/Safari tab focus; the midnight `setTimeout` covers users who stay foregrounded
  across 00:00 UTC. Each is cheap and complementary; the functional setter dedupes
  no-op transitions.
- **UTC dates throughout.** Matches the existing daily-seed convention
  (`new Date().toISOString().split('T')[0]` is used everywhere — `dailyConfig.ts`,
  `playerStorage.ts`'s `getTodayDateString`, leaderboard URL). Local-time rollover would
  desync players across timezones.
- **Make the lint-warning fix improve the API, not silence it.** Adding an explicit
  `dateString` parameter to `getDailyPreviewEvent` is genuinely better than an
  `eslint-disable` comment: it makes the dependency visible and is a backwards-compatible
  signature change (default arg).
- **Mid-game rollover left as-is.** If a user is playing the Daily when midnight passes,
  they finish on that deck. Only the pre-game Daily tab refreshes. Out of scope.

## Verification

- `npm run typecheck` and `npm run lint` — both clean.
- Manual end-to-end checks still to be run by the user:
  1. **Web — `visibilitychange`**: open Daily tab, advance system clock past 00:00 UTC,
     switch to another tab and back. Theme name, preview event, and "Today's Longest"
     should all update without a refresh.
  2. **Web — midnight timer**: open Daily tab and leave it foregrounded across a clock
     rollover. Same data should refresh automatically within ~1 second of midnight.
  3. **iPhone — Capacitor resume**: open the Daily tab, background overnight (or shift
     device clock past UTC midnight while backgrounded), foreground. All three areas
     should update.
  4. **Daily CTA flip**: complete today's daily, see "Challenge a Friend". Trigger a date
     rollover via any of the above. CTA should flip back to "Play Daily Challenge".

## Diagnosis Highlights (worth keeping)

The investigation traced every place that touches "today" to confirm the fix is complete:

- `src/App.tsx:48-64` — `@capacitor/app` `resume` and `pause` listeners are already
  installed and dispatch `'appResume'` / `'appPause'` window events. **Reused as-is.**
- `src/hooks/useVersionCheck.ts:40-61` — already shows the canonical pattern of listening
  to `'appResume'` + `visibilitychange` (used to restart version polling). The new effect
  in ModeSelect mirrors it.
- `src/hooks/useLeaderboard.ts` — already accepts a date param and is pure on each call.
  No changes needed.
- `src/utils/dailyTheme.ts` — pure, seeded by string. No changes.
- `src/utils/dailyConfig.ts`'s `buildDailyConfig` — recomputes `new Date()` each call;
  invoked only when the user actually taps "Play Daily Challenge", so it's never stale.
  No changes.
- `src/utils/playerStorage.ts`'s `getTodayResult` / `getTodayDateString` — already
  recompute on each call. No changes.
- `public/service-worker.js` — `/api/*` and `/events/*` are network-first; SW caching
  was ruled out as a cause.

## Next Steps / What the user needs to do

- Build + deploy to web for the web behaviour, and `npm run cap:sync` + Xcode build for
  the iOS app to pick up the fix in the WKWebView's loaded site. (Capacitor app loads the
  remote URL `https://play-when.com`, so the iOS app picks up the fix automatically once
  the deploy is live — no native rebuild strictly required, per the memory note
  `capacitor-loads-remote-url`.)
- Optional manual smoke: shift system clock to ~23:58 UTC, open the app, watch for the
  midnight-timer refresh.

## Context for Future Sessions

- **The `today` state pattern is local to `ModeSelect.tsx`.** If another component
  (e.g. a future "yesterday's puzzle" panel, a streak header, a leaderboard route) needs
  to react to date rollovers, lift this into `src/hooks/useToday.ts` — the three triggers
  (`appResume`, `visibilitychange`, midnight `setTimeout`) and the functional-setter
  dedupe are the patterns to preserve.
- **`getDailyPreviewEvent(events, dateString?)` is now date-parameterizable.** Prefer
  passing an explicit date when calling from a memoized context — it keeps the lint
  rule honest and the dependency visible.
- **The `'appResume'` window event is the canonical "app resumed on native"
  signal**. Listeners: `useVersionCheck` and (now) `ModeSelect`. Any future feature that
  needs a refresh on foreground should subscribe here; `App.tsx` already bridges the
  Capacitor event into the window event for non-native code to consume.
- **Mid-game daily rollover behaviour is intentionally untouched.** `useWhenGame.ts`'s
  `useSaveDailyResult` uses `state.lastConfig.dailySeed` (captured at game start), so a
  game finishes against the date it began under. Don't conflate these.
- **The Custom-page persistence work from earlier today** is in a separate summary
  (`docs/session-2026-06-01-persist-custom-settings.md`) and is functionally independent;
  the only file both sessions touched is `ModeSelect.tsx`, but in different regions.
