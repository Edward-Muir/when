# Image review board and the redo list

A local page for eyeballing card art and marking the images to regenerate. It covers every card,
factory deck and older catalogue alike (6,436 on 2026-11-01), newest image first. **It only
records choices.** A separate regeneration step, not yet built, reads the list it writes. This
page is the contract between the two.

```bash
node scripts/images/review-board/server.js            # http://127.0.0.1:5179
node scripts/images/review-board/server.js --port 5180
node --test scripts/images/review-board/redo-list.test.js
```

In a worktree, `../when-images` does not resolve, so set
`WHEN_IMAGES_DIR=/Users/emuir/Documents/GitHub/Vibes/timeline/when-images`. The board reads the
deck branches from origin, and **Refresh** runs `git fetch origin` itself. Never run it from
`when-factory`.

## What it shows

Click a card to mark it (red ring, REDO badge), then optionally write what's wrong. The expand
button opens the full image beside its description and image prompt. In that view, ←/→ step
through the cards and M toggles the mark. The filters are source, deck or category, marked only,
and a name search.

The code is in `scripts/images/review-board/`: `cards.js` builds the index, `redo-list.js` reads
and writes the list, and `server.js` and `index.html` are the board. Its data lives outside git,
in `../when-images/review-board/`: `redo-list.json`, the thumbnail cache `thumbs/`, and
`cache.json` (file hashes, plus the Cloudinary listing).

**Which image a card shows,** first match (`cards.js`):

1. A factory slug not yet in its deck's `uploads.json`: the inbox file,
   `inbox/<deck>/<slug>.jpeg` (kind `inbox`).
2. `downsampled_generated_images/<slug>.jpg`, the bytes that were uploaded, when its size equals
   the live Cloudinary asset's (kind `downsampled`).
3. Otherwise Cloudinary (kind `cloudinary`). This covers about 476 cards: a card with no local
   file, or one whose local copy was re-downsampled or replaced after its upload. Sweet Tooth's
   10 double uploads are among them: the live URL keeps the older asset.

**Cloudinary costs nothing extra (Edward, 2026-11-01).** Thumbnails of local files are made
with macOS `sips -Z 480`. A Cloudinary-kind card loads exactly the URLs the game uses, in the
browser: `getImageUrl`'s `thumbnail` rung in the grid and its `detail` rung full size. So
`f_auto` negotiates the same format a player gets, and the request hits derived assets the game
has already minted. The board never fetches an original or uses another transformation string.
`redo-list.test.js` fails if the rungs mirrored in `cards.js` drift from
`src/utils/cloudinaryImage.ts`. Listing Cloudinary uses the Admin API: about 13 calls, cached
for an hour, and no transformations.

**When an image last changed,** which sets the order:

- a factory card: its current `downloaded_at` in `inbox/<deck>/manifest.jsonl`;
- a catalogue card: the live asset's Cloudinary `version`, an upload timestamp that changes on
  overwrite;
- the fallback is the file's mtime.

**Image prompts,** later sources winning:

1. `../when-images/claude_prompts/*.csv`
2. the other `*_prompts.csv` files there, then its `all_prompts.csv`
3. `docs/curated-themes/art/*.csv`, with the remake CSVs last
4. the deck's `prompts.csv`

About 480 cards have no prompt on file.

## The redo list: `../when-images/review-board/redo-list.json`

```json
{
  "format": 1,
  "updated_at": "2026-11-01T22:00:03.219Z",
  "entries": [
    {
      "id": "kodak-instamatic-camera@2026-11-01T21:59:56.008Z",
      "slug": "kodak-instamatic-camera",
      "friendly_name": "Kodak Instamatic Camera",
      "source": "factory",
      "deck": "in-your-pocket",
      "deck_stage": "art-in-progress",
      "factory_state": "downloaded",
      "live": false,
      "public_id": null,
      "cloudinary_version": null,
      "image": {
        "kind": "inbox",
        "file": "inbox/in-your-pocket/kodak-instamatic-camera.jpeg",
        "sha256": "190bc6e0…"
      },
      "note": "the camera looks too modern",
      "marked_at": "2026-11-01T21:59:56.008Z",
      "note_updated_at": null,
      "applied_at": null,
      "skipped": null
    }
  ]
}
```

- **`source`** is `factory` for a slug in any deck's `status.json`, and `catalogue` for the
  rest. `live` says whether the card is in the catalogue now.
- **`deck`, `deck_stage` and `factory_state`** are as the board saw them when the mark was
  made. Read the deck's current state again before acting.
- **`image`** is what Edward looked at:
  - `file` is relative to `WHEN_IMAGES_DIR`.
  - `sha256` is the hash of that file's bytes. For an inbox image it equals `status.json`'s
    sha256.
  - A `cloudinary` image has no file or sha256. Its identity is `public_id` plus
    `cloudinary_version`.
- **`note`** is at most 300 characters on one line, and may be empty. It is meant to become the
  reason added to the image prompt.
- **Open** means `applied_at` and `skipped` are both null. A slug has at most one open entry.
  Unmarking deletes only the open entry.
- **The consumer closes an entry** by setting `applied_at` (with anything else it wants under
  `applied`), or `skipped: {at, reason}`. Closed entries stay as history; the board labels the
  card "redone" or "skipped" and doesn't count it.

**Writing it.** Always go through `updateRedoList(mutator)` in `redo-list.js`. It takes a short
lockfile (`redo-list.json.lock`), re-reads the file, applies the change, and writes a temp file
then renames it. So the board and the consumer can run at once without losing a write.

## For the regeneration step

- **Skip an image that changed after it was marked.** Build the index with
  `buildIndex({refresh: true})`. For each open entry, call `await resolveCard(slug)` and
  `isStillCurrent(entry, card)`. On false, close it as `skipped`, reason
  `image changed since marked`. The check compares sha256 for local images, and public_id plus
  version for Cloudinary ones.
- **A factory card whose deck hasn't shipped:** `status.js reset <slug>` sends it back to
  `pending` with a fresh retry budget, and the next art batch remakes it with the note in the
  prompt. The limits:
  - `reset` refuses once the deck's PR is open or merged;
  - on an `uploaded` deck it takes only a `needs-human` card.
- **A live card,** whether from the catalogue or a merged deck: write a scene, with the note as
  its warning, and build the prompt with `scripts/events/theme-art-prompts.py --remake`. Then
  replace the asset in place. Three tools stand in the way:
  - `cloudinary-upload.js` refuses a slug whose source changed after upload, and refuses a
    second asset on a slug.
  - `update-cloudinary-urls.js` keeps a slug's oldest asset, so a new public_id would be
    ignored.
  - So **overwrite the same public_id** (`overwrite: true, invalidate: true`). The
    `image_url` then doesn't change, and the new `version` closes the loop.
- **Then update the local copies.** Archive the original to `generated_images/`, then
  re-downsample (`scripts/images/downsample.py --slugs`) and re-extract colours
  (`scripts/images/extract_colors.py --force --slugs`). Without that, the board keeps showing
  the old bytes, and the size check sends the card to Cloudinary.
- **Deletions** go to `../when-images/compare-app/cloudinary_delete_list.json`, and are run
  only with Edward's approval.
