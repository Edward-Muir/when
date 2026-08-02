# Session Summary: Card Issue Reports

**Date**: 2026-08-02

## Overview

Players can now flag a problem with a card's data — wrong year, wrong image, bad description — from the card detail popup. Reports land in Upstash Redis and are read at a hidden `/card-reports` page, so a wrong card gets fixed instead of being quietly tolerated.

The row started as a `mailto:` link and was converted mid-session: a mail-app handoff bounces the player out of the game on mobile, and most reports never get finished. It now submits in-app.

## Setup required

**`REPORTS_ADMIN_KEY` must be set in the Vercel project for both Production and Preview.** Reading reports fails closed — without it, `/api/card-reports/list` returns 503 in production and the admin page shows an explanatory message instead of data. Previews are a separate environment, so a key set only on Production leaves every preview deploy locked out.

```bash
openssl rand -hex 24     # generate a key
```

Locally, `vercel dev` needs no setup: with the variable unset, non-production environments allow through. The existing `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are reused — no new Redis instance.

To use the page: visit `/card-reports?key=<the key>` once. It stores the key in localStorage (`when-reports-key`) and strips the query from the address bar, so afterwards a bare `/card-reports` works. There is also a paste-in field if you'd rather the key never touch a URL, and a "Forget key" button.

## How It Works

### Reporting flow

1. Tap a card to open the detail popup → the "Report an issue" row sits under the description.
2. Tapping it reveals four reason chips in a 2×2 grid (four 44px chips don't fit one row in a 340px card).
3. Tapping a chip POSTs immediately and the row becomes "✓ Reported — thanks!", which persists for the rest of the session.

Reason ids: `wrong-year`, `wrong-image`, `bad-description`, `other`.

### What gets stored

Only an event id, a reason id, a timestamp and the app version. No device id, no IP, no free text. The admin page joins the event id back to the full card client-side via `loadAllEvents()`, so the payload stays minimal and a report can't be forged to contain arbitrary display text.

| Key                                      | Type   | Purpose                                                    |
| ---------------------------------------- | ------ | ---------------------------------------------------------- |
| `cardreport:counts`                      | zset   | `ZINCRBY` per card — drives "most reported first". 90d TTL |
| `cardreport:log`                         | list   | `LPUSH` + `LTRIM 0 999` — capped at 1000 entries           |
| `cardreport:seen:<deviceId>:<eventName>` | string | Per-device-per-card dedup, 30d TTL                         |
| `cardreport:rl:<ipHash>`                 | string | Per-IP rate limit, 1h TTL                                  |

Every key is TTL'd or capped, so a spammer can't grow Redis without bound.

### Abuse controls

- **Client**: sessionStorage (`when-reported-cards`) marks the card; reopening it shows the sent state, so the button can't be pressed again. Bypassable by design — it's a UX guard, not the gate.
- **Server, dedup**: the per-device-per-card key is claimed atomically with `SET … NX`. A get-then-set would let a double-tap through. The claim is released with `DEL` if the write pipeline throws, so a transient Redis error can't lock a device out for 30 days with nothing recorded.
- **Server, rate limit**: 20 reports/hour per IP. Set generously on purpose — carrier CGNAT and office wifi put many genuine players behind one address, and blocking them would be invisible to us. The dedup is the real anti-spam mechanism; this only stops floods.

A duplicate returns 409, which the client treats as success — the report already exists, so showing an error would be wrong.

### IP handling

The limiter prefers `x-vercel-forwarded-for` (written by Vercel's edge, not settable by the caller). Falling back to `x-forwarded-for` it takes the **last** hop — a client can prepend entries, so the first is attacker-controlled and would make the limit trivially bypassable. With no proxy headers at all it falls back to the device id rather than one shared bucket, which would otherwise 429 every user at once if the headers went missing.

The address is SHA-256 hashed and used only as an expiring rate-limit key. It is never stored in the report.

### Admin endpoint auth

`/api/card-reports/list` requires `REPORTS_ADMIN_KEY` via an `x-admin-key` header or `?key=`. The check runs **before any Redis call**, so a rejected request costs zero Upstash commands — which is the reason for the gate. Upstash bills per command, and an open GET runs a `ZRANGE` plus an `LRANGE` for anyone who cares to loop it.

Comparison is timing-safe over SHA-256 digests. Digesting first matters: `timingSafeEqual` throws on mismatched buffer lengths, so a wrong-length guess would be a 500 rather than a 401.

`/api/card-reports/submit` stays public — it's the player-facing write path.

## Files Created

| File                                   | Purpose                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `api/card-reports/reportSchema.ts`     | Shared constants, payload validation, `authorizeAdminRead()`        |
| `api/card-reports/submit.ts`           | POST — rate limit, dedup, write                                     |
| `api/card-reports/list.ts`             | GET — key-gated read for the admin page                             |
| `src/utils/cardReport.ts`              | Reason list, `submitCardReport()`, sessionStorage helpers           |
| `src/components/ReportIssueButton.tsx` | The row's `idle → choosing → sending → sent \| error` state machine |
| `src/pages/CardReports.tsx`            | Hidden `/card-reports` admin page                                   |
| `src/utils/cardReport.test.ts`         | 26 tests — validation, storage, fetch outcome mapping               |
| `src/utils/adminAuth.test.ts`          | 10 tests — the full auth decision table                             |

## Files Modified

- `src/components/GamePopup.tsx` — renders `<ReportIssueButton>` in the `description` variant only. The `correct`/`incorrect` reveals and game over are untouched.
- `src/index.tsx` + `vercel.json` — the `/card-reports` route and its SPA rewrite (without the rewrite it 404s on direct load in production).
- `src/pages/PrivacyPolicy.tsx` — discloses the new collection; the policy enumerates what's stored, so leaving it stale would have made it inaccurate.
- `package.json` — added `typecheck:api`, and widened `lint` from `eslint src` to `eslint src api`.
- `CLAUDE.md`, `docs/architecture-reference.md` — routes, endpoints, env vars.

## Gotchas worth remembering

- **The description popup dismisses on any click that reaches the backdrop.** `GamePopup.tsx` only calls `stopPropagation` for the `gameOver` variant, so every control in the report row needs it or the card vanishes mid-report. The wrapper `<div>` carries it, which covers anything added later.
- **Event ids are not all ASCII.** Three of the 5,294 carry accents — `chimú-kingdom`, `mining-mercury-potosí`, `chimú-chan-chan-peak`. The first validation regex was `/^[a-z0-9-]+$/`, which would have 400'd those cards and made them silently unreportable. The pattern is now Unicode-aware (`\p{L}\p{N}`), with a test pinning it.
- **CRA's Jest sets `resetMocks: true`**, so a `jest.mock()` factory's `mockResolvedValue` is wiped before each test. Implementations have to be re-applied in `beforeEach`.
- **`src/` tests can import from `api/`** across the tsconfig boundary. That's how the reason-id allowlist and the auth decision table are unit-tested despite `api/` being outside Jest's roots.
- **`lint-staged` lints `api/` but `npm run lint` didn't.** The npm script was the odd one out and let a complexity error through until the commit hook caught it; the script now covers both.
- **Capacitor iOS needs no release for this.** `capacitor.config.ts` points `server.url` at the live site, so the native app loads production remotely and relative `/api/*` resolves the same as on web.

## Not done

- **The endpoints have never been run against real Redis.** There were no Upstash credentials in the session container, so `vercel dev` + curl against the live routes is unverified. Logic is covered by unit tests and by Playwright runs against stubbed responses; the Redis wiring itself needs one manual pass after deploy.
- **No notification.** Reports sit in Redis until someone visits `/card-reports`. A digest would be a reasonable follow-up.
- **No free-text field.** "Other" reports say a card is disliked but not why. Deliberate for v1 — free text would bring back sanitization, length caps and moderation.
- **Two feedback addresses still coexist** in the app: `feedback@play-when.com` (Menu) and `playwhenfeedback@gmail.com` (Support/Privacy/Terms). Unrelated to this work, but worth unifying.
