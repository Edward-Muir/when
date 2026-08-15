import fs from 'fs';
import path from 'path';
import { buildRampedDeck, RAMP_WINDOW, SPREAD, MIN_POOL_AFTER_EXCLUSION } from './deckBuilder';
import { buildDifficultyIndex } from './difficultyScore';
import { buildDailyPool } from './dailyPool';
import { buildDailyDeck } from './dailyConfig';
import {
  getRecentDailyCardNames,
  clearRecencyCache,
  RECENCY_DAYS,
  CHAIN_ANCHOR_DAYS,
} from './dailyRecency';
import { shuffleArraySeeded } from './gameLogic';
import { isCloudinaryImage } from './cloudinaryImage';
import { HistoricalEvent, Difficulty } from '../types';

/**
 * Runs against the real catalogue. Every property under test — the ramp, the repeat
 * rates, the thin-pool behaviour — is a property of the actual event data, and a
 * fixture would prove nothing about the game people play.
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
const index = buildDifficultyIndex(catalogue);

const DAY_MS = 86400000;
function addDays(dateString: string, delta: number): string {
  const d = new Date(Date.parse(dateString) + delta * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function consecutiveDays(count: number, from: string): string[] {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

/** Mean band index across a slice of a deck — the ramp expressed as one number. */
function meanBand(deck: HistoricalEvent[], from: number, to: number): number {
  const slice = deck.slice(from, to);
  return slice.reduce((sum, e) => sum + index.bandOf(e), 0) / slice.length;
}

/**
 * Median width of the gap each card lands in, playing an ideal run onto a growing
 * timeline. This is the real measure of placement difficulty: a wide gap is an easy
 * drop, a narrow one is a hard one.
 */
function gapWidths(deck: HistoricalEvent[]): number[] {
  const timeline = [index.uOf(deck[0])];
  const gaps: number[] = [];
  for (let i = 1; i < deck.length; i++) {
    const u = index.uOf(deck.at(i) as HistoricalEvent);
    let at = 0;
    while (at < timeline.length && (timeline.at(at) ?? 0) < u) at++;
    const left = at > 0 ? (timeline.at(at - 1) ?? 0) : 0;
    const right = at < timeline.length ? (timeline.at(at) ?? 1) : 1;
    gaps.push(right - left);
    timeline.splice(at, 0, u);
  }
  return gaps;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.at(Math.floor(sorted.length / 2)) ?? 0;
}

