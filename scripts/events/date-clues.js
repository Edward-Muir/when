/**
 * Detects date clues in an event's player-visible text.
 *
 * The game's whole question is "when did this happen", and the UI already treats the
 * year as secret: `shouldShowYearInPopup` (src/components/Game.tsx) hides `event.year`
 * while a card is still in the player's hand. That guard is worthless if the prose
 * printed underneath it says "in 1966" — and `friendly_name` is worse still, because it
 * sits on the card face at all times (src/components/Card.tsx). So both fields are
 * checked, not just the description.
 *
 * Plain CommonJS with no dependencies, so `node` can run the report/apply scripts with
 * no build step, and src/utils/eventDateClues.test.ts can `require` it across the
 * tsconfig boundary. Same arrangement as scripts/themes/catalogue.js.
 *
 * NOT flagged, deliberately: relative durations such as "a 27-year war" or "800 years of
 * Muslim rule". Roughly 86 events carry those. They are historical content rather than a
 * statement of the answer, and stripping them would gut the descriptions for no gain.
 */

/**
 * Patterns are stored as *strings* and compiled per call on purpose: a shared
 * module-level /g/ RegExp carries `lastIndex` between calls, so the second event
 * scanned would silently start matching from the wrong offset and appear clean.
 */
const DATE_CLUE_KINDS = [
  {
    kind: 'year',
    // A bare 1000-2029 year. The lookbehind rejects a digit/dot/dash/slash prefix so
    // model numbers ("Hagenuk MT-2000") and decimals ("3.1416") do not match; the
    // lookahead only rejects a following decimal fraction, so a sentence-final "in
    // 1949." still matches.
    pattern: '(?<![\\d.\\-–/])\\b(?:1\\d{3}|20[0-2]\\d)\\b(?!\\.\\d)',
    flags: 'g',
  },
  {
    // "1960s", "1900s". Requires a 0 before the s, so "Boeing 747s" does not match.
    kind: 'decade',
    pattern: '\\b[1-9]\\d{0,3}0s\\b',
    flags: 'g',
  },
  {
    kind: 'century',
    pattern: '\\b\\d{1,2}(?:st|nd|rd|th)[-\\s]century\\b',
    flags: 'gi',
  },
  {
    kind: 'era',
    pattern: '\\b\\d{1,4}\\s?(?:BCE|BC|AD|CE)\\b',
    flags: 'g',
  },
];

/** The player-visible text fields. Both are rendered verbatim; nothing else is. */
const CLUE_FIELDS = ['description', 'friendly_name'];

/** Every date clue in a string, as [{ kind, match, index }]. */
function findDateClues(text) {
  if (!text) return [];
  const found = [];
  for (const { kind, pattern, flags } of DATE_CLUE_KINDS) {
    const re = new RegExp(pattern, flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      found.push({ kind, match: m[0], index: m.index });
      if (m[0] === '') re.lastIndex += 1; // belt and braces against a zero-width match
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Every date clue across an event's player-visible fields, as [{ field, kind, match }]. */
function eventDateClues(event) {
  const clues = [];
  for (const field of CLUE_FIELDS) {
    for (const c of findDateClues(event[field])) {
      clues.push({ field, kind: c.kind, match: c.match, index: c.index });
    }
  }
  return clues;
}

/** One-line offender string, shaped so a failing test message is itself the worklist. */
function formatOffender(event, clues) {
  const list = clues || eventDateClues(event);
  const bits = list.map((c) => `${c.field}:${c.kind} "${c.match}"`).join(', ');
  return `${event.name} (${event.year}): ${bits}`;
}

module.exports = {
  DATE_CLUE_KINDS,
  CLUE_FIELDS,
  findDateClues,
  eventDateClues,
  formatOffender,
};
