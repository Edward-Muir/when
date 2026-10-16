import React from 'react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalColor, podiumPlaces, resolvePlayerRow } from '../utils/leaderboardUtils';
import { resolveAvatar } from '../utils/avatar';
import { FIELD_PORTRAIT, PAINTED_AT } from './leaderboardLayout';
import Portrait, { SIZE_CLASSES } from './ui/Portrait';
import OwnPortrait from './ui/OwnPortrait';

interface TodaysLongestProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  playerEntry: LeaderboardEntry | null;
  playerRank: number | null;
  onOpenFull: () => void;
}

/**
 * Place, portrait, name, score. Every tile is the full board's field size, cropped close the
 * same way (painted at first place's size), with the podium framed in gold, silver and bronze;
 * tied scores share a place and so a frame (`podiumPlaces`). `own` rows show the player's
 * current pick, as on the board.
 */
const Row: React.FC<{
  entry: LeaderboardEntry;
  place: number;
  own: boolean;
  name?: string;
  highlight?: boolean;
}> = ({ entry, place, own, name = entry.displayName, highlight = false }) => {
  const portrait = { size: FIELD_PORTRAIT, frame: getMedalColor(place), paintedAt: PAINTED_AT };
  return (
    <div className={`flex items-center gap-2 text-sm ${highlight ? 'text-accent' : ''}`}>
      <span
        className={`w-6 text-center flex-shrink-0 font-body ${
          highlight ? 'text-accent font-semibold' : 'text-text-muted'
        }`}
      >
        {place}
      </span>
      {own ? (
        <OwnPortrait {...portrait} />
      ) : (
        <Portrait animal={resolveAvatar(entry)} {...portrait} />
      )}
      <span
        className={`flex-1 text-left truncate font-body ${
          highlight ? 'text-accent font-semibold' : 'text-text'
        }`}
      >
        {name}
      </span>
      <span className="font-body text-accent font-semibold flex-shrink-0">
        {entry.correctCount}
      </span>
    </div>
  );
};

/**
 * "Today's Longest" leaderboard for the Daily page: top 3 entries plus a highlighted
 * "You" row when the player is outside the top 3. Tappable to open the full leaderboard.
 */
const TodaysLongest: React.FC<TodaysLongestProps> = ({
  entries,
  isLoading,
  playerEntry,
  playerRank,
  onOpenFull,
}) => {
  const top3 = entries.slice(0, 3);
  const { row: playerRow, inList } = resolvePlayerRow(top3, playerRank, playerEntry);
  const showYouRow = playerRow !== null && !inList;
  // Tied scores share a number and a frame, as on the full board (`podiumPlaces`).
  const placeOf = podiumPlaces(entries);

  return (
    <button
      onClick={onOpenFull}
      className="w-full text-left cursor-pointer rounded-xl hover:bg-surface/60 p-2 transition-colors"
    >
      <div className="text-xs font-body font-semibold uppercase tracking-[0.15em] text-text-muted mb-2 px-1">
        Longest Timelines
      </div>

      {!isLoading && top3.length === 0 ? (
        <div className="text-sm text-text-muted font-body text-center py-3">
          No entries yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1">
          {[0, 1, 2].map((i) => {
            const entry = !isLoading ? (top3.at(i) ?? null) : null;
            if (isLoading) {
              // The loaded row's shape, tile included, so the teaser does not jump when data lands.
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-5 bg-border rounded animate-pulse flex-shrink-0" />
                  <div
                    // eslint-disable-next-line security/detect-object-injection -- typed key into const map
                    className={`bg-border animate-pulse flex-shrink-0 ${SIZE_CLASSES[FIELD_PORTRAIT]}`}
                  />
                  <div
                    className="flex-1 h-5 bg-border rounded animate-pulse"
                    style={{ width: `${65 - i * 10}%` }}
                  />
                  <div className="w-6 h-5 bg-border rounded animate-pulse flex-shrink-0" />
                </div>
              );
            }
            return entry ? (
              <Row
                key={i}
                entry={entry}
                place={placeOf(entry)}
                own={playerRank !== null && playerRank === entry.rank}
              />
            ) : (
              <div key={i} className="h-11" />
            );
          })}

          {showYouRow && playerRow && (
            <>
              <div className="border-t border-border my-1" />
              <Row entry={playerRow} place={placeOf(playerRow)} own name="You" highlight />
            </>
          )}
        </div>
      )}
    </button>
  );
};

export default TodaysLongest;
