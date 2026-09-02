import React from 'react';
import { render, screen } from '@testing-library/react';
import AchievementsPanel from './AchievementsPanel';
import { ACHIEVEMENTS } from '../../data/achievements';
import { saveAchievements } from '../../utils/statsStorage';
import { loadAllEvents, getCachedEvents } from '../../utils/eventLoader';

jest.mock('../../utils/eventLoader', () => ({
  loadAllEvents: jest.fn(),
  getCachedEvents: jest.fn(),
}));

// jsdom has no matchMedia; `beforeEach` because CRA's `resetMocks` strips mocks between tests.
beforeEach(() => {
  localStorage.clear();
  (loadAllEvents as jest.Mock).mockResolvedValue([]);
  (getCachedEvents as jest.Mock).mockReturnValue(null);
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

describe('AchievementsPanel header', () => {
  it('uses the shared page heading with the live count beneath it', () => {
    render(<AchievementsPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByText(/badges unlocked/)).toHaveTextContent(
      `0 of ${ACHIEVEMENTS.length} badges unlocked`
    );
  });

  it('counts unlocked badges', () => {
    saveAchievements({ unlocked: { '01': '2026-08-01', '02': '2026-08-02' } });
    render(<AchievementsPanel />);
    expect(screen.getByText(/badges unlocked/)).toHaveTextContent(
      `2 of ${ACHIEVEMENTS.length} badges unlocked`
    );
  });
});
