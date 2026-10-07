import { GameConfig, HistoricalEvent, ALL_CATEGORIES, DEFAULT_DIFFICULTIES } from '../types';
import { ALL_ERAS } from './eras';
import { CuratedTheme } from './curatedThemes';
import { buildCuratedPool } from './dailyPool';
import { buildRampedDeck } from './deckBuilder';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { getDailyTheme } from './dailyTheme';
import { generateChallengeSeed } from './challengeCode';
import { minDeckSize } from './gameLogic';

/**
 * Replaying a curated theme after its day: a gold-bordered day in the Archive, which
 * `dailyReplay.ts` turns into this replay plus the day's date.
 *
 * A replay is deliberately a `suddenDeath` game, not a `daily` with an old seed. Everything
 * keyed on `gameMode === 'daily'` / `dailySeed` — the single stored daily result, the daily
 * cadence streak, the leaderboard warm and submit, the reminder — would otherwise fire for a
 * date that is not today, and the first of those would overwrite today's result with
 * yesterday's. `curatedThemeId` on the config is what routes the deck to the theme's pool.
 *
 * The deck is reshuffled on every replay (fresh seed, whole theme, no seven-day exclusion),
 * so beating a personal best stays a placement test rather than a memory test. The pool
 * still goes through `buildRampedDeck` with `bandSpread: 1`, the curated-day escape hatch —
 * without it a pool this size deals its hardest quartile into the opening hand almost every
 * time (see BuildRampedDeckOptions). Because replays recur, the same handful of band-0
 * footholds will open most of them; accepted, since the alternative is the pathological
 * opening the cap was measured to produce on small pools.
 */

/** Hand size for a replay: the daily's, so a best here is comparable with the day's score. */
export const REPLAY_HAND_SIZE = DAILY_HAND_SIZE;

/**
 * Smallest resolved pool a replay can be dealt from: `startGame`'s guard for one player and
 * the replay hand. A
 * stored theme is at least 16 slugs, but slugs whose events lost their art resolve to
 * nothing, so the pool is checked rather than the theme.
 */
export const REPLAY_MIN_POOL = minDeckSize(1, REPLAY_HAND_SIZE);

/**
 * The curated theme a finished (or running) game belongs to, if any: an Archive replay names
 * it on the config, a daily on a curated day resolves it from the date, and so does a past
 * day played from the Archive (`dailyReplayDate`). Undefined for an ordinary day or a Custom
 * game. The one place the "is this game a curated theme" question
 * is answered, for the cleared end state, the theme best and the TopBar pill alike.
 */
export function getCuratedThemeIdForConfig(config: GameConfig | null): string | undefined {
  if (!config) return undefined;
  if (config.curatedThemeId) return config.curatedThemeId;
  const date = config.dailySeed ?? config.dailyReplayDate;
  if (!date) return undefined;
  const theme = getDailyTheme(date);
  return theme.type === 'curated' ? theme.curated.id : undefined;
}

/**
 * A new shuffle seed for a replay. Never empty: `buildRampedDeck` treats a missing seed as
 * "nothing to be deterministic about" and falls back to an unramped shuffle, silently
 * losing the difficulty ramp.
 */
export function freshReplaySeed(themeId: string): string {
  return `archive:${themeId}:${generateChallengeSeed()}`;
}

/** The same replay with a new seed — what Restart deals, so it reshuffles like a fresh play. */
export function withFreshReplaySeed(config: GameConfig): GameConfig {
  return { ...config, challengeSeed: freshReplaySeed(config.curatedThemeId ?? '') };
}

/**
 * The GameConfig for replaying a theme. The filter fields are informational only (the pool
 * is the theme, which no filter can express); the hand size is the daily's; no challenge
 * code, because a code cannot encode a curated pool.
 */
export function buildThemeReplayConfig(theme: CuratedTheme): GameConfig {
  return {
    mode: 'suddenDeath',
    selectedDifficulties: [...DEFAULT_DIFFICULTIES],
    selectedCategories: [...ALL_CATEGORIES],
    selectedEras: [...ALL_ERAS],
    curatedThemeId: theme.id,
    challengeSeed: freshReplaySeed(theme.id),
    playerCount: 1,
    playerNames: ['Player 1'],
    cardsPerHand: 7,
    suddenDeathHandSize: REPLAY_HAND_SIZE,
  };
}

/**
 * A replay deck in dealing order (index 0 is the starting timeline card). No `exclude` and
 * no `getDailyBuildOptions`: both are date-keyed daily concerns, and a replay has no date.
 */
export function buildThemeReplayDeck(
  allEvents: HistoricalEvent[],
  theme: CuratedTheme,
  seed: string | undefined
): HistoricalEvent[] {
  return buildRampedDeck(buildCuratedPool(allEvents, theme), seed, { allEvents, bandSpread: 1 });
}

/**
 * The card that fronts a theme in the Archive: the opening card of the theme's deck seeded
 * on its release date. Usually the card the player saw on the day, but not guaranteed —
 * that deck also applied the seven-day exclusion, and reproducing it means walking the
 * recency chain for every listed theme, a few hundred milliseconds on the main thread for
 * a list this size. `windowOnly` because only index 0 is read.
 */
export function getThemeSeedEvent(
  allEvents: HistoricalEvent[],
  theme: CuratedTheme,
  releaseDate: string
): HistoricalEvent | null {
  const pool = buildCuratedPool(allEvents, theme);
  return (
    buildRampedDeck(pool, releaseDate, { allEvents, bandSpread: 1, windowOnly: true })[0] ?? null
  );
}
