# Troubleshooting Writeup — Local leaderboard fails (`spawn EBADF` / `NO_RESPONSE_FROM_FUNCTION`)

**Date:** 2026-06-21
**Branch:** `feature/people`
**Status:** ⚠️ UNRESOLVED — handed to a fresh session.
**User's position (verbatim intent):** strongly believes this is caused by the session's code changes,
not an environment issue — "we made sweeping code changes and then it broke." This writeup must be
read with that hypothesis treated as _live and untested_, because the one decisive experiment (run on
a clean checkout) was **not** performed this session.

---

## Symptom

On the home screen, the **Daily Leaderboard** popup shows **"0 players today"** and a red error:
**`JSON.parse: unexpected character at line 1 column 1 of the JSON data`**. "Longest Timelines"
shows "No entries yet."

Direct cause of the red text: the client does `await response.json()` on a leaderboard response that
is **not JSON**. Confirmed by curling the API (below) — it returns a plain-text 502 body, and
`response.json()` throws the parse error. Relevant client code: `src/hooks/useLeaderboard.ts`
(`fetchLeaderboard`, lines ~116-126, and the `!response.ok` branch lines 121-123 also assume JSON).

## Evidence gathered this session (commands + outputs)

**1. The API returns a 502, not JSON:**

```
$ curl -s -i http://localhost:3000/api/leaderboard/2026-06-21
HTTP/1.1 502 Bad Gateway
content-type: text/plain; charset=utf-8
server: Vercel
...
An error occurred with this application.

NO_RESPONSE_FROM_FUNCTION
```

**2. `vercel dev` prints `spawn EBADF`.** On Vercel CLI 54.14.5 (after updating from 50.4.5), plain
`vercel dev`:

```
> Ready! Available at http://localhost:3000
Error: An unexpected error occurred!
Error: spawn EBADF
    at ChildProcess.spawn (node:internal/child_process:420:11)
    at spawn (node:child_process:787:9)
    at spawnWorker (file:///Users/emuir/.npm-global/lib/node_modules/vercel/dist/index.js:474:18)
    at getLatestVersion (.../vercel/dist/index.js:437:5)
    at .../vercel/dist/index.js:2254:20
Compiled successfully!
```

- This particular frame is Vercel's **update-check** (`getLatestVersion → spawnWorker`), which spawns
  a worker with `stdio: ["inherit","inherit","inherit","ipc"]` (verified in
  `~/.npm-global/lib/node_modules/vercel/dist/index.js:474`).
- `NO_UPDATE_NOTIFIER=1 vercel dev` suppresses **this** frame (the guard is at index.js:2254:
  `if (isTTY && !process.env.NO_UPDATE_NOTIFIER)`), but the leaderboard **still 502s**, so there is a
  **second** spawn failure on the function-invocation path that NO_UPDATE_NOTIFIER does not cover.

**3. Environment facts (read-only):**

- Machine: **arm64** Apple Silicon (M2 Pro, `RELEASE_ARM64_T6020`), macOS **26.3** (build 25D125,
  kernel dated 2026-01-28).
- Node: **v22.22.0**, but `process.arch` = **x64**, binary = `Mach-O 64-bit executable x86_64`,
  installed at `/usr/local/Cellar/node@22/...` (Intel Homebrew). **`sysctl.proc_translated = 1`** →
  Node is **running under Rosetta 2** (x86_64 emulated on arm64). No `/opt/homebrew` (no native brew).
- Vercel CLI: was 50.4.5, updated to **54.14.5** (two installs existed: stale
  `/usr/local/lib/node_modules/vercel` @50.4.5 and `~/.npm-global/...` @54.14.5; PATH/zsh hash caching
  meant the old one ran until a fresh shell). Updating did **not** fix the EBADF.
- Upstash creds **are** present in `.env` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — the
  exact names `Redis.fromEnv()` reads). `ulimit -n` = 1048576 (not fd exhaustion).
- Leaderboard key is `leaderboard:${date}` (date-only); `api/leaderboard/[date].ts` lazily seeds bots
  and **does not** read the theme. So the daily theme change is irrelevant to the GET path.

**4. Spawn repro attempts (could NOT reproduce EBADF locally):**

- Trivial `child_process.spawn` with `stdio:'ignore'` → OK.
- Exact Vercel pattern `stdio:["inherit","inherit","inherit","ipc"]` → OK.
- Same with parent fd0 force-closed → OK.
- Under a real PTY (`script -q /dev/null node -e ...`) with `isatty(1)===true` → **still OK**.
- ⇒ A minimal spawn does **not** fail in this environment; only Vercel's real, long-lived,
  fd-heavy process does. **The Rosetta theory below is therefore circumstantial, not proven.**

---

## Two hypotheses — held open, with honest scoring

### Hypothesis A — Environment (Rosetta / arch mismatch / new macOS)

