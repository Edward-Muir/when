# Stage C2: QC every downloaded image

Checks each slug at `downloaded` and moves it to `qc-pass`, `qc-fail` (the next art batch
redraws it, with the reason in the prompt) or `needs-human`. No browser. The verdicts are
judged one image per agent call; the code checks that every one was made.

`D` is `factory/decks/<deck>/` below.

## 1. Free pre-checks

`python3 scripts/factory/image-precheck.py --deck <deck>`

For each downloaded slug it checks that the file decodes and is square at 1024 or 2048 px,
that its sha256 is the one recorded at download, and that it isn't a near-duplicate (dHash) of
another image in the deck or the catalogue. It writes `D/qc/<slug>.precheck.json`, a review
copy `D/qc/img/<slug>.jpg`, and the card file `D/qc/cards/<slug>.json`. A failed precheck is
final: that slug needs no model.

## 2. One reviewer per image

`node scripts/factory/qc-collect.js --deck <deck>` prints `{"review": [...], "recheck": [...]}`:
the slugs that still need a first review, and those that need a second opinion.

For **each** slug in `review`, dispatch one `card-art-qc` agent (it runs on Haiku). Up to 5 at a
time in parallel is fine; one image per agent, never a contact sheet. The prompt is exactly:

> Check one card image. Image: `factory/decks/<deck>/qc/img/<slug>.jpg`. Card:
> `factory/decks/<deck>/qc/cards/<slug>.json`. Read the image and write your cold description
> before you read the card. Write your verdict to `factory/decks/<deck>/qc/<slug>.json`.

Don't tell it what the image should show: the card file does that, after the description.

## 3. A strict second opinion on every flag

Run `qc-collect.js --deck <deck>` again. For each slug in `recheck` (a first verdict of `fail`
or `unsure`), dispatch one `card-art-qc` agent **with `model: "sonnet"`**. The prompt is:

> Strict second opinion on one card image. Image: `factory/decks/<deck>/qc/img/<slug>.jpg`.
> Card: `factory/decks/<deck>/qc/cards/<slug>.json`. Describe the image cold before you read
> the card. Then read the first reviewer's verdict, `factory/decks/<deck>/qc/<slug>.json`, and
> decide whether its flag is right. Write your verdict to
> `factory/decks/<deck>/qc/<slug>.recheck.json`.

It reads the first verdict only after its own description, so the flag can't steer what it
sees.

## 4. Completeness, then apply

Run `qc-collect.js --deck <deck>` until it exits 0. Any slug it still lists gets its agent
re-run, at most twice. If one still won't produce a valid file, leave that slug at `downloaded`
for the next QC run, and say so in the report.

Then `node scripts/factory/qc-collect.js --deck <deck> --apply`. It marks every slug through
`status.js`, moves a failed slug's verdicts to `D/qc/history/`, and writes `D/qc/summary.json`.
A slug past its second retry lands on `needs-human` automatically.

## 5. Commit

`git add factory/decks/<deck>/status.json factory/decks/<deck>/qc`, then commit
"chore(factory): QC <n> images for <Name>: <p> pass, <f> fail", then push. The review copies in
`qc/img/` are gitignored, so only the JSON goes in.

The report gives the pass, fail and needs-human counts, each failure's reason in a few words,
and the deck's stage (`ready-to-ship` once every slug is settled).
