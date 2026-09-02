import React from 'react';
import { render, screen } from '@testing-library/react';
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
import { saveDailyResult, hasSeenNav, markNavUnseen } from '../../utils/playerStorage';
import { getLocalDateString } from '../../utils/puzzleDate';
import { addDays, formatWeekdayDate } from '../../utils/statsDerived';
import { ACHIEVEMENTS } from '../../data/achievements';
import { loadAllEvents } from '../../utils/eventLoader';

jest.mock('../../utils/eventLoader', () => ({ loadAllEvents: jest.fn() }));

// jsdom implements neither; `beforeEach` because CRA's `resetMocks` strips them between tests.
beforeEach(() => {
  localStorage.clear();
  (loadAllEvents as jest.Mock).mockResolvedValue(
    Array.from({ length: 40 }, (_, i) => ({ name: `e${i}` }))
  );
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

const renderPanel = () =>
  render(
    <MemoryRouter initialEntries={['/stats']}>
      <Routes>
        <Route path="/stats" element={<StatsPanel />} />
        <Route path="/achievements" element={<h1>Achievements page</h1>} />
      </Routes>
    </MemoryRouter>
  );

const today = getLocalDateString();

describe('StatsPanel', () => {
  it('renders the page header in the shared recipe and zeros for a fresh player', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument();
    expect(screen.getByText("How you've played, day by day")).toBeInTheDocument();
    expect(screen.getByText('Longest timeline')).toBeInTheDocument();
    expect(screen.getByText('Games played')).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Achievements, 0 of ${ACHIEVEMENTS.length} unlocked`)
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

  it('links the achievements tile to the route and clears its new dot', async () => {
    saveAchievements({ unlocked: { '01': today, '02': today } });
    markNavUnseen('achievements');
    renderPanel();

    const tile = screen.getByLabelText(`Achievements, 2 of ${ACHIEVEMENTS.length} unlocked`);
    expect(tile).toHaveAttribute('href', '/achievements');
    await userEvent.click(tile);
    expect(screen.getByRole('heading', { name: 'Achievements page' })).toBeInTheDocument();
    expect(hasSeenNav('achievements')).toBe(true);
  });
});
