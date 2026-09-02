# Docs Index

Reference docs for the "When" timeline game. Fifteen files, all maintained as **current** —
if one contradicts the code, the doc is wrong and should be fixed.

These are digests, not a change log. They hold decisions and their rationale, rejected
approaches and why, and the constraints that are expensive to rediscover. They deliberately do
not restate what the code says: for "how does X work", read the source. Git history holds the
original per-session write-ups if you need the blow-by-blow.

## Start here

- [../CLAUDE.md](../CLAUDE.md) — the essentials, loaded every session
- [architecture-reference.md](architecture-reference.md) — components, hooks, utils, API
  routes, z-index

## Before you change certain things

- [cloudinary-cost-controls.md](cloudinary-cost-controls.md) — **read before touching image
  delivery, preloading or the service-worker image cache.** The rung ladder has hard rules that
  exist because breaking them ran the account toward shutdown.
- [gameplay-feel/](gameplay-feel/index.md) — **read before retuning deck composition.** Also
  covers tombstones, streak feedback, and the repo-wide Tailwind opacity-modifier trap.
- [events-images/difficulty-grading-rubric.md](events-images/difficulty-grading-rubric.md) —
  the grading criteria. Grade recognition and inferability; never grade crowding.
- [sharing-challenges/](sharing-challenges/index.md) — **read before touching the challenge-code
  encoding.** It is positional; a careless change misdecodes every link ever issued. Also
  **read before rewording any share**: the message deliberately carries no call to action, and
  the caption deliberately repeats nothing the card already shows.

## By area

- [leaderboard-daily/](leaderboard-daily/index.md) — the local-calendar puzzle day (and why it
  is not UTC), submission validation, bots, display-name filtering
- [stats-achievements/](stats-achievements/index.md) — the store-primitives-derive-everything
  rule, storage keys, milestones, badge design
- [events-images/](events-images/index.md) — event data pipeline, card colours, the 35-char
  name cap, the no-date-clues rule for player-visible text, image preloading, and the 2026-08
  push to full image coverage
- [ui-redesign/](ui-redesign/index.md) — gameplay layout, the five-tab home pager, Custom
  settings, and the service-worker dev-loop trap
- [mobile-ios/](mobile-ios/index.md) — the Capacitor shell loads the live site (so web deploys
  ship instantly), safe-area utilities, daily reminders
- [dev-tooling/](dev-tooling/index.md) — the `vercel dev` `spawn EBADF` root cause and fix, and
  where the 20-category taxonomy came from
- [sports-events/](sports-events/index.md) — the `sports` category (sub-agent research +
  dedup), its image pipeline, and the game-wide duplicate audit
- [dedup/](dedup/index.md) — the game-wide duplicate deletion: how keepers were chosen, why
  removals go to `deprecated.json` rather than being deleted, and the two places outside the
  event files that name an event id and break silently when it disappears
- [card-reports/](card-reports/index.md) — player-reported card problems and the key-gated
  maintainer page
- [curated-themes/](curated-themes/index.md) — hand-authored daily themes: where the calendar
  lives, how to publish one, the date rule that lets you schedule tomorrow, the two
  deck-builder escape hatches thin pools need, and the Archive tab that replays them
- [driving-the-app-with-playwright.md](driving-the-app-with-playwright.md) — playing the app
  end-to-end from a script, including the drag-and-drop recipe
- [events-images/event-editor-tool.md](events-images/event-editor-tool.md) — the standalone
  local event editor

## Keeping these useful

When you finish a piece of work, fold what you learned into the relevant digest rather than
adding a new dated file. The test for inclusion is **"would a future session make a worse
decision without this?"** — a rejected approach and the reason it failed passes; a list of the
files you touched does not, because the diff already says that.
