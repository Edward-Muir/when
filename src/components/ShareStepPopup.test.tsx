import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareStepPopup from './ShareStepPopup';
import { WhenGameState } from '../types';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { shareResults } from '../utils/share';

jest.mock('../utils/share', () => ({
  ...jest.requireActual('../utils/share'),
  shareResults: jest.fn(),
}));

// jsdom has no matchMedia, which framer-motion's reduced-motion check reads. Stubbed per test
// because CRA's Jest config sets `resetMocks: true` (see Menu.test.tsx).
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
  (shareResults as jest.Mock).mockResolvedValue(false);
});

/** 14 placed, 5 missed. */
const history = [...Array(14).fill(true), ...Array(5).fill(false)];

const game = (overrides: Partial<WhenGameState> = {}): WhenGameState =>
  ({
    phase: 'gameOver',
    gameMode: 'daily',
    lastConfig: { mode: 'daily', suddenDeathHandSize: 5 },
    timeline: [],
    deck: [],
    failedPlacements: [],
    placementHistory: history,
    players: [{ id: 0, name: 'Player 1', hand: [], hasWon: false, placementHistory: history }],
    winners: [],
    bestStreak: 9,
    ...overrides,
  }) as WhenGameState;

const row = (rank: number, correctCount: number): LeaderboardEntry => ({
  displayName: `Player ${rank}`,
  correctCount,
  rank,
});

// 16, 15, 14, 14: the server ranks the player 4th; the row numbers them 3rd, on a tie.
const entries = [row(1, 16), row(2, 15), row(3, 14), row(4, 14)];
const board = { entries, rank: 4, totalPlayers: 16, playerEntry: entries[3] };

const renderCard = (
  gameState: WhenGameState,
  props: Partial<React.ComponentProps<typeof ShareStepPopup>> = {}
) => {
  const handlers = { onDismiss: jest.fn(), onRestart: jest.fn(), onHome: jest.fn() };
  render(<ShareStepPopup open gameState={gameState} {...handlers} {...props} />);
  return handlers;
};

describe('the closing card on a Daily', () => {
  it('says events placed, without the starting card, and the place as the row numbers it', () => {
    renderCard(game(), { leaderboard: board });
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByTestId('closing-score')).toHaveTextContent('14 events placed');
    expect(screen.getByText('3rd of 16 today')).toBeInTheDocument();
    expect(screen.getByText(/Next daily in/)).toBeInTheDocument();
  });

  it('shares exactly as before: the server rank, through the unchanged call', async () => {
    const gameState = game();
    renderCard(gameState, { leaderboard: board });
    userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(shareResults).toHaveBeenCalledWith(gameState, { leaderboardRank: 4 });
  });

  it('offers View timeline and Home, and no Restart', () => {
    const { onDismiss, onHome, onRestart } = renderCard(game(), { leaderboard: board });
    expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
    userEvent.click(screen.getByRole('button', { name: 'View timeline' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onHome).toHaveBeenCalledTimes(1);
    expect(onRestart).not.toHaveBeenCalled();
  });

  it('has no place line before the score is on the board', () => {
    renderCard(game(), {
      leaderboard: { entries, rank: null, totalPlayers: 16, playerEntry: null },
    });
    expect(screen.queryByText(/ today$/)).toBeNull();
  });

  it('is not tap-anywhere: a tap on the card does not close it', () => {
    const { onDismiss } = renderCard(game(), { leaderboard: board });
    userEvent.click(screen.getByTestId('closing-score'));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('the closing card on a Custom or Archive game', () => {
  const custom = game({
    gameMode: 'suddenDeath',
    lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5 } as WhenGameState['lastConfig'],
  });

  it('offers Restart and Home, with no place line and no countdown', () => {
    const { onRestart, onHome } = renderCard(custom);
    expect(screen.getByText('Custom game')).toBeInTheDocument();
    expect(screen.getByTestId('closing-score')).toHaveTextContent('14 events placed');
    expect(screen.queryByText(/ today$/)).toBeNull();
    expect(screen.queryByText(/Next daily in/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'View timeline' })).toBeNull();
    userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
    userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('reads one event in the singular', () => {
    const one = [true, false, false, false, false, false];
    renderCard(game({ ...custom, placementHistory: one }));
    expect(screen.getByTestId('closing-score')).toHaveTextContent('1 event placed');
  });
});
