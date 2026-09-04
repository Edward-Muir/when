import { GameHintKey, TabHintKey } from './playerStorage';

/**
 * The player-facing copy for every one-shot hint, in one place. The in-game hints are
 * re-findable in the How-to-Play modal; each tab's line is re-findable on the tab itself
 * (its subtitle says the same thing in fewer words). No em dashes (the same register the
 * share copy holds itself to).
 *
 * The in-game strip is a single line that never grows: on a 375px phone it holds about 36
 * characters of 14px text before clipping, so every `HINT_TEXT` entry stays under that.
 * Say less rather than let the pill wrap or scroll; the modal has the long version.
 */
export const HINT_TEXT: Record<GameHintKey, string> = {
  drag: 'Drag the card onto the timeline',
  wrong: 'Wrong. Grey shows where it belongs.',
  correct: 'Correct. You drew a new card.',
  tapCard: 'Tap any card to read about it',
  stats: 'Tap for game stats',
  swap: 'Swap to a different card',
};

export const TAB_HINT_TEXT: Record<TabHintKey, string> = {
  dailyTab: 'Tap the button above to play your first daily game.',
  archiveTab: 'Past daily decks, replayable from the day after they run. Beat your best on each.',
  customTab:
    'Build a deck from any eras, categories and difficulty. Wrong placements cost a card; the game ends when your hand is empty.',
  statsTab: 'Your records, daily scores and badges. Every finished game counts here.',
  timelineTab: 'Every event you place correctly is collected here. Tap the sliders to filter it.',
};

/** The in-game strip's text for the active hint, or null when nothing is showing. */
export function hintText(key: GameHintKey | null): string | null {
  // eslint-disable-next-line security/detect-object-injection -- union-typed key into a const map
  return key ? HINT_TEXT[key] : null;
}

export function tabHintText(key: TabHintKey): string {
  // eslint-disable-next-line security/detect-object-injection -- union-typed key into a const map
  return TAB_HINT_TEXT[key];
}
