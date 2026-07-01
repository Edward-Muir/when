# Session Summary — `vercel dev` `spawn EBADF` / leaderboard 502 (continued)

**Date:** 2026-06-22
**Branch:** `feature/people`
**Status:** ✅ RESOLVED 2026-06-22 (later same day). Leaderboard API now returns `200 OK` JSON in
`vercel dev`. See "## RESOLUTION" below; the earlier sections are the (now-superseded) hunt.

---

## RESOLUTION

**Bug 1 — the `spawn EBADF` / 502 (the original report).** `vercel dev`'s chokidar 4.0.0 watcher
watches the **entire** project working tree with **no exclusions** and holds **one open fd per
watched file** (no bundled `fsevents`). `lsof` on the live `vercel dev` PID = **12,112 open fds**,
~11,442 of them regular files under the gitignored `images/` dir (`generated_images` 5151,
`downsampled_generated_images` 5148, `new_images` 1130) plus `experiments/`. That fd pressure makes
the per-request function-worker `spawn` fail with `EBADF`. **The user was right: it was a
working-tree change on this branch** — `images/` grew to 38 GB / 11.5k files and `experiments/`
(1.5 GB / 56k files) was added in commit `5a5ad86`; not a `src/`/`api/` edit, which is why prior
sessions (looking only at TypeScript edits) exonerated "code."

Why the prior `.vercelignore` "fix" did nothing: `.vercelignore` is only read by `getVercelIgnore`
inside `staticFiles()` (one-shot scan + deploy upload). The watcher uses `this.filter`, hardcoded to
`(p) => Boolean(p)` (always true → ignores nothing) at
`~/.npm-global/lib/node_modules/vercel/dist/commands/dev/index.js:19907` (watch call `:20543`).

