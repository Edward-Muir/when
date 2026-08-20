# 2026-08-20 — Sports Image Pipeline: Prompts → Colours

Generating and landing images for the 324 `sports` events that shipped without them.

The [sports category](session-2026-07-12-sports-category-and-dedup.md) launched with 374
events, of which **324 had no `image_url`** and were therefore filtered out of play by
`eventLoader.ts:60` (`isCloudinaryImage`). The category shipped playable on its other 50
re-tagged events. This session wrote the image prompts for those 324, ran them through the
generation pipeline, and got as far as colour extraction.

## Where this left off

**Done:** prompts written → images generated → downsampled → colours and dimensions extracted →
uploaded to Cloudinary by hand.

**The one remaining command:**

```bash
cd ~/Documents/GitHub/Vibes/timeline/when
node scripts/update-cloudinary-urls.js
```

Then verify — `git diff --stat` should touch **`sports.json` alone**. That script matches by
event name across _every_ event file, so any other file in the diff means `buildCloudinaryUrl`'s
output has drifted from what's stored and it is rewriting the existing ~5,300 URLs too.

At the time of writing, `public/events/sports.json` is modified but uncommitted: all 324 events
carry `color`, `text_color` and `image_width`/`image_height`, and all 324 still await `image_url`.

## The pipeline, as it actually exists

The image tree is **not in this repo** — it lives at `../when-images` (moved out to fix a
`vercel dev` bug, see [../dev-tooling/index.md](../dev-tooling/index.md)) and is not under git.
Nothing in it is version-controlled, so the scripts below exist only on the machine that made them.

1. **Prompts** — `all_prompts.csv`, 5 columns: `event_name, research_prompt, image_prompt,
image_generated, saved_filename`. Shape is governed by
   `when-images/claude_prompts/IMAGE_PROMPT_RUBRIC.md`: a fixed skeleton plus a per-event
   `EVENT_LINE`, `SCENE_DESCRIPTION` and era `ERA_PALETTE`.
2. **Generation** — an hourly scheduled browser task drives gemini.google.com, sending the
   research prompt then the image prompt in the same chat
   (`claude_prompts/SCHEDULED_TASK_PROMPT_BACKUP.md`). `scripts/generate_images.py` in this repo
   is the older direct-API path and is superseded.
3. **Downsample** — `when-images/scripts/downsample.py`, source → JPEG q80.
4. **Colours + dimensions** — `when-images/scripts/extract_colors.py`, Oklab k-means, writes
   into `public/events/*.json`.
5. **Upload** — `scripts/find_images_to_upload.js` stages into `to_upload/`; upload is manual
   via the Cloudinary dashboard.
6. **URLs** — `scripts/update-cloudinary-urls.js` (this repo) writes `image_url` back.

## What was built this session

Two new scripts in `when-images/scripts/`, mirroring the existing `build_missing_prompts.py` /
`assemble_missing_prompts.py` pair:

- **`build_sports_prompts.py`** — scopes to `sports.json` events lacking `image_url`, emits
  `compare-app/sports_prompts_work.json` with `friendly_name`, `year_string`, `description` and
  the rubric's era palette per event.
- **`assemble_sports_prompts.py`** — merges the subagent outputs into the rubric skeleton and
  writes `when-images/sports_prompts.csv` (324 rows, `all_prompts.csv` schema, status columns
  left empty).

**Twelve subagents × 27 events** each wrote `compare-app/sports_results_<a>-<b>.json` containing
a `research_focus` and `scene_description` per event. Every batch returned its full 27 and
web-verified period equipment.

### The assembler matches by `idx`, not positionally

`assemble_missing_prompts.py` matches each batch **positionally** against its work-file range, so
a batch that returns 26 items instead of 27 silently shifts every subsequent row onto the wrong
event. The new assembler keys on `idx` with an `event_name` cross-check and reports mismatches
instead. Prefer this when writing the next one.

## The trap: Gemini returned `.jpeg`, and the downsampler only globbed `.png`

The generated files arrived as **`.jpeg`**, not `.png`. `downsample.py` listed inputs with
`f.endswith(".png")`, so all 324 were invisible to it — the run would print
**"All images already processed. Use --force to reprocess."** and exit 0. A silent no-op that
looks like success, and `--force` would not have helped.

