#!/usr/bin/env python3
"""
Art-generation prompts for newly-authored curated-theme events.

The curated themes in docs/curated-themes/ are authored spine-first — the deck is designed,
then whatever the catalogue lacks is written — so most themes ship carrying events that have
no art yet. Those events are invisible to the game: src/utils/eventLoader.ts filters the
catalogue to Cloudinary-illustrated events, so an un-illustrated slug is not merely a missing
picture, it is a card the daily can never deal and the publish validator reads as unresolved.

This emits the CSV the (out-of-repo) image pipeline consumes, for exactly those events.

Usage:
  python3 scripts/events/theme-art-prompts.py                     # every event lacking art
  python3 scripts/events/theme-art-prompts.py --out path/to.csv
  python3 scripts/events/theme-art-prompts.py --file public/events/themes.json

Output columns match scripts/regenerate_mobile_prompts.py exactly —
`event_name,prompt,image_generated,saved_filename` — because that is the contract the
pipeline reads. The two status columns are left blank for the pipeline to fill in.

Style is imported from regenerate_mobile_prompts rather than copied, so there is one
definition of what a "When" card looks like. What is NOT reused is that module's `framing`
map: its branches key off `conflict`/`cultural`/`diplomatic`/`exploration`/`infrastructure`,
which were FILE names, not categories. The taxonomy was re-clustered into 21 categories and
none of those five is a valid `Category` any more, so every modern event falls through to its
generic `else`. The map below covers all 21 real values from src/types/index.ts.
"""

import argparse
import csv
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EVENTS_DIR = os.path.join(BASE_DIR, "public", "events")
DEFAULT_OUT = os.path.join(BASE_DIR, "docs", "curated-themes", "art", "all_prompts.csv")

sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
from regenerate_mobile_prompts import (  # noqa: E402
    MOBILE_PREFIX,
    STYLE_SUFFIX,
    get_era_palette,
)

# One framing note per category in ALL_CATEGORIES (src/types/index.ts). Each says what fills
# the frame, because the card is read at ~130px wide on a phone and a wide scene reads as mud.
FRAMING = {
    "empires": "A single throne, crown, standard or seated ruler dominating the frame. Regalia and power made physical, not a map or a crowd.",
    "revolution": "One figure mid-gesture at the moment of defiance — a raised arm, a torn banner, a barricade edge. Close, urgent, few people.",
    "architecture": "The structure filling the frame from a dramatic low angle. One or two human figures for scale. Strong geometry and clean lines.",
    "writing": "A single page, tablet, scroll or press forme filling the frame, lit raking across its surface so the marks catch the light.",
    "invention": "The device itself, close and centred, shown as an object of craft. One pair of hands at most. Background dissolved to shadow.",
    "figures": "A portrait — head and shoulders, three-quarter turn, one strong light source. The face is the subject; setting is suggestion only.",
    "media": "The apparatus of transmission close up — a horn, lens, microphone, screen — glowing against a darkened surround.",
    "craft": "Hands and material at the moment of transformation. Extreme foreground detail of the process; the workshop reduced to warm shadow.",
    "diplomacy": "Tight composition on hands, seals or documents at the pivotal moment. Dramatic lighting on the paper, dark surroundings.",
    "disasters": "One dramatic focal point — a single building, ship, or fissure — dominating the frame, with one human figure for scale.",
    "commerce": "A single counter, ledger, scale or storefront, close in. The exchange itself as the subject, not a market crowd.",
    "law": "A document, seal, gavel or carved statute filling the frame, lit hard from one side. Weight and permanence over people.",
    "agriculture": "One pair of hands, one animal or one plant close in the foreground, with the worked land falling away simplified behind.",
    "warfare": "Close-up dramatic angle on one or two figures at a single iconic moment, not a wide battlefield. Blurred, minimal background.",
    "science": "The instrument or specimen close and central, with the observer implied — a hand, an eye at a lens. Dark, focused, lamplit.",
    "trade": "One vessel, cargo, camel or crate at the point of exchange, large in frame, with the route suggested rather than drawn.",
    "migration": "One or two travelling figures large in the foreground, their destination a simplified suggestion behind them.",
    "art": "The artwork, instrument or performer close and central, lit theatrically. The act of making or playing, not the audience.",
    "medicine": "Hands, instrument and patient in tight framing. One clear focal point, sterile or candlelit depending on era, dark surround.",
    "nature": "A single organism, rock face or natural feature filling the frame, with the landscape reduced to a simple silhouette behind.",
    "sports": "One athlete at the decisive instant — mid-throw, mid-stride, mid-grip — filling the frame. The crowd is texture, not subject.",
}
GENERIC_FRAMING = "Close-up with one dominant subject. Strong contrast and simplified background."


def build_prompt(event):
    """Mirrors regenerate_mobile_prompts.generate_scene, with the category map repaired."""
    scene = f"{event['friendly_name']} — {event['description']}"
    framing = FRAMING.get(event.get("category"), GENERIC_FRAMING)
    palette = get_era_palette(event["year"])
    return (
        "A dramatic oil painting with rich visible brushstrokes and chiaroscuro lighting. "
        f"1:1 square composition. {MOBILE_PREFIX} {scene}. {framing} {palette} painting "
        f"aesthetic. {STYLE_SUFFIX}"
    )


def has_art(event):
    """Mirrors isCloudinaryImage in src/utils/cloudinaryImage.ts."""
    url = event.get("image_url") or ""
    return "res.cloudinary.com" in url and "/upload/" in url


def load_events(explicit_files):
    if explicit_files:
        files = explicit_files
    else:
        with open(os.path.join(EVENTS_DIR, "manifest.json")) as f:
            files = [os.path.join(EVENTS_DIR, name) for name in json.load(f)["files"]]

    events = []
    for path in files:
        with open(path) as f:
            events.extend(json.load(f))
    return events


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=DEFAULT_OUT, help="CSV path to write")
    parser.add_argument(
        "--file",
        action="append",
        dest="files",
        help="Read events from this file instead of the manifest (repeatable)",
    )
    args = parser.parse_args()

    events = load_events(args.files)
    pending = [e for e in events if not has_art(e)]
    pending.sort(key=lambda e: e["year"])

    if not pending:
        print("Every event already has art — nothing to generate.")
        return

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["event_name", "prompt", "image_generated", "saved_filename"])
        for event in pending:
            writer.writerow([event["name"], build_prompt(event), "", ""])

    print(f"Wrote {len(pending)} prompts to {os.path.relpath(args.out, BASE_DIR)}")
    uncategorised = sorted({e.get("category") for e in pending} - set(FRAMING))
    if uncategorised:
        print(f"  ! fell back to generic framing for category: {', '.join(map(str, uncategorised))}")


if __name__ == "__main__":
    main()
