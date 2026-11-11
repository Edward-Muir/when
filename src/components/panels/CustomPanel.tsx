import React, { useEffect, useState } from 'react';
import CustomGameSettings from '../CustomGameSettings';
import HintStrip from '../HintStrip';
import QuickDecks from '../QuickDecks';
import { HistoricalEvent } from '../../types';
import { DeckSettings } from '../../utils/customDeck';
import { tabHintText } from '../../utils/hintCopy';
import { TAB_HINT_MOUNT_DELAY_MS, useTabHint } from '../../hooks/useTabHint';

type CustomPanelProps = React.ComponentProps<typeof CustomGameSettings> & {
  /** Whether this panel is the visible pager tab (see `TimelinePanel`). */
  active: boolean;
  allEvents: HistoricalEvent[];
  /** A Quick deck tile's tap: start that deck now. */
  onQuickDeck: (settings: DeckSettings) => void;
};

/**
 * True once the tab has rested on screen, and for good after. The pager pre-mounts this panel
 * for every visitor, so the Quick deck paintings wait for it; the settle delay keeps a tap from
 * Daily to Stats, which scrolls across Custom, from fetching them on the way past.
 */
function useShownOnce(active: boolean): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active || shown) return;
    const timer = window.setTimeout(() => setShown(true), TAB_HINT_MOUNT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, shown]);
  return shown;
}

/**
 * Custom tab: the page heading (in the same recipe as the Daily, Archive and Settings tabs),
 * the first-visit strip, the Quick decks and the filter rows. The settings state stays in
 * `ModeSelect`, which also builds the game from it; this panel is layout.
 */
const CustomPanel: React.FC<CustomPanelProps> = ({
  active,
  allEvents,
  onQuickDeck,
  ...settings
}) => {
  const hint = useTabHint('customTab', active);
  const shown = useShownOnce(active);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col flex-1 min-h-0 px-3">
      <div className="text-left mb-2">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Custom</h1>
        <p className="text-text-muted text-sm mt-0.5 font-body">Pick a deck, or build your own</p>
        <HintStrip text={hint.show ? tabHintText('customTab') : null} onDismiss={hint.dismiss} />
      </div>

      <CustomGameSettings
        {...settings}
        top={<QuickDecks allEvents={allEvents} onStart={onQuickDeck} showArt={shown} />}
      />
    </div>
  );
};

export default CustomPanel;
