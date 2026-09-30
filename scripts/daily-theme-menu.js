#!/usr/bin/env node
/**
 * The menu the seeded daily draws its themes from: regions, countries and category + place
 * pairings, alongside the categories. Writes src/data/dailyThemeMenu.json.
 *
 *   npm run daily-menu                      # dry run: what a new epoch would hold, and why
 *   npm run daily-menu -- --from 2026-11-02 # append that epoch to the menu
 *
 * The menu is frozen and dated, never derived at runtime. A day's theme is drawn by a seeded
 * RNG as `list[floor(random() * list.length)]`, so any change to a list re-themes every date
 * it covers, past ones included, and the recency chain then replays decks nobody was dealt.
 * An epoch therefore only ever applies from a `from` date that has not opened yet, and a
 * change to the menu is a new epoch, not an edit. See docs/curated-themes/index.md, "Seeded
 * themes: the dated menu".
 *
 * A candidate is admitted on two gates, both measured over the pool the daily would deal:
 *
 *   MIN_POOL             30 cards: a deck worth a day.
 *   MIN_BAND_ZERO_DAILY  8 cards in the easiest quarter of the whole catalogue. The ramp's
 *                        opening consumes about 4, and pool size does not predict this
 *                        (South Korea has 56 cards and 1 easy one), so without the gate a
 *                        themed day opens on hard cards. 8 leaves room for an overlapping theme
 *                        earlier in the week having used some.
 *
 * src/utils/dailyThemeMenu.test.ts re-checks every live epoch against the current catalogue.
 * When catalogue work pushes an entry below a gate, run this with a future --from.
 */

const fs = require('fs');
const path = require('path');
const { buildIndex, loadEligibleEvents } = require('./themes/catalogue');
const { regionSetOf } = require('./events/region-spec');
const taxonomy = require('../src/data/regions.json');

const MENU_PATH = path.join(__dirname, '..', 'src', 'data', 'dailyThemeMenu.json');
const TYPES_PATH = path.join(__dirname, '..', 'src', 'types', 'index.ts');

const MIN_POOL = 30;
const MIN_BAND_ZERO_DAILY = 8;
/** An entry this close to a gate is flagged, since the next catalogue change may cross it. */
const NEAR_GATE = 1.2;

/** The share of seeded days each kind of theme gets. Integers; only their ratio matters. */
const WEIGHTS = { all: 30, category: 25, region: 10, country: 15, mix: 20 };

/** Global is a footprint, not a place a player would pick as a theme. */
const EXCLUDED_REGIONS = new Set(['Global']);

/** Mirrors `opensAtMs` in lib/themes/schema.ts: date D opens at D 00:00 in UTC+14. */
function opensAtMs(date) {
  return Date.parse(`${date}T00:00:00Z`) - 14 * 3600 * 1000;
}

