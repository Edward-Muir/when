/**
 * Catalogue loading and theme analysis, shared by the theme scripts.
 *
 * Dependency-free CommonJS on purpose: the publish workflow runs these with a bare `node`
 * and no `npm ci`, which keeps the job to a checkout and a few hundred milliseconds.
 *
 * This is deliberately a re-implementation of a few things that also exist in src/ — the
 * playable-event filter, the CDF coordinate, the difficulty bands. Those live in TypeScript
 * modules a plain node script cannot import, and the alternative (a build step, or ts-node in
 * CI) costs more than it saves. What keeps them honest is that the numbers are asserted
 * against the real TS implementations in src/utils/themeScripts.test.ts.
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

/** Mirrors isCloudinaryImage in src/utils/cloudinaryImage.ts. */
function isPlayable(event) {
  const url = event.image_url;
  return Boolean(url && url.includes('res.cloudinary.com') && url.includes('/upload/'));
}

/**
 * Every event the daily can actually deal: deduped by `name`, restricted to events with
 * custom art, and inside the era table.
 *
 * The era filter matters more than it looks. filterByEra with all eras is *nearly* a no-op,
 * but ERA_DEFINITIONS stops at year 2100 and the catalogue holds one event beyond it — so
 * validating a theme against the raw catalogue would let a slug through that the daily can
 * never deal.
 */
function loadEligibleEvents() {
  const manifest = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8'));

  const all = [];
  for (const file of manifest.files) {
    all.push(...JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')));
  }

  const seen = new Set();
  return all.filter((event) => {
    if (seen.has(event.name)) return false;
    seen.add(event.name);
    return isPlayable(event) && event.year >= -4_500_000_000 && event.year <= 2100;
  });
}

/** Mirrors DENSITY_WINDOW_YEARS / W_RECOGNITION in src/utils/difficultyScore.ts. */
const DENSITY_WINDOW_YEARS = 25;
const W_RECOGNITION = 0.6;
const RECOGNITION_RANK = { easy: 0, medium: 1 / 3, hard: 2 / 3, 'very-hard': 1 };

function lowerBound(sorted, target) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * The composite difficulty index: the CDF coordinate `u` the deck builder measures spacing
 * in, plus global-quartile difficulty bands.
 */
function buildIndex(events) {
  // u is the event's POSITION in the year-sorted catalogue over n-1, not a binary search for
  // its year. The difference only shows on ties, but the catalogue has large ones (many
  // events share a headline year) and a search collapses a whole tie group onto the value at
  // its start — up to 0.015 off, measured, which is a fifth of a spread bin.
  const byYear = [...events].sort((a, b) => a.year - b.year);
  const years = byYear.map((e) => e.year);
  const denominator = Math.max(1, byYear.length - 1);

  const uByName = new Map();
  byYear.forEach((event, i) => uByName.set(event.name, i / denominator));

  const density = (year) =>
    lowerBound(years, year + DENSITY_WINDOW_YEARS + 1) -
    lowerBound(years, year - DENSITY_WINDOW_YEARS) -
    1;

  const maxLogDensity = Math.log1p(Math.max(...events.map((e) => density(e.year))));
  const score = (event) =>
    W_RECOGNITION * RECOGNITION_RANK[event.difficulty] +
    (1 - W_RECOGNITION) * (Math.log1p(density(event.year)) / maxLogDensity);

  const sortedScores = events.map(score).sort((a, b) => a - b);
  const cut = (q) => sortedScores[Math.floor(sortedScores.length * q)];
  const [q1, q2, q3] = [cut(0.25), cut(0.5), cut(0.75)];

  const bandOf = (event) => {
    const s = score(event);
    if (s < q1) return 0;
    if (s < q2) return 1;
    if (s < q3) return 2;
    return 3;
  };

  return { u: (event) => uByName.get(event.name) ?? 0.5, bandOf };
}

const SPREAD_BINS = 8;

/**
 * How well a set of events covers the timeline.
 *
 * Measured in CDF-rank space rather than years, because the catalogue spans 4.5 billion of
 * them — a distance in `u` reads as "how many catalogue events lie between these two", which
 * is what actually makes a placement hard. Empty bins are the useful output: they say which
 * stretch of history a theme still needs.
 */
function spreadReport(events, index) {
  const bins = new Array(SPREAD_BINS).fill(0);
  for (const event of events) {
    bins[Math.min(SPREAD_BINS - 1, Math.floor(index.u(event) * SPREAD_BINS))]++;
  }
  const occupied = bins.filter((n) => n > 0).length;
  return { bins, occupied, total: SPREAD_BINS };
}

/** Rough era label for a CDF bin, so an empty bin is a readable instruction. */
function binLabel(events, index, bin) {
  const inBin = events.filter(
    (e) => Math.min(SPREAD_BINS - 1, Math.floor(index.u(e) * SPREAD_BINS)) === bin
  );
  if (inBin.length === 0) return `bin ${bin}`;
  const years = inBin.map((e) => e.year).sort((a, b) => a - b);
  return `${formatYear(years[0])} to ${formatYear(years[years.length - 1])}`;
}

function formatYear(year) {
  if (year < -10000) return `${(Math.abs(year) / 1_000_000).toFixed(1)}Mya`;
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

module.exports = {
  DENSITY_WINDOW_YEARS,
  SPREAD_BINS,
  W_RECOGNITION,
  binLabel,
  buildIndex,
  formatYear,
  isPlayable,
  loadEligibleEvents,
  spreadReport,
};
