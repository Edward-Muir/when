import { ALL_CATEGORIES } from '../types';
import { ALL_REGIONS } from './regions';
import { DEFAULT_DECK_SETTINGS } from './customDeck';
import {
  categorySummary,
  deckLabel,
  difficultySummary,
  eraSummary,
  regionSummary,
} from './filterSummary';

describe('filter row summaries', () => {
  it('reads "All N" with every option on, unchanged from the default', () => {
    expect(difficultySummary(['easy', 'medium', 'hard', 'very-hard'])).toEqual({
      text: 'All 4',
      changed: false,
      onCount: 4,
    });
    expect(categorySummary(ALL_CATEGORIES).text).toBe(`All ${ALL_CATEGORIES.length}`);
    expect(eraSummary(DEFAULT_DECK_SETTINGS.selectedEras).text).toBe('All 8');
    expect(regionSummary(ALL_REGIONS).text).toBe(`All ${ALL_REGIONS.length}`);
  });

  it('names a lone option the way the chips do', () => {
    expect(categorySummary(['science'])).toEqual({ text: 'Science', changed: true, onCount: 1 });
    expect(difficultySummary(['very-hard']).text).toBe('Expert');
    expect(eraSummary(['earlyModern']).text).toBe('Renaissance');
    expect(regionSummary(['East Asia']).text).toBe('East Asia');
  });

  it('counts a partial pick, and says None for an empty group', () => {
    expect(categorySummary(['science', 'art', 'medicine']).text).toBe(
      `3 of ${ALL_CATEGORIES.length}`
    );
    expect(eraSummary([])).toEqual({ text: 'None', changed: true, onCount: 0 });
  });

  it('ignores values no longer offered', () => {
    expect(regionSummary([...ALL_REGIONS, 'Atlantis']).text).toBe(`All ${ALL_REGIONS.length}`);
  });
});

describe('deckLabel', () => {
  it('names what differs from the default, what then when then how hard then where', () => {
    expect(deckLabel({ ...DEFAULT_DECK_SETTINGS, selectedCategories: ['science'] })).toBe(
      'Science'
    );
    expect(
      deckLabel({
        ...DEFAULT_DECK_SETTINGS,
        selectedDifficulties: ['easy'],
        selectedEras: ['ancient'],
      })
    ).toBe('Ancient · Easy');
    expect(
      deckLabel({
        ...DEFAULT_DECK_SETTINGS,
        selectedCategories: ['science', 'art', 'medicine'],
        selectedRegions: ['Europe', 'East Asia'],
      })
    ).toBe('3 categories · 2 regions');
  });

  it('falls back to "Custom" when only the countries differ, or nothing does', () => {
    expect(deckLabel(DEFAULT_DECK_SETTINGS)).toBe('Custom');
    expect(deckLabel({ ...DEFAULT_DECK_SETTINGS, excludedCountries: ['Europe|Italy'] })).toBe(
      'Custom'
    );
  });
});
