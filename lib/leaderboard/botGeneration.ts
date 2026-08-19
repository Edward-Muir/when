/**
 * Bot leaderboard entries.
 *
 * Not a route (no default export). Lives in lib/ rather than api/ because Vercel turns every
 * .ts file under api/ into its own Serverless Function and the Hobby plan caps a deployment at
 * 12 — helper files there burn the budget for nothing, while the bundler still follows imports
 * into lib/ perfectly well. src/utils/apiRoutes.test.ts fails if a non-route lands back under
 * api/.
 */

import { Redis } from '@upstash/redis';
import { isDateWithinSubmissionWindow, SUBMISSION_DEDUPE_TTL_SECONDS } from './dateWindow';
import { CALENDAR_KEY, ThemeCalendar } from '../themes/schema';

// Bot configuration
const BOT_COUNT_BASE = 10;
const BOT_COUNT_VARIANCE = 3; // 7-13 bots
const POISSON_MEAN = 6;

// Seeded random number generator (mulberry32) - matches submit.ts
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string to numeric seed - matches submit.ts
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Poisson distribution via inverse transform sampling
function samplePoisson(lambda: number, random: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= random();
  } while (p > L);
  return k - 1;
}

// Name dictionaries for bot names
export const ADJECTIVES = [
  'Brave',
  'Swift',
  'Clever',
  'Mighty',
  'Silent',
  'Golden',
  'Silver',
  'Cosmic',
  'Thunder',
  'Shadow',
  'Crystal',
  'Blazing',
  'Frozen',
  'Ancient',
  'Noble',
  'Wild',
  'Gentle',
  'Fierce',
  'Lucky',
  'Mystic',
  'Radiant',
  'Stormy',
  'Crimson',
  'Azure',
  'Emerald',
  'Obsidian',
  'Iron',
  'Steel',
  'Copper',
  'Bronze',
  'Platinum',
  'Diamond',
  'Ruby',
  'Sapphire',
  'Jade',
];

export const ANIMALS = [
  'Penguin',
  'Tiger',
  'Fox',
  'Eagle',
  'Wolf',
  'Bear',
  'Hawk',
  'Lion',
  'Panther',
  'Falcon',
  'Owl',
  'Shark',
  'Dragon',
  'Phoenix',
  'Raven',
  'Cobra',
  'Viper',
  'Jaguar',
  'Leopard',
  'Lynx',
  'Otter',
  'Badger',
  'Wolverine',
  'Mongoose',
  'Heron',
  'Crane',
  'Osprey',
  'Condor',
  'Albatross',
];

