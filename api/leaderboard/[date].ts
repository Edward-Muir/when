import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { ensureBotsExist } from './botGeneration';
import { normalizeDisplayName, safeDisplayName } from './nameFilter';

const redis = Redis.fromEnv();

interface LeaderboardEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  deviceId: string;
  timestamp: number;
}

interface PublicLeaderboardEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  rank: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    const deviceId = req.query.deviceId as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // Validate date format (YYYY-MM-DD)
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Ensure bots exist for this date (lazy initialization)
    await ensureBotsExist(redis, date);

    const leaderboardKey = `leaderboard:${date}`;

    // Get top entries (highest score first)
    const entries = await redis.zrange(leaderboardKey, 0, limit - 1, {
      rev: true,
    });

    // Create public response (without deviceId)
    // Note: @upstash/redis automatically deserializes JSON, so entries are already objects
    //
    // Names are filtered again here, not just on submit. The sorted set's member IS the
    // JSON entry, so renaming a stored entry would mean ZREM of the exact old blob plus
    // a re-ZADD. Masking on read cleans entries submitted before the filter existed, and
    // makes any later addition to nameFilter's lists apply to history on the next fetch.
    // Ranking is untouched — it comes from the sorted-set index, not from the name.
    //
    // A player always sees the name they typed, even once it has been swapped for everyone
    // else. Being shown the replacement tells you that you have been filtered, which is a
    // feedback loop for probing the filter — the same reason submit.ts still returns 200 on
    // a blocked name. deviceId is an attacker-controlled query param, but it is compared
    // against the entry's own deviceId, so the only name it can unmask is the caller's own.
    // Safe to vary the body per device because Cache-Control below is no-store.
    const displayNameFor = (entry: LeaderboardEntry) =>
      entry.deviceId === deviceId
        ? normalizeDisplayName(entry.displayName) ||
          safeDisplayName(entry.displayName, entry.deviceId)
        : safeDisplayName(entry.displayName, entry.deviceId);

    const leaderboard: PublicLeaderboardEntry[] = entries.map((entryData, index) => {
      const entry = entryData as LeaderboardEntry;
      return {
        displayName: displayNameFor(entry),
        correctCount: entry.correctCount,
        totalAttempts: entry.totalAttempts,
        emojiGrid: entry.emojiGrid,
        rank: index + 1,
      };
    });

    // Get total player count
    const totalPlayers = await redis.zcard(leaderboardKey);

    // If deviceId provided, find player's rank and entry
    let playerRank: number | null = null;
    let playerEntry: PublicLeaderboardEntry | null = null;

    if (deviceId) {
      // Get all entries to find the player
      const allEntries = await redis.zrange(leaderboardKey, 0, -1, {
        rev: true,
      });

      const foundIndex = allEntries.findIndex(
        (entryData) => (entryData as LeaderboardEntry).deviceId === deviceId
      );

      if (foundIndex !== -1) {
        const entry = allEntries.at(foundIndex) as LeaderboardEntry;
        playerRank = foundIndex + 1;
        playerEntry = {
          displayName: displayNameFor(entry),
          correctCount: entry.correctCount,
          totalAttempts: entry.totalAttempts,
          emojiGrid: entry.emojiGrid,
          rank: playerRank,
        };
      }
    }

    // Defeat any intermediate caches (WKWebView, browser HTTP cache, CDN) so the
    // leaderboard always reflects the latest submissions.
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    return res.status(200).json({
      date,
      leaderboard,
      totalPlayers,
      playerRank,
      playerEntry,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
