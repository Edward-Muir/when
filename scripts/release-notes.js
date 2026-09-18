#!/usr/bin/env node
// Moves the staged `unreleased` notes into a versioned entry, at release time.
//
// Runs first in the `postchangelog` chain (.versionrc.json), i.e. after package.json has
// been bumped and after commit-and-tag-version has rewritten CHANGELOG.md, but before
// generate-rss.js and inject-version.js — both of which want the new entry to exist.
//
// The date is read from the CHANGELOG.md heading rather than from the clock. That is the
// whole sync guarantee: the two files can never disagree about when a version shipped,
// including when a release straddles UTC midnight.

const { changelogVersions, currentVersion, readNotes, writeNotes } = require('./release-notes-lib');

const version = currentVersion();
const notes = readNotes();

if (notes.releases.some((entry) => entry.version === version)) {
  // Idempotent: a re-run after a partially completed release is a no-op, not a duplicate.
  console.log(`Release notes for ${version} already recorded, nothing to do`);
  process.exit(0);
}

const changelogEntry = changelogVersions().find((entry) => entry.version === version);
if (!changelogEntry) {
  // package.json and CHANGELOG.md disagree about what is being released. Never paper over
  // it with today's date; a wrong date would fail the corpus test on the next run anyway.
  console.error(
    `❌ No CHANGELOG.md heading for ${version}. package.json and the changelog disagree.`
  );
  process.exit(1);
}

if (notes.unreleased.length === 0) {
  // check-release-notes.js should have caught this at `prerelease`; if the hook was
  // bypassed, stop here rather than recording a release with nothing to say.
  console.error(`❌ Nothing staged in "unreleased" to record against ${version}.`);
  process.exit(1);
}

notes.releases.unshift({
  version,
  date: changelogEntry.date,
  notes: notes.unreleased,
});
notes.unreleased = [];

writeNotes(notes);
console.log(
  `Release notes for ${version} (${changelogEntry.date}) recorded: ` +
    `${notes.releases[0].notes.length} note(s)`
);
