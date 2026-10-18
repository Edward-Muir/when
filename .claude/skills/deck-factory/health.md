# Stage A: list health (weekly)

A light weekly check, not a generator. It runs on `origin/main` (no deck) and commits nothing.

1. `node scripts/factory/health.js`
   It prints the report and saves a copy to `../when-images/factory-reports/health-<date>.md`.
   The report covers:
   - themes left, with a warning under 30;
   - the decks on origin, and any with no change for 3 days;
   - the calendar's buffer, gaps and off-cadence days;
   - `theme:verify`;
   - skipped themes and why;
   - open factory PRs, and the Cloudinary assets of any closed unmerged.
2. Unlock.
3. Reply with the report's headline lines:
   - the buffer in days;
   - themes left;
   - anything stuck or failing;
   - any closed PR whose assets wait for Edward's go-ahead to be queued for deletion.

   Don't queue or delete anything yourself.
