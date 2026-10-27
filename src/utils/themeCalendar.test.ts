import {
  MAX_THEME_BLURB_LENGTH,
  MAX_THEME_FACT_LENGTH,
  MAX_THEME_NAME_LENGTH,
  MIN_THEME_EVENTS,
  hasDateOpened,
  opensAtMs,
  scheduledDates,
  validateCalendar,
} from '../../lib/themes/schema';
import type { CuratedTheme, ThemeCalendar } from '../../lib/themes/schema';

/**
 * Lives in src/ because CRA's Jest only roots there — same arrangement as
 * src/utils/dateWindow.test.ts and src/utils/adminAuth.test.ts, which also cover api/ code.
 */

const slugs = (n: number) => Array.from({ length: n }, (_, i) => `event-${i}`);

function theme(overrides: Partial<CuratedTheme> = {}): CuratedTheme {
  return {
    id: 'crowns',
    name: 'Crowns',
    eventNames: slugs(MIN_THEME_EVENTS),
    dates: ['2030-01-01'],
    ...overrides,
  };
}

function calendar(themes: CuratedTheme[]): ThemeCalendar {
  return { version: 1, themes };
}

/** Well before any date used below opens. */
const NOW = Date.parse('2029-01-01T00:00:00Z');

function errorsFor(themes: CuratedTheme[], options = {}): string[] {
  return validateCalendar(calendar(themes), { now: NOW, ...options }).errors;
}

