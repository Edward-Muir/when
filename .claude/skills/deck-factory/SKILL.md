---
name: deck-factory
description: Runs one stage of the curated deck factory for the When timeline game (list health, author, art batch, QC, ship, schedule, or the interactive theme-list session). Use when a scheduled task says "Run the deck-factory skill, stage: <name>", or when asked to run or debug a factory stage.
---

# The curated deck factory

Six scheduled tasks turn the theme list (`docs/curated-themes/backlog.json`) into one finished
curated deck a day, each as a pull request for Edward to review. The design and every decision
behind it are in `docs/curated-themes/factory.md`; read it when something here is unclear.

## Pick the stage

The prompt names it. Read that stage's file next to this one and follow it exactly.

| Stage        | Alias | File            | Does                                                     |
| ------------ | ----- | --------------- | -------------------------------------------------------- |
| `health`     | A     | `health.md`     | weekly report: themes left, calendar buffer, stuck decks |
| `author`     | B     | `author.md`     | writes the next theme's deck, without images             |
| `art-batch`  | C1    | `art-batch.md`  | makes at most 10 images in Gemini, then stops            |
| `qc`         | C2    | `qc.md`         | checks every downloaded image                            |
| `ship`       | C3    | `ship.md`       | uploads the art, wires it in, opens the PR               |
| `schedule`   | D     | `schedule.md`   | validates merged decks against the calendar              |
| `theme-list` |       | `theme-list.md` | interactive only: rebuilds the theme list with Edward    |

`theme-list` is run with Edward in his own checkout, not by a scheduled task, and skips the
preamble below.

## The preamble: every stage starts with exactly this

1. Run `pwd`. If the folder isn't `…/when-factory`, stop and say so. The factory runs only in
   its own clone, because the next step resets the working tree.
2. Run `node scripts/factory/start.js <stage>` and read the **last line** of its output, a
   JSON object.
   - `"action": "exit"`: there is nothing to do (another stage holds the lock, or no deck has
     work). Reply with its `reason` in one line and stop. Don't commit anything.
   - `"action": "blocked"`: something needs Edward (a merge conflict, a failed sync). Reply with
     the reason and any `conflicted` files, and stop.
   - `"action": "run"`: carry on. Keep its `token`, `deck` and `branch` for the rest of the run.
3. Follow the stage file.
4. **Always end by releasing the lock**, whether the stage succeeded or failed:
   `node scripts/factory/status.js unlock --token <token>`. A held lock goes stale after 2
   hours, but until then it blocks every other stage.

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
