import fs from 'fs';
import path from 'path';
import { buildDifficultyIndex, ALL_BANDS } from './difficultyScore';
import { isCloudinaryImage } from './cloudinaryImage';
import { HistoricalEvent } from '../types';

/**
 * Runs against the real catalogue, because the whole point of the composite score is
 * a property of the actual data: the shipped `difficulty` labels grade recognition,
 * and recognition disagrees with placeability.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

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

  const seen = new Set<string>();
  return all
    .filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)))
    .filter((e) => isCloudinaryImage(e.image_url));
}

const catalogue = loadCatalogue();

describe('buildDifficultyIndex', () => {
  const index = buildDifficultyIndex(catalogue);

  it('spreads the catalogue across all four bands', () => {
    const counts = new Map<number, number>();
    for (const event of catalogue) {
      const band = index.bandOf(event);
      counts.set(band, (counts.get(band) ?? 0) + 1);
    }
    // Quartiles, so each band should hold roughly a quarter. Ties in the composite
    // score stop this being exact, hence the generous range.
    for (const band of ALL_BANDS) {
      const share = (counts.get(band) ?? 0) / catalogue.length;
      expect(share).toBeGreaterThan(0.15);
      expect(share).toBeLessThan(0.35);
    }
  });

  it('orders u by year, spanning 0 to 1', () => {
    const sorted = [...catalogue].sort((a, b) => a.year - b.year);
    const first = sorted.at(0);
    const last = sorted.at(-1);
    expect(first && index.uOf(first)).toBe(0);
    expect(last && index.uOf(last)).toBe(1);

    // u is a rank, so it must be monotone in year.
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted.at(i - 1);
      const curr = sorted.at(i);
      if (!prev || !curr) continue;
      expect(index.uOf(curr)).toBeGreaterThanOrEqual(index.uOf(prev));
    }
  });

  it('measures crowded modern events as harder to place than isolated ancient ones', () => {
    // The motivating case. Both are real cards with the labels the data ships.
    const moon = catalogue.find((e) => e.name === 'moon-landing');
    const archean = catalogue.find((e) => e.name === 'archean-eon-begins');
    if (!moon || !archean) {
      throw new Error('expected fixture events missing from the catalogue');
    }

    // Archean is `hard` rather than `very-hard` because its description ("first
    // stable continents", "earliest microbial life") anchors the era even though
    // the name means nothing to a general audience — recognition and inferability
    // are graded separately. Either label serves the point below.
    expect(moon.difficulty).toBe('easy');
    expect(archean.difficulty).not.toBe('easy');
    // ...yet the "easy" one sits in a far more crowded stretch of timeline.
    expect(index.get(moon).density).toBeGreaterThan(index.get(archean).density);
  });

  it('treats deep time and far-future years without blowing up', () => {
    const extremes = catalogue.filter((e) => e.year < -10000 || e.year > 2100);
    expect(extremes.length).toBeGreaterThan(0);
    for (const event of extremes) {
      const m = index.get(event);
      expect(Number.isFinite(m.u)).toBe(true);
      expect(Number.isFinite(m.score)).toBe(true);
      expect(m.u).toBeGreaterThanOrEqual(0);
      expect(m.u).toBeLessThanOrEqual(1);
    }
  });

  it('falls back rather than throwing for an event it has never seen', () => {
    const stranger: HistoricalEvent = {
      name: 'not-in-the-catalogue',
      friendly_name: 'Stranger',
      year: 1900,
      category: 'science',
      description: '',
      difficulty: 'medium',
    };
    expect(() => index.get(stranger)).not.toThrow();
    expect(Number.isFinite(index.uOf(stranger))).toBe(true);
  });

  it('memoises per catalogue array', () => {
    expect(buildDifficultyIndex(catalogue)).toBe(index);
  });
});
