# Dev Tooling & Infrastructure

Local `vercel dev` troubleshooting, and the clustering work that produced the 20-category
event taxonomy.

## Vercel counts every file under `api/` as a Serverless Function (2026-08-19)

There is no opt-out, and an underscore prefix does not exempt a file — Vercel's docs are
explicit: _"every API maps directly to one Vercel Function… For Hobby, this approach is limited
to 12."_

Six shared helpers had accumulated under `api/` (`reportSchema`, `botGeneration`, `dateWindow`,
`handSize`, `limits`, `nameFilter`), each deploying as a pointless function and quietly
consuming half the budget. Adding two routes plus two helpers for curated themes took it to 14
and the deployment died.

**Shared helpers live in `lib/` now.** The bundler still follows imports into it; it just is not
scanned for routes. `api/` holds only files with an `export default`.

The nasty part is that this failure is invisible locally: `npm run build` passes, `CI=true npm
run build` passes, `npm run typecheck:api` passes, and only the Vercel deploy fails. So the rule
gets a test rather than a comment — `src/utils/apiRoutes.test.ts` asserts every file under
`api/` has a default export and that the count stays under a constant set below the limit.

## `vercel dev` → `spawn EBADF` → every `/api/*` returns a 502 (RESOLVED 2026-06-22)

Symptom: `vercel dev` prints `Error: spawn EBADF` once **per API request**, every `/api/*`
call returns a plain-text `502 NO_RESPONSE_FROM_FUNCTION`, and the client's
`await response.json()` then throws `JSON.parse: unexpected character…` in the leaderboard
popup. Two independent bugs, the second masked by the first.

**Bug 1 — file-descriptor exhaustion from large directories in the project root.** Vercel
CLI's bundled chokidar 4 watches the _entire_ working tree with no exclusions and holds one
open fd per file (no bundled `fsevents`). With `images/` (38 GB, 11.5k files) and
`experiments/` (1.5 GB, 56k files) present, `lsof` showed **12,112 open fds**. That pressure
made the per-request function-worker spawn fail with `EBADF`.

**Fix: physically move the scratch directories out of the project root** — `images/` →
`../when-images`, `experiments/` → `../when-experiments`. fd count dropped to 648 and the
error vanished. A symlink back in does not work: chokidar follows symlinks.

> **`.vercelignore` does not help, and trying it again is wasted time.** It is only read by
> `getVercelIgnore` inside `staticFiles()` on the deploy-upload path. The watcher uses a
> filter hardcoded to `(p) => Boolean(p)` — always true. The file is kept anyway as deploy
> hygiene; its header says as much.

**Bug 2 — esbuild platform mismatch, revealed once spawning worked.** Function builds failed
with "You installed esbuild for another platform": the global Vercel CLI bundles esbuild with
only `@esbuild/darwin-x64`, while `vercel dev` ran under arm64 Node. Reinstalling the CLI does
not help (its tarball pins x64). Fix: copy the project's matching `@esbuild/darwin-arm64` into
the CLI's `node_modules/@esbuild/`. **Re-apply this if the global CLI is ever reinstalled.**

Ruled out along the way, so don't re-investigate: Rosetta / arch mismatch (it still failed
under native arm64 Node), the TypeScript category refactor (`spawn EBADF` happens before any
handler code runs, and the failing GET path was never edited), and inherited TTY stdin
(`vercel dev < /dev/null` changed nothing).

Loose end: if `scripts/regenerate_mobile_prompts.py` is ever run, point its image base at
`../when-images`.

## Where the 20-category taxonomy came from (2026-06-21)

The categories were derived by clustering, not chosen by hand. Method: load all
non-deprecated event files (5,292 unique events), embed with `all-mpnet-base-v2`, sweep
k ∈ 10…32, then merge the winning clusters into single lowercase words.

Two choices explain the shape of the result:

- **The embedding text is year-masked** — explicit years and era words (BCE, CE, "Nth
  century", "1920s") are stripped before embedding, so clusters form on _theme, not period_.
  The governing constraint was that a category must span the timeline rather than name a
  historical era. An automatic `ERA-BOUND` check (IQR < 150 yrs and span < 600 yrs) fired on
  exactly one cluster at every k.
- **k = 24 was the operating point** — silhouette rises then plateaus there (0.081); higher k
  produces tiny mixed fragments. k=24 is also what first separated Medicine, Art, Agriculture
  and Writing out of their parent files. The 24 clusters were then merged to 20 names
  (e.g. ancient monuments + modern engineering → `architecture`, which individually skewed to
  medians of 1025 and 1930 but together span the timeline).

**`media` is the one acknowledged era-bound catch-all** (median ~1964, a pop-tech / sport /
space / video grab-bag). Sport and Fashion never isolate as clusters — if they are ever wanted
as their own categories they must be assigned from source files, not from clustering.

The category value was **overwritten in place** rather than added as a parallel
`cluster_category` field: the category _is_ the cluster category, and the old source-file value
is recoverable from the filename.

**The clustering scripts are no longer in the repo.** They lived in
`experiments/category-clustering/` (`cluster_sweep.py`, `apply_categories.py`), which was moved
to `../when-experiments` to fix the EBADF bug above, and was gitignored regardless. Re-deriving
the taxonomy means recreating them.

### What wiring the taxonomy changed

- `manifest.json` became a flat `{ files: string[] }`, and **filenames stopped mapping to
  categories** — the per-event `category` field is the sole source of truth. This is the single
  most common thing to get wrong about the event data.
- `dailyTheme.ts` was reweighted to ~50% "Everything" / ~50% a single category. With 20
  categories the old scheme gave "Everything" only ~9%.
- `challengeCode.ts` was rewritten from a 33-bit / 3-word token to the current 72-bit / 6-word
  one, specifically to carry a 32-bit category multiselect. **Old 3-word codes stopped
  decoding** — accepted at the time; they redirect home.
- `CategoryIcon.tsx` became a `Record<Category, LucideIcon>` over lucide-react with a
  `Landmark` fallback.

Follow-ups recorded in the original Part B write-up are all **done**: the stale per-category
achievement family was replaced by generated `cat-<category>` badges plus a derived Polymath
(`src/data/achievementLogic.ts`), and the manifest/type wiring shipped.
