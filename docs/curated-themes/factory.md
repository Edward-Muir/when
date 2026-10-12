# Curated Deck Factory

A set of scheduled tasks on Edward's laptop that turns out one finished curated deck per day as a pull request. Edward reviews and merges each one, and it gets scheduled. The aim is full automation once the factory has earned it.

**Status: planned, not built.** Nothing below exists yet except the scripts listed as reused. Build it in the order in section 8, and update this page as each piece lands.

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
- Art runs in sessions of at most 10 images, because Sonnet loses track beyond that while controlling the computer.
- Gemini in the browser makes the images, driven by computer use.
- QC runs on Claude Code Haiku sub-agents.
- Cloudinary upload is automatic, using keys from the laptop's `.env`.
- For now each deck arrives as a PR to review and merge.

---

## 2. The shape: six local tasks and a state machine

| Task                    | Schedule                                             | Does                                                                                  | Leaves behind                                                              |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| _(once)_ **Theme list** | interactive session, repeated when the list runs low | builds the ordered list of about 200 themes, kept apart from each other               | `docs/curated-themes/backlog.json`                                         |
| **A. List health**      | weekly, Sun 07:05                                    | themes left, calendar buffer and drift, skipped themes                                | a health report                                                            |
| **B. Author**           | daily 06:05                                          | takes the next `queued` theme from the list and writes the deck, without images       | branch `claude/deck-<id>`, deck `stage=authored`, every new slug `pending` |
| **C1. Art batch**       | hourly :05, 08:05 to 17:05                           | generates **at most 10 images**, then the session ends                                | those slugs `downloaded`                                                   |
| **C2. QC**              | hourly :40, 08:40 to 17:40                           | pre-checks and Haiku QC on every `downloaded` slug                                    | each slug `qc-pass`, `qc-fail` (goes back to C1) or `needs-human`          |
| **C3. Ship**            | daily 18:05                                          | once no slug is `pending`, `downloaded` or `qc-fail`: upload, wire, test, open the PR | deck `stage=pr-open`                                                       |
| **D. Schedule**         | daily 19:05                                          | dispatches merged decks onto the calendar                                             | a theme on `/api/themes`                                                   |

**Why art runs in batches of 10.** Sonnet loses track when it controls the computer for more than about 10 images in one session. So each art session handles at most 10 slugs, then ends.

- The next hourly run starts a fresh session with a clean context and takes the next 10 `pending` or `qc-fail` slugs.
- A typical deck has about 25–30 new images, so it takes 3–4 art sessions plus a retry session. The deck is ready to ship the same afternoon.
- Ten hourly slots is at most 100 images a day, the same as the Google AI Pro daily cap. So the schedule itself keeps the factory inside the quota.
- QC is a separate task, so the art session's context holds only Gemini work. A QC failure flips the slug back to `qc-fail`, and the next art batch picks it up.

**How the tasks are set up** (Claude Desktop, Code tab, then Routines, New routine, **Local**):

- **Worktree on** for each task, so runs never touch Edward's working copy.
- **"Keep computer awake" on** in Settings.
- **Permissions approved once:** click **Run now** once and choose "always allow" for each prompt, so scheduled runs don't stall.
- **Staggered start times:** Desktop skips a run while another scheduled task is still running, so the start times are hours apart.
- **One-line prompts.** Each prompt is just "Run the deck-factory skill, stage: <name>". The logic lives in versioned files in the repo (`.claude/skills/deck-factory/`).

**State lives on each deck branch** in `factory/decks/<id>/status.json`:

- **Deck `stage`:** `authored` → `art-in-progress` → `ready-to-ship` → `uploaded` → `pr-open` → `merged` → `scheduled`
- **Per-slug `state`:** `pending` → `downloaded` → `qc-pass` | `qc-fail` (back to C1, at most 2 retries) | `needs-human`
- Each slug also records an attempt count, the last QC reason (fed into the retry prompt) and its file's sha256.
- A deck becomes `ready-to-ship` when every slug is `qc-pass` or `needs-human`.
- `scripts/factory/status.js` is the only code that reads and writes this file:
  - `next-batch --max 10` returns the next slugs for an art session.
  - `mark <slug> <state>` updates one slug.
  - `summary` prints the deck's progress.

