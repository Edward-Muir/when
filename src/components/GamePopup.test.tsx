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
const goBack = () => screen.queryByRole('button', { name: /back to the card/i });

const renderPopup = (props: Partial<React.ComponentProps<typeof GamePopup>> = {}) =>
  render(<GamePopup type="description" event={event} onDismiss={jest.fn()} {...props} />);

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

describe('turning the card over', () => {
  it('shows the prose, and the back control returns to the card face', async () => {
    renderPopup();

    userEvent.click(readMore()!);
    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    // The short description belongs to the card face and must not be on the reading face.
    expect(screen.queryByText(event.description)).not.toBeInTheDocument();

    userEvent.click(goBack()!);
    expect(await screen.findByText(event.description)).toBeInTheDocument();
    expect(readMore()).toBeInTheDocument();
  });

  it('keeps the title and year visible on both faces', async () => {
    renderPopup();
    userEvent.click(readMore()!);

    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText(event.friendly_name)).toBeInTheDocument();
    expect(screen.getByText('1743')).toBeInTheDocument();
  });

  it('offers a retry rather than a blank face when the shard will not load', async () => {
    mockedLoad.mockResolvedValue(null);
    renderPopup();

    userEvent.click(readMore()!);
    expect(await screen.findByRole('button', { name: /tap to retry/i })).toBeInTheDocument();
  });

  it('turns back to the card face when the popup moves to another event', async () => {
    const { rerender } = renderPopup();

    userEvent.click(readMore()!);
    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();

    const other: HistoricalEvent = {
      ...event,
      name: 'first-rules-of-golf',
      friendly_name: 'First Rules of Golf',
    };
    rerender(<GamePopup type="description" event={other} onDismiss={jest.fn()} />);

    // Never one event's prose under another event's title.
    await waitFor(() => expect(screen.queryByText('First paragraph.')).not.toBeInTheDocument());
    expect(screen.getByText('First Rules of Golf')).toBeInTheDocument();
    expect(readMore()).toBeInTheDocument();
  });
});
