import fs from 'fs';
import path from 'path';

// The format rules and the CHANGELOG.md parser live in one place so the release scripts
// and this test cannot drift apart. It is plain CommonJS outside src/, which is why it is
// required rather than imported — the same reason scripts/ is not part of tsconfig.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lib = require('../../scripts/release-notes-lib.js');

const NOTES_PATH = path.join(__dirname, '..', '..', 'public', 'release-notes.json');

interface Entry {
  version: string;
  date: string;
  notes: string[];
}

const notes: { documentedFrom: string; unreleased: string[]; releases: Entry[] } = JSON.parse(
  fs.readFileSync(NOTES_PATH, 'utf8')
);
const changelog: Array<{ version: string; date: string }> = lib.changelogVersions();
const changelogByVersion = new Map(changelog.map((entry) => [entry.version, entry.date]));

describe('public/release-notes.json', () => {
  it('declares the version its notes become mandatory from', () => {
    expect(notes.documentedFrom).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('lists each version once, newest first', () => {
    const versions = notes.releases.map((entry) => entry.version);
    expect(versions).toEqual([...new Set(versions)]);

    const sorted = [...versions].sort((a, b) => lib.compareVersions(b, a));
    expect(versions).toEqual(sorted);
  });

  // The sync contract. CHANGELOG.md is machine-generated and never hand-edited; this file
  // is the human gloss on it. Keying both by the same version AND date is what stops the
  // two histories describing different releases.
  it('matches CHANGELOG.md on every version and date it claims', () => {
    const offenders = notes.releases
      .filter((entry) => changelogByVersion.get(entry.version) !== entry.date)
      .map((entry) => {
        const actual = changelogByVersion.get(entry.version);
        return actual === undefined
          ? `${entry.version} is not in CHANGELOG.md`
          : `${entry.version} is dated ${entry.date} here but ${actual} in CHANGELOG.md`;
      });

    expect(offenders).toEqual([]);
  });

  // Releases older than the floor are optional backfill, and can be added or revised at
  // any time. From the floor on, shipping without a note is a release failure.
  it('has a note for every release at or after documentedFrom', () => {
    const documented = new Set(
      notes.releases.filter((entry) => entry.notes.length > 0).map((entry) => entry.version)
    );

    const offenders = changelog
      .filter((entry) => lib.compareVersions(entry.version, notes.documentedFrom) >= 0)
      .filter((entry) => !documented.has(entry.version))
      .map((entry) => `${entry.version} (${entry.date}) shipped with no release note`);

    expect(offenders).toEqual([]);
  });

  // `unreleased` is empty immediately after every release, so an empty list is not a
  // failure here. Requiring something to be staged is check-release-notes.js's job, at
  // release time. This only guards the shape of whatever is staged.
  it('holds only well-formed one-sentence notes', () => {
    const offenders: string[] = [];

    const check = (where: string, list: string[]) => {
      for (const note of list) {
        for (const problem of lib.validateNote(note) as string[]) {
          offenders.push(`${where}: "${note}" ${problem}`);
        }
      }
    };

    check('unreleased', notes.unreleased);
    for (const entry of notes.releases) check(entry.version, entry.notes);

    expect(offenders).toEqual([]);
  });
});
