import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchivePanel from './ArchivePanel';
import { HistoricalEvent, ALL_CATEGORIES } from '../../types';
import { CuratedTheme, __setCuratedThemesForTest } from '../../utils/curatedThemes';
import { clearDailyPoolCache } from '../../utils/dailyPool';
import { recordThemeResult } from '../../utils/themeBests';
import { hasSeenHint, markHintSeen } from '../../utils/playerStorage';
import { TAB_HINT_TEXT } from '../../utils/hintCopy';
import { TAB_HINT_MOUNT_DELAY_MS } from '../../hooks/useTabHint';

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
  // jsdom has no matchMedia; the hint strip's useReducedMotion reads it.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
  __setCuratedThemesForTest([
    theme('later', 'Much Later', ['2030-06-01']),
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
  it('lists past decks oldest first, then today locked, then the next deck teased', () => {
    renderPanel();
    const cards = screen.getAllByRole('button');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Play Plague Years',
      'Play Kings of England',
      'Running Today: replay tomorrow',
      'Not Yet: coming May 1',
    ]);
    expect(screen.queryByText('Much Later')).toBeNull();
    expect(cards[2]).toBeDisabled();
    expect(within(cards[2]).getByText('Replay tomorrow')).toBeInTheDocument();
    // The teaser is locked with no record line: its future date says what it is.
    expect(cards[3]).toBeDisabled();
    expect(within(cards[3]).getByText('Not Yet')).toBeInTheDocument();
    expect(screen.getByText('May 1')).toBeInTheDocument();
    expect(within(cards[3]).queryByText(/Replay tomorrow|Not played yet|High score/)).toBeNull();
  });

  it('reads like the Daily and Custom pages, with no deck count', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByText(/Replay past daily decks/)).toBeInTheDocument();
    expect(screen.queryByText(/\d+ decks?$/)).toBeNull();
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

  it('explains itself when nothing is scheduled at all', () => {
    __setCuratedThemesForTest([]);
    renderPanel();
    expect(screen.getByText('No past decks yet')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('holds the rows back until the tab has been shown', () => {
    renderPanel({ active: false });
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ArchivePanel first-visit hint', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const settle = () => act(() => jest.advanceTimersByTime(TAB_HINT_MOUNT_DELAY_MS));

  it('shows once the tab is on screen, and not before', () => {
    renderPanel();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    settle();
    expect(screen.getByRole('status')).toHaveTextContent(TAB_HINT_TEXT.archiveTab);
    expect(hasSeenHint('archiveTab')).toBe(true);
  });

  it('stays quiet while pre-mounted off screen', () => {
    renderPanel({ active: false });
    settle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(hasSeenHint('archiveTab')).toBe(false);
  });

  it('does not return once seen', () => {
    markHintSeen('archiveTab');
    renderPanel();
    settle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('dismisses on tap', async () => {
    renderPanel();
    settle();
    await userEvent.click(screen.getByRole('button', { name: TAB_HINT_TEXT.archiveTab }));
    // The strip fades out; drive the exit animation to its end.
    act(() => jest.advanceTimersByTime(1000));
    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  });
});
