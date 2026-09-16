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
 * Which of an event's two texts this popup shows is the point of this suite. The long-form prose
 * is written post-placement and names dates freely, so a card still in the player's hand must get
 * the short description and nothing else — that is the answer to the puzzle otherwise. Each
 * condition is pinned separately, because each one is a different way to leak it.
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

const prose = () => screen.queryByText('First paragraph.');
const description = () => screen.queryByText(event.description);
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

describe('which text a card shows', () => {
  it('reads the prose on a placed card that has it', async () => {
    renderPopup();

    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    expect(description()).not.toBeInTheDocument();
  });

  it('keeps the prose off a card still in hand — the year is hidden there', async () => {
    renderPopup({ showYear: false });

    expect(await screen.findByText(event.description)).toBeInTheDocument();
    await waitFor(() => expect(prose()).not.toBeInTheDocument());
    // Not merely hidden: never asked for.
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it('falls back to the description for an event with no prose written', async () => {
    renderPopup({ event: { ...event, has_detail: undefined } });

    expect(await screen.findByText(event.description)).toBeInTheDocument();
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it('keeps the prose off a correct/wrong reveal, which is a game beat not a reading surface', async () => {
    renderPopup({ type: 'incorrect' });

    expect(await screen.findByText(event.description)).toBeInTheDocument();
    expect(prose()).not.toBeInTheDocument();
  });

  it('falls back to the description, and offers a retry, when the shard will not load', async () => {
    mockedLoad.mockResolvedValue(null);
    renderPopup();

    expect(await screen.findByText(event.description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tap to retry/i })).toBeInTheDocument();
  });

  it('never shows one event’s prose under another event’s title', async () => {
    const { rerender } = render(
      <GamePopup type="description" event={event} onDismiss={jest.fn()} />
    );
    expect(await screen.findByText('First paragraph.')).toBeInTheDocument();

    mockedLoad.mockResolvedValue(['Golf paragraph.']);
    const other: HistoricalEvent = {
      ...event,
      name: 'first-rules-of-golf',
      friendly_name: 'First Rules of Golf',
    };
    rerender(<GamePopup type="description" event={other} onDismiss={jest.fn()} />);

    await waitFor(() => expect(prose()).not.toBeInTheDocument());
    expect(screen.getByText('First Rules of Golf')).toBeInTheDocument();
  });

  it('mutes the prose on a tombstoned event, as the rest of that card is muted', async () => {
    renderPopup({ tombstone: true });
    expect(await screen.findByText('First paragraph.')).toHaveClass('text-text-muted');
  });
});

describe('dismissal', () => {
  it('closes on the ✕', async () => {
    const { onDismiss } = renderPopup();
    await screen.findByText('First paragraph.');

    userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores taps on the card while the prose is up, so a scroll drag is not a dismissal', async () => {
    const { onDismiss } = renderPopup();
    await screen.findByText('First paragraph.');

    userEvent.click(card());
    expect(onDismiss).not.toHaveBeenCalled();

    userEvent.click(backdrop());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('advances on a tap anywhere where there is no prose to scroll', async () => {
    const { onDismiss } = renderPopup({ showYear: false });
    await screen.findByText(event.description);

    userEvent.click(card());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
