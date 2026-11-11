import { HistoricalEvent } from '../types';
import { buildRampedDeck } from './deckBuilder';
import { filterPool } from './eventLoader';
import { DEFAULT_DECK_SETTINGS, buildCustomGameConfig, startingEventName } from './customDeck';

const events: HistoricalEvent[] = Array.from({ length: 60 }, (_, i) => ({
  name: `e${i}`,
  friendly_name: `Event ${i}`,
  year: 1000 + i * 15,
  category: i % 2 ? 'science' : 'art',
  description: 'Test event',
  difficulty: (['easy', 'medium', 'hard', 'very-hard'] as const)[i % 4],
  regions: ['France'],
}));

describe('buildCustomGameConfig', () => {
  it('starts a suddenDeath game with a fresh code each time, holding copies of the settings', () => {
    const a = buildCustomGameConfig(DEFAULT_DECK_SETTINGS);
    const b = buildCustomGameConfig(DEFAULT_DECK_SETTINGS);
    expect(a.mode).toBe('suddenDeath');
    expect(a.challengeSeed).toBe(a.challengeCode);
    expect(a.challengeCode).not.toBe(b.challengeCode);
    expect(a.selectedEras).toEqual(DEFAULT_DECK_SETTINGS.selectedEras);
    expect(a.selectedEras).not.toBe(DEFAULT_DECK_SETTINGS.selectedEras);
    expect(a.playerNames).toEqual(['Player 1']);
  });
});

describe('startingEventName', () => {
  it('is the first card of the deck the game deals from that config', () => {
    const settings = { ...DEFAULT_DECK_SETTINGS, selectedCategories: ['science' as const] };
    for (let i = 0; i < 5; i++) {
      const config = buildCustomGameConfig(settings);
      const pool = filterPool(events, {
        categories: ['science'],
        difficulties: settings.selectedDifficulties,
        eras: settings.selectedEras,
      });
      const dealt = buildRampedDeck(pool, config.challengeSeed, { allEvents: events });
      expect(startingEventName(config, events)).toBe(dealt[0].name);
    }
  });

  it('is null for an empty pool', () => {
    const config = buildCustomGameConfig({ ...DEFAULT_DECK_SETTINGS, selectedEras: ['ancient'] });
    expect(startingEventName(config, events)).toBeNull();
  });
});
