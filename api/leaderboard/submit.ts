import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Category type matching the frontend
type Category =
  | 'conflict'
  | 'disasters'
  | 'exploration'
  | 'cultural'
  | 'infrastructure'
  | 'diplomatic';

const ALL_CATEGORIES: Category[] = [
  'conflict',
  'disasters',
  'exploration',
  'cultural',
  'infrastructure',
  'diplomatic',
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

// Get daily theme from seed - must match frontend logic exactly
function getDailyTheme(seed: string): DailyTheme {
  const random = seededRandom(stringToSeed(seed));
  const roll = Math.floor(random() * 8);

  if (roll >= 6) {
    return { type: 'all', value: null };
  } else {
    const category = ALL_CATEGORIES.at(roll) ?? ALL_CATEGORIES[0];
    return { type: 'category', value: category };
  }
}

// Get display name for category
function getCategoryDisplayName(category: Category): string {
  switch (category) {
    case 'conflict':
      return 'Conflict';
    case 'disasters':
      return 'Disasters';
    case 'exploration':
      return 'Exploration';
    case 'cultural':
      return 'Cultural';
    case 'infrastructure':
      return 'Infrastructure';
    case 'diplomatic':
      return 'Diplomatic';
  }
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

  // Mistakes must be 0-5 (game ends when hand empties, starting with 5 cards)
  if (redCount < 0 || redCount > 5) return null;
  if (body.totalAttempts !== body.correctCount + redCount) return null;
  if (greenCount + redCount !== body.totalAttempts) return null;
  if (greenCount !== body.correctCount) return null;

  return { greenCount, redCount };
}

function validateSubmission(body: SubmissionPayload): ValidationResult {
  if (!hasRequiredFields(body)) {
    return { valid: false, error: 'Missing required fields' };
  }

  const today = new Date().toISOString().split('T')[0];
  if (body.date !== today) {
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

function sanitizeDisplayName(name: string | undefined): string {
  return (name || '').trim().slice(0, 20).replace(/[<>]/g, '') || 'Anonymous';
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

    const mistakeCount = validation.redCount ?? 0;

    // Check if device already submitted today
    const submissionKey = `submission:${body.date}:${body.deviceId}`;
    const existingSubmission = await redis.get(submissionKey);

    if (existingSubmission) {
      return res.status(409).json({ error: 'Already submitted today' });
    }

    // Create leaderboard entry
    const entry: LeaderboardEntry = {
      displayName: sanitizeDisplayName(body.displayName),
      correctCount: body.correctCount,
      totalAttempts: body.totalAttempts,
      emojiGrid: body.emojiGrid,
      deviceId: body.deviceId,
      timestamp: Date.now(),
    };

    // Calculate score: correctCount * 100 - mistakeCount
    const score = body.correctCount * 100 - mistakeCount;

    // Store in sorted set
    const leaderboardKey = `leaderboard:${body.date}`;
    await redis.zadd(leaderboardKey, {
      score,
      member: JSON.stringify(entry),
    });

    // Mark device as submitted (TTL: 25 hours for timezone edge cases)
    await redis.set(submissionKey, '1', { ex: 25 * 60 * 60 });

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
