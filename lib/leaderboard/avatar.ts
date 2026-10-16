/**
 * The avatar a score carries, as the client sends it: an animal id such as `"platypus"`.
 *
 * Format only, deliberately. The animal list lives in src/data/avatars.json and grows with the
 * art; a server-side copy would drift and start dropping honest picks, the same failure
 * submit.ts describes for themes. Nothing here needs the list: an id this check passes but no
 * client knows renders as the name-derived avatar instead (`parseAvatar` in
 * src/utils/avatar.ts), so the worst a forged value can do is be ignored.
 *
 * Anything else is dropped rather than rejected, so an old client or a bad value still gets
 * its score on the board.
 */
const AVATAR_PATTERN = /^[a-z0-9-]{1,24}$/;

export function sanitizeAvatar(raw: unknown): string | undefined {
  return typeof raw === 'string' && AVATAR_PATTERN.test(raw) ? raw : undefined;
}
