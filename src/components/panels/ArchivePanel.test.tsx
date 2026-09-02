import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchivePanel from './ArchivePanel';
import { HistoricalEvent, ALL_CATEGORIES } from '../../types';
import { CuratedTheme, __setCuratedThemesForTest } from '../../utils/curatedThemes';
import { clearDailyPoolCache } from '../../utils/dailyPool';
import { recordThemeResult } from '../../utils/themeBests';

const catalogue: HistoricalEvent[] = Array.from({ length: 80 }, (_, i) => ({
  name: `event-${i}`,
  friendly_name: `Event ${i}`,
  year: 1000 + i * 10,
  category: ALL_CATEGORIES.at(i % ALL_CATEGORIES.length) ?? 'empires',
  description: 'A thing happened',
  difficulty: (['easy', 'medium', 'hard', 'very-hard'] as const).at(i % 4) ?? 'medium',
  image_url: `https://res.cloudinary.com/demo/image/upload/v1/events/event-${i}.jpg`,
}));

const theme = (id: string, name: string, dates: string[], offset = 0): CuratedTheme => ({
  id,
  name,
  eventNames: catalogue.slice(offset, offset + 20).map((e) => e.name),
  dates,
});

const TODAY = '2030-04-10';

beforeEach(() => {
  localStorage.clear();
  clearDailyPoolCache();
  __setCuratedThemesForTest([
    theme('future', 'Not Yet', ['2030-05-01']),
    theme('today', 'Running Today', [TODAY], 20),
    theme('kings', 'Kings of England', ['2030-03-01'], 40),
    theme('plagues', 'Plague Years', ['2030-01-15'], 60),
  ]);
});

afterEach(() => {
  __setCuratedThemesForTest(null);
});

const renderPanel = (props: Partial<React.ComponentProps<typeof ArchivePanel>> = {}) => {
  const onPlay = jest.fn();
  render(
    <ArchivePanel
      allEvents={catalogue}
      today={TODAY}
      calendarVersion={0}
      onPlay={onPlay}
      active
      {...props}
    />
  );
  return { onPlay };
};

describe('ArchivePanel', () => {
  it('lists past decks oldest first, with today locked and the future absent', () => {
    renderPanel();
    const cards = screen.getAllByRole('button');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Play Plague Years',
      'Play Kings of England',
      'Running Today: replay tomorrow',
    ]);
    expect(screen.queryByText('Not Yet')).toBeNull();
    expect(cards[2]).toBeDisabled();
    expect(within(cards[2]).getByText('Replay tomorrow')).toBeInTheDocument();
    // Only replayable decks are counted in the header.
    expect(screen.getByText('2 decks')).toBeInTheDocument();
  });

  it('shows the date each deck ran', () => {
    renderPanel();
    expect(screen.getByText('Mar 1')).toBeInTheDocument();
    expect(screen.getByText('Jan 15')).toBeInTheDocument();
  });

  it('shows the stored best beside a deck, and nothing to beat otherwise', () => {
    recordThemeResult('kings', { correctCount: 12, cleared: true, perfect: false });
    renderPanel();
    const kings = screen.getByRole('button', { name: 'Play Kings of England' });
    // Over the 19 placeable cards: the 20-card pool minus the seed card.
    expect(within(kings).getByText('High score: 12/19')).toBeInTheDocument();
    expect(within(kings).getByLabelText('Cleared')).toBeInTheDocument();
    const plagues = screen.getByRole('button', { name: 'Play Plague Years' });
    expect(within(plagues).getByText('Not played yet')).toBeInTheDocument();
  });

  it('starts a replay of the tapped deck', async () => {
    const { onPlay } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Play Kings of England' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay.mock.calls[0][0].id).toBe('kings');
  });

  it('explains itself before any deck has run', () => {
    __setCuratedThemesForTest([theme('future', 'Not Yet', ['2030-05-01'])]);
    renderPanel();
    expect(screen.getByText('No past decks yet')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('holds the rows back until the tab has been shown', () => {
    renderPanel({ active: false });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
