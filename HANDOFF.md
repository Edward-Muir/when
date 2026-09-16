# Handoff — event detail

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Branch     | `claude/event-detail-writing-spec-sq448j`                            |
| PR         | none, deliberately                                                   |
| Production | nothing — see **The release option** below, which is a live decision |

**Phases 1 and 2 are done.** Phase 1 built the mechanism and the UI. Phase 2 settled the voice:
`docs/event-detail/writing-spec.md`, `.claude/skills/write-event-detail/SKILL.md`, a real length
band enforced in `scripts/events/detail-spec.js`, and the corpus's **first ten written entries**.

**Phase 3 is the remaining 5,450**, and is what the next session picks up.

**Branch off _this_ branch, never off main** — the feature does not exist on main.

## What exists

A placed card's detail popup shows two paragraphs about the event in place of its short
description — no control, no toggle. Everything between the title and the "Report an issue" row is
one scroll region, image included, at a constant height, so every detail card is the same size.
A ✕ in the header closes it. The description is what shows wherever the prose is unavailable: a
card still in hand (the spoiler gate), an event with no prose written, a shard that would not load,
and the correct/wrong reveals. The Daily hero carries a watermarked (i) on its image that opens the
same popup; its event is the deck's starting card, placed face-up with its year on turn 1, so the
read gives nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`,
sharded to mirror the 19 manifest files; it is never inlined into the event JSON.

**10 of 5,460 events carry real prose, and the placeholder corpus is gone.** `has_detail` stands at
exactly 10, so ten cards show prose and the rest fall back to their short description, which is the
designed behaviour and not a bug. The branch's preview therefore shows no lorem to anyone.
`detail-placeholder.js` can refill it if a future session wants the layout exercised at scale
again; both it and `--revert` preserve written prose.

The design decisions are in **[docs/event-detail/index.md](docs/event-detail/index.md)**. The voice
rules are in **[docs/event-detail/writing-spec.md](docs/event-detail/writing-spec.md)** and, in
working form for someone about to write a batch,
**[.claude/skills/write-event-detail/SKILL.md](.claude/skills/write-event-detail/SKILL.md)**.

## Seeing it in 60 seconds

```bash
npm ci                 # deps are not pre-populated; without this `npm run typecheck`
                       # silently resolves a global tsc and looks like it passed
