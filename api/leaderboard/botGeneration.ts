import { Redis } from '@upstash/redis';

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
const ADJECTIVES = [
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

const ANIMALS = [
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

function generateBotsForDate(date: string): BotEntry[] {
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

    // Generate correctCount using Poisson distribution (mean 6)
    // Clamp to 0-20 range (reasonable for game)
    const correctCount = Math.min(20, Math.max(0, samplePoisson(POISSON_MEAN, botRandom)));

    // Mistakes: 1-5 (game ends at 5 mistakes)
    // Weight toward higher mistake counts (more realistic)
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

    // Timestamp: spread throughout "early morning" hours
    // Start of day + 0-6 hours in milliseconds
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

export async function ensureBotsExist(redis: Redis, date: string): Promise<boolean> {
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
    const bots = generateBotsForDate(date);

    // Add all bots to the sorted set
    for (const bot of bots) {
      const score = bot.correctCount * 100 - (bot.totalAttempts - bot.correctCount);
      await redis.zadd(leaderboardKey, {
        score,
        member: JSON.stringify(bot),
      });

      // Mark bot's "device" as submitted (prevents accidental collision)
      const submissionKey = `submission:${date}:${bot.deviceId}`;
      await redis.set(submissionKey, 'bot', { ex: 25 * 60 * 60 });
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
