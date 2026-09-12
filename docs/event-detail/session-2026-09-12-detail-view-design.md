# 2026-09-12 — Event detail: designing the read-more view

Building the mechanism for the long-form "read more" behind a card's info button, and planning
the writing of 5,460 entries across the sessions after it. The prose itself is unwritten by
design: this session settled the shape so that Phases 2 and 3 are a pure content exercise.

The decisions and their rationale live in [index.md](index.md) — the shape of the sidecar, why
the card turns over rather than opening a second overlay, why the button is unreachable before
placement, and why the prose is not inlined into the event JSON. This file is the perishable
half: where the work stopped, what Phase 2 still has to choose, and the things that cost this
session real time to find out.

## Where this left off

**Branch `claude/event-details-info-button-hu8mpk`**, commits `c53efce` (the feature) and
`0bb6bb5` (keeping the card the same size across the turn). Clean tree, fully pushed.

**No PR, and nothing merges to production until the whole corpus is written** — decided
2026-09-12. Phase 2 and every Phase 3 batch continue on this same branch, so it is long-lived:
**merge `origin/main` into it periodically** rather than letting it drift, and never rebase it
(the merge commit keeps any other checkout valid).

**Nothing is enabled.** Zero events carry `has_detail`, so no info button renders anywhere, and
`public/events/detail/` does not exist. That is the intended Phase 1 state, not an oversight.

**The working tree must stay clean of `public/events/`.** `scripts/events/detail-placeholder.js`
fills all 5,460 events so the design can be looked at, but it sets `has_detail` — so a committed
run would ship placeholder prose the moment the branch ever merged. Run it, look, then
`--revert`, and check `git status --short public/events/` is empty before every commit. This is
Guardrail 1 in the digest and it gets more important the longer the branch lives.

**Next session starts at Phase 2**, the writing spec.

## What Phase 2 has to settle

Starting positions, not conclusions — they are here so the next session has something to argue
with rather than a blank page.

1. **The length band.** `scripts/events/detail-spec.js` currently allows 2-3 paragraphs, 200-900
   characters each, 2,200 total. Those are deliberately wide placeholders, chosen so Phase 1
   would not reject good writing sight-unseen — they are not a target. Pick a real band, then
   tighten the constants; `eventDetailCorpus.test.ts` enforces whatever is in that file.

2. **The hook, and the template problem.** The biggest risk across 5,460 entries is not that any
   one is bad, it is that they all read the same. A spec that says "open with an interesting
   hook" will reliably produce one formula repeated 5,460 times. Better to name several _kinds_
   of hook — the detail that contradicts the famous version, the thing that nearly did not
   happen, the consequence nobody would guess — and require variety, then sample for drift.

3. **Register, and the carve-out.** "Find an interesting hook" is actively wrong for atrocities,
   genocide, slavery, and deaths, and these are well represented in the catalogue. The spec needs
   an explicit rule for those events, not a tone adjective that a writer has to interpret.

4. **Accuracy.** The other risk that scales badly: confident fabrication. Worth knowing that
   **1,830 of the 5,460 events carry an undeclared `wikipedia_url`** (with `wikipedia_views`) —
   a possible research anchor, but **at least one is wrong**: `battle-megiddo` points at the 1918
   battle, not the 1457 BCE one the card is about. So it is a lead, not a source of truth, and a
   spec that says "check the linked article" will silently launder that error into prose.

5. **Events with little to say.** Two paragraphs is a stretch for the more obscure cards. Decide
   whether the answer is broader context, a lower floor, or leaving some events without detail
   (the UI already handles absence — the button simply does not render).

6. **Dates are allowed here, and the spec must say so loudly.** Every writer will arrive assuming
   the `description` rule (no year, decade or century) carries over, because it is stated
   everywhere else. It does not: detail is unreachable until the year is already revealed. Say it
   early and give the reason, or the whole corpus will be written awkwardly around dates.

7. **Do not restate the `description`** in the first paragraph — it is on the card face the reader
   just turned over. And do not describe the card art.

8. **A gold set of ~15 exemplars**, spread across era, difficulty and category, is the practical
   way to transmit tone to a sub-agent. It will do more than any amount of adjective in the spec,
   and it doubles as the calibration exercise for settling items 1-3.

The Phase 2 deliverables themselves — `docs/event-detail/writing-spec.md` and
`.claude/skills/write-event-detail/SKILL.md` — are described in [index.md](index.md).

## Numbers worth not re-deriving

|                                 |                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Events in the manifest          | **5,460**, all playable — every one has a Cloudinary image, so `eventLoader`'s filter drops none |
| `description` length            | min 32, median 100, max 169 characters                                                           |
| Catalogue today                 | 3.0 MiB raw, **0.49 MiB gzipped**, fetched on a load that blocks the loading screen              |
| Detail at ~1,100 chars/event    | ~6 MiB raw, **~2.3 MiB gzipped** — the reason it is a lazy sidecar                               |
| Prose gzip ratio in this corpus | ~0.378 (measured over all 5,460 existing descriptions)                                           |
| Biggest shard once written      | `exploration.json`, 1,040 events, ~375 KB gzipped                                                |
| Smallest shards                 | `candidates` 53, `migration` 54, `clothing` 54 — where Phase 3 should start                      |

## Traps this session hit

- **`node_modules` is not pre-populated in a fresh container**, and the failure is silent in the
  worst way: until `npm ci` runs, `npm run typecheck` resolves a _global_ `tsc` and prints only
  unrelated tsconfig deprecation warnings, which reads exactly like a pass. Run `npm ci` first
  and confirm `node_modules/.bin/tsc` exists before trusting a green typecheck.
- **`npm run lint` fails outright without deps** — a global ESLint 10 cannot read the project's
  `.eslintrc` and exits with a config error rather than a lint result.
- **Playwright: `[data-timeline-year]` is the year label beside the card, not the card.** Clicking
  it opens nothing, which looks like a broken feature rather than a bad selector. Reach a timeline
  card by its title. Noted in `../driving-the-app-with-playwright.md` too.

## Deliberately not done

Where the prose overflows the card, it clips against the hairline above "Report an issue". That
is conventional scroll behaviour and reads acceptably, but a `mask-image` fade would read better
— and unlike a gradient it needs no knowledge of the card's inline background colour, which is
per-event. Left alone until there is real prose to judge it against; lorem is the wrong thing to
tune a reading affordance on.