Every stage reads the status, does the next step, commits and pushes. That makes it safe for:

- **catch-up runs:** Desktop runs one missed run on wake, possibly hours late;
- **skipped runs:** the next run just picks up;
- **crashes:** a re-run resumes from `status.json`.

A lock file (`../when-images/factory.lock`) stops two runs of the same stage overlapping. Each run handles **one deck at most**.

---

## 3. The theme list: built once up front, then worked through

Themes are not invented one at a time. One interactive session with Edward builds a **long, ordered list of about 200 themes** in `docs/curated-themes/backlog.json`. That is roughly six months of daily decks. Task B takes the next theme from the top each day.

Seeing the whole list at once is what keeps themes from overlapping. Each new theme is drawn against every theme already on the list, rather than against a memory of last week's.

### Building the list (one session, interactive)

1. **Seed with what exists.**
   - The 41 themes in `publish-inputs.md`, plus `english-history` and `indonesia` from the live calendar.
   - Enter them as `status: "done"`, so new themes are drawn around them.
   - The input is theme names and scope rules only, never events. This keeps the blind principle.
2. **Generate against a coverage grid.**
   - Candidates are spread across the 21 categories × 6 eras × the macro-regions in `src/data/regions.json`.
   - Each grid cell shows how many themes already touch it, so thin areas get filled. Today's list leans to Europe, war and early-modern.
   - Several parallel Sonnet agents each take one slice of the grid and propose 40–60 themes.
3. **Overlap pass.**
   - A fresh agent sorts all candidates into clusters (for example ships / sea battles / explorers / pirates) and checks each cluster pair by pair.
   - Every theme gets a **boundary line** naming its nearest neighbours and what belongs to them, for example "Ships: vessels and shipbuilding; naval battles belong to Sea Battles, voyages to Crossings."
   - Near-duplicates are merged or cut, and too-broad themes are split.
4. **Gate each survivor.**
   - Name: 20 characters or fewer, and a unique id.
   - Scope rule: yes/no, and `npm run theme:gap -- --list` returns fewer than about 100 `\b` keyword hits.
   - Expected size: the agent sketches about 10 example beats to show the theme can fill 30–36 cards.
5. **Order the list** so consecutive days vary. No two neighbours share a category, a dominant era or a dominant region. Big crowd-pleasers are spread out rather than front-loaded.
6. **Edward reviews the list** as a PR: reorders, cuts, adds. After merge the factory only reads it, apart from marking progress.

**One entry in `backlog.json`:**

```json
{
  "id": "sea-battles",
  "name": "Sea Battles",
  "scope": "Yes if it is a named naval engagement between fleets.",
  "boundary": "Ships, the vessels themselves; Pirates; Crossings, the voyages",
  "neighbours": ["ships", "pirates", "crossings"],
  "grid": { "categories": ["conflict"], "eras": ["ancient", "modern"], "regions": ["Global"] },
  "example_beats": ["Salamis", "Lepanto", "Trafalgar", "Midway"],
  "status": "queued"
}
```

`status` moves `queued` → `authoring` → `pr-open` → `done`. A theme can also be marked `skipped` with a reason, for example when it can't fill 30 cards.

### Overlap control while decks are authored

The list keeps themes apart, but cards can still be shared: 59 slugs already appear in two or more themes.

- The reconcile step (task B, step 2) reports how many of the deck's cards already appear in each earlier theme.
- **Gate: at most 4 cards shared with any single earlier theme.** Above that, the deck swaps in alternatives or drops to 30 cards.
- If the gate can't be met, the theme is marked `skipped` with a reason, and the day falls back to the next theme on the list.

