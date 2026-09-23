/**
 * localStorage utilities for tracking player data:
 * - Daily game completion (Wordle-style play-once-per-day)
 * - One-shot onboarding hints
 */

import { Difficulty, Category, Era } from '../types';
import { getLocalDateString } from './puzzleDate';
import { readJson, readString, removeKeys, writeJson, writeString } from './storage';

// --- Daily Result Storage ---

export interface DailyResult {
  date: string; // YYYY-MM-DD
  theme: string; // Theme display name
  won: boolean;
  /**
   * The deck ran dry rather than the hand emptying on mistakes — the player got through the
   * whole theme. Separate from `won`, which single-player never sets, rather than a reuse of
   * it: repurposing would make every previously stored result read as cleared.
   */
  cleared?: boolean;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string; // For display
  bestStreak?: number; // Best consecutive correct placements
  // Leaderboard data (populated after submission)
  leaderboardRank?: number;
  leaderboardTotalPlayers?: number;
}

const DAILY_RESULT_KEY = 'when-daily-result';

/**
 * Save the daily game result to localStorage
 */
export function saveDailyResult(result: DailyResult): void {
  writeJson(DAILY_RESULT_KEY, result, 'daily result');
}

/**
 * Get today's daily result if it exists
 * Returns null if no result for today or if date doesn't match
 */
export function getTodayResult(): DailyResult | null {
  const result = readJson<DailyResult | null>(DAILY_RESULT_KEY, null);
  // Only return if the stored result is for today
  return result?.date === getLocalDateString() ? result : null;
}

/**
 * Check if the daily game has been played today
 */
export function hasPlayedToday(): boolean {
  return getTodayResult() !== null;
}

// --- Onboarding Hints Storage ---

/**
 * Every one-shot hint in the app, in one object under `when-hints-seen`: the game hints are
 * the in-game strips (`useOnboardingHints`); the tab hints are the strips a home tab shows in
 * its own slot (`useTabHint`). Most of those are first-visit hints, one per tab; `reviewEye`
 * is keyed to a control appearing instead, since the Daily card's eye only exists once today's
 * game is done. Switch-based accessors, like `NavSeen` below, because the
 * `security/detect-object-injection` rule forbids indexing by a variable key.
 *
 * `timelineTab` falls back to the key it replaced, `when-timeline-intro-seen`, so an
 * upgrade does not re-show it. That key is read, never written. (`when-modes-played`, which
 * gated the old per-mode rules popup, is no longer read at all: the popup is gone.)
 */
export type HintKey =
  | 'drag'
  | 'wrong'
  | 'correct'
  | 'closeEnough'
  | 'tapCard'
  | 'stats'
  | 'swap'
  | 'dailyTab'
  | 'archiveTab'
  | 'customTab'
  | 'statsTab'
  | 'timelineTab'
  | 'reviewEye';
export type GameHintKey = Extract<
  HintKey,
  'drag' | 'wrong' | 'correct' | 'closeEnough' | 'tapCard' | 'stats' | 'swap'
>;
export type TabHintKey = Extract<
  HintKey,
  'dailyTab' | 'archiveTab' | 'customTab' | 'statsTab' | 'timelineTab' | 'reviewEye'
>;

interface HintsSeen {
  drag?: boolean;
  wrong?: boolean;
  correct?: boolean;
  closeEnough?: boolean;
  tapCard?: boolean;
  stats?: boolean;
  swap?: boolean;
  dailyTab?: boolean;
  archiveTab?: boolean;
  customTab?: boolean;
  statsTab?: boolean;
  timelineTab?: boolean;
  reviewEye?: boolean;
}

const HINTS_SEEN_KEY = 'when-hints-seen';
const HINTS_RESET_EVENT = 'when-hints-reset';
const LEGACY_MODES_PLAYED_KEY = 'when-modes-played';
const LEGACY_TIMELINE_INTRO_KEY = 'when-timeline-intro-seen';

