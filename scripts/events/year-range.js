/**
 * Shared rules for the optional `year_end` upper bound: what makes an event a candidate for
 * one, and what makes a proposed value valid.
 *
 * `year` is the lower bound and stays the sole anchor for difficulty scoring, deck
 * composition, era filtering and recency. Only placement judging and the year label read
 * `year_end`, which is what makes adding one safe: it cannot move a daily deck.
 *
 * Plain CommonJS with no dependencies, so `node` runs the report/apply scripts with no build
 * step and the Jest corpus test can `require` it across the tsconfig boundary. Same
 * arrangement as `date-clues.js` and `themes/catalogue.js` — and the point of sharing it is
 * that the script and the test cannot drift into disagreeing about what is valid.
 */

/** Mirrors `eventEnd` in src/utils/gameLogic.ts, which clamps rather than trusts. */
function rangeOf(event) {
  const end = event.year_end;
  const valid = typeof end === 'number' && Number.isFinite(end) && end > event.year;
  return { start: event.year, end: valid ? end : event.year };
}

function isRanged(event) {
  const { start, end } = rangeOf(event);
  return end > start;
}

/**
 * The widest span allowed for an event starting at `year`, in years.
 *
 * This is game balance, not accuracy. A window wide enough to cover most of the board makes
 * its card unloseable, and worse, it slackens the running bounds for every placement around
 * it for the rest of the game. Deep time gets a proportional cap instead of a flat one
 * because a 500-year window on a 40,000-year-old event is meaninglessly precise.
 */
function maxSpanFor(year) {
  if (year < -10000) return Math.round(Math.abs(year) * 0.25);
  if (year < 0) return 1000;
  if (year < 1500) return 500;
  return 250;
}

/** Span nouns in a title are the strongest signal that a card names a period, not a moment. */
const SPAN_NOUN = new RegExp(
  [
    '\\b(?:era|age|period|dynasty|empire|kingdom|republic|reign|rule|caliphate',
    '|renaissance|crusades?|revolution|war|plague|famine|migration|construction',
    '|reformation|collapse|decline|rise|expansion|settlement|domestication',
    '|golden age|adoption|spread)\\b',
  ].join(''),
  'i'
);

/**
 * Duration phrases in a description. This is precisely the class `date-clues.js` deliberately
 * does *not* flag as a spoiler ("a 27-year war", "800 years of Muslim rule") — content rather
 * than an answer. What makes a card safe there makes it a candidate here, so that exemption
 * doubles as a pre-built worklist.
 */
const DURATION_PHRASE = [
  '\\b\\d{1,4}[-\\s]year\\b',
  '\\b(?:centuries|decades|millennia)\\b',
  '\\blasted\\b',
  '\\bover \\d+ years\\b',
  '\\bgradually\\b',
  '\\bthroughout the\\b',
  '\\bover the next\\b',
];

/**
 * Why this event was picked, so a writing agent can reject a false positive rather than
 * invent a range to fill the slot. Empty means it is not a candidate.
 */
function eventRangeSignals(event) {
  const signals = [];
  const name = event.friendly_name || '';
  const description = event.description || '';

  if (SPAN_NOUN.test(name)) signals.push('span-noun-in-name');
  else if (SPAN_NOUN.test(description)) signals.push('span-noun-in-description');

  if (DURATION_PHRASE.some((p) => new RegExp(p, 'i').test(description))) {
    signals.push('duration-phrase');
  }
  // Every prehistoric date is an estimate with a window behind it.
  if (event.year < -10000) signals.push('deep-time');
  // A round year before 1500 is usually a stand-in rather than a record.
  else if (event.year < 1500 && event.year % 10 === 0) signals.push('round-year-pre-1500');

  return signals;
}

/**
 * Everything wrong with a proposed `{ year_end, year?, reason? }` entry, as a list of
 * sentences. Empty means it is applicable.
 *
 * `allowYearChange` is off by default and is the only route by which `year` may be touched at
 * all: correcting a year re-scores its neighbours through difficultyScore and moves every
 * daily deck, so it must never ride along on a range batch by accident.
 */
function entryProblems(slug, entry, event, opts) {
  const options = opts || {};
  const problems = [];

  if (!event) {
    return [`${slug}: not an event in the manifest catalogue (renamed or misspelled?)`];
  }
  if (!entry || typeof entry !== 'object') {
    return [`${slug}: entry must be an object with a year_end`];
  }

  const permitted = new Set([
    'year_end',
    'note',
    ...(options.allowYearChange ? ['year', 'reason'] : []),
  ]);
  for (const key of Object.keys(entry)) {
    if (!permitted.has(key)) {
      problems.push(
        `${slug}: may not set "${key}"` +
          (key === 'year' ? ' without --allow-year-change (it moves every daily deck)' : '')
      );
    }
  }

  const year = Object.prototype.hasOwnProperty.call(entry, 'year') ? entry.year : event.year;
  if (Object.prototype.hasOwnProperty.call(entry, 'year')) {
    if (!Number.isInteger(year)) problems.push(`${slug}: year must be an integer`);
    if (!entry.reason || typeof entry.reason !== 'string') {
      problems.push(`${slug}: a year change needs a "reason" naming the evidence`);
    }
  }

  const end = entry.year_end;
  if (!Number.isInteger(end)) {
    problems.push(`${slug}: year_end must be an integer, got ${JSON.stringify(end)}`);
    return problems;
  }
  if (end === year) {
    problems.push(`${slug}: year_end equals year — omit the field instead of writing a point`);
  } else if (end < year) {
    problems.push(`${slug}: year_end ${end} is before year ${year}`);
  }

  const currentYear = new Date().getFullYear();
  if (end > currentYear) {
    problems.push(`${slug}: year_end ${end} is in the future`);
  }

  const span = end - year;
  const maxSpan = maxSpanFor(year);
  if (span > maxSpan && !options.allowWide) {
    problems.push(
      `${slug}: span of ${span} years exceeds the ${maxSpan}-year ceiling for year ${year}` +
        ' (pass --allow-wide only with a reason it is really this uncertain)'
    );
  }

  return problems;
}

module.exports = {
  rangeOf,
  isRanged,
  maxSpanFor,
  eventRangeSignals,
  entryProblems,
};
