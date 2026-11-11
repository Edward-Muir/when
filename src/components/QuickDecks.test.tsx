import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickDecks from './QuickDecks';
import { HistoricalEvent } from '../types';
import { CUSTOM_PRESETS } from '../data/customPresets';
import { DEFAULT_DECK_SETTINGS } from '../utils/customDeck';
import { saveLastCustomDeck } from '../utils/playerStorage';

const art = (name: string) =>
  `https://res.cloudinary.com/demo/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/${name}`;

// 30 ancient science cards, 20 World War art cards, and each preset's painting.
const events: HistoricalEvent[] = [
  ...Array.from({ length: 30 }, (_, i) => ({ year: -1000 + i, category: 'science' as const })),
  ...Array.from({ length: 20 }, (_, i) => ({ year: 1915 + i, category: 'art' as const })),
].map((e, i) => ({
  ...e,
  name: CUSTOM_PRESETS.at(i)?.eventName ?? `e${i}`,
  friendly_name: `Event ${i}`,
  description: 'Test event',
  difficulty: 'easy' as const,
  regions: ['France'],
  image_url: art(`img${i}`),
}));

beforeEach(() => localStorage.clear());

// The paintings are decorative (alt=""), so their role is presentation.
const paintings = (testId?: string) =>
  (testId ? within(screen.getByTestId(testId)) : screen).queryAllByRole('presentation');

const tiles = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? '');

describe('QuickDecks', () => {
  it('offers the presets with live counts, and no Last deck on a fresh install', () => {
    render(<QuickDecks allEvents={events} onStart={jest.fn()} showArt />);
    expect(tiles()).toEqual([
      'Play Everything, 50 events',
      'Play Ancient world, 30 events',
      'Play World Wars, 20 events',
    ]);
  });

  it('paints each tile with its fixed event at the thumbnail rung, lazily', () => {
    render(<QuickDecks allEvents={events} onStart={jest.fn()} showArt />);
    const imgs = paintings('quick-deck-everything');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,f_auto,g_auto,h_400,q_auto:good,w_400/img0'
    );
    expect(imgs[0]).toHaveAttribute('loading', 'lazy');
  });

  it('fetches no art until the tab has been shown', () => {
    render(<QuickDecks allEvents={events} onStart={jest.fn()} showArt={false} />);
    expect(paintings()).toHaveLength(0);
  });

  it('starts the tapped preset with its settings', async () => {
    const onStart = jest.fn();
    render(<QuickDecks allEvents={events} onStart={onStart} showArt />);
    await userEvent.click(screen.getByTestId('quick-deck-world-wars'));
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ selectedEras: ['worldWars'], playerCount: 1 })
    );
  });

  it('puts the last deck first, named by what differs, painted by its starting card', async () => {
    const science = { ...DEFAULT_DECK_SETTINGS, selectedCategories: ['science' as const] };
    saveLastCustomDeck({ settings: science, eventName: 'e40' });
    const onStart = jest.fn();
    render(<QuickDecks allEvents={events} onStart={onStart} showArt />);
    expect(tiles()[0]).toBe('Play Last deck, Science · 30');
    expect(paintings('quick-deck-last')[0].getAttribute('src')).toMatch(/\/img40$/);
    await userEvent.click(screen.getByTestId('quick-deck-last'));
    expect(onStart).toHaveBeenCalledWith(science);
  });

  it('disables a last deck the catalogue can no longer deal', () => {
    const tiny = { ...DEFAULT_DECK_SETTINGS, selectedEras: ['modern' as const] };
    saveLastCustomDeck({ settings: tiny, eventName: null });
    render(<QuickDecks allEvents={events} onStart={jest.fn()} showArt />);
    expect(screen.getByTestId('quick-deck-last')).toBeDisabled();
  });
});
