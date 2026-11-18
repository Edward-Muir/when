import React from 'react';
import { Home } from 'lucide-react';

interface GameHudProps {
  onHome: () => void;
  /** The deck's theme, when it has one. A Custom game has none and shows the wordmark alone. */
  theme?: string;
}

// The floating strip's box, shared by the controls and by the wash that is sized from a copy
// of them, so the two cannot drift apart.
const STRIP = 'absolute top-0 inset-x-0 pointer-events-none pl-3 pr-2 pt-1';

/**
 * The wordmark with the theme named under it. Not a button: a second control labelled "Go
 * home" beside the Home icon was desktop issue D1.
 *
 * The `min()` keeps the block clear of the board's centred "↑ Earlier" label down to a 320px
 * screen, where 9.5rem would run under it.
 */
const HudMark: React.FC<{ theme?: string }> = ({ theme }) => (
  <div className="mt-0.5 flex max-w-[min(9.5rem,calc(50%-2.5rem))] flex-col items-start gap-[5px]">
    <h1 className="font-display text-xl font-semibold leading-none text-text">
      When<span className="text-accent">?</span>
    </h1>
    {theme && (
      <div className="flex items-start gap-1.5" title={theme}>
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 bg-accent" />
        {/* Curated names run to 20 characters ("Crowns & Coronations") and daily pairings to
            46 ("Architecture in the Middle East & North Africa"). It wraps rather than
            truncating, because a pairing's place comes last and is the part a single line cut
            off; three lines hold the longest at 402px. The full name is on the Daily hero card
            either way. Weight 400 because that is the only DM Mono the app loads. */}
        <span className="line-clamp-3 font-mono text-[11px] uppercase leading-[14px] tracking-[0.12em] text-text-muted [overflow-wrap:anywhere]">
          {theme}
        </span>
      </div>
    )}
  </div>
);

/**
 * All the chrome a game has: the wordmark with the theme named under it on the left, Home on
 * the right. Both float over the top of the board, so neither costs the timeline any height.
 * There is no top bar and no menu in a game; those are on Home.
 *
 * Nothing here has a box behind it: the wordmark and the label are bare text and Home is a
 * bare icon. That is only legible because of `hud-scrim` (index.css), a wash of the page
 * colour under them. The wash holds an invisible copy of the wordmark and label, which is
 * what makes it exactly as tall as they are: a pairing's name runs to three lines, and a
 * wash sized for one would leave the other two sitting on card art. It is at z-20, above the
 * scrolling cards (z-10) and below the board's own "↑ Earlier" label (z-30), which it would
 * otherwise paint over.
 *
 * The controls are at z-[34]: above the board's scrims, below the hint strip (z-[35]) and the
 * hand bar (z-40). The strip ignores the pointer everywhere but the Home button, so a drag or
 * a scroll that starts on the wordmark still reaches the board.
 *
 * A component of its own because `Game` sits on ESLint's complexity ceiling.
 */
const GameHud: React.FC<GameHudProps> = ({ onHome, theme }) => (
  <>
    <div aria-hidden className={`${STRIP} hud-scrim z-20`}>
      <div className="invisible">
        <HudMark theme={theme} />
      </div>
    </div>
    <div className={`${STRIP} z-[34] flex items-start justify-between gap-2`}>
      <HudMark theme={theme} />
      <button
        onClick={onHome}
        aria-label="Go home"
        className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text transition-transform active:scale-90"
      >
        <Home className="h-6 w-6" />
      </button>
    </div>
  </>
);

export default GameHud;
