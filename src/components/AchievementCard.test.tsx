import React from 'react';
import { render, screen } from '@testing-library/react';
import AchievementCard from './AchievementCard';
import { ACHIEVEMENTS } from '../data/achievements';

const maestro = ACHIEVEMENTS.find((a) => a.id === 'cat-art')!;

describe('AchievementCard earned portrait', () => {
  // The large card is the unlock reveal and the detail popup.
  it('names the portrait an unlocked badge earned', () => {
    render(<AchievementCard achievement={maestro} unlocked size="lg" />);
    const line = screen.getByTestId('earned-portrait');
    expect(line).toHaveTextContent('Portrait unlocked: Chameleon');
    expect(screen.getByTestId('portrait').dataset.animal).toBe('chameleon');
  });

  it('teases it, greyed, on a locked badge', () => {
    render(<AchievementCard achievement={maestro} unlocked={false} size="lg" />);
    expect(screen.getByTestId('earned-portrait')).toHaveTextContent(
      'Unlocks the portrait: Chameleon'
    );
    expect(screen.getByTestId('portrait')).toHaveClass('grayscale');
  });

  it('stays off the small grid card', () => {
    render(<AchievementCard achievement={maestro} unlocked />);
    expect(screen.queryByTestId('earned-portrait')).toBeNull();
  });
});
