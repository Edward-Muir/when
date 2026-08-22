import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dateClues = require('../../scripts/events/date-clues.js');

/**
 * scripts/events/date-clues.js holds the detection rule in plain CommonJS so the
 * maintainer scripts can run it under a bare `node`. This test is what points it at the
 * real catalogue.
 *
 * The rule it enforces: no player-visible field may state the year the card is asking
 * the player to guess. Game.tsx already hides `event.year` for a card still in hand
 * (`shouldShowYearInPopup`), but GamePopup renders `description` right underneath it and
 * Card renders `friendly_name` at all times, so prose defeats that guard entirely.
 *
 * A failing message lists every offender, so it doubles as the worklist.
 */

interface EventRecord {
  name: string;
  year: number;
  friendly_name: string;
  description: string;
}

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

// Read the manifest rather than hardcoding the file list: a new event file would
// otherwise be silently unguarded. deprecated.json is excluded for free, because it is
// deliberately absent from the manifest and never loaded by the game.
const EVENT_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;

describe('event date clues', () => {
  it.each(EVENT_FILES)('%s states no date in player-visible text', (file) => {
    const events = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
      fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')
    ) as EventRecord[];

    const offenders = events
      .map((e) => ({ event: e, clues: dateClues.eventDateClues(e) }))
      .filter(({ clues }) => clues.length > 0)
      .map(({ event, clues }) => dateClues.formatOffender(event, clues));

    expect(offenders).toEqual([]);
  });

  it('ignores numbers that are not dates, and relative durations', () => {
    const notDates = [
      'Tetris was preloaded on the Hagenuk MT-2000.',
      'Aryabhata approximated pi as 3.1416.',
      'Two Boeing 747s collided.',
      'Athens and Sparta began a devastating 27-year war.',
      'Freed after 27 years in prison.',
    ];
    for (const text of notDates) {
      expect(dateClues.findDateClues(text)).toEqual([]);
    }
  });

  it('catches each clue kind', () => {
    const kind = (text: string) =>
      dateClues.findDateClues(text).map((c: { kind: string }) => c.kind);
    expect(kind('Won the title in 1949.')).toEqual(['year']);
    expect(kind('Ignited second-wave feminism in the 1960s.')).toEqual(['decade']);
    expect(kind('Defining headwear of 19th-century gentlemen.')).toEqual(['century']);
    expect(kind("After Alaric's sack of Rome in 410 CE.")).toEqual(['era']);
  });
});
