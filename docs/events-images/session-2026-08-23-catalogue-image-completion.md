# 2026-08-23 — Every Event Now Has an Image

Closing the last 16 gaps in image coverage. Released as **1.16.0**.

For the first time, **0 of 5,107 playable events lack an `image_url`**. This matters more than
it sounds: `loadAllEvents` filters out any event without Cloudinary art
(`eventLoader.ts`, via `isCloudinaryImage`), so an unillustrated event can never be dealt. The
"events in the repo" count and the "events the game can actually use" count are now the same
number, and several docs that reasoned about the gap between them are stale as a result.

Continues [../sports-events/session-2026-08-20-sports-image-pipeline.md](../sports-events/session-2026-08-20-sports-image-pipeline.md),
which landed the 324 sports images (shipped in 1.14.0/1.15.0).

## What the 16 were

- **14 Indonesian theme events** (from #49) spread across `conflict`, `cultural`, `diplomatic`,
  `exploration`, `infrastructure` and `money`.
- **`marbury-v-madison`** (`law.json`) — a long-standing unrelated gap.
- **`first-pharmacopoeia`** (`medicine.json`) — _appeared mid-session_, see below.

## The dedup created a new gap while we worked

Pulling #51 ("remove 522 duplicate events") mid-session changed the pending list from 15 to 16.
`first-pharmacopoeia` had a duplicate twin; the dedup kept the copy **without** an `image_url`
and deprecated the one that had it.

It needed no new art — a colour, a generated PNG and a downsampled JPG all already existed
locally under that exact slug, so the upload/URL steps picked it up unchanged.

**Generalise this:** a dedup that keeps one of two twins can silently un-illustrate an event,
because image coverage is a property of the slug, not the content. After any dedup, re-run the
"which events lack `image_url`" check rather than trusting a list built before it.

## Drop `--category` when the batch spans files

The sports run used `extract_colors.py --category sports`. These 16 spanned seven files, so the
run had to be unfiltered — which raises the question of what else an unfiltered run would touch.

It is safe, and the reason is worth recording: **every event with non-standard dimensions lives
in `deprecated.json`** (six of them, at heights 205–507), and `extract_colors.py` iterates
categories from `manifest.json`, which deliberately excludes `deprecated.json`. Everything the
manifest does reach already has a colour and `330×440`, so `needs_color` / `needs_dims` are both
false and it skips them. Only genuinely new events get processed.

Bonus: dropping the filter also removes the alarming **"5297 images did not match any event"**
warning. That was always an artefact of `--category` — `matched_names` only accumulates inside
the filtered loop, so every image from the other 20 categories counted as unmatched.

## `update-cloudinary-urls.js` re-serialises Unicode, and the diff looks alarming

`diplomatic.json` showed **73 changed lines** for what should have been one new event. This is
benign and will recur.

The script rewrites each touched file with `ensure_ascii` off, so any pre-existing escaped
sequence flips to a literal character: `Treaty of Alcáçovas` → `Treaty of Alcáçovas`,
plus `Cateau-Cambrésis`, `Māori`, `Kellogg–Briand`. Same strings, different bytes on disk;
parsers cannot tell them apart. One `name` field was in the churn (`mining-mercury-potosí`),
also escaping-only — the slug is byte-identical after decoding, so dedup, recency and collection
tracking are unaffected.

**So a big line count in this step is not the red flag.** The check that actually matters is
whether any `image_url` line was _removed_:

```bash
git show <commit> -- public/events/ | grep -c '^-.*"image_url"'    # 0 = purely additive
```

Non-zero means `buildCloudinaryUrl` has drifted and it is rewriting the existing ~5,100 URLs.

## Verifying the right image landed on the right event

Matching is by name, so the failure mode is an event silently acquiring another event's picture.
Cheap check — strip Cloudinary's 6-character suffix from the public_id and compare to the slug:

```python
pid  = url.rstrip('/').split('/')[-1].split('?')[0]
stem = re.sub(r'_[a-z0-9]{6}$', '', pid)
assert stem == event['name']
```

All 16 passed, alongside colour presence and `330×440`.

## Generated images arrive in `~/Downloads`

The browser-driven Gemini job saves to `~/Downloads`, **not** to `when-images/generated_images/`.
Both times this has now come up, the images looked "missing" until that was checked. Move them
by matching stems against the pending-event set rather than by hand — and note they arrive as
`.jpeg`, which is exactly what silently defeated `downsample.py` last session.

## On "rebasing" onto main

Twice this session the request was to rebase, and both times there were **0 local commits** — so
it was a fast-forward, not a rebase. The working tree held uncommitted work each time.

```bash
git fetch origin
git rev-list --left-right --count main...origin/main   # left=local-only, right=incoming
git pull --rebase --autostash origin main
```

`--autostash` lifts uncommitted work, fast-forwards, and restores it, without disturbing existing
`git stash` entries. Before pulling, check whether the incoming commits touch the same files you
have modified — the second pull _did_ modify `docs/curated-themes/indonesia-theme.md` while it
had local edits. No conflict materialised, but `git diff > backup.patch` first costs nothing.

## Docs made stale by this session

- **[../curated-themes/index.md](../curated-themes/index.md)** claimed 325 events sat unillustrated,
  324 of them `sports`, and called getting those images "the single highest-leverage catalogue
  action available". Done — corrected in place.
- **[index.md](index.md)** claimed the `when-images` scripts "cannot be assumed to exist". The tree
  is intact and was used throughout both sessions — corrected in place.

## Still true, still worth knowing

- **Nothing in `when-images/` is under git**, including the `downsample.py` multi-extension fix and
  the prompt build/assemble scripts. If that machine is lost, so are they.
- `to_upload/` still holds a backlog of never-uploaded images from June; the finder recomputes
  against Cloudinary's live list each run, so they keep getting re-staged.
- The stored `image_url` still carries `dpr_auto`, which contradicts
  [../cloudinary-cost-controls.md](../cloudinary-cost-controls.md) but never reaches the CDN —
  `getImageUrl` substitutes the rung.
