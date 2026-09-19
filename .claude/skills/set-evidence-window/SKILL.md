---
name: set-evidence-window
description: Decide whether an event names a period or a moment and set its year + year_end evidence window. Use when reviewing, writing or batch-generating event date ranges, or working with scripts/events/year-range-*.js.
---

# Setting an evidence window

Some cards in the timeline game describe a process, a floruit or a reign that the record does
not pin to a year. Grading those against a single date grades a guess, so they carry an optional
`year_end` and a placement anywhere inside `year`..`year_end` counts as a full success.

Background, in order of usefulness:
[docs/events-images/index.md](../../../docs/events-images/index.md) (the design digest),
[docs/gameplay-feel/index.md](../../../docs/gameplay-feel/index.md) (the placement rule and why
the obvious version of it is unsound), and
[docs/events-images/catalogue-error-backlog.md](../../../docs/events-images/catalogue-error-backlog.md)
(what reading 5,460 records against sources actually turned up).

## The default is no window

**Most events are a moment and must stay a single year.** Around 95% of the catalogue carries no
`year_end` and that is the correct state. A window invented for a card the record does date makes
that card placeable almost anywhere on the board, which is worse for the player than no window at
all — and nothing downstream can catch it. There is no test, no build step and no validator that
can tell a researched span from a plausible-looking one.

A batch that comes back with two or three windows out of forty is a normal, good result.

## `year` is the window's START, not an anchor

Find the two ends from the record **independently**, then write both. Do not take the stored year
as fixed and bolt an end onto it.

This is the mistake the first pass made across the whole catalogue, and it has a measured shape:
when the rule was corrected, **108 of the 130 moved years moved earlier and only 22 later**. A
round stored year usually understates the earliest evidence. Four cards were filed as unfixable
purely because a range could only extend forwards; all four are windows now.

If the window starts before the stored year, move `year` too — see _Moving `year`_ below.

## Four tests

### A. What does _this card_ claim?

The window covers what this card's own `friendly_name` and `description` say happened, not the
broader subject.

- `heavy-plow-adoption` is 1000-1300 because that is the European _breakthrough_. The plough's
  first appearance in the late 8th century belongs to a sibling card.
- A title ending in _Begins_, _Founded_ or _Emerges_ describes a founding, not the polity's whole
  life. Do not stretch _Kingdom of Rwanda Emerges_ across five centuries of Rwanda.
- `andean-llama-domestication` is not about domestication at all — its title, description and
  prose all describe Inca-era herding, which is why its window is 1200-1532.

### B. A moment is a moment

A battle, a treaty signing, a coronation, a launch, a publication, a death, a world record, a
single eruption, a single crash. These are most of the catalogue and they get rejections.

- _"The siege lasted a year"_ is a window. _"The battle was fought"_ is not.
- **Consequences taking decades do not make the event a period.** The FBI was founded on a date;
  its growth is not the card.
- A span noun in the description is evidence about the _setting_, not about the card.
  `battle-kadesh` sits inside a long war and is still one day.

### C. A point with an error bar is not a window

This is the rule the record is most emphatic about. A ratified chronostratigraphic boundary, a
radiometric date with a ±, a calibrated carbon date — these are **one date that science is
uncertain about**, not a span during which the thing was happening. They are among the most
defensible single years in the catalogue.

- `jurassic-period-begins` is stored -201400000 and stays a point.
- Chicxulub, `toba-supereruption` (-74000) and Storegga are near-instantaneous. Points.

> **The tell is rounding.** -201400000 and -1457 are measurements. -1500, 1200 and 800 are
> stand-ins.

The corpus's own exceptions prove the rule rather than softening it:
`lucy-australopithecus-lived` (-3200000..-3170000) and `end-permian-mass-extinction`
(-251941000..-251880000) carry windows because **the event itself had duration** — a life, an
extinction over millennia — not because the date is uncertain.

### D. Uncertainty is not duration

The inverse failure, and the easier one to fall into.

There is deliberately **no cap on width**. `boats` really is -1040000..-50000, and 850,000 years
is the right answer when the uncertainty really is 850,000 years. But a window means _the thing
was happening across this span_.

**If you simply do not know when something happened, that is a rejection**, not a span drawn from
the earliest to the latest date a search turned up. `bullroarer` is the precedent: stored -22000
looks too old, no defensible upper bound was found, and it was left alone rather than given an
invented one.

**Both ends need a source.** If you cannot source an end, reject.

## Rejecting a false positive

The `signals` on a record are a net, not a verdict. Roughly three in four flags do not survive a
check.

