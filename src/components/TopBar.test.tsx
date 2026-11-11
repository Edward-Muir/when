import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TopBar, { navForPath, pathForNav } from './TopBar';

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

const TAB_LABELS = ['Past decks', 'Custom game', 'View stats', 'View my timeline'];

const renderBar = (props: Partial<React.ComponentProps<typeof TopBar>> = {}) => {
  const onHomeClick = jest.fn();
  render(
    <MemoryRouter>
      <TopBar showHome showTitle={false} onHomeClick={onHomeClick} {...props} />
    </MemoryRouter>
  );
  return { onHomeClick };
};

describe('TopBar buttons', () => {
  it("shows Home and Menu in a game, and none of Home's tabs", async () => {
    const { onHomeClick } = renderBar();
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    TAB_LABELS.forEach((label) => expect(screen.queryByLabelText(label)).toBeNull());
    await userEvent.click(screen.getByLabelText('Go home'));
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });

  it('shows Menu alone on Home', () => {
    renderBar({ showHome: false });
    expect(screen.queryByLabelText('Go home')).toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Open menu',
    ]);
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

describe('TopBar restart', () => {
  it('shows Restart only when the game offers one', () => {
    renderBar();
    expect(screen.queryByLabelText('Restart game')).not.toBeInTheDocument();
  });

  it('asks first, and restarts only once confirmed', async () => {
    const onRestart = jest.fn();
    renderBar({ onRestart });
    await userEvent.click(screen.getByLabelText('Restart game'));
    expect(screen.getByRole('heading', { name: 'Restart game?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onRestart).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Restart game'));
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('ignores taps while a placement animates', async () => {
    const onRestart = jest.fn();
    renderBar({ onRestart, restartDisabled: true });
    await userEvent.click(screen.getByLabelText('Restart game'));
    expect(screen.queryByRole('heading', { name: 'Restart game?' })).not.toBeInTheDocument();
  });
});
