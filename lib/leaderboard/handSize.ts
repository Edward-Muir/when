/**
 * Cards dealt at the start of a daily game.
 *
 * Duplicated from `cardsPerHand` in `src/utils/dailyConfig.ts` rather than imported, because
 * `api/tsconfig.json` is a separate project — the same reason `SUBMISSION_DEDUPE_TTL_SECONDS`
 * is duplicated in `dateWindow.ts`. If the daily's hand size ever changes, change it here too.
 *
 * The daily's hand size is fixed. Custom games let the player pick one (it acts as lives), but
 * those never reach the leaderboard, so this bound only has to describe the daily.
 *
 * This is the mistake count of nearly every completed daily: a wrong placement discards the
 * card without drawing a replacement, and the game ends when the hand empties. So mistakes
 * cannot rank or tie-break anything.
 *
 * "Nearly" because a correct placement only redraws while the deck has cards. On a pool
 * smaller than a full run — a curated theme, or a thin category like `sports` — the deck runs
 * dry and the hand drains without the player spending all five. Those games finish with fewer
 * mistakes, which is what the client calls a cleared theme.
 */
export const DAILY_HAND_SIZE = 5;
