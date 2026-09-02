import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Menu from './Menu';

// jsdom has no matchMedia; `useTheme` and `usePWAInstall` both call it on mount. Stubbed per
// test because CRA's Jest config sets `resetMocks: true` (see Leaderboard.test.tsx).
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
});

const renderMenu = (props: Partial<React.ComponentProps<typeof Menu>> = {}) => {
  const onClose = jest.fn();
  const onNavItemClick = jest.fn();
  render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Menu
              isOpen
              onClose={onClose}
              onShowToast={jest.fn()}
              onNavItemClick={onNavItemClick}
              {...props}
            />
          }
        />
        <Route path="/achievements" element={<h1>Achievements page</h1>} />
        <Route path="/timeline" element={<h1>My Timeline page</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return { onClose, onNavItemClick };
};

describe('Menu', () => {
  it('navigates to /achievements, closes, and clears the achievements dot', async () => {
    const { onClose, onNavItemClick } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /achievements/i }));

    expect(screen.getByText('Achievements page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
    expect(onNavItemClick).toHaveBeenCalledWith('achievements');
  });

  it('navigates to /timeline, closes, and clears the timeline dot', async () => {
    const { onClose, onNavItemClick } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /my timeline/i }));

    expect(screen.getByText('My Timeline page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
    expect(onNavItemClick).toHaveBeenCalledWith('timeline');
  });

  it('shows a "new" dot only on the items TopBar says are unseen', () => {
    renderMenu({ navDots: { achievements: true, timeline: false } });

    const dots = screen.getAllByRole('img', { name: 'New' });
    expect(dots).toHaveLength(1);
    expect(screen.getByRole('link', { name: /achievements/i })).toContainElement(dots[0]);
  });

  it('shows no dots when none are passed', () => {
    renderMenu();
    expect(screen.queryByRole('img', { name: 'New' })).not.toBeInTheDocument();
  });
});