| Signal                                     | How much to trust it                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `span-noun-in-name`                        | Strongest, and still wrong often — it will hand you _Star Wars Released_                         |
| `span-noun-in-description`                 | The span noun may describe the setting, not the card                                             |
| `process-noun-in-name` / `-in-description` | Weakest tier. _Siege_, _culture_, _campaign_, _movement_ attach to plenty of single dated events |
| `duration-phrase`                          | A stated duration often belongs to the context, not the card                                     |
| `round-year-pre-1500`                      | Fires on _every_ year ending in zero before 1500. Most are precise dates that happen to be round |
| `deep-time`                                | Usually a real window, but see Test C                                                            |
| `[]` (empty, under `--all`)                | Nothing fired at all. The default answer is no window                                            |

Write `{ "year_end": null, "note": "single engagement, 15 July 1410" }` and move on.
**Do not go looking for a way to justify a span.**

The `note` is mandatory and is one short clause naming _why it is a moment_ — a date, an event
type, a source. It is what stops the next person re-opening the same card. It must not restate
the title.

## Moving `year`

Only when a source puts the window's start somewhere else. **Never** to make a window look
tidier, and **never** to a rounder number.

A `year` move needs a `reason` naming the evidence, because `year` is the sole anchor for
difficulty scoring, deck composition, era filtering and recency: moving one re-scores its
neighbours and shifts daily decks. A `year_end` alone provably cannot. Flag every move clearly in
your report — they land in a separate commit and force a re-measured deck bound.

## The BP/BCE trap

Recorded in the backlog as systemic and deliberately left half-converted. **"42,000 years ago" is
c. -40000, not -42000.** Some cards convert properly; others use "years ago" straight as a BCE
value (`toba-supereruption` is stored -74000).

The offset is ~2,000 years: noise at Palaeolithic scale, real at Holocene scale.

- **Follow whichever convention the card already uses.** Do not half-fix it, and do not silently
  shift a stored year by 2,000 because you spotted the conflation.
- A Holocene-scale case is worth proposing as a `year` move with the conversion spelled out in
  the `reason`. `woolly-mammoth-extinction` was stored -4000 for a Wrangel Island population that
  ended ~4,000 years _ago_, i.e. c. 2000 BCE — a 2,000-year error, now a -3700..-1950 window.

## Entry format

One JSON map, `slug -> entry`. Permitted keys are `year_end`, `year`, `reason`, `note` and
nothing else — anything else aborts the whole batch.

| Outcome            | Entry                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Window             | `{ "year_end": 1591, "note": "Askia Muhammad to the fall at Tondibi" }` |
| Window + year move | `{ "year": 1493, "year_end": 1591, "reason": "...", "note": "..." }`    |
| Year move only     | `{ "year": 629, "year_end": null, "reason": "...", "note": "..." }`     |
| Rejection          | `{ "year_end": null, "note": "single engagement, 15 July 1410" }`       |

Hard constraints, enforced before anything is written: `year_end` is an integer strictly greater
than `year`, never equal (omit the window instead), never in the future. An ongoing process has
no window — reject it.

## Calibration

Read these before deciding anything. They transmit the judgement better than the rules do.

**Windows, and why:**

| Card                  | Stored   | Window           | Why                                                                                           |
| --------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `songhai-scholars`    | 1510     | **1493**-1591    | The scholarly flourishing spans a dynasty; the start moved back to Askia Muhammad's accession |
| `painting-canvas`     | 1300     | **1410**-1600    | Canvas displaced panel gradually; 1300 was a stand-in with nothing behind it                  |
| `heavy-plow-adoption` | 1000     | 1000-1300        | The European breakthrough, not the plough's invention                                         |
| `winnowing-tray-fan`  | -2000    | -2000-9          | A tool tradition, not a dated introduction                                                    |
| `boats`               | -1040000 | -1040000..-50000 | The width is correct. The uncertainty really is that wide                                     |

**Points, and why:**

| Card                     | Stored     | Why it stays a point                                                |
| ------------------------ | ---------- | ------------------------------------------------------------------- |
| `jurassic-period-begins` | -201400000 | A ratified boundary. An unrounded number is a measurement           |
| `battle-megiddo`         | -1457      | One battle, precisely dated                                         |
| `toba-supereruption`     | -74000     | Near-instantaneous, however uncertain the date                      |
| `bullroarer`             | -22000     | The year looks wrong, but no upper bound could be sourced. Leave it |

## Common mistakes

- Filling the `year_end` slot because it is there.
- Extending forward from the stored year instead of finding the window's start.
- A window on a dated measurement (Test C).
- A window on a moment whose consequences took decades (Test B).
- Widening a window because an end could not be sourced (Test D) — reject instead.
- Moving a `year` to a rounder number.
- Half-fixing a BP/BCE card.
- A `note` that restates the title instead of naming evidence.
