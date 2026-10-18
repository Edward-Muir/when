# Stage D: schedule merged decks

Finds factory decks that have merged to main but aren't on the calendar yet, picks each one's
date, and runs the publish workflow in **validate** mode only. Scheduling is a workflow
dispatch, never a commit, and **publishing waits for Edward's approval**: this stage prepares the
dispatch and reports it. It runs on `origin/main` and commits nothing.

1. `node scripts/factory/next-slot.js --pending` prints the ids of merged decks not yet on
   `/api/themes`. If it prints `[]`, unlock and stop.
2. For **each** id, oldest first:
   1. `node scripts/factory/next-slot.js --deck <id>`. It picks the earliest open Monday or
      Friday at least 48 hours before it opens, and writes `factory/dispatch/<id>.json` with
      `dates` filled in, plus a lasting copy (`publish_file` in its output) outside the clone.
   2. `gh workflow run publish-theme.yml -f mode=validate -F theme=@factory/dispatch/<id>.json`
   3. Find the run: `gh run list --workflow publish-theme.yml --limit 1 --json databaseId,status,url`.
      Wait for it: `gh run watch <databaseId>`.
   4. Read the report: `gh run view <databaseId> --log`. The validator prints each check. Note
      whether it passed, and any warning, such as "clustered".
   5. A second pending deck gets the next open date: `next-slot.js` counts the dates in this
      run's earlier dispatch files as taken.
3. Unlock.
4. Reply with, for each deck, the date, whether validate passed, and the exact command for
   Edward to publish it once he approves:
   `gh workflow run publish-theme.yml -f mode=publish -F theme=@<publish_file>`, with the
   absolute `publish_file` path, plus the theme JSON itself so he can paste it into the Actions
   page instead.
   Never run `mode=publish` yourself.

The calendar is the record of what is scheduled. No theme note or repo file records the date.
