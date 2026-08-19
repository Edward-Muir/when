import { createHash, timingSafeEqual } from 'crypto';

/**
 * Shared maintainer-endpoint gate.
 *
 * Lifted out of card-reports/reportSchema.ts when the themes endpoints needed the same
 * check. Extracted rather than copied: two implementations of a secret comparison are two
 * chances to get the timing-safe part wrong, and the house rule is that deleting one copy
 * beats a comment asking future readers to keep them in step.
 */

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
 * Decides whether a request may use a maintainer-only endpoint.
 *
 * Fails closed in production: with no key configured the endpoint refuses rather
 * than serving to anyone. Outside production it allows through, so `vercel dev`
 * works with no setup.
 */
export function authorizeAdmin(options: {
  supplied: string | undefined;
  configured: string | undefined;
  isProduction: boolean;
}): AdminAuthResult {
  const { supplied, configured, isProduction } = options;

  if (!configured) {
    return isProduction
      ? { ok: false, status: 503, error: 'Admin key not configured' }
      : { ok: true };
  }
  if (!supplied || !secretsMatch(supplied, configured)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}
