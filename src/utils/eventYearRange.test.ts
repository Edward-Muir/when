import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-var-requires */
const { entryProblems, maxSpanFor } = require('../../scripts/events/year-range.js');
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * `year_end` is the optional upper bound on an event whose date the record gives as a window.
 * A malformed one is not cosmetic: the placement rule in `gameLogic.ts` rests on
 * `start <= end` for every event, and a window far wider than its evidence slackens the
 * running bounds for every placement around it for the rest of the game.
 *
 * `gameLogic.eventEnd` clamps a bad value back to a point card at runtime so the board stays
 * judgeable, which means a broken record fails silently in play. This is what makes it loud.
 *
 * The rules come from `scripts/events/year-range.js`, the same module the maintainer scripts
 * validate against, so the corpus and the tool that writes it cannot drift apart.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

const MANIFEST_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;
const ALL_FILES = [...MANIFEST_FILES, 'deprecated.json'];

interface RangedEvent {
  name: string;
  year: number;
  year_end?: number;
}

function readEvents(file: string): RangedEvent[] {
  return JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- manifest-derived allowlist
    fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')
  );
}

const ranged: Array<{ file: string; event: RangedEvent }> = [];
for (const file of ALL_FILES) {
  for (const event of readEvents(file)) {
    if (event.year_end !== undefined) ranged.push({ file, event });
  }
}

describe('event year ranges', () => {
  it('every year_end passes the same validator the apply script uses', () => {
    const problems: string[] = [];
    for (const { file, event } of ranged) {
      const found = entryProblems(event.name, { year_end: event.year_end }, event, {});
      for (const problem of found) problems.push(`${file}: ${problem}`);
    }
    expect(problems).toEqual([]);
  });

  it('every year_end is an integer strictly after its year', () => {
    const bad = ranged
      .filter(({ event }) => !Number.isInteger(event.year_end) || event.year_end! <= event.year)
      .map(({ event }) => `${event.name}: year ${event.year}, year_end ${event.year_end}`);
    expect(bad).toEqual([]);
  });

  it('no range is wider than the ceiling for its era', () => {
    const tooWide = ranged
      .filter(({ event }) => event.year_end! - event.year > maxSpanFor(event.year))
      .map(
        ({ event }) =>
          `${event.name}: ${event.year_end! - event.year}y exceeds ${maxSpanFor(event.year)}y`
      );
    expect(tooWide).toEqual([]);
  });

  it('no range runs into the future', () => {
    const currentYear = new Date().getFullYear();
    const future = ranged
      .filter(({ event }) => event.year_end! > currentYear)
      .map(({ event }) => `${event.name}: ${event.year_end}`);
    expect(future).toEqual([]);
  });
});
