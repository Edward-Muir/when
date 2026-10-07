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
import { formatWeekdayDate } from '../../utils/statsDerived';
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

/** A day's square on the calendar, by the date its label starts with ("Fri 1 Mar, …"). */
const findSquare = (date: string) =>
  screen
    .queryAllByRole('button')
    .find((button) => button.getAttribute('aria-label')?.startsWith(`${formatWeekdayDate(date)},`));

const square = (date: string) => {
  const found = findSquare(date);
  if (!found) throw new Error(`no square for ${date}`);
  return found;
};

describe('ArchivePanel', () => {
  it('reads like the Daily and Custom pages', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByText(/Every past daily/)).toBeInTheDocument();
  });

  it('draws every past day, ringing the curated ones', () => {
    renderPanel();
    expect(square('2030-03-01')).toHaveAccessibleName(/missed, curated$/);
    expect(square('2030-03-02')).toHaveAccessibleName(/missed$/);
    expect(square(TODAY)).toHaveAccessibleName(/curated$/);
    // The future is drawn blank: only today's week is shown past today, and none of it taps.
    expect(findSquare('2030-04-11')).toBeUndefined();
  });

  it('fills the days the player played, from the daily cadence', () => {
    localStorage.setItem('when-daily-cadence', JSON.stringify({ playedDates: ['2030-04-08'] }));
    renderPanel();
    expect(square('2030-04-08')).toHaveAccessibleName(/played$/);
  });

  it('names the next curated deck, and only that one', () => {
    renderPanel();
    expect(screen.getByText('Not Yet')).toBeInTheDocument();
    expect(screen.getByText(/Next curated deck/)).toHaveTextContent(
      formatWeekdayDate('2030-05-01')
    );
    expect(screen.queryByText('Much Later')).toBeNull();
  });

  it('plays a missed ordinary day as that date', async () => {
    const { onPlay } = renderPanel();
    await userEvent.click(square('2030-03-02'));
    expect(within(await screen.findByRole('dialog')).getByText('Missed')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Play this day' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay.mock.calls[0][0]).toMatchObject({
      mode: 'suddenDeath',
      dailyReplayDate: '2030-03-02',
    });
    expect(onPlay.mock.calls[0][0].curatedThemeId).toBeUndefined();
  });

  it('plays a curated day as the reshuffled theme, with its best on the card', async () => {
    recordThemeResult('kings', { correctCount: 12, cleared: true, perfect: false });
    const { onPlay } = renderPanel();
    await userEvent.click(square('2030-03-01'));
    const card = within(await screen.findByRole('dialog'));
    expect(card.getByText('Kings of England')).toBeInTheDocument();
    expect(card.getByText('Curated')).toBeInTheDocument();
    // Over the 19 placeable cards: the 20-card pool minus the seed card.
    expect(screen.getByText('High score: 12/19')).toBeInTheDocument();
    expect(screen.getByLabelText('Cleared')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Play this day' }));
    expect(onPlay.mock.calls[0][0]).toMatchObject({
      mode: 'suddenDeath',
      curatedThemeId: 'kings',
      dailyReplayDate: '2030-03-01',
    });
  });

  it('offers a played day as a replay', async () => {
    localStorage.setItem('when-daily-cadence', JSON.stringify({ playedDates: ['2030-04-08'] }));
    renderPanel();
    await userEvent.click(square('2030-04-08'));
    expect(await screen.findByRole('button', { name: 'Replay' })).toBeInTheDocument();
  });

  it("offers today's ordinary daily while it is unplayed", async () => {
    const { onPlay } = renderPanel();
    await userEvent.click(square(TODAY));
    await userEvent.click(await screen.findByRole('button', { name: "Play today's challenge" }));
    expect(onPlay.mock.calls[0][0].mode).toBe('daily');
  });

  it('holds today back once played: replayable from tomorrow', async () => {
    localStorage.setItem('when-daily-cadence', JSON.stringify({ playedDates: [TODAY] }));
    renderPanel();
    await userEvent.click(square(TODAY));
    expect(await screen.findByText('Replay from tomorrow')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Play|Replay/ })).toBeNull();
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
