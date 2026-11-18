import React from 'react';
import { Home } from 'lucide-react';

interface GameHudProps {
  onHome: () => void;
  /** The deck's theme, when it has one. A Custom game has none and shows the wordmark alone. */
  theme?: string;
}

/**
 * All the chrome a game has: the wordmark with the theme named under it in the top-left
 * corner, Home in the top-right. Both float over the board, so neither costs the timeline any
 * height, and the board shows through everywhere else: there is no band or wash across the
 * top. There is no top bar and no menu in a game; those are on Home.
 *
 * The wordmark and label are bare text, so they sit on `hud-mark` (index.css), a patch of the
 * page colour with a soft edge, only as big as they are. It lies over the year gutter, which
 * is where a scrolling year would otherwise run through the text; the cards start to its
 * right. A wash across the whole width was tried and gave back the height the top bar's
 * removal had won.
 *
 * Home is a boxed button, the same one as the top bar's on Home: a bare icon was tried and
 * did not read as something to press.
 *
 * The strip is at z-[34]: above the board's scrims (z-30), below the hint strip (z-[35]) and
 * the hand bar (z-40). It ignores the pointer everywhere but the Home button, so a drag or a
 * scroll that starts on the wordmark still reaches the board. The wordmark is not a button: a
 * second control labelled "Go home" was desktop issue D1.
 *
 * A component of its own because `Game` sits on ESLint's complexity ceiling.
 */
const GameHud: React.FC<GameHudProps> = ({ onHome, theme }) => (
  <div className="absolute top-0 inset-x-0 z-[34] pointer-events-none flex items-start justify-between gap-2">
    {/* The `min()` keeps the patch clear of the board's centred "↑ Earlier" label down to a
        320px screen, and is the narrowest there that holds "ARCHITECTURE" on one line. */}
    <div className="hud-mark flex max-w-[min(10.5rem,calc(50%-34px))] flex-col items-start gap-[5px] pb-1.5 pl-3 pr-1 pt-1.5">
      <h1 className="font-display text-xl font-semibold leading-none text-text">
        When<span className="text-accent">?</span>
      </h1>
      {theme && (
        <div className="flex items-start gap-1.5" title={theme}>
          <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 bg-accent" />
          {/* Curated names run to 20 characters ("Crowns & Coronations") and daily pairings to
              46 ("Architecture in the Middle East & North Africa"). It wraps rather than
              truncating, because a pairing's place comes last and is the part a single line
              cut off; three lines hold the longest at 402px. The full name is on the Daily
              hero card either way. Weight 400 because that is the only DM Mono the app loads. */}
          <span className="line-clamp-3 font-mono text-[11px] uppercase leading-[14px] tracking-[0.12em] text-text-muted [overflow-wrap:anywhere]">
            {theme}
          </span>
        </div>
      )}
    </div>
    <button
      onClick={onHome}
      aria-label="Go home"
      className="pointer-events-auto mr-2 mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface shadow-sm transition-colors hover:bg-border active:scale-95"
    >
      <Home className="h-5 w-5 text-text" />
    </button>
  </div>
);

export default GameHud;
