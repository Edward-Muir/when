import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { useWhenGame } from './hooks/useWhenGame';
import { getPracticeProgress } from './utils/practiceProgress';
import { WhenGameState } from './types';
import { ChallengeConfig } from './utils/challengeCode';
import { buildDailyDeck } from './utils/dailyConfig';

// `App` is driven here only for its routing rule: which URL resumes the saved practice game,
// and that every way home drops it. The game itself is useWhenGame's, tested on its own.
jest.mock('./hooks/useWhenGame', () => ({ useWhenGame: jest.fn() }));
jest.mock('./hooks/useImagePrefetch', () => ({ useImagePrefetch: jest.fn() }));
jest.mock('./utils/dailyConfig', () => ({
  ...jest.requireActual('./utils/dailyConfig'),
  buildDailyDeck: jest.fn(),
}));
jest.mock('./components/ModeSelect', () => ({
  __esModule: true,
  default: () => <div>Home</div>,
}));
jest.mock('./components/GameStartTransition', () => ({
  __esModule: true,
  default: () => <div>Dealing</div>,
}));
jest.mock('./components/Game', () => ({
  __esModule: true,
  default: ({ onNewGame }: { onNewGame: () => void }) => <button onClick={onNewGame}>Leave</button>,
}));

const KEY = 'when-practice-progress';
const SAVED = JSON.stringify({
  config: { mode: 'suddenDeath', challengeCode: 'saved-code' },
  phase: 'playing',
  seedEventName: 'seed',
  timeline: ['seed'],
  hand: [],
  failed: [],
  placementHistory: [],
});

function mockGame(phase: WhenGameState['phase']) {
  const hook = {
    state: { phase, players: [], timeline: [] } as unknown as WhenGameState,
    allEvents: [],
    startGame: jest.fn(),
    resumePracticeGame: jest.fn(() => false),
    resetGame: jest.fn(),
    completeTransition: jest.fn(),
    placeCard: jest.fn(),
    cycleHand: jest.fn(),
    restartGame: jest.fn(),
    gameKey: 0,
    enterReview: jest.fn(),
    pendingPopup: null,
    showDescriptionPopup: jest.fn(),
    showGameOverPopup: jest.fn(),
    dismissPopup: jest.fn(),
    newlyUnlockedAchievements: [],
    gameMilestones: [],
  };
  (useWhenGame as jest.Mock).mockReturnValue(hook);
  return hook;
}

const renderApp = (props: React.ComponentProps<typeof App> = {}) =>
  render(
    <MemoryRouter>
      <App {...props} />
    </MemoryRouter>
  );

beforeEach(() => {
  (buildDailyDeck as jest.Mock).mockReturnValue([]);
  localStorage.clear();
  localStorage.setItem(KEY, SAVED);
});

describe('App and the saved practice game', () => {
  it('a home path tries the saved game once, whatever the tab', () => {
    const hook = mockGame('modeSelect');
    const { rerender } = renderApp({ initialTab: 'custom' });
    rerender(
      <MemoryRouter>
        <App initialTab="custom" />
      </MemoryRouter>
    );
    expect(hook.resumePracticeGame).toHaveBeenCalledTimes(1);
    expect(hook.resumePracticeGame).toHaveBeenCalledWith();
  });

  it('waits for the catalogue before trying', () => {
    const hook = mockGame('loading');
    renderApp();
    expect(hook.resumePracticeGame).not.toHaveBeenCalled();
  });

  it('/daily starts the Daily and drops the saved game', () => {
    const hook = mockGame('modeSelect');
    renderApp({ autoStartDaily: true });
    expect(hook.resumePracticeGame).not.toHaveBeenCalled();
    expect(hook.startGame).toHaveBeenCalledWith(expect.objectContaining({ mode: 'daily' }));
    expect(getPracticeProgress()).toBeNull();
  });

  it('a challenge link resumes its own save rather than dealing again', () => {
    const hook = mockGame('modeSelect');
    hook.resumePracticeGame.mockReturnValue(true);
    renderApp({
      autoStartChallenge: { handSize: 5 } as unknown as ChallengeConfig,
      challengeCode: 'saved-code',
    });
    expect(hook.resumePracticeGame).toHaveBeenCalledWith('saved-code');
    expect(hook.startGame).not.toHaveBeenCalled();
  });

  it('Leave drops the save', () => {
    mockGame('playing');
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
