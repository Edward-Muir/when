import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Menu from './Menu';
import { hasSeenHint, markHintSeen } from '../utils/playerStorage';

// jsdom has no matchMedia; `useTheme` and `usePWAInstall` both call it on mount. Stubbed per
// test because CRA's Jest config sets `resetMocks: true` (see Leaderboard.test.tsx).
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
        <Route path="/changelog" element={<h1>Changelog page</h1>} />
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

  it('does not list Achievements or My Timeline — both are home tabs', () => {
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

  it('keeps the plain header and shows the player as the Your Avatar icon', () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    renderMenu();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-banner')).toBeNull();
    const item = screen.getByRole('button', { name: /your avatar/i });
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('platypus');
  });

  it('opens the avatar picker, and a pick updates the icon and is saved', async () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    renderMenu();
    const item = screen.getByRole('button', { name: /your avatar/i });
    await userEvent.click(item);

    await userEvent.click(screen.getByRole('radio', { name: 'Koala' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Viking' }));

    expect(localStorage.getItem('when-avatar')).toBe('koala.viking');
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('koala');

    await userEvent.click(screen.getByRole('button', { name: /match my name/i }));
    expect(localStorage.getItem('when-avatar')).toBeNull();
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('platypus');
  });

  it("links What's New to the changelog and closes", async () => {
    const { onClose } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /what's new/i }));

    expect(screen.getByText('Changelog page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('links Help & FAQ to the support page and closes', async () => {
    const { onClose } = renderMenu();
    await userEvent.click(screen.getByRole('link', { name: /help & faq/i }));
    expect(screen.getByText('Support page')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('resets the hints and closes, like every other action row', async () => {
    markHintSeen('swap');
    const { onClose } = renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /reset hints/i }));

    expect(hasSeenHint('swap')).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('carries no "new" dots', () => {
    renderMenu();
    expect(screen.queryByRole('img', { name: 'New' })).not.toBeInTheDocument();
  });
});
