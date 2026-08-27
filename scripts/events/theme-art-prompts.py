#!/usr/bin/env python3
"""
Build the art-generation CSV for events that have no image yet.

Curated themes are authored spine-first — design the deck, then write whatever the catalogue
lacks — so a new theme ships carrying events with no art. Those events are invisible to the
game: src/utils/eventLoader.ts filters the catalogue to Cloudinary-illustrated events, so an
un-illustrated slug is not a missing picture, it is a card the daily can never deal and the
publish validator reads as unresolved. This emits the file that gets them illustrated.

Usage:
  python3 scripts/events/theme-art-prompts.py
  python3 scripts/events/theme-art-prompts.py --out path/to.csv --scenes path/to/scenes

## The CSV contract is five columns, not four

    event_name,research_prompt,image_prompt,image_generated,saved_filename

The consumer is an hourly scheduled browser task driving gemini.google.com, and it sends **two
messages in the same chat**: the research prompt first, then the image prompt
(docs/sports-events/session-2026-08-20-sports-image-pipeline.md). Both in-repo generators used
to write four columns with no research prompt, which silently drops the priming step the image
prompt is written to depend on. Do not "simplify" this back to four.

## Why the prompts are short

Three prompt styles have existed, each lighter than the last, because shorter and less
prescriptive prompts render better once the model has already researched the period:

  1. regenerate_mobile_prompts.py — brushstroke/chiaroscuro preamble, a canned framing
     paragraph, and a four-colour era palette. ~54% of every prompt was byte-identical
     boilerplate.
  2. The sports batch — preamble trimmed, framing paragraph dropped, palette cut to three
     colours, scene hand-written.
  3. This one — the era palette **dropped entirely**. The palette clause was fighting the
     scene, and colour is meant to come from the research step.

So the only per-event text is the hand-authored scene, which is the point: everything a
template can supply is already in the skeleton.

## Scenes are hand-authored and live in git

`docs/curated-themes/art/scenes/<theme>.json` maps `{slug: {research_focus, scene}}`. They are
committed deliberately. The equivalent files for the Indonesia batch were only ever kept in an
untracked tree outside the repo and are now unrecoverable — the prompt skeleton that produced
those images had to be reconstructed from a prose description of it.

Joining is by slug and every mismatch is a hard error, never a skipped row: a scene for an
unknown or already-illustrated event, or an un-illustrated event with no scene, fails the run.
An earlier version of this pipeline matched positionally and silently dropped rows.
"""

import argparse
import csv
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EVENTS_DIR = os.path.join(BASE_DIR, "public", "events")
ART_DIR = os.path.join(BASE_DIR, "docs", "curated-themes", "art")
DEFAULT_OUT = os.path.join(ART_DIR, "all_prompts.csv")
DEFAULT_SCENES = os.path.join(ART_DIR, "scenes")

COLUMNS = ["event_name", "research_prompt", "image_prompt", "image_generated", "saved_filename"]

SKELETON = (
    "A dramatic chiaroscuro oil painting. 1:1 square composition optimized for small screen "
    "viewing. One dominant focal subject filling most of the frame. Strong silhouettes, high "
    "contrast. {friendly_name} — {description} {scene} "
    "No text, no dates, no numbers, no labels, no borders, no watermarks."
)

RESEARCH = (
    'Search the web for reference artworks and historical records of "{friendly_name}" '
    "({year_string}). Study the {research_focus} of this period."
)


def year_string(year):
    """1960 for CE, 430 BCE for BCE — the form the pipeline's existing rows use."""
    return f"{abs(year)} BCE" if year < 0 else str(year)


def sentence(text):
    """One trailing full stop, never two — the old builder appended one to an ended sentence."""
    return text if text.rstrip().endswith((".", "!", "?")) else text.rstrip() + "."


