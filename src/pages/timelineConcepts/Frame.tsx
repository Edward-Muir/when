import React from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import TopBar from '../../components/TopBar';
import { Plate, PlateVariant } from './Plate';
import type { GameSample } from './shared';

/*
 * The phone chrome around a concept, so a screenshot reads as the real app: the real
 * TopBar (its `fixed` is contained by the frame's transform), the My Timeline heading
 * for the tab view, and the logo bar + hand bar for the game view.
 */

const noop = () => {};

export const TabFrame: React.FC<{ placed: number; total: number; children: React.ReactNode }> = ({
  placed,
  total,
  children,
}) => (
  <div
    className="relative flex h-full w-full flex-col bg-bg pt-topbar-wide"
    style={{ transform: 'translateZ(0)' }}
  >
    <TopBar
      showHome
      showTitle={false}
      showStatsAchievements
      activeNav="timeline"
      onNavClick={noop}
      onHomeClick={noop}
    />
    <div className="mx-auto mb-3 w-full max-w-sm px-3 pt-4 text-left">
      <div className="flex items-start justify-between gap-2">
        <h1 className="font-display text-5xl font-bold leading-none text-text">My Timeline</h1>
        <button
          className="rounded-xl border border-border bg-surface p-2"
          aria-label="Filter timeline"
        >
          <SlidersHorizontal className="h-5 w-5 text-text" />
        </button>
      </div>
      <p className="mt-1 font-body text-sm text-text-muted">
        <span className="font-mono">{placed.toLocaleString()}</span> of{' '}
        <span className="font-mono">{total.toLocaleString()}</span> events placed
      </p>
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);

export const GameFrame: React.FC<{
  game: GameSample;
  variant: PlateVariant;
  children: React.ReactNode;
}> = ({ game, variant, children }) => (
  <div
    className="relative flex h-full w-full flex-col bg-bg pt-topbar"
    style={{ transform: 'translateZ(0)' }}
  >
    <TopBar showHome showTitle onHomeClick={noop} />
    <div className="min-h-0 flex-1">{children}</div>
    <div className="flex h-[120px] shrink-0 items-center border-t border-border bg-bg">
      <div className="flex w-24 shrink-0 flex-col items-center font-body text-text">
        <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-sm text-white">
          {game.handCount}
        </span>
        <span className="mt-1 text-sm">cards left</span>
      </div>
      <div className="relative flex-1 pl-4 pr-4">
        <div className="absolute inset-x-6 inset-y-0 translate-y-2 scale-x-95 rounded-2xl bg-surface opacity-70 ring-1 ring-border" />
        <div className="relative">
          <Plate event={game.hand} variant={variant} size="hand" />
          <button
            className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-sm"
            aria-label="Swap card"
          >
            <RefreshCw className="h-4 w-4 text-text" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
