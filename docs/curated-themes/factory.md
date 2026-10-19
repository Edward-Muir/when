# Curated Deck Factory

A set of scheduled tasks on Edward's laptop that turns out one finished curated deck per day as a pull request. Edward reviews and merges each one, and it gets scheduled. The aim is full automation once the factory has earned it.

**Status: being built (October 2026).** Landed so far: the theme list (#84), the groundwork (CI on pull requests, the image scripts in `scripts/images/`, a shared `.claude/settings.json`), the state engine (`status.js`, `backlog.js`, `decks.js`, the lock, the `start.js` preamble and the JSON merge driver), the `when-factory` clone, the four agents, the `deck-factory` skill with one file per stage, and the remaining scripts. The QC calibration is done (62 of 63 caught, 1% false flags), and one scheduled task, with no schedule yet, runs every stage. Merged to main on 2026-10-18 (#85 to #88). Still to do: set the task's folder, then the first runs, following [the checklist](#the-first-runs). Everything else below is still the design. Build it in the order in section 8, and update this page as each piece lands.

**Decisions of 2026-10-18 that changed the design** (each is written into the section it belongs to):

1. The factory runs in a **dedicated clone, `when-factory`**, never in worktrees ([section 2](#the-clone)).
2. The art stage drives Gemini through **Claude in Chrome**, not computer use ([C1](#c1-art-batch-claude-in-chrome-gemini-web-at-most-10-images-per-session)).
3. Decks are **exactly 30 cards**, from a spine of about 40 beats ([section 4](#4-task-b-author-one-deck)).
4. The task is created with **no schedule**, Run now only, and gets its cron during rollout ([section 8](#8-rollout-and-the-path-to-full-automation)).
5. **One task runs every stage**, and the state machine picks the stage (2026-10-19, replacing a task per stage; [section 2](#2-the-shape-one-local-task-and-a-state-machine)).

---

## 1. Why, and what it fixes

Today each curated theme is built by hand across several sessions:

1. Ideate a theme and its scope rule, one at a time. Overlap is caught only by memory. The factory replaces this with one long list, made up front.
2. A blind spine agent writes the deck's beats without seeing the catalogue. A reconcile agent then matches them against existing cards.
3. Region tags, evidence windows, difficulty and detail prose.
4. Scene files, then `theme-art-prompts.py` writes the prompts CSV.
5. A scheduled browser task drives the Gemini web app, and the images land in `~/Downloads`.
6. Rename the files to slugs, then `downsample.py`, `extract_colors.py`, a manual Cloudinary upload, `update-cloudinary-urls.js` and `extract_event_colors.py`.
7. PR, merge, then a hand-dispatched `publish-theme.yml`.

**What the October 2026 audits found** (#80, #81, `docs/card-reports/index.md`). The factory is designed around these:

- **The bad-art rate is about 1.2%.** 70 of 5,838 cards were bad: 26 from player reports and 44 from the art audit.
- **Most bad cards showed another card's picture,** often an alphabetical neighbour. That points to an off-by-one rename after download.
- **The other 7 audit cards were frame, mat or canvas mockups.** The 26 player reports mixed swaps, cards on topic with a clear error, and remakes on request.
- **Haiku reviewers worked, with two caveats:**
  - They worked when told to describe each image before judging.
  - They sometimes skipped contact sheets, and 4×4 sheets missed 3 of 8 planted swaps.
  - Their roughly 8% flag rate needed a stricter second pass.
- **dHash duplicate detection is free and found 16 bad cards on its own.**

**Decisions already made:**

- Everything runs as Desktop scheduled tasks on the laptop.
- Themes come from one long list built up front, so they don't overlap. The factory works through it in order.
- Art runs in sessions of at most 10 images, because Sonnet loses track beyond that while driving the browser.
- Gemini in the browser makes the images, driven through Claude in Chrome (Edward's signed-in Chrome), the way his hand-run art task already works.
- QC runs on Claude Code Haiku sub-agents.
- Cloudinary upload is automatic, using keys from the laptop's `.env`.
- For now each deck arrives as a PR to review and merge.

---

## 2. The shape: one local task and a state machine

**One scheduled task runs the whole factory** (decided 2026-10-19). Each run does exactly one stage, and the state machine picks which. The six stages (named A to D in the first design, which had a task each) are:

| Stage                   | Does                                                                                  | Leaves behind                                                              |
| ----------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| _(once)_ **Theme list** | interactive session, repeated when the list runs low: builds the ordered list         | `docs/curated-themes/backlog.json`                                         |
| **A. List health**      | themes left, calendar buffer and drift, skipped themes                                | a health report                                                            |
| **B. Author**           | takes the next `queued` theme from the list and writes the deck, without images       | branch `claude/deck-<id>`, deck `stage=authored`, every new slug `pending` |
| **C1. Art batch**       | generates **at most 10 images**, then the session ends                                | those slugs `downloaded`                                                   |
| **C2. QC**              | pre-checks and Haiku QC on every `downloaded` slug                                    | each slug `qc-pass`, `qc-fail` (goes back to C1) or `needs-human`          |
| **C3. Ship**            | once no slug is `pending`, `downloaded` or `qc-fail`: upload, wire, test, open the PR | deck `stage=pr-open`                                                       |
| **D. Schedule**         | validates merged decks against the calendar                                           | a dispatch ready for Edward to publish                                     |

**How a run picks its stage** (`pickStage` in `scripts/factory/start.js`). The first match wins:

1. **list health**, when its last run is a week old;
2. **schedule**, when a merged deck isn't on the calendar and it hasn't run today;
3. **ship**, then **QC**, then an **art batch**: downstream first, so the deck in flight finishes before another starts;
4. **author**, while fewer than 2 decks are between authoring and `pr-open`;
5. otherwise the run exits at once, which costs almost nothing.

Each run ends with `status.js unlock --outcome ok|blocked|failed|quota`. The outcome goes to a run log, `../when-images/factory-runs.json`, outside git.

- A stage whose last run ended `blocked` or `failed` is skipped for 6 hours, so one broken stage can't take every run. Chrome signed out is one example; a merge conflict is another, and `start.js` logs that one itself.
- An art batch that hit Gemini's daily cap is skipped until the next local day.
- Naming a stage forces it and ignores the backoff: "Run the deck-factory skill, stage: qc" in an ordinary session in the clone. That is for debugging and manual runs.

**Why one task rather than six.** The state machine already knew what every deck needed, so a task per stage only encoded "which stage to try". That cost six folders to set by hand, six permission lists to approve and six schedules to stagger. Desktop also skips a run while another is running, which the lock handles anyway. One task needs one folder and one set of approvals. Each run is still a fresh session doing one stage, so art stays capped at 10 images a session, and QC never shares a context with the browser work.

**Why art runs in batches of 10.** Sonnet loses track when it drives the browser for more than about 10 images in one session. So each art session handles at most 10 slugs, then ends. The next art run starts a fresh session with a clean context and takes the next 10 `pending` or `qc-fail` slugs. A QC failure flips the slug back to `qc-fail`, and the next art batch picks it up.

**Pace and quota.** A deck takes about 9 runs: author 1, art 3-4, QC 3-4 (one after each batch), ship 1.

- **Hourly, `5 * * * *` in local time, is the recommended cron:** about 14 waking runs a day, roughly a deck a day.
- **Every 2 hours, `5 */2 * * *`,** gives about half a deck a day.
- Art runs at most every other run, because QC follows each batch, and takes at most 10 images. So even hourly, a day stays under Google AI Pro's ~100 images, and a `quota` outcome stops art for the day if it doesn't.

**How the task is set up** (Claude Desktop, Code tab, then Routines, **Local**):

- **"Deck factory"**, id `deck-factory`, with the prompt "Run the deck-factory skill".
- **Created with no schedule**: Run now only, until rollout (section 8) gives it a cron.
- **Folder `when-factory`, Worktree off.** The clone is what keeps runs away from Edward's working copy (see [The clone](#the-clone)).
  - The task-creation tool has no folder field, so the folder and the permission mode are set by hand in the task's Edit screen.
  - Until the folder is set, a run starts in the wrong place, and `start.js` refuses it (exit 2).
- **"Keep computer awake" on** in Settings.
- **Permissions approved once:** the repo's `.claude/settings.json` allows the narrow set of commands the stages run, and denies force-pushes, pushes to `main`, `gh pr merge` and publish dispatches. Click **Run now** and choose "always allow" for anything still prompting; the approvals are stored on the task, so later runs don't stall.
  - The Desktop docs promise only that allow rules in `~/.claude/settings.json` apply to scheduled runs; they don't say whether a project's `.claude/settings.json` does. The first runs settle it. If the project rules aren't honoured, copy the allow and deny lists into the user settings.
  - Bash rules match command text, and a rule must match every part of a chained command. So the stages run single commands, and the scripts do the multi-step work.
- **A one-line prompt.** The logic lives in versioned files in the repo (`.claude/skills/deck-factory/`).
  - A run reads `SKILL.md` from the clone as it stands when the run starts, before `start.js` syncs it. So a change to `SKILL.md` (or to `start.js`'s first phase) takes effect one run after it merges. The stage files are read after the sync, so they are always current. After merging a factory change, sync the clone by hand (`git checkout --detach origin/main` in `when-factory`) when it can't wait a run.

**State lives on each deck branch** in `factory/decks/<id>/status.json`:

- **Deck `stage`:** `authored` → `art-in-progress` → `ready-to-ship` → `uploaded` → `pr-open` → `merged` → `scheduled`
  - The first three are **derived from the slugs**, never set: `ready-to-ship` exactly when every slug is `qc-pass` or `needs-human`. A deck that reuses every card is `ready-to-ship` from the start.
  - The rest are set one step at a time (`status.js stage`), each only from the one before it. Once a deck is `uploaded`, its slugs are frozen.
  - `merged` and `scheduled` happen after the branch has merged, and a stage can't commit to main. Task D therefore reads them from GitHub and `/api/themes`, not from the file. The copy that reaches main stays at `pr-open`.
- **Per-slug `state`:** `pending` → `downloaded` → `qc-pass` | `qc-fail` | `needs-human`
  - `qc-fail` goes back to C1 (`qc-fail` → `downloaded`), at most 2 times. The third fail is recorded as `needs-human`, with the reason.
  - `pending` → `needs-human` is allowed, for an image Gemini refuses to make.
  - `status.js reset <slug>` is a human's way back to `pending`, with a fresh retry budget.
- Each slug records `attempts` (downloads so far), the last QC `reason` and its file's `sha256`. `downloaded` refuses to record without a sha256.
- **`scripts/factory/status.js` is the only code that reads and writes this file.** The rules are pure functions in `status-lib.js`, tested in `factory.test.js` (`npm run factory:test`, also in CI).
  - `init --deck <id> --name <Name> --slugs a,b,…` creates it, once.
  - `next-batch --deck <id> --max 10` prints the next slugs as JSON: retries first, then pending, in deck order, with both prompts from the deck's `prompts.csv`. A retry's image prompt already carries the last QC reason. The cap of 10 is enforced in code, and `--max 11` is refused.
  - `mark --deck <id> <slug> <state> [--sha256 …] [--reason …]` moves one slug and re-derives the stage.
  - `stage`, `reset`, `summary`, and `lock` / `refresh` / `unlock` / `lock-status` for the global lock.
- **`scripts/factory/backlog.js`** reads the theme list and changes only a theme's `status`:
  - `next` returns the first `queued` theme that has no `claude/deck-<id>` branch on origin. Every status change is committed on the deck's branch and reaches main only when its PR merges, so a branch on origin is what marks a theme as in flight.
  - `set-status <id> <status> [--reason …]` enforces queued → authoring → done, or skipped with a reason. The ship stage writes `done` into the deck PR itself, since merging it is what makes that true.
  - `count` gives the numbers for list health.
- **`scripts/factory/decks.js`** lists every deck on origin with its stage, read from the branches without checking any out.

**`scripts/factory/start.js <stage>` is the shared preamble, in code.** It runs before anything else in a stage and prints one JSON line: `run` (with the deck, branch and lock token), `exit` (nothing to do, lock released) or `blocked` (needs Edward, lock released).

1. The guard, then the lock.
2. Fetch, then a hard reset to a detached `origin/main` and `git clean -ffdx`, keeping only `node_modules`, `.env` and `.claude/settings.local.json`.
3. It re-runs itself from that fresh checkout, so the rest is always main's version of the script.
4. It picks the oldest deck with work for the stage:
   - C1: a deck with `pending` or `qc-fail` slugs;
   - C2: a deck with `downloaded` slugs;
   - C3: a deck at `ready-to-ship` or `uploaded`;
   - B: first a deck whose authoring crashed (a branch with no `status.json` yet), otherwise the next theme, but only while fewer than 2 decks are between authoring and `pr-open`.
5. It checks out the deck branch, merges `origin/main` into it and pushes the merge, then runs `npm ci` only if `package-lock.json` has changed since the last install.

**A structural JSON merge driver keeps decks mergeable.** Every deck appends to the same files: `public/events/themes.json`, its detail sidecar and `year-range-decided.json`. A line merge calls two decks in flight a conflict even though nothing collides.

- `scripts/factory/json-merge.js` merges by structure:
  - event records by `name`;
  - object keys one by one, keeping an alphabetical ledger sorted;
  - string arrays as sets.
- It fails only on a real collision: the same field changed two ways, or a record deleted on one side and edited on the other.
- `start.js` registers it in the clone's own `.git/config` and `.git/info/attributes`, so it never applies in Edward's checkout.
- GitHub's merge button doesn't run custom drivers, which is why every stage merges main into its deck first. A conflict comes back as `blocked`, naming the files.

Every stage reads the status, does the next step, commits and pushes. That makes it safe for:

- **catch-up runs:** Desktop runs one missed run on wake, possibly hours late;
- **skipped runs:** the next run just picks up;
- **crashes:** a re-run resumes from `status.json`.

A lock file (`../when-images/factory.lock`) stops two runs overlapping. Each run handles **one deck at most**.

### The clone

The factory runs in its own clone, `/Users/emuir/Documents/GitHub/Vibes/timeline/when-factory`, a sibling of `when` and `when-images`. Worktrees were the first design and broke three things: the gitignored `.env`, `node_modules`, and the relative `../when-images` path. Edward also edits in `when` while the factory runs, and a stage resets its working tree.

- **One-time setup:** `git clone` the repo to `when-factory`, copy `.env` from `when`, `npm ci`, `pip3 install imagehash`.
- **Every stage starts the same way:**
  1. `git fetch origin`.
  2. Check out `claude/deck-<id>` from origin if it exists, otherwise branch it off `origin/main`.
  3. Reset and clean, inside the clone only.
  4. `npm ci`, only if `package-lock.json` changed.
- **The guard:** a stage refuses to run unless the working directory's basename is `when-factory`, so it can never reset Edward's `when` checkout.
- **One global lock**, `../when-images/factory.lock` (PID plus timestamp, stale after 2 hours), because every stage shares one working tree. A second run that finds the lock held exits at once.
- **Paths:** `scripts/factory/config.js` (and `scripts/images/paths.py` for the Python scripts) resolve `WHEN_IMAGES_DIR` from the environment or `.env`, relative to the repo root, defaulting to `../when-images`.

---

## 3. The theme list: built once up front, then worked through

Themes are not invented one at a time. One interactive session with Edward builds a **long, ordered list of about 200 themes** in `docs/curated-themes/backlog.json`. That is roughly six months of daily decks. Task B takes the next theme from the top.

Seeing the whole list at once is what keeps themes from overlapping. Each new theme is drawn against every theme already on the list, rather than against a memory of last week's.

### Building the list (one session, interactive)

1. **Seed with what exists.**
   - The 41 themes in `publish-inputs.md`, plus `english-history` and `indonesia` from the live calendar.
   - Enter them as `status: "done"`, so new themes are drawn around them.
   - The input is theme names and scope rules only, never events. This keeps the blind principle.
2. **Generate against a coverage grid.**
   - Candidates are spread across the 21 categories × 8 eras × the macro-regions in `src/data/regions.json`.
   - Each grid cell shows how many themes already touch it, so thin areas get filled. Today's list leans to Europe, war and early-modern.
   - Several parallel Sonnet agents each take one slice of the grid and propose 40–60 themes.
3. **Overlap pass.**
   - A fresh agent sorts all candidates into clusters (for example ships / sea battles / explorers / pirates) and checks each cluster pair by pair.
   - Every theme gets a **boundary line** naming its nearest neighbours and what belongs to them, for example "Ships: vessels and shipbuilding; naval battles belong to Sea Battles, voyages to Crossings."
   - Near-duplicates are merged or cut, and too-broad themes are split.
4. **Gate each survivor.**
   - Name: 20 characters or fewer, and a unique id.
   - Scope rule: one plain yes/no idea that players get from the name, with no stacked qualifiers, carve-outs or date ranges. "Prime Time: Yes if it is a TV show" is the model.
   - Easy to fill: there are 60+ well-known candidates, so 30 famous events in 30 different years come without hunting.
   - Expected size: the agent sketches 10 example beats in different years. A deck is exactly 30 cards.
   - No coverage metric. Themes are never measured against the catalogue: what the game already holds plays no part in choosing a theme or its events.
5. **Order the list** so consecutive days vary. No two neighbours share a category, a dominant era or a dominant region. Big crowd-pleasers are spread out rather than front-loaded.
6. **Edward reviews the list** as a PR: reorders, cuts, adds. After merge the factory only reads it, apart from marking progress.

**One entry in `backlog.json`** (the file is `{"about": …, "themes": [...]}`, and `src/utils/backlogSchema.test.ts` checks it):

```json
{
  "id": "broadsides",
  "name": "Broadsides",
  "scope": "Yes if it is a naval battle",
  "boundary": "Broadsides: fleet against fleet; piracy goes to Pirates & Privateers, ship designs to Sail & Steam, the Armada and Trafalgar to English History.",
  "neighbours": ["pirates", "ships", "english-history"],
  "grid": {
    "categories": ["warfare"],
    "eras": ["ancient", "medieval", "earlyModern"],
    "regions": ["Europe", "East Asia"]
  },
  "example_beats": ["Salamis (480 BC)", "Sluys (1340)", "Lepanto (1571)", "..."],
  "appeal": 3,
  "status": "queued"
}
```

`appeal` (1-3) is how broad a crowd-pleaser the theme is; at most about a third are 3. An optional `notes` carries Edward's authoring instructions for that deck, such as "date each card to the seminal work, not the prize", and Task B passes it to the spine writer. Entries marked `done` carry no boundary, since their decks already exist.

`status` moves `queued` → `authoring` → `pr-open` → `done`. A theme can also be marked `skipped` with a reason, for example when it can't fill 30 cards.

### How the list was built

- **Version 1 (2026-10-12):** five Sonnet agents proposed 262 candidates without seeing the catalogue, and one overlap pass cut them to 167.
  - The scopes came back too specific, with stacked qualifiers, date ranges and carve-outs.
  - The list was also ordered by how many existing cards each theme's keyword search matched. Both were wrong for a factory that exists to add cards.
- **Version 2 (2026-10-18)** rewrote the list to [rubric v2](#the-rubric-version-2). Four agents each rewrote whole clusters, and one cross-slice pass removed the collisions that broadening created. The review then applied:
  - No go on Monster Sightings and Pop Goes Global;
  - Cut a Rug as all dance forms, split back out of the music deck;
  - no sports themes at all. Eight were dropped, and sport beats were swapped out of other decks;
  - No go on Bonaparte (one life is too short and its events bunch), Bugs & Breaches (too specific) and Siberia;
  - Material World widened to all of history, from copper and bronze to plastics;
  - Nobel Winners re-scoped to the work a prize was given for, dated to when it was done.
  - Gone Viral was cut, because social media spans under 30 years.
- **Result:**
  - 181 themes: the 43 existing ones `done`, then 138 `queued`.
  - Appeal 3 on about a quarter.
  - Every merge, cut and re-scope is in [backlog-clusters.md](backlog-clusters.md).
- **Every war-in-one-decade deck stays cut:** both World Wars, the Pacific War and the US Civil War.
  - A war of four to six years can't give 30 cards in different years.
  - Their weapons live in War Machines.
- **Periods and dynasties inside a seeded country stay**, on the Kings of England precedent: Shogun!, Meiji Leap, The Romanovs, The Raj, Siberia.
- **Order:**
  - It opens on a crowd-pleaser, and each appeal tier is spread evenly from there.
  - No two neighbours share a category, a lead era or a lead region.
  - Nothing about the catalogue is consulted. Reorder by hand freely; the order is not tested.

### The rubric, version 2

1. **One plain idea.** The scope is one short sentence that players get from the name: "Prime Time: Yes if it is a TV show." No stacked qualifiers, carve-outs or date ranges. A line between neighbours goes in `boundary`, never in the scope.
2. **Easy to fill.** There are 60+ well-known candidate events, so 30 famous ones in 30 different years come without hunting.
3. **Not a seeded day.** Narrower than a plain category, country, macro-region or category + place pairing. A dynasty, movement or route inside one is fine.
4. **Exactly 30 cards, each in a different year,** spread over a stretch long enough that events don't bunch. A subject that spans under about 30 years (one war, social media) can't work.
5. **Chosen blind.** Themes and their events never depend on what the catalogue holds. These decks are how new cards enter the game.
6. **Distinct.** At most about 4 famous events are shared with any other theme, the existing ones included.
7. **The name** is 20 characters or fewer.
8. **Appeal is honest.**
9. **Tasteful.** No deck whose point is atrocity, and nothing about live politics.
10. **No individuals.** A deck about one person's life bunches its events too close together (Bonaparte was cut for this). A dynasty or a line of rulers is fine.
11. **No sports.** Edward's call in the 2026-10-18 review: no sports themes, and no sport events as filler in other decks.

### Overlap control while decks are authored

The list keeps themes apart, but cards can still be shared: 59 slugs already appear in two or more themes.

- The reconcile step (task B, step 2) reports how many of the deck's cards already appear in each earlier theme.
- **Gate: at most 4 cards shared with any single earlier theme.** Above that, the deck swaps in alternatives or drops to 30 cards.
- If the gate can't be met, the theme is marked `skipped` with a reason, and the day falls back to the next theme on the list.

### Task A: list health (weekly, when due)

A light weekly check, not a generator:

- **Themes left:** with fewer than 30 `queued`, it says Edward should run another list-building session. That's about a month of warning.
- `npm run theme:verify`
- days of curated buffer ahead
- calendar drift
- pending gate failures
- skipped themes and why
- **Built:** `node scripts/factory/health.js` assembles all of it, plus the decks on origin (any with no change for 3 days is flagged), open factory PRs, and the Cloudinary assets of any closed unmerged.
- It saves the report to `../when-images/factory-reports/health-<date>.md`, and the run's reply carries the headlines. Nothing is committed, because a stage can't write to main.

---

## 4. Task B: Author one deck

Takes the first `queued` theme in `backlog.json` that has no branch on origin, sets it to `authoring`, and runs the Bank 2 method. It waits instead while 2 decks are already between authoring and `pr-open`. The steps are `.claude/skills/deck-factory/author.md`. Each step ends in a file in `factory/decks/<id>/`, and a re-run skips any step whose file exists. The spine agent gets the theme's scope rule, boundary line and any `notes`, so it stays inside its lane and follows Edward's instructions for that deck. The blind step is enforced by which tools each agent gets, not by asking nicely.

1. **Blind spine.** New agent `.claude/agents/theme-spine-writer.md` (Sonnet).
   - Tools: `WebSearch, Write` only. With no Read, Glob or Grep it **cannot** see the catalogue.
   - Writes about 40 dated beats in different years, with one search per date. That leaves about 10 spares for the reconcile to swap in.
   - **The deck's events are chosen here, and only here.** These decks are how new cards enter the game, so nothing the catalogue already holds may shape the choice.
   - Writes `spine.json`. `scripts/factory/spine-matches.js` then checks it (at least 34 beats, unique years, no date in a title or description). For each beat it lists the catalogue cards within a year, or whose evidence window covers it, in `matches.json`. Given a Restoration beat, it ranks `english-civil-war-aftermath` first.
2. **Reconcile.** New agent `.claude/agents/deck-reconciler.md` (Sonnet, full read access).
   - Matches beats by year and name, the `english-civil-war-aftermath` trap.
   - **Reuses an existing card only when it names essentially the same event**: the same thing, in the same year. Everything else is written new per the `add-events` skill. The reconcile never adds a beat the spine didn't write, and never swaps a beat for a catalogue card because one is handy.
   - Cuts the deck to **exactly 30 cards** against the gates in `scripts/theme-gap.js`: size 30, at least 5 band-0 footholds, no two cards in the same year. A failed gate is fixed from the spine's own spares, never from the catalogue.
   - **Overlap gate:** at most 4 cards shared with any single earlier theme, checked by `theme-gap.js --overlap <id>`. The earlier themes are `publish-inputs.md`, merged factory decks (`factory/decks/*/deck.json`), decks still on their branches, and the live calendar, 42 themes today.
   - Writes `deck.json` (the 30), `new-events.json` (the new records) and `reconcile.json` (every beat's decision, and why for each reuse and cut). If the gates can't be met, it writes `skip.json` instead: the theme is marked `skipped`, and a small PR carries that to main.
3. **Fact check.** New agent `.claude/agents/deck-fact-checker.md` (Sonnet, WebSearch).
   - Checks each new event's year, name and description against sources.
   - Lists anything it can't support for the PR. This stands in for Bank 2's hand "Review edits".
   - It runs **before** the new events are appended, so a clear `fix` (a year every source agrees on) is applied to `new-events.json` first.
   - Then `scripts/factory/add-deck-events.js` appends the records to `public/events/themes.json`. It checks every rule a hand author would: the slug unique across all files including `deprecated.json`, the name length, the category against `ALL_CATEGORIES`, the difficulty, a description of 80-150 characters, and no date clue (the same `date-clues.js` the tests use).
4. **Existing pipelines, unchanged:**
   - `region-report.js` → `event-region-tagger` → `region-apply.js`
   - `year-range-report.js` → `event-range-writer` → `year-range-apply.js` (ledger in `year-range-decided.json`)
   - `detail-report.js` → `event-detail-writer` → `detail-apply.js`
   - Difficulty set against `docs/events-images/difficulty-grading-rubric.md`
5. **Theme note and scenes.**
   - Writes the theme note (the existing template), and the scene file `docs/curated-themes/art/scenes-factory/<id>/scenes.json`. Each deck gets its own folder, because `theme-art-prompts.py` refuses a scene for an already-illustrated event, which every merged deck's scenes become. A scene may carry `qc_warnings`, which the QC reviewer checks.
   - Runs `python3 scripts/events/theme-art-prompts.py --scenes docs/curated-themes/art/scenes-factory/<id> --out factory/decks/<id>/prompts.csv`.
6. **Event tests:** `eventCategories`, `eventRegions`, `eventSlugUniqueness`, `eventYearRange`, `eventDetailCorpus`, `eventDateClues`, `eventNameLength`. New events have no art yet, so they are never dealt.
7. **Commit and push.** `status.js init` creates the state with every new slug `pending`, and the deck is `authored`.

---

## 5. Tasks C1–C3: Art, QC, upload, PR

### C1. Art batch (Claude in Chrome, Gemini web, at most 10 images per session)

**At the start of a session:**

- Take the lock and pick the oldest deck in `authored` or `art-in-progress`.
- Run `node scripts/factory/status.js next-batch --max 10`. If it returns nothing, exit straight away. That costs almost nothing.

**During the session:**

- Generate only the slugs it returned. The 10-image cap is enforced by the script, not by the prompt.
- After each image, `status.js mark <slug> downloaded`, commit and push. A session that loses track or crashes mid-batch loses at most one image.
- At 10 images, the session ends, even if more slugs are pending.

**The browser.** C1 uses the `mcp__claude-in-chrome__*` tools: Edward's real Chrome, already signed in to Google. The built-in browser pane has its own profile with no Google session, so Gemini loads signed out there, and credentials are never entered. Desktop scheduled runs can use the Chrome tools (Edward confirmed this on 2026-10-18). The working steps (send routine, completion polling, the download icon, the recovery playbook, the model chip) are carried over from his hand-run art task, `~/Documents/Claude/Scheduled/when-image-gen/SKILL.md`, into `.claude/skills/deck-factory/art-batch.md`.

This fixes the swap bug at its source:

- **One slug at a time, in code:** `scripts/factory/inbox.js snapshot` lists `~/Downloads` before the prompts. After the download, `inbox.js take` waits until the new files stop growing, then moves the one new image onto the slug. It records it and marks the slug `downloaded` through `status.js`. The session never renames a file itself.
- **Retries:** a `qc-fail` slug's retry prompt adds the last QC reason, for example "the previous image showed a handgun; the Flash-Matic must look like a toy ray gun".
- **Move immediately:** move it at once to `../when-images/inbox/<deck>/<slug>.jpeg`, never in a batch.
- **Record it:** append `{slug, sha256, prompt_hash, attempt, source_name, bytes, downloaded_at}` to `inbox/<deck>/manifest.jsonl`. A retry's earlier file is kept as `inbox/<deck>/rejected/<slug>.<attempt>.jpeg`.
- **Zero or two new files means retry that slug** (exit 4 or 5, and nothing moved). It never guesses.
- **Quota:** a deck needs about 25–30 new images plus retries, well inside Google AI Pro's ~100 images a day. Ten hourly sessions of 10 images can't go over it.

### C2. QC (its own session, no browser)

Picks up every slug in `downloaded`, whichever art batch produced it. Each slug then becomes `qc-pass`, `qc-fail` or `needs-human`.

#### Deterministic pre-checks (new `scripts/factory/image-precheck.py`, free)

- The file decodes and is square, 1024 or 2048 px.
- Its sha256 is the one `status.json` and the inbox manifest recorded at download, and no other image in the deck has the same bytes.
  - Comparing against `downsampled_generated_images/` by sha256, as first planned, can never match: those are re-encoded JPEGs. dHash covers that comparison.
- **dHash** (64-bit) against every image in the deck _and_ the whole catalogue. A distance of 6 or less fails.
  - The catalogue's hashes are cached in `../when-images/factory-cache/dhash.json` and refreshed by size and mtime. The first run hashes all 6,406 images in about a minute.
- **The threshold was measured on 2026-10-18:**
  - Of the 26 card-report rejects in `_replaced/`, the 9 that showed another card's picture sit at distance 0 or 1 from that card. The rest, the on-topic errors and the remakes, sit at 11-17.
  - Every catalogue image's nearest neighbour is 7 or more away, except 28 images, which are at 0, 1 or 5.
  - So 6 flags no natural pair, and catches every swap.
- **The 28 near-identical images include possible live swaps.** Most pair a live card with an orphan file. But `arpanet-created` and `khorezm-state` (both live) have identical local art, and `bosman-ruling-1995` / `civil-rights-act` sit at distance 5. These are worth a look, separately from the factory.
- It also writes what the reviewer reads: a 768 px copy (`qc/img/`, gitignored, inside the repo so the agent's reads stay in the project) and the card file (`qc/cards/`).

#### Haiku vision QC

**New agent `.claude/agents/card-art-qc.md`:**

- `model: haiku`, `effort: low`, `tools: Read, Write`. One image per agent call; no contact sheets.
- **Describe first.** It describes the image cold (subject, era cues, any text, border or frame, anything graphic). Only then does it read the card (friendly_name, description, year, scene).
- **Rubric, each check graded on its own** (from `docs/events-images/index.md` and past rejects):
  1. The subject matches the event.
  2. The era is plausible.
  3. No text, numbers or watermark (the small Gemini sparkle is only cropped).
  4. No frame, mat, mockup or wall-hung canvas.
  5. Nothing graphic.
  6. "Birth of X" shows X as an adult.
  7. Any warning the scene names.
- **Output:** writes `factory/decks/<id>/qc/<slug>.json`:
  `{slug, description, checks:{…: pass|fail|unsure}, verdict, reason}`

**Collector (new `scripts/factory/qc-collect.js`):**

- **Completeness:** every slug needs a valid verdict file. That means its slug, a cold description, all seven checks graded, and a verdict that follows from them. Missing or invalid ones are listed for a re-run, and `--apply` refuses to record anything until all are present (exit 2). This answers the skipped-sheet problem with code, not trust.
- **Second opinion:** any `fail` or `unsure` goes to a re-check, the audit's stricter pass. This is `card-art-qc` again with `model: sonnet`, writing `<slug>.recheck.json`. The re-check's verdict decides: pass, `qc-fail`, or `needs-human` if it is unsure too.
- **Retries:** a confirmed fail sets the slug to `qc-fail` with its reason. The next C1 batch regenerates it with that reason in the prompt, at most twice. After that it becomes `needs-human` and is listed in the PR.
- A failed slug's verdict files move to `qc/history/`, so the next attempt starts clean. `qc/summary.json` keeps one row per slug for the PR body.

#### Calibration before trusting it

- The golden set is `factory/qc-golden/`, built by `python3 scripts/factory/qc-golden.py build` and scored by `… score`.
  - **Bad:** the 70 images replaced in October 2026, kept in `when-images/_replaced/`: 54 swaps, 9 mockups, 3 on-topic errors and 4 remakes done on request.
  - **Good:** the art that replaced them, the same 70 cards. A paired design: every card is seen once with the wrong picture and once with the right one.
  - The images get neutral ids (`g001`…) in a fixed shuffle, so a file name never hints at the label. The images are gitignored; `golden.json`, the cards and every verdict are committed, so a re-run after a prompt change can be compared.
- Target: catches every swap and mockup, with fewer than 10% false flags. Re-run it whenever the QC prompt changes.

**Results, 2026-10-18.** One Haiku reviewer per image, with the `card-art-qc` prompt; then a Sonnet second opinion on every flag.

| Set            |   n | Haiku flagged | Still flagged after Sonnet |
| -------------- | --: | ------------: | -------------------------: |
| swap           |  54 |     54 (100%) |                   51 (94%) |
| mockup         |   9 |      9 (100%) |                   9 (100%) |
| on-topic error |   3 |             1 |                          1 |
| remake         |   4 |             1 |                          1 |
| good           |  70 |       9 (13%) |                     1 (1%) |

- **Haiku alone caught every swap and mockup**, at a 13% false-flag rate: just over the target, so the second opinion is needed. Seven of the nine were `unsure` on a generic subject ("could be any negotiation").
- **The second opinion cut false flags to 1 in 70.** That one, `antioch-crusader-conflicts`, has a painter's signature in its corner and arguably should fail anyway.
- **But it also cleared 3 real swaps**, all of which Haiku had marked only `unsure`: `darius-i-persian-king`, `caravanserai-samarkand` and `birth-richard-nixon` (Churchill's V-sign picture).
  - The precheck's dHash catches the first two: each is a copy of another card's art, at distance 0.
  - **With dHash, the pipeline catches 62 of 63.** The miss is Churchill on Nixon's birth card, a picture of a different real person in a pose both men were known for.
  - In production a swap is an off-by-one rename, so it is always a copy of another image in the deck or the catalogue: exactly what dHash sees.
- **On-topic errors are the weak spot.** It caught the handgun-like TV remote (it reads `ZENITH` lettering). It missed the 19th-century telescope and the Statue of Unity's scale, which the rubric can't see without a scene warning. So a scene that knows the trap should say so in `qc_warnings`.
- Two prompt fixes came out of the run, both in `card-art-qc.md`:
  - On a birth card, the era is judged against the person's adult life, not the birth year. Before this fix, Napoleon's correct art failed on era.
  - The second opinion reads the first verdict only **after** writing its own cold description, so the flag can't steer what it sees (`qc.md`).
- **Cost:** a Haiku review is about 70k tokens, mostly fixed overhead, and a deck of 30 needs about 30 plus a handful of Sonnet rechecks.
- The run used `general-purpose` agents with the `card-art-qc` prompt and model, because a new agent type registers only in a fresh session. A scheduled run uses the agent itself.

### C3. Ship: upload, wire, open the PR

Runs on a deck in `ready-to-ship`, or one a crashed run left at `uploaded`. Otherwise it exits. The steps are `.claude/skills/deck-factory/ship.md`, and every one is safe to repeat.

1. **Upload:** `scripts/factory/cloudinary-upload.js --deck <id>`, for every `qc-pass` slug:
   - checks that the inbox file is still the one QC passed (its sha256);
   - archives it to `generated_images/` and downsamples it with `scripts/images/downsample.py --slugs`;
   - refuses a slug that already has an asset it didn't upload, because `update-cloudinary-urls.js` keeps a slug's _oldest_ asset;
   - uploads with `public_id = <slug>_<6-char suffix>`, using the `cloudinary` SDK and the keys in `.env`;
   - checks the returned etag (an MD5 of the bytes received), then fetches the original back from the CDN, with no transformation, and compares its sha256;
   - records each in `factory/decks/<id>/uploads.json`, so a re-run skips what is done, and moves the deck to `uploaded`.
2. **Write URLs:** `node scripts/update-cloudinary-urls.js`. Then `cloudinary-upload.js --verify-urls`, which exits non-zero on failure and replaces the two checks done by eye:
   - no existing `image_url` line removed, and exactly one added per uploaded slug;
   - every URL names its own uploaded public_id, whose stem is the slug.
3. **Colours:** `python3 scripts/images/extract_colors.py --force --slugs <new slugs>`. This is the local version of `extract_event_colors.py`: it reads the downsampled JPEG on disk, so it needs no download and mints no thumbnail asset ahead of the game.
4. **Verify:** `CI=true npm test -- --watchAll=false`, `npm run lint`, `npm run typecheck`, `CI=true npm run build`. A failure stops here, with the deck left at `uploaded`.

#### Open the PR

- **Title:** `chore(events): add the <Theme> curated deck`. A chore title means no daily release and no release note. Use `feat` plus a note if decks should show up in the changelog.
- `backlog.js set-status <id> done` goes into the PR, since merging it is what makes the theme done. The deck moves to `pr-open` once the PR exists.
- **Body** (new `scripts/factory/pr-body.js`):
  - The deck: year, card, NEW or reused, difficulty band.
  - The gate report, and the fact-check flags.
  - **A QC table of thumbnails** with each verdict and reason. Thumbnails use the existing `thumbnail` size, so no new transformation size (see `docs/cloudinary-cost-controls.md`).
  - The `needs-human` list.
  - The theme JSON ready to dispatch.
- **If a PR is closed unmerged,** list health lists its assets for `cloudinary_delete_list.json`. Queuing and deleting both wait for Edward's approval.

---

## 6. Task D: Schedule merged decks (at most daily)

- **Scheduling stays a workflow dispatch, never a commit** (a CLAUDE.md rule).
- **A merged deck** is one whose `factory/decks/<id>/deck.json` is on main. It is pending until its id is on `/api/themes`, so D needs no state of its own.
- **For each pending deck** (`.claude/skills/deck-factory/schedule.md`):
  1. `scripts/factory/next-slot.js --deck <id>` reads `/api/themes` and picks the earliest open Monday or Friday, gaps included. The date must open (D-1 10:00Z) more than 48 hours from now, so a validate today and a publish tomorrow both land before it goes live anywhere.
     - A second pending deck in the same run gets the next slot.
     - The theme JSON, with its date, goes to `factory/dispatch/<id>.json`, plus a lasting copy in `../when-images/factory-reports/`.
  2. It runs `gh workflow run publish-theme.yml -f mode=validate -F theme=@…` and reads the run's report.
  3. The calendar is the record of the date; nothing is committed.
- **For now D only validates and reports**, with the exact publish command for Edward. Publishing waits for his approval; the settings deny `mode=publish`. He switches it on once he trusts it.
- `next-slot.js --report` gives the buffer, as days to the first open Monday or Friday. On 2026-10-18 that was 8 days, to 2026-10-26: the gap phase 0 names, plus the eight Sunday themes.
- **No code needs changing to go beyond Mon/Fri:** curated themes can sit on any date, and no code knows about weekdays. Curated days are added as the buffer allows.

---

## 7. Phase 0: groundwork, before the factory

1. **Fix the calendar.**
   - Fill the 2026-10-26 to 2026-11-20 gap.
   - Move the eight stray Sunday themes onto Mon/Fri.
   - Apply the same-year fixes for `money` and `walls`.
   - Publish bank 2's 22 ready themes. That gives about 11 weeks of buffer while the factory is built.
2. **Add CI on pull requests. Done.** `.github/workflows/ci.yml` runs `npm ci`, lint, both typechecks, the tests, a `CI=true` build and `theme:verify` on every pull request. Before it, tests ran only after a merge had already deployed.
   - `theme:verify` gates only themes with a date still to come. A theme whose dates have all passed can't be rewritten (the date rule in [index.md](index.md)), so it is reported but never fails the run. English History (2026-08-20) lost `church-of-england` to a duplicate retirement, and would otherwise fail every PR.
3. **Move the image scripts into the repo. Done.** `downsample.py`, `extract_colors.py` and `find_images_to_upload.js` are copied from `when-images/scripts/` to `scripts/images/`. They find the image folders through `WHEN_IMAGES_DIR`, and `downsample.py` and `extract_colors.py` take `--slugs`, so the ship stage can process one deck's art and nothing else. The images themselves stay outside git.
4. **Build the theme list** (section 3) in one interactive session. Edward reviews and merges it.

## 8. Rollout and the path to full automation

1. **QC first.** Build the agent, collector and golden set. This is also useful for re-auditing the whole catalogue.
2. **By hand first.** Click **Run now** on the one task, approving its permissions, until a deck has gone all the way through, following [the checklist below](#the-first-runs). Confirm that C1 stops at 10 images and that the next art run carries on.
3. **Give the task its cron**, `5 * * * *` (hourly) or `5 */2 * * *` (section 2 has the pace of each). Production runs ahead of the calendar until there are about 6 weeks of buffer. D stays validate-only: publishing is Edward's.
4. _(Folded into step 3: list health and scheduling run when due, from the same task.)_
5. **Graduate to auto-merge when:**
   - 10 decks in a row are merged with no edits;
   - golden-set recall stays at 100%;
   - card reports on factory decks stay at or below the catalogue's ~1.2%.

   Then turn on GitHub auto-merge for factory PRs that pass every check, keep a daily digest, and keep a blind human spot check of about 5% of auto-approved images.

### The first runs

A checklist for the first manual runs of the one task. Each Run now does one stage, the one the state machine picks, and its reply says which. The first deck is a real one: Sweet Tooth, the top of the list. A deck made only for testing would mean uploading throwaway art to Cloudinary and then deleting it. Its PR is reviewed like any other.

**Once, before any run:**

1. In Claude Desktop, open the **Deck factory** task in Scheduled and click Edit:
   - Folder `…/timeline/when-factory`;
   - **Worktree off**;
   - permission mode **Ask**, so the first runs' approvals are stored on the task.

   Open the folder once in a normal session and accept the workspace-trust prompt. A project's `.claude/settings.json` applies only to a trusted folder.

2. Chrome is signed in to Google, the Claude in Chrome extension is connected, and Gemini offers Pro.
3. "Keep computer awake" is on.

**Then click Run now, one run at a time.** Approve each prompt with "always allow", and check what the stage it took leaves. On a fresh factory the runs come in this order:

| #   | Stage `auto` takes | What a good run leaves                                                                                                                                                                                                                                           |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A: list health     | A report in the run, and `../when-images/factory-reports/health-<date>.md`. Nothing committed. It has never run, so it goes first.                                                                                                                               |
| 2   | B: author          | Branch `claude/deck-sweet-tooth` on origin, and `node scripts/factory/decks.js` in the clone shows `sweet-tooth: authored`. Read `spine.json`, `deck.json` and `fact-check.json` in `factory/decks/sweet-tooth/`. This is the long one: allow a couple of hours. |
| 3   | C1: art batch      | At most 10 images in `../when-images/inbox/sweet-tooth/`, one `downloaded` commit each, and the session stops at 10. Then check that each file's `shasum -a 256` matches its line in `manifest.jsonl`.                                                           |
| 4   | C2: QC             | `qc/<slug>.json` for every downloaded slug, `qc/summary.json`, and each slug `qc-pass`, `qc-fail` or `needs-human`. QC comes before the next art batch, since it is further downstream.                                                                          |
| 5   | C1, C2, C1, C2 …   | Until `node scripts/factory/status.js summary --deck sweet-tooth` says `ready-to-ship`.                                                                                                                                                                          |
| 6   | C3: ship           | `uploads.json` with every asset verified, a green `--verify-urls`, and a PR titled "chore(events): add the Sweet Tooth curated deck" whose CI passes.                                                                                                            |
| 7   | B: author, again   | The next theme on the list. A PR waiting for review doesn't hold the factory up: only decks between authoring and `pr-open` count towards the cap of 2.                                                                                                          |
| 8   | D: schedule        | Once the PR has merged: a validate run for Sweet Tooth's date, and the exact publish command. Publishing is Edward's to run.                                                                                                                                     |

`../when-images/factory-runs.json` shows each stage's last run and outcome. To force a stage, run "Run the deck-factory skill, stage: <name>" in an ordinary session in the clone.

**Resilience, once C1 has run cleanly** (the checks in section 10):

- Click Run now while an art batch is running: the second run must exit with "locked by art-batch".
- Force a stage to fail (sign Chrome out before an art run): it must end `blocked`, and the next runs must skip art for 6 hours while QC and ship carry on.
- Stop C3 partway through, then run it again: it must resume from `status.json`, skipping the uploads already verified.

**Things the first runs settle:**

- Whether scheduled runs honour the project's `.claude/settings.json`. If a run keeps asking for commands the allow list covers, copy the lists into `~/.claude/settings.json`.
- Whether the deny list holds. In the session that built the factory, a `gh pr merge` the project settings deny went through. That session most likely loaded its settings before the file existed. A fresh scheduled run should be refused; check that once by asking a run to try it.

## 9. Files

**New:**

- `.claude/skills/deck-factory/`: `SKILL.md`, plus one file per stage: `theme-list.md` (the build session), `health.md`, `author.md`, `art-batch.md`, `qc.md`, `ship.md`, `schedule.md`
- `.claude/agents/`: `theme-spine-writer.md`, `deck-reconciler.md`, `deck-fact-checker.md`, `card-art-qc.md`
- `scripts/factory/`:
  - the state: `status.js` (with `status-lib.js`), `backlog.js`, `decks.js`, `lock.js`
  - the preamble and merging: `start.js`, `json-merge.js`
  - authoring: `spine-matches.js`, `add-deck-events.js`
  - art and QC: `inbox.js`, `image-precheck.py`, `qc-collect.js`
  - shipping: `cloudinary-upload.js`, `pr-body.js`
  - scheduling and health: `next-slot.js`, `health.js`
  - shared: `cli.js`, `config.js`
  - tests: `factory.test.js`
- `scripts/themes/earlier-themes.js`: every theme a new deck must stay distinct from, for `--overlap`
- `scripts/images/`: `downsample.py`, `extract_colors.py`, `find_images_to_upload.js`, `paths.py`
- `.github/workflows/ci.yml`
- `.claude/settings.json`: the allow and deny lists for unattended runs
- `docs/curated-themes/factory.md` (this document)
- `docs/curated-themes/backlog.json` (the ordered theme list), checked by a new test, `backlogSchema.test.ts`: unique ids, names of 20 characters or fewer, a status from the allowed set, and every neighbour id present in the list

**Changed:**

- `scripts/theme-gap.js`: a new `--overlap` flag, which counts the cards a deck shares with each earlier theme
- `scripts/verify-themes.js`: gates only themes with a date still to come

**Reused unchanged:**

- `theme-art-prompts.py`
- the region, year-range and detail pipelines and their agents
- `update-cloudinary-urls.js`
- `publish-theme.js` / `publish-theme.yml`

## 10. Verification

- **Theme list:**
  - `backlogSchema.test.ts` passes.
  - Every theme has a boundary line.
  - A spot check of 5 random neighbour pairs reads as clearly distinct.
  - `theme-gap.js --overlap` on the first factory deck reports at most 4 shared cards with any earlier theme.
- **QC:**
  - Run the golden set and report recall and false-flag rate.
  - Plant 3 swaps and one framed image in a test deck; all 4 must be caught.
  - **Golden set, 2026-10-18: done.** The results are in [Calibration](#calibration-before-trusting-it): 62 of 63 swaps and mockups caught with dHash, and 1 of 70 false flags.
  - Delete one verdict file; the collector must fail.
- **Batching:**
  - Seed a test deck with 23 `pending` slugs. C1 must run 3 sessions (10, 10, 3), and a fourth run must exit at once.
  - Kill a session mid-batch. Only the in-flight slug is redone.
  - **State engine, 2026-10-18: passed.** `factory.test.js` (28 tests) covers:
    - the 23-slug deck, through `status.js`: 10, 10, 3, then an empty batch;
    - a session killed mid-batch;
    - every transition, the retry cap, a stale lock (by age, by a dead PID, half-written) and a held one;
    - the merge driver;
    - deck picking and the guard.
  - In the clone, two `start.js qc` started at once: one took the lock and the other exited with "locked by qc". Run from Edward's `when` checkout, `start.js` refused (exit 2) without touching anything.
  - A real `git merge` of two branches that each appended a card to a copy of `themes.json` merged cleanly with the driver: a 4-line diff, the file's layout kept.
- **Naming:** a 3-slug dry run of C1. The manifest sha256, the inbox file and the Cloudinary bytes fetched back must all match.
- **End to end:** one deck goes from backlog to an open PR with no manual step. CI is green. After merge, D's validate dispatch reports the theme clean.
- **Resilience:**
  - Start C1 twice at once; the lock must hold.
  - Kill C3 mid-stage; a re-run must resume from `status.json`.

## Sources

- [Claude Code Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)
- LLM-as-judge practice for images:
  - [DynT2I-Eval](https://arxiv.org/pdf/2605.06170)
  - [Bi-Level Prompt Optimization for Multimodal LLM-as-a-Judge](https://arxiv.org/pdf/2602.11340)
  - [AutoRubric-T2I](https://arxiv.org/pdf/2605.17602)
  - [MJ-Bench](https://alphaxiv.org/benchmarks/university-of-chicago/mj-bench)
  - [Multimodal LLM-as-a-judge](https://futureagi.com/blog/multimodal-llm-as-a-judge/)
- Human-in-the-loop review:
  - [Designing human-in-the-loop workflows](https://velt.dev/blog/designing-human-in-the-loop-workflows-ai-products)
  - [Human-in-the-loop content marketing](https://elitecontentmarketer.com/human-in-the-loop-content-marketing)
- [Gemini image daily limits by plan](https://ai.zenken.co.jp/en/post/gemini-image-guide/)
