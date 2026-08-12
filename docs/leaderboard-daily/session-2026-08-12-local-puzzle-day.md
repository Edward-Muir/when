# Session 2026-08-12 — key the puzzle day on the player's local date

## The bug

Every "puzzle day" boundary was UTC, derived from `new Date().toISOString().split('T')[0]`.
The new puzzle appeared at 5pm in Los Angeles, 8pm in New York and 10am in Sydney.

Two concrete failures:

- **Double increment.** An LA player who played at 4pm and again at 6pm was, in UTC, playing
  two different days — two puzzles two hours apart, and `dayDiff` returned 1, so their daily
  streak incremented twice in one evening.
- **Silent loss.** A player whose habit was "after dinner" drifted across the boundary and
  lost a streak on a day they hadn't missed.

## This reverses a deliberate earlier decision

`session-2026-06-01-daily-rollover-refresh.md:79-82` chose UTC on purpose: _"UTC dates
throughout … Local-time rollover would desync players across timezones."_

That concern is real and we accepted it rather than avoided it. A given
`leaderboard:YYYY-MM-DD` now fills over **~50 wall-clock hours** instead of 24 — it opens
when UTC+14 starts that date and closes when UTC-12 finishes it. A Sydney player finishing at
9am and an LA player finishing the same puzzle 19 hours later share a board, so a rank shown
early in a player's local day is provisional and will drift as the rest of the world plays.

We took that trade because a daily habit belongs to the person, not to Greenwich, and because
the streak bugs above were actively punishing players for playing. **Do not "fix" this back
to UTC without re-reading this section.**

Also deliberately **not** done: any migration of existing localStorage. Stored `playedDates`,
`lastDailyDate` and `when-daily-result.date` hold UTC dates, so on upgrade east-of-UTC players
skipped a day (one broken streak) and west-of-UTC players could be re-offered one puzzle. A
one-day transition artifact was judged cheaper than permanent migration code.

## What changed

**New `src/utils/puzzleDate.ts`** — the single source of truth. `getLocalDateString`,
`msUntilNextLocalMidnight`, and `dayDiff` (moved out of `statsStorage.ts`). Both private
`getTodayDateString()` copies (`playerStorage.ts`, `statsStorage.ts` — the latter's doc
comment already falsely claimed "local") are gone.

`msUntilNextLocalMidnight` is built by local-calendar construction, deliberately not
`DAY_MS - (now % DAY_MS)`: DST days are 23 and 25 hours, so a modulo is wrong twice a year
even after correcting for the offset.

**Seed and UI** — `dailyConfig.ts` (all three entry points), `Game.tsx`, `share.ts`,
`ReminderPreview.tsx`, and `App.tsx`'s frozen `introDate`. That last one matters more than it
looks: `introDate` feeds `buildDailyDeck` to build the intro animation's **spoiler guard**, so
leaving it on UTC would have silently stopped the guard from excluding today's daily deck.

**New `src/hooks/useToday.ts`** — the extraction `session-2026-06-01`'s "Context for Future
Sessions" anticipated, now that `NextDailyCountdown` is a second consumer. Same three triggers
(`appResume`, `visibilitychange`, midnight timer) and functional-setter dedupe, with one bug
fixed in the lift: the midnight `setTimeout` now **re-arms** after firing. It used to be
one-shot, so an app left foregrounded across two nights stopped rolling over — which on iOS,
where the WKWebView keeps React state alive for days, was a live bug.

**Reminders** — `getReminderCopy` previously computed the UTC date at the fire instant _on
purpose_, with a comment explaining that a UTC+10 player's 8am reminder names tomorrow's
theme. That whole compensation deleted itself; the copy now names the puzzle the player is
actually about to be handed.

**Server** — new `api/leaderboard/dateWindow.ts` with `isDateWithinSubmissionWindow`
(`utcToday ± 1`) replacing `submit.ts`'s exact-match check, plus a shared
`SUBMISSION_DEDUPE_TTL_SECONDS` (72h). Both `submit.ts` and `botGeneration.ts` were on a
25-hour TTL commented "for timezone edge cases"; that no longer covers the ~50-hour window, so
the dedupe key would have expired while the date was still submittable. They now share one
constant so they cannot drift apart again. Duplicated rather than imported from `src/` because
`api/tsconfig.json` is a separate project — the same reason `submit.ts` already keeps its own
`getDailyTheme`/`seededRandom`.

**Bots need no redesign.** `ensureBotsExist` is keyed purely on the date string and guarded by
a `SETNX` lock, so whoever fetches a date first mints the set and every other player, in any
timezone, reads back the identical entries. Only the timing shifts (~14h earlier in absolute
terms, when the first UTC+14 player prefetches). Two adjustments: the TTL above, and bot
_creation_ is now gated to the submission window — `[date].ts` still serves any well-formed
date so historical boards stay readable, but previously any client could mint bot sets and
lock keys for arbitrary dates (`9999-12-31`) just by asking. That hole predated this change.

Bot timestamps (`date + 'T00:00:00Z'` plus 0–6h) are now nobody's local morning. Left alone —
`[date].ts` strips `timestamp` from the public entry and ranks by score, so it is invisible.

**`docs/cloudinary-cost-controls.md` needed no change.** The weekly intro pool is unchanged:
the same pools are minted, players just cross into them across a ≤26h smear instead of all at
once, and derived Cloudinary assets are minted once ever. No new images are touched.

## Tests

`package.json`'s `test` script now pins `TZ=America/Los_Angeles`. There was no TZ pinning
before, so the suite was at the mercy of the machine's zone — and on a UTC machine every
local-vs-UTC assertion passes vacuously. This was verified: the new `puzzleDate` suite fails
on UTC and passes under the pin. (`TZ=x cmd` is POSIX syntax; it would break `npm test` on a
Windows cmd shell. Use `cross-env` if that ever matters.)

New: `puzzleDate.test.ts` (local-vs-UTC, DST 23/25-hour days, month/year boundaries),
`dailyConfig.test.ts` (the reported 4pm/6pm scenario end-to-end, via fake timers),
`dateWindow.test.ts` and `botGeneration.test.ts` (both imported from `src/` — CRA's Jest only
roots there, same arrangement as `nameFilter.test.ts`). `dailyReminder.test.ts`'s "themes the
body from the UTC date" case was inverted to assert the local date.

270 tests across 20 suites pass; `lint`, `typecheck` and `typecheck:api` are clean.

## Still to verify manually

Everything below needs a real browser or device — not covered by the suite:

1. Daily tab rolls over at **local** midnight without a reload (theme, preview card,
   countdown, and the CTA flipping back to "Play Daily Challenge").
2. The `useToday` timer re-arms — leave the app foregrounded across two local midnights.
3. Submit window against `vercel dev`: `utcToday ± 1` accepted, `± 2` rejected.
4. Bots: `GET /api/leaderboard/<utcToday+1>` seeds a field; `GET /api/leaderboard/2099-01-01`
   returns an empty board rather than minting one.
5. iOS reminders via `/reminder-preview`, which now prints the local puzzle date per slot.
