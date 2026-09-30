/**
 * Shared rules for an event's `regions` tags: what a valid tag list is, and its canonical
 * order.
 *
 * Plain CommonJS with no third-party dependencies, so `node` runs the report/apply/audit
 * scripts with no build step and the Jest corpus test can `require` it across the tsconfig
 * boundary. Same arrangement as `year-range.js` and `detail-spec.js`: the script that writes
 * the catalogue and the test that guards it validate against one definition.
 *
 * The taxonomy itself is `src/data/regions.json`, required from here rather than copied,
 * because the app needs it too (`src/utils/regions.ts`) and CRA cannot import from outside
 * `src/`. The rules for *choosing* tags are in docs/regions/tagging-spec.md; this file only
 * decides whether a list is well formed.
 *
 * **Tags are readable names, never codes.** "United States", not "US" or "USA". An alias gets
 * a "did you mean" hint but is still rejected: the map on disk should say what was decided.
 */

const taxonomy = require('../../src/data/regions.json');
const { NAMES, DEMONYMS } = require('./region-aliases');

const REGIONS = taxonomy.regions;
const COUNTRIES = taxonomy.countries;
const GLOBAL = 'Global';

/** More than this many countries means the footprint wants a region tag instead. */
const MAX_COUNTRIES = 6;
/**
 * More than this many macro-regions (Global aside) means the footprint is worldwide, which is
 * what Global is for. Four is the Silk Road: East Asia, Central Asia, the Middle East, Europe.
 */
const MAX_REGIONS = 4;

const ALLOWED_KEYS = new Set(['regions', 'note']);

const isRegion = (tag) => REGIONS.includes(tag);
const isCountry = (tag) => Object.prototype.hasOwnProperty.call(COUNTRIES, tag);

/** The macro-regions a tag list resolves to. Mirrors `eventRegionSet` in src/utils/regions.ts. */
function regionSetOf(tags) {
  const out = new Set();
  for (const tag of tags) {
    if (isRegion(tag)) out.add(tag);
    else if (isCountry(tag) && COUNTRIES[tag].region) out.add(COUNTRIES[tag].region);
  }
  return out;
}

/**
 * The stored form of a tag list: duplicates dropped, any region a country already implies
 * dropped ("Germany" is already in Europe), countries alphabetically, then regions in taxonomy
 * order. The apply script writes this form and the corpus test insists on it, so a writer
 * never has to think about order and two batches that agree produce the same bytes.
 *
 * A region that names a transcontinental country's side is never dropped, even when another
 * country implies it: in ["Syria", "Turkey", "Middle East & North Africa"] the region is what
 * says which Turkey, and without it the stored form fails the transcontinental rule.
 */
function canonicalRegions(tags) {
  const unique = [...new Set(tags)];
  const implied = new Set();
  for (const tag of unique) {
    if (isCountry(tag) && COUNTRIES[tag].region) implied.add(COUNTRIES[tag].region);
  }
  for (const tag of unique) {
    const spans = isCountry(tag) && COUNTRIES[tag].spans;
    if (spans) spans.forEach((side) => implied.delete(side));
  }
  const countries = unique.filter(isCountry).sort((a, b) => a.localeCompare(b, 'en'));
  const regions = REGIONS.filter((r) => unique.includes(r) && !implied.has(r));
  return [...countries, ...regions];
}

function suggestionFor(tag) {
  const alias = NAMES[tag] || DEMONYMS[tag];
  if (alias && alias.length === 1) return alias[0];
  const lower = tag.toLowerCase();
  return (
    Object.keys(COUNTRIES).find((c) => c.toLowerCase() === lower) ||
    REGIONS.find((r) => r.toLowerCase() === lower)
  );
}

