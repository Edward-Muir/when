import fs from 'fs';
import path from 'path';
import { MAX_FRIENDLY_NAME_LENGTH } from './eventNameLength';

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
// Read the manifest rather than hardcoding the file list, for the same reason
// eventDateClues.test.ts does: a hardcoded list silently stops guarding the moment a new
// event file is added, and the cap is only worth having if it covers every card the app can
// show. deprecated.json is excluded for free, since it is absent from the manifest.
const EVENT_FILES: string[] = (
  JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')) as {
    files: string[];
  }
).files;

describe('event friendly_name length', () => {
  it.each(EVENT_FILES)('%s has no friendly_name over the display limit', (file) => {
    const events = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
      fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')
    ) as Array<{ name: string; friendly_name: string }>;

    const offenders = events
      .filter((e) => (e.friendly_name || '').length > MAX_FRIENDLY_NAME_LENGTH)
      .map((e) => `[${e.friendly_name.length}] ${e.name}: ${e.friendly_name}`);

    expect(offenders).toEqual([]);
  });
});
