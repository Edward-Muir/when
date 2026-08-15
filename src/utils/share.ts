import { HistoricalEvent, WhenGameState } from '../types';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';
import { getDailyPuzzleNumber, getLocalDateString } from './puzzleDate';
import { renderShareFile, ShareCardSpec } from './shareImage';

/**
 * The game's name carries its question mark — the home-screen H1, the manifest, the page
 * title and the OG tags all say "When?". The share text and the story card must match.
 */
const BRAND = 'When?';

/**
 * The one line that tells a recipient what the thing is.
 *
 * It was already `shareApp()`'s invite copy; it is now on every share, because the message
 * used to name a score and a rank and never once said what the game *does* — a non-player
 * learned only where the link went.
 *
 * It is deliberately a description, not an exhortation. Nothing in a share addresses the
 * reader or asks them for anything: no "your turn", no "can you beat it". Wordle's share
 * has no call to action at all — `Wordle 1,234 4/6` and a grid, no URL, no verb — and it
 * spread precisely because it reads as a receipt rather than a claim, and because a
 * recipient who cannot decode it has to ask. Copy that performs enthusiasm at the reader is
 * the opposite of that register. Do not reintroduce it.
 */
const DESCRIPTOR = 'put history in order.';

/**
 * What a challenge link actually does, stated flatly.
 *
 * This was `Same cards, same order — beat my timeline.` in `CustomGameSettings`. The first
 * half is a fact about the link and earns its place; "beat my timeline" is the exhortative
 * register `DESCRIPTOR` explains we do not use, so it is gone.
 */
const CHALLENGE_PROMISE = 'Same cards, same order.';

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
 * Assemble the message: an identity line, any body lines, then the link alone.
 *
 * The link is last and is the *only* URL in the message — WhatsApp and iMessage preview
 * the first URL they find, so a second one upstream would silently change which page
 * gets the preview card.
 */
function composeShareText(headline: string, lines: string[], url: string): string {
  const body = lines.filter(Boolean).join('\n');
  return body ? `${headline}\n${body}\n\n${url}` : `${headline}\n\n${url}`;
}

/**
 * The two forms every share needs.
 *
 * The card and the caption used to say the same thing twice — the message repeated the
 * date, the score, the rank and the URL that were all already burned into the image, so
 * it did no work at all. They now split the job: the image is the receipt, the caption is
 * identity plus the link.
 *
 * That split only holds while the image actually travels. `shareContent`'s lower tiers
 * fall back to text alone and then to the clipboard, and on those paths a stats-free
 * caption would send a bare invite with the player's result missing entirely — so
 * `textOnly` keeps the stat line. Callers hand both to `shareContent`, which picks.
 */
export interface ShareMessage {
  /** Caption for when the story card travels alongside it. Carries no stats. */
  withCard: string;
  /** Used when there is no card, so the stat line has to survive in the text. */
  textOnly: string;
}

/**
 * `Daily #49 · Everything` — the card's line under the wordmark.
 *
 * This printed the date until 2026-08. A shared image is a forwardable object, so "Aug 15"
 * went stale overnight and duplicated the timestamp the chat app already stamps on the
 * bubble. `getDailyPuzzleNumber` explains why a number is the better identifier; the
 * numberless form is the fallback if the date is unparseable.
 */
function dailyEyebrow(date: string, theme: string): string {
  const puzzleNumber = getDailyPuzzleNumber(date);
  return puzzleNumber ? `Daily #${puzzleNumber} · ${theme}` : `Daily · ${theme}`;
}

/** `When? #49 — put history in order.`, or the numberless form for a junk date. */
function dailyHeadline(date: string): string {
  const puzzleNumber = getDailyPuzzleNumber(date);
  return puzzleNumber ? `${BRAND} #${puzzleNumber} — ${DESCRIPTOR}` : `${BRAND} — ${DESCRIPTOR}`;
}

export interface DailyShareFacts {
  date: string;
  correctCount: number;
  leaderboardRank?: number;
}