### Task A: list health (weekly)

A light weekly check, not a generator:

- **Themes left:** with fewer than 30 `queued`, it says Edward should run another list-building session. That's about a month of warning.
- `npm run theme:verify`
- days of curated buffer ahead
- calendar drift
- pending gate failures
- skipped themes and why
- The report goes in a weekly PR description or a short `factory/health.md` commit.

---

## 4. Task B: Author one deck (daily)

Takes the first `queued` theme in `backlog.json`, sets it to `authoring`, and runs the Bank 2 method. The spine agent gets the theme's scope rule and boundary line, so it stays inside its lane. The blind step is enforced by which tools each agent gets, not by asking nicely.

1. **Blind spine.** New agent `.claude/agents/theme-spine-writer.md` (Sonnet).
   - Tools: `WebSearch, Write` only. With no Read, Glob or Grep it **cannot** see the catalogue.
   - Writes 40–45 dated beats, with one search per date.
2. **Reconcile.** New agent `.claude/agents/deck-reconciler.md` (Sonnet, full read access).
   - Matches beats by year and name, the `english-civil-war-aftermath` trap.
   - Reuses existing cards and writes new events per the `add-events` skill.
   - Cuts the deck to 30–36 cards against the gates in `scripts/theme-gap.js`: size, at least 5 band-0 footholds, no two cards in the same year.
   - **Overlap gate:** at most 4 cards shared with any single earlier theme. Gate checks go in `scripts/theme-gap.js` as a new `--overlap` flag.
3. **Fact check.** New agent `.claude/agents/deck-fact-checker.md` (Sonnet, WebSearch).
   - Checks each new event's year, name and description against sources.
   - Lists anything it can't support for the PR. This stands in for Bank 2's hand "Review edits".
4. **Existing pipelines, unchanged:**
   - `region-report.js` → `event-region-tagger` → `region-apply.js`
   - `year-range-report.js` → `event-range-writer` → `year-range-apply.js` (ledger in `year-range-decided.json`)
   - `detail-report.js` → `event-detail-writer` → `detail-apply.js`
   - Difficulty set against `docs/events-images/difficulty-grading-rubric.md`
5. **Theme note and scenes.**
   - Writes the theme note (the existing template), and the scene file `docs/curated-themes/art/scenes-factory/<id>.json`.
   - Runs `python3 scripts/events/theme-art-prompts.py --scenes … --out factory/decks/<id>/prompts.csv`.
6. **Event tests:** `eventCategories`, `eventRegions`, `eventSlugUniqueness`, `eventYearRange`, `eventDetailCorpus`, `eventDateClues`, `eventNameLength`. New events have no art yet, so they are never dealt.
7. **Commit and push.** Commits to `claude/deck-<id>` with `status=authored`.

---

## 5. Tasks C1–C3: Art, QC, upload, PR

### C1. Art batch (hourly, computer use, Gemini web, at most 10 images per session)

**At the start of a session:**

- Take the lock and pick the oldest deck in `authored` or `art-in-progress`.
- Run `node scripts/factory/status.js next-batch --max 10`. If it returns nothing, exit straight away. That costs almost nothing.

**During the session:**

- Generate only the slugs it returned. The 10-image cap is enforced by the script, not by the prompt.
- After each image, `status.js mark <slug> downloaded`, commit and push. A session that loses track or crashes mid-batch loses at most one image.
- At 10 images, the session ends, even if more slugs are pending.

This fixes the swap bug at its source:

- **One slug at a time:** list `~/Downloads`, send the research prompt and then the image prompt in one fresh chat, download, and wait for exactly one new file.
- **Retries:** a `qc-fail` slug's retry prompt adds the last QC reason, for example "the previous image showed a handgun; the Flash-Matic must look like a toy ray gun".
- **Move immediately:** move it at once to `../when-images/inbox/<deck>/<slug>.jpeg`, never in a batch.
- **Record it:** append `{slug, sha256, prompt_hash, downloaded_at}` to `inbox/<deck>/manifest.jsonl`.
- **Zero or two new files means retry that slug.** It never guesses.
- **Quota:** a deck needs about 25–30 new images plus retries, well inside Google AI Pro's ~100 images a day. Ten hourly sessions of 10 images can't go over it.