function getHintSeen(data: HintsSeen, key: HintKey): boolean {
  switch (key) {
    case 'drag':
      return data.drag === true;
    case 'wrong':
      return data.wrong === true;
    case 'correct':
      return data.correct === true;
    case 'closeEnough':
      return data.closeEnough === true;
    case 'tapCard':
      return data.tapCard === true;
    // The in-game counter hint. Not `statsTab` (the home tab's strip) and not `NavKey`'s
    // `stats` (the nav dot) — three different unions that happen to share a word.
    case 'stats':
      return data.stats === true;
    case 'swap':
      return data.swap === true;
    case 'dailyTab':
      return data.dailyTab === true;
    case 'archiveTab':
      return data.archiveTab === true;
    case 'customTab':
      return data.customTab === true;
    case 'statsTab':
      return data.statsTab === true;
    case 'timelineTab':
      return data.timelineTab === true;
    case 'reviewEye':
      return data.reviewEye === true;
  }
}

function setHintSeen(data: HintsSeen, key: HintKey): HintsSeen {
  switch (key) {
    case 'drag':
      return { ...data, drag: true };
    case 'wrong':
      return { ...data, wrong: true };
    case 'correct':
      return { ...data, correct: true };
    case 'closeEnough':
      return { ...data, closeEnough: true };
    case 'tapCard':
      return { ...data, tapCard: true };
    case 'stats':
      return { ...data, stats: true };
    case 'swap':
      return { ...data, swap: true };
    case 'dailyTab':
      return { ...data, dailyTab: true };
    case 'archiveTab':
      return { ...data, archiveTab: true };
    case 'customTab':
      return { ...data, customTab: true };
    case 'statsTab':
      return { ...data, statsTab: true };
    case 'timelineTab':
      return { ...data, timelineTab: true };
    case 'reviewEye':
      return { ...data, reviewEye: true };
  }
}

// The pre-2026-09 storage each key replaced. Read-only: nothing writes these any more.
function legacyHintSeen(key: HintKey): boolean {
  switch (key) {
    case 'timelineTab':
      return readString(LEGACY_TIMELINE_INTRO_KEY) === '1';
    default:
      return false;
  }
}

/**
 * Whether a one-shot hint has already been shown (or its pre-2026-09 equivalent had).
 */
export function hasSeenHint(key: HintKey): boolean {
  return (
    readJson(HINTS_SEEN_KEY, false, (data) => getHintSeen(data as HintsSeen, key)) ||
    legacyHintSeen(key)
  );
}

/**
 * Mark a one-shot hint as shown so it never auto-shows again.
 */
export function markHintSeen(key: HintKey): void {
  const data = readJson<HintsSeen>(HINTS_SEEN_KEY, {});
  writeJson(HINTS_SEEN_KEY, setHintSeen(data, key), 'hints seen state');
}

/**
 * Forget every hint, legacy keys included, so the first-run experience can be replayed. The
 * menu's "Reset Hints" row calls this; so do QA and the Playwright walkthrough.
 *
 * The event is the point: the burger menu is reachable mid-game (`TopBar` renders on the game
 * screen too), but `useOnboardingHints` reads storage once per mount, so without a broadcast a
 * reset during a game would silently do nothing until the next one. Fired even when the
 * removals threw — in private mode there was nothing stored to forget, and the listeners
 * re-reading an empty store is exactly the right outcome.
 */
export function resetHintsSeen(): void {
  removeKeys(
    [HINTS_SEEN_KEY, LEGACY_MODES_PLAYED_KEY, LEGACY_TIMELINE_INTRO_KEY],
    'hints seen state'
  );
  window.dispatchEvent(new Event(HINTS_RESET_EVENT));
}

/**
 * Listen for `resetHintsSeen`. Returns the unsubscribe, so a hook can `useEffect(() =>
 * subscribeHintsReset(handler), [handler])` and re-read its cached seen-state on the spot.
 */
export function subscribeHintsReset(handler: () => void): () => void {
  window.addEventListener(HINTS_RESET_EVENT, handler);
  return () => window.removeEventListener(HINTS_RESET_EVENT, handler);
}

// --- Nav "new" Dot Storage ---

/**
 * Top-bar nav destinations that get a one-time "new" dot until first clicked. (A retired
 * `achievements` key may linger in stored JSON from before the badges moved onto Stats; it
 * is simply never read.)
 */