describe('validateCalendar', () => {
  it('accepts a well-formed theme', () => {
    expect(validateCalendar(calendar([theme()]), { now: NOW })).toEqual({ ok: true, errors: [] });
  });

  it('rejects a theme below the minimum size', () => {
    const errors = errorsFor([theme({ eventNames: slugs(MIN_THEME_EVENTS - 1) })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`minimum ${MIN_THEME_EVENTS}`);
  });

  it('rejects a name that would overflow the TopBar pill', () => {
    const errors = errorsFor([theme({ name: 'x'.repeat(MAX_THEME_NAME_LENGTH + 1) })]);
    expect(errors[0]).toContain(`max ${MAX_THEME_NAME_LENGTH}`);
  });

  it('rejects duplicate slugs within a theme', () => {
    const dupes = slugs(MIN_THEME_EVENTS);
    dupes[3] = dupes[0];
    expect(errorsFor([theme({ eventNames: dupes })])[0]).toContain('duplicate event');
  });

  it('rejects two themes claiming the same date', () => {
    const errors = errorsFor([
      theme({ id: 'one', dates: ['2030-05-05'] }),
      theme({ id: 'two', dates: ['2030-05-05'] }),
    ]);
    expect(errors[0]).toContain('already claimed');
  });

  it('rejects a duplicate theme id', () => {
    const errors = errorsFor([
      theme({ id: 'same', dates: ['2030-05-05'] }),
      theme({ id: 'same', dates: ['2030-05-06'] }),
    ]);
    expect(errors).toContain('themes[1] (same): duplicate theme id "same"');
  });

  /**
   * `all` is dailyPool's cache key for an "Everything" day and `:` would forge the
   * `category:x` form — either silently swaps one day's pool for another's.
   */
  it.each([['all'], ['has:colon'], ['HasUpper']])('rejects the reserved or unsafe id %s', (id) => {
    expect(errorsFor([theme({ id })]).length).toBeGreaterThan(0);
  });

  it('reports every problem at once rather than the first', () => {
    const errors = errorsFor([theme({ id: 'all', name: '', eventNames: [], dates: [] })]);
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe('the date-has-opened guard', () => {
  /**
   * A puzzle date opens at midnight in UTC+14, i.e. 10:00Z the day before — the same fact
   * lib/leaderboard/dateWindow.ts derives its ~50-hour submission window from.
   */
  it('opens a date at 10:00Z on the previous day', () => {
    expect(new Date(opensAtMs('2030-03-10')).toISOString()).toBe('2030-03-09T10:00:00.000Z');
  });

  it('is closed a minute before and open a minute after', () => {
    const opens = opensAtMs('2030-03-10');
    expect(hasDateOpened('2030-03-10', opens - 60_000)).toBe(false);
    expect(hasDateOpened('2030-03-10', opens + 60_000)).toBe(true);
  });

  it('rejects scheduling a date that has already opened', () => {
    const errors = errorsFor([theme({ dates: ['2030-03-10'] })], {
      now: opensAtMs('2030-03-10') + 60_000,
    });
    expect(errors[0]).toContain('has already opened');
  });

  it('still allows tomorrow, which is the point', () => {
    // 09:00Z on the 9th: the 10th has not opened in UTC+14 yet.
    const errors = errorsFor([theme({ dates: ['2030-03-10'] })], {
      now: Date.parse('2030-03-09T09:00:00Z'),
    });
    expect(errors).toEqual([]);
  });

  it('force overrides it', () => {
    const errors = errorsFor([theme({ dates: ['2030-03-10'] })], {
      now: opensAtMs('2030-03-10') + 60_000,
      force: true,
    });
    expect(errors).toEqual([]);
  });

  /**
   * Without this, the calendar could never be edited again: every stored date eventually
   * ages past its open time, and re-sending the document unchanged would fail validation.
   */
  it('leaves already-stored dates alone as they age', () => {
    const errors = errorsFor([theme({ dates: ['2030-03-10'] })], {
      now: opensAtMs('2030-03-10') + 60_000,
      previousDates: new Set(['2030-03-10']),
    });
    expect(errors).toEqual([]);
  });
});

describe('the intro', () => {
  const intro = { blurb: 'Maps that changed the world.', fact: 'One copy survives.' };

  it('is optional', () => {
    expect(errorsFor([theme()])).toEqual([]);
  });

  it('accepts a well-formed intro', () => {
    expect(errorsFor([theme({ intro })])).toEqual([]);
  });

  it.each([
    [{ ...intro, blurb: '' }, 'intro.blurb must be a non-empty string'],
    [{ ...intro, fact: '   ' }, 'intro.fact must be a non-empty string'],
    [{ ...intro, fact: ' One copy survives.' }, 'leading or trailing whitespace'],
    [{ ...intro, blurb: 'x'.repeat(MAX_THEME_BLURB_LENGTH + 1) }, `max ${MAX_THEME_BLURB_LENGTH}`],
    [{ ...intro, fact: 'x'.repeat(MAX_THEME_FACT_LENGTH + 1) }, `max ${MAX_THEME_FACT_LENGTH}`],
  ])('rejects %j', (bad, message) => {
    expect(errorsFor([theme({ intro: bad })])[0]).toContain(message);
  });

  it('rejects an intro that is not an object', () => {
    const bad = 'Maps' as unknown as CuratedTheme['intro'];
    expect(errorsFor([theme({ intro: bad })])[0]).toContain('intro must be');
  });
});

describe('the opened-theme lock', () => {
  const opened = '2030-03-10';
  const after = opensAtMs(opened) + 60_000;
  const stored = theme({ dates: [opened, '2030-06-01'] });
  const lockOptions = {
    now: after,
    previousDates: new Set(stored.dates),
    previousThemes: [stored],
  };

  it('lets an opened theme gain an intro', () => {
    const edited = { ...stored, intro: { blurb: 'Crowns.', fact: 'Heavy.' } };
    expect(errorsFor([edited], lockOptions)).toEqual([]);
  });

  it('lets an opened theme drop a date that has not opened', () => {
    expect(errorsFor([{ ...stored, dates: [opened] }], lockOptions)).toEqual([]);
  });

  it('rejects changing the events of an opened theme', () => {
    const swapped = [...stored.eventNames];
    swapped[0] = 'event-new';
    const errors = errorsFor([{ ...stored, eventNames: swapped }], lockOptions);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('eventNames changed');
  });

  it('rejects renaming an opened theme', () => {
    expect(errorsFor([{ ...stored, name: 'Thrones' }], lockOptions)[0]).toContain('name changed');
  });

  it('rejects dropping an opened date', () => {
    const errors = errorsFor([{ ...stored, dates: ['2030-06-01'] }], lockOptions);
    expect(errors[0]).toContain(`${opened} dropped`);
  });

  it('leaves a theme that has not opened free to change', () => {
    const errors = errorsFor([{ ...stored, eventNames: slugs(MIN_THEME_EVENTS + 2) }], {
      ...lockOptions,
      now: NOW,
    });
    expect(errors).toEqual([]);
  });

  it('force overrides it', () => {
    const errors = errorsFor([{ ...stored, name: 'Thrones' }], { ...lockOptions, force: true });
    expect(errors).toEqual([]);
  });
});

describe('scheduledDates', () => {
  it('collects every date across themes', () => {
    const dates = scheduledDates(
      calendar([
        theme({ id: 'a', dates: ['2030-01-01', '2030-02-02'] }),
        theme({ id: 'b', dates: ['2030-03-03'] }),
      ])
    );
    expect([...dates].sort()).toEqual(['2030-01-01', '2030-02-02', '2030-03-03']);
  });
});