### C2. QC (hourly at :40, its own session, no computer use)

Picks up every slug in `downloaded`, whichever art batch produced it. Each slug then becomes `qc-pass`, `qc-fail` or `needs-human`.

#### Deterministic pre-checks (new `scripts/factory/image-precheck.py`, free)

- The file decodes and is square, 1024 or 2048 px.
- Its sha256 is unique within the deck and across `downsampled_generated_images/`.
- **dHash** against every image in the deck _and_ the whole catalogue. A near-duplicate fails.

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

- **Completeness:** every slug needs a valid verdict file. Missing ones are re-run, and the stage fails until all are present. This answers the skipped-sheet problem with code, not trust.
- **Second opinion:** any `fail` or `unsure` goes to a Sonnet re-check, the audit's stricter pass.
- **Retries:** a confirmed fail sets the slug to `qc-fail` with its reason. The next C1 batch regenerates it with that reason in the prompt, at most twice. After that it becomes `needs-human` and is listed in the PR.

#### Calibration before trusting it

- Build `factory/qc-golden/` from the 70 known-bad images kept in `when-images/_replaced/`, plus about 70 known-good.
- Record recall and false-flag rate in this doc.
- Target: catches every swap and mockup, with fewer than 10% false flags.
- Re-run it whenever the QC prompt changes.

### C3. Ship (daily 18:05): upload, wire, open the PR

Runs only on a deck in `ready-to-ship`. Otherwise it exits.

1. **Downsample:** `downsample.py`, moved into the repo as `scripts/images/`.
2. **Upload:** new `scripts/factory/cloudinary-upload.js`.
   - Uses the `cloudinary` SDK already in package.json and reads keys from `.env`.
   - Sets `public_id = <slug>_<6-char suffix>`.
   - Fetches each asset back and compares its hash with the manifest.
3. **Write URLs:** `node scripts/update-cloudinary-urls.js`. Then an automatic check that exits non-zero on failure, replacing two manual checks:
   - The count of changed `image_url` lines equals the deck's new slugs.
   - Every URL's stem equals its slug.
4. **Colours:** `python3 scripts/extract_event_colors.py --force --slugs <new slugs>`.
5. **Verify:** `CI=true npm test -- --watchAll=false`, `npm run lint`, `npm run typecheck`, `CI=true npm run build`.

#### Open the PR

- **Title:** `chore(events): add the <Theme> curated deck`. A chore title means no daily release and no release note. Use `feat` plus a note if decks should show up in the changelog.
- **Body** (new `scripts/factory/pr-body.js`):
  - The deck: year, card, NEW or reused, difficulty band.
  - The gate report, and the fact-check flags.
  - **A QC table of thumbnails** with each verdict and reason. Thumbnails use the existing `thumbnail` size, so no new transformation size (see `docs/cloudinary-cost-controls.md`).
  - The `needs-human` list.
  - The theme JSON ready to dispatch.
- **If a PR is closed unmerged,** its assets are queued in `cloudinary_delete_list.json`. Deleting still waits for Edward's approval.

---

## 6. Task D: Schedule merged decks (daily)

- **Scheduling stays a workflow dispatch, never a commit** (a CLAUDE.md rule).
- **For each merged deck PR:**
  1. New `scripts/factory/next-slot.js` reads `/api/themes` and picks the earliest open date.
  2. It runs `gh workflow run publish-theme.yml` with `mode=validate`, then `mode=publish`.
  3. It records the date in the theme note.
- **At first, D only prepares the dispatch and reports it.** Edward switches on publishing once he trusts it.
- **No code needs changing to go beyond Mon/Fri:** curated themes can sit on any date, and no code knows about weekdays. Curated days are added as the buffer allows.