/** The daily message, shared by the game-over screen and the home screen's result card. */
export function generateDailyShareText(facts: DailyShareFacts): ShareMessage {
  const { date, correctCount, leaderboardRank } = facts;
  // +1 for the seed card the timeline starts with, matching the on-screen count.
  const timelineLength = correctCount + 1;
  const headline = dailyHeadline(date);
  const stats = [
    `Timeline of ${timelineLength}`,
    leaderboardRank ? formatRank(leaderboardRank) : '',
  ]
    .filter(Boolean)
    .join(' — ');

  return {
    withCard: composeShareText(headline, [], DISPLAY_DAILY_URL),
    textOnly: composeShareText(headline, [stats], DISPLAY_DAILY_URL),
  };
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
export function generateShareText(state: WhenGameState): ShareMessage {
  const { gameMode, placementHistory, lastConfig, players, winners, roundNumber } = state;
  const playerCount = players.length;
  const correctCount = placementHistory.filter((p) => p).length;

  if (gameMode === 'daily') {
    const date = lastConfig?.dailySeed || getLocalDateString();
    return generateDailyShareText({ date, correctCount });
  }

  const challengeCode = lastConfig?.challengeCode;
  const url = challengeCode ? `${DISPLAY_URL}/challenge/${challengeCode}` : DISPLAY_URL;
  // A challenge link replays the identical deck, which is the whole reason to follow it —
  // a plain fact about the link, so it rides along even on the stats-free caption.
  const promise = challengeCode ? CHALLENGE_PROMISE : '';

  if (playerCount > 1) {
    const winnerNames = winners.map((w) => w.name).join(', ');
    const headline = `${BRAND} · ${playerCount} players — ${DESCRIPTOR}`;
    const stats = [winnerNames ? `${winnerNames} wins` : 'No winner', `${roundNumber} rounds`].join(
      ' — '
    );
    return {
      withCard: composeShareText(headline, [promise], url),
      textOnly: composeShareText(headline, [stats, promise], url),
    };
  }

  const headline = `${BRAND} — ${DESCRIPTOR}`;
  return {
    withCard: composeShareText(headline, [promise], url),
    textOnly: composeShareText(headline, [`Timeline of ${correctCount}`, promise], url),
  };
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
  message: string | ShareMessage,
  title: string,
  file?: File | null
): Promise<boolean> {
  const canShareFiles =
    !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  // The caption drops the stats only because the card is carrying them, so the form is
  // chosen per tier rather than once: tiers 1-2 ship the card, tier 3 and the clipboard do
  // not, and on those a stats-free caption would send a bare invite with the player's
  // result missing. Tier 3 is reached both when there was never a file and when both file
  // payloads failed, which is why this is not a single up-front decision.
  const { withCard, textOnly } =
    typeof message === 'string' ? { withCard: message, textOnly: message } : message;

  if (canShareFiles && navigator.share) {
    const payloads: ShareData[] = [
      { text: withCard, files: [file as File] },
      { files: [file as File] },
    ];
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
      await navigator.share({ title, text: textOnly });
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
    await navigator.clipboard.writeText(textOnly);
    return true; // Show toast
  } catch (err) {
    // Final fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = textOnly;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true; // Show toast
  }
}

/**
 * The unit that sits beside the big number on the card.
 *
 * Deliberately just "events" on both card types. It is the only wording true of each:
 * the daily's number counts the whole timeline *including* the pre-placed seed card, so
 * "events placed" would be one too many there, while a custom game's number really is a
 * placement count. One word sidesteps the difference and matches the share text's
 * "Timeline of N".
 */
function scoreUnit(count: number): string {
  return count === 1 ? 'event' : 'events';
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
        eyebrow: dailyEyebrow(date, getThemeDisplayName(getDailyTheme(date))),
        score: String(correctCount + 1),
        scoreLabel: scoreUnit(correctCount + 1),
        url: DISPLAY_DAILY_URL,
      }
    : {
        // No eyebrow: a non-daily game has no mode to name (see `generateShareText`).
        event: seedEvent,
        score: String(correctCount),
        scoreLabel: scoreUnit(correctCount),
        url: lastConfig?.challengeCode
          ? `${DISPLAY_URL}/challenge/${lastConfig.challengeCode}`
          : DISPLAY_URL,
      };

  const file = await buildShareFile(spec, isDaily ? date : 'custom');
  return shareContent(shareText, 'When? - The Timeline Game', file);
}

/**
 * The Custom page's challenge invite, sent *before* a game is played.
 *
 * There is no result to report, so this has no stats form — unlike the post-game shares it
 * is the same string on every tier.
 */
export function generateChallengeInviteText(url: string): string {
  return composeShareText(`${BRAND} — ${DESCRIPTOR}`, [CHALLENGE_PROMISE], url);
}

/**
 * Share the app (invite link) using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
export async function shareApp(): Promise<boolean> {
  const text = `${BRAND} — ${DESCRIPTOR}\n\n${DISPLAY_URL}`;
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
  const text = generateDailyShareText({ date, correctCount, leaderboardRank });

  const file = await buildShareFile(
    {
      event: seedEvent,
      eyebrow: dailyEyebrow(date, theme),
      score: String(correctCount + 1),
      scoreLabel: scoreUnit(correctCount + 1),
      detail: leaderboardRank ? formatRank(leaderboardRank) : undefined,
      url: DISPLAY_DAILY_URL,
    },
    date
  );

  return shareContent(text, 'When? - The Timeline Game', file);
}
