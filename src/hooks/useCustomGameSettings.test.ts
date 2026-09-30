import { renderHook } from '@testing-library/react';
import { useCustomGameSettings } from './useCustomGameSettings';
import { legacyPicksToExclusions } from '../utils/countrySelection';
import { getCustomSettings } from '../utils/playerStorage';
import { ALL_ERAS } from '../utils/eras';
import { HistoricalEvent } from '../types';

const card = (name: string, regions: string[]): HistoricalEvent => ({
  name,
  friendly_name: name,
  year: 1900,
  category: 'empires',
  description: 'Test event',
  difficulty: 'medium',
  regions,
});

const events = [
  card('berlin', ['Germany']),
  card('paris', ['France']),
  card('alps', ['Europe']),
  card('tokyo', ['Japan']),
];

const saved = {
  selectedDifficulties: ['medium'],
  selectedCategories: ['empires'],
  selectedEras: [...ALL_ERAS],
  playerCount: 1,
  cardsPerHand: 7,
  suddenDeathHandSize: 5,
};

beforeEach(() => localStorage.clear());

describe('useCustomGameSettings', () => {
  /**
   * Settings saved before the select-all picker stored picks: "Germany" meant Europe narrowed to
   * Germany, East Asia whole. They restore as the exclusions that deal the same pool, and are
   * saved back in the new form.
   */
  it('restores old country picks as the exclusions that deal the same pool', () => {
    const regions = ['Europe', 'East Asia'];
    localStorage.setItem(
      'when-custom-settings',
      JSON.stringify({ ...saved, selectedRegions: regions, selectedCountries: ['Germany'] })
    );
    const { result } = renderHook(() => useCustomGameSettings(events));
    const { excludedCountries, deckCount } = result.current.panelProps;
    expect([...excludedCountries].sort()).toEqual(
      legacyPicksToExclusions(regions, ['Germany']).sort()
    );
    expect(deckCount).toBe(2); // berlin and tokyo
    expect(getCustomSettings()?.excludedCountries).toEqual(excludedCountries);
  });

  it('starts with every country on', () => {
    const { result } = renderHook(() => useCustomGameSettings(events));
    expect(result.current.panelProps.excludedCountries).toEqual([]);
    expect(result.current.panelProps.deckCount).toBe(events.length);
  });
});
