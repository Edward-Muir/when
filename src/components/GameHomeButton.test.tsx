import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameHomeButton from './GameHomeButton';

describe('GameHomeButton', () => {
  it('asks to go home when tapped', async () => {
    const onClick = jest.fn();
    render(<GameHomeButton onClick={onClick} hidden={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go home' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('steps out of the way while a card is dragged', () => {
    render(<GameHomeButton onClick={jest.fn()} hidden />);
    // Hidden from the accessibility tree too, so query by its label.
    const button = screen.getByLabelText('Go home');
    expect(button).toHaveClass('opacity-0', 'pointer-events-none');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('button', { name: 'Go home' })).toBeNull();
  });
});