Fixed by adding an `INPUT_EXTS = (".png", ".jpg", ".jpeg")` constant and using it for both the
directory listing and `--file` extension resolution. `extract_colors.py` already accepted all
three (`build_image_index`), so it needed nothing.

**Generalise this:** the pipeline keys everything on the _filename stem_, and the output is always
`<stem>.jpg`, so the input extension is incidental — but only one of the two scripts knew that.
When a step reports zero work, check what it globs before concluding there is nothing to do.

## The "5297 images did not match any event" warning is expected

`extract_colors.py --category sports` reports thousands of unmatched images. This is an artefact
of the filter, not a problem: `matched_names` only accumulates inside the category loop, which
`--category` narrows to `sports.json`, so every image belonging to the other 20 categories is
counted as unmatched. The arithmetic confirms it — 5,621 images − 324 sports matches = 5,297.

## Prompt-writing rules that mattered

Sports-specific guidance given to the subagents, on top of the rubric:

- **Never describe text.** No scoreboards, signage, banners, engraved medals, inscribed trophies,
  jersey numbers, logos or sponsor marks — the renderer garbles text and the prompt suffix
  already bans it. This forced several events to be painted as their _cause_ or their _object_:
  the Ashes became the bowling moment at The Oval rather than the newspaper obituary; Naismith's
  rules became the nailed peach basket; the 24-second shot clock became a fast break, because a
  clock face forces digits.
- **Figurative over establishing.** One athlete mid-action, hands on era-correct equipment, at
  the decisive instant. Crowds as background silhouettes only. Founding/venue/rule events make
  the object or architecture the subject instead.
- **No colour words.** The era palette is appended automatically by the assembler; colour
  adjectives in the scene fight it. Cost: Secretariat loses "chestnut", and identifiability
  with it.
- **Likenesses by posture, not face.** Mandela, Jordan and similar were described by stance and
  gear, since renderers handle recognisable faces poorly.
- **Deaths and assaults kept non-graphic** — aftermath or object-led (Le Mans '55, Munich '72,
  Simpson, Kerrigan, Tyson).

One flagged for a second look: **the Olympic rings** are rendered as a hand inking five
interlocking circles, which brushes the no-logos rule. The rings _are_ the event, so there was no
clean alternative.

## Things checked so they need not be rechecked

- **`330×440` is the card aspect, not the source size.** The source renders are square (1024²);
  5,293 existing events store `330×440`. Pass `--width 330 --height 440` regardless of what the
  source measures.
- **`dpr_auto` in the stored `image_url` is harmless.** `update-cloudinary-urls.js` still writes
  it, contradicting [../cloudinary-cost-controls.md](../cloudinary-cost-controls.md), but it never
  reaches the CDN: `getImageUrl` in `src/utils/cloudinaryImage.ts` strips whatever transform
  segment is stored and substitutes the `w_400` / `w_768` rung. The stored string is only a
  public_id carrier.
- **`find_images_to_upload.js` wipes `to_upload/` itself** before staging, so no manual cleanup
  is needed, and it recomputes the missing set authoritatively from Cloudinary's live resource
  list. The stale 295-entry `cloudinary_delete_list.json` is safe to leave in place — already
  deleted public_ids simply are not in the live list.
- **A stray `generated_images/_stale_leftover_943kb.jpeg`** matches no event; it produces a junk
  downsampled file that later steps ignore.

## Next steps

1. Run `update-cloudinary-urls.js`, check the diff is `sports.json` only, then
   `npm run typecheck && CI=true npm test -- --watchAll=false`.
2. Commit with a `feat:` title and squash-merge — the Release Action ships it.
3. Once the URLs land, all 374 sports events become playable and the category stops relying on
   its 50 re-tagged events.
4. **[../events-images/index.md](../events-images/index.md) is now stale** where it says the
   `when-images` scripts "cannot be assumed to exist". The tree is intact and was used
   throughout this session: `sort_new_images.py`, `apply_decisions.py`, `delete_old_cloudinary.js`,
   `build_missing_prompts.py` and the `compare-app` are all present. Worth correcting.
5. Nothing in `when-images/` is under git, including the `downsample.py` fix and the two new
   scripts. If that machine is lost, so are they.
