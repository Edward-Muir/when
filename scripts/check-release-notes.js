#!/usr/bin/env node
// The release gate: no human note, no release.
//
// Wired as the `prerelease` lifecycle script in .versionrc.json, so it runs before the
// version bump and before CHANGELOG.md is touched. A non-zero exit aborts the release with
// nothing written, locally and in the Release GitHub Action alike. The workflow also runs
// it as an explicit step so the failure is legible in the job log rather than buried in
// commit-and-tag-version's output.
//
// It deliberately cannot be satisfied by machinery: the note has to be a sentence someone
// wrote, staged in `unreleased` in public/release-notes.json.

const { SKIP_ENV_VAR, readNotes, skipRequested, validateNote } = require('./release-notes-lib');

function fail(lines) {
  console.error('\n❌ Release blocked: no usable release note.\n');
  for (const line of lines) console.error(`   ${line}`);
  console.error(
    '\n   Add one short sentence per notable change to "unreleased" in\n' +
      '   public/release-notes.json, describing what changed for a player.\n' +
      '   Example: "Some events now cover a span of years rather than a single date."\n'
  );
  process.exit(1);
}

const notes = readNotes();

// Whatever IS staged must still be well-formed, bypass or not: the flag exists to excuse
// having nothing to say, never to wave through a note that breaks the format.
const problems = [];
for (const note of notes.unreleased) {
  for (const problem of validateNote(note)) {
    problems.push(`"${note}" ${problem}`);
  }
}
if (problems.length > 0) fail(problems);

if (notes.unreleased.length === 0) {
  if (skipRequested()) {
    console.warn(
      `⚠️  ${SKIP_ENV_VAR} is set: releasing with no player-facing note.\n` +
        '   It will be recorded as a maintenance release and will not appear on /changelog.'
    );
    process.exit(0);
  }
  fail(['Nothing is staged in "unreleased".']);
}

console.log(
  `✅ ${notes.unreleased.length} release note${notes.unreleased.length === 1 ? '' : 's'} staged.`
);