**For:** the failing stack frame is entirely inside Vercel CLI + Node internals (no repo frames);
`getLatestVersion` runs at CLI boot before project code loads; `NO_UPDATE_NOTIFIER=1` silences that
frame; Node is x86_64 under Rosetta on arm64 macOS 26.3 (a known-fragile setup for `child_process`
with inherited TTY fds); macOS 26.3 is brand new (kernel 2026-01-28) so a regression could have
landed independent of the code.
**Against:** could **not** reproduce `spawn EBADF` with any minimal spawn (even under a PTY) on this
exact Rosetta Node. So "Rosetta causes it" is inferred, not demonstrated. Rosetta has presumably been
in place for months, which is the crux of the user's disbelief.

### Hypothesis B — The session's code changes (user's strong suspicion)

**For:** temporally, the leaderboard appeared to break right after the multi-category refactor +
`api/leaderboard/submit.ts` edit; the user reports never needing `NO_UPDATE_NOTIFIER` before.
**Against (but NOT yet disproven by experiment):** the broken GET path (`api/leaderboard/[date].ts`)
was **not edited** this session; API functions don't import from `src/`; the only API edit was
`submit.ts` (the POST path), which typechecks clean in isolation; `NO_RESPONSE_FROM_FUNCTION` is a
process-spawn failure, not a JS exception in the handler (a handler throw returns a JSON 500 via its
try/catch, not a plain-text 502). **However:** no one ran the code on a clean checkout to confirm the
failure pre-exists the changes — so B is not ruled out by experiment, only by reasoning.

**Plausible reconciliation worth checking:** the local leaderboard may have **never** worked in this
Rosetta `vercel dev` setup, and was simply not exercised locally before this session (it works in
deployed/prod where functions run natively). The user would then have first noticed it now, right
after the code changes — making the correlation real but non-causal. **Unverified.**

---

## DECISIVE experiments for the fresh session (do these first, in order)

1. **Clean-checkout test (settles code-vs-environment definitively).**
   `git stash` (or check out `main`/`309405e` pre-refactor) → `NO_UPDATE_NOTIFIER=1 vercel dev` →
   curl `http://localhost:3000/api/leaderboard/$(date +%F)`.
   - Still **502 / EBADF** on clean code ⇒ **environment** (Hypothesis A), code exonerated.
   - Returns **200 JSON** on clean code ⇒ **the changes are implicated** (Hypothesis B) — then bisect:
     restore files group-by-group (manifest.json, types, api/submit.ts, etc.) to find the trigger.
     This is the one test that ends the debate. It was NOT run this session.

2. **Native-arm64 Node test.** Install a native Node (nvm: `npm config delete prefix` first if it
   complains, then `nvm install 22 && nvm use 22`; verify `node -p process.arch` → `arm64` and
   `sysctl -n sysctl.proc_translated` → `0`), `npm i -g vercel`, then `vercel dev`. If EBADF/502
   disappears ⇒ confirms the Rosetta/arch root cause regardless of #1's outcome.

3. **Isolate the function from `vercel dev`.** Run the `[date].ts` handler logic directly under Node
   (load `.env`, `Redis.fromEnv()`, call a read-only `zrange` on `leaderboard:<date>`) to confirm the
   Redis path itself is healthy and the failure is purely the `vercel dev` worker spawn, not the
   function code. (Avoid `ensureBotsExist` — it writes.)

4. **Confirm "did local leaderboard ever work here?"** Ask the user / check whether they've previously
   run `vercel dev` and seen the leaderboard populate locally on this machine, vs. only ever in
   prod/preview. Resolves the reconciliation hypothesis.

## Quick unblocks (independent of root cause)

- The app code is correct and verified; the leaderboard **works on a Vercel preview/prod deploy**
  (`vercel` / `vercel --prod`) where functions run natively — use that to verify the feature without
  fixing local `vercel dev`.
- Optional client hardening (declined this session): make `useLeaderboard.fetchLeaderboard` read the
  body defensively so a non-JSON/failed response shows "Leaderboard unavailable" instead of the raw
  `JSON.parse` error. Cosmetic only — does not make entries load.

## Facts so the fresh session need not re-derive

- Machine arm64 / macOS 26.3; Node v22.22.0 **x64 under Rosetta** at `/usr/local/Cellar/node@22`
  (`proc_translated=1`); Vercel CLI 54.14.5 at `~/.npm-global`; `.env` has the correct Upstash vars;
  `ulimit -n`=1048576. Leaderboard key `leaderboard:${date}`; GET = `api/leaderboard/[date].ts`
  (untouched, lazily seeds bots, theme-independent); POST = `api/leaderboard/submit.ts` (edited this
  session to sync the daily-theme logic to the 20-category taxonomy — parity-verified vs frontend).
- Vercel update-check spawn: `~/.npm-global/lib/node_modules/vercel/dist/index.js:474`
  (`stdio:["inherit","inherit","inherit","ipc"]`), gated by `NO_UPDATE_NOTIFIER` at index.js:2254.

## Relationship to the rest of the session

The category refactor (Part B) and the `submit.ts` theme sync are complete and independently verified
(typecheck/lint/46 tests + a 400-date frontend↔backend theme parity check). See
`docs/dev-tooling/session-2026-06-21-category-refactor-partB.md`. This leaderboard/`vercel dev` failure is
tracked separately here because its cause is **not yet proven**.