describe('buildRampedDeck', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `seed-${i}`);

  it('is deterministic for a given seed', () => {
    const a = buildRampedDeck(catalogue, '2026-08-13', { allEvents: catalogue });
    const b = buildRampedDeck(catalogue, '2026-08-13', { allEvents: catalogue });
    expect(a.map((e) => e.name)).toEqual(b.map((e) => e.name));
  });

  it('returns every eligible card exactly once', () => {
    const deck = buildRampedDeck(catalogue, 'permutation', { allEvents: catalogue });
    expect(deck).toHaveLength(catalogue.length);
    expect(new Set(deck.map((e) => e.name)).size).toBe(catalogue.length);
  });

  it('ramps difficulty across the window', () => {
    const decks = seeds.map((s) => buildRampedDeck(catalogue, s, { allEvents: catalogue }));
    const early = decks.reduce((sum, d) => sum + meanBand(d, 0, 3), 0) / decks.length;
    const middle = decks.reduce((sum, d) => sum + meanBand(d, 5, 9), 0) / decks.length;
    const late = decks.reduce((sum, d) => sum + meanBand(d, 14, RAMP_WINDOW), 0) / decks.length;

    expect(early).toBeLessThan(middle);
    expect(middle).toBeLessThan(late);
  });

  it('ramps the gap the player actually has to place into', () => {
    const decks = seeds.map((s) => buildRampedDeck(catalogue, s, { allEvents: catalogue }));
    const openingGaps: number[] = [];
    const closingGaps: number[] = [];
    for (const deck of decks) {
      const gaps = gapWidths(deck.slice(0, RAMP_WINDOW));
      openingGaps.push(...gaps.slice(0, 4));
      closingGaps.push(...gaps.slice(18));
    }
    // Opening placements land in far wider gaps than closing ones.
    expect(median(openingGaps)).toBeGreaterThan(median(closingGaps) * 5);
  });

  it('gives the player a foothold on the opening card', () => {
    const decks = seeds.map((s) => buildRampedDeck(catalogue, s, { allEvents: catalogue }));
    const gentle = decks.filter((d) => index.bandOf(d[0]) <= 1).length;
    expect(gentle / decks.length).toBeGreaterThan(0.9);
  });

  it('spreads the opening cards across eras rather than clustering them', () => {
    const eraOf = (year: number): number => {
      if (year < -10000) return 0;
      if (year < 0) return 1;
      if (year < 1000) return 2;
      if (year < 1500) return 3;
      if (year < 1800) return 4;
      if (year < 1900) return 5;
      if (year < 1950) return 6;
      if (year < 2000) return 7;
      return 8;
    };
    const coverage = (deck: HistoricalEvent[]) =>
      new Set(deck.slice(0, RAMP_WINDOW).map((e) => eraOf(e.year))).size;

    const ramped =
      seeds.reduce(
        (sum, s) => sum + coverage(buildRampedDeck(catalogue, s, { allEvents: catalogue })),
        0
      ) / seeds.length;
    const plain =
      seeds.reduce((sum, s) => sum + coverage(shuffleArraySeeded(catalogue, s)), 0) / seeds.length;

    expect(ramped).toBeGreaterThan(plain);
  });

  describe('spacing kernel saturation', () => {
    /**
     * Regression guard for a failure mode that is easy to reintroduce by
     * "simplifying" min(distance, TAU) to distance. Unsaturated, the kernel rewards
     * being maximally extreme, so the same handful of temporal outliers win every
     * day and repeat rates nearly double. The symptom is measurable: the cards
     * chosen at the very start stop varying between seeds.
     */
    it('does not collapse onto the same outlier cards every seed', () => {
      const openers = new Set(
        seeds.map((s) => buildRampedDeck(catalogue, s, { allEvents: catalogue })[0].name)
      );
      expect(openers.size).toBeGreaterThan(seeds.length * 0.5);
    });
  });

  describe('thin pools', () => {
    const thinPool = (category: string) => catalogue.filter((e) => e.category === category);

    it('caps how much of a small band one deck may consume', () => {
      // `trade` is the tightest category in the catalogue.
      const pool = thinPool('trade');
      expect(pool.length).toBeGreaterThan(0);

      const deck = buildRampedDeck(pool, 'trade-day', { allEvents: catalogue });
      const bandCounts = new Map<number, number>();
      for (const card of deck.slice(0, RAMP_WINDOW)) {
        const band = index.bandOf(card);
        bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
      }
      for (const [band, used] of bandCounts) {
        const bandSize = pool.filter((e) => index.bandOf(e) === band).length;
        expect(used).toBeLessThanOrEqual(Math.max(1, Math.floor(bandSize / SPREAD)));
      }
    });

    it('never binds the cap on a full-catalogue pool', () => {
      // The budget is in the hundreds there, against a 24-card window.
      for (const band of [0, 1, 2, 3]) {
        const bandSize = catalogue.filter((e) => index.bandOf(e) === band).length;
        expect(Math.floor(bandSize / SPREAD)).toBeGreaterThan(RAMP_WINDOW);
      }
    });
  });

  describe('degenerate inputs', () => {
    it('handles a single-difficulty pool', () => {
      const pool = catalogue.filter((e) => e.difficulty === ('hard' as Difficulty));
      const deck = buildRampedDeck(pool, 'hard-only', { allEvents: catalogue });
      expect(deck).toHaveLength(pool.length);
    });

    it('handles a pool smaller than the ramp window', () => {
      const pool = catalogue.slice(0, 5);
      const deck = buildRampedDeck(pool, 'tiny', { allEvents: catalogue });
      expect(deck).toHaveLength(5);
      expect(new Set(deck.map((e) => e.name)).size).toBe(5);
    });

    it('handles an empty pool', () => {
      expect(buildRampedDeck([], 'empty', { allEvents: catalogue })).toEqual([]);
    });

    it('handles a pool with nothing in the easiest band', () => {
      const pool = catalogue.filter((e) => index.bandOf(e) === 3);
      const deck = buildRampedDeck(pool, 'hardest-only', { allEvents: catalogue });
      expect(deck).toHaveLength(pool.length);
    });

    it('still deals without a seed', () => {
      const deck = buildRampedDeck(catalogue.slice(0, 100), undefined, { allEvents: catalogue });
      expect(deck).toHaveLength(100);
    });
  });
});

