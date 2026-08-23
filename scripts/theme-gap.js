#!/usr/bin/env node
/**
 * What a theme idea would need before it can ship.
 *
 * Themes are chosen on their own merits, not picked from what the catalogue happens to hold,
 * so this is the step between having an idea and authoring it: it says what we already have,
 * how it sits on the timeline, and — the useful part — which stretches of history are
 * missing, so the gap becomes a brief for writing new events.
 *
 *   node scripts/theme-gap.js "olympi|world cup|championship"
 *   node scripts/theme-gap.js --slugs moon-landing,sputnik-1,apollo-11
 *   node scripts/theme-gap.js "volcan|erupt" --list        # print candidate slugs to pick from
 *
 * A keyword search is a starting net, not the theme. Expect to run it, read the candidates,
 * and hand-pick the ones that genuinely belong.
 *
 * Anchor short alternatives with \b. The regex is tested against `friendly_name description`,
 * so a bare `tea` matches "steam" and "instead" and a bare `led ` matches "called " — enough
 * to turn a 34-candidate theme into a 714-candidate one and hide that the net is broken.
 *
 * While authoring, a theme's own events do not exist yet, and the daily hides any event
 * without Cloudinary art — so both of these are needed to see the deck you are actually
 * building rather than the illustrated half of it:
 *
 *   --include-pending          count events that have no art yet
 *   --extra <staging.json>     also load event records from a file outside the manifest
 *                              (repeatable)
 *
 * Neither affects publish validation, which only ever sees playable events.
 */

const {
  binLabel,
  buildIndex,
  formatYear,
  isPlayable,
  loadEligibleEvents,
  spreadReport,
} = require('./themes/catalogue');

/** Mirrors MIN_THEME_EVENTS in lib/themes/schema.ts. */
const MIN_THEME_EVENTS = 16;
const MIN_OCCUPIED_BINS = 6;
const MIN_BAND_ZERO = 5;

/**
 * The authoring target, which is not the API minimum.
 *
 * 16 is the floor the API refuses to go below; a theme that size caps human scores so low
 * that it is not worth a day. 30 is where a curated day plays like a real one, and ~36 is the
 * ceiling — "Theme Cleared!" needs n-6 correct placements against a realistic best of ~30, so
 * a bigger deck can never be cleared. See docs/curated-themes/index.md, Sizing.
 */
const TARGET_THEME_EVENTS = 30;
const MAX_THEME_EVENTS = 36;

/** Two cards on the same year are a coin flip; this close, the placement is mostly luck. */
const CROWDING_YEARS = 8;

function parseArgs(argv) {
  const args = {
    pattern: null,
    slugs: null,
    list: false,
    includePending: false,
    extraFiles: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--list') args.list = true;
    else if (arg === '--include-pending') args.includePending = true;
    else if (arg === '--extra') {
      const file = argv[++i];
      if (file) args.extraFiles.push(file);
    } else if (arg === '--slugs') args.slugs = (argv[++i] || '').split(',').filter(Boolean);
    else if (!args.pattern) args.pattern = arg;
  }
  return args;
}

/**
 * Pairs a player cannot reasonably order. Same-year pairs are reported separately because
 * they are unplayable rather than merely hard: the card has no correct slot.
 */
