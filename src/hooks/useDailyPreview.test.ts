import { renderHook } from '@testing-library/react';
import { useDailyPreview } from './useDailyPreview';
import { HistoricalEvent, ALL_CATEGORIES } from '../types';
import { CuratedTheme, __setCuratedThemesForTest } from '../utils/curatedThemes';
import { clearDailyPoolCache } from '../utils/dailyPool';

const catalogue: HistoricalEvent[] = Array.from({ length: 80 }, (_, i) => ({
  name: `event-${i}`,
  friendly_name: `Event ${i}`,
  year: 1000 + i * 10,
  category: ALL_CATEGORIES.at(i % ALL_CATEGORIES.length) ?? 'empires',
  description: 'A thing happened',
  difficulty: (['easy', 'medium', 'hard', 'very-hard'] as const).at(i % 4) ?? 'medium',
  image_url: `https://res.cloudinary.com/demo/image/upload/v1/events/event-${i}.jpg`,
}));

const TODAY = '2030-04-10';

const curated: CuratedTheme = {
  id: 'cosmic',
  name: 'Cosmic Ideas',
  eventNames: catalogue.slice(20, 50).map((e) => e.name),
  dates: [TODAY],
};

beforeEach(() => {
  clearDailyPoolCache();
  __setCuratedThemesForTest(null);
});

afterEach(() => {
  __setCuratedThemesForTest(null);
});

describe('useDailyPreview', () => {
  it('names the curated theme once the boot load lands, though it mounted before it', () => {
    // The home screen mounts during `loading`, before the calendar and events arrive.
    const { result, rerender } = renderHook(
      ({ events, version }) => useDailyPreview(TODAY, events, version),
      { initialProps: { events: [] as HistoricalEvent[], version: 0 } }
    );
    expect(result.current.themeName).not.toBe('Cosmic Ideas');

    // The boot load resolves the calendar and the events together.
    __setCuratedThemesForTest([curated]);
    rerender({ events: catalogue, version: 0 });

    expect(result.current.themeName).toBe('Cosmic Ideas');
    expect(curated.eventNames).toContain(result.current.deck[0]?.name);
  });

  it('picks up a theme a calendar refetch adds for today', () => {
    const { result, rerender } = renderHook(
      ({ version }) => useDailyPreview(TODAY, catalogue, version),
      { initialProps: { version: 0 } }
    );
    expect(result.current.themeName).not.toBe('Cosmic Ideas');

    __setCuratedThemesForTest([curated]);
    clearDailyPoolCache();
    rerender({ version: 1 });

    expect(result.current.themeName).toBe('Cosmic Ideas');
  });
});
