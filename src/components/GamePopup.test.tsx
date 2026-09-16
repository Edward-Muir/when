import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamePopup from './GamePopup';
import { HistoricalEvent } from '../types';
import { loadEventDetail, peekEventDetail } from '../utils/eventDetail';

jest.mock('../utils/eventDetail', () => ({
  loadEventDetail: jest.fn(),
  peekEventDetail: jest.fn(() => undefined),
}));

const mockedLoad = loadEventDetail as jest.MockedFunction<typeof loadEventDetail>;
const mockedPeek = peekEventDetail as jest.MockedFunction<typeof peekEventDetail>;

/**
 * The gate is the point of this suite. The long-form prose is written post-placement and names
 * dates freely, so an info button reachable from a card still in the player's hand would hand
 * over the answer the game is asking for. All three conditions are pinned separately, because
 * each one is a different way to leak it.
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
const card = () => screen.getByTestId('modal-card');
const backdrop = () => screen.getByTestId('modal-backdrop');

const renderPopup = (props: Partial<React.ComponentProps<typeof GamePopup>> = {}) => {
  const onDismiss = jest.fn();
  render(<GamePopup type="description" event={event} onDismiss={onDismiss} {...props} />);
  return { onDismiss };
};

beforeEach(() => {
  mockedLoad.mockReset();
  mockedPeek.mockReset();
  mockedPeek.mockReturnValue(undefined);
  mockedLoad.mockResolvedValue(['First paragraph.', 'Second paragraph.']);
});

describe('the read-more gate', () => {
  it('offers the button on a placed card that has prose', () => {
    renderPopup();
    expect(readMore()).toBeInTheDocument();
  });

  it('hides the button while the year is hidden — a card still in hand', () => {
    renderPopup({ showYear: false });
    expect(readMore()).not.toBeInTheDocument();
  });

  it('hides the button for an event with no prose written yet', () => {
    renderPopup({ event: { ...event, has_detail: undefined } });
    expect(readMore()).not.toBeInTheDocument();
  });

  it('hides the button on a correct/incorrect reveal, which is a game beat not a reading surface', () => {
    renderPopup({ type: 'incorrect' });
    expect(readMore()).not.toBeInTheDocument();
  });
});

describe('reading more', () => {
  it('swaps the short description for the prose, and back again', async () => {
    renderPopup();

    userEvent.click(readMore()!);
    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    // One box, one text: the description is what the prose replaced.
    expect(screen.queryByText(event.description)).not.toBeInTheDocument();

    userEvent.click(readMore()!);
    expect(await screen.findByText(event.description)).toBeInTheDocument();
    expect(screen.queryByText('First paragraph.')).not.toBeInTheDocument();
  });

  it('announces which of the two texts it is showing', async () => {
    renderPopup();
    expect(readMore()).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(readMore()!);
    await screen.findByText('First paragraph.');
    expect(readMore()).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the title and year visible while the prose is showing', async () => {
    renderPopup();
    userEvent.click(readMore()!);

    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText(event.friendly_name)).toBeInTheDocument();
    expect(screen.getByText('1743')).toBeInTheDocument();
  });

  it('offers a retry rather than a blank box when the shard will not load', async () => {
    mockedLoad.mockResolvedValue(null);
    renderPopup();

    userEvent.click(readMore()!);
    expect(await screen.findByRole('button', { name: /tap to retry/i })).toBeInTheDocument();
  });

  it('returns to the description when the popup moves to another event', async () => {
    const { rerender } = render(
      <GamePopup type="description" event={event} onDismiss={jest.fn()} />
    );

    userEvent.click(readMore()!);
    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();

    const other: HistoricalEvent = {
      ...event,
      name: 'first-rules-of-golf',
      friendly_name: 'First Rules of Golf',
      description: 'Thirteen articles agreed by a golfing society.',
    };
    rerender(<GamePopup type="description" event={other} onDismiss={jest.fn()} />);

    // Never one event's prose under another event's title.
    await waitFor(() => expect(screen.queryByText('First paragraph.')).not.toBeInTheDocument());
    expect(screen.getByText('First Rules of Golf')).toBeInTheDocument();
    expect(screen.getByText(other.description)).toBeInTheDocument();
  });

  it('mutes the prose on a tombstoned event, as the rest of that card is muted', async () => {
    renderPopup({ tombstone: true });

    userEvent.click(readMore()!);
    expect(await screen.findByText('First paragraph.')).toHaveClass('text-text-muted');
  });
});

describe('opening straight onto the prose', () => {
  it('shows the prose without a tap, and offers no control to leave it', async () => {
    renderPopup({ openExpanded: true });

    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.queryByText(event.description)).not.toBeInTheDocument();
    // The surface was asked for the read; there is nothing to toggle to.
    expect(readMore()).not.toBeInTheDocument();
  });
});

describe('dismissal', () => {
  it('advances on a tap anywhere while the description is showing', () => {
    const { onDismiss } = renderPopup();
    userEvent.click(card());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores taps on the card while the prose is showing, so a scroll drag is not a dismissal', async () => {
    const { onDismiss } = renderPopup();

    userEvent.click(readMore()!);
    await screen.findByText('First paragraph.');

    userEvent.click(card());
    expect(onDismiss).not.toHaveBeenCalled();

    // The way out is still there.
    userEvent.click(backdrop());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
