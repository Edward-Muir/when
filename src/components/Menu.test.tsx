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

  it('keeps the plain header and shows the player as the Profile icon', () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    renderMenu();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-banner')).toBeNull();
    const item = screen.getByRole('button', { name: /profile/i });
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('platypus');
  });

  it('opens Profile, and a pick updates the icon and is saved', async () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    renderMenu();
    const item = screen.getByRole('button', { name: /profile/i });
    await userEvent.click(item);

    await userEvent.click(screen.getByRole('radio', { name: 'Koala' }));

    expect(localStorage.getItem('when-avatar')).toBe('koala');
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('koala');
  });

  it('wears an earned portrait once its badge is unlocked', async () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    localStorage.setItem('when-achievements', JSON.stringify({ unlocked: { '27': '2026-10-01' } }));
    renderMenu();
    const item = screen.getByRole('button', { name: /profile/i });
    await userEvent.click(item);

    await userEvent.click(screen.getByRole('radio', { name: 'Unicorn, new' }));

    expect(localStorage.getItem('when-avatar')).toBe('unicorn');
    expect(within(item).getByTestId('portrait').dataset.animal).toBe('unicorn');
  });

  it('dots Profile while an achievement portrait is unseen, until the picker is opened', async () => {
    localStorage.setItem('when-display-name', 'Linguistic Platypus');
    localStorage.setItem('when-achievements', JSON.stringify({ unlocked: { '27': '2026-10-01' } }));
    renderMenu();
    const item = screen.getByRole('button', { name: /profile/i });
    expect(within(item).getByRole('img', { name: 'New' })).toBeInTheDocument();

    await userEvent.click(item);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(within(item).queryByRole('img', { name: 'New' })).toBeNull();
  });

  it('shows no Profile dot when every owned portrait has been seen', () => {
    localStorage.setItem('when-achievements', JSON.stringify({ unlocked: { '27': '2026-10-01' } }));
    localStorage.setItem('when-portraits-seen', JSON.stringify(['unicorn']));
    renderMenu();
    const item = screen.getByRole('button', { name: /profile/i });
    expect(within(item).queryByRole('img', { name: 'New' })).toBeNull();
  });

  describe('renaming in Profile', () => {
    const openProfile = async () => {
      localStorage.setItem('when-display-name', 'Linguistic Platypus');
      renderMenu();
      const item = screen.getByRole('button', { name: /profile/i });
      await userEvent.click(item);
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
      return { item, input: screen.getByRole('textbox', { name: /your name/i }) };
    };

    it('saves the new name on Enter, trimmed', async () => {
      const { input } = await openProfile();
      expect(input).toHaveValue('Linguistic Platypus');
      await userEvent.clear(input);
      await userEvent.type(input, '  Ed {Enter}');

      expect(localStorage.getItem('when-display-name')).toBe('Ed');
      expect(input).toHaveValue('Ed');
    });

    it('saves a name still being typed when Done is pressed', async () => {
      const { input } = await openProfile();
      await userEvent.clear(input);
      await userEvent.type(input, 'Ed');
      await userEvent.click(screen.getByRole('button', { name: /^done$/i }));

      expect(localStorage.getItem('when-display-name')).toBe('Ed');
    });

    it('saves a name still being typed when the close button is pressed', async () => {
      const { input } = await openProfile();
      await userEvent.clear(input);
      await userEvent.type(input, 'Ed');
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(localStorage.getItem('when-display-name')).toBe('Ed');
    });

    it('keeps the old name when the field is left blank', async () => {
      const { input } = await openProfile();
      await userEvent.clear(input);
      await userEvent.tab();

      expect(localStorage.getItem('when-display-name')).toBe('Linguistic Platypus');
      expect(input).toHaveValue('Linguistic Platypus');
    });

    it('keeps the portrait the old name implied, rather than following the new name', async () => {
      const { item, input } = await openProfile();
      await userEvent.clear(input);
      await userEvent.type(input, 'Sleepy Koala{Enter}');

      expect(localStorage.getItem('when-avatar')).toBe('platypus');
      expect(within(item).getByTestId('portrait').dataset.animal).toBe('platypus');
    });
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
