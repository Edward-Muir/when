import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { safeDisplayName } from './nameFilter';
import { isDateWithinSubmissionWindow, SUBMISSION_DEDUPE_TTL_SECONDS } from './dateWindow';
import { DAILY_HAND_SIZE } from './handSize';

const redis = Redis.fromEnv();

// Category type matching the frontend (keep in sync with src/types/index.ts)
type Category =
  | 'empires'
  | 'revolution'
  | 'architecture'
  | 'writing'
  | 'invention'
  | 'figures'
  | 'media'
  | 'craft'
  | 'diplomacy'
  | 'disasters'
  | 'commerce'
  | 'law'
  | 'agriculture'
  | 'warfare'
  | 'science'
  | 'trade'
  | 'migration'
  | 'art'
  | 'medicine'
  | 'nature';

// Order must match src/types/index.ts — getDailyTheme indexes into this array.
const ALL_CATEGORIES: Category[] = [
  'empires',
  'revolution',
  'architecture',
  'writing',
  'invention',
  'figures',
  'media',
  'craft',
  'diplomacy',
  'disasters',
  'commerce',
  'law',
  'agriculture',
  'warfare',
  'science',
  'trade',
  'migration',
  'art',
  'medicine',
  'nature',
];

interface DailyTheme {
  type: 'category' | 'all';
  value: Category | null;
}

// Seeded random number generator (mulberry32) - must match frontend
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string to numeric seed - must match frontend
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get daily theme from seed - must match src/utils/dailyTheme.ts exactly, including the
// number and order of random() calls (~50% "Everything", else a random single category).
function getDailyTheme(seed: string): DailyTheme {
  const random = seededRandom(stringToSeed(seed));

  if (random() < 0.5) {
    return { type: 'all', value: null };
  }

  const idx = Math.floor(random() * ALL_CATEGORIES.length);
  const category = ALL_CATEGORIES.at(idx) ?? ALL_CATEGORIES[0];
  return { type: 'category', value: category };
}

// Get display name for category - must match src/utils/gameLogic.ts (capitalize-first).
function getCategoryDisplayName(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Get theme display name - must match frontend
function getThemeDisplayName(theme: DailyTheme): string {
  if (theme.type === 'all') {
    return 'Everything';
  }
  return getCategoryDisplayName(theme.value as Category);
}

interface SubmissionPayload {
  date: string;
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  deviceId: string;
  theme: string;
}

interface LeaderboardEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  deviceId: string;
  timestamp: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  greenCount?: number;
  redCount?: number;
}

function hasRequiredFields(body: SubmissionPayload): boolean {
  return Boolean(
    body.date &&
    body.deviceId &&
    typeof body.correctCount === 'number' &&
    typeof body.totalAttempts === 'number' &&
    body.emojiGrid
  );
}

function validateEmojiGrid(
  body: SubmissionPayload
): { greenCount: number; redCount: number } | null {
  const greenCount = (body.emojiGrid.match(/🟩/g) || []).length;
  const redCount = (body.emojiGrid.match(/🟥/g) || []).length;

  // A finished daily has exactly DAILY_HAND_SIZE mistakes — the hand empties one card per
  // wrong placement. This stays a range rather than an equality check because a correct
  // placement only redraws if the deck still has a card (src/utils/placementLogic.ts), so
  // exhausting the day's themed pool would shrink the hand without a mistake and end the game
  // early. That needs ~100 correct placements against a realistic best of ~30, but rejecting a
  // legitimate run is worse than accepting a short one.
  if (redCount < 0 || redCount > DAILY_HAND_SIZE) return null;
  if (body.totalAttempts !== body.correctCount + redCount) return null;
  if (greenCount + redCount !== body.totalAttempts) return null;
  if (greenCount !== body.correctCount) return null;

  return { greenCount, redCount };
}

function validateSubmission(body: SubmissionPayload): ValidationResult {
  if (!hasRequiredFields(body)) {
    return { valid: false, error: 'Missing required fields' };
  }

  // A window, not an exact UTC match: the puzzle is keyed on the player's local date, so
  // one date string is in play for ~50 hours across all timezones. See dateWindow.ts.
  if (!isDateWithinSubmissionWindow(body.date)) {
    return { valid: false, error: 'Invalid date - must be today' };
  }

  if (body.correctCount < 0) {
    return { valid: false, error: 'Invalid correctCount' };
  }

  const emojiResult = validateEmojiGrid(body);
  if (!emojiResult) {
    return { valid: false, error: 'Invalid emoji grid or counts' };
  }

  const expectedTheme = getThemeDisplayName(getDailyTheme(body.date));
  if (body.theme && body.theme !== expectedTheme) {
    return { valid: false, error: 'Invalid theme' };
  }

  return { valid: true, greenCount: emojiResult.greenCount, redCount: emojiResult.redCount };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: SubmissionPayload = req.body;

    // Validate submission
    const validation = validateSubmission(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check if device already submitted today
    const submissionKey = `submission:${body.date}:${body.deviceId}`;
    const existingSubmission = await redis.get(submissionKey);

    if (existingSubmission) {
      return res.status(409).json({ error: 'Already submitted today' });
    }

    // Create leaderboard entry. A name that fails the filter is silently swapped for
    // a generated one rather than rejected, so the raw text never reaches Redis and
    // the submitter gets no signal to iterate against the filter with.
    const entry: LeaderboardEntry = {
      displayName: safeDisplayName(body.displayName, body.deviceId),
      correctCount: body.correctCount,
      totalAttempts: body.totalAttempts,
      emojiGrid: body.emojiGrid,
      deviceId: body.deviceId,
      timestamp: Date.now(),
    };

    // Rank on correct count alone.
    //
    // The score used to subtract the mistake count, described as a tie-break. It never was
    // one: the daily deals a hand of DAILY_HAND_SIZE and a wrong placement discards without
    // drawing a replacement, so the game ends precisely when the hand empties and **every
    // finished daily has the same number of mistakes**. Subtracting it shifted every score
    // by the same constant and ordered nothing. Don't reintroduce it — mistakes carry no
    // information about how well someone did here.
    //
    // Equal correct counts therefore genuinely tie, and Redis orders them by the JSON member
    // string. Any real tie-break has to be a new term (time of submission, say), not this one.
    const score = body.correctCount * 100;

    // Store in sorted set
    const leaderboardKey = `leaderboard:${body.date}`;
    await redis.zadd(leaderboardKey, {
      score,
      member: JSON.stringify(entry),
    });

    // Mark device as submitted, for longer than the date stays submittable
    await redis.set(submissionKey, '1', { ex: SUBMISSION_DEDUPE_TTL_SECONDS });

    // Set TTL on leaderboard (7 days)
    await redis.expire(leaderboardKey, 7 * 24 * 60 * 60);

    // Get player's rank
    const rank = await redis.zrevrank(leaderboardKey, JSON.stringify(entry));
    const totalPlayers = await redis.zcard(leaderboardKey);

    return res.status(200).json({
      success: true,
      rank: rank !== null ? rank + 1 : null,
      totalPlayers,
    });
  } catch (error) {
    console.error('Leaderboard submit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
