import React from 'react';
import { render, screen, within } from '@testing-library/react';
import GameOverGallery from './GameOverGallery';
import { FailedPlacement, HistoricalEvent, Player, WhenGameState } from '../../types';
import { DailyLeaderboard } from '../../hooks/useDailyLeaderboard';
import { DailyResult } from '../../utils/playerStorage';

/**
 * The game-over screen: the timeline as a grid of paintings. What matters here is that the grid
 * is the board (same order, tombstones in their true places and never counted), that it only
 * ever asks for the image size the board already loaded, and that each kind of game gets the
 * right words under it. The travel from the board is an entrance and cannot run in jsdom, where
 * there is no board to measure; that it then shows the finished grid at once is tested too.
 */

const card = (name: string, year: number): HistoricalEvent => ({
  name,
  friendly_name: name.replace(/-/g, ' '),
  year,
  category: 'empires',
  description: '',
  difficulty: 'easy',
  image_url: `https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/${name}`,
});

const miss = (event: HistoricalEvent, seq: number): FailedPlacement => ({
  event,
  attemptedPosition: 0,
  seq,
});

const player = (id: number, name: string, placementHistory: boolean[]): Player => ({
  id,
  name,
  hand: [],
  hasWon: false,
  placementHistory,
});

const seed = card('magna-carta', 1215);
const placed = [
  card('fall-of-rome', 476),
  card('moon-landing', 1969),
  card('printing-press', 1440),
];
const missed = [miss(card('black-death', 1347), 2), miss(card('first-flight', 1903), 4)];
const history = [true, false, true, false, true];

const game = (overrides: Partial<WhenGameState> = {}): WhenGameState =>
  ({
    phase: 'gameOver',
    gameMode: 'suddenDeath',
    lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5 },
    // The board keeps this sorted; so does the fixture.
    timeline: [placed[0], seed, placed[2], placed[1]],
    seedEventName: seed.name,
    deck: [],
    failedPlacements: missed,
    placementHistory: history,
    players: [player(0, 'Player 1', history)],
    winners: [],
    bestStreak: 1,
    ...overrides,
  }) as WhenGameState;

const renderGallery = (
  gameState: WhenGameState,
  props: Partial<React.ComponentProps<typeof GameOverGallery>> = {}
) => render(<GameOverGallery gameState={gameState} dismiss="tap-advance" {...props} />);

const tiles = () => within(screen.getByTestId('gallery-grid')).getAllByRole('listitem');
const art = (tile: HTMLElement) => within(tile).getByTestId('gallery-art');

describe('the grid', () => {
  it('lays the timeline out in date order with each missed card at its true place', () => {
    renderGallery(game());
    expect(tiles().map((tile) => tile.getAttribute('aria-label'))).toEqual([
      'fall of rome, 476',
      'magna carta, 1215, starting card',
      'black death, 1347, missed',
      'printing press, 1440',
      'first flight, 1903, missed',
      'moon landing, 1969',
    ]);
  });

  it('marks placed, missed and starting cards apart', () => {
    renderGallery(game());
    expect(tiles().map((tile) => tile.getAttribute('data-gallery-tile'))).toEqual([
      'placed',
      'seed',
      'missed',
      'placed',
      'missed',
      'placed',
    ]);
  });

  it('greys a missed card and leaves a placed one in colour', () => {
    renderGallery(game());
    const [, , tombstone, kept] = tiles();
    expect(art(tombstone)).toHaveClass('grayscale');
    expect(art(kept)).not.toHaveClass('grayscale');
  });

  it('only ever asks for the thumbnail the board already loaded', () => {
    renderGallery(game());
    const sources = tiles().map((tile) => art(tile).getAttribute('src') ?? '');
    expect(sources).toHaveLength(6);
    for (const src of sources) {
      expect(src).toContain('h_400,q_auto:good,w_400');
      expect(src).not.toContain('w_768');
      expect(src).not.toContain('dpr_auto');
    }
  });

  it('shows the finished grid at once when there is no board to travel from', () => {
    renderGallery(game());
    for (const tile of tiles()) expect(tile).not.toHaveClass('invisible');
    expect(screen.queryByTestId('gallery-flight')).not.toBeInTheDocument();
  });
});

describe('the score', () => {
  it('counts correct placements, never the tombstones or the starting card', () => {
    renderGallery(game());
    expect(screen.getByTestId('gallery-score')).toHaveTextContent('3');
    expect(screen.getByText('events placed')).toBeInTheDocument();
  });

  it('says "event" for one', () => {
    const one = [true, false, false, false, false, false];
    renderGallery(game({ placementHistory: one, players: [player(0, 'Player 1', one)] }));
    expect(screen.getByText('event placed')).toBeInTheDocument();
  });

  it('gives the span of the placed cards, which a tombstone cannot stretch', () => {
    // 476 to 1969. A missed card from 3000 BCE is not on the timeline and must not count.
    const far = miss(card('first-writing', -3000), 6);
    renderGallery(game({ failedPlacements: [...missed, far] }));
    expect(screen.getByText('1,493 years in one timeline')).toBeInTheDocument();
  });

  it('leads with the best streak once it is worth saying', () => {
    renderGallery(game({ bestStreak: 9 }));
    expect(screen.getByText('Best streak 9 · 1,493 years in one timeline')).toBeInTheDocument();
  });

  it('gives the deck size on a curated theme', () => {
    renderGallery(
      game({
        lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5, curatedThemeId: 'a-theme' },
        deck: [card('undealt', 1800)],
      } as Partial<WhenGameState>)
    );
    // Three placed and two missed of a deck with one card still undealt.
    expect(screen.getByText('of 6 events placed')).toBeInTheDocument();
  });

  it('says which game it was', () => {
    renderGallery(game());
    expect(screen.getByText('Custom game')).toBeInTheDocument();
  });
});

describe('multiplayer', () => {
  const sam = player(0, 'Sam', [true, true, true]);
  const priya = player(1, 'Priya', [false, false]);

  it('names the winner and lists every player, with no single score', () => {
    renderGallery(game({ players: [sam, priya], winners: [sam] }));
    expect(screen.getByRole('heading', { name: 'Sam Wins!' })).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.getByText('2 players')).toBeInTheDocument();
    expect(screen.queryByTestId('gallery-score')).not.toBeInTheDocument();
    // The grid is the shared timeline, so it is there as for any game.
    expect(tiles()).toHaveLength(6);
  });
});

describe('the daily', () => {
  const dailyResult = { date: '2026-11-11', correctCount: 3 } as DailyResult;
  const leaderboard: DailyLeaderboard = {
    entries: [],
    isLoading: false,
    rank: null,
    totalPlayers: null,
    playerEntry: null,
    truncated: false,
    submitted: false,
    loadError: null,
    unavailable: false,
    isSubmitting: false,
    submitError: null,
    suggestedName: 'Jittery Raven',
    submit: jest.fn(),
    refresh: jest.fn(),
  };

  it('carries the submit form, and offers no way past it while it is locked', () => {
    renderGallery(game({ gameMode: 'daily' }), { dailyResult, leaderboard, dismiss: 'locked' });
    expect(screen.getByRole('button', { name: 'Submit to Leaderboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toHaveValue('Jittery Raven');
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('has no leaderboard block on a game without one, and a Continue button', () => {
    const onDismiss = jest.fn();
    renderGallery(game(), { onDismiss });
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Continue' }).click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('still offers Continue when the board is unreachable', () => {
    const onDismiss = jest.fn();
    renderGallery(game(), { dismiss: 'backdrop', onDismiss });
    screen.getByRole('button', { name: 'Continue' }).click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
