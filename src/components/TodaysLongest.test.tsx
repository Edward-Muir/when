import React from 'react';
import { render, screen } from '@testing-library/react';
import TodaysLongest from './TodaysLongest';
import { LeaderboardEntry } from '../hooks/useLeaderboard';

const NAMES = ['Brave Otter', 'Swift Hawk', 'Jolly Penguin', 'Quiet Fox', 'Sly Raven'];
const board = (scores: number[]): LeaderboardEntry[] =>
  scores.map((correctCount, i) => ({ displayName: NAMES.at(i) ?? '', correctCount, rank: i + 1 }));

const renderTeaser = (
  entries: LeaderboardEntry[],
  player: { rank: number; entry: LeaderboardEntry } | null = null
) =>
  render(
    <TodaysLongest
      entries={entries}
      isLoading={false}
      playerEntry={player?.entry ?? null}
      playerRank={player?.rank ?? null}
      onOpenFull={jest.fn()}
    />
  );

describe('TodaysLongest portraits', () => {
  afterEach(() => localStorage.clear());

  it('gives each row a field-size portrait from its pick, else its name', () => {
    const entries = board([9, 8, 7]);
    entries[1] = { ...(entries[1] as LeaderboardEntry), avatar: 'koala' };
    renderTeaser(entries);

    const portraits = screen.getAllByTestId('portrait');
    expect(portraits.map((p) => p.dataset.animal)).toEqual(['otter', 'koala', 'penguin']);
    expect(portraits.map((p) => p.dataset.size)).toEqual(['44', '44', '44']);
  });

  it('crops every tile close, like the board below the podium', () => {
    renderTeaser(board([9, 8, 7]));
    for (const art of screen.getAllByRole('presentation', { hidden: true })) {
      expect(art).toHaveStyle({ transform: `scale(${60 / 44})` });
    }
  });

  it('frames the podium, and tied scores share a place and a frame', () => {
    renderTeaser(board([11, 9, 9]));

    const frames = screen.getAllByTestId('portrait').map((p) => p.dataset.frame);
    expect(frames[0]).toBeTruthy();
    expect(frames[1]).toBeTruthy();
    expect(frames[2]).toBe(frames[1]);
    expect(frames[0]).not.toBe(frames[1]);
    expect(screen.getAllByText('2', { exact: true })).toHaveLength(2);
    expect(screen.queryByText('3', { exact: true })).toBeNull();
  });

  it('shows the player’s current pick on the You row, unframed off the podium', () => {
    localStorage.setItem('when-avatar', 'panda');
    const entries = board([9, 8, 7, 6, 5]);
    const me: LeaderboardEntry = { displayName: 'Me Platypus', correctCount: 2, rank: 7 };
    renderTeaser(entries, { rank: 7, entry: { ...me, avatar: 'goldfish' } });

    expect(screen.getByText('You')).toBeInTheDocument();
    const you = screen.getAllByTestId('portrait').at(-1) as HTMLElement;
    expect(you.dataset.animal).toBe('panda');
    expect(you.dataset.frame).toBeUndefined();
  });
});
