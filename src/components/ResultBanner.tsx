import { Check, X, Trophy, Flag } from 'lucide-react';
import { GamePhase, GameMode, PlacementResult, Player } from '../types';
import { formatYear } from '../utils/gameLogic';

interface ResultBannerProps {
  phase: GamePhase;
  gameMode: GameMode | null;
  lastPlacementResult: PlacementResult | null;
  players: Player[];
  winners: Player[];
  placementHistory: boolean[];
  roundNumber: number;
}

function SuddenDeathLossBanner({ placementHistory }: { placementHistory: boolean[] }) {
  const correctCount = placementHistory.filter((p) => p).length;
  return (
    <div className="mt-3 p-3 rounded-xl border-2 animate-banner-in bg-error/15 border-error/50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-error text-white">
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-lg leading-none text-error">Game Over</span>
      </div>
      <div className="text-ui-caption text-text-muted mt-2">
        {correctCount} {correctCount === 1 ? 'event' : 'events'} placed
      </div>
    </div>
  );
}

function WinnerBanner({ winners }: { winners: Player[] }) {
  return (
    <div className="mt-3 p-3 rounded-xl border-2 animate-banner-in bg-success/15 border-success/50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-success text-white">
          <Trophy className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-lg leading-none text-success">
          {winners.length === 1 ? 'Winner!' : 'Winners!'}
        </span>
      </div>
      <div className="text-ui-caption text-text-muted mt-2">
        {winners.map((w) => w.name).join(', ')}
      </div>
    </div>
  );
}

function CompletionBanner({
  roundNumber,
  placementHistory,
}: {
  roundNumber: number;
  placementHistory: boolean[];
}) {
  const correctCount = placementHistory.filter((p) => p).length;
  return (
    <div className="mt-3 p-2 rounded-xl border-2 animate-banner-in bg-accent/15 border-accent/50">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-accent text-white">
          <Flag className="w-3 h-3" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-base leading-none text-accent">Complete!</span>
      </div>
      <div className="text-xs text-text-muted mt-1.5">
        {roundNumber} {roundNumber === 1 ? 'round' : 'rounds'} · {correctCount}/
        {placementHistory.length} correct
      </div>
    </div>
  );
}

function PlacementFeedbackBanner({ result }: { result: PlacementResult }) {
  const isSuccess = result.success;
  return (
    <div
      className={`mt-3 p-3 rounded-xl border-2 animate-banner-in ${
        isSuccess ? 'bg-success/15 border-success/50' : 'bg-error/15 border-error/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSuccess ? 'bg-success text-white' : 'bg-error text-white'
          }`}
        >
          {isSuccess ? (
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </div>
        <span
          className={`font-semibold text-lg leading-none ${
            isSuccess ? 'text-success' : 'text-error'
          }`}
        >
          {isSuccess ? 'Correct!' : 'Wrong!'}
        </span>
      </div>
      <div className="text-ui-caption text-text-muted mt-2">
        {result.event.friendly_name} ({formatYear(result.event.year)})
      </div>
    </div>
  );
}

const ResultBanner: React.FC<ResultBannerProps> = ({
  phase,
  gameMode,
  lastPlacementResult,
  players,
  winners,
  placementHistory,
  roundNumber,
}) => {
  if (phase === 'gameOver') {
    const isSinglePlayer = players.length === 1;
    const isSuddenDeath = gameMode === 'suddenDeath' || gameMode === 'daily';
    const hasWinners = winners.length > 0;

    if (isSuddenDeath && isSinglePlayer && !hasWinners) {
      return <SuddenDeathLossBanner placementHistory={placementHistory} />;
    }

    if (hasWinners && (players.length > 1 || isSuddenDeath)) {
      return <WinnerBanner winners={winners} />;
    }

    if (isSinglePlayer && !isSuddenDeath) {
      return <CompletionBanner roundNumber={roundNumber} placementHistory={placementHistory} />;
    }

    return null;
  }

  if (lastPlacementResult) {
    return <PlacementFeedbackBanner result={lastPlacementResult} />;
  }

  return null;
};

export default ResultBanner;
