# Dev Tooling & Infrastructure

Local `vercel dev` troubleshooting, the Serverless Function budget, and where the 21-category
event taxonomy came from.

## Vercel counts every file under `api/` as a Serverless Function

There is no opt-out, and an underscore prefix does not exempt a file — Vercel's docs are
explicit: _"every API maps directly to one Vercel Function… For Hobby, this approach is limited
to 12."_

A shared helper under `api/` deploys as a pointless function and eats the budget; past the limit
the deployment fails.

**Shared helpers live in `lib/`** (`lib/leaderboard/`, `lib/card-reports/`, `lib/themes/`,
`lib/adminAuth.ts`). The bundler follows imports into it; it just is not scanned for routes.
`api/` holds only files with an `export default`.

The nasty part is that this failure is invisible locally: `npm run build` passes, `CI=true npm
run build` passes, `npm run typecheck:api` passes, and only the Vercel deploy fails. So the rule
gets a test rather than a comment — `src/utils/apiRoutes.test.ts` asserts every file under
`api/` has a default export and that the count stays under a constant set below the limit.

## `vercel dev` → `spawn EBADF` → every `/api/*` returns a 502

Symptom: `vercel dev` prints `Error: spawn EBADF` once **per API request**, every `/api/*`
call returns a plain-text `502 NO_RESPONSE_FROM_FUNCTION`, and the client's
`await response.json()` then throws `JSON.parse: unexpected character…` in the leaderboard
popup. Two independent bugs, the second masked by the first.

**Bug 1 — file-descriptor exhaustion from large directories in the project root.** Vercel
CLI's bundled chokidar 4 watches the _entire_ working tree with no exclusions and holds one
open fd per file (no bundled `fsevents`). A project root holding an image tree (11.5k files) and
an experiments tree (56k files) runs to ~12,000 open fds, and that pressure makes the
per-request function-worker spawn fail with `EBADF`.

**Fix: keep large scratch directories out of the project root** — the image tree lives at
`../when-images` and experiments at `../when-experiments`, which brings the count to ~650. A
symlink back in does not work: chokidar follows symlinks.

> **`.vercelignore` does not help, and trying it again is wasted time.** It is only read by
> `getVercelIgnore` inside `staticFiles()` on the deploy-upload path. The watcher uses a
> filter hardcoded to `(p) => Boolean(p)` — always true. The file is kept as deploy hygiene;
> its header says as much.

**Bug 2 — esbuild platform mismatch, revealed once spawning works.** Function builds fail with
"You installed esbuild for another platform": the global Vercel CLI bundles esbuild with only
`@esbuild/darwin-x64`, while `vercel dev` runs under arm64 Node. Reinstalling the CLI does not
help (its tarball pins x64). Fix: copy the project's matching `@esbuild/darwin-arm64` into the
CLI's `node_modules/@esbuild/`. **Re-apply this whenever the global CLI is reinstalled.**

Ruled out, so don't re-investigate: Rosetta / arch mismatch (it fails under native arm64 Node
too), handler code (`spawn EBADF` happens before any handler runs), and inherited TTY stdin
(`vercel dev < /dev/null` changes nothing).

## Where the 21-category taxonomy came from

Twenty of the categories were derived by clustering, not chosen by hand; `sports` is the
twenty-first, built from re-tagged sport events plus researched ones, because sport never
isolates as a cluster (see
[../sports-events/](../sports-events/index.md)). The list is `ALL_CATEGORIES` in
`src/types/index.ts`. Method: embed every non-deprecated event with `all-mpnet-base-v2`, sweep
k ∈ 10…32, then merge the winning clusters into single lowercase words.

Two choices explain the shape of the result:

- **The embedding text is year-masked** — explicit years and era words (BCE, CE, "Nth
  century", "1920s") are stripped before embedding, so clusters form on _theme, not period_.
  The governing constraint is that a category must span the timeline rather than name a
  historical era. An automatic `ERA-BOUND` check (IQR < 150 yrs and span < 600 yrs) fires on
  exactly one cluster at every k.
- **k = 24 is the operating point** — silhouette rises then plateaus there (0.081); higher k
  produces tiny mixed fragments. k = 24 is also where Medicine, Art, Agriculture and Writing
  separate out. The 24 clusters merge to 20 names (e.g. ancient monuments + modern engineering
  → `architecture`, which individually skew to medians of 1025 and 1930 but together span the
  timeline).

**`media` is the one acknowledged era-bound catch-all** (median ~1975, a pop-tech / space /
video grab-bag). Fashion never isolates as a cluster either, and has no category.

The category value is the cluster category itself, written in place rather than as a parallel
`cluster_category` field. The clustering scripts are not in the repo; re-deriving the taxonomy
means recreating them.

### How the taxonomy is wired

- `manifest.json` is a flat `{ files: string[] }`, and **filenames do not map to categories** —
  they are storage shards, and the per-event `category` field is the sole source of truth. This
  is the single most common thing to get wrong about the event data.
- Seeded daily themes draw from dated menu epochs in `src/data/dailyThemeMenu.json` (written by
  `scripts/daily-theme-menu.js`, read by `dailyTheme.ts`): Everything, a category, a region, a
  country, or a category-in-place mix, by weight (30 / 25 / 10 / 15 / 20 in the first epoch).
  Dates before the first epoch use a frozen generator, ~50% Everything and ~50% a single
  category, because past days are replayed by the recency chain. Curated themes override both.
- `challengeCode.ts` packs six base words (72 bits) carrying a 32-bit category multiselect,
  then an optional seventh regions word, then country words. Codes that don't decode redirect
  home.
- `CategoryIcon.tsx` is a `Record<Category, LucideIcon>` over lucide-react with a `Landmark`
  fallback.
- Category achievements are generated `cat-<category>` badges plus a derived Polymath
  (`src/data/achievementLogic.ts`).
