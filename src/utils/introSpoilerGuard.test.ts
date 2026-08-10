import fs from 'fs';
import path from 'path';
import { buildDailyDeck } from './dailyConfig';
import { pickIntroEvents } from './introEvents';
import { isCloudinaryImage } from './cloudinaryImage';
import { HistoricalEvent } from '../types';

/**
 * The intro animation renders each card's name *and* year — the answer. It draws from a
 * bounded pool, the daily deck draws from a themed slice of the same catalogue, and the two
 * collide often enough to matter (see the first test). Because both are deterministic, an
 * unguarded collision would spoil that day's leaderboard-scored daily for every player, on
 * every replay — so App passes the deck's first cards to pickIntroEvents as `exclude`.
 *
 * This runs against the real catalogue rather than a fixture, because the collision rate is
 * a property of the actual data.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
// A game reaches at most 13 cards (seed + 5-card hand + one draw per turn over 7 turns);
// mirrors DAILY_SPOILER_DEPTH in App.tsx.
const SPOILER_DEPTH = 15;
const DAYS = 120;
const ROTATIONS = 3;

function loadCatalogue(): HistoricalEvent[] {
  const manifest = JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed path
    fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
  ) as { files: string[] };

  const all: HistoricalEvent[] = [];
  for (const file of manifest.files) {
    all.push(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- from the manifest
      ...(JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as HistoricalEvent[])
    );
  }

  // Mirrors eventLoader: dedupe by name, then keep only Cloudinary-backed events.
  const seen = new Set<string>();
  return all
    .filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)))
    .filter((e) => isCloudinaryImage(e.image_url));
}

const catalogue = loadCatalogue();

/** UTC dates starting from an arbitrary fixed Monday, so the run is reproducible. */
const dates = Array.from(
  { length: DAYS },
  (_, d) => new Date(Date.UTC(2026, 7, 10) + d * 86_400_000).toISOString().split('T')[0]
);

const deckFor = (dateString: string) =>
  new Set(
    buildDailyDeck(catalogue, dateString)
      .slice(0, SPOILER_DEPTH)
      .map((e) => e.name)
  );

describe('intro animation vs. the daily deck', () => {
  it('would collide on real data without the guard', () => {
    // Guards the guard: if this ever drops to zero the exclusion is dead weight and can go,
    // but as of a 5,291-event catalogue it fires on roughly one day in six.
    let collisionDays = 0;
    for (const dateString of dates) {
      const deck = deckFor(dateString);
      const hits = Array.from({ length: ROTATIONS }, (_, rotation) =>
        pickIntroEvents(catalogue, { dateString, rotation }).filter((e) => deck.has(e.name))
      ).flat();
      if (hits.length > 0) collisionDays++;
    }
    expect(collisionDays).toBeGreaterThan(0);
  });

  it('never shows a card from that day’s daily deck when guarded', () => {
    for (const dateString of dates) {
      const exclude = deckFor(dateString);
      for (let rotation = 0; rotation < ROTATIONS; rotation++) {
        const intro = pickIntroEvents(catalogue, { dateString, rotation, exclude });
        expect(intro.filter((e) => exclude.has(e.name))).toEqual([]);
        // Excluding must not shrink the intro — replacements come from the same pool.
        expect(intro).toHaveLength(20);
      }
    }
  });
});
