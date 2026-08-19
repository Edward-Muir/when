/**
 * How many leaderboard rows `[date].ts` will return.
 *
 * A typical day is ~35 real submissions plus 7-13 bots, so the default comfortably covers
 * the whole board and the ceiling exists only to bound a pathological day.
 *
 * "Return everything" stays the right call up to roughly 250-300 entries. Past that the
 * per-poll payload (every open client refetches every 15s) and the per-row name filtering
 * in `safeDisplayName` start to matter. The degradation order when that day comes is:
 * lean on the `truncated` flag to say so honestly in the UI first, and only then reach for
 * windowing on the client. Don't add shared/CDN caching to make a bigger payload cheaper —
 * the response body varies per device by design (see the shadowban note in [date].ts).
 */
export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

/**
 * Clamp a caller-supplied `?limit=` into [1, MAX_LIMIT], falling back to DEFAULT_LIMIT for
 * anything missing, non-numeric or non-positive.
 */
export function resolveLimit(raw: unknown): number {
  const parsed = parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}
