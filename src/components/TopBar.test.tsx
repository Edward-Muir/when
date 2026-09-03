import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TopBar, { navForPath, pathForNav } from './TopBar';
import { hasSeenNav, markNavSeen, markNavUnseen } from '../utils/playerStorage';

// jsdom has no matchMedia (useTheme, usePWAInstall) and no fetch (useVersionCheck).
// `beforeEach` because CRA's `resetMocks` strips implementations between tests.
beforeEach(() => {
  localStorage.clear();
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

const NAV_LABELS = ['Go home', 'Past decks', 'Custom game', 'View stats', 'View my timeline'];

const renderBar = (props: Partial<React.ComponentProps<typeof TopBar>> = {}) => {
  const onHomeClick = jest.fn();
  render(
    <MemoryRouter initialEntries={['/privacy']}>
      <Routes>
        <Route
          path="/privacy"
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
        <Route path="/timeline" element={<h1>Timeline tab</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return { onHomeClick };
};

describe('TopBar navigation', () => {
  it('shows the same five nav buttons on a route page as in the pager', () => {
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

  it('draws Custom as sliders, not a settings cog', () => {
    renderBar();
    // Lucide stamps the icon's name on the svg; there is no accessible query for a glyph.
    // eslint-disable-next-line testing-library/no-node-access
    const icon = screen.getByLabelText('Custom game').querySelector('svg');
    expect(icon).toHaveClass('lucide-sliders-horizontal');
  });

  it('hides the nav buttons without showStatsAchievements (the in-game bar)', () => {
    renderBar({ showStatsAchievements: false });
    expect(screen.getByLabelText('Go home')).toBeInTheDocument();
    expect(screen.queryByLabelText('Past decks')).toBeNull();
    expect(screen.queryByLabelText('View stats')).toBeNull();
  });
});

describe('TopBar "new" dots', () => {
  const dotIn = (label: string) =>
    screen.queryByRole('img', { name: 'New' }) &&
    screen.getByLabelText(label).contains(screen.getByRole('img', { name: 'New' }));

  it('dots the Stats and Timeline buttons until first visited, never the menu button', () => {
    markNavSeen('archive');
    renderBar();
    const dots = screen.getAllByRole('img', { name: 'New' });
    expect(dots).toHaveLength(2);
    expect(screen.getByLabelText('View stats')).toContainElement(dots[0]);
    expect(screen.getByLabelText('View my timeline')).toContainElement(dots[1]);
    expect(screen.getByLabelText('Open menu')).not.toContainElement(dots[0]);
    expect(screen.getByLabelText('Open menu')).not.toContainElement(dots[1]);
  });

  it('clears a dot on tap and remembers it', async () => {
    markNavSeen('archive');
    markNavSeen('timeline');
    renderBar();
    expect(dotIn('View stats')).toBe(true);
    await userEvent.click(screen.getByLabelText('View stats'));
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull();
    expect(hasSeenNav('stats')).toBe(true);
  });

  it('re-arms the Stats dot after a badge unlock and clears it on the tab', () => {
    (['archive', 'stats', 'timeline'] as const).forEach(markNavSeen);
    markNavUnseen('stats'); // what useGameStatsRecorder does when a badge unlocks
    renderBar({ activeNav: 'stats', onNavClick: jest.fn() });
    // Being on the tab counts as seeing it: the effect clears the dot on mount.
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull();
    expect(hasSeenNav('stats')).toBe(true);
  });

  it('shows the re-armed Stats dot from another page', () => {
    (['archive', 'stats', 'timeline'] as const).forEach(markNavSeen);
    markNavUnseen('stats');
    renderBar();
    expect(dotIn('View stats')).toBe(true);
  });
});

describe('tab paths', () => {
  it('round-trip every tab and reject anything else', () => {
    (['home', 'archive', 'custom', 'stats', 'timeline'] as const).forEach((key) => {
      expect(navForPath(pathForNav(key))).toBe(key);
    });
    expect(pathForNav('home')).toBe('/');
    expect(navForPath('/daily')).toBeNull();
    expect(navForPath('/nonsense')).toBeNull();
  });
});
