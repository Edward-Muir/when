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
 * This is also the mistake count of every completed daily game: a wrong placement discards the
 * card without drawing a replacement, and the game ends when the hand empties. Mistakes are
 * therefore constant across players and cannot rank or tie-break anything.
 */
export const DAILY_HAND_SIZE = 5;
