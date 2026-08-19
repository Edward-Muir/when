import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { CALENDAR_KEY, EMPTY_CALENDAR, ThemeCalendar } from '../../lib/themes/schema';

const redis = Redis.fromEnv();

/**
 * The curated-theme calendar, read by every client at boot.
 *
 * Public and unauthenticated: it is the same handful of kilobytes for everyone and it
 * describes puzzles that are about to be public anyway.
 *
 * Shared-cached ON PURPOSE, which is the opposite of api/leaderboard/[date].ts. That
 * response varies per device (see the shadowban note there) so caching it would leak one
 * player's view to another; this one is byte-identical for every caller, so the CDN can
 * absorb essentially all reads and Upstash command volume stays flat no matter how many
 * people are playing. Do not "fix" one of these to match the other.
 *
 * stale-while-revalidate is generous because a stale calendar is nearly harmless: dates
 * cannot be written once they have opened, so the worst case is a client learning about a
 * future theme a few minutes late.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stored = await redis.get<ThemeCalendar>(CALENDAR_KEY);
    const calendar = stored ?? EMPTY_CALENDAR;

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json(calendar);
  } catch (error) {
    console.error('Failed to read theme calendar', error);
    // An empty calendar means "no curated day", which is the safe answer: every date falls
    // through to the seeded category theme, exactly as before curated themes existed.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(EMPTY_CALENDAR);
  }
}
