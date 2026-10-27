/**
 * Copy checks for a curated theme's intro popup (`intro: { blurb, fact }`).
 *
 * The popup opens before the first card is dragged, so its text is as player-visible before
 * placement as a card's `friendly_name` or `description`, and the same rule applies: it may not
 * state a date. The detection is scripts/events/date-clues.js, shared with the catalogue, so a
 * pattern added there covers both.
 *
 * Structure (non-empty strings, length caps) is lib/themes/schema.ts's, checked by the API. The
 * rules no regex can catch, no "from X to Y" bookends and no ordering of two cards in the deck,
 * are in docs/curated-themes/index.md and are the writer's to keep.
 *
 * Plain CommonJS so scripts/publish-theme.js can run it under a bare `node`, and
 * src/utils/themeIntroCopy.test.ts can `require` it.
 */

const { findDateClues } = require('../events/date-clues');

/** Every date clue in a theme's intro, as readable problem strings. Empty when clean. */
function introProblems(theme) {
  const intro = theme && theme.intro;
  if (!intro) return [];
  const problems = [];
  const fields = [
    ['blurb', intro.blurb],
    ['fact', intro.fact],
  ];
  for (const [field, value] of fields) {
    const text = typeof value === 'string' ? value : '';
    for (const clue of findDateClues(text)) {
      problems.push(
        `intro.${field} states a date (${clue.kind} "${clue.match}"); ` +
          `the intro shows before any card is placed`
      );
    }
  }
  return problems;
}

module.exports = { introProblems };
