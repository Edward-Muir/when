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
  render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/"
          element={<Menu isOpen onClose={onClose} onShowToast={jest.fn()} {...props} />}
        />
        <Route path="/privacy" element={<h1>Privacy page</h1>} />
        <Route path="/support" element={<h1>Support page</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return { onClose };
};

describe('Menu', () => {
  it('navigates to a page link and closes', async () => {
    const { onClose } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /privacy policy/i }));

    expect(screen.getByText('Privacy page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('no longer lists Achievements or My Timeline — both are home tabs now', () => {
    renderMenu();
    expect(screen.queryByRole('link', { name: /achievements/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my timeline/i })).toBeNull();
  });

  it('offers How to Play everywhere, not only in a game, and opens the rules', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /how to play/i }));
    expect(screen.getByRole('heading', { name: 'How to Play' })).toBeInTheDocument();
    expect(screen.getByText('Build the longest timeline!')).toBeInTheDocument();
  });

  it('links Help & FAQ to the support page and closes', async () => {
    const { onClose } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /help & faq/i }));
    expect(screen.getByText('Support page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('carries no "new" dots', () => {
    renderMenu();
    expect(screen.queryByRole('img', { name: 'New' })).not.toBeInTheDocument();
  });
});
