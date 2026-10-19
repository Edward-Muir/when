# Stage B: author one deck

Takes the next theme on the list and writes its deck: 30 cards, with every new event tagged,
windowed, described and given an art prompt, but no images yet. It leaves branch
`claude/deck-<id>` with `status.json` at `authored`.

This is the longest stage. **Each step ends in a file**, and a step whose file already exists is
done: skip it. That is how a crashed run resumes. Run
`node scripts/factory/status.js refresh --token <token>` after each step.

All the deck's files live in `factory/decks/<id>/`; call it `D` below.

## 0. The theme

`start.js` returned the deck id. A **new** deck also returned `theme`, its backlog entry. For
a resumed deck, read the entry from `docs/curated-themes/backlog.json`. You need its `name`,
`scope`, `boundary`, `notes` (optional) and `example_beats`.

## 1. Claim it (new decks only)

1. `node scripts/factory/backlog.js set-status <id> authoring`
2. Write `D/theme.json`: the backlog entry, copied as it stands.
3. Commit both: "chore(factory): start the <Name> deck".
4. Push with `git push -u origin claude/deck-<id>`. The branch on origin is what marks the
   theme as taken, so do this before any slow step.

## 2. The blind spine → `D/spine.json`

Dispatch one `theme-spine-writer` agent. Its prompt gives the theme's `name`, `scope`,
`boundary`, `notes`, `example_beats` and the output path `factory/decks/<id>/spine.json`.
Paste them in; the agent can't read files, by design.

**Don't give it anything from the catalogue,** such as a list of existing cards or a theme-gap
report. The deck's events are chosen here, and only here.

Then run `node scripts/factory/spine-matches.js --deck <id>`. It checks the spine and writes
`D/matches.json`. If it rejects the spine (too few beats, two beats in one year, a date in a
title, beats bunched into one stretch), send the problems back to the same agent to fix, at most
twice. For bunching, quote the checker's line: it names the crowded window and the limit. If the
third spine still fails, skip the theme (step 3's skip path) with the reason. Commit `D/spine.json` and
`D/matches.json`.

## 3. Reconcile → `D/deck.json`, `D/new-events.json`, `D/reconcile.json`

Dispatch one `deck-reconciler` agent with the deck id, the theme fields, and the folder. It
reads the spine and matches and writes the three files, or `D/skip.json`.

**If it wrote `D/skip.json`**, the theme can't make a deck:

1. `node scripts/factory/backlog.js set-status <id> skipped --reason "<its reason>"`
2. Commit "chore(themes): skip <Name>" and push.
3. Open a PR so the skip reaches main:
   `gh pr create --base main --head claude/deck-<id> --title "chore(themes): skip <Name>" --body "<the reason, and what the spine found>"`
4. Unlock and report. The next author run takes the next theme.

Otherwise check the gates yourself, then commit the three files:

```
node scripts/theme-gap.js --slugs <deck.json eventNames, comma-separated> --include-pending --extra factory/decks/<id>/new-events.json --overlap <id>
```

Every gate must say PASS. If one fails, send the reconciler back with the output once.

## 4. Fact check → `D/fact-check.json`

Dispatch one `deck-fact-checker` agent with the folder. Then, for each `fix` verdict, edit
that field in `D/new-events.json` to the suggested value. Leave `unsupported` ones alone: they
go in the PR. If a fix changed a year, re-run the theme-gap command from step 3, which must
still pass.

Then append the new events to the catalogue:

1. `node scripts/factory/add-deck-events.js --deck <id> --dry-run`, then without `--dry-run`.
2. Commit `D/` and `public/events/themes.json`: "chore(events): the <Name> deck's new events".

## 5. Regions, evidence windows, detail prose

Run the three existing pipelines on `themes.json`, exactly as their skills describe. Each one
only touches events that still lack the field, so only this deck's new events get picked up.

1. **Regions**, per the `tag-event-regions` skill:
   - `node scripts/events/region-report.js --file themes.json --chunks`
   - one `event-region-tagger` agent per chunk in `untracked_data/event-regions/worklist/`
   - `node scripts/events/region-apply.js --dry-run <batch>`, then without `--dry-run`
2. **Evidence windows**, per the `set-evidence-window` skill:
   - `node scripts/events/year-range-report.js --file themes.json --chunks`
   - one `event-range-writer` per chunk
   - `node scripts/events/year-range-apply.js --dry-run <batch>`, then for real. This writes the
     ledger, `scripts/events/year-range-decided.json`, too.
   - If the report lists no candidates, skip this step.
3. **Detail prose**, per the `write-event-detail` skill:
   - `node scripts/events/detail-report.js --file themes.json --chunks`
   - one `event-detail-writer` per chunk, and never pass it a `wikipedia_url`
   - `node scripts/events/detail-apply.js --dry-run <batch>`, then for real

Commit after each pipeline, with a message naming it.

## 6. The theme note and the scenes

1. **The note**, `docs/curated-themes/<id>.md`, in the shape of the existing notes
   (`pirates.md` is a good model):
   - the scope rule, and the edges argued (the reconciler's `why` lines);
   - the 30 as a table: year, slug, and `foothold` / `NEW` flags;
   - the gates line from theme-gap;
   - the fact-check flags that are still `unsupported`.
     It names no dates for scheduling: the calendar is the record of those.
2. **The scenes**, `docs/curated-themes/art/scenes-factory/<id>/scenes.json`:
   `{slug: {research_focus, scene}}` for **every new slug**, and only those.
   - Follow the scene rules in `docs/events-images/index.md`: never describe text, no colour
     adjectives, figurative not establishing, likenesses by posture, deaths non-graphic, and a
     "Birth of X" card pictures X in their active years ("not a birth scene").
   - Keep each `scene` to one or two sentences. Name what must be in the picture and anything
     easy to get wrong ("the remote is a toy-like ray gun, not a handgun").
3. **The prompts**:
   `python3 scripts/events/theme-art-prompts.py --scenes docs/curated-themes/art/scenes-factory/<id> --out factory/decks/<id>/prompts.csv`
   It fails if any new event lacks a scene, or a scene names something else. Fix and re-run.

Commit: "chore(factory): the <Name> deck's note, scenes and prompts".

## 7. Check and hand over

1. The event tests, through npm:
   `CI=true npm test -- --watchAll=false eventCategories eventRegions eventSlugUniqueness eventYearRange eventDetailCorpus eventDateClues eventNameLength`
   A failure is fixed through the script that owns the field, never by hand. If you can't fix
   it, stop and report. Don't init the status.
2. Create the state:
   `node scripts/factory/status.js init --deck <id> --name "<Name>" --slugs <new slugs, comma-separated>`
3. Commit `D/status.json`: "chore(factory): <Name> authored, <n> images to make". Push.

The report gives the counts of new and reused cards, band 0, the largest overlap, and the
fact-check flags.
