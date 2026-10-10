import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchivePanel, { LOCK_NOTE_MS } from './ArchivePanel';
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
    theme('future', 'Not Yet', ['2030-04-11']),
    theme('today', 'Running Today', [TODAY], 20),
    theme('kings', 'Kings of England', ['2030-03-20'], 40),
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

/** The row for a date. */
const row = (date: string) => within(screen.getByTestId(`archive-day-${date}`));

/** The panel's two live regions, in DOM order: the tab hint under the heading, then the
 * locked-row note floating over the timeline. */
const tabHint = () => screen.getAllByRole('status')[0];
const lockNote = () => screen.getAllByRole('status')[1];

const playedDaily = (date: string, correct: string[]) =>
  localStorage.setItem(
    'when-game-history',
    JSON.stringify([
      {
        date,
        mode: 'daily',
        placements: '1',
        correct,
        misses: [],
        bestStreak: 1,
        timelineLength: 2,
      },
    ])
  );

const played = (...dates: string[]) =>
  localStorage.setItem('when-daily-cadence', JSON.stringify({ playedDates: dates }));

describe('ArchivePanel', () => {
  it('reads like the Daily and Custom pages', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByText(/The last 30 days/)).toBeInTheDocument();
  });

  it("lists the last thirty days, oldest first, then tomorrow's daily teased", () => {
    renderPanel();
    const dates = screen
      .getAllByTestId(/^archive-day-/)
      .map((el) => el.getAttribute('data-testid')?.replace('archive-day-', ''));
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe('2030-03-12');
    expect(dates.at(-2)).toBe(TODAY);
    expect(dates.at(-1)).toBe('2030-04-11');
    // Strictly thirty days: an older curated deck is gone, and only tomorrow shows ahead.
    expect(screen.queryByText('Plague Years')).toBeNull();
    expect(screen.queryByText('Much Later')).toBeNull();
    expect(
      row('2030-04-11').getByRole('button', { name: 'Not Yet: coming tomorrow' })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(row('2030-04-11').getByRole('button')).toHaveClass('border-accent');
  });

  it('teases tomorrow even when no curated deck is scheduled for it', () => {
    __setCuratedThemesForTest([theme('later', 'Much Later', ['2030-06-01'])]);
    renderPanel();
    const rows = screen.getAllByTestId(/^archive-day-/);
    expect(rows.at(-1)).toHaveAttribute('data-testid', 'archive-day-2030-04-11');
    expect(row('2030-04-11').getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    expect(row('2030-04-11').getByRole('button')).not.toHaveClass('border-accent');
    expect(screen.queryByText('Much Later')).toBeNull();
  });

  it('borders a curated day in gold, and no other', () => {
    renderPanel();
    expect(row('2030-03-20').getByRole('button')).toHaveClass('border-accent');
    expect(row('2030-03-21').getByRole('button')).not.toHaveClass('border-accent');
  });

  it('plays a missed ordinary day as that date', async () => {
    const { onPlay } = renderPanel();
    expect(row('2030-03-21').getByText('Missed')).toBeInTheDocument();
    await userEvent.click(row('2030-03-21').getByRole('button'));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay.mock.calls[0][0]).toMatchObject({
      mode: 'suddenDeath',
      dailyReplayDate: '2030-03-21',
    });
    expect(onPlay.mock.calls[0][0].curatedThemeId).toBeUndefined();
  });

  it('plays a curated day as its reshuffled theme, keeping the date', async () => {
    const { onPlay } = renderPanel();
    await userEvent.click(
      row('2030-03-20').getByRole('button', { name: /^Play Kings of England/ })
    );
    expect(onPlay.mock.calls[0][0]).toMatchObject({
      mode: 'suddenDeath',
      curatedThemeId: 'kings',
      dailyReplayDate: '2030-03-20',
    });
  });

  it("shows a played ordinary day's best as a bare count", () => {
    played('2030-03-21');
    playedDaily('2030-03-21', ['a', 'b', 'c']);
    renderPanel();
    expect(row('2030-03-21').getByText('High score: 3')).toBeInTheDocument();
  });

  it("shows a played curated day's best over the cards it can place", () => {
    played('2030-03-20');
    recordThemeResult('kings', { correctCount: 12, cleared: true, perfect: false });
    renderPanel();
    // Over the 19 placeable cards: the 20-card pool minus the seed card.
    expect(row('2030-03-20').getByText('High score: 12/19')).toBeInTheDocument();
    expect(row('2030-03-20').getByLabelText('Cleared')).toBeInTheDocument();
  });

  it("plays today's ordinary daily while it is unplayed", async () => {
    const { onPlay } = renderPanel();
    expect(row(TODAY).getByText("Today's challenge")).toBeInTheDocument();
    await userEvent.click(row(TODAY).getByRole('button', { name: 'Play Running Today, today' }));
    expect(onPlay.mock.calls[0][0].mode).toBe('daily');
  });

  it('locks today once it is played, until tomorrow', () => {
    played(TODAY);
    renderPanel();
    expect(
      row(TODAY).getByRole('button', { name: 'Running Today: replay tomorrow' })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(row(TODAY).getByText('Replay tomorrow')).toBeInTheDocument();
  });

  it('says why today is locked when its row is tapped, and does not play it', async () => {
    played(TODAY);
    const { onPlay } = renderPanel();
    expect(lockNote()).toBeEmptyDOMElement();
    await userEvent.click(row(TODAY).getByRole('button'));
    expect(lockNote()).toHaveTextContent('Done for today. Replay it tomorrow.');
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('says when the teaser opens when its row is tapped, and does not play it', async () => {
    const { onPlay } = renderPanel();
    await userEvent.click(row('2030-04-11').getByRole('button'));
    expect(lockNote()).toHaveTextContent('Opens tomorrow as the Daily Challenge');
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('says nothing when a playable row is tapped', async () => {
    renderPanel();
    await userEvent.click(row('2030-03-21').getByRole('button'));
    expect(lockNote()).toBeEmptyDOMElement();
  });

  it('lets the locked-row note fade by itself', async () => {
    jest.useFakeTimers();
    try {
      renderPanel();
      await userEvent.click(row('2030-04-11').getByRole('button'));
      expect(lockNote()).not.toBeEmptyDOMElement();
      act(() => jest.advanceTimersByTime(LOCK_NOTE_MS + 1000));
      await waitFor(() => expect(lockNote()).toBeEmptyDOMElement());
    } finally {
      jest.useRealTimers();
    }
  });

  it('holds the rows back until the tab has been shown', () => {
    renderPanel({ active: false });
    expect(screen.queryAllByTestId(/^archive-day-/)).toHaveLength(0);
  });
});

describe('ArchivePanel first-visit hint', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const settle = () => act(() => jest.advanceTimersByTime(TAB_HINT_MOUNT_DELAY_MS));

  it('shows once the tab is on screen, and not before', () => {
    renderPanel();
    expect(tabHint()).toBeEmptyDOMElement();
    settle();
    expect(tabHint()).toHaveTextContent(TAB_HINT_TEXT.archiveTab);
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
    expect(tabHint()).toBeEmptyDOMElement();
  });

  it('dismisses on tap', async () => {
    renderPanel();
    settle();
    await userEvent.click(screen.getByRole('button', { name: TAB_HINT_TEXT.archiveTab }));
    // The strip fades out; drive the exit animation to its end.
    act(() => jest.advanceTimersByTime(1000));
    await waitFor(() => expect(tabHint()).toBeEmptyDOMElement());
  });
});
