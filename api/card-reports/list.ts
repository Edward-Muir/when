import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { COUNTS_KEY, LOG_KEY, authorizeAdminRead } from '../../lib/card-reports/reportSchema';

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
 * only — the page joins them against the event data client-side.
 *
 * Gated on the REPORTS_ADMIN_KEY shared secret (the only process.env read in
 * api/ — everything else goes through Redis.fromEnv()). Not because the data is
 * sensitive, but because Upstash bills per command: an open GET here runs a
 * ZRANGE plus an LRANGE for any stranger who cares to loop it. The check
 * therefore happens before any Redis call, so a rejected request costs nothing.
 *
 * The POST endpoint stays public — that's the player-facing write path.
 */
/** zrange withScores yields a flat [member, score, member, score, …] array. */
function toCounts(flat: (string | number)[]): { eventName: string; count: number }[] {
  const counts: { eventName: string; count: number }[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    // .at() rather than [i] — indexed access trips security/detect-object-injection.
    counts.push({ eventName: String(flat.at(i)), count: Number(flat.at(i + 1)) });
  }
  return counts;
}

/**
 * The Upstash SDK auto-parses JSON-looking values, so log entries come back as
 * objects on some paths and raw strings on others. Returns null for anything
 * unusable so a single bad row can't break the whole listing.
 */
function parseLogEntry(entry: string | LoggedReport): RecentReport | null {
  let parsed: LoggedReport | null = null;
  if (typeof entry === 'string') {
    try {
      parsed = JSON.parse(entry) as LoggedReport;
    } catch {
      return null;
    }
  } else if (entry && typeof entry === 'object') {
    parsed = entry;
  }
  if (!parsed || typeof parsed.e !== 'string') return null;
  return {
    eventName: parsed.e,
    reason: typeof parsed.r === 'string' ? parsed.r : 'other',
    timestamp: typeof parsed.t === 'number' ? parsed.t : 0,
    appVersion: typeof parsed.v === 'string' ? parsed.v : '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const suppliedKey = (req.headers['x-admin-key'] as string) || (req.query.key as string);
  const auth = authorizeAdminRead({
    supplied: suppliedKey,
    configured: process.env.REPORTS_ADMIN_KEY,
    isProduction: process.env.VERCEL_ENV === 'production',
  });
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || MAX_RECENT, MAX_RECENT);

    // withScores returns a flat [member, score, member, score, ...] array.
    const flat = (await redis.zrange(COUNTS_KEY, 0, MAX_COUNTS - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];

    const counts = toCounts(flat);

    const rawLog = (await redis.lrange(LOG_KEY, 0, limit - 1)) as (string | LoggedReport)[];
    const recent = rawLog
      .map(parseLogEntry)
      .filter((entry): entry is RecentReport => entry !== null);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(200).json({ counts, recent });
  } catch (error) {
    console.error('Card report list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
