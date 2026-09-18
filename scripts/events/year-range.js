/**
 * Shared rules for the optional `year_end` upper bound: what makes an event a candidate for
 * one, and what makes a proposed value valid.
 *
 * **`year` and `year_end` together are the event's evidence window.** `year` is simply the
 * window's start, not an anchor to hang a forward-only range off: where the record puts the
 * window somewhere else, `year` moves too (see `entryProblems` and the `reason` requirement).
 *
 * `year` remains the sole anchor for difficulty scoring, deck composition, era filtering and
 * recency, so adding or widening a `year_end` alone cannot move a daily deck. Changing `year`
 * very much can, which is why that needs a stated reason and a re-measured deck bound.
 *
 * **There is deliberately no cap on how wide a window may be.** An earlier version capped the
 * span per era as a game-balance measure; it was wrong. A prehistoric event's window really is
 * millions of years, `boats` really does carry ~850,000 years of uncertainty, and the flat
 * 1,000-year rule for -10000..0 bound hardest on the agriculture and domestication cards,
 * which are the clearest processes in the catalogue. Honesty about uncertainty beat the
 * balance concern. The apply script still prints the widest ranges and any fully nested pairs
 * so a mis-keyed digit is visible, but nothing is rejected for width.
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
 * Everything wrong with a proposed `{ year_end, year?, reason?, note? }` entry, as a list of
 * sentences. Empty means it is applicable.
 *
 * **`year` is writable, but only with a `reason`.** The stored year is not a constant to be
 * preserved: where the record puts the window somewhere else, the window start moves. The
 * requirement is a stated reason rather than a command-line flag, because fixing years is now
 * the common case and a flag makes the common case awkward while doing nothing a mandatory
 * reason does not already do — it is what stops a year change riding along unnoticed.
 *
 * What the reason does not buy is silence: `year-range-apply.js` prints every move, and a
 * batch that changes years needs `deckBuilder.test.ts`'s bound re-measured afterwards.
 *
 * Note what is *not* here: any limit on how wide a window may be. See the header.
 */
function entryProblems(slug, entry, event) {
  const problems = [];

  if (!event) {
    return [`${slug}: not an event in the manifest catalogue (renamed or misspelled?)`];
  }
  if (!entry || typeof entry !== 'object') {
    return [`${slug}: entry must be an object with a year_end`];
  }

  const permitted = new Set(['year_end', 'year', 'reason', 'note']);
  for (const key of Object.keys(entry)) {
    if (!permitted.has(key)) problems.push(`${slug}: may not set "${key}"`);
  }

  const movesYear = Object.prototype.hasOwnProperty.call(entry, 'year');
  const year = movesYear ? entry.year : event.year;
  if (movesYear) {
    if (!Number.isInteger(year)) {
      problems.push(`${slug}: year must be an integer, got ${JSON.stringify(entry.year)}`);
    }
    if (!entry.reason || typeof entry.reason !== 'string') {
      problems.push(
        `${slug}: moving year needs a "reason" naming the evidence (it re-scores neighbours` +
          ' through difficultyScore and moves daily decks)'
      );
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

  return problems;
}

module.exports = {
  rangeOf,
  isRanged,
  eventRangeSignals,
  entryProblems,
};
