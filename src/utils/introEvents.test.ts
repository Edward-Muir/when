import { INTRO_EVENT_COUNT, INTRO_POOL_SIZE, pickIntroEvents, pickIntroPool } from './introEvents';
import { HistoricalEvent } from '../types';

function createTestEvent(name: string, year: number, imageUrl?: string): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    category: 'empires',
    description: 'Test event',
    difficulty: 'medium',
    image_url: imageUrl,
  };
}

// 200 events with deliberate year ties, all Cloudinary-backed.
const CATALOGUE: HistoricalEvent[] = Array.from({ length: 200 }, (_, i) =>
  createTestEvent(
    `event-${i}`,
    1000 + Math.floor(i / 2) * 5,
    `https://res.cloudinary.com/test/image/upload/event-${i}`
  )
);

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);
const nameSet = (events: HistoricalEvent[]) => new Set(names(events));

// Two dates inside one week (Mon 2026-08-10 .. Sun 2026-08-16), and one in the next.
const DAY_A = '2026-08-10';
const DAY_B = '2026-08-12';
const NEXT_WEEK = '2026-08-17';
const WEEK_KEY = '2954';

describe('pickIntroEvents', () => {
  it('never touches more than INTRO_POOL_SIZE images in a week', () => {
    // The cost invariant this whole module exists for: transformations billed by the intro
    // are `pool size x rungs x formats` per week, independent of how much the game is played.
    const touched = new Set<string>();
    for (let day = 10; day <= 16; day++) {
      // Mon 2026-08-10 .. Sun 2026-08-16 — one week, every rotation of every day.
      const dateString = `2026-08-${String(day).padStart(2, '0')}`;
      for (let rotation = 0; rotation < 20; rotation++) {
        pickIntroEvents(CATALOGUE, { dateString, rotation }).forEach((e) => touched.add(e.name));
      }
    }
    expect(touched.size).toBeLessThanOrEqual(INTRO_POOL_SIZE);
  });

  it('is deterministic for the same date and rotation', () => {
    const first = pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 1 });
    const second = pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 1 });
    expect(names(second)).toEqual(names(first));
  });

  it('produces a stable, checked-in selection', () => {
    // Pins the seeded-shuffle output. If shuffleArraySeeded or stringToSeed ever changes,
    // every player's pool shifts and the whole catalogue starts re-minting derived assets —
    // this test is what makes that show up as a failure instead of a Cloudinary bill.
    expect(names(pickIntroEvents(CATALOGUE, { dateString: DAY_A }))).toEqual([
      'event-1',
      'event-0',
      'event-7',
      'event-8',
      'event-21',
      'event-35',
      'event-48',
      'event-56',
      'event-68',
      'event-86',
      'event-92',
      'event-99',
      'event-108',
      'event-117',
      'event-122',
      'event-127',
      'event-141',
      'event-185',
      'event-196',
      'event-199',
    ]);
  });

  it('varies by day within a week, and re-pools across weeks', () => {
    const dayA = nameSet(pickIntroEvents(CATALOGUE, { dateString: DAY_A }));
    const dayB = nameSet(pickIntroEvents(CATALOGUE, { dateString: DAY_B }));
    expect(names(pickIntroEvents(CATALOGUE, { dateString: DAY_B }))).not.toEqual(
      names(pickIntroEvents(CATALOGUE, { dateString: DAY_A }))
    );

    // Same week: both days draw from the same pool.
    const weekPool = nameSet(pickIntroPool(CATALOGUE, WEEK_KEY));
    [dayA, dayB].forEach((set) => set.forEach((name) => expect(weekPool.has(name)).toBe(true)));

    // Next week: a different pool.
    const nextWeek = nameSet(pickIntroEvents(CATALOGUE, { dateString: NEXT_WEEK }));
    expect([...nextWeek].every((name) => weekPool.has(name))).toBe(false);
  });

  it('rotates through disjoint subsets of the same pool, then wraps', () => {
    const r0 = nameSet(pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 0 }));
    const r1 = nameSet(pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 1 }));
    const r2 = nameSet(pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 2 }));

    [r0, r1, r2].forEach((set) => expect(set.size).toBe(INTRO_EVENT_COUNT));
    expect([...r1].some((name) => r0.has(name))).toBe(false);
    expect([...r2].some((name) => r0.has(name) || r1.has(name))).toBe(false);
    expect(new Set([...r0, ...r1, ...r2]).size).toBe(INTRO_POOL_SIZE);

    // INTRO_POOL_SIZE is a multiple of INTRO_EVENT_COUNT, so rotation wraps cleanly.
    expect(names(pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 3 }))).toEqual(
      names(pickIntroEvents(CATALOGUE, { dateString: DAY_A, rotation: 0 }))
    );
  });

  it('returns events sorted by year, with no duplicates', () => {
    const picked = pickIntroEvents(CATALOGUE, { dateString: DAY_A });
    const years = picked.map((e) => e.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    // Duplicates would collide on GameStartTransition's key={event.name}.
    expect(nameSet(picked).size).toBe(picked.length);
  });

  it('excludes named events without shrinking the result or the pool', () => {
    const excluded = pickIntroEvents(CATALOGUE, { dateString: DAY_A });
    const exclude = new Set(names(excluded));
    const picked = pickIntroEvents(CATALOGUE, { dateString: DAY_A, exclude });

    expect(picked).toHaveLength(INTRO_EVENT_COUNT);
    expect(names(picked).some((name) => exclude.has(name))).toBe(false);
    // Replacements come from the same weekly pool, so the image budget is unchanged.
    const weekPool = nameSet(pickIntroPool(CATALOGUE, WEEK_KEY));
    names(picked).forEach((name) => expect(weekPool.has(name)).toBe(true));
  });

  it('ignores events without a Cloudinary image', () => {
    const mixed = [
      createTestEvent('no-image', 1900),
      createTestEvent('wikimedia', 1901, 'https://upload.wikimedia.org/thumb.jpg'),
      ...CATALOGUE.slice(0, 30),
    ];
    const picked = pickIntroEvents(mixed, { dateString: DAY_A });
    expect(names(picked)).not.toContain('no-image');
    expect(names(picked)).not.toContain('wikimedia');
    expect(pickIntroEvents([createTestEvent('no-image', 1900)], { dateString: DAY_A })).toEqual([]);
  });

  it('clamps to the events available', () => {
    const small = CATALOGUE.slice(0, 8);
    const picked = pickIntroEvents(small, { dateString: DAY_A });
    expect(picked).toHaveLength(8);
    expect(picked.map((e) => e.year)).toEqual([...picked.map((e) => e.year)].sort((a, b) => a - b));

    expect(pickIntroPool(small, WEEK_KEY)).toHaveLength(8);
    expect(pickIntroEvents(CATALOGUE, { dateString: DAY_A, count: 3 })).toHaveLength(3);
  });

  it('returns an empty list for an empty catalogue', () => {
    expect(pickIntroEvents([], { dateString: DAY_A })).toEqual([]);
    expect(pickIntroPool([], WEEK_KEY)).toEqual([]);
  });
});
