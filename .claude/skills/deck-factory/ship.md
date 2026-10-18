# Stage C3: ship a deck

Runs on a deck at `ready-to-ship` (every slug `qc-pass` or `needs-human`), or one left at
`uploaded` by a run that died. It uploads the art, wires it into the catalogue, verifies the
build and opens the pull request. A re-run resumes: every step below is safe to repeat.

## 1. Upload (skip if the deck is already `uploaded`)

`node scripts/factory/cloudinary-upload.js --deck <deck>`

For each `qc-pass` slug it:

1. checks that the inbox file is the one QC passed;
2. archives it to `generated_images/` and downsamples it;
3. uploads it as `<slug>_<6 chars>`;
4. checks Cloudinary's etag, and fetches the asset back to compare its bytes;
5. records it in `factory/decks/<deck>/uploads.json`.

It moves the deck to `uploaded` when every slug is done. If it stops on an error, report it.
Don't work around it: a slug that already has a Cloudinary asset is Edward's to sort out.

Commit `factory/decks/<deck>/uploads.json` and `status.json`, then push.

## 2. Wire the URLs

1. `node scripts/update-cloudinary-urls.js`
2. `node scripts/factory/cloudinary-upload.js --deck <deck> --verify-urls`. It must pass: one new
   `image_url` line per uploaded slug, none removed, every stem its slug. On a failure,
   discard the URL changes (`git checkout -- public/events/`) and report. Never commit a
   catalogue that fails this.
3. Commit `public/events/`: "chore(events): wire the <Name> deck's art".

## 3. Colours

`python3 scripts/images/extract_colors.py --force --slugs <qc-pass slugs, comma-separated>`

This reads the local downsampled JPEGs, so it needs no network and mints no Cloudinary asset.
Commit `public/events/`: "chore(events): colours for the <Name> deck".

## 4. Verify, all through npm

1. `CI=true npm test -- --watchAll=false`
2. `npm run lint`
3. `npm run typecheck`
4. `CI=true npm run build`

On a failure, stop and report. Don't open the PR. The deck stays at `uploaded`, and the next
ship run retries from here.

## 5. Open the PR

1. `node scripts/factory/backlog.js set-status <deck> done`. Merging this PR is what makes the
   theme done, so the change travels with it.
2. `node scripts/factory/pr-body.js --deck <deck>`. Write its output to
   `factory/decks/<deck>/pr-body.md`.
3. Commit both files: "chore(factory): <Name> ready for review". Push.
4. Check that no PR is already open for the branch: `gh pr list --head claude/deck-<deck> --state open`.
   If there isn't one:
   `gh pr create --base main --head claude/deck-<deck> --title "chore(events): add the <Name> curated deck" --body-file factory/decks/<deck>/pr-body.md`
   The `chore` title means no release and no release note.
5. `node scripts/factory/status.js stage --deck <deck> pr-open`, then commit "chore(factory):
   <Name> PR open" and push.

The report gives the PR link, the counts of new and reused cards, any `needs-human` slugs, and
the CI state.

## If Edward closes the PR unmerged

Its assets are queued for deletion: append each `uploads.json` public_id to
`../when-images/compare-app/cloudinary_delete_list.json` as `{"name": "<slug>", "public_id": "<id>"}`.
Deleting still waits for Edward's approval. That's the health stage's job, not this one's.