export type NavKey = 'archive' | 'stats' | 'timeline';

interface NavSeen {
  archive?: boolean;
  stats?: boolean;
  timeline?: boolean;
}

const NAV_SEEN_KEY = 'when-nav-seen';

// Switch-based access (mirrors getModePlayed/setModePlayed) to avoid dynamic key indexing.
function getNavSeen(data: NavSeen, key: NavKey): boolean {
  switch (key) {
    case 'archive':
      return data.archive === true;
    case 'stats':
      return data.stats === true;
    case 'timeline':
      return data.timeline === true;
  }
}

function setNavSeen(data: NavSeen, key: NavKey): NavSeen {
  switch (key) {
    case 'archive':
      return { ...data, archive: true };
    case 'stats':
      return { ...data, stats: true };
    case 'timeline':
      return { ...data, timeline: true };
  }
}

function clearNavSeen(data: NavSeen, key: NavKey): NavSeen {
  switch (key) {
    case 'archive':
      return { ...data, archive: false };
    case 'stats':
      return { ...data, stats: false };
    case 'timeline':
      return { ...data, timeline: false };
  }
}

/**
 * Check whether a nav destination's "new" dot has already been dismissed
 * (i.e. the user has clicked/visited it before).
 */
export function hasSeenNav(key: NavKey): boolean {
  return readJson(NAV_SEEN_KEY, false, (data) => getNavSeen(data as NavSeen, key));
}

/**
 * Mark a nav destination as seen so its "new" dot no longer shows.
 */
export function markNavSeen(key: NavKey): void {
  writeJson(NAV_SEEN_KEY, setNavSeen(readJson<NavSeen>(NAV_SEEN_KEY, {}), key), 'nav seen state');
}

/**
 * Re-arm a nav destination's "new" dot (e.g. after a new achievement unlocks),
 * so it shows again until the user next visits that page.
 */
export function markNavUnseen(key: NavKey): void {
  const data = readJson<NavSeen>(NAV_SEEN_KEY, {});
  writeJson(NAV_SEEN_KEY, clearNavSeen(data, key), 'nav seen state');
}

// --- Timeline High Score Storage ---

const TIMELINE_HIGH_SCORE_KEY = 'when-timeline-high-score';

/**
 * Get the high score for Sudden Death mode (longest timeline)
 */
export function getTimelineHighScore(): number {
  return parseInt(readString(TIMELINE_HIGH_SCORE_KEY) ?? '', 10) || 0;
}

// --- Display Name Storage ---

const DISPLAY_NAME_KEY = 'when-display-name';

/**
 * Get the saved display name for leaderboard submissions
 */
export function getDisplayName(): string {
  return readString(DISPLAY_NAME_KEY) || '';
}

/**
 * Save the display name for future leaderboard submissions
 */
export function saveDisplayName(name: string): void {
  writeString(DISPLAY_NAME_KEY, name, 'display name');
}

// --- Leaderboard Submission Tracking ---

const LEADERBOARD_SUBMITTED_KEY = 'when-leaderboard-submitted';

/**
 * Check if leaderboard submission was made for today's daily
 */
export function hasSubmittedToLeaderboard(): boolean {
  // Only true if it was submitted for today
  return readString(LEADERBOARD_SUBMITTED_KEY) === getLocalDateString();
}

/**
 * Mark that leaderboard submission was made for today
 */
export function markLeaderboardSubmitted(): void {
  writeString(LEADERBOARD_SUBMITTED_KEY, getLocalDateString(), 'leaderboard submission status');
}

/**
 * Update today's daily result with leaderboard ranking data
 */
export function updateDailyResultWithLeaderboard(rank: number, totalPlayers: number): void {
  const result = getTodayResult();
  if (!result) return;
  saveDailyResult({ ...result, leaderboardRank: rank, leaderboardTotalPlayers: totalPlayers });
}

// --- Daily Reminder Storage ---

const DAILY_REMINDER_KEY = 'when-daily-reminder';

