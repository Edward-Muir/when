/**
 * The shape and voice rules for an event's long-form detail prose.
 *
 * Plain CommonJS with no dependencies, for the same reason as `date-clues.js`: the maintainer
 * scripts run under a bare `node` with no build step, and `src/utils/eventDetailCorpus.test.ts`
 * can `require` it across the tsconfig boundary. One definition, three consumers.
 *
 * The prose rules these enforce are in docs/event-detail/writing-spec.md, and the authoring
 * workflow is .claude/skills/write-event-detail/SKILL.md. Rules that cannot be checked here
 * (the hook, the register carve-out, whether a claim is true) live only in those two.
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

// Settled in Phase 2 against ten hand-written entries and a sub-agent calibration run, replacing
// the deliberately wide 200-900/2,200 placeholders Phase 1 shipped so it could not reject good
// writing sight-unseen.
//
// The reading surface is a 476px scroll region, roughly 20 lines at a 402px-wide phone, so the
// ~900-char target is about 1.3 screens once the image has scrolled away. The total ceiling binds
// on three paragraphs and the total floor binds on two, so neither a padded wall nor a two-stub
// entry passes. Both caps did real work in calibration: an atrocity entry that tried to carry a
// contested death toll, its attribution and a consequence paragraph hit 1,428 and had to lose the
// paragraph rather than the attribution.
const MIN_PARAGRAPH_CHARS = 240;
const MAX_PARAGRAPH_CHARS = 520;
const MIN_TOTAL_CHARS = 620;
const MAX_TOTAL_CHARS = 1250;

/**
 * Patterns a written entry may not contain.
 *
 * Every one was measured against all 5,460 existing `description` + `friendly_name` strings before
 * being adopted, because a ban that fires on good historical writing would block Phase 3 for 137
 * batches. The `seen` count on each is that measurement: how many existing descriptions it
 * matches. Those descriptions were written years ago to a different standard and are not being
 * rewritten — a non-zero count means "plausible enough English that a writer will reach for it",
 * which is the argument for banning it here, not against.
 *
 * The broad participial-clause regex was dropped at 39 hits and narrowed to seven verbs (17).
 *
 * Sources for the machine-tell list are cited in docs/event-detail/writing-spec.md.
 */
const BANNED_PATTERNS = [
  // --- Rule 7: the game's own rules -------------------------------------------------------
  { seen: 0, label: 'second person', re: /\b(you|your|yours|yourself)\b/i },
  { seen: 0, label: 'a question mark (no rhetorical questions)', re: /\?/ },
  {
    seen: 0,
    label: 'describing the card art',
    re: /\b(pictured|depicted|shown here|the image (shows|above))\b/i,
  },

  // --- Rule 8: punctuation and typography -------------------------------------------------
  // The em dash is the single most recognisable machine tell, and a comma, colon, semicolon or
  // full stop does everything it does without the signature.
  { seen: 0, label: 'an em or en dash (use a comma, colon or full stop)', re: /[–—]/ },
  { seen: 0, label: 'a curly quote or apostrophe (use straight ones)', re: /[‘’“”]/ },

  // --- Rule 8: banned constructions -------------------------------------------------------
  {
    seen: 0,
    label: '"not just X, but Y" parallelism',
    re: /\bnot (just|only|merely|simply)\b[^.]{0,80}\bbut\b/i,
  },
  {
    seen: 0,
    label: 'copula avoidance ("serves as" — just use "was")',
    re: /\b(serves|served|stands|stood|functions|functioned) as\b/i,
  },
  {
    seen: 17,
    label: 'a trailing participial summary clause',
    re: /,\s+(highlighting|underscoring|emphasizing|showcasing|cementing|solidifying|ushering)\b/i,
  },
  {
    seen: 3,
    label: 'vague attribution (name the source or cut the claim)',
    re: /\b(experts (say|argue|believe)|many believe|it is widely believed|some say|it is said that|widely regarded as|often cited as)\b/i,
  },
  {
    seen: 12,
    label: 'a legacy closer',
    re: /\b(paved the way|set(ting)? the stage|turning point|indelible mark|(lasting|enduring) legacy|would go on to|to this day|forever chang\w+|changed the course of history|the rest (is|was) history|left (its|his|her|their) mark|captur(ed|ing) the (public )?imagination|mark(ed|ing|s) (a|the) (shift|new era|watershed|milestone))\b/i,
  },
  {
    seen: 0,
    label: 'critic-speak',
    re: /\b(load[- ]bearing|does the heavy lifting|punch(es|ing)? above its weight|in conversation with)\b/i,
  },

  // --- Rule 8: banned vocabulary ----------------------------------------------------------
  // Phrase-scoped where the bare word has a legitimate historical sense: `testament` (a will, the
  // Old and New Testaments), `realm` (a kingdom), `tapestry` (the Bayeux one), `beacon` (a light).
  { seen: 0, label: 'a testament to', re: /\btestament to\b/i },
  {
    seen: 0,
    label: 'realm of / beacon of / tapestry of',
    re: /\b(realm of|beacon of|tapestry of|(rich|intricate) tapestry)\b/i,
  },
  {
    seen: 0,
    label: 'rich history / rich tradition',
    re: /\brich (history|tradition|cultural|heritage|array)\b/i,
  },
  { seen: 0, label: 'in the heart of', re: /\bin the heart of\b/i },
  {
    seen: 33,
    label: 'puffery vocabulary',
    re: /\b(delve\w*|pivotal|crucial|underscor\w+|showcas\w+|intricate|meticulous\w*|vibrant|robust|boasts|nestled|groundbreaking|renowned|multifaceted|foster(s|ed|ing)|enhanc\w+|interplay|deep dive)\b/i,
  },
  {
    seen: 0,
    label: 'hedge-filler',
    re: /\b(arguably|it is worth noting|worth noting that|no small feat)\b/i,
  },
  {
    seen: 0,
    label: 'a sentence-initial discourse marker',
    re: /(^|\.\s+)(Notably|Indeed|Ultimately|Moreover|Furthermore|In many ways|Perhaps most)\b/,
  },
];

