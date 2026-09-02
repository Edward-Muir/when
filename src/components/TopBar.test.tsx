import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TopBar, { navForPath, pathForNav } from './TopBar';

// jsdom has no matchMedia (useTheme, usePWAInstall) and no fetch (useVersionCheck).
// `beforeEach` because CRA's `resetMocks` strips implementations between tests.
beforeEach(() => {
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
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
});

const NAV_LABELS = ['Go home', 'Past decks', 'Custom game', 'View stats'];

const renderBar = (props: Partial<React.ComponentProps<typeof TopBar>> = {}) => {
  const onHomeClick = jest.fn();
  render(
    <MemoryRouter initialEntries={['/achievements']}>
      <Routes>
        <Route
          path="/achievements"
          element={
            <TopBar
              showHome
              showTitle={false}
              showStatsAchievements
              onHomeClick={onHomeClick}
              {...props}
            />
          }
        />
        <Route path="/archive" element={<h1>Archive tab</h1>} />
        <Route path="/custom" element={<h1>Custom tab</h1>} />
        <Route path="/stats" element={<h1>Stats tab</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return { onHomeClick };
};

describe('TopBar navigation', () => {
  it('shows the same four nav buttons on a route page as in the pager', () => {
    renderBar();
    NAV_LABELS.forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
  });

  it("navigates to a tab's path from a route page", async () => {
    renderBar();
    await userEvent.click(screen.getByLabelText('Past decks'));
    expect(screen.getByRole('heading', { name: 'Archive tab' })).toBeInTheDocument();
  });

  it('scrolls the pager instead of routing when it has an onNavClick', async () => {
    const onNavClick = jest.fn();
    renderBar({ onNavClick });
    await userEvent.click(screen.getByLabelText('Custom game'));
    expect(onNavClick).toHaveBeenCalledWith('custom');
    expect(screen.queryByRole('heading', { name: 'Custom tab' })).toBeNull();
  });

  it('hides the nav buttons without showStatsAchievements (the in-game bar)', () => {
    renderBar({ showStatsAchievements: false });
    expect(screen.getByLabelText('Go home')).toBeInTheDocument();
    expect(screen.queryByLabelText('Past decks')).toBeNull();
    expect(screen.queryByLabelText('View stats')).toBeNull();
  });
});

describe('tab paths', () => {
  it('round-trip every tab and reject anything else', () => {
    (['home', 'archive', 'custom', 'stats'] as const).forEach((key) => {
      expect(navForPath(pathForNav(key))).toBe(key);
    });
    expect(pathForNav('home')).toBe('/');
    expect(navForPath('/daily')).toBeNull();
    expect(navForPath('/nonsense')).toBeNull();
  });
});
