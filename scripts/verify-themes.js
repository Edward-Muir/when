#!/usr/bin/env node
/**
 * Re-check the LIVE theme calendar against the CURRENT catalogue.
 *
 * publish-theme.js proves a theme was sound when it was written. This catches it going stale
 * afterwards, which is a real risk because the two halves live in different places: the
 * calendar is in Redis and the events are in the repo. Deprecating an event, renaming a slug,
 * or an image regression that drops a card out of the playable set will all silently shrink a
 * stored theme, and nobody finds out until the day it runs.
 *
 * Worth running from CI on deploy — a deploy is exactly when the catalogue changes.
 *
 *   THEMES_API_URL=https://www.play-when.com node scripts/verify-themes.js
 *
 * Exit code 1 if any theme still to run has a problem, so it can gate a pipeline (CI runs it on
 * every pull request). A theme whose every date has passed is reported but never fails the run:
 * a date that has opened must not be rewritten (docs/curated-themes/index.md, the date rule), so
 * nothing could fix it, and gating on it would fail every pull request for good.
 */

const { buildIndex, loadEligibleEvents, spreadReport } = require('./themes/catalogue');

/** Mirrors MIN_THEME_EVENTS in lib/themes/schema.ts. */
const MIN_THEME_EVENTS = 16;

async function main() {
  const base = process.env.THEMES_API_URL || 'https://www.play-when.com';
  // Cache-busted for the same reason as publish-theme.js: the shared cache can serve a
  // calendar older than the publish being verified.
  const response = await fetch(`${base}/api/themes?fresh=${Date.now()}`);
  if (!response.ok) {
    console.error(`✗ Could not read the calendar: HTTP ${response.status}`);
    process.exit(1);
  }

  const calendar = await response.json();
  const themes = calendar.themes ?? [];
  const events = loadEligibleEvents();
  const index = buildIndex(events);
  const playable = new Set(events.map((e) => e.name));

  console.log(`Calendar version ${calendar.version}, ${themes.length} theme(s).`);
  if (themes.length === 0) return;

  let failures = 0;
  // Puzzle dates are local calendar days; UTC today is close enough to say which have passed.
  const today = new Date().toISOString().slice(0, 10);

  for (const theme of themes) {
    const missing = (theme.eventNames ?? []).filter((slug) => !playable.has(slug));
    const resolved = (theme.eventNames ?? []).filter((slug) => playable.has(slug));
    const spread = spreadReport(
      events.filter((e) => resolved.includes(e.name)),
      index
    );

    const problems = [];
    if (missing.length)
      problems.push(`${missing.length} slug(s) no longer playable: ${missing.join(', ')}`);
    if (resolved.length < MIN_THEME_EVENTS) {
      problems.push(`only ${resolved.length} playable events, minimum ${MIN_THEME_EVENTS}`);
    }

    const upcoming = (theme.dates ?? []).some((date) => date >= today);
    const status = !problems.length ? '✓' : upcoming ? '✗' : '·';
    console.log(
      `\n${status} ${theme.name} (${theme.id}) — ${resolved.length} events, ` +
        `${spread.occupied}/${spread.total} bins, dates ${(theme.dates ?? []).join(', ')}`
    );
    for (const problem of problems) console.log(`    ${problem}`);
    if (problems.length && !upcoming) console.log('    (every date has passed, so not gated)');
    if (problems.length && upcoming) failures++;
  }

  if (failures > 0) {
    console.error(`\n${failures} theme(s) need attention.`);
    process.exit(1);
  }
  console.log('\nEvery theme still to run resolves.');
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