/** A run of this many consecutive words shared with the event's own `description` is a restatement. */
const RESTATEMENT_RUN_WORDS = 7;

function wordsOf(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

/** Every `RESTATEMENT_RUN_WORDS`-long word run in `text`, as joined strings. */
function runsOf(text) {
  const words = wordsOf(text);
  const runs = new Set();
  for (let i = 0; i + RESTATEMENT_RUN_WORDS <= words.length; i++) {
    runs.add(words.slice(i, i + RESTATEMENT_RUN_WORDS).join(' '));
  }
  return runs;
}

/**
 * Every problem with one event's entry, as an array of plain strings. Empty means valid.
 *
 * `slug` is only used to make the messages self-contained. `event` is optional: when the caller
 * has the event record to hand, the restatement check against its `description` runs too. Both
 * real callers do — `detail-apply.js` and `eventDetailCorpus.test.ts` — and it stays optional so
 * a quick one-off check can still be run without loading the catalogue.
 */
function entryProblems(slug, entry, event) {
  const problems = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${slug}: entry must be an object like { "paragraphs": [...] }`];
  }

  // `placeholder: true` is the only other key an entry may carry — written by
  // detail-placeholder.js, read by detail-report.js, ignored by the runtime.
  const { paragraphs, placeholder } = entry;
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
      problems.push(
        `${slug}: paragraph ${i + 1} is ${text.length} chars, minimum ${MIN_PARAGRAPH_CHARS}`
      );
    }
    if (text.length > MAX_PARAGRAPH_CHARS) {
      problems.push(
        `${slug}: paragraph ${i + 1} is ${text.length} chars, maximum ${MAX_PARAGRAPH_CHARS}`
      );
    }
    // A paragraph that stops mid-sentence is nearly always a truncated generation.
    if (text && !/[.!"')\]]$/.test(text)) {
      problems.push(`${slug}: paragraph ${i + 1} does not end in terminal punctuation`);
    }

    // The placeholder corpus opens every entry with a marker and is exempt from voice rules; it
    // is lorem, and detail-report.js already refuses to call it done.
    if (placeholder) return;

    if (/PLACEHOLDER/i.test(text)) {
      problems.push(`${slug}: paragraph ${i + 1} contains PLACEHOLDER but is not flagged as one`);
    }
    for (const { label, re } of BANNED_PATTERNS) {
      const match = re.exec(text);
      if (match) problems.push(`${slug}: paragraph ${i + 1} contains ${label} — "${match[0]}"`);
    }
  });

  if (total < MIN_TOTAL_CHARS) {
    problems.push(`${slug}: ${total} chars total, minimum ${MIN_TOTAL_CHARS}`);
  }
  if (total > MAX_TOTAL_CHARS) {
    problems.push(`${slug}: ${total} chars total, maximum ${MAX_TOTAL_CHARS}`);
  }

  // The description is the text this prose replaced, one tap ago. Repeating it tells the player
  // their tap bought nothing. Checked against every paragraph, not just the first: restating it
  // in the last one is the same defect.
  if (event && event.description && !placeholder) {
    const fromDescription = runsOf(event.description);
    for (const [i, paragraph] of paragraphs.entries()) {
      if (typeof paragraph !== 'string') continue;
      const shared = [...runsOf(paragraph)].find((run) => fromDescription.has(run));
      if (shared) {
        problems.push(
          `${slug}: paragraph ${i + 1} restates the description — "${shared}". ` +
            `Extend its fact, do not repeat it.`
        );
      }
    }
  }

  return problems;
}

module.exports = {
  DETAIL_DIR,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
  MIN_PARAGRAPH_CHARS,
  MAX_PARAGRAPH_CHARS,
  MIN_TOTAL_CHARS,
  MAX_TOTAL_CHARS,
  BANNED_PATTERNS,
  RESTATEMENT_RUN_WORDS,
  entryProblems,
};
