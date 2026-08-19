import { REPORT_REASONS, hasReportedCard, markCardReported, submitCardReport } from './cardReport';
import { REPORT_REASON_IDS, validateReport } from '../../lib/card-reports/reportSchema';
import { getDeviceFingerprint } from './deviceFingerprint';

jest.mock('./deviceFingerprint', () => ({ getDeviceFingerprint: jest.fn() }));

const DEVICE_ID = 'a'.repeat(32);
const KEY = 'when-reported-cards';

function mockFetchStatus(status: number) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status });
}

beforeEach(() => {
  sessionStorage.clear();
  // CRA's Jest config sets resetMocks, so implementations have to be re-applied here.
  (getDeviceFingerprint as jest.Mock).mockResolvedValue(DEVICE_ID);
});

describe('REPORT_REASONS', () => {
  // The ids are duplicated client/server on purpose (separate tsconfigs), so
  // this is the thing keeping the two lists honest.
  it('matches the ids the server accepts', () => {
    expect(REPORT_REASONS.map((r) => r.id).sort()).toEqual([...REPORT_REASON_IDS].sort());
  });

  it('gives every reason a human label', () => {
    for (const reason of REPORT_REASONS) {
      expect(reason.label.length).toBeGreaterThan(0);
    }
  });
});

describe('server-side validation', () => {
  const valid = { eventName: 'wwi-end', reason: 'wrong-year', deviceId: DEVICE_ID };

  it('accepts a well-formed report', () => {
    expect(validateReport(valid).valid).toBe(true);
  });

  // A few real ids carry accents. An ASCII-only pattern would 400 on these,
  // making those cards silently unreportable.
  it.each(['chimú-kingdom', 'mining-mercury-potosí', 'chimú-chan-chan-peak'])(
    'accepts the accented event id %s',
    (eventName) => {
      expect(validateReport({ ...valid, eventName }).valid).toBe(true);
    }
  );

  it('rejects an unknown reason', () => {
    expect(validateReport({ ...valid, reason: 'i-just-dont-like-it' }).valid).toBe(false);
  });

  it('rejects a malformed device id', () => {
    expect(validateReport({ ...valid, deviceId: 'nope' }).valid).toBe(false);
  });

  it.each([
    ['an over-long id', 'x'.repeat(65)],
    ['an id with a slash', 'wwi-end/../admin'],
    ['an id with a colon (Redis key separator)', 'wwi:end'],
    ['an empty id', ''],
  ])('rejects %s', (_label, eventName) => {
    expect(validateReport({ ...valid, eventName }).valid).toBe(false);
  });

  it('rejects a missing body', () => {
    expect(validateReport(undefined).valid).toBe(false);
  });

  it('defaults appVersion to empty rather than failing', () => {
    const result = validateReport(valid);
    expect(result.valid && result.report.appVersion).toBe('');
  });
});

describe('hasReportedCard / markCardReported', () => {
  it('remembers a reported card', () => {
    expect(hasReportedCard('wwi-end')).toBe(false);
    markCardReported('wwi-end');
    expect(hasReportedCard('wwi-end')).toBe(true);
  });

  it('does not leak between cards', () => {
    markCardReported('wwi-end');
    expect(hasReportedCard('moon-landing')).toBe(false);
  });

  it('does not duplicate an already-reported card', () => {
    markCardReported('wwi-end');
    markCardReported('wwi-end');
    expect(JSON.parse(sessionStorage.getItem(KEY) as string)).toEqual(['wwi-end']);
  });

  it('recovers from a corrupt stored value', () => {
    sessionStorage.setItem(KEY, 'not json');
    expect(hasReportedCard('wwi-end')).toBe(false);
    markCardReported('wwi-end');
    expect(hasReportedCard('wwi-end')).toBe(true);
  });

  it('ignores a stored value that is not an array of strings', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ nope: true }));
    expect(hasReportedCard('wwi-end')).toBe(false);

    sessionStorage.setItem(KEY, JSON.stringify(['wwi-end', 42, null]));
    expect(hasReportedCard('wwi-end')).toBe(true);
  });

  it('survives sessionStorage being unavailable (private mode)', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(hasReportedCard('wwi-end')).toBe(false);
    expect(() => markCardReported('wwi-end')).not.toThrow();
  });
});

describe('submitCardReport', () => {
  it('posts the card id, reason, device id and version', async () => {
    mockFetchStatus(200);
    await submitCardReport('wwi-end', 'wrong-year');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    // Relative URL matters — the Capacitor iOS build resolves it against the host.
    expect(url).toBe('/api/card-reports/submit');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.eventName).toBe('wwi-end');
    expect(body.reason).toBe('wrong-year');
    expect(body.deviceId).toBe(DEVICE_ID);
    expect(body.appVersion).toBeTruthy();
  });

  it('reports success', async () => {
    mockFetchStatus(200);
    await expect(submitCardReport('wwi-end', 'wrong-year')).resolves.toBe('sent');
  });

  it('treats an already-reported card as its own outcome', async () => {
    mockFetchStatus(409);
    await expect(submitCardReport('wwi-end', 'wrong-year')).resolves.toBe('duplicate');
  });

  it('surfaces rate limiting', async () => {
    mockFetchStatus(429);
    await expect(submitCardReport('wwi-end', 'wrong-year')).resolves.toBe('rate-limited');
  });

  it('reports a server error', async () => {
    mockFetchStatus(500);
    await expect(submitCardReport('wwi-end', 'wrong-year')).resolves.toBe('error');
  });

  it('reports an error when offline rather than throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    await expect(submitCardReport('wwi-end', 'wrong-year')).resolves.toBe('error');
  });
});