describe('the seven-day no-repeat guarantee', () => {
  beforeEach(() => clearRecencyCache());

  /**
   * Each day is computed from a cold cache, which is what a real player gets: they
   * only ever ask for today, on today.
   */
  function windowsFor(days: string[]): Map<string, string[]> {
    const byDay = new Map<string, string[]>();
    for (const day of days) {
      clearRecencyCache();
      byDay.set(
        day,
        buildDailyDeck(catalogue, day)
          .slice(0, RAMP_WINDOW)
          .map((e) => e.name)
      );
    }
    return byDay;
  }

  function countRepeats(days: string[], byDay: Map<string, string[]>): number {
    let repeats = 0;
    for (let i = RECENCY_DAYS; i < days.length; i++) {
      const today = new Set(byDay.get(days.at(i) as string) ?? []);
      for (let back = 1; back <= RECENCY_DAYS; back++) {
        const earlier = byDay.get(days.at(i - back) as string) ?? [];
        repeats += earlier.filter((name) => today.has(name)).length;
      }
    }
    return repeats;
  }

  /**
   * The headline assertion, exact within a chain block.
   *
   * Without exclusion, 53.8% of days repeat at least one card from the previous week.
   * Two cheaper approaches were measured and are not enough — downweighting recent
   * cards reaches only ~45%, and excluding decks built *without* exclusion reaches
   * only ~50%, because those are not the decks that were played. Only chaining
   * against the real decks gets to zero, so this fails loudly if the chain is ever
   * shortcut back to either.
   */
  it('never repeats a card from the previous seven dailies, within a chain block', () => {
    // Every day in a block shares one chain, so the guarantee is exact there. Start
    // far enough into the block that the seven days being checked are inside it too.
    const blockStart = addDays('2024-01-01', 30 * CHAIN_ANCHOR_DAYS);
    const days = consecutiveDays(
      CHAIN_ANCHOR_DAYS - RECENCY_DAYS,
      addDays(blockStart, RECENCY_DAYS)
    );

    expect(countRepeats(days, windowsFor(days))).toBe(0);
  });

  /**
   * Across a block boundary the guarantee softens, because the chain anchor moves and
   * the recomputed history stops matching what was actually played. Measured over 113
   * scored days that costs 6 repeated cards, against ~118 for a plain shuffle — a 95%
   * cut, at a bounded ~100ms per session rather than a chain that grows forever.
   *
   * This is the regression guard on that residual, not an endorsement of it.
   *
   * The bound is headroom over a measured number, not a quality cliff, so it moves when
   * the catalogue does. Adding the `sports` category took it from 7 to 9 over this
   * window: `getDailyTheme` picks the themed category as `random() * ALL_CATEGORIES.length`,
   * so a 21st category re-rolls which day is themed to what, and the decks land
   * differently. The exact guarantee above still holds at 0 — only the residual moved.
   */
  it('keeps cross-boundary repeats to a trickle', () => {
    const days = consecutiveDays(60, '2026-08-13');
    const repeats = countRepeats(days, windowsFor(days));

    expect(repeats).toBeLessThanOrEqual(10);
  });

  it('is a pure function of the date, cache warm or cold', () => {
    const day = '2026-09-01';

    clearRecencyCache();
    const cold = buildDailyDeck(catalogue, day).map((e) => e.name);
    const warm = buildDailyDeck(catalogue, day).map((e) => e.name);

    // A different date in between must not perturb the answer for `day`.
    clearRecencyCache();
    buildDailyDeck(catalogue, '2026-09-02');
    const afterOtherDay = buildDailyDeck(catalogue, day).map((e) => e.name);

    expect(warm).toEqual(cold);
    expect(afterOtherDay).toEqual(cold);
  });

  it('excludes roughly a week of cards', () => {
    const recent = getRecentDailyCardNames(catalogue, '2026-08-13');
    expect(recent.size).toBeGreaterThan(RAMP_WINDOW);
    expect(recent.size).toBeLessThanOrEqual(RAMP_WINDOW * RECENCY_DAYS);
  });

  it('backs the exclusion out rather than dealing a short deck', () => {
    // Force the pathological case: exclude nearly all of a thin themed pool.
    const pool = catalogue.filter((e) => e.category === 'nature');
    const exclude = new Set(pool.slice(0, pool.length - 5).map((e) => e.name));

    const deck = buildRampedDeck(pool, 'squeezed', { allEvents: catalogue, exclude });
    expect(deck).toHaveLength(pool.length);
  });

  it('leaves enough to deal from on the thinnest real theme', () => {
    const day = '2026-08-13';
    const recent = getRecentDailyCardNames(catalogue, day);
    for (const category of ['trade', 'art', 'medicine', 'nature']) {
      const pool = buildDailyPool(catalogue, day).filter((e) => e.category === category);
      if (pool.length === 0) continue;
      const survivors = pool.filter((e) => !recent.has(e.name)).length;
      // Either the exclusion leaves a workable pool, or the builder backs it out.
      expect(survivors >= MIN_POOL_AFTER_EXCLUSION || pool.length < MIN_POOL_AFTER_EXCLUSION).toBe(
        true
      );
    }
  });
});
