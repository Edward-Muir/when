/**
 * The shape rules for an event's long-form "read more" prose.
 *
 * Plain CommonJS with no dependencies, for the same reason as `date-clues.js`: the maintainer
 * scripts run under a bare `node` with no build step, and `src/utils/eventDetailCorpus.test.ts`
 * can `require` it across the tsconfig boundary. One definition, three consumers.
 *
 * These are *shape* rules only — paragraph counts and lengths. Voice, the opening hook and what
 * a writer may assert are Phase 2's job and live in docs/event-detail/writing-spec.md.
 *
 * NOT checked here, deliberately: date clues. `scripts/events/date-clues.js` guards
 * `description` and `friendly_name` because both are shown to a player who has not placed the
 * card yet. Detail prose is unreachable until the year is already revealed (the `showYear` gate
 * in GamePopup), so it may name years, decades and centuries freely — that is most of the point
 * of having it. Do not add the detail field to that rule's CLUE_FIELDS.
 */

/** Sidecar shards live here, mirroring the manifest filenames exactly. */
const DETAIL_DIR = 'detail';

const MIN_PARAGRAPHS = 2;
const MAX_PARAGRAPHS = 3;

// Roughly 40-160 words. Wide on purpose: Phase 2 tightens these once the voice is settled, and
// a band that rejects good writing during Phase 3 is worse than one that lets a short one through.
const MIN_PARAGRAPH_CHARS = 200;
const MAX_PARAGRAPH_CHARS = 900;
const MAX_TOTAL_CHARS = 2200;

/**
 * Every problem with one event's entry, as an array of plain strings. Empty means valid.
 * `slug` is only used to make the messages self-contained.
 */
function entryProblems(slug, entry) {
  const problems = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${slug}: entry must be an object like { "paragraphs": [...] }`];
  }

  const { paragraphs } = entry;
  if (!Array.isArray(paragraphs)) {
    return [`${slug}: "paragraphs" must be an array of strings`];
  }

  if (paragraphs.length < MIN_PARAGRAPHS || paragraphs.length > MAX_PARAGRAPHS) {
    problems.push(
      `${slug}: ${paragraphs.length} paragraph(s), expected ${MIN_PARAGRAPHS}-${MAX_PARAGRAPHS}`
    );
  }

  let total = 0;
  paragraphs.forEach((paragraph, i) => {
    if (typeof paragraph !== 'string') {
      problems.push(`${slug}: paragraph ${i + 1} is not a string`);
      return;
    }
    const text = paragraph.trim();
    total += text.length;
    if (text !== paragraph) {
      problems.push(`${slug}: paragraph ${i + 1} has leading or trailing whitespace`);
    }
    if (text.includes('\n')) {
      problems.push(`${slug}: paragraph ${i + 1} contains a newline — split it into its own entry`);
    }
    if (text.length < MIN_PARAGRAPH_CHARS) {
      problems.push(`${slug}: paragraph ${i + 1} is ${text.length} chars, minimum ${MIN_PARAGRAPH_CHARS}`);
    }
    if (text.length > MAX_PARAGRAPH_CHARS) {
      problems.push(`${slug}: paragraph ${i + 1} is ${text.length} chars, maximum ${MAX_PARAGRAPH_CHARS}`);
    }
  });

  if (total > MAX_TOTAL_CHARS) {
    problems.push(`${slug}: ${total} chars total, maximum ${MAX_TOTAL_CHARS}`);
  }

  return problems;
}

module.exports = {
  DETAIL_DIR,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
  MIN_PARAGRAPH_CHARS,
  MAX_PARAGRAPH_CHARS,
  MAX_TOTAL_CHARS,
  entryProblems,
};
