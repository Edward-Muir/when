import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

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

    const leaderboardKey = `leaderboard:${date}`;

    // Get top entries (highest score first)
    const entries = await redis.zrange(leaderboardKey, 0, limit - 1, {
      rev: true,
    });

    // Create public response (without deviceId)
    // Note: @upstash/redis automatically deserializes JSON, so entries are already objects
    const leaderboard: PublicLeaderboardEntry[] = entries.map((entryData, index) => {
      const entry = entryData as LeaderboardEntry;
      return {
        displayName: entry.displayName,
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
          displayName: entry.displayName,
          correctCount: entry.correctCount,
          totalAttempts: entry.totalAttempts,
          emojiGrid: entry.emojiGrid,
          rank: playerRank,
        };
      }
    }

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
