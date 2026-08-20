import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModeSelect from './ModeSelect';
import { getLocalDateString } from '../utils/puzzleDate';
import {
  __setCuratedThemesForTest,
  loadCuratedThemes,
  type CuratedTheme,
} from '../utils/curatedThemes';
import { getThemeDisplayName, getDailyTheme } from '../utils/dailyTheme';

/**
 * The bug this file exists for: the theme calendar is fetched asynchronously but read
 * synchronously, and `App` mounts `ModeSelect` during the `loading` phase with a constant key.
 * So the theme name was computed on a render that happened BEFORE the calendar landed, and a
 * `[today]` dependency never revisited it — a curated day showed the seeded fallback category
 * until midnight. It stayed hidden because the label reads the stored result instead once the
 * player has played.
 *
 * The ordering is the whole test. Mounting once with the calendar already resolved passes
 * against the broken code and proves nothing.
 */

// jsdom implements none of these, and `ModePager` calls scrollTo on mount.
// `beforeEach`, not `beforeAll`: CRA sets `resetMocks: true`, which strips implementations
// off mocks between tests.
beforeEach(() => {
  Element.prototype.scrollTo = jest.fn();
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
  // Suppresses ModePager's one-time swipe nudge, whose timers would outlive the test.
  localStorage.setItem('when:modeSwipeHintSeen', '1');
});

afterEach(() => {
  __setCuratedThemesForTest(null);
  localStorage.clear();
});

const TODAY = getLocalDateString();

const THEME: CuratedTheme = {
  id: 'english-history',
  name: 'English History',
  eventNames: ['magna-carta', 'battle-of-hastings', 'great-fire-london'],
  dates: [TODAY],
};

/** The seeded category this date falls back to when the calendar is absent. */
const seededName = () => {
  __setCuratedThemesForTest(null);
  return getThemeDisplayName(getDailyTheme(TODAY));
};

/**
 * A calendar fetch we resolve by hand, so the component definitely renders first. Anything
 * that is not the calendar (the leaderboard) gets an inert board.
 */
function deferredCalendar() {
  let release: (calendar: unknown) => void = () => {};
  const pending = new Promise<unknown>((resolve) => {
    release = resolve;
  });

  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/themes')) {
      return pending.then((calendar) => ({ ok: true, json: () => Promise.resolve(calendar) }));
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ date: TODAY, leaderboard: [], totalPlayers: 0 }),
    });
  }) as unknown as typeof fetch;

  return { release };
}

const ui = (isLoading: boolean) => (
  <MemoryRouter>
    <ModeSelect onStart={jest.fn()} isLoading={isLoading} allEvents={[]} />
  </MemoryRouter>
);

describe('ModeSelect names a curated day', () => {
  it('picks up the theme when the calendar lands after the first render', async () => {
    const fallback = seededName();
    const { release } = deferredCalendar();

    // The loading render App really performs, before any fetch has resolved.
    const { rerender } = render(ui(true));
    const boot = loadCuratedThemes({ force: true });

    await act(async () => {
      release({ version: 1, themes: [THEME] });
      await boot;
    });

    // Same element type and position — a re-render, not a remount, exactly as the phase flip.
    rerender(ui(false));

    expect(await screen.findByText('English History')).toBeInTheDocument();
    expect(screen.queryByText(fallback)).not.toBeInTheDocument();
  });

  it('still shows the seeded category on an ordinary day', async () => {
    const fallback = seededName();
    const { release } = deferredCalendar();

    const { rerender } = render(ui(true));
    const boot = loadCuratedThemes({ force: true });

    await act(async () => {
      // A calendar that knows nothing about today.
      release({ version: 1, themes: [{ ...THEME, dates: ['2030-04-10'] }] });
      await boot;
    });
    rerender(ui(false));

    expect(await screen.findByText(fallback)).toBeInTheDocument();
    expect(screen.queryByText('English History')).not.toBeInTheDocument();
  });
});
