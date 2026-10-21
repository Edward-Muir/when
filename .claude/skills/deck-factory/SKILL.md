---
name: deck-factory
description: Runs the curated deck factory for the When timeline game, one stage per run (list health, author, art batch, QC, ship, schedule), picking the stage from the deck state machine unless one is named; also the interactive theme-list session. Use when a scheduled task says "Run the deck-factory skill", or when asked to run or debug a factory stage.
---

# The curated deck factory

One scheduled task turns the theme list (`docs/curated-themes/backlog.json`) into finished
curated decks, each as a pull request for Edward to review. Every run does exactly one stage, and
the state machine picks which. The design and every decision
behind it are in `docs/curated-themes/factory.md`; read it when something here is unclear.

## Pick the stage

**Usually the prompt names no stage: the run is `auto`.** `start.js` (step 2 below) chooses the
stage and returns it as `stage`. If the prompt names one ("stage: qc"), pass that name instead;
that forces the stage, which is for debugging and for Edward's manual runs. Either way, read the
chosen stage's file next to this one and follow it exactly.

What `auto` takes, first match wins:

1. list health, when its last run is a week old;
2. schedule, when a merged deck isn't on the calendar and it hasn't run today;
3. ship, then QC, then an art batch, so the deck in flight finishes first;
4. author, while fewer than 2 decks are in flight.

A stage that last ended `blocked` or `failed` is skipped for 6 hours, except an art batch, which
is simply tried again next run. An art batch that hit Gemini's daily cap is skipped until tomorrow.

| Stage        | Was | File            | Does                                                     |
| ------------ | --- | --------------- | -------------------------------------------------------- |
| `health`     | A   | `health.md`     | weekly report: themes left, calendar buffer, stuck decks |
| `author`     | B   | `author.md`     | writes the next theme's deck, without images             |
| `art-batch`  | C1  | `art-batch.md`  | makes at most 10 images in Gemini, then stops            |
| `qc`         | C2  | `qc.md`         | checks every downloaded image                            |
| `ship`       | C3  | `ship.md`       | uploads the art, wires it in, opens the PR               |
| `schedule`   | D   | `schedule.md`   | validates merged decks against the calendar              |
| `theme-list` |     | `theme-list.md` | interactive only: rebuilds the theme list with Edward    |

`theme-list` is run with Edward in his own checkout, not by a scheduled task, and skips the
preamble below.

## The preamble: every stage starts with exactly this

1. Run `pwd`. If the folder isn't `…/when-factory`, stop and say so. The factory runs only in
   its own clone, because the next step resets the working tree.
2. Run `node scripts/factory/start.js`, or `node scripts/factory/start.js <stage>` when the
   prompt names one, and read the **last line** of its output, a JSON object.
   - `"action": "exit"`: there is nothing to do (another stage holds the lock, or no deck has
     work). Reply with its `reason` in one line and stop. Don't commit anything.
   - `"action": "blocked"`: something needs Edward (a merge conflict, a failed sync). Reply with
     the reason and any `conflicted` files, and stop.
   - Whatever the action, the JSON may also carry `refreshed_prs` (open deck PRs that were
     brought up to date with main) and `refresh_blocked` (ones whose update conflicts, with the
     files). Mention both in the report. A `refresh_blocked` needs Edward. Never merge a PR or push
     to main to resolve it.
   - `"action": "run"`: carry on. Keep its `stage`, `token`, `deck` and `branch` for the rest
     of the run.
3. Follow the file for that `stage`.
4. **Always end by releasing the lock, and say how the run ended:**
   `node scripts/factory/status.js unlock --token <token> --outcome <outcome>`
   - `ok`: the stage did its step (including "nothing left to do" inside the stage);
   - `blocked`: it stopped on something that needs Edward or the outside world (Chrome signed
     out, a conflict, a failing check);
   - `failed`: it broke in a way the stage file doesn't cover;
   - `quota`: only an art batch, when Gemini says no more images today.

   The outcome is what makes the next `auto` run back off a broken stage instead of retrying it
   every hour. A held lock goes stale after 2 hours, but until then it blocks every run.

During a long stage, run `node scripts/factory/status.js refresh --token <token>` between
steps, so the lock doesn't go stale under you.

## Rules for every stage

- **Run one command per Bash call.** Don't chain with `&&`, `;` or pipes: unattended runs are
  allowed by narrow per-command rules, and a chained command won't match them, so the run
  stalls on a permission prompt nobody is there to answer.
- **Commit and push only to the deck's own branch**, `claude/deck-<id>`. Use
  `git add <paths>`, then `git commit -m "<message>"`, then `git push origin claude/deck-<id>`.
  Commit messages are Conventional Commits with the `chore(factory):` prefix, unless a stage
  says otherwise.
- **Never** push to `main`, force-push, merge a PR, publish a theme (validate only), or delete
  anything from Cloudinary. All of those are Edward's, and the settings deny most of them.
- `scripts/factory/status.js` is the only thing that changes `status.json`, and
  `scripts/factory/backlog.js` the only thing that changes `backlog.json`. Never edit either
  by hand.
- Never edit files under `public/events/` by hand. Each change goes through its script.
- If a step fails in a way the stage file doesn't cover, stop. Commit what is already done if it
  is coherent, unlock, and report what failed and what you would try next. A clear stop is
  better than a guess: the next run resumes from `status.json`.

## The report

End every run with a short reply (Desktop shows it in the task's Runs pane), at most 6 lines:

1. the stage and the deck;
2. what changed (counts, not lists);
3. anything that needs Edward, such as a `needs-human` slug, a skipped theme or a PR to review;
4. what the next run will do.
