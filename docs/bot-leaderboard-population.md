# Bot Leaderboard Population

## Overview

The daily leaderboard is automatically populated with 7-13 bot players to make the game feel more active when real player counts are low. Bots are generated lazily on the first leaderboard request each day and are indistinguishable from real players.

## How It Works

1. **Lazy Generation**: When the first user requests the leaderboard for a given date, bots are generated and stored in Redis
2. **Deterministic**: The same date always produces the same bots (seeded random based on date string)
3. **Race-Safe**: Redis SETNX lock prevents duplicate bot generation from concurrent requests

## Bot Configuration

| Parameter            | Value      | Description                              |
| -------------------- | ---------- | ---------------------------------------- |
| Count                | 10 +/- 3   | 7-13 bots per day (uniform distribution) |
| Score (correctCount) | Poisson(6) | Mean of 6, clamped to 0-20               |
| Mistakes             | Weighted   | 1=5%, 2=10%, 3=20%, 4=30%, 5=35%         |

## Score Distribution

Bots have realistic score distributions:

- Most bots get 4-8 correct placements (Poisson mean = 6)
- Mistake distribution weighted toward higher counts (game typically ends at 5 mistakes)

## Bot Names

Names are generated as "Adjective Animal" combinations:

- 35 adjectives: Brave, Swift, Clever, Mighty, Silent, Golden, etc.
- 29 animals: Penguin, Tiger, Fox, Eagle, Wolf, Bear, etc.
- Examples: "Brave Penguin", "Swift Tiger", "Mystic Falcon"

## Files

| File                               | Purpose                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `api/leaderboard/botGeneration.ts` | Bot generation utility with seeded RNG, Poisson sampling, name generation |
| `api/leaderboard/[date].ts`        | GET endpoint - calls `ensureBotsExist()` before returning leaderboard     |

## Redis Keys

| Key Pattern                       | Purpose                                | TTL      |
| --------------------------------- | -------------------------------------- | -------- |
| `bots-initialized:{date}`         | Lock/flag preventing re-generation     | 8 days   |
| `submission:{date}:{botDeviceId}` | Marks bot as "submitted"               | 25 hours |
| `leaderboard:{date}`              | Main leaderboard (bots + real players) | 7 days   |

## Technical Details

### Seeded Random Number Generator

Uses mulberry32 algorithm (same as daily theme generation) for deterministic randomness:

```typescript
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### Poisson Sampling

Inverse transform sampling for realistic score distribution:

```typescript
function samplePoisson(lambda: number, random: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= random();
  } while (p > L);
  return k - 1;
}
```

### Race Condition Handling

```
Request 1                    Request 2
    |                            |
    v                            v
Check lock key              Check lock key
(not exists)                (not exists)
    |                            |
    v                            v
SETNX (succeeds)            SETNX (fails)
    |                            |
    v                            v
Generate bots               Return immediately
Insert to Redis
Set lock = 'done'
```

## Testing

1. Deploy to Vercel
2. Request leaderboard for today's date
3. Verify 7-13 bot entries appear with realistic names and scores
4. Refresh - same bots should appear (deterministic)
5. Real player submissions appear alongside bots
