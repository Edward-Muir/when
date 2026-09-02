import { GameConfig, HistoricalEvent, ALL_CATEGORIES, DEFAULT_DIFFICULTIES } from '../types';
import { ALL_ERAS } from './eras';
import { CuratedTheme } from './curatedThemes';
import { buildCuratedPool } from './dailyPool';
import { buildRampedDeck } from './deckBuilder';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { getDailyTheme } from './dailyTheme';
import { generateChallengeSeed } from './challengeCode';

/**
 * Replaying a curated theme after its day: the Archive tab.
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
 * Smallest resolved pool a replay can be dealt from. Mirrors `startGame`'s guard
 * (`playerCount * handSize + 1 + playerCount * 2`) for one player and the replay hand. A
 * stored theme is at least 16 slugs, but slugs whose events lost their art resolve to
 * nothing, so the pool is checked rather than the theme.
 */
export const REPLAY_MIN_POOL = 1 * REPLAY_HAND_SIZE + 1 + 1 * 2;

/** One row of the Archive list. */
export type ArchiveStatus =
  /** Ran on a past day; can be replayed. */
  | 'replayable'
  /** Running today — replayable from tomorrow. */
  | 'today'
  /** The next scheduled deck, teased but not yet playable. */
  | 'upcoming';

export interface ArchiveEntry {
  theme: CuratedTheme;
  /** The day the theme ran (earliest date on or before today), or will run for `upcoming`. */
  releaseDate: string;
  status: ArchiveStatus;
  /** Events the theme resolves to in the current catalogue. */
  cardCount: number;
}

/**
 * The curated theme a finished (or running) game belongs to, if any: an Archive replay names
 * it on the config, a daily on a curated day resolves it from the date. Undefined for an
 * ordinary daily or a Custom game. The one place the "is this game a curated theme" question
 * is answered, for the cleared end state, the theme best and the TopBar pill alike.
 */
export function getCuratedThemeIdForConfig(config: GameConfig | null): string | undefined {
  if (!config) return undefined;
  if (config.curatedThemeId) return config.curatedThemeId;
  if (!config.dailySeed) return undefined;
  const theme = getDailyTheme(config.dailySeed);
  return theme.type === 'curated' ? theme.curated.id : undefined;
}

/**
 * Themes the Archive shows, oldest first, given the player's local date.
 *
 * A theme is listed once its earliest date is today or earlier: strictly past dates are
 * replayable, today's is shown locked so the list never looks empty on the first curated day
 * and the "day after" rule is visible. Of the themes still to come, exactly one — the next
 * scheduled — closes the list as a locked teaser; the rest stay hidden so the calendar is not
 * laid bare. `YYYY-MM-DD` strings compare correctly as strings, so no date parsing is involved.
 */
export function getArchiveEntries(
  themes: CuratedTheme[],
  allEvents: HistoricalEvent[],
  today: string
): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  const cardCount = (theme: CuratedTheme) => buildCuratedPool(allEvents, theme).length;
  const listed = new Set<string>();
  for (const theme of themes) {
    const dates = [...(theme.dates ?? [])].filter((date) => date <= today).sort();
    const releaseDate = dates.at(0);
    if (!releaseDate) continue;
    listed.add(theme.id);
    entries.push({
      theme,
      releaseDate,
      status: releaseDate === today ? 'today' : 'replayable',
      cardCount: cardCount(theme),
    });
  }

  // The teaser: the nearest future date among themes not already on the list.
  let upcoming: { theme: CuratedTheme; date: string } | undefined;
  for (const theme of themes) {
    if (listed.has(theme.id)) continue;
    const date = [...(theme.dates ?? [])]
      .filter((d) => d > today)
      .sort()
      .at(0);
    if (date && (!upcoming || date < upcoming.date)) upcoming = { theme, date };
  }
  if (upcoming) {
    entries.push({
      theme: upcoming.theme,
      releaseDate: upcoming.date,
      status: 'upcoming',
      cardCount: cardCount(upcoming.theme),
    });
  }

  return entries.sort((a, b) =>
    a.releaseDate === b.releaseDate
      ? a.theme.id.localeCompare(b.theme.id)
      : a.releaseDate < b.releaseDate
        ? -1
        : 1
  );
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
    totalTurns: 7,
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
