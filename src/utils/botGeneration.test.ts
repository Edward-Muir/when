import type { Redis } from '@upstash/redis';
import { ensureBotsExist, generateBotsForDate } from '../../api/leaderboard/botGeneration';

// Tested from src/ because CRA's Jest only roots there — same arrangement as
// nameFilter.test.ts and dateWindow.test.ts.

describe('generateBotsForDate', () => {
  it('is fully determined by the date string', () => {
    // This is what makes the leaderboard coherent under local dates: a Sydney player and an
    // LA player fetch the same date ~19 hours apart, and whichever arrives first mints the
    // set the other reads back. If generation depended on the clock they would disagree.
    expect(generateBotsForDate('2026-08-12')).toEqual(generateBotsForDate('2026-08-12'));
  });

  it('produces a different field for a different date', () => {
    expect(generateBotsForDate('2026-08-12')).not.toEqual(generateBotsForDate('2026-08-13'));
  });

  it('produces 7-13 bots with coherent scores', () => {
    const bots = generateBotsForDate('2026-08-12');
    expect(bots.length).toBeGreaterThanOrEqual(7);
    expect(bots.length).toBeLessThanOrEqual(13);

    for (const bot of bots) {
      const mistakes = bot.totalAttempts - bot.correctCount;
      expect(mistakes).toBeGreaterThanOrEqual(1);
      expect(mistakes).toBeLessThanOrEqual(5);
      expect([...bot.emojiGrid]).toHaveLength(bot.totalAttempts);
      expect([...bot.emojiGrid].filter((c) => c === '🟩')).toHaveLength(bot.correctCount);
      expect([...bot.emojiGrid].filter((c) => c === '🟥')).toHaveLength(mistakes);
      expect(bot.deviceId).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it('gives every bot a distinct device id', () => {
    const bots = generateBotsForDate('2026-08-12');
    expect(new Set(bots.map((b) => b.deviceId)).size).toBe(bots.length);
  });
});

describe('ensureBotsExist', () => {
  const utcToday = new Date().toISOString().split('T')[0];

  /** Minimal in-memory stand-in for the bits of Redis that ensureBotsExist touches. */
  function fakeRedis() {
    const store = new Map<string, unknown>();
    const sorted = new Map<string, unknown[]>();
    const redis = {
      get: async (k: string) => store.get(k) ?? null,
      setnx: async (k: string, v: unknown) => {
        if (store.has(k)) return 0;
        store.set(k, v);
        return 1;
      },
      set: async (k: string, v: unknown) => {
        store.set(k, v);
        return 'OK';
      },
      zadd: async (k: string, m: unknown) => {
        sorted.set(k, [...(sorted.get(k) ?? []), m]);
        return 1;
      },
      expire: async () => 1,
      del: async (k: string) => (store.delete(k) ? 1 : 0),
    };
    return { redis: redis as unknown as Redis, store, sorted };
  }

  it('seeds bots for a date currently in play', async () => {
    const { redis, sorted } = fakeRedis();
    await expect(ensureBotsExist(redis, utcToday)).resolves.toBe(true);
    expect(sorted.get(`leaderboard:${utcToday}`)).toHaveLength(
      generateBotsForDate(utcToday).length
    );
  });

  it('is idempotent — a second fetch does not double the field', async () => {
    const { redis, sorted } = fakeRedis();
    await ensureBotsExist(redis, utcToday);
    await expect(ensureBotsExist(redis, utcToday)).resolves.toBe(false);
    expect(sorted.get(`leaderboard:${utcToday}`)).toHaveLength(
      generateBotsForDate(utcToday).length
    );
  });

  it('seeds the neighbouring dates, which other timezones are legitimately playing', async () => {
    const dayMs = 86_400_000;
    for (const offset of [-1, 1]) {
      const date = new Date(Date.now() + offset * dayMs).toISOString().split('T')[0];
      const { redis } = fakeRedis();
      await expect(ensureBotsExist(redis, date)).resolves.toBe(true);
    }
  });

  it('refuses to mint bots for a date nobody can be playing', async () => {
    // Without this guard any client could conjure bot sets and lock keys for arbitrary
    // dates just by requesting them.
    const { redis, store, sorted } = fakeRedis();
    await expect(ensureBotsExist(redis, '2099-01-01')).resolves.toBe(false);
    expect(store.size).toBe(0);
    expect(sorted.size).toBe(0);
  });
});
