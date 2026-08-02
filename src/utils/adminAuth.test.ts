import { authorizeAdminRead } from '../../api/card-reports/reportSchema';

const KEY = 'a-long-enough-secret-value';

describe('authorizeAdminRead', () => {
  it('allows a request carrying the right key', () => {
    expect(authorizeAdminRead({ supplied: KEY, configured: KEY, isProduction: true })).toEqual({
      ok: true,
    });
  });

  it('rejects the wrong key', () => {
    expect(
      authorizeAdminRead({
        supplied: 'wrong-but-same-length!!!!!',
        configured: KEY,
        isProduction: true,
      })
    ).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
  });

  // timingSafeEqual throws on mismatched buffer lengths, so this would be a 500
  // rather than a 401 if the values weren't digested to a fixed width first.
  it.each([
    ['a much longer guess than the configured key', 'x'.repeat(200)],
    ['a much shorter guess', 'x'],
  ])('rejects %s without throwing', (_label, supplied) => {
    expect(() =>
      authorizeAdminRead({ supplied, configured: KEY, isProduction: true })
    ).not.toThrow();
    expect(authorizeAdminRead({ supplied, configured: KEY, isProduction: true }).ok).toBe(false);
  });

  it.each([
    ['no key at all', undefined],
    ['an empty key', ''],
  ])('rejects a request with %s', (_label, supplied) => {
    expect(authorizeAdminRead({ supplied, configured: KEY, isProduction: true })).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });

  // Fail closed: an unconfigured production deploy must not serve reports to
  // anyone who asks. 503 rather than 401 so the cause is obvious.
  it('refuses in production when no key is configured', () => {
    expect(
      authorizeAdminRead({ supplied: KEY, configured: undefined, isProduction: true })
    ).toEqual({ ok: false, status: 503, error: 'Reports admin key not configured' });
  });

  it('refuses in production when the configured key is empty', () => {
    expect(authorizeAdminRead({ supplied: KEY, configured: '', isProduction: true }).ok).toBe(
      false
    );
  });

  // ...but `vercel dev` should work with no setup.
  it('allows an unconfigured non-production environment', () => {
    expect(
      authorizeAdminRead({ supplied: undefined, configured: undefined, isProduction: false })
    ).toEqual({ ok: true });
  });

  it('still enforces a configured key outside production', () => {
    expect(
      authorizeAdminRead({ supplied: undefined, configured: KEY, isProduction: false }).ok
    ).toBe(false);
  });
});
