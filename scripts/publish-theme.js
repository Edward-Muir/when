#!/usr/bin/env node
/**
 * Validate a curated daily theme against the real catalogue, then publish it.
 *
 * Normally run by .github/workflows/publish-theme.yml so the admin secret stays in GitHub
 * Secrets. Everything is read from the environment rather than argv, because the workflow
 * passes the theme JSON through env to keep it out of the shell.
 *
 *   THEME_JSON        the theme: {"id","name","eventNames":[...],"dates":["YYYY-MM-DD"]}
 *   THEME_MODE        "validate" (default, writes nothing) or "publish"
 *   THEME_FORCE       "true" to publish a date that has already opened somewhere
 *   THEME_REMOVE      a theme id to delete instead of adding
 *   THEMES_ADMIN_KEY  shared secret
 *   THEMES_API_URL    defaults to production
 *
 * The split of responsibilities is deliberate. This script owns the checks that need the
 * event catalogue — do these slugs exist, is the theme spread across the timeline, does it
 * open on an easy card — because the serverless function cannot see public/events/. The
 * function owns structure (sizes, name length, date collisions, whether a date has already
 * opened), and validate mode asks it via dryRun rather than keeping a second copy here.
 */

const {
  binLabel,
  buildIndex,
  formatYear,
  loadEligibleEvents,
  spreadReport,
} = require('./themes/catalogue');

const MIN_OCCUPIED_BINS = 6;
const MIN_BAND_ZERO = 5;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function parseTheme() {
  const raw = process.env.THEME_JSON;
  if (!raw || !raw.trim()) fail('THEME_JSON is empty.');
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`THEME_JSON is not valid JSON: ${error.message}`);
  }
}

/**
 * Everything that needs the catalogue. Returns problems; an empty list means the theme is
 * playable and reasonably shaped.
 */
function inspectTheme(theme, events, index) {
  const problems = [];
  const byName = new Map(events.map((e) => [e.name, e]));

  const resolved = [];
  const missing = [];
  for (const slug of theme.eventNames ?? []) {
    const event = byName.get(slug);
    if (event) resolved.push(event);
    else missing.push(slug);
  }

  if (missing.length > 0) {
    problems.push(
      `${missing.length} slug(s) do not resolve to a playable event: ${missing.join(', ')}\n` +
        `   (an event with no custom art is in the JSON but can never be dealt)`
    );
  }

  const spread = spreadReport(resolved, index);
  const bandCounts = [0, 0, 0, 0];
  for (const event of resolved) bandCounts[index.bandOf(event)]++;

  console.log(`\n  ${theme.name}  (${theme.id})`);
  console.log(`  dates      ${(theme.dates ?? []).join(', ')}`);
  console.log(`  events     ${resolved.length} playable of ${(theme.eventNames ?? []).length}`);
  console.log(`  bands      easiest ${bandCounts.join(' / ')} hardest`);
  console.log(`  spread     ${spread.occupied}/${spread.total} bins  [${spread.bins.join(' ')}]`);

  if (resolved.length > 0) {
    const years = resolved.map((e) => e.year).sort((a, b) => a - b);
    console.log(`  range      ${formatYear(years[0])} to ${formatYear(years[years.length - 1])}`);
  }

  if (spread.occupied < MIN_OCCUPIED_BINS) {
    const empty = spread.bins
      .map((count, bin) => (count === 0 ? binLabel(events, index, bin) : null))
      .filter(Boolean);
    problems.push(
      `only ${spread.occupied}/${spread.total} timeline bins are covered — a theme this ` +
        `clustered plays as one long guess.\n   Missing roughly: ${empty.join('; ')}`
    );
  }

  // The ramp wants ~3.7 draws from the easiest band across its 24-card window. Below this the
  // opening has nothing gentle to hand the player.
  if (bandCounts[0] < MIN_BAND_ZERO) {
    problems.push(
      `only ${bandCounts[0]} event(s) in the easiest difficulty band (want ${MIN_BAND_ZERO}+) — ` +
        `the game would open on hard cards.`
    );
  }

  return problems;
}

async function callApi(path, options) {
  const base = process.env.THEMES_API_URL || 'https://www.play-when.com';
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { ok: response.ok, status: response.status, body };
}

/** Replace a theme with the same id, or append it. Removal drops it by id. */
function mergeCalendar(calendar, theme, removeId) {
  const themes = (calendar.themes ?? []).filter((t) => t.id !== (removeId || theme.id));
  if (removeId) return { ...calendar, themes };
  return { ...calendar, themes: [...themes, theme] };
}

async function main() {
  const mode = (process.env.THEME_MODE || 'validate').trim();
  const force = String(process.env.THEME_FORCE).trim() === 'true';
  const removeId = (process.env.THEME_REMOVE || '').trim();

  const events = loadEligibleEvents();
  const index = buildIndex(events);
  console.log(`Catalogue: ${events.length} playable events.`);

  const theme = removeId ? null : parseTheme();

  if (theme) {
    const problems = inspectTheme(theme, events, index);
    if (problems.length > 0) {
      console.error('\nProblems:');
      for (const problem of problems) console.error(` • ${problem}`);
      fail('Theme is not ready. Nothing was written.');
    }
    console.log('\n✓ Catalogue checks passed.');
  } else {
    console.log(`\nRemoving theme "${removeId}".`);
  }

  const current = await callApi('/api/themes', {});
  if (!current.ok) fail(`Could not read the current calendar (HTTP ${current.status}).`);

  const merged = mergeCalendar(current.body, theme, removeId);
  const dryRun = mode !== 'publish';

  const result = await callApi('/api/themes/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': process.env.THEMES_ADMIN_KEY || '',
    },
    body: JSON.stringify({
      calendar: merged,
      baseVersion: current.body.version,
      force,
      dryRun,
    }),
  });

  if (!result.ok) {
    if (Array.isArray(result.body.errors)) {
      console.error('\nThe API rejected it:');
      for (const error of result.body.errors) console.error(` • ${error}`);
    }
    fail(result.body.error || `HTTP ${result.status}`);
  }

  if (dryRun) {
    console.log(
      `\n✓ Validated against the live calendar (version ${result.body.version}). ` +
        `Nothing written — re-run with mode: publish to store it.`
    );
    return;
  }

  console.log(`\n✓ Published. Calendar is now version ${result.body.version}.`);
}

main().catch((error) => fail(error.stack || String(error)));
