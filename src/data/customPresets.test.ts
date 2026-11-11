import fs from 'fs';
import path from 'path';
import { HistoricalEvent } from '../types';
import { CUSTOM_PRESETS } from './customPresets';
import { buildCustomGameConfig, deckPool, startingEventName } from '../utils/customDeck';
import { isCloudinaryImage } from '../utils/cloudinaryImage';
import { decodeChallengeCode } from '../utils/challengeCode';
import { minDeckSize } from '../utils/gameLogic';

/**
 * The Quick deck presets against the real catalogue: each painting is a fixed event that ships
 * (in a manifest file, with Cloudinary art, so the tile is never blank), and each preset deals
 * a deck the game will start.
 */
const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const MANIFEST_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;
const shipped: HistoricalEvent[] = MANIFEST_FILES.flatMap((file) =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- manifest-derived allowlist
  JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'))
);
// What `loadAllEvents` hands the game: first copy of each name, art required.
const seen = new Set<string>();
const catalogue = shipped.filter(
  (e) => isCloudinaryImage(e.image_url) && !seen.has(e.name) && (seen.add(e.name), true)
);

describe('Quick deck presets', () => {
  it.each(CUSTOM_PRESETS.map((p) => [p.name, p] as const))(
    '%s paints a shipped event with art',
    (_, preset) => {
      const event = catalogue.find((e) => e.name === preset.eventName);
      expect(event).toBeDefined();
      expect(isCloudinaryImage(event?.image_url)).toBe(true);
    }
  );

  it.each(CUSTOM_PRESETS.map((p) => [p.name, p] as const))(
    '%s deals a playable deck through the Play path',
    (_, preset) => {
      const { settings } = preset;
      const pool = deckPool(catalogue, settings);
      expect(pool.length).toBeGreaterThanOrEqual(
        minDeckSize(settings.playerCount, settings.suddenDeathHandSize)
      );
      const config = buildCustomGameConfig(settings);
      expect(config.mode).toBe('suddenDeath');
      expect(decodeChallengeCode(config.challengeCode ?? '')?.eras).toEqual(settings.selectedEras);
      const first = startingEventName(config, catalogue);
      expect(pool.some((e) => e.name === first)).toBe(true);
    }
  );

  it('gives each preset its own id and painting', () => {
    expect(new Set(CUSTOM_PRESETS.map((p) => p.id)).size).toBe(CUSTOM_PRESETS.length);
    expect(new Set(CUSTOM_PRESETS.map((p) => p.eventName)).size).toBe(CUSTOM_PRESETS.length);
  });
});
