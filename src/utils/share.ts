import { HistoricalEvent, WhenGameState } from '../types';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';
import { getLocalDateString } from './puzzleDate';
import { renderShareFile, ShareCardSpec } from './shareImage';

/**
 * The game's name carries its question mark — the home-screen H1, the manifest, the page
 * title and the OG tags all say "When?". The share text and the story card must match.
 */
const BRAND = 'When?';

/** Used as an href by the Custom page's challenge-code box, so it keeps its scheme. */
export const CHALLENGE_URL = 'https://www.play-when.com/challenge';

/**
 * Bare domains for the share *text*. Every major target (WhatsApp, iMessage, Signal,
 * Instagram, Slack, X) linkifies these, and they read far better than a full origin in
 * a three-line message. The `https://` forms above are still used where the string is a
 * link rather than prose.
 */
const DISPLAY_URL = 'play-when.com';
const DISPLAY_DAILY_URL = 'play-when.com/daily';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "2026-08-15" -> "Aug 15", parsed by hand.
 *
 * `new Date('2026-08-15')` is parsed as UTC midnight and then rendered in local time,
 * which prints the previous day for everyone west of Greenwich. The puzzle day is a
 * local calendar day (see docs/leaderboard-daily), so the string is already correct —
 * it just needs splitting, never re-parsing.
 */
export function formatShareDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${month} ${Number(match[3])}`;
}

/**
 * Emoji grid from placement history.
 *
 * No longer part of the share text — it was a flat run of greens with at most `handSize`
 * reds, restating the number on the line below it and growing longer the better you
 * played. It is still stored on the daily result and submitted to the leaderboard, which
 * renders it, so this stays.
 */
export function generateEmojiGrid(placementHistory: boolean[]): string {
  return placementHistory.map((correct) => (correct ? '🟩' : '🟥')).join('');
}

/** "#47 globally", or "#1 globally 👑" — the only emoji left in the share text. */
function formatRank(rank: number): string {
  return rank === 1 ? '#1 globally 👑' : `#${rank} globally`;
}

/**
 * Assemble the three-part message: an identity line, a stat line, then the link alone.
 *
 * The link is last and is the *only* URL in the message — WhatsApp and iMessage preview
 * the first URL they find, so a second one upstream would silently change which page
 * gets the preview card.
 */
function composeShareText(headline: string, stats: string[], url: string): string {
  const statLine = stats.filter(Boolean).join(' — ');
  return `${headline}\n${statLine}\n\n${url}`;
}

export interface DailyShareFacts {
  date: string;
  theme: string;
  correctCount: number;
  leaderboardRank?: number;
}

/** The daily message, shared by the game-over screen and the home screen's result card. */
export function generateDailyShareText(facts: DailyShareFacts): string {
  const { date, theme, correctCount, leaderboardRank } = facts;
  // +1 for the seed card the timeline starts with, matching the on-screen count.
  const timelineLength = correctCount + 1;
  return composeShareText(
    `${BRAND} · ${formatShareDate(date)} · ${theme}`,
    [`Timeline of ${timelineLength}`, leaderboardRank ? formatRank(leaderboardRank) : ''],
    DISPLAY_DAILY_URL
  );
}

/**
 * Generate the share text based on game mode and results.
 *
 * Only the daily is named, because it is the only thing a recipient can go and play a
 * shared instance of. A non-daily game carries no mode label at all: the internal
 * `suddenDeath` name never surfaced, and its old "Marathon" label implied a choice of
 * rule-sets that the UI does not offer — everything that is not the daily is a Custom
 * game. Do not reintroduce a mode word here.
 */
export function generateShareText(state: WhenGameState): string {
  const { gameMode, placementHistory, lastConfig, players, winners, roundNumber } = state;
  const playerCount = players.length;
  const correctCount = placementHistory.filter((p) => p).length;

  if (gameMode === 'daily') {
    const date = lastConfig?.dailySeed || getLocalDateString();
    return generateDailyShareText({
      date,
      theme: getThemeDisplayName(getDailyTheme(date)),
      correctCount,
    });
  }

  const challengeCode = lastConfig?.challengeCode;
  const url = challengeCode ? `${DISPLAY_URL}/challenge/${challengeCode}` : DISPLAY_URL;

  if (playerCount > 1) {
    const winnerNames = winners.map((w) => w.name).join(', ');
    return composeShareText(
      `${BRAND} · ${playerCount} players`,
      [winnerNames ? `${winnerNames} wins` : 'No winner', `${roundNumber} rounds`],
      url
    );
  }

  return composeShareText(BRAND, [`Timeline of ${correctCount}`], url);
}