function collisionReport(events) {
  const byYear = [...events].sort((a, b) => a.year - b.year);
  const sameYear = [];
  const crowded = [];
  for (let i = 1; i < byYear.length; i++) {
    const gap = byYear[i].year - byYear[i - 1].year;
    if (gap === 0) sameYear.push([byYear[i - 1], byYear[i]]);
    else if (gap < CROWDING_YEARS) crowded.push([byYear[i - 1], byYear[i], gap]);
  }
  return { sameYear, crowded };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pattern && !args.slugs) {
    console.error(
      'Usage: theme-gap.js "<keyword regex>" [--list]  |  --slugs a,b,c\n' +
        '       [--include-pending] [--extra staging.json]   # while authoring, see un-illustrated events'
    );
    process.exit(1);
  }

  const events = loadEligibleEvents({
    includePending: args.includePending,
    extraFiles: args.extraFiles,
  });
  const index = buildIndex(events);
  const pending = new Set(events.filter((e) => !isPlayable(e)).map((e) => e.name));

  let matched;
  if (args.slugs) {
    const wanted = new Set(args.slugs);
    matched = events.filter((e) => wanted.has(e.name));
    const missing = args.slugs.filter((s) => !events.some((e) => e.name === s));
    if (missing.length) console.log(`Unresolved slugs: ${missing.join(', ')}\n`);
  } else {
    const re = new RegExp(args.pattern, 'i');
    matched = events.filter((e) => re.test(`${e.friendly_name} ${e.description}`));
  }

  const spread = spreadReport(matched, index);
  const bandCounts = [0, 0, 0, 0];
  for (const event of matched) bandCounts[index.bandOf(event)]++;

  const pendingCount = matched.filter((e) => pending.has(e.name)).length;
  const poolLabel = args.includePending
    ? `${events.length} playable + pending`
    : `${events.length} playable`;
  console.log(`Candidates   ${matched.length} (of ${poolLabel})`);
  if (pendingCount) {
    console.log(`             ${pendingCount} of them still need art before the daily can deal them`);
  }
  console.log(`Bands        easiest ${bandCounts.join(' / ')} hardest`);
  console.log(`Spread       ${spread.occupied}/${spread.total} bins  [${spread.bins.join(' ')}]`);
  if (matched.length) {
    const years = matched.map((e) => e.year).sort((a, b) => a - b);
    console.log(`Range        ${formatYear(years[0])} to ${formatYear(years[years.length - 1])}`);
  }

  if (args.slugs) {
    const { sameYear, crowded } = collisionReport(matched);
    const gates = [
      [
        `size ${matched.length}`,
        matched.length >= TARGET_THEME_EVENTS && matched.length <= MAX_THEME_EVENTS,
        `want ${TARGET_THEME_EVENTS}-${MAX_THEME_EVENTS}`,
      ],
      [`bins ${spread.occupied}/${spread.total}`, spread.occupied >= MIN_OCCUPIED_BINS, `want ${MIN_OCCUPIED_BINS}+`],
      [`band 0 ${bandCounts[0]}`, bandCounts[0] >= MIN_BAND_ZERO, `want ${MIN_BAND_ZERO}+`],
      [`same-year pairs ${sameYear.length}`, sameYear.length === 0, 'want 0'],
    ];
    console.log('\nGates:');
    for (const [label, ok, want] of gates) {
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(22)} (${want})`);
    }

    if (sameYear.length) {
      console.log('\nSame year — unplayable, a player cannot order these:');
      for (const [a, b] of sameYear) {
        console.log(`  ${String(formatYear(a.year)).padStart(10)}  ${a.name}  vs  ${b.name}`);
      }
    }
    if (crowded.length) {
      console.log(`\nWithin ${CROWDING_YEARS} years — placement is mostly luck, consider dropping one:`);
      for (const [a, b, gap] of crowded) {
        console.log(
          `  ${String(gap).padStart(2)}y  ${formatYear(a.year)} ${a.name}  ->  ${formatYear(b.year)} ${b.name}`
        );
      }
    }
  }

  console.log('\nTo ship this theme:');
  const shortfall = MIN_THEME_EVENTS - matched.length;
  if (shortfall > 0) {
    console.log(`  • author ${shortfall} more event(s) — the minimum theme size is ${MIN_THEME_EVENTS}`);
  } else {
    console.log(`  • hand-pick ${MIN_THEME_EVENTS}+ of these that genuinely belong`);
  }

  const emptyBins = spread.bins
    .map((count, bin) => (count === 0 ? binLabel(events, index, bin) : null))
    .filter(Boolean);
  if (emptyBins.length) {
    console.log(`  • cover ${emptyBins.length} empty stretch(es) of the timeline:`);
    for (const label of emptyBins) console.log(`      ${label}`);
  } else if (spread.occupied < MIN_OCCUPIED_BINS) {
    console.log(`  • spread it wider — ${spread.occupied}/${spread.total} bins is clustered`);
  }

  if (bandCounts[0] < MIN_BAND_ZERO) {
    console.log(
      `  • add ${MIN_BAND_ZERO - bandCounts[0]} easier card(s) — the opening needs a foothold`
    );
  }

  if (args.list) {
    console.log('\nCandidates, by year:');
    for (const event of [...matched].sort((a, b) => a.year - b.year)) {
      const band = index.bandOf(event);
      console.log(
        `  ${String(formatYear(event.year)).padStart(10)}  b${band}  ` +
          `${event.name.padEnd(42)} ${event.friendly_name}`
      );
    }
  }
}

main();
