import { buildDifficultyIndex } from './difficultyScore';
import { HistoricalEvent } from '../types';
import {
  MAX_THEME_NAME_LENGTH,
  MIN_THEME_EVENTS,
  ThemeCalendar,
  opensAtMs,
  validateCalendar,
} from '../../lib/themes/schema';

/* eslint-disable @typescript-eslint/no-var-requires */
const catalogueJs = require('../../scripts/themes/catalogue.js');
const bankJs = require('../../scripts/themes/bank.js');
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * themes/bank.json is the committed source for scheduled decks, and it is only as good as the
 * catalogue underneath it. A deck validated at publish time can go stale afterwards — a
 * deprecated event, a renamed slug, an image regression — and because the calendar lives in
 * Redis and the events live here, nothing else in the repo would notice. scripts/verify-themes
 * catches that for decks already scheduled; this catches it for decks about to be.
 */

interface BankTheme {
  id: string;
  name: string;
  eventNames: string[];
}

const bank = bankJs.loadBank() as BankTheme[];
const events = catalogueJs.loadEligibleEvents() as HistoricalEvent[];
const playable = new Set(events.map((e) => e.name));

describe('the theme bank', () => {
  it('holds at least one deck', () => {
    expect(bank.length).toBeGreaterThan(0);
  });

  it.each(bank.map((theme) => [theme.id, theme] as const))('%s deals entirely', (_id, theme) => {
    const missing = theme.eventNames.filter((slug) => !playable.has(slug));
    expect(missing).toEqual([]);
    expect(theme.eventNames.length).toBeGreaterThanOrEqual(MIN_THEME_EVENTS);
    expect(theme.name.length).toBeLessThanOrEqual(MAX_THEME_NAME_LENGTH);
  });

  it.each(bank.map((theme) => [theme.id, theme] as const))(
    '%s opens on something gentle',
    (_id, theme) => {
      // MIN_BAND_ZERO in scripts/publish-theme.js: below this the ramp has no easy card to
      // hand the player, and the publish Action would reject the deck at dispatch time.
      const index = buildDifficultyIndex(events);
      const inTheme = events.filter((e) => theme.eventNames.includes(e.name));
      expect(inTheme.filter((e) => index.bandOf(e) === 0).length).toBeGreaterThanOrEqual(5);
    }
  );

  it('has no id or slug used twice', () => {
    expect(new Set(bank.map((t) => t.id)).size).toBe(bank.length);
    for (const theme of bank) {
      expect(new Set(theme.eventNames).size).toBe(theme.eventNames.length);
    }
  });

  /**
   * Bank order is the scheduling order, and RECENCY_DAYS is 7 — so on a weekly cadence each
   * deck is filtered against the one before it, exactly 7 days back and inside the window. A
   * shared card would be dropped from the second deck without anyone being told. Non-adjacent
   * decks may overlap freely; two weeks back is outside the window.
   */
  it('never puts two decks that share a card next to each other', () => {
    const clashes: string[] = [];
    let previous: BankTheme | undefined;
    for (const theme of bank) {
      if (previous) {
        const before = new Set(previous.eventNames);
        const shared = theme.eventNames.filter((slug) => before.has(slug));
        if (shared.length) clashes.push(`${previous.id} → ${theme.id}: ${shared.join(', ')}`);
      }
      previous = theme;
    }
    expect(clashes).toEqual([]);
  });

  it('passes the API’s own validation once scheduled', () => {
    const scheduled = bankJs.assignDates(bank, '2099-01-04', 7);
    const calendar: ThemeCalendar = { version: 0, themes: scheduled };
    expect(validateCalendar(calendar, { now: Date.parse('2098-01-01') })).toEqual({
      ok: true,
      errors: [],
    });
  });
});

describe('the bank script’s date arithmetic', () => {
  it('agrees with the schema on when a puzzle date opens', () => {
    for (const date of ['2026-08-30', '2027-01-03', '2026-03-08', '2026-11-01']) {
      expect(bankJs.opensAtMs(date)).toBe(opensAtMs(date));
    }
  });

  it('steps whole days across a DST boundary', () => {
    // US DST ends 2026-11-01. The script parses as UTC precisely so a schedule cannot slip an
    // hour and land on the wrong calendar day.
    expect(bankJs.addDays('2026-10-25', 7)).toBe('2026-11-01');
    const stepped = bankJs.assignDates([{ id: 'a' }, { id: 'b' }], '2026-10-25', 7);
    expect(stepped.map((t: { dates: string[] }) => t.dates)).toEqual([
      ['2026-10-25'],
      ['2026-11-01'],
    ]);
  });

  it('rejects a start date it cannot parse', () => {
    expect(() => bankJs.assignDates(bank, '30-08-2026', 7)).toThrow(/YYYY-MM-DD/);
    expect(() => bankJs.assignDates(bank, '2026-08-30', 0)).toThrow(/positive whole number/);
  });

  it('names an id that is not in the bank rather than silently skipping it', () => {
    expect(() => bankJs.selectThemes(bank, 'plagues,nope')).toThrow(/nope/);
    expect(bankJs.selectThemes(bank, 'all')).toHaveLength(bank.length);
    expect(bankJs.selectThemes(bank, 'plagues, money').map((t: BankTheme) => t.id)).toEqual([
      'plagues',
      'money',
    ]);
  });
});

describe('merging a run into the stored calendar', () => {
  const now = Date.parse('2026-08-28T09:00:00Z');
  const stored: ThemeCalendar = {
    version: 3,
    themes: [
      { id: 'indonesia', name: 'Indonesia', eventNames: ['a'], dates: ['2026-08-25'] },
      { id: 'keep-me', name: 'Untouched', eventNames: ['b'], dates: ['2026-12-25'] },
    ],
  };

  it('adds new decks and leaves the rest alone', () => {
    const merged = bankJs.mergeThemes(
      stored,
      [{ id: 'plagues', name: 'Plague Years', eventNames: ['c'], dates: ['2026-09-06'] }],
      now
    );
    expect(merged.themes.map((t: { id: string }) => t.id)).toEqual([
      'indonesia',
      'keep-me',
      'plagues',
    ]);
    expect(merged.version).toBe(3);
  });

  /**
   * The one thing the calendar must never do. dailyRecency replays the last 28 days to build
   * its exclusion chain, so dropping a date a deck really ran on makes the following week
   * exclude cards nobody saw — measurably worse than having no recency at all.
   */
  it('keeps a date that has already opened when the deck is rescheduled', () => {
    const merged = bankJs.mergeThemes(
      stored,
      [{ id: 'indonesia', name: 'Indonesia', eventNames: ['a'], dates: ['2026-10-04'] }],
      now
    );
    expect(merged.themes[0].dates).toEqual(['2026-08-25', '2026-10-04']);
  });

  it('replaces a future date rather than accumulating it', () => {
    const merged = bankJs.mergeThemes(
      stored,
      [{ id: 'keep-me', name: 'Untouched', eventNames: ['b'], dates: ['2026-11-15'] }],
      now
    );
    expect(merged.themes[1].dates).toEqual(['2026-11-15']);
  });

  it('drops a deck by id on removal', () => {
    expect(bankJs.removeTheme(stored, 'indonesia').themes.map((t: { id: string }) => t.id)).toEqual(
      ['keep-me']
    );
  });
});
