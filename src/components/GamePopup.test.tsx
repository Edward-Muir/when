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
 * misses, and that ending is a win. A single player never has a `winner`, so the heading comes
 * from `getThemeOutcome`. The screen itself is `GameOverGallery`, which has its own suite; this
 * one pins what `GamePopup` decides: which ending it is, and how the popup may be left.
 */
describe('game over', () => {
  const at = (year: number): HistoricalEvent => ({
    ...event,
    name: `event-${year}`,
    friendly_name: `Event ${year}`,
    year,
  });

  const finished = (correct: number, misses: number, curatedThemeId?: string): WhenGameState => {
    const placementHistory = [...Array(correct).fill(true), ...Array(misses).fill(false)];
    // The starting card, then one card per correct placement.
    const timeline = Array.from({ length: correct + 1 }, (_, i) => at(1000 + i * 10));
    return {
      gameMode: 'suddenDeath',
      lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5, curatedThemeId },
      timeline,
      seedEventName: timeline[0].name,
      deck: [],
      failedPlacements: Array.from({ length: misses }, (_, i) => ({
        event: at(1005 + i * 10),
        attemptedPosition: 0,
        seq: i,
      })),
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

  const renderGameOver = (
    gameState: WhenGameState,
    props: Partial<React.ComponentProps<typeof GamePopup>> = {}
  ) => {
    const onDismiss = jest.fn();
    render(
      <GamePopup
        type="gameOver"
        event={null}
        gameState={gameState}
        onDismiss={onDismiss}
        {...props}
      />
    );
    return { onDismiss };
  };
  const grid = () => screen.getByTestId('gallery-grid');

  it('reads Theme Cleared! when a curated deck runs dry', () => {
    renderGameOver(finished(28, 2, 'test-theme'));
    expect(screen.getByRole('heading', { name: 'Theme Cleared!' })).not.toHaveClass('sr-only');
    expect(grid()).not.toHaveAttribute('data-gilt');
  });

  it('reads Perfect Clear! in a gold frame when the deck ran dry without a miss', () => {
    renderGameOver(finished(30, 0, 'test-theme'));
    expect(screen.getByRole('heading', { name: 'Perfect Clear!' })).not.toHaveClass('sr-only');
    expect(grid()).toHaveAttribute('data-gilt');
  });

  it('names the dialog Game Over, without showing the words, when misses emptied the hand', () => {
    renderGameOver(finished(20, 5, 'test-theme'));
    expect(screen.getByRole('dialog', { name: 'Game Over' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game Over' })).toHaveClass('sr-only');
    expect(grid()).not.toHaveAttribute('data-gilt');
  });

  it('never calls a Custom game a win, even one that ran dry', () => {
    renderGameOver(finished(12, 2));
    expect(screen.getByRole('heading', { name: 'Game Over' })).toHaveClass('sr-only');
    expect(screen.queryByText(/won|cleared/i)).toBeNull();
    expect(grid()).not.toHaveAttribute('data-gilt');
  });

  it('advances on a tap anywhere when there is nothing to submit', () => {
    const { onDismiss } = renderGameOver(finished(3, 5));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();

    userEvent.click(card());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('advances once, not twice, from the Continue button', () => {
    // The card is tap-advance, so the click would also reach the backdrop if it bubbled.
    const { onDismiss } = renderGameOver(finished(3, 5));
    userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
