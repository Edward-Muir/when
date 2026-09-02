import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StatsPanel from './StatsPanel';
import {
  getDailyCadence,
  getLifetimeStats,
  saveAchievements,
  saveDailyCadence,
  saveLifetimeStats,
} from '../../utils/statsStorage';
import { saveDailyResult } from '../../utils/playerStorage';
import { getLocalDateString } from '../../utils/puzzleDate';
import { addDays, formatWeekdayDate } from '../../utils/statsDerived';
import { ACHIEVEMENTS } from '../../data/achievements';
import { loadAllEvents, getCachedEvents } from '../../utils/eventLoader';
import { preloadEventImages } from '../../utils/preloadImage';

jest.mock('../../utils/eventLoader', () => ({
  loadAllEvents: jest.fn(),
  getCachedEvents: jest.fn(),
}));
jest.mock('../../utils/preloadImage', () => ({ preloadEventImages: jest.fn() }));

// The badges' art resolves through the catalogue by event name, so the fake catalogue
// carries every badge's event with a distinct image_url the prefetch assertions can read.
const catalogue = [
  ...Array.from({ length: 40 }, (_, i) => ({ name: `e${i}` })),
  ...ACHIEVEMENTS.map((a) => ({ name: a.eventName, image_url: `img-${a.id}` })),
];

// jsdom implements neither; `beforeEach` because CRA's `resetMocks` strips them between tests.
beforeEach(() => {
  localStorage.clear();
  (loadAllEvents as jest.Mock).mockResolvedValue(catalogue);
  (getCachedEvents as jest.Mock).mockReturnValue(null);
  Element.prototype.scrollIntoView = jest.fn();
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
});

const renderPanel = (props: Partial<React.ComponentProps<typeof StatsPanel>> = {}) =>
  render(
    <MemoryRouter initialEntries={['/stats']}>
      <Routes>
        <Route path="/stats" element={<StatsPanel {...props} />} />
      </Routes>
    </MemoryRouter>
  );

const badgeButton = (id: string) => {
  const name = ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;
  return screen.queryByRole('button', { name: `View ${name} achievement` });
};

const today = getLocalDateString();

describe('StatsPanel', () => {
  it('renders the page header in the shared recipe and zeros for a fresh player', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument();
    expect(screen.getByText("How you've played, day by day")).toBeInTheDocument();
    expect(screen.getByText('Longest timeline')).toBeInTheDocument();
    expect(screen.getByText('Games played')).toBeInTheDocument();
    expect(screen.getByText(/of.*unlocked/)).toHaveTextContent(
      `0 of ${ACHIEVEMENTS.length} unlocked`
    );
    expect(screen.getByText('Finish a game to earn your first badge.')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /achievement$/ })).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: `Show all ${ACHIEVEMENTS.length}` })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Playing since/)).toBeNull();
    // No day is lit, and no cell is drawn for the future.
    expect(screen.queryAllByLabelText(/, played/)).toHaveLength(0);
    const tomorrow = formatWeekdayDate(addDays(today, 1));
    expect(screen.queryByLabelText((label) => label.startsWith(tomorrow))).toBeNull();
  });

  it('lights the played days, stars badge days and reads a tapped day out', async () => {
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);
    saveDailyCadence({
      ...getDailyCadence(),
      playedDates: [twoDaysAgo, today],
      maxDailyStreak: 3,
      bestDailyCorrect: 14,
    });
    saveAchievements({ unlocked: { '01': yesterday } });
    saveLifetimeStats({ ...getLifetimeStats(), firstPlayedDate: '2026-06-28' });
    renderPanel();

    expect(screen.getAllByLabelText(/, played$/)).toHaveLength(2);
    expect(
      screen.getByLabelText(`${formatWeekdayDate(yesterday)}, skipped, badge earned`)
    ).toBeInTheDocument();
    expect(screen.getByText('Playing since 28 Jun')).toBeInTheDocument();

    await userEvent.click(
      screen.getByLabelText(`${formatWeekdayDate(yesterday)}, skipped, badge earned`)
    );
    const readout = screen.getByRole('status');
    expect(readout).toHaveTextContent(`${formatWeekdayDate(yesterday)} · Skipped · ★ First Steps`);
  });

  it('buckets the daily scores and highlights today', () => {
    const histogram: number[] = [];
    histogram[2] = 1;
    histogram[6] = 4;
    histogram[9] = 2;
    saveDailyCadence({
      ...getDailyCadence(),
      playedDates: ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', today],
      dailyCorrectSum: 42,
      dailyCorrectHistogram: histogram,
    });
    saveDailyResult({
      date: today,
      theme: 'Kings',
      won: false,
      correctCount: 9,
      totalAttempts: 14,
      emojiGrid: '',
    });
    renderPanel();

    expect(screen.getByLabelText('5–7: 4')).toBeInTheDocument();
    expect(screen.getByLabelText('8–11: 2, today')).toBeInTheDocument();
    expect(screen.queryByLabelText('0–2: 1, today')).toBeNull();
    expect(screen.getByText(/average/)).toHaveTextContent('Today: 9 events · average 7.0');
  });

  it('shows the unlocked badges newest first and the locked ones only on demand', async () => {
    saveAchievements({ unlocked: { '01': '2026-08-01', '02': '2026-08-09' } });
    renderPanel();

    expect(screen.getByText(/of.*unlocked/)).toHaveTextContent(
      `2 of ${ACHIEVEMENTS.length} unlocked`
    );
    const shown = screen.getAllByRole('button', { name: /achievement$/ });
    expect(shown).toHaveLength(2);
    expect(shown[0]).toBe(badgeButton('02'));
    expect(shown[1]).toBe(badgeButton('01'));
    expect(screen.queryByRole('heading', { name: 'Locked' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: `Show all ${ACHIEVEMENTS.length}` }));
    expect(screen.getByRole('heading', { name: 'Locked' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /achievement$/ })).toHaveLength(
      ACHIEVEMENTS.length
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
    expect(screen.queryByRole('heading', { name: 'Locked' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /achievement$/ })).toHaveLength(2);
  });

  it('warms art for the unlocked badges only, and the rest once expanded', async () => {
    saveAchievements({ unlocked: { '01': today } });
    renderPanel();
    // The catalogue arrives asynchronously; the warm waits for it.
    await waitFor(() => expect(preloadEventImages).toHaveBeenCalled());
    const urls = (calls: unknown[][]) =>
      calls.flatMap((c) => (c[0] as { image_url?: string }[]).map((e) => e?.image_url));
    expect(urls((preloadEventImages as jest.Mock).mock.calls)).toEqual(['img-01']);

    await userEvent.click(screen.getByRole('button', { name: `Show all ${ACHIEVEMENTS.length}` }));
    await waitFor(() =>
      expect(urls((preloadEventImages as jest.Mock).mock.calls)).toHaveLength(
        1 + ACHIEVEMENTS.length
      )
    );
  });

  it('does not warm any badge art while the tab is off screen', async () => {
    saveAchievements({ unlocked: { '01': today } });
    renderPanel({ active: false });
    await waitFor(() => expect(loadAllEvents).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(preloadEventImages).not.toHaveBeenCalled();
  });

  it('opens the detail popup for a tapped badge', async () => {
    saveAchievements({ unlocked: { '01': today } });
    renderPanel();
    const name = ACHIEVEMENTS[0].name;
    expect(screen.getAllByText(name)).toHaveLength(1);
    await userEvent.click(badgeButton('01') as HTMLElement);
    // The large-format card in the popup repeats the badge name.
    expect(screen.getAllByText(name)).toHaveLength(2);
  });
});
