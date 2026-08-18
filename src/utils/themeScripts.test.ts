import fs from 'fs';
import path from 'path';
import { buildDifficultyIndex } from './difficultyScore';
import { filterByDifficulty, filterByCategory, filterByEra } from './eventLoader';
import { isCloudinaryImage } from './cloudinaryImage';
import { ALL_ERAS } from './eras';
import { ALL_CATEGORIES, DEFAULT_DIFFICULTIES, HistoricalEvent } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const catalogueJs = require('../../scripts/themes/catalogue.js');

/**
 * scripts/themes/catalogue.js re-implements the playable-event filter and the difficulty
 * index in plain CommonJS, because the publish workflow runs it with a bare `node` and no
 * build step. That is a duplicate of logic that already exists in TypeScript, so this is the
 * thing that fails when the two drift — the alternative is a comment asking future readers to
 * remember, which the house rule says is worth less.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

function loadEligibleViaSrc(): HistoricalEvent[] {
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
  const playable = all
    .filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)))
    .filter((e) => isCloudinaryImage(e.image_url));

  // Exactly what buildDailyPool does for an "Everything" day.
  return filterByEra(
    filterByCategory(filterByDifficulty(playable, [...DEFAULT_DIFFICULTIES]), [...ALL_CATEGORIES]),
    [...ALL_ERAS]
  );
}

describe('the theme scripts see the same catalogue the game does', () => {
  const fromSrc = loadEligibleViaSrc();
  const fromScript = catalogueJs.loadEligibleEvents() as HistoricalEvent[];

  it('selects an identical eligible set', () => {
    expect(fromScript.map((e) => e.name).sort()).toEqual(fromSrc.map((e) => e.name).sort());
  });

  it('agrees on every event’s difficulty band', () => {
    const real = buildDifficultyIndex(fromSrc);
    const script = catalogueJs.buildIndex(fromScript);

    const disagreements = fromSrc.filter((e) => real.bandOf(e) !== script.bandOf(e));

    // Exact agreement is not required and would be brittle: both sides cut on global
    // quartiles, so events sitting exactly on a boundary can fall either side of it. What
    // matters is that a theme graded by the script gets the same picture the game will.
    expect(disagreements.length / fromSrc.length).toBeLessThan(0.01);
  });

  it('agrees on the CDF coordinate the spacing kernel uses', () => {
    const real = buildDifficultyIndex(fromSrc);
    const script = catalogueJs.buildIndex(fromScript);

    const worst = fromSrc.reduce((max, e) => Math.max(max, Math.abs(real.uOf(e) - script.u(e))), 0);
    expect(worst).toBeLessThan(0.001);
  });
});
