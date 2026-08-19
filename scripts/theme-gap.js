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
 */

const {
  binLabel,
  buildIndex,
  formatYear,
  loadEligibleEvents,
  spreadReport,
} = require('./themes/catalogue');

/** Mirrors MIN_THEME_EVENTS in lib/themes/schema.ts. */
const MIN_THEME_EVENTS = 16;
const MIN_OCCUPIED_BINS = 6;
const MIN_BAND_ZERO = 5;

function parseArgs(argv) {
  const args = { pattern: null, slugs: null, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--list') args.list = true;
    else if (arg === '--slugs') args.slugs = (argv[++i] || '').split(',').filter(Boolean);
    else if (!args.pattern) args.pattern = arg;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pattern && !args.slugs) {
    console.error('Usage: theme-gap.js "<keyword regex>" [--list]  |  --slugs a,b,c');
    process.exit(1);
  }

  const events = loadEligibleEvents();
  const index = buildIndex(events);

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

  console.log(`Candidates   ${matched.length} (of ${events.length} playable)`);
  console.log(`Bands        easiest ${bandCounts.join(' / ')} hardest`);
  console.log(`Spread       ${spread.occupied}/${spread.total} bins  [${spread.bins.join(' ')}]`);
  if (matched.length) {
    const years = matched.map((e) => e.year).sort((a, b) => a - b);
    console.log(`Range        ${formatYear(years[0])} to ${formatYear(years[years.length - 1])}`);
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