/**
 * Share content using the Web Share API, falling back to the clipboard.
 *
 * When a `file` is supplied it is offered first, because **Instagram only accepts image
 * and video payloads** — a text-only share never lists it as a target at all. Three tiers,
 * in order:
 *
 *  1. file + text — the full experience. Keeps the tappable link for WhatsApp/Messages.
 *  2. file alone — some image-first targets (Instagram, Snapchat, Pinterest are the
 *     reported ones) drop out of the sheet when `text`/`url` travel alongside `files`.
 *     Trying files-only next is the known workaround. The URL is burned into the image
 *     itself, so nothing is lost when the text is dropped.
 *  3. text alone, then the clipboard.
 *
 * Returns true if the caller should show the "copied to clipboard" toast.
 */
export async function shareContent(
  text: string,
  title: string,
  file?: File | null
): Promise<boolean> {
  const canShareFiles =
    !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  if (canShareFiles && navigator.share) {
    const payloads: ShareData[] = [{ text, files: [file as File] }, { files: [file as File] }];
    for (const payload of payloads) {
      try {
        await navigator.share(payload);
        return false;
      } catch (err) {
        // A cancel is a decision, not a failure — do not retry it as a different payload.
        if ((err as Error).name === 'AbortError') return false;
      }
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return false; // Native share handled it, no toast needed
    } catch (err) {
      // User cancelled or share failed, fall through to clipboard
      if ((err as Error).name === 'AbortError') {
        return false; // User cancelled, no toast
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true; // Show toast
  } catch (err) {
    // Final fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true; // Show toast
  }
}

/** Build the story card, or null if the browser cannot produce one. */
async function buildShareFile(spec: ShareCardSpec, slug: string): Promise<File | null> {
  return renderShareFile(spec, `when-${slug}.jpg`);
}

/**
 * Share game results using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
export async function shareResults(state: WhenGameState): Promise<boolean> {
  const shareText = generateShareText(state);
  const { gameMode, placementHistory, lastConfig, timeline, seedEventName } = state;
  const correctCount = placementHistory.filter((p) => p).length;

  // The seed card is the one event safe to show: it is on the board before the first
  // move, so it reveals nothing about the puzzle. `timeline` is kept in year order, so
  // the seed is not necessarily its first entry.
  const seedEvent = timeline.find((event) => event.name === seedEventName) ?? null;

  const isDaily = gameMode === 'daily';
  const date = lastConfig?.dailySeed || getLocalDateString();
  const spec: ShareCardSpec = isDaily
    ? {
        event: seedEvent,
        eyebrow: `Daily · ${formatShareDate(date)} · ${getThemeDisplayName(getDailyTheme(date))}`,
        score: String(correctCount + 1),
        scoreLabel: 'events in my timeline',
        url: DISPLAY_DAILY_URL,
      }
    : {
        // No eyebrow: a non-daily game has no mode to name (see `generateShareText`).
        event: seedEvent,
        score: String(correctCount),
        scoreLabel: correctCount === 1 ? 'event placed' : 'events placed',
        url: lastConfig?.challengeCode
          ? `${DISPLAY_URL}/challenge/${lastConfig.challengeCode}`
          : DISPLAY_URL,
      };

  const file = await buildShareFile(spec, isDaily ? date : 'custom');
  return shareContent(shareText, 'When? - The Timeline Game', file);
}

/**
 * Share the app (invite link) using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
export async function shareApp(): Promise<boolean> {
  const text = `${BRAND} — put history in order.\n\n${DISPLAY_URL}`;
  return shareContent(text, 'When? - The Timeline Game');
}

/**
 * Share daily result from stored data (for completed daily on mode select screen).
 *
 * `seedEvent` is today's pre-placed card — the same one the home screen previews — and is
 * used as the story-card art. Returns true if copied to clipboard (toast should be shown).
 */
export async function shareDailyResult(
  date: string,
  theme: string,
  correctCount: number,
  options: {
    leaderboardRank?: number;
    seedEvent?: HistoricalEvent | null;
  } = {}
): Promise<boolean> {
  const { leaderboardRank, seedEvent } = options;
  const text = generateDailyShareText({ date, theme, correctCount, leaderboardRank });

  const file = await buildShareFile(
    {
      event: seedEvent,
      eyebrow: `Daily · ${formatShareDate(date)} · ${theme}`,
      score: String(correctCount + 1),
      scoreLabel: 'events in my timeline',
      detail: leaderboardRank ? formatRank(leaderboardRank) : undefined,
      url: DISPLAY_DAILY_URL,
    },
    date
  );

  return shareContent(text, 'When? - The Timeline Game', file);
}
