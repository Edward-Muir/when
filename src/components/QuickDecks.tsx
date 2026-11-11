import React, { useMemo, useState } from 'react';
import { HistoricalEvent } from '../types';
import { CUSTOM_PRESETS } from '../data/customPresets';
import { DeckSettings, deckPool } from '../utils/customDeck';
import { deckLabel } from '../utils/filterSummary';
import { getImageUrl } from '../utils/cloudinaryImage';
import { LastCustomDeck, getLastCustomDeck } from '../utils/playerStorage';
import { minDeckSize } from '../utils/gameLogic';

interface QuickDecksProps {
  allEvents: HistoricalEvent[];
  /** Start a game from these settings at once (`ModeSelect` builds the config). */
  onStart: (settings: DeckSettings) => void;
  /**
   * Render the paintings. False until the Custom tab has been on screen: the pager pre-mounts
   * this panel for every visitor, and its art must not be fetched for players who never open it.
   */
  showArt: boolean;
}

interface Tile {
  id: string;
  name: string;
  /** The line under the name: "6,423 events", or "Science · 225" for the last deck. */
  detail: string;
  eventName: string | null;
  settings: DeckSettings;
  playable: boolean;
}

const formatCount = (n: number) => n.toLocaleString();

function buildTiles(allEvents: HistoricalEvent[], last: LastCustomDeck | null): Tile[] {
  const tile = (
    id: string,
    name: string,
    settings: DeckSettings,
    eventName: string | null,
    detail: (count: string) => string
  ): Tile => {
    const count = deckPool(allEvents, settings).length;
    return {
      id,
      name,
      detail: detail(formatCount(count)),
      eventName,
      settings,
      playable: count >= minDeckSize(settings.playerCount, settings.suddenDeathHandSize),
    };
  };
  return [
    ...(last
      ? [
          tile('last', 'Last deck', last.settings, last.eventName, (n) =>
            [deckLabel(last.settings), n].join(' · ')
          ),
        ]
      : []),
    ...CUSTOM_PRESETS.map((p) => tile(p.id, p.name, p.settings, p.eventName, (n) => `${n} events`)),
  ];
}

/**
 * The Custom tab's Quick decks: a 2-column grid of 64px tiles above the filters, each one tap
 * from a game. The Last deck tile (hidden until one has been played from the Play button) then
 * the presets in `customPresets.ts`. Each tile shows one fixed painting at the `thumbnail`
 * rung, a name and the live count, so a preset never goes stale as the catalogue grows.
 */
const QuickDecks: React.FC<QuickDecksProps> = ({ allEvents, onStart, showArt }) => {
  // Read once per mount: Home mounts afresh after every game, which is the only time it changes.
  const [last] = useState(getLastCustomDeck);
  const tiles = useMemo(() => buildTiles(allEvents, last), [allEvents, last]);
  const artByName = useMemo(() => {
    const wanted = new Set(tiles.map((t) => t.eventName));
    return new Map(
      allEvents
        .filter((e) => wanted.has(e.name))
        .map((e) => [e.name, getImageUrl(e.image_url, 'thumbnail')])
    );
  }, [allEvents, tiles]);

  return (
    <section aria-labelledby="quick-decks-label" className="mb-1.5">
      <h2
        id="quick-decks-label"
        className="mb-1 text-xs font-medium uppercase leading-4 tracking-wide text-text-muted font-body"
      >
        Quick decks
      </h2>
      <div className="grid grid-cols-2 gap-1.5">
        {tiles.map((t) => {
          const art = t.eventName ? artByName.get(t.eventName) : undefined;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`quick-deck-${t.id}`}
              onClick={() => onStart(t.settings)}
              disabled={!t.playable}
              aria-label={`Play ${t.name}, ${t.detail}`}
              className="flex h-16 min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface pr-2 text-left font-body transition-transform active:scale-95 disabled:opacity-40"
            >
              {showArt && art ? (
                <img
                  src={art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 flex-shrink-0 object-cover"
                />
              ) : (
                <span className="h-16 w-16 flex-shrink-0 bg-border" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="line-clamp-2 text-[13px] font-semibold leading-tight text-text">
                  {t.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-text-muted">{t.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickDecks;
