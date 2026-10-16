import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Leaderboard from './Leaderboard';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { DailyLeaderboard } from '../hooks/useDailyLeaderboard';

// jsdom implements neither of these. Stubbed here rather than in setupTests.ts so the rest of
// the suite keeps running against the real (absent) environment.
//
// `beforeEach`, not `beforeAll`: CRA's Jest config sets `resetMocks: true`, which strips the
// implementation off every mock between tests — so a one-time stub returns undefined from the
// second test onwards.
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
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
});

const BOARD_SIZE = 45;

const makeEntries = (count: number): LeaderboardEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    displayName: `Player ${i + 1}`,
    correctCount: Math.max(0, 25 - i),
    rank: i + 1,
  }));

const renderBoard = (props: Partial<React.ComponentProps<typeof Leaderboard>> = {}) => {
  const onClose = jest.fn();
  const entries = props.entries ?? makeEntries(BOARD_SIZE);
  render(
    <Leaderboard
      isOpen
      onClose={onClose}
      entries={entries}
      totalPlayers={entries.length}
      playerRank={null}
      playerEntry={null}
      {...props}
    />
  );
  return { onClose, entries };
};

describe('Leaderboard', () => {
  it('renders every entry on the board, not just the podium', () => {
    renderBoard();

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText(`Player ${BOARD_SIZE}`)).toBeInTheDocument();
    expect(screen.getByText('Player 23')).toBeInTheDocument();
  });

  // If the whole card carried onClick={onClose} alongside the backdrop, any tap inside it would
  // dismiss the board. Invisible at five rows; unusable once the list scrolls.
  it('does not close when a row inside the sheet is clicked', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByText('Player 7'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('still closes when the backdrop behind the sheet is clicked', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on the close button', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByLabelText('Close leaderboard'));

    expect(onClose).toHaveBeenCalled();
  });

  describe('portraits', () => {
    it('gives every row a portrait, from the pick when there is one and the name otherwise', () => {
      const entries: LeaderboardEntry[] = [
        { displayName: 'Brave Otter', correctCount: 9, rank: 1 },
        { displayName: 'Linguistic Platypus', correctCount: 8, rank: 2, avatar: 'koala' },
        { displayName: 'Swift Hawk', correctCount: 7, rank: 3, avatar: 'unicorn' },
      ];
      renderBoard({ entries });

      const animals = screen.getAllByTestId('portrait').map((p) => p.dataset.animal);
      expect(animals).toEqual(['otter', 'koala', 'hawk']);
    });

    it('frames the podium instead of showing medal emoji', () => {
      renderBoard();
      const frames = screen.getAllByTestId('portrait').map((p) => p.dataset.frame);
      expect(frames.slice(0, 3).every(Boolean)).toBe(true);
      expect(new Set(frames.slice(0, 3)).size).toBe(3);
      expect(frames.slice(3).some(Boolean)).toBe(false);
      expect(screen.queryByText('🥇')).toBeNull();
    });

    it('numbers, frames and sizes tied scores alike', () => {
      const scores = [11, 9, 7, 7, 7, 4];
      const entries = scores.map((correctCount, i) => ({
        displayName: `Player ${i + 1}`,
        correctCount,
        rank: i + 1,
      }));
      renderBoard({ entries });

      const portraits = screen.getAllByTestId('portrait');
      const frames = portraits.map((p) => p.dataset.frame);
      const sizes = portraits.map((p) => p.dataset.size);
      expect(new Set(frames.slice(2, 5)).size).toBe(1);
      expect(frames[2]).toBeTruthy();
      expect(frames[5]).toBeUndefined();
      expect(sizes).toEqual(['60', '52', '48', '48', '48', '44']);
      // Competition ranking: the three tied on 7 are all third, and the next row is sixth.
      expect(screen.getAllByText('3', { exact: true })).toHaveLength(3);
      expect(screen.getByText('4', { exact: true })).toBeInTheDocument(); // the score, not a rank
      expect(screen.queryByText('5', { exact: true })).toBeNull();
      expect(screen.getByText('6', { exact: true })).toBeInTheDocument();
    });

    it('steps the podium portraits down in size from first place', () => {
      renderBoard();
      const sizes = screen.getAllByTestId('portrait').map((p) => p.dataset.size);
      expect(sizes.slice(0, 4)).toEqual(['60', '52', '48', '44']);
      expect(new Set(sizes.slice(3))).toEqual(new Set(['44']));
    });

    it('shows the player’s current pick on their own row, not the one stored with the score', () => {
      localStorage.setItem('when-avatar', 'panda');
      const entries: LeaderboardEntry[] = [
        { displayName: 'Brave Otter', correctCount: 9, rank: 1 },
        { displayName: 'Me Platypus', correctCount: 8, rank: 2, avatar: 'platypus' },
      ];
      renderBoard({ entries, playerRank: 2, playerEntry: entries[1] as LeaderboardEntry });

      const own = screen.getByRole('button', { name: /your rank/i });
      expect(within(own).getByTestId('portrait').dataset.animal).toBe('panda');
      localStorage.clear();
    });
  });

  describe('the player’s own row', () => {
    const entries = makeEntries(BOARD_SIZE);
    const playerEntry = entries[19] as LeaderboardEntry;

    it('appears exactly once — pinned in place, never duplicated', () => {
      renderBoard({ entries, playerRank: playerEntry.rank, playerEntry });

      expect(screen.getAllByText(playerEntry.displayName)).toHaveLength(1);
    });

    it('is pinned to both edges of the scroll area so it stays on screen', () => {
      renderBoard({ entries, playerRank: playerEntry.rank, playerEntry });

      const row = screen.getByRole('button', { name: /your rank/i });
      expect(row.className).toContain('sticky');
      expect(row.className).toContain('top-0');
      expect(row.className).toContain('bottom-0');
      // A translucent sticky row shows the list scrolling underneath it.
      expect(row.className).toContain('bg-player-row');
    });

    it('scrolls back to the player’s position when the pinned row is tapped', () => {
      renderBoard({ entries, playerRank: playerEntry.rank, playerEntry });

      userEvent.click(screen.getByRole('button', { name: /your rank/i }));

      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('pins a separate row outside the list when the player ranks below the served slice', () => {
      const playerBelowCut: LeaderboardEntry = {
        displayName: 'Late Finisher',
        correctCount: 3,
        rank: 312,
      };
      // Distinct scores, all above the player's: a real capped slice, so the player is not tied
      // with anyone shown and keeps the server's rank.
      const served = entries.map((e) => ({ ...e, correctCount: 100 - e.rank }));
      renderBoard({
        entries: served,
        playerRank: playerBelowCut.rank,
        playerEntry: playerBelowCut,
        totalPlayers: 312,
        truncated: true,
      });

      expect(screen.getByText('Late Finisher')).toBeInTheDocument();
      expect(screen.getByText('312')).toBeInTheDocument();
      // It sits outside the scrolling list, so it cannot also be a sticky row.
      const list = screen.getByTestId('leaderboard-list');
      expect(within(list).queryByText('Late Finisher')).not.toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('shows a skeleton tall enough to hold the loaded card’s height', () => {
      render(
        <Leaderboard
          isOpen
          onClose={jest.fn()}
          entries={[]}
          totalPlayers={0}
          playerRank={null}
          playerEntry={null}
          isLoading
        />
      );

      // The card is sized by its content up to max-h, so too few skeleton rows means it
      // visibly snaps taller when a full board lands.
      expect(screen.getAllByTestId('leaderboard-skeleton-row')).toHaveLength(8);
      expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument();
    });

    it('shows the empty state when nobody has played', () => {
      renderBoard({ entries: [], totalPlayers: 0 });

      expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
    });

    it('surfaces a load error in place of the list', () => {
      renderBoard({ entries: [], error: 'Failed to load leaderboard' });

      expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument();
    });

    it('reports the day’s player count', () => {
      renderBoard();

      expect(screen.getByText(/45 players today/i)).toBeInTheDocument();
    });

    // `totalPlayers` is a true count while the list is capped, so the board must not imply it
    // is showing everyone.
    it('says so when the board is only a slice of the day', () => {
      renderBoard({ totalPlayers: 900, truncated: true });

      expect(screen.getByText(/showing 45 of 900 players today/i)).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
      const { container } = render(
        <Leaderboard
          isOpen={false}
          onClose={jest.fn()}
          entries={makeEntries(5)}
          totalPlayers={5}
          playerRank={null}
          playerEntry={null}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  // The board is the only route back to submitting once the game-over popup is dismissed, so a
  // score that failed to submit there is stranded without this.
  describe('claiming a score', () => {
    const makeSubmit = (over: Partial<DailyLeaderboard> = {}): DailyLeaderboard =>
      ({
        submitted: false,
        isSubmitting: false,
        submitError: null,
        suggestedName: 'Jade Dragon',
        submit: jest.fn(),
        ...over,
      }) as unknown as DailyLeaderboard;

    it('offers the form when the score is not on the board', () => {
      renderBoard({ submit: makeSubmit() });

      expect(screen.getByPlaceholderText(/your name/i)).toHaveValue('Jade Dragon');
      expect(screen.getByRole('button', { name: /submit to leaderboard/i })).toBeInTheDocument();
    });

    it('submits the typed name with the avatar the form shows', async () => {
      const submit = jest.fn();
      renderBoard({ submit: makeSubmit({ submit }) });

      const input = screen.getByPlaceholderText(/your name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'Brave Otter');
      await userEvent.click(screen.getByRole('button', { name: /submit to leaderboard/i }));

      // No pick saved, so the avatar follows the name as typed.
      expect(submit).toHaveBeenCalledWith('Brave Otter', 'otter');
    });

    // A first-time player claims their first score before ever opening the menu.
    it('opens the avatar picker from the portrait, and the pick is sent with the score', async () => {
      localStorage.clear();
      const submit = jest.fn();
      renderBoard({ submit: makeSubmit({ submit }) });

      const input = screen.getByPlaceholderText(/your name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'Brave Otter');
      await userEvent.click(screen.getByRole('button', { name: /choose your avatar/i }));

      // Until a first pick, the picker follows the name as typed, not the saved one.
      const grid = screen.getByRole('radiogroup', { name: /portrait/i });
      expect(within(grid).getByRole('radio', { name: 'Otter' })).toHaveAttribute(
        'aria-checked',
        'true'
      );

      await userEvent.click(within(grid).getByRole('radio', { name: 'Koala' }));
      await userEvent.click(screen.getByRole('button', { name: /^done$/i }));
      expect(localStorage.getItem('when-avatar')).toBe('koala');

      await userEvent.click(screen.getByRole('button', { name: /submit to leaderboard/i }));
      expect(submit).toHaveBeenCalledWith('Brave Otter', 'koala');
    });

    it('drops the form once the score is on the board', () => {
      renderBoard({ submit: makeSubmit({ submitted: true }) });

      expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
    });

    it('shows no form when the board is not carrying a score to claim', () => {
      renderBoard();

      expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
    });

    // "Try again later" sent players back to a button that could never work for this score.
    it('says a rejected score cannot be verified, rather than inviting a retry', () => {
      renderBoard({ submit: makeSubmit({ submitError: 'Invalid emoji grid or counts' }) });

      expect(screen.getByText(/couldn’t be verified|couldn't be verified/i)).toBeInTheDocument();
      expect(screen.queryByText(/try again later/i)).not.toBeInTheDocument();
    });

    it('still invites a retry after a network failure', () => {
      renderBoard({ submit: makeSubmit({ submitError: 'Failed to fetch' }) });

      expect(screen.getByText(/try again later/i)).toBeInTheDocument();
    });
  });
});