---

## 7. Phase 0: groundwork, before the factory

1. **Fix the calendar.**
   - Fill the 2026-10-26 to 2026-11-20 gap.
   - Move the eight stray Sunday themes onto Mon/Fri.
   - Apply the same-year fixes for `money` and `walls`.
   - Publish bank 2's 22 ready themes. That gives about 11 weeks of buffer while the factory is built.
2. **Add CI on pull requests.** New `.github/workflows/ci.yml` runs lint, typecheck, tests, build and `theme:verify`. Today tests run only after a merge has already deployed.
3. **Move the image scripts into the repo.** `downsample.py` and `find_images_to_upload.js` move from `when-images` to `scripts/images/`. The images themselves stay outside git.
4. **Build the theme list** (section 3) in one interactive session. Edward reviews and merges it.

## 8. Rollout and the path to full automation

1. **QC first.** Build the agent, collector and golden set. This is also useful for re-auditing the whole catalogue.
2. **C1–C3 by hand.** Run them with **Run now** on a hand-authored deck, approving each task's permissions. Confirm that C1 stops at 10 images and that the next run carries on.
3. **Turn on B daily, C1/C2 hourly in the daytime, and C3 daily.** Hourly schedules within a time window are set by asking Claude in a Desktop session, because the preset picker only offers plain Hourly. Production runs ahead of the calendar until there are about 6 weeks of buffer.
4. **Turn on A (list health) weekly and D daily** (D in prepare-only mode at first).
5. **Graduate to auto-merge when:**
   - 10 decks in a row are merged with no edits;
   - golden-set recall stays at 100%;
   - card reports on factory decks stay at or below the catalogue's ~1.2%.

   Then turn on GitHub auto-merge for factory PRs that pass every check, keep a daily digest, and keep a blind human spot check of about 5% of auto-approved images.

## 9. Files

**New:**

- `.claude/skills/deck-factory/`: `SKILL.md`, plus one file per stage: `theme-list.md` (the build session), `health.md`, `author.md`, `art-batch.md`, `qc.md`, `ship.md`, `schedule.md`
- `.claude/agents/`: `theme-spine-writer.md`, `deck-reconciler.md`, `deck-fact-checker.md`, `card-art-qc.md`
- `scripts/factory/`: `status.js`, `image-precheck.py`, `qc-collect.js`, `cloudinary-upload.js`, `pr-body.js`, `next-slot.js`
- `scripts/images/`
- `.github/workflows/ci.yml`
- `docs/curated-themes/factory.md` (this document)
- `docs/curated-themes/backlog.json` (the ordered theme list), checked by a new test, `backlogSchema.test.ts`: unique ids, names of 20 characters or fewer, a status from the allowed set, and every neighbour id present in the list

**Changed:**

- `scripts/theme-gap.js`: a new `--overlap` flag, which counts the cards a deck shares with each earlier theme

**Reused unchanged:**

- `theme-art-prompts.py`
- the region, year-range and detail pipelines and their agents
- `update-cloudinary-urls.js`, `extract_event_colors.py`
- `publish-theme.js` / `publish-theme.yml`, `verify-themes.js`

## 10. Verification

- **Theme list:**
  - `backlogSchema.test.ts` passes.
  - Every theme has a boundary line.
  - A spot check of 5 random neighbour pairs reads as clearly distinct.
  - `theme-gap.js --overlap` on the first factory deck reports at most 4 shared cards with any earlier theme.
- **QC:**
  - Run the golden set and report recall and false-flag rate.
  - Plant 3 swaps and one framed image in a test deck; all 4 must be caught.
  - Delete one verdict file; the collector must fail.
- **Batching:**
  - Seed a test deck with 23 `pending` slugs. C1 must run 3 sessions (10, 10, 3), and a fourth run must exit at once.
  - Kill a session mid-batch. Only the in-flight slug is redone.
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
