import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamePopup from './GamePopup';
import { HistoricalEvent, WhenGameState } from '../types';
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

  it('closes a card in hand on the ✕ once, not again through the card tap it sits in', async () => {
    const { onDismiss } = renderPopup({ showYear: false });
    await screen.findByText(event.description);

    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('steps the ✕ aside while the report reasons are up, and brings it back on Cancel', async () => {
    const { onDismiss } = renderPopup({ showYear: false });
    await screen.findByText(event.description);

    userEvent.click(screen.getByRole('button', { name: /report an issue/i }));
    expect(screen.getByText(/what's wrong with this card/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

/**
 * A curated theme is small enough to finish: the deck runs dry, the hand empties without five
 * misses, and that ending is a win. A single player never has a `winner`, so the title and the
 * trophy both come from `getThemeOutcome`.
 */
describe('game over', () => {
  const finished = (correct: number, misses: number, curatedThemeId?: string): WhenGameState => {
    const placementHistory = [...Array(correct).fill(true), ...Array(misses).fill(false)];
    return {
      gameMode: 'suddenDeath',
      lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5, curatedThemeId },
      players: [
        {
          id: 0,
          name: 'Player 1',
          hand: [],
          placementHistory,
          isEliminated: true,
          hasWon: false,
        },
      ],
      winners: [],
      placementHistory,
      bestStreak: correct,
    } as unknown as WhenGameState;
  };

  const renderGameOver = (gameState: WhenGameState) =>
    render(<GamePopup type="gameOver" event={null} gameState={gameState} onDismiss={jest.fn()} />);
  const trophy = () => screen.getByTestId('game-over-trophy');

  it('reads Theme Cleared! with a gold trophy when a curated deck runs dry', () => {
    renderGameOver(finished(28, 2, 'test-theme'));
    expect(screen.getByText('Theme Cleared!')).toBeInTheDocument();
    expect(trophy()).toHaveClass('text-accent');
  });

  it('reads Perfect Clear! when the deck ran dry without a miss', () => {
    renderGameOver(finished(30, 0, 'test-theme'));
    expect(screen.getByText('Perfect Clear!')).toBeInTheDocument();
    expect(trophy()).toHaveClass('text-accent');
  });

  it('reads Game Over with a muted trophy when misses emptied the hand', () => {
    renderGameOver(finished(20, 5, 'test-theme'));
    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(trophy()).toHaveClass('text-text-muted');
  });

  it('never calls a Custom game a win, even one that ran dry', () => {
    renderGameOver(finished(12, 2));
    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(screen.queryByText(/won|cleared/i)).toBeNull();
    expect(trophy()).toHaveClass('text-text-muted');
  });
});
