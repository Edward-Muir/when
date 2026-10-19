/**
 * How bunched a deck's years are: the most cards any 10-year window holds, against what the
 * deck's own span allows (factory.md, "Spread"; rubric v2, rule 4).
 *
 * The first factory deck, Sweet Tooth, passed every other gate with 5 cards in 1900-1909 and 18 of
 * 30 in 1896-1941: brand launches cluster in the industrial era, and an agent asked for "famous
 * sweets" reaches for them. Within a curated deck the other cards are the timeline, so four cards
 * in five years is close to a coin flip, however well known each one is.
 *
 * The limit scales with the span, so a subject that only exists for 70 years (television) can
 * still fill 30 cards: it is 1.5x the deck's average per decade, and never under 3.
 */

const WINDOW_YEARS = 10;
const DENSITY_FACTOR = 1.5;
const MIN_LIMIT = 3;

/** The 10-year window holding the most of `years`: {count, from, to}. */
function densestWindow(years, windowYears = WINDOW_YEARS) {
  const sorted = [...years].sort((a, b) => a - b);
  let best = { count: 0, from: null, to: null };
  let lo = 0;
  for (let hi = 0; hi < sorted.length; hi++) {
    while (sorted[hi] - sorted[lo] >= windowYears) lo++;
    const count = hi - lo + 1;
    if (count > best.count) best = { count, from: sorted[lo], to: sorted[hi] };
  }
  return best;
}

/** The most cards a deck of `n` spanning `spanYears` may hold in any 10-year window. */
function bunchLimit(n, spanYears) {
  const perWindow = (n * WINDOW_YEARS) / Math.max(spanYears, WINDOW_YEARS);
  return Math.max(MIN_LIMIT, Math.ceil(DENSITY_FACTOR * perWindow));
}

/** {ok, densest, limit, span} for a list of years. */
function bunchingReport(years) {
  if (!years.length) return { ok: true, densest: { count: 0 }, limit: MIN_LIMIT, span: 0 };
  const span = Math.max(...years) - Math.min(...years);
  const densest = densestWindow(years);
  const limit = bunchLimit(years.length, span);
  return { ok: densest.count <= limit, densest, limit, span };
}

module.exports = { WINDOW_YEARS, bunchLimit, bunchingReport, densestWindow };
