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
 * Exit code 1 if any scheduled theme has a problem, so it can gate a pipeline.
 */

const { buildIndex, loadEligibleEvents, spreadReport } = require('./themes/catalogue');

/** Mirrors MIN_THEME_EVENTS in lib/themes/schema.ts. */
const MIN_THEME_EVENTS = 16;

async function main() {
  const base = process.env.THEMES_API_URL || 'https://www.play-when.com';
  const response = await fetch(`${base}/api/themes`);
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

  for (const theme of themes) {
    const missing = (theme.eventNames ?? []).filter((slug) => !playable.has(slug));
    const resolved = (theme.eventNames ?? []).filter((slug) => playable.has(slug));
    const spread = spreadReport(
      events.filter((e) => resolved.includes(e.name)),
      index
    );

    const problems = [];
    if (missing.length) problems.push(`${missing.length} slug(s) no longer playable: ${missing.join(', ')}`);
    if (resolved.length < MIN_THEME_EVENTS) {
      problems.push(`only ${resolved.length} playable events, minimum ${MIN_THEME_EVENTS}`);
    }

    const status = problems.length ? '✗' : '✓';
    console.log(
      `\n${status} ${theme.name} (${theme.id}) — ${resolved.length} events, ` +
        `${spread.occupied}/${spread.total} bins, dates ${(theme.dates ?? []).join(', ')}`
    );
    for (const problem of problems) console.log(`    ${problem}`);
    if (problems.length) failures++;
  }

  if (failures > 0) {
    console.error(`\n${failures} theme(s) need attention.`);
    process.exit(1);
  }
  console.log('\nAll scheduled themes still resolve.');
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
