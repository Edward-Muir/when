import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';
import {
  COUNTS_KEY,
  COUNTS_TTL_SECONDS,
  LOG_KEY,
  LOG_MAX,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  SEEN_TTL_SECONDS,
  rateLimitKey,
  seenKey,
  validateReport,
} from './reportSchema';

const redis = Redis.fromEnv();

/** Node lower-cases header names, and repeated headers arrive as an array. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Picks the subject for the rate limit and hashes it, so no raw IP is ever stored.
 *
 * `x-vercel-forwarded-for` is written by Vercel's edge and cannot be set by the
 * caller, so it's preferred. When falling back to `x-forwarded-for` we take the
 * LAST hop: a client can prepend entries to that header, so the first entry is
 * attacker-controlled and would make the limit trivially bypassable.
 *
 * With no proxy headers at all (local `vercel dev`) we fall back to the device id
 * rather than a single shared bucket — a shared bucket would 429 every user at once
 * if the headers ever went missing in production.
 */
function rateLimitSubject(req: VercelRequest, deviceId: string): string {
  const raw =
    first(req.headers['x-vercel-forwarded-for']) ||
    first(req.headers['x-real-ip']) ||
    first(req.headers['x-forwarded-for']);
  const ip = raw?.split(',').pop()?.trim();
  return createHash('sha256')
    .update(ip || `device:${deviceId}`)
    .digest('hex')
    .slice(0, 32);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validation = validateReport(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { eventName, reason, deviceId, appVersion } = validation.report;

    // Rate limit. INCR returns the new value, so the first hit of a window is
    // exactly 1 — that's when the expiry gets set.
    const rlKey = rateLimitKey(rateLimitSubject(req, deviceId));
    const hits = await redis.incr(rlKey);
    if (hits === 1) {
      await redis.expire(rlKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (hits > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many reports, try again later' });
    }

    // One report per device per card. The client mirrors this in sessionStorage,
    // but that's bypassable, so the server is the real gate. `nx` makes the claim
    // atomic — a get-then-set would let a double-tap through.
    const dedupeKey = seenKey(deviceId, eventName);
    const claimed = await redis.set(dedupeKey, '1', { ex: SEEN_TTL_SECONDS, nx: true });
    if (claimed === null) {
      return res.status(409).json({ error: 'Already reported' });
    }

    try {
      // Only the event id and reason are stored — no device id, no IP, no free text.
      const pipeline = redis.pipeline();
      pipeline.zincrby(COUNTS_KEY, 1, eventName);
      pipeline.expire(COUNTS_KEY, COUNTS_TTL_SECONDS);
      pipeline.lpush(
        LOG_KEY,
        JSON.stringify({ t: Date.now(), e: eventName, r: reason, v: appVersion })
      );
      pipeline.ltrim(LOG_KEY, 0, LOG_MAX - 1);
      await pipeline.exec();
    } catch (writeError) {
      // Release the claim, or a failed write would lock this device out of
      // reporting the card for the full TTL with nothing actually recorded.
      await redis.del(dedupeKey);
      throw writeError;
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Card report submit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
