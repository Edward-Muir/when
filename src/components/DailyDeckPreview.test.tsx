import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyDeckPreview from './DailyDeckPreview';
import { HistoricalEvent } from '../types';

/**
 * The hero shows today's starting event, which the game places face-up with its year on turn 1 —
 * so the long-form read is reachable from here without giving anything away. What it must not do
 * is offer the button for an event with nothing written, which would open an empty card.
 */

const event: HistoricalEvent = {
  name: 'birth-thomas-jefferson',
  friendly_name: 'Birth of Thomas Jefferson',
  year: 1743,
  category: 'figures',
  description: 'The principal author of the Declaration of Independence.',
  difficulty: 'easy',
  has_detail: true,
};

const readMore = () => screen.queryByRole('button', { name: /read more about this event/i });

const renderPreview = (props: Partial<React.ComponentProps<typeof DailyDeckPreview>> = {}) =>
  render(
    <DailyDeckPreview
      event={event}
      themeName="Everything"
      cta={<button type="button">Play Daily Challenge</button>}
      {...props}
    />
  );

describe('the Daily hero read-more', () => {
  it('opens the read for today’s starting event', () => {
    const onInfoClick = jest.fn();
    renderPreview({ onInfoClick });

    userEvent.click(readMore()!);
    expect(onInfoClick).toHaveBeenCalledTimes(1);
  });

  it('offers nothing for an event with no prose written yet', () => {
    renderPreview({ event: { ...event, has_detail: undefined }, onInfoClick: jest.fn() });
    expect(readMore()).not.toBeInTheDocument();
  });

  it('offers nothing where the surface has nowhere to open it', () => {
    renderPreview();
    expect(readMore()).not.toBeInTheDocument();
  });
});