def build_research_prompt(event, scene):
    return RESEARCH.format(
        friendly_name=event["friendly_name"],
        year_string=year_string(event["year"]),
        research_focus=scene["research_focus"].rstrip(" ."),
    )


def build_image_prompt(event, scene):
    return SKELETON.format(
        friendly_name=event["friendly_name"],
        description=sentence(event["description"]),
        scene=sentence(scene["scene"]),
    )


def has_art(event):
    """Mirrors isCloudinaryImage in src/utils/cloudinaryImage.ts."""
    url = event.get("image_url") or ""
    return "res.cloudinary.com" in url and "/upload/" in url


def load_events():
    with open(os.path.join(EVENTS_DIR, "manifest.json")) as f:
        files = json.load(f)["files"]
    events = []
    for name in files:
        with open(os.path.join(EVENTS_DIR, name)) as f:
            events.extend(json.load(f))
    return events


def load_scenes(scenes_dir):
    scenes, source = {}, {}
    if not os.path.isdir(scenes_dir):
        sys.exit(f"No scenes directory at {scenes_dir}")
    for name in sorted(os.listdir(scenes_dir)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(scenes_dir, name)) as f:
            batch = json.load(f)
        for slug, entry in batch.items():
            if slug in scenes:
                sys.exit(f"{name}: {slug} already defined in {source[slug]}")
            missing = [k for k in ("research_focus", "scene") if not entry.get(k)]
            if missing:
                sys.exit(f"{name}: {slug} missing {', '.join(missing)}")
            scenes[slug] = entry
            source[slug] = name
    return scenes


def read_existing_status(path):
    """Carry image_generated / saved_filename across a regeneration, keyed by slug."""
    if not os.path.exists(path):
        return {}
    with open(path, newline="") as f:
        return {
            row["event_name"]: (row.get("image_generated", ""), row.get("saved_filename", ""))
            for row in csv.DictReader(f)
        }


def main():
    parser = argparse.ArgumentParser(description="Build the art-prompt CSV for un-illustrated events.")
    parser.add_argument("--out", default=DEFAULT_OUT, help="CSV path to write")
    parser.add_argument("--scenes", default=DEFAULT_SCENES, help="Directory of scene JSON files")
    args = parser.parse_args()

    events = load_events()
    pending = {e["name"]: e for e in events if not has_art(e)}
    illustrated = {e["name"] for e in events if has_art(e)}
    scenes = load_scenes(args.scenes)

    # Hard errors, both directions. A silently skipped row is how a batch ends up half-generated.
    unknown = sorted(s for s in scenes if s not in pending and s not in illustrated)
    already = sorted(s for s in scenes if s in illustrated)
    unscened = sorted(s for s in pending if s not in scenes)
    problems = []
    if unknown:
        problems.append(f"{len(unknown)} scene(s) name no such event: {', '.join(unknown)}")
    if already:
        problems.append(f"{len(already)} scene(s) name an already-illustrated event: {', '.join(already)}")
    if unscened:
        problems.append(f"{len(unscened)} un-illustrated event(s) have no scene: {', '.join(unscened)}")
    if problems:
        sys.exit("\n".join(problems))

    status = read_existing_status(args.out)
    rows = []
    for event in sorted(pending.values(), key=lambda e: e["year"]):
        scene = scenes[event["name"]]
        generated, saved = status.get(event["name"], ("", ""))
        rows.append(
            [
                event["name"],
                build_research_prompt(event, scene),
                build_image_prompt(event, scene),
                generated,
                saved,
            ]
        )

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(COLUMNS)
        writer.writerows(rows)

    carried = sum(1 for r in rows if r[3] or r[4])
    print(f"Wrote {len(rows)} prompts to {os.path.relpath(args.out, BASE_DIR)}")
    print(f"  scenes read: {len(scenes)} from {os.path.relpath(args.scenes, BASE_DIR)}")
    if carried:
        print(f"  carried existing generation status for {carried} row(s)")


if __name__ == "__main__":
    main()
