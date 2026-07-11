import fs from 'fs';
import path from 'path';
import { MAX_FRIENDLY_NAME_LENGTH } from './eventNameLength';

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
// The content event files loaded by the app (mirrors public/events/manifest.json).
const EVENT_FILES = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
  'people',
  'clothing',
  'communication',
  'earth-life',
  'food',
  'games-sport',
  'law',
  'medicine',
  'migration',
  'money',
  'candidates',
  'sports',
];

describe('event friendly_name length', () => {
  it.each(EVENT_FILES)('%s.json has no friendly_name over the display limit', (file) => {
    const events = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- file is from a fixed allowlist
      fs.readFileSync(path.join(EVENTS_DIR, `${file}.json`), 'utf8')
    ) as Array<{ name: string; friendly_name: string }>;

    const offenders = events
      .filter((e) => (e.friendly_name || '').length > MAX_FRIENDLY_NAME_LENGTH)
      .map((e) => `[${e.friendly_name.length}] ${e.name}: ${e.friendly_name}`);

    expect(offenders).toEqual([]);
  });
});
