# Session 2026-08-16 — a stale copy of the category list, and the dead end behind it

Started from a screenshot: 17 events placed, "Legendary!", and **"Failed to submit. Try again
later."** under the button. Ended with the server no longer knowing what a category is, and a
second route to submitting for anyone the first one failed. The durable decisions are folded
into [index.md](index.md); this is what was tried, what the evidence changed, and the traps.

## The bug was a comment that could not do its job

`api/leaderboard/submit.ts` carried its own `ALL_CATEGORIES`, its own mulberry32, and its own
`getDailyTheme`, each under a comment saying it "must match the frontend". `cfaafa0` appended
`sports` to `src/types/index.ts` the previous evening and the server's copy stayed at 20.

Since the theme is `ALL_CATEGORIES[floor(random() * ALL_CATEGORIES.length)]`, the length is not
incidental — it is the modulus. 21 entries and 20 entries pick **different categories from the
same seed**:

| date       | client (21) | server (20) |          |
| ---------- | ----------- | ----------- | -------- |
| 2026-08-16 | Medicine    | Art         | 400      |
| 2026-08-17 | Trade       | Science     | 400      |
| 2026-08-18 | Everything  | Everything  | accepted |
| 2026-08-20 | Architecture| Architecture| accepted |

Running both implementations over the following year: **85 of 365 dates (23%) rejected every
submission from every player.** The rest split into ~49% "Everything" days, where both lists
agree whatever their length, and category days that happened to land on the same index. That
distribution is why it reads as flaky rather than broken, and why it survived a release.

Confirming it took one throwaway script that ran the two `getDailyTheme` implementations side by
side over a date range. Worth reaching for early: it turned "the submit is failing" into an exact
cause and a blast radius in one step, before a line of the app was read.

## Deleting the check beat syncing the lists

First instinct was to import the client's `dailyTheme.ts` into the API — the dependency chain
(`dailyTheme -> gameLogic + eras -> types`) is pure logic with no React or DOM imports, so it
would have worked, and `api/tsconfig.json` being a separate project is not the obstacle the
`handSize.ts` comment implies (`include` sets roots; imported files still compile).

The better question was why the server was computing a theme at all. It compared a value **the
client supplied** about a puzzle **the client generated** against its own copy of the client's
logic. It could not detect a forged score — a cheat sends a consistent theme — only a client
that disagrees with the server. Its entire realised effect over its lifetime was to break honest
players. Deleted, along with ~100 lines of duplicated RNG. The client stopped sending `theme`;
old cached clients still send it and the field is ignored.

What actually guards the board and stays: the ±1 day window, `greenCount == correctCount`,
`green + red == totalAttempts`, `red <= DAILY_HAND_SIZE`, and the per-device dedupe key.

**Rule of thumb this leaves behind:** when two copies of a value must agree, deleting one is
worth more than a comment or a parity test. Where a copy genuinely must exist (`DAILY_HAND_SIZE`,
`SUBMISSION_DEDUPE_TTL_SECONDS`), keep something that *fails* on drift rather than something that
*asks* for care.

## The second bug: nothing could retry

The submit form lives only in the game-over popup, built from `buildDailyResult(state)` — live
in-memory state. Dismiss the popup and `pendingPopup` is cleared; reload and `hasPlayedToday()`
blocks a replay; the home board is read-only; the Menu has no leaderboard entry. Meanwhile the
score sits intact in `when-daily-result`, the dedupe key was never written (the submission was
rejected, so nothing persisted), and the ±1 day window would still accept it.

So the fix to the theme check only helped players still holding the popup open. The recovery
path is the other half of the fix, not a nicety: today's score can be claimed from the home
screen for the rest of the local day. `getTodayResult()` returns `null` once the local date
rolls over, which bounds it with no extra expiry logic.

## Four regressions found by re-reading the hook against its new caller

`useDailyLeaderboard` was written for one caller, and reusing it from the home screen broke
assumptions that were invisible from the call site. All four were caught by reading, before
running anything — worth the pass:

1. **Both effects start `if (!date) return`, keyed off the result.** The home screen shows the
   board to everyone, including players who have not played today. Keying the fetch off the
   result would have left them looking at a permanently empty board. Hence `boardDate`.
2. **The hook polls every 15s.** Correct for a screen you are watching for your placing; on an
   idle home screen it is a request every 15 seconds all day, per user, against the function and
   Upstash. Hence `poll: false` — the modal still polls while open.
3. **It returned neither `truncated`, `loadError` nor any refetch**, all of which `ModeSelect`
   passes to the board modal. `refresh` has to take a date, because `useToday` hands the new one
   to its callback at rollover.
4. **`submitted` is false while the first fetch is in flight**, so gating the CTA on it alone
   flashes "Submit Your Score" at players already on the board. Gate on
   `!isLoading && !loadError` — and specifically **not** on `unavailable`, which folds in
   `submitError` and would retract the button the instant a submission failed, i.e. exactly when
   it is needed.

## Traps worth keeping

**The modal's height cap will eat a footer.** The card is `max-h-[min(75vh,520px)]` with
`overflow-hidden`, and the list carries `min-h-[min(320px,30vh)]`. Header (~48) + count bar
(~36) + 320 + a ~120px form is over the cap, and what falls off the bottom is the submit button.
The list's min-height now relaxes while the form is mounted. Checked in a real browser
(button bottom 667px against a card bottom of 680px) — a unit test cannot see this.

**Do not memoize `todayResult` in `ModeSelect`.** It is re-read every render on purpose:
`updateDailyResultWithLeaderboard` writes the placing into that record after the board resolves,
and `handleShareDaily` reads `leaderboardRank` straight off it. Memoizing on `today` looks
correct and silently strips the rank from every shared result.

**`useToday` and the board hook need each other.** `useToday(onTick)` refetches the board on
every resume; the board hook needs `today` to know which board to read. Broken with a ref
assigned during render — safe because `useToday` only ever calls `onTick` from an event
listener.

**Fake timers do not flush the fetch.** `fetchLeaderboard` awaits the device fingerprint first,
so the request goes out on a microtask. A poll test that counts `fetch` calls immediately after
`advanceTimersByTime` compares 0 to 0 and passes no matter what the hook does. Flush with
`await act(async () => { await Promise.resolve(); })` and assert the mount call landed *before*
advancing, or the negative test is worthless — as the first draft of it was.

## Verification that mattered

The unit tests confirmed the hook; they could not confirm the wiring. Driving the real app with
Playwright against a stubbed `/api/leaderboard/**` (the dev server has no Upstash env) is what
proved: the board still renders when the daily is unplayed, the CTA flips and reverts, the POST
body carries the stored grid and no `theme`, the form is replaced by the player's row, and the
state survives a reload. Recipe in
[../driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md).

Still unverified: the iOS keyboard against the form inside the centred fixed card. Headless
Chromium reports `env(safe-area-inset-*)` as 0 and cannot see that class of failure — the same
blind spot behind the modal-under-the-status-bar fix in `4021286`.
