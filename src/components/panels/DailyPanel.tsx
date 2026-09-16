import React, { ReactNode } from 'react';
import { HistoricalEvent } from '../../types';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import DailyDeckPreview from '../DailyDeckPreview';
import TodaysLongest from '../TodaysLongest';
import HintStrip from '../HintStrip';
import { tabHintText } from '../../utils/hintCopy';

interface DailyPanelProps {
  /** Today's starting event, or null while the catalogue is still settling. */
  previewEvent: HistoricalEvent | null;
  themeName: string;
  /** Play / Share / Submit, built by the caller from today's result. */
  cta: ReactNode;
  /** The tab's first-visit strip, which takes the leaderboard's slot while it is up. */
  hint: { show: boolean; dismiss: () => void };
  leaderboard: LeaderboardEntry[];
  isLeaderboardLoading: boolean;
  playerEntry: LeaderboardEntry | null;
  playerRank: number | null;
  onOpenLeaderboard: () => void;
  onReadMore: () => void;
}

/** The Daily page of the home pager: the title, the hero card, and today's top scores. */
const DailyPanel: React.FC<DailyPanelProps> = ({
  previewEvent,
  themeName,
  cta,
  hint,
  leaderboard,
  isLeaderboardLoading,
  playerEntry,
  playerRank,
  onOpenLeaderboard,
  onReadMore,
}) => (
  <div className="mx-auto flex w-full max-w-sm flex-col flex-1 min-h-0 px-3">
    <div className="text-left mb-3">
      <h1 className="text-5xl font-bold text-text font-display leading-none">
        When<span className="text-accent">?</span>
      </h1>
      <p className="text-text-muted text-sm mt-1 font-body">
        Drag events into place, build the longest timeline
      </p>
    </div>

    <DailyDeckPreview
      event={previewEvent}
      themeName={themeName}
      cta={cta}
      className="flex-1 min-h-0"
      onInfoClick={onReadMore}
    />

    <div className="mt-3 flex-shrink-0">
      {hint.show ? (
        <HintStrip text={tabHintText('dailyTab')} onDismiss={hint.dismiss} />
      ) : (
        <TodaysLongest
          entries={leaderboard}
          isLoading={isLeaderboardLoading}
          playerEntry={playerEntry}
          playerRank={playerRank}
          onOpenFull={onOpenLeaderboard}
        />
      )}
    </div>
  </div>
);

export default DailyPanel;