BROWSER=none npm start
```

Fastest: tap the **(i)** watermarked into the Daily hero image on `/`. Otherwise open `/timeline`
and tap a placed card, or play a game from the Custom tab and tap a card once it is on the
timeline — the prose is what the card opens on.

To see _written_ prose rather than placeholder, the ten calibration slugs are listed at the end of
the writing spec; `battle-megiddo`, `boston-massacre` and `krakatoa-eruption` are the easiest to
reach from a Custom game.

Driving it with Playwright: [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md).
Three things worth knowing here:

- Reach a timeline card by its **title** (`getByRole('button', { name: /<friendly_name>/i })`).
  `[data-timeline-year]` is the year label _beside_ the card; clicking it opens nothing, which
  reads as a broken feature rather than a bad selector.
- The scroll region is `[data-testid="detail-scroll"]`, and the card is `[data-testid="modal-card"]`.
- `executablePath: '/opt/pw-browsers/chromium'` is the whole path — it is a symlink to the binary
  itself, not a browsers directory, so do not append `chrome-linux/chrome` to it. The Playwright
  doc says so; this is a note for whoever skims it. **WebKit can be installed** in a fresh
  container, which that doc does not mention: `PLAYWRIGHT_BROWSERS_PATH=<dir> npx playwright install webkit`,
  then `npx playwright install-deps webkit` (needs root, takes a few minutes). Useful for engine
  differences in general — and useless for the one below: Linux WebKit renders both the broken and
  the fixed version of the scroll region correctly.

## Don't break these

- **The prose must stay unreachable before a card is placed.** The gate is `showsProseFor`:
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **Wherever the prose is unavailable, the description shows** — no prose written, or a shard that
  would not load. A card is never contentless, and that is what lets this ship against a partly
  written corpus.
- **Bulk edits go through `scripts/events/detail-apply.js` from a map file, never by editing a
  shard directly.** Sub-agents write `slug -> {paragraphs}` maps into
  `untracked_data/event-detail/`; one deterministic apply pass validates the whole merged map
  before writing anything, and refuses the run on a single bad entry. Agents editing a shared
  600 KB array corrupt it — this repo has already paid for that lesson once.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** It is
  deliberately not part of `npm test`, which would otherwise be red for the whole writing phase.
  It now reads 10/5460.
- **The prose is researched, not recalled.** Draft, then check with one or two searches, then cut
  what the results do not support. This replaced a rule that said "write only what you would stake
  without a link", which produced a factual error in one of the first ten entries and untraceable
  claims in most. Nothing is stored: no sources, no citations, no enforcement. It is a check, not a
  bibliography.
- **Never pass `wikipedia_url` to a writer, and do not add it to the worklist chunk.** It is a
  byproduct of the difficulty pageview scripts and it is unreliable: `battle-megiddo` is the 1457
  BCE battle and links the 1918 one.
- **The length band is settled and enforced**: exactly 2 paragraphs, 220-450 chars each, 480-830
  total.
  `detail-spec.js` also enforces voice now — no em dashes, no second person, no question marks, no
  puffery lexicon, and no 7-word run shared with the event's own `description`. Do not loosen a ban
  to get a batch through; fix the prose. Each pattern carries its measured precedent count in a
  comment.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
- **`detail-placeholder.js` preserves written prose in both directions** — a plain run and
  `--revert` both leave anything not flagged `placeholder: true` alone. That is new in Phase 2 and
  it matters now that real entries exist: before, `--revert` (which the docs recommend before
  syncing with main) would have deleted them.
- **The detail scroll region carries `overflow` and nothing else.** No mask, no filter, no
  `backdrop-*`, no `transform` — anything that promotes it to its own compositing layer has already
  broken it on iOS while looking perfect on every browser available here. Decoration goes on a
  sibling drawn over it. **Scroll it on a device before believing it.**
- **No `bg-*/NN` opacity modifiers on the CSS-variable colour tokens** — Tailwind drops the whole
  rule and the element gets no colour at all. Use `opacity-60`. (`CLAUDE.md` → Styling.)
- **`CI=true npm run build`**, not a plain build, and run tests through `npm` only (the `TZ` pin).

## Phase 3 — what the next session does

Write the other 5,450, per the plan in
[docs/event-detail/index.md](docs/event-detail/index.md#phase-3--writing-5460-entries). In short:

1. **Read `writing-spec.md` and the ten calibration entries first.** The gold set transmits tone
   better than the rules do; the rules are what catch it when it slips.
2. `node scripts/events/detail-report.js --chunks` for the worklist, smallest shard first
   (`candidates` 53 → `migration` 54 → … → `exploration` 1,040).
3. Use the **`event-detail-writer`** sub-agent (`.claude/agents/event-detail-writer.md`):
   `model: sonnet`, `effort: low`, with the `write-event-detail` skill preloaded so the batch
   prompt does not restate the spec. It writes map files into `untracked_data/event-detail/`; one
   `detail-apply.js` pass writes the catalogue.
4. Per-batch gate: `npm run typecheck`, `CI=true npm test -- --watchAll=false`,
   `CI=true npm run build`.
5. **Read a random 5 per batch cold.** Drift is the failure mode, not corruption. Sample
   specifically for the two things calibration showed converge: every entry landing at three
   paragraphs, and every hook being the same kind.

Two findings from Phase 2's calibration worth carrying in:

- **A three-paragraph allowance produces three-paragraph entries.** The band was first set at 2-3
  paragraphs and 1,250 characters; all ten calibration entries and all four sub-agent entries came
  back at three, near the top. It is now exactly two at roughly two thirds the length. Expect to
  draft three and cut one, and expect that cut to improve the entry.
- **Attribution beats the band.** Hedging a contested figure costs characters a bare number does
  not. When they collide, a paragraph goes and the attribution stays.

## The release option

The description fallback changed what is possible here, and this is the only place it is written
down. **A partly written corpus is now safe to ship**: events with prose show it, events without
read exactly as they did before this feature existed. The "hold everything until all 5,460 are
written" decision from 2026-09-12 is therefore a choice now, not a constraint.

What blocks doing it today is the committed placeholder — 5,450 events still carry `PLACEHOLDER: `
text, so shipping as-is puts lorem in front of most players. Releasing early means first running
`node scripts/events/detail-placeholder.js --revert`, after which only the ten written events carry
`has_detail` and `detail-report.js` stops being a merge gate and becomes a progress meter. Since
Phase 2 that revert is safe for written prose: it drops placeholder entries and their flags only.

The cost, and the reason this is the maintainer's call rather than a step in a plan: reverting the
placeholder makes the branch's preview deploy show prose on ten cards and nothing on the rest,
which is close to the state that made a previous session commit the placeholder in the first place.

## Numbers to check against

Measured in Chromium on this branch, with the detail popup open on the Daily hero:

| Width  | Card    | Scroll region | A 579-char entry renders | Region scrollHeight |
| ------ | ------- | ------------- | ------------------------ | ------------------- |
| 320px  | 272x606 | 476px         | 455px of prose           | 875px               |
| 402px  | 340x606 | 476px         | 341px of prose           | 761px               |
| 1440px | 400x606 | 476px         | 296px of prose           | 716px               |

The card is **identical before and after the shard loads and after scrolling to the end** — all
three widths re-measured at the same box after scrolling the region to its bottom. (A card whose
title wraps to two lines is 628 rather than 606 at 320px; that is the title, not the prose.)

Scaling those: the 480-830 character band is roughly 283-489px of prose at 402px wide and 377-652px
at 320px. The image is _inside_ the scroll region, so even a 480-character entry at 1440px still
comes to about 665px against a 476px region — it always overflows, which is what lets the region be
a constant height without leaving dead space.

5,460 events, 10 written, 5,450 to go. Full suite is **759 tests across 64 suites**.

Corpus numbers worth not re-deriving (catalogue size, gzip ratios, shard sizes, where Phase 3
should start) are in the session notes, not here.

## Kick-off prompt for the next session

> Start **Phase 3** of the event-detail work on the `when` repo: writing the remaining 5,450
> entries.
>
> Branch off `claude/event-detail-writing-spec-sq448j` — **not** main, the feature only exists on
> that branch.
>
> Read `HANDOFF.md` at the repo root first, then `docs/event-detail/writing-spec.md` and the ten
> calibration entries it lists at the end — the gold set transmits tone better than the rules do.
> Run `npm ci` before trusting any check — without it `npm run typecheck` resolves a global `tsc`
> and prints something that looks exactly like a pass.
>
> **The spec and the UI are both done and out of scope.** Do not loosen a ban in
> `scripts/events/detail-spec.js` to get a batch through; fix the prose instead.
>
> Work one shard per batch, smallest first, via
> `node scripts/events/detail-report.js --chunks`. Sub-agents write map files into
> `untracked_data/event-detail/`; `detail-apply.js` writes the catalogue. Gate every batch on
> `npm run typecheck`, `CI=true npm test -- --watchAll=false` and `CI=true npm run build`, and read
> a random 5 per batch cold against the spec before committing. Drift is the failure mode, not
> corruption — sample specifically for every entry being pressed against the 830-character ceiling
> and every hook being the same kind.
