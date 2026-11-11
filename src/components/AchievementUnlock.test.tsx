import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AchievementUnlock from './AchievementUnlock';
import { ACHIEVEMENTS, AchievementDef } from '../data/achievements';
import { HistoricalEvent } from '../types';
import { getImageUrl } from '../utils/cloudinaryImage';

jest.mock('react-confetti-explosion', () => () => null);

const def = (id: string): AchievementDef => ACHIEVEMENTS.find((a) => a.id === id)!;

const event = (name: string): HistoricalEvent => ({
  name,
  friendly_name: name,
  year: 1969,
  category: 'science',
  description: '',
  difficulty: 'easy',
  image_url: `https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/${name}`,
});

// First Steps (none), Regular (bronze) and an Empire Builder-style category badge (steel).
const firstGame = [def('01'), def('02'), def('cat-empires')];
const eventsByName = new Map(firstGame.map((a) => [a.eventName, event(a.eventName)]));

// jsdom has no matchMedia, which framer-motion's reduced-motion check reads. Stubbed per test
// because CRA's Jest config sets `resetMocks: true` (see Menu.test.tsx).
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

const renderUnlock = (achievements: AchievementDef[]) => {
  const onDismiss = jest.fn();
  render(
    <AchievementUnlock
      open
      achievements={achievements}
      eventsByName={eventsByName}
      onDismiss={onDismiss}
    />
  );
  return { onDismiss };
};

describe('one badge', () => {
  it('keeps the single reveal, and Continue leaves it once', () => {
    const { onDismiss } = renderUnlock([def('02')]);
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.queryByTestId('achievements-summary')).toBeNull();
    userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('still continues on a tap anywhere', () => {
    const { onDismiss } = renderUnlock([def('02')]);
    userEvent.click(screen.getByTestId('modal-card'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('two or more badges', () => {
  it('shows them all on one screen, the rarest leading', () => {
    renderUnlock(firstGame);
    const summary = screen.getByTestId('achievements-summary');
    expect(within(summary).getByRole('heading')).toHaveTextContent('3 achievements unlocked');
    const buttons = within(summary)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label') ?? b.textContent);
    const lead = def('cat-empires');
    expect(buttons).toEqual([
      `${lead.name}: ${lead.unlockCriteria}`,
      def('01').name,
      def('02').name,
      'Continue',
    ]);
    expect(screen.queryByText('Achievement Unlocked!')).toBeNull();
  });

  it('asks only for the thumbnail size', () => {
    renderUnlock(firstGame);
    const art = screen.getAllByTestId('summary-badge-art');
    expect(art).toHaveLength(3);
    const thumbnails = firstGame.map((a) => getImageUrl(event(a.eventName).image_url, 'thumbnail'));
    for (const img of art) expect(thumbnails).toContain(img.getAttribute('src'));
  });

  it('opens the detail popup over the screen for a tapped badge, and closes only it', async () => {
    const { onDismiss } = renderUnlock(firstGame);
    userEvent.click(screen.getByRole('button', { name: def('01').name }));

    const cards = screen.getAllByTestId('modal-card');
    expect(cards).toHaveLength(2);
    const detail = cards[1];
    expect(within(detail).getByRole('heading', { name: def('01').name })).toBeInTheDocument();
    // Same reveal layer as the screen under it, later in the DOM, so it is on top.
    expect(screen.getAllByTestId('modal-backdrop')[1]).toHaveClass('z-[60]');

    // ESC reaches both popups' listeners; only the detail may act on it.
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.getAllByTestId('modal-card')).toHaveLength(1));
    expect(onDismiss).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('is not tap-anywhere: a tap on the card does not leave it', () => {
    const { onDismiss } = renderUnlock(firstGame);
    userEvent.click(screen.getByRole('heading', { name: '3 achievements unlocked' }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
