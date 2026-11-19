import { render, screen, fireEvent } from '@testing-library/react';
import HandBar from './HandBar';

const renderBar = (phase: 'playing' | 'gameOver' = 'playing') =>
  render(
    <HandBar phase={phase} isOverHand={false} barRef={() => {}}>
      <button>Swap</button>
    </HandBar>
  );

describe('HandBar', () => {
  it('tucks the hand away and brings it back', () => {
    renderBar();
    const bar = screen.getByTestId('hand-bar');
    const hand = screen.getByTestId('hand-bar-content');
    expect(bar).not.toHaveClass('hand-bar-hidden');

    const tab = screen.getByRole('button', { name: 'Hide hand' });
    expect(tab).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(tab);

    expect(bar).toHaveClass('hand-bar-hidden');
    expect(hand).toHaveAttribute('inert');
    const show = screen.getByRole('button', { name: 'Show hand' });
    expect(show).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(show);
    expect(bar).not.toHaveClass('hand-bar-hidden');
    expect(hand).not.toHaveAttribute('inert');
  });

  it('has no tab at game over, and shows the bar even if the hand was hidden', () => {
    const { rerender } = renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Hide hand' }));
    rerender(
      <HandBar phase="gameOver" isOverHand={false} barRef={() => {}}>
        <button>Share</button>
      </HandBar>
    );
    expect(screen.getByTestId('hand-bar')).not.toHaveClass('hand-bar-hidden');
    expect(screen.queryByRole('button', { name: /hand/i })).toBeNull();
  });
});
