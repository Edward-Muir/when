import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { ensureBotsExist } from './botGeneration';
import { normalizeDisplayName, safeDisplayName } from './nameFilter';
import { resolveLimit } from './limits';

const redis = Redis.fromEnv();

interface LeaderboardEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  deviceId: string;
  timestamp: number;
}

// Only what the board renders. `emojiGrid` and `totalAttempts` are stored on the entry and
// used by submit-side validation, but neither reaches the client: no surface has ever shown
// another player's grid (the share sheet builds its own from local placement history), and
// `totalAttempts` was only ever used to derive a mistake count, which is the same number for
// every player — see the scoring note in submit.ts. Both shipped on every 15s poll.
interface PublicLeaderboardEntry {
  displayName: string;
  correctCount: number;
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
    const limit = resolveLimit(req.query.limit);

    // Validate date format (YYYY-MM-DD)
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Ensure bots exist for this date (lazy initialization)
    await ensureBotsExist(redis, date);

    const leaderboardKey = `leaderboard:${date}`;

    // Locating the caller means scanning the whole board, so when a deviceId is supplied
    // (always, from the app) one full ZRANGE serves everything: the rows, the total, and
    // the player's position. Reading the entire set used to be an extra command on top of
    // a limited ZRANGE and a ZCARD; folding them together makes serving the *whole* board
    // cheaper than serving the old top-50 was. Upstash bills per command and this endpoint
    // is public and polled every 15s per open client, so the count matters.
    const needsAll = Boolean(deviceId);
    const rows = await redis.zrange(leaderboardKey, 0, needsAll ? -1 : limit - 1, {
      rev: true,
    });

    const totalPlayers = needsAll ? rows.length : await redis.zcard(leaderboardKey);
    const entries = rows.slice(0, limit);

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

    const toPublicEntry = (entry: LeaderboardEntry, rank: number): PublicLeaderboardEntry => ({
      displayName: displayNameFor(entry),
      correctCount: entry.correctCount,
      rank,
    });

    const leaderboard: PublicLeaderboardEntry[] = entries.map((entryData, index) =>
      toPublicEntry(entryData as LeaderboardEntry, index + 1)
    );

    // Find the caller's rank in the rows already in hand — no second round trip.
    let playerRank: number | null = null;
    let playerEntry: PublicLeaderboardEntry | null = null;

    if (needsAll) {
      const foundIndex = rows.findIndex(
        (entryData) => (entryData as LeaderboardEntry).deviceId === deviceId
      );

      if (foundIndex !== -1) {
        playerRank = foundIndex + 1;
        playerEntry = toPublicEntry(rows.at(foundIndex) as LeaderboardEntry, playerRank);
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
      // `totalPlayers` is the true count (bots included) while `leaderboard` is capped at
      // `limit`, so the two can disagree. Say so explicitly rather than letting the UI
      // imply it is showing everyone.
      truncated: leaderboard.length < totalPlayers,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