function generateBotName(random: () => number): string {
  const adjIndex = Math.floor(random() * ADJECTIVES.length);
  const animalIndex = Math.floor(random() * ANIMALS.length);
  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`;
}

/**
 * Deterministic "Golden Otter"-style name for an arbitrary seed string.
 *
 * Used by the name filter to replace a blocked display name. It must be stable for
 * a given seed: the leaderboard polls every 15s, so a name that re-rolled per
 * request would visibly flicker, and the write path (submit) and the read path
 * ([date]) have to agree on what a given player is called.
 */
/** Flat ceiling on a bot's correct count on an ordinary (thousands-of-cards) day. */
const BOT_MAX_CORRECT = 20;

/**
 * The most correct placements a human could manage on `date`.
 *
 * A curated day's deck is the theme's event list, so the ceiling is one below its size (the
 * first card seeds the timeline rather than being placed). Everything else is effectively
 * unbounded.
 *
 * Reading the stored calendar is NOT the pattern submit.ts forbids. What broke there was the
 * API keeping its own copy of ALL_CATEGORIES and the RNG so it could re-derive the theme and
 * reject clients that disagreed; the copy drifted and started rejecting a quarter of all
 * dates. This reads a count out of the one authoritative record, so there is nothing to
 * drift against. It also fails open — an unreadable calendar just restores the flat ceiling.
 */
async function maxCorrectForDate(redis: Redis, date: string): Promise<number> {
  try {
    const calendar = await redis.get<ThemeCalendar>(CALENDAR_KEY);
    const theme = calendar?.themes?.find((t) => t.dates?.includes(date));
    if (!theme) return BOT_MAX_CORRECT;
    return Math.max(0, Math.min(BOT_MAX_CORRECT, theme.eventNames.length - 1));
  } catch (error) {
    console.error('Failed to read theme calendar for bot ceiling', error);
    return BOT_MAX_CORRECT;
  }
}

export function generateNameFromSeed(seed: string): string {
  return generateBotName(seededRandom(stringToSeed(seed)));
}

function generateBotDeviceId(date: string, botIndex: number): string {
  const seed = stringToSeed(`bot-${date}-${botIndex}`);
  const random = seededRandom(seed);
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(random() * chars.length)];
  }
  return id;
}

function generateDeterministicEmojiGrid(
  correctCount: number,
  mistakeCount: number,
  random: () => number
): string {
  const total = correctCount + mistakeCount;
  const grid: string[] = [];

  let mistakesRemaining = mistakeCount;
  let correctRemaining = correctCount;

  for (let i = 0; i < total; i++) {
    if (mistakesRemaining === 0) {
      grid.push('🟩');
      correctRemaining--;
    } else if (correctRemaining === 0) {
      grid.push('🟥');
      mistakesRemaining--;
    } else {
      const mistakeProb = mistakesRemaining / (correctRemaining + mistakesRemaining);
      if (random() < mistakeProb) {
        grid.push('🟥');
        mistakesRemaining--;
      } else {
        grid.push('🟩');
        correctRemaining--;
      }
    }
  }

  return grid.join('');
}

interface BotEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  deviceId: string;
  timestamp: number;
}

/**
 * The bot field for one puzzle date. Derived purely from the date string, so every player
 * worldwide sees the identical set for a given date regardless of when they first fetch it.
 * Exported for tests.
 */
export function generateBotsForDate(
  date: string,
  maxCorrect: number = BOT_MAX_CORRECT
): BotEntry[] {
  // Create date-seeded random generator
  const baseSeed = stringToSeed(`bots-${date}`);
  const random = seededRandom(baseSeed);

  // Determine bot count: 10 +/- 3 (so 7-13)
  const variance = Math.floor(random() * (BOT_COUNT_VARIANCE * 2 + 1)) - BOT_COUNT_VARIANCE;
  const botCount = BOT_COUNT_BASE + variance;

  const bots: BotEntry[] = [];

  for (let i = 0; i < botCount; i++) {
    // Each bot gets its own seeded generator for consistent regeneration
    const botSeed = stringToSeed(`bot-${date}-${i}`);
    const botRandom = seededRandom(botSeed);

    // Generate correctCount using Poisson distribution (mean 6), clamped to a plausible
    // range. `maxCorrect` is the day's real ceiling: on a curated theme the deck is only a
    // couple of dozen cards, so a human cannot place more than pool-1 and an unclamped bot
    // could out-score every player on the board. On an ordinary day the deck is thousands
    // deep and this is just the flat BOT_MAX_CORRECT.
    const correctCount = Math.min(maxCorrect, Math.max(0, samplePoisson(POISSON_MEAN, botRandom)));

    // Mistakes. INERT: nothing ranks or renders these any more. The score below is correct
    // count alone, `[date].ts` sends neither `totalAttempts` nor `emojiGrid` to the client,
    // and a real daily always ends on exactly DAILY_HAND_SIZE mistakes anyway — so the spread
    // here is not "realistic", it is just the shape of the stored blob. Left as-is because
    // changing it would reshuffle nothing and invalidate the seeded fixtures for no gain.
    // Don't infer from this that mistakes vary between players. They don't.
    const mistakeRoll = botRandom();
    let mistakeCount: number;
    if (mistakeRoll < 0.05)
      mistakeCount = 1; // 5%
    else if (mistakeRoll < 0.15)
      mistakeCount = 2; // 10%
    else if (mistakeRoll < 0.35)
      mistakeCount = 3; // 20%
    else if (mistakeRoll < 0.65)
      mistakeCount = 4; // 30%
    else mistakeCount = 5; // 35%

    const displayName = generateBotName(botRandom);
    const deviceId = generateBotDeviceId(date, i);

    // Timestamp: spread throughout "early morning" hours.
    // Note: 00:00Z on the puzzle date is nobody's local morning now that dates are keyed
    // locally — it lands before an LA player's day opens and well into a Sydney player's.
    // Harmless: [date].ts strips `timestamp` from the public entry and ranks by score, so
    // this value is never shown or ordered on. Don't read meaning into it.
    const dateObj = new Date(date + 'T00:00:00Z');
    const timestamp = dateObj.getTime() + Math.floor(botRandom() * 6 * 60 * 60 * 1000);

    // Generate realistic emoji grid
    const emojiGrid = generateDeterministicEmojiGrid(correctCount, mistakeCount, botRandom);

    bots.push({
      displayName,
      correctCount,
      totalAttempts: correctCount + mistakeCount,
      emojiGrid,
      deviceId,
      timestamp,
    });
  }

  return bots;
}

/**
 * Lazily seed a date's leaderboard with bots. Idempotent per date, and identical for every
 * player: the count and each bot's stats derive purely from the date string, so whoever
 * fetches a given date first mints the set and everyone else — in any timezone — reads the
 * same entries back out of the sorted set.
 *
 * Creation is restricted to dates currently in play. `[date].ts` will serve any well-formed
 * date so historical boards stay readable for their 7-day TTL, but without this guard any
 * client could mint bot sets and lock keys for arbitrary dates (`9999-12-31`) just by asking
 * for them.
 */
export async function ensureBotsExist(redis: Redis, date: string): Promise<boolean> {
  if (!isDateWithinSubmissionWindow(date)) {
    return false;
  }

  const lockKey = `bots-initialized:${date}`;
  const leaderboardKey = `leaderboard:${date}`;

  // Check if bots already initialized for this date
  const alreadyInitialized = await redis.get(lockKey);
  if (alreadyInitialized) {
    return false; // Bots already exist
  }

  // Attempt to acquire lock using SETNX pattern
  const acquired = await redis.setnx(lockKey, 'initializing');
  if (!acquired) {
    // Another request is initializing, or already done
    return false;
  }

  try {
    // Generate and insert bots
    const bots = generateBotsForDate(date, await maxCorrectForDate(redis, date));

    // Add all bots to the sorted set
    for (const bot of bots) {
      // Must match submit.ts exactly, or bots and humans are ranked on different scales.
      // It previously subtracted the bot's mistake count, which humans could never vary — so
      // a bot that rolled few mistakes beat a human on the same correct count. See submit.ts.
      const score = bot.correctCount * 100;
      await redis.zadd(leaderboardKey, {
        score,
        member: JSON.stringify(bot),
      });

      // Mark bot's "device" as submitted (prevents accidental collision)
      const submissionKey = `submission:${date}:${bot.deviceId}`;
      await redis.set(submissionKey, 'bot', { ex: SUBMISSION_DEDUPE_TTL_SECONDS });
    }

    // Set TTL on leaderboard (7 days)
    await redis.expire(leaderboardKey, 7 * 24 * 60 * 60);

    // Mark initialization complete
    await redis.set(lockKey, 'done', { ex: 8 * 24 * 60 * 60 });

    return true; // Bots were created
  } catch (error) {
    // Clean up lock on error
    await redis.del(lockKey);
    throw error;
  }
}
