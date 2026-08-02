/**
 * Shared constants and validation for the card bug-report endpoints.
 *
 * Not a route (no default export) — same arrangement as
 * api/leaderboard/botGeneration.ts, which is likewise a shared lib living under api/.
 *
 * The reason ids are duplicated in src/utils/cardReport.ts rather than imported
 * across the src/api boundary (separate tsconfigs; importing src would drag
 * browser code into the function). src/utils/cardReport.test.ts asserts the two
 * lists stay in sync. Same precedent as the mulberry32 PRNG duplicated in
 * api/leaderboard/submit.ts.
 */

import { createHash, timingSafeEqual } from 'crypto';

export const REPORT_REASON_IDS = ['wrong-year', 'wrong-image', 'bad-description', 'other'];

/** Sorted set of per-card report counts. Drives the "most reported" view. */
export const COUNTS_KEY = 'cardreport:counts';
/** Capped list of the most recent reports. */
export const LOG_KEY = 'cardreport:log';
/** Keep at most this many entries in LOG_KEY. */
export const LOG_MAX = 1000;

/** 90 days — refreshed on every write, so the counts key self-cleans if reports stop. */
export const COUNTS_TTL_SECONDS = 90 * 24 * 60 * 60;
/** 30 days — how long one device is blocked from re-reporting the same card. */
export const SEEN_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Per-IP rate limit. Set generously: carrier CGNAT and office/school wifi put many
 * genuine players behind one address, and blocking them would be invisible to us.
 * The per-device-per-card dedup is the real anti-spam gate; this only stops floods.
 */
export const RATE_LIMIT_MAX = 20;
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export function seenKey(deviceId: string, eventName: string): string {
  return `cardreport:seen:${deviceId}:${eventName}`;
}

export function rateLimitKey(ipHash: string): string {
  return `cardreport:rl:${ipHash}`;
}

export type AdminAuthResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Compares two secrets without leaking their contents through timing. Digesting
 * first means a wrong-length guess is a clean `false` rather than the throw
 * timingSafeEqual raises on mismatched buffer lengths.
 */
function secretsMatch(a: string, b: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Decides whether a request may read the stored reports.
 *
 * Fails closed in production: with no key configured the endpoint refuses rather
 * than serving reports to anyone. Outside production it allows through, so
 * `vercel dev` works with no setup.
 */
export function authorizeAdminRead(options: {
  supplied: string | undefined;
  configured: string | undefined;
  isProduction: boolean;
}): AdminAuthResult {
  const { supplied, configured, isProduction } = options;

  if (!configured) {
    return isProduction
      ? { ok: false, status: 503, error: 'Reports admin key not configured' }
      : { ok: true };
  }
  if (!supplied || !secretsMatch(supplied, configured)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}

/**
 * Event ids in public/events/ are kebab-case, e.g. "wwi-end". Mostly ASCII, but a
 * handful carry accents ("chimú-kingdom", "mining-mercury-potosí"), so this has to
 * be Unicode-aware — an ASCII-only class would make those cards unreportable.
 * Longest id in the current dataset is 45 chars.
 */
const EVENT_NAME_PATTERN = /^[\p{L}\p{N}._-]{1,64}$/u;
/** getDeviceFingerprint() returns the first 32 chars of a SHA-256 hex digest. */
const DEVICE_ID_PATTERN = /^[a-f0-9]{32}$/;

export interface ReportPayload {
  eventName?: unknown;
  reason?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
}

export interface ValidReport {
  eventName: string;
  reason: string;
  deviceId: string;
  appVersion: string;
}

export type ValidationResult =
  | { valid: true; report: ValidReport }
  | { valid: false; error: string };

/** Mirrors sanitizeDisplayName in api/leaderboard/submit.ts. */
function sanitizeVersion(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 20).replace(/[<>]/g, '') : '';
}

export function validateReport(body: ReportPayload | undefined): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Missing request body' };
  }

  const { eventName, reason, deviceId } = body;

  if (typeof eventName !== 'string' || !EVENT_NAME_PATTERN.test(eventName)) {
    return { valid: false, error: 'Invalid eventName' };
  }
  if (typeof reason !== 'string' || REPORT_REASON_IDS.indexOf(reason) === -1) {
    return { valid: false, error: 'Invalid reason' };
  }
  if (typeof deviceId !== 'string' || !DEVICE_ID_PATTERN.test(deviceId)) {
    return { valid: false, error: 'Invalid deviceId' };
  }

  return {
    valid: true,
    report: { eventName, reason, deviceId, appVersion: sanitizeVersion(body.appVersion) },
  };
}
