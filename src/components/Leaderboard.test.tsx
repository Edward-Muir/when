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

  // The whole card used to carry onClick={onClose} alongside the backdrop, so any tap inside
  // it dismissed the board. Invisible at five rows; unusable once the list scrolls.
  it('does not close when a row inside the sheet is clicked', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByText('Player 7'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('still closes when the backdrop behind the sheet is clicked', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByTestId('leaderboard-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on the close button', () => {
    const { onClose } = renderBoard();

    userEvent.click(screen.getByLabelText('Close leaderboard'));

    expect(onClose).toHaveBeenCalled();
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
      renderBoard({
        entries,
        playerRank: playerBelowCut.rank,
        playerEntry: playerBelowCut,
        totalPlayers: 312,
        truncated: true,
      });

      expect(screen.getByText('Late Finisher')).toBeInTheDocument();
      expect(screen.getByText('#312')).toBeInTheDocument();
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

    it('submits the typed name', async () => {
      const submit = jest.fn();
      renderBoard({ submit: makeSubmit({ submit }) });

      const input = screen.getByPlaceholderText(/your name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'Ed');
      await userEvent.click(screen.getByRole('button', { name: /submit to leaderboard/i }));

      expect(submit).toHaveBeenCalledWith('Ed');
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
