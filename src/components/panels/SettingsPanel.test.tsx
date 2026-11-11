import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import SettingsPanel from './SettingsPanel';
import { hasSeenHint, markHintSeen } from '../../utils/playerStorage';
import { loadAllEvents, getCachedEvents } from '../../utils/eventLoader';
import { TAB_HINT_TEXT } from '../../utils/hintCopy';
import { TAB_HINT_MOUNT_DELAY_MS } from '../../hooks/useTabHint';

jest.mock('../../utils/eventLoader', () => ({
  loadAllEvents: jest.fn(),
  getCachedEvents: jest.fn(),
}));
jest.mock('../../utils/preloadImage', () => ({ preloadEventImages: jest.fn() }));

// jsdom has no matchMedia; `usePWAInstall` calls it on mount. Stubbed per test because CRA's
// Jest config sets `resetMocks: true` (see Leaderboard.test.tsx).
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  (loadAllEvents as jest.Mock).mockResolvedValue([]);
  (getCachedEvents as jest.Mock).mockReturnValue([]);
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

/** An info page stand-in that shows where its Back would return to. */
const InfoPage: React.FC<{ title: string }> = ({ title }) => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return (
    <h1>
      {title} from {from}
    </h1>
  );
};

const renderPanel = (props: Partial<React.ComponentProps<typeof SettingsPanel>> = {}) =>
  render(
    <MemoryRouter
      initialEntries={['/settings']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/settings" element={<SettingsPanel {...props} />} />
        <Route path="/privacy" element={<InfoPage title="Privacy page" />} />
        <Route path="/support" element={<InfoPage title="Support page" />} />
        <Route path="/changelog" element={<InfoPage title="Changelog page" />} />
      </Routes>
    </MemoryRouter>
  );

const profile = () => screen.getByRole('button', { name: 'Profile' });

describe('SettingsPanel', () => {
  it('heads the tab, with the profile and settings above the stats and the links last', () => {
    renderPanel();
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    const order = [
      profile(),
      screen.getByRole('switch', { name: /dark mode/i }),
      screen.getByText('Best score'),
      screen.getByRole('heading', { name: 'Achievements' }),
      screen.getByRole('link', { name: /privacy policy/i }),
    ];
    order.slice(1).forEach((el, i) => {
      // eslint-disable-next-line security/detect-object-injection -- index into a local array
      expect(order[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it('does not list Achievements or My Timeline as links: one is below, one is a tab', () => {
    renderPanel();
    expect(screen.queryByRole('link', { name: /achievements/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my timeline/i })).toBeNull();
  });

  it('shows its first-visit hint once on screen, never while pre-mounted', () => {
    jest.useFakeTimers();
    try {
      const { unmount } = renderPanel({ active: false });
      act(() => jest.advanceTimersByTime(TAB_HINT_MOUNT_DELAY_MS));
      expect(screen.queryByText(TAB_HINT_TEXT.statsTab)).toBeNull();
      expect(hasSeenHint('statsTab')).toBe(false);
      unmount();

      renderPanel();
      act(() => jest.advanceTimersByTime(TAB_HINT_MOUNT_DELAY_MS));
      expect(screen.getByText(TAB_HINT_TEXT.statsTab)).toBeInTheDocument();
      expect(hasSeenHint('statsTab')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('switches dark mode on and off, and remembers it', async () => {
    renderPanel();
    const dark = screen.getByRole('switch', { name: /dark mode/i });
    expect(dark).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(dark);
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('when-theme')).toBe('dark');

    await userEvent.click(dark);
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('opens the rules from How to Play', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /how to play/i }));
    expect(screen.getByRole('heading', { name: 'How to Play' })).toBeInTheDocument();
    expect(screen.getByText('Build the longest timeline!')).toBeInTheDocument();
  });

  it('brings the hints back from Reset Hints, and says so', async () => {
    markHintSeen('swap');
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /reset hints/i }));

    expect(hasSeenHint('swap')).toBe(false);
    expect(screen.getByText('Hints will show again')).toBeInTheDocument();
  });

  it.each([
    [/what's new/i, 'Changelog page'],
    [/help & faq/i, 'Support page'],
    [/privacy policy/i, 'Privacy page'],
  ])('opens %s, telling the page to come back to Settings', async (name, title) => {
    renderPanel();
    await userEvent.click(screen.getByRole('link', { name }));
    expect(screen.getByText(`${title} from /settings`)).toBeInTheDocument();
  });

  it('links the version to the changelog', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('link', { name: /^v\d/ }));
    expect(screen.getByText('Changelog page from /settings')).toBeInTheDocument();
  });

  describe('profile', () => {
    beforeEach(() => localStorage.setItem('when-display-name', 'Linguistic Platypus'));

    it('shows the player by portrait and name', () => {
      renderPanel();
      expect(within(profile()).getByTestId('portrait').dataset.animal).toBe('platypus');
      expect(within(profile()).getByText('Linguistic Platypus')).toBeInTheDocument();
    });

    it('opens the picker, and a pick updates the card and is saved', async () => {
      renderPanel();
      await userEvent.click(profile());
      await userEvent.click(screen.getByRole('radio', { name: 'Koala' }));

      expect(localStorage.getItem('when-avatar')).toBe('koala');
      expect(within(profile()).getByTestId('portrait').dataset.animal).toBe('koala');
    });

    it('saves a new name, and shows it on the card', async () => {
      renderPanel();
      await userEvent.click(profile());
      const input = screen.getByRole('textbox', { name: /your name/i });
      await userEvent.clear(input);
      await userEvent.type(input, '  Ed {Enter}');

      expect(localStorage.getItem('when-display-name')).toBe('Ed');
      expect(within(profile()).getByText('Ed')).toBeInTheDocument();
      // The portrait stays the one the old name implied.
      expect(within(profile()).getByTestId('portrait').dataset.animal).toBe('platypus');
    });

    it('wears a "new" dot while an achievement portrait is unseen, until the picker opens', async () => {
      localStorage.setItem(
        'when-achievements',
        JSON.stringify({ unlocked: { '27': '2026-10-01' } })
      );
      renderPanel();
      expect(within(profile()).getByRole('img', { name: 'New' })).toBeInTheDocument();

      await userEvent.click(profile());
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));

      expect(within(profile()).queryByRole('img', { name: 'New' })).toBeNull();
    });

    it('wears no dot when every owned portrait has been seen', () => {
      localStorage.setItem(
        'when-achievements',
        JSON.stringify({ unlocked: { '27': '2026-10-01' } })
      );
      localStorage.setItem('when-portraits-seen', JSON.stringify(['unicorn']));
      renderPanel();
      expect(within(profile()).queryByRole('img', { name: 'New' })).toBeNull();
    });
  });
});
