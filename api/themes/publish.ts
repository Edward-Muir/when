import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { authorizeAdmin } from '../adminAuth';
import {
  CALENDAR_KEY,
  EMPTY_CALENDAR,
  ThemeCalendar,
  scheduledDates,
  validateCalendar,
} from './schema';

const redis = Redis.fromEnv();

interface PublishPayload {
  /** The whole calendar, not a patch — the caller does the merge and sends the result. */
  calendar?: ThemeCalendar;
  /** Version the caller read. Rejected if the stored document has moved on since. */
  baseVersion?: number;
  /** Publish a date that has already opened. Splits the day; see schema.ts. */
  force?: boolean;
}

/**
 * Writes the curated-theme calendar. Maintainer-only.
 *
 * Normally reached through the publish-theme GitHub Action, so the shared secret lives in
 * GitHub Secrets rather than anywhere a session or a laptop can leak it. The Action also
 * runs the catalogue-aware half of validation (do these slugs exist, is the theme spread
 * across the timeline) with the repo checked out, which this function cannot do — api/ is a
 * separate tsconfig project and the events JSON is served statically, not bundled.
 *
 * Whole-document replace rather than a patch: the calendar is a few kilobytes, and one
 * atomic SET removes any question about partially-applied writes. `baseVersion` makes the
 * read-modify-write safe if two publishes ever race.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Before any Redis call, so a rejected request costs nothing — same reasoning as
  // api/card-reports/list.ts.
  const auth = authorizeAdmin({
    supplied: readKey(req),
    configured: process.env.THEMES_ADMIN_KEY,
    isProduction: process.env.VERCEL_ENV === 'production',
  });
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const body = (req.body ?? {}) as PublishPayload;
  const incoming = body.calendar;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Missing calendar' });
  }

  try {
    const stored = (await redis.get<ThemeCalendar>(CALENDAR_KEY)) ?? EMPTY_CALENDAR;

    if (typeof body.baseVersion === 'number' && body.baseVersion !== stored.version) {
      return res.status(409).json({
        error: `Calendar moved on: you read version ${body.baseVersion}, stored is ${stored.version}. Re-read and retry.`,
      });
    }

    const { ok, errors } = validateCalendar(incoming, {
      now: Date.now(),
      force: body.force === true,
      previousDates: scheduledDates(stored),
    });
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });

    const next: ThemeCalendar = { version: stored.version + 1, themes: incoming.themes };
    await redis.set(CALENDAR_KEY, next);

    return res.status(200).json({ version: next.version, themes: next.themes.length });
  } catch (error) {
    console.error('Failed to publish theme calendar', error);
    return res.status(500).json({ error: 'Failed to publish' });
  }
}

/** Accepts the key as a header; never a query string, which lands in access logs. */
function readKey(req: VercelRequest): string | undefined {
  const header = req.headers['x-admin-key'];
  return Array.isArray(header) ? header.at(0) : header;
}