/** ALL_CATEGORIES, in its declared order, read out of src/types/index.ts. */
function readAllCategories() {
  const source = fs.readFileSync(TYPES_PATH, 'utf8');
  const match = source.match(/ALL_CATEGORIES: Category\[\] = \[([^\]]*)\]/);
  if (!match) throw new Error(`could not find ALL_CATEGORIES in ${TYPES_PATH}`);
  return [...match[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
}

function measure(events, bandOf) {
  const bands = [0, 0, 0, 0];
  for (const event of events) bands[bandOf(event)]++;
  return { n: events.length, bands };
}

const passes = (m) => m.n >= MIN_POOL && m.bands[0] >= MIN_BAND_ZERO_DAILY;
const nearGate = (m) => m.n < MIN_POOL * NEAR_GATE || m.bands[0] < MIN_BAND_ZERO_DAILY * NEAR_GATE;

function buildEpoch() {
  const events = loadEligibleEvents();
  const { bandOf } = buildIndex(events);
  const categories = readAllCategories();

  const regionsOf = new Map(events.map((e) => [e.name, regionSetOf(e.regions ?? [])]));
  const inRegion = (region) => (e) => regionsOf.get(e.name).has(region);
  const inCountry = (country) => (e) => (e.regions ?? []).includes(country);

  const countryCounts = new Map();
  for (const event of events) {
    for (const tag of event.regions ?? []) {
      if (Object.prototype.hasOwnProperty.call(taxonomy.countries, tag)) {
        countryCounts.set(tag, (countryCounts.get(tag) ?? 0) + 1);
      }
    }
  }
  // Most-tagged first, the order the country picker uses; frozen once written.
  const allCountries = [...countryCounts.keys()].sort(
    (a, b) => countryCounts.get(b) - countryCounts.get(a) || a.localeCompare(b)
  );
  const allRegions = taxonomy.regions.filter((r) => !EXCLUDED_REGIONS.has(r));

  const report = [];
  const admit = (kind, label, pool) => {
    const m = measure(pool, bandOf);
    report.push({ kind, label, ...m, ok: passes(m), near: passes(m) && nearGate(m) });
    return passes(m);
  };

  const regions = allRegions.filter((r) => admit('region', r, events.filter(inRegion(r))));
  const countries = allCountries.filter((c) => admit('country', c, events.filter(inCountry(c))));
  const mixes = [];
  for (const category of categories) {
    const inCategory = events.filter((e) => e.category === category);
    for (const region of allRegions) {
      if (admit('mix', `${category} / ${region}`, inCategory.filter(inRegion(region)))) {
        mixes.push([category, region]);
      }
    }
    for (const country of allCountries) {
      if (admit('mix', `${category} / ${country}`, inCategory.filter(inCountry(country)))) {
        mixes.push([category, country]);
      }
    }
  }

  return {
    epoch: { weights: WEIGHTS, categories, regions, countries, mixes },
    report,
    eligible: events.length,
  };
}

function printReport({ epoch, report, eligible }) {
  console.log(`Eligible events: ${eligible}`);
  console.log(`Gates: ${MIN_POOL}+ cards and ${MIN_BAND_ZERO_DAILY}+ in band 0\n`);
  const near = report.filter((r) => r.near);
  if (near.length > 0) {
    console.log(`Admitted but within ${Math.round((NEAR_GATE - 1) * 100)}% of a gate:`);
    for (const r of near)
      console.log(`  ${r.kind.padEnd(8)} ${r.label}  n=${r.n} bands=${r.bands.join('/')}`);
    console.log('');
  }
  const rejected = report.filter((r) => !r.ok && r.n >= MIN_POOL);
  if (rejected.length > 0) {
    console.log(`Big enough but too few easy cards (${rejected.length}):`);
    for (const r of rejected)
      console.log(`  ${r.kind.padEnd(8)} ${r.label}  n=${r.n} bands=${r.bands.join('/')}`);
    console.log('');
  }
  console.log(
    `Epoch: ${epoch.categories.length} categories, ${epoch.regions.length} regions, ` +
      `${epoch.countries.length} countries, ${epoch.mixes.length} pairings`
  );
}

function main() {
  const args = process.argv.slice(2);
  const fromIndex = args.indexOf('--from');
  const from = fromIndex === -1 ? null : args[fromIndex + 1];

  const built = buildEpoch();
  printReport(built);
  if (!from) {
    console.log('\nDry run. Pass --from YYYY-MM-DD to append this epoch.');
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error(`--from wants YYYY-MM-DD, got ${from}`);
  if (opensAtMs(from) <= Date.now()) {
    throw new Error(
      `${from} has already opened (at ${new Date(opensAtMs(from)).toISOString()}). ` +
        'An epoch must start on a date nobody has played yet.'
    );
  }
  const menu = fs.existsSync(MENU_PATH)
    ? JSON.parse(fs.readFileSync(MENU_PATH, 'utf8'))
    : { epochs: [] };
  const last = menu.epochs.at(-1);
  if (last && from <= last.from) {
    throw new Error(`--from ${from} must be after the last epoch's ${last.from}`);
  }
  menu.epochs.push({ from, ...built.epoch });
  fs.writeFileSync(MENU_PATH, `${JSON.stringify(menu, null, 2)}\n`);
  console.log(`\nAppended the epoch from ${from} to ${path.relative(process.cwd(), MENU_PATH)}.`);
}

main();
