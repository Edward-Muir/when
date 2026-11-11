import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestonePopup from './MilestonePopup';
import { GameMilestone } from '../utils/statsStorage';

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

const milestones: GameMilestone[] = [
  { kind: 'longestTimelineDaily', value: 15, previous: 12 },
  { kind: 'longestStreakDaily', value: 9, previous: 7 },
];

describe('MilestonePopup', () => {
  it('walks the milestones with a Continue button, leaving after the last', () => {
    const onDismiss = jest.fn();
    render(<MilestonePopup open milestones={milestones} onDismiss={onDismiss} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.queryByText(/Tap to/)).toBeNull();

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('still advances on a tap anywhere', () => {
    const onDismiss = jest.fn();
    render(<MilestonePopup open milestones={milestones.slice(0, 1)} onDismiss={onDismiss} />);
    userEvent.click(screen.getByTestId('modal-card'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