/** Problems with the tags themselves: unknown names, and the transcontinental rule. */
function tagProblems(slug, tags) {
  const problems = [];
  for (const tag of tags) {
    if (isCountry(tag) || isRegion(tag)) continue;
    const hint = suggestionFor(String(tag));
    problems.push(
      `${slug}: unknown tag ${JSON.stringify(tag)}` +
        (hint ? ` (did you mean "${hint}"?)` : ' (not in src/data/regions.json)')
    );
  }
  for (const tag of tags) {
    const spans = isCountry(tag) && COUNTRIES[tag].spans;
    if (spans && !spans.some((r) => tags.includes(r))) {
      problems.push(
        `${slug}: "${tag}" spans ${spans.join(' and ')}, so the side the event sits on must be ` +
          `tagged explicitly as one of those regions`
      );
    }
  }
  return problems;
}

/** Problems with the size and shape of an otherwise well-named list. */
function footprintProblems(slug, tags) {
  const problems = [];
  const countries = tags.filter(isCountry);
  if (countries.length > MAX_COUNTRIES) {
    problems.push(
      `${slug}: ${countries.length} countries (max ${MAX_COUNTRIES}); tag a region for a wide footprint`
    );
  }
  const regions = regionSetOf(tags);
  if (regions.size === 0) {
    problems.push(
      `${slug}: resolves to no region; Antarctica alone needs an actor country or "Global"`
    );
  }
  const nonGlobal = [...regions].filter((r) => r !== GLOBAL);
  if (nonGlobal.length > MAX_REGIONS) {
    problems.push(
      `${slug}: spans ${nonGlobal.length} regions (max ${MAX_REGIONS}); a footprint that wide is "Global" plus its focal places`
    );
  }
  return problems;
}

/**
 * Problems with one proposed entry, as human-readable strings; empty when it is valid.
 *
 * `entry` is `{ regions: string[], note?: string }`. `event` is the catalogue record, or
 * undefined when the slug does not resolve. `requireNote: false` is for validating what is
 * already stored, since the note on a Global-only entry is for the reviewer and is not written
 * to the catalogue.
 */
/** Problems with the entry's shape. `fatal` means the tags cannot be read any further. */
function shapeProblems(slug, entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return {
      fatal: true,
      problems: [`${slug}: entry must be an object like { "regions": ["Germany"] }`],
    };
  }
  const problems = Object.keys(entry)
    .filter((key) => !ALLOWED_KEYS.has(key))
    .map((key) => `${slug}: may not set "${key}"`);
  const tags = entry.regions;
  if (!Array.isArray(tags) || tags.length === 0) {
    return {
      fatal: true,
      problems: [...problems, `${slug}: "regions" must be a non-empty array of names`],
    };
  }
  if (tags.some((t) => typeof t !== 'string')) {
    return { fatal: true, problems: [...problems, `${slug}: every tag must be a string`] };
  }
  if (new Set(tags).size !== tags.length) problems.push(`${slug}: duplicate tag`);
  if (entry.note !== undefined && (typeof entry.note !== 'string' || !entry.note.trim())) {
    problems.push(`${slug}: "note" must be a non-empty string when present`);
  }
  return { fatal: false, problems };
}

function entryProblems(slug, entry, event, { requireNote = true } = {}) {
  if (!event) return [`${slug}: no such event in the manifest`];
  const shape = shapeProblems(slug, entry);
  if (shape.fatal) return shape.problems;
  const problems = shape.problems;
  const tags = entry.regions;

  const nameProblems = tagProblems(slug, tags);
  problems.push(...nameProblems);
  if (nameProblems.length) return problems;
  problems.push(...footprintProblems(slug, tags));

  const globalOnly = tags.length === 1 && tags[0] === GLOBAL;
  if (globalOnly && requireNote && !entry.note) {
    problems.push(
      `${slug}: "Global" alone needs a "note" saying why no place is focal ` +
        `(Global is a footprint, not a measure of importance)`
    );
  }
  return problems;
}

module.exports = {
  REGIONS,
  COUNTRIES,
  GLOBAL,
  MAX_COUNTRIES,
  MAX_REGIONS,
  isRegion,
  isCountry,
  regionSetOf,
  canonicalRegions,
  entryProblems,
};
