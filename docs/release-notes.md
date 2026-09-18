# Release notes: the human history

**Status: current.** Added 2026-09-18, alongside the evidence-window release.

## Why there are two histories

`CHANGELOG.md` is written by `commit-and-tag-version` and is never hand-edited. It is a
good record of what landed and a bad one of what changed for a player: 124 sections of
`* **event-detail:** long-form prose for all 5,460 events ([1481f03](…))`. The update
popup used to reflect that gap exactly — a `RefreshCw` icon and "A new version of When? is
available", which says a build exists without saying why anyone should want it.

So there is a second history, `public/release-notes.json`, written by hand: one short
sentence per notable change, in the voice a player reads. It feeds two surfaces, the
update popup and `/changelog` ("What's New" in the burger menu), and it is mandatory.

The alternative considered and rejected was splicing prose into `CHANGELOG.md` itself.
One file, one history — but every revision would mean editing generated output, and a
markdown parser would become load-bearing on the app's critical path. Keying a separate
file to the same versions gets the same guarantee with a JSON read.

## The sync contract

`CHANGELOG.md` is the spine; `release-notes.json` is the gloss keyed to it.

- Every entry carries a `version` and `date` that **match a `CHANGELOG.md` heading
  exactly**. `src/utils/releaseNotes.test.ts` fails the suite otherwise, and that suite is
  a sanity gate in `.github/workflows/release.yml` before the bump.
- `documentedFrom` is the floor: every release **at or after** it must have a note. Older
  entries are optional backfill, which is what let this ship against 124 historical
  releases with 17 curated write-ups rather than 124 invented ones. Revising or adding a
  backfilled note is always allowed — it is a JSON edit, nothing regenerates it.
- The date in a new entry is read from the `CHANGELOG.md` heading, **never from the
  clock**. That is the only reason the two files cannot disagree about when a version
  shipped, including across a UTC-midnight release.

## Where a release can abort

Two places, both running `scripts/check-release-notes.js`:

1. The `prerelease` lifecycle script in `.versionrc.json`. This is the real backstop: it
   covers a local `./scripts/release.sh` and the Action alike, and it runs before the bump
   and before `CHANGELOG.md` is touched, so a failure leaves a clean tree.
2. An explicit step in `.github/workflows/release.yml`, purely so the job log says what is
   wrong instead of burying it in `commit-and-tag-version` output.

Both fail when `unreleased` is empty, or when a staged note breaks format. Note that the
release scripts pass `--no-verify`, so a git hook is **not** a usable enforcement point
here; the lifecycle script is.

## The one way past it, and why it records something

`CLAUDE.md` documents Actions → Release → Run workflow as the way to force out a merge
that auto-skipped, which is by definition docs/chore/ci-only and has no player-facing note.
That case gets the workflow's **`skip-note`** boolean dispatch input, which sets
`SKIP_RELEASE_NOTE` for the run. It is gated on `github.event_name == 'workflow_dispatch'`,
so an auto-release on a push to main can never reach it. It excuses having nothing to say
and nothing else: a _malformed_ staged note still fails the check either way.

The bypass could not simply skip. Following it through: a bypassed release would ship a
version at or above `documentedFrom` with no entry, and the floor assertion in
`releaseNotes.test.ts` would then fail on **every subsequent run** — and since the Release
workflow runs the suite before it bumps, a permanently red suite is a permanently blocked
release. So `release-notes.js` records the version with an explicit marker instead:

```json
{ "version": "1.24.1", "date": "2026-09-19", "notes": [], "maintenance": true }
```

The floor assertion accepts an entry with at least one note **or** `maintenance: true`. A
marker rather than a bare empty array, so the file says which releases shipped with nothing
to tell a player, and an _accidental_ empty entry stays a test failure. Nothing else needs
to know about it: `fetchReleaseNotes` already drops entries with no notes, so a maintenance
release never appears on `/changelog`, and `inject-version.js` writes `notes: []` for it, so
the update popup falls back to its generic copy.

## The pipeline, in order

`prerelease` → bump → `CHANGELOG.md` rewritten → `postchangelog`:

```
scripts/release-notes.js   # move `unreleased` into a versioned entry, dated from CHANGELOG.md
scripts/generate-rss.js    # unchanged; still parses CHANGELOG.md
scripts/inject-version.js  # copy that entry into public/version.json as { version, date, notes }
```

Ordering is load-bearing: `inject-version.js` needs the entry `release-notes.js` creates.
`release-notes.js` is a no-op when the version already has an entry, so a re-run after a
half-finished release does not duplicate it.

## Why the notes ride in `version.json`

`useVersionCheck` already polls `/version.json` every five minutes with `cache: 'no-store'`,
and the service worker already serves it network-first. Putting `notes` in that same file
means the popup can name what changed with **no extra request and no new cache strategy**.
A build released before this existed writes `{ version }` alone, so an absent list is a
normal outcome, not an error — `UpdatePopup` falls back to the old icon and copy.

`/release-notes.json` needed its own network-first rule in `public/service-worker.js`,
next to `version.json`. Cache-first would serve a returning player a history one release
behind, which is the one thing a "What's New" page must not do.

## Why the file is served, not bundled

The changelog page has to show releases **newer than the running bundle** — the whole
point is a player on an old build reading what they are being offered. A `src/data/`
import would freeze the history at build time. Hence `public/`, fetched lazily.

## Note format

Enforced by `validateNote` in `scripts/release-notes-lib.js`, shared by the check script
and the corpus test so the rules have one definition:

- 20–120 characters, one sentence (no `. ` mid-string), starting with a capital or a digit.
- No conventional-commit prefix, no markdown links, no `#123`, no commit SHAs.
- No em or en dashes, no second person — the same house rules
  `docs/event-detail/writing-spec.md` applies to the card prose.

The bounds are tight on purpose: these render on a phone, inside a popup that also has to
fit two buttons. A paragraph there is as useless as the generic copy it replaced.

## Adding a note

Append one sentence per notable change to `unreleased` in `public/release-notes.json`,
in the same commit as the change. `node scripts/check-release-notes.js` says whether it
will pass. Nothing else to run — the release moves it.

One deliberate robustness note: `readNotes()` returns an empty history when the file is
missing rather than throwing, because `inject-version.js` runs at `prebuild` and a throw
there would take down every Vercel build, previews included. That weakens nothing — the
check then sees nothing staged and blocks the release, and the corpus test fails on the
null floor — it just stops those being delivered by way of a broken build.
