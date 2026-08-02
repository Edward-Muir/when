import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { COUNTS_KEY, LOG_KEY } from './reportSchema';

const redis = Redis.fromEnv();

interface LoggedReport {
  t: number;
  e: string;
  r: string;
  v: string;
}

interface RecentReport {
  eventName: string;
  reason: string;
  timestamp: number;
  appVersion: string;
}

const MAX_RECENT = 200;
const MAX_COUNTS = 200;

/**
 * Feeds the hidden /card-reports admin page. Returns card ids and reason ids
 * only — the page joins them against the event data client-side. Intentionally
 * unauthenticated, matching the /image-qc precedent: the data is non-personal,
 * and a secret shipped in an SPA bundle wouldn't protect it anyway.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || MAX_RECENT, MAX_RECENT);

    // withScores returns a flat [member, score, member, score, ...] array.
    const flat = (await redis.zrange(COUNTS_KEY, 0, MAX_COUNTS - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];

    const counts: { eventName: string; count: number }[] = [];
    for (let i = 0; i + 1 < flat.length; i += 2) {
      counts.push({ eventName: String(flat[i]), count: Number(flat[i + 1]) });
    }

    const rawLog = (await redis.lrange(LOG_KEY, 0, limit - 1)) as (string | LoggedReport)[];
    const recent: RecentReport[] = [];
    for (const entry of rawLog) {
      // The Upstash SDK auto-parses JSON-looking values, so entries arrive as
      // objects on some paths and strings on others — handle both.
      let parsed: LoggedReport | null = null;
      if (typeof entry === 'string') {
        try {
          parsed = JSON.parse(entry) as LoggedReport;
        } catch {
          parsed = null;
        }
      } else if (entry && typeof entry === 'object') {
        parsed = entry;
      }
      if (!parsed || typeof parsed.e !== 'string') continue;
      recent.push({
        eventName: parsed.e,
        reason: typeof parsed.r === 'string' ? parsed.r : 'other',
        timestamp: typeof parsed.t === 'number' ? parsed.t : 0,
        appVersion: typeof parsed.v === 'string' ? parsed.v : '',
      });
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ counts, recent });
  } catch (error) {
    console.error('Card report list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