**Fix:** physically move the scratch dirs OUT of the project root (chokidar follows symlinks, so a
symlink back in won't help): `images/` → `../when-images`, `experiments/` → `../when-experiments`.
fd count dropped **12,112 → 648** and `EBADF` disappeared.

**Bug 2 — `500 FUNCTION_INVOCATION_FAILED` it unmasked.** Once the spawn worked, the function build
errored: "You installed esbuild for another platform." The global Vercel CLI bundles esbuild 0.27.0
with only `@esbuild/darwin-x64`, but `vercel dev` runs under arm64 nvm Node 22.23.0. Reinstalling
vercel did NOT add arm64 (tarball pins x64). **Fix:** copied the project's matching
`@esbuild/darwin-arm64` (also 0.27.0) into the CLI's `node_modules/@esbuild/`. → leaderboard API
returns **200 OK** with real JSON. (This was a separate, pre-existing env mismatch, masked by Bug 1.)

**Follow-ups:** if `scripts/regenerate_mobile_prompts.py` is run later, point its `images` base at
`../when-images`. The esbuild copy must be re-applied if the global vercel CLI is reinstalled.

---

Continues `docs/dev-tooling/session-2026-06-21-vercel-dev-ebadf-leaderboard.md`.

---

## Symptom (unchanged)

`vercel dev` prints `Error: spawn EBADF`; every `/api/*` request returns a plain-text
`502 NO_RESPONSE_FROM_FUNCTION`; the client `await response.json()` then throws
`JSON.parse: unexpected character at line 1 column 1` in the Daily Leaderboard popup.

Verified again this session:

```
$ curl -s -i "http://localhost:3000/api/leaderboard/$(date +%F)" | head -20
HTTP/1.1 502 Bad Gateway
content-type: text/plain; charset=utf-8
server: Vercel
...
NO_RESPONSE_FROM_FUNCTION
```

**Key new observation:** the `Error: spawn EBADF` lines are **per-request** (one per `/api`
invocation), not a fixed boot-time set of 4 as first assumed. So the failing spawn is the
**function worker spawned on each invocation**, not a one-shot startup spawn.

---

## What this session established

### Both prior hypotheses are DISPROVEN

- **Hypothesis A (Rosetta / arch).** The failing run was under **native arm64 Node 22.23.0**
  (not Rosetta x64), and `spawn EBADF` still fired. → Not an arch/Rosetta issue.
- **Hypothesis B (the session's TypeScript / category-refactor edits).** `spawn EBADF` is a
  process-spawn failure that occurs **before any handler code runs**; the 502 GET path
  (`api/leaderboard/[date].ts`) was never edited. Code cannot produce this error. → Exonerated.

### Two NEW theories tested this session — both DISPROVEN

1. **chokidar file-watcher exhaustion.** Vercel CLI 54.14.5 bundles **chokidar 4.0.0**
   (flagged in the [Vercel community thread](https://community.vercel.com/t/spawn-ebadf-when-running-handling-local-request-in-dev-server/1782)
   for `spawn EBADF` on macOS). This session added two large unignored dirs:
   - `experiments/` — **56,114 files / 1.5 GB** (`experiments/category-clustering`)
   - `venv/` — 2,616 files
     **Fix attempted:** created `.vercelignore` (see below). **Result: did NOT fix the EBADF.**
     The per-request (not load-dependent) nature of the failure argues against watcher fd
     exhaustion anyway.
2. **Inherited TTY stdin breaking the worker spawn.** Theory: the function worker is spawned
   with `stdio: ['inherit', ...]`, and dup-ing the parent's TTY fd 0 (raw mode under
   webpack-dev-server) fails with EBADF. **Test:** `vercel dev < /dev/null` (plain stdin).
   **Result: did NOT fix the EBADF.**

---

## Files changed this session

- **`.vercelignore`** (NEW, kept) — excludes `venv/`, `experiments/`, `docs/`, `ios/`,
  `android/`, `tools/`, `*.log` from the Vercel watch/upload set. Did not fix the bug, but is
  correct hygiene (keeps a 1.5 GB tree out of dev-watch and deploy uploads) so it was left in.
  Do **not** add `scripts/`, `src/`, `public/`, `api/`, or config — the build/functions need them.
- **`.gitignore`** — a `/venv` line was added then **reverted by the user**; left without it
  per the user's choice. `venv/` is therefore still git-trackable but is excluded from Vercel.
- **`docs/dev-tooling/session-2026-06-22-vercel-dev-ebadf-debug.md`** (this file).

No application/source code was changed this session.

---

## Live lead when the session ended — locate the function-worker spawn

`grep` over the Vercel CLI install (`~/.npm-global/lib/node_modules/vercel`) for child-process
calls turned up the most likely culprits for the per-invocation function spawn:

- **`@vercel/node` dev server:** `vercel/node_modules/@vercel/node/dist/dev-server.mjs`
  (the Node serverless runtime that `vercel dev` invokes per request).
- **`dist/chunks/chunk-HIYWSGI7.js:2875` and `:2896`** — `spawn(nodeBinaryPath, script, {...})`
  (two call sites; strong candidates for the function-worker spawn).
- `dist/chunks/chunk-YIAUEFUY.js:52503` — `import { fork } from "child_process"`.
- The boot-time update-check spawn (already known, suppressible via `NO_UPDATE_NOTIFIER=1`) is
  `dist/index.js:474` — `spawn(process.execPath, args, { stdio: ['inherit','inherit','inherit','ipc'] })`.
  This is a separate, non-causal frame.

**Next step:** read the `stdio` options at `chunk-HIYWSGI7.js:2875/2896` and in
`@vercel/node/dist/dev-server.mjs` to see which fd is being passed that yields EBADF, and get a
full stack for the per-request error (run `vercel dev --debug`).

---

## Recommended paths forward (in priority order)

1. **Identify the exact spawn + stdio** (above) via `vercel dev --debug` for a full stack trace
   on the per-request `EBADF`, then target that fd. This is the only path that explains the bug.
2. **Try Node 20 LTS.** Native arm64 Node 22.23.0 was tested and failed; Node 20 was **not**
   tried. `vercel dev`'s function-spawn path is far better exercised on Node 20 — a likely quick
   environment win. (`nvm install 20 && nvm use 20`, then `npm i -g vercel`.)
3. **Bypass `vercel dev` entirely (most robust, in-repo).** Add `src/setupProxy.js` (CRA's
   http-proxy-middleware hook) that proxies `/api/*` to a tiny local Node/Express server which
   mounts the existing `api/*.ts` handlers. Removes all dependency on the flaky CLI spawn.
4. **Verify on deploy meanwhile.** The leaderboard works on a Vercel preview/prod deploy
   (`vercel` / `vercel --prod`) where functions run natively — usable to test the feature now.

## Facts a future session need not re-derive

- Native arm64 **Node 22.23.0**, Vercel CLI **54.14.5** (`~/.npm-global/bin/vercel`); the
  default shell `node` is still x64 (Rosetta) v22.22.0 — irrelevant, the failing runs used the
  native node. `.env` has correct Upstash vars; `ulimit -n` = 1048576.
- `spawn EBADF` is **per `/api` request**; native Node 22 and `< /dev/null` both fail to fix it;
  `.vercelignore` (venv/experiments excluded) does **not** fix it.
- GET path = `api/leaderboard/[date].ts` (untouched); POST = `api/leaderboard/submit.ts` (edited
  earlier for the 20-category theme sync, parity-verified — unrelated to this spawn failure).
- Memory note: `vercel-dev-ebadf-chokidar.md` (root-cause-so-far + that it is NOT Rosetta/code).
  Update it once the true cause is found.
