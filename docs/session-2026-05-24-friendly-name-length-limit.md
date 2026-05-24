# Session: Cap event `friendly_name` length to fit cards

**Date:** 2026-05-24

## Overview

A previous bulk import (`docs/session-2026-04-12-bulk-event-import.md`) added ~1,749 events,
many with verbose, descriptive `friendly_name`s that overflowed the event card and got
truncated with an ellipsis (e.g. "Camel Trade Networks Transform African Commerce"). This
session:

1. Determined the maximum title length that fits an event card without truncation.
2. Renamed all 639 over-limit events to pithy titles matching the original terse style.
3. Added a permanent guardrail (constant + test + docs) so future titles stay within the limit.

## Key decisions

- **Limit = 35 characters.** The tightest display is the **portrait card**
  (`src/components/Card.tsx:128-131`): a `line-clamp-2` overlay ~128–144px wide at 14px
  (`text-ui-card-title`). It fits ~35 chars across two lines before the ellipsis. The
  landscape/timeline card uses `line-clamp-3` (~60 chars) and is not the binding constraint.
  (User chose 35 over the alternatives of 40 / 30.)
- **Only `friendly_name` changes** — never the `name` slug (used for IDs, dedup, leaderboards)
  or any other field. Confirmed via diff: 0 non-`friendly_name` lines changed.
- **Parallel-safe rename pipeline.** Subagents never edited the JSON directly (to avoid
  corrupting shared files); they produced `slug → new_name` mapping files, and a single
  deterministic apply script wrote the changes.
- **User added a guardrail** (test + docs), not just a one-time fix.

## Process

1. **Prep** (`scripts/shorten-names-prep.js`): collected all events with `friendly_name` > 35
   chars into 11 chunked input files under `untracked_data/name-shortening/input-NN.json`
   (kept chunks within a single category; ~80 per chunk).
   - Per-category counts: conflict 59, cultural 173, diplomatic 186, exploration 146,
     infrastructure 74, disasters 1 = **639 total**.
2. **Rename**: spawned 11 parallel `general-purpose` subagents, each reading one input file and
   writing `output-NN.json` (`{ slug: new_title }`). Rules: ≤35 chars, Title Case, no trailing
   period, 2–6 words, keep the core subject, stay accurate to year/description, stay distinct
   from siblings.
3. **Apply** (`scripts/shorten-names-apply.js`): merged all output maps (639), validated all
   ≤35 chars, applied to the 6 category files writing back with `JSON.stringify(data, null, 2)
   - "\n"` (matches repo format exactly). Result: 639 applied, 0 unmatched, 0 still over limit.
4. **Collision fix**: the parallel renames created 10 cases where a shortened title exactly
   matched a sibling event. Re-disambiguated those 10 (accurate to each one's year/description),
   e.g. Aquinas 1265 "Aquinas Writes Summa Theologica" (began) vs 1274 "Aquinas Completes Summa"
   (completed); Charlemagne "Charlemagne Crowned by Pope" vs sibling; Maxwell "Maxwell Unifies
   Electromagnetism" vs "Maxwell's Equations".

## Files modified

| File                                 | Change                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `public/events/conflict.json`        | 59 `friendly_name`s shortened                                             |
| `public/events/cultural.json`        | 173 shortened                                                             |
| `public/events/diplomatic.json`      | 186 shortened                                                             |
| `public/events/disasters.json`       | 1 shortened (MH370)                                                       |
| `public/events/exploration.json`     | 146 shortened                                                             |
| `public/events/infrastructure.json`  | 74 shortened                                                              |
| `src/utils/eventNameLength.ts`       | **New.** Exports `MAX_FRIENDLY_NAME_LENGTH = 35` (single source of truth) |
| `src/utils/eventNameLength.test.ts`  | **New.** Per-category Jest test; fails listing any event over the limit   |
| `.claude/skills/add-events/SKILL.md` | Added the 35-char hard limit to the `friendly_name` conventions           |
| `CLAUDE.md`                          | One-line note on the cap under the events section                         |
| `scripts/shorten-names-prep.js`      | **New.** One-off prep script                                              |
| `scripts/shorten-names-apply.js`     | **New.** One-off apply script                                             |

Transient work files live in `untracked_data/name-shortening/` (input/output maps; untracked).

## Verification (all passed)

- `npm test` on `eventNameLength.test.ts` — 6/6 pass.
- `npm run typecheck` — clean.
- `npm run lint` — clean (security warning on the test's `fs.readFileSync` suppressed with an
  inline `eslint-disable-next-line` comment, since `category` comes from a fixed allowlist).
- **0 events over 35 chars** across all 4,242 events.
- Diff confirms only `friendly_name` lines changed.
- `npm run find-duplicates` reviewed — confirmed the 10 self-introduced exact collisions were
  fixed.

## Unfinished work / next steps

- **38 pre-existing exact-duplicate `friendly_name` groups remain** (e.g. two near-identical
  Charlemagne/Archimedes/Maxwell events from the bulk import). These predate this session and
  are genuine semantic duplicate _events_, not a naming problem — a future dedup pass should
  decide which to merge/deprecate. The April 12 import doc also flagged semantic duplicates.
- **Open question for the user:** whether to keep `scripts/shorten-names-{prep,apply}.js` for
  future runs or delete them (they're one-off).
- The new test reads JSON via `fs` from `public/events/` using a fixed category allowlist; if a
  7th category is ever added, update the `CATEGORIES` array in both the test and the scripts.
