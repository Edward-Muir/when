// Shared helpers for the human-readable release notes.
//
// CHANGELOG.md is the machine spine: commit-and-tag-version writes it and it is never
// hand-edited. public/release-notes.json is the human gloss, keyed by the SAME version
// strings and dates, so the two can be checked against each other. Everything that reads
// or writes either file goes through here, so the format rules and the changelog regex
// have exactly one definition:
//
//   scripts/check-release-notes.js  - the release gate (a note must be staged)
//   scripts/release-notes.js        - moves `unreleased` into a versioned entry
//   scripts/inject-version.js       - copies the current entry into public/version.json
//   src/utils/releaseNotes.test.ts  - the corpus test that keeps the two files in sync
//
// Plain CommonJS with no dependencies: it runs from commit-and-tag-version lifecycle
// hooks, which execute before anything has been built.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NOTES_PATH = path.join(ROOT, 'public', 'release-notes.json');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');
const PACKAGE_PATH = path.join(ROOT, 'package.json');

// A note is one short sentence a player could read. The bounds are deliberately tight:
// the update popup shows these on a phone, and a paragraph there is as useless as the
// generic "new version available" copy this replaced.
const MIN_NOTE_LENGTH = 20;
const MAX_NOTE_LENGTH = 120;

// Set by the Release workflow's `skip-note` dispatch input, and only ever on a manual
// dispatch — an auto-release on push to main must not be able to reach it. It lets a
// maintenance release (a docs/chore/ci merge forced out by hand) through without a
// player-facing note, recorded as such rather than recorded as nothing. See
// docs/release-notes.md.
const SKIP_ENV_VAR = 'SKIP_RELEASE_NOTE';

function skipRequested() {
  return process.env[SKIP_ENV_VAR] === 'true';
}

// Same shape generate-rss.js parses, so both agree on what counts as a released version.
const CHANGELOG_VERSION_REGEX =
  /^## \[?(\d+\.\d+\.\d+)\]?(?:\([^)]+\))?\s*\((\d{4}-\d{2}-\d{2})\)/gm;

const BANNED_PATTERNS = [
  {
    // The whole point is prose rather than commit subjects.
    test: /^(feat|fix|perf|chore|docs|refactor|test|build|style|ci)(\([^)]*\))?!?:/i,
    why: 'starts with a conventional-commit prefix',
  },
  { test: /\[[^\]]*\]\([^)]*\)/, why: 'contains a markdown link' },
  { test: /#\d+/, why: 'contains an issue reference' },
  // Needs a digit, so ordinary words built only from a-f ("defaced") are not SHAs.
  { test: /\b(?=[0-9a-f]{7,}\b)[0-9a-f]*\d[0-9a-f]*\b/, why: 'contains a commit SHA' },
  // House style, the same rules docs/event-detail/writing-spec.md enforces on the prose.
  { test: /[—–]/, why: 'contains an em or en dash' },
  { test: /\b(you|your|yours)\b/i, why: 'addresses the player in the second person' },
];

/** Validate one note. Returns an array of problems, empty when the note is fine. */
function validateNote(note) {
  const problems = [];

  if (typeof note !== 'string') return ['is not a string'];

  const trimmed = note.trim();
  if (trimmed !== note) problems.push('has leading or trailing whitespace');
  if (trimmed.length < MIN_NOTE_LENGTH) {
    problems.push(`is shorter than ${MIN_NOTE_LENGTH} characters`);
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    problems.push(`is longer than ${MAX_NOTE_LENGTH} characters (${trimmed.length})`);
  }
  // One sentence. A full stop at the very end is fine; one in the middle means two.
  if (/\.\s/.test(trimmed)) problems.push('is more than one sentence');
  if (!/^[A-Z0-9]/.test(trimmed)) problems.push('does not start with a capital or a digit');

  for (const { test, why } of BANNED_PATTERNS) {
    if (test.test(trimmed)) problems.push(why);
  }

  return problems;
}

function readNotes() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // inject-version.js runs at `prebuild`, so a missing file would otherwise take down
    // every Vercel build, previews included. Returning an empty history instead costs
    // nothing: check-release-notes.js then sees nothing staged and blocks the release, and
    // the corpus test fails on the null floor. Both are the right outcomes; neither needs
    // to be delivered by way of a broken build.
    raw = {};
  }
  return {
    documentedFrom: raw.documentedFrom ?? null,
    unreleased: Array.isArray(raw.unreleased) ? raw.unreleased : [],
    releases: Array.isArray(raw.releases) ? raw.releases : [],
  };
}

function writeNotes(notes) {
  // Two-space JSON plus a trailing newline, which is what Prettier produces for *.json.
  fs.writeFileSync(NOTES_PATH, `${JSON.stringify(notes, null, 2)}\n`);
}

/** Every released version in CHANGELOG.md, newest first: [{ version, date }]. */
function changelogVersions() {
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const versions = [];
  let match;
  CHANGELOG_VERSION_REGEX.lastIndex = 0;
  while ((match = CHANGELOG_VERSION_REGEX.exec(changelog)) !== null) {
    versions.push({ version: match[1], date: match[2] });
  }
  return versions;
}

function currentVersion() {
  return JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8')).version;
}

/** Negative when a < b, positive when a > b. Plain x.y.z only; this repo tags no pre-releases. */
function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

module.exports = {
  CHANGELOG_PATH,
  SKIP_ENV_VAR,
  skipRequested,
  MAX_NOTE_LENGTH,
  MIN_NOTE_LENGTH,
  NOTES_PATH,
  changelogVersions,
  compareVersions,
  currentVersion,
  readNotes,
  validateNote,
  writeNotes,
};