/**
 * Whether the player wants the 8am daily-puzzle reminder. Defaults to ON:
 * only an explicit opt-out (value '0') disables it. Intent only — the OS
 * notification permission is a separate gate checked at scheduling time.
 */
export function isDailyReminderEnabled(): boolean {
  return readString(DAILY_REMINDER_KEY) !== '0';
}

export function setDailyReminderEnabled(enabled: boolean): void {
  writeString(DAILY_REMINDER_KEY, enabled ? '1' : '0', 'daily reminder setting');
}

// --- Reminder Priming Storage ---

const REMINDER_PRIMING_KEY = 'when-reminder-priming';

const PRIMING_MAX_DISMISSALS = 3;
const PRIMING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

interface ReminderPriming {
  dismissedAt: string; // ISO timestamp of the last "Not now"
  count: number; // total dismissals
}

function getReminderPriming(): ReminderPriming | null {
  return readJson<ReminderPriming | null>(REMINDER_PRIMING_KEY, null);
}

/**
 * Whether the pre-permission priming card ("Get a reminder at 8 AM?") may show:
 * fewer than 3 dismissals and at least 7 days since the last one.
 */
export function shouldShowReminderPriming(now: Date = new Date()): boolean {
  const priming = getReminderPriming();
  if (!priming) return true;
  if (priming.count >= PRIMING_MAX_DISMISSALS) return false;
  const dismissedAt = Date.parse(priming.dismissedAt);
  if (Number.isNaN(dismissedAt)) return true;
  return now.getTime() - dismissedAt >= PRIMING_COOLDOWN_MS;
}

/**
 * Record a "Not now" on the priming card, starting the 7-day cooldown.
 */
export function recordPrimingDismissed(now: Date = new Date()): void {
  const updated: ReminderPriming = {
    dismissedAt: now.toISOString(),
    count: (getReminderPriming()?.count ?? 0) + 1,
  };
  writeJson(REMINDER_PRIMING_KEY, updated, 'reminder priming state');
}

/**
 * Clear priming dismissal state (dev/admin use — /reminder-preview).
 */
export function resetReminderPriming(): void {
  removeKeys([REMINDER_PRIMING_KEY], 'reminder priming state');
}

// --- Custom Game Settings Storage ---

/**
 * The player's last Custom-game configuration, persisted so their tuned filters/mode
 * survive a refresh. The random deck seed is intentionally NOT stored — it is generated
 * fresh per play, so reloading keeps the settings but still produces a different game.
 */
export interface CustomSettings {
  selectedDifficulties: Difficulty[];
  selectedCategories: Category[];
  selectedEras: Era[];
  playerCount: number;
  cardsPerHand: number;
  suddenDeathHandSize: number;
}

const CUSTOM_SETTINGS_KEY = 'when-custom-settings';

/**
 * Save the player's Custom-game settings to localStorage.
 */
export function saveCustomSettings(settings: CustomSettings): void {
  writeJson(CUSTOM_SETTINGS_KEY, settings, 'custom settings');
}

const isNonEmptyArray = (value: unknown): boolean => Array.isArray(value) && value.length > 0;

/**
 * Get the player's saved Custom-game settings, or null if none/corrupted.
 * Returns null on any validation failure so callers fall back to defaults.
 */
export function getCustomSettings(): CustomSettings | null {
  return readJson(CUSTOM_SETTINGS_KEY, null, normalizeCustomSettings);
}

function normalizeCustomSettings(raw: unknown): CustomSettings | null {
  const parsed = raw as Partial<CustomSettings>;

  // Validate: filters must be non-empty arrays and numbers finite. A retired
  // `isSuddenDeath` key may still be present in older records; it is simply ignored,
  // deliberately not validated, so an old record still restores rather than resetting.
  if (
    !isNonEmptyArray(parsed.selectedDifficulties) ||
    !isNonEmptyArray(parsed.selectedCategories) ||
    !isNonEmptyArray(parsed.selectedEras) ||
    !Number.isFinite(parsed.playerCount) ||
    !Number.isFinite(parsed.cardsPerHand) ||
    !Number.isFinite(parsed.suddenDeathHandSize)
  ) {
    return null;
  }

  return parsed as CustomSettings;
}
