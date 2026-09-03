import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HowToPlayModal from './HowToPlayModal';
import { TAB_HINT_TEXT } from '../utils/hintCopy';
import { hasSeenHint } from '../utils/playerStorage';

beforeEach(() => localStorage.clear());

describe('HowToPlayModal', () => {
  it('renders nothing while closed', () => {
    render(<HowToPlayModal open={false} onDismiss={jest.fn()} />);
    expect(screen.queryByText('How to Play')).toBeNull();
  });

  it('states the whole loop and names every tab', () => {
    render(<HowToPlayModal open onDismiss={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'How to Play' })).toBeInTheDocument();
    expect(screen.getByText(/You hold a hand of cards/)).toBeInTheDocument();
    expect(screen.getByText(/your hand is one card smaller/)).toBeInTheDocument();
    // Quoted by the share copy; keep it verbatim.
    expect(screen.getByText('Build the longest timeline!')).toBeInTheDocument();
    ['Daily', 'Archive', 'Custom', 'Stats', 'My Timeline'].forEach((tab) =>
      expect(screen.getByText(tab)).toBeInTheDocument()
    );
    // The tab hints are re-findable here, word for word.
    expect(screen.getByText(TAB_HINT_TEXT.archiveTab)).toBeInTheDocument();
    expect(screen.getByText(TAB_HINT_TEXT.timelineTab)).toBeInTheDocument();
  });

  it('dismisses from the Got it button and counts as having read the rules', async () => {
    const onDismiss = jest.fn();
    render(<HowToPlayModal open onDismiss={onDismiss} />);
    expect(hasSeenHint('rules')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(hasSeenHint('rules')).toBe(true);
  });
});
