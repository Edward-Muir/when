#!/usr/bin/env python3
"""
Build the art-generation CSV for the avatar portraits.

Usage:
  python3 scripts/avatars/avatar-art-prompts.py
  python3 scripts/avatars/avatar-art-prompts.py --out path/to.csv

One row per animal in src/data/avatars.json, from the hand-reviewed personas in
scripts/avatars/personas.json. See docs/avatars/index.md for the art spec.

## Same CSV contract as the event cards

    event_name,research_prompt,image_prompt,image_generated,saved_filename

so the scheduled browser task that drives gemini.google.com through the card CSVs
(scripts/events/theme-art-prompts.py) runs this one unchanged: it sends the research prompt and
then the image prompt in the same chat. `event_name` holds the animal id, which becomes the saved
file's stem and, after upload, the Cloudinary public_id's stem.

## Platypus and goldfish are skipped

Their preview portraits (public/avatars/preview/) are the final art, so they have no persona and
no row. Every other animal must have exactly one persona; a missing or unknown id is a hard error,
never a skipped row.

## A dark painted backdrop, not a cut-out

The prompt asks for the plain dark backdrop of the two previews, so a portrait needs no
background-removal step. The theme tint then shows only at the tile's edge.
"""

import argparse
import csv
import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AVATARS = os.path.join(BASE_DIR, "src", "data", "avatars.json")
PERSONAS = os.path.join(BASE_DIR, "scripts", "avatars", "personas.json")
DEFAULT_OUT = os.path.join(BASE_DIR, "docs", "avatars", "art", "avatar_prompts.csv")

COLUMNS = ["event_name", "research_prompt", "image_prompt", "image_generated", "saved_filename"]

# The art that already exists and is final.
SKIPPED = {"platypus", "goldfish"}

FIELDS = ["role", "persona", "feature", "expression", "costume", "prop", "light", "research_focus"]

SKELETON = (
    "A dramatic chiaroscuro oil painting in the manner of an Old Master {role} portrait. "
    "1:1 square composition optimized for very small screen viewing (it must read at 24 pixels). "
    "A tight head-and-shoulders bust of a {animal} as {persona}, its {feature} filling most of "
    "the frame, turned three-quarters toward the viewer with {expression}. It wears {costume}. "
    "One prop only: {prop}. Strong simple silhouette, high contrast, warm {light} from one side, "
    "rich painterly brushwork but no fine detail. Set against a plain dark painted backdrop, like "
    "a gallery portrait, with nothing else behind the figure. No text, no letters, no numbers, "
    "no labels, no borders, no frame, no watermarks."
)

RESEARCH = (
    "Search the web for reference photographs of the {animal}, and for Old Master and period "
    "portraits of a {role}. Study the {research_focus}."
)

# The card rules carry over: no colour adjectives (material nouns such as bronze are fine, and
# colour is left to the research step), and nothing the renderer would letter.
COLOUR_WORDS = [
    "red", "blue", "green", "yellow", "orange", "purple", "violet", "pink", "crimson", "scarlet",
    "azure", "teal", "turquoise", "white", "black", "brown", "grey", "gray", "golden", "silvery",
    "indigo", "maroon", "beige", "cream",
]
TEXT_WORDS = [
    "text", "book", "books", "map", "maps", "scroll", "scrolls", "letter", "letters", "sign",
    "signs", "banner", "banners", "inscription", "inscribed", "writing", "written", "words",
    "label", "labels", "newspaper", "page", "pages", "chart", "charts", "diploma",
]
BANNED = re.compile(r"\b(" + "|".join(COLOUR_WORDS + TEXT_WORDS) + r")\b", re.IGNORECASE)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def check(animals, personas):
    """Every animal but the skipped two has exactly one complete, rule-abiding persona."""
    errors = []
    known = {a["id"] for a in animals}
    for animal_id in personas:
        if animal_id not in known:
            errors.append(f"{animal_id}: not an animal in avatars.json")
        elif animal_id in SKIPPED:
            errors.append(f"{animal_id}: has final preview art and must not have a persona")
    for animal in animals:
        animal_id = animal["id"]
        if animal_id in SKIPPED:
            continue
        persona = personas.get(animal_id)
        if persona is None:
            errors.append(f"{animal_id}: no persona")
            continue
        for field in FIELDS:
            value = persona.get(field, "")
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{animal_id}.{field}: empty")
                continue
            if field == "research_focus":
                continue
            hit = BANNED.search(value)
            if hit:
                errors.append(f"{animal_id}.{field}: banned word {hit.group(0)!r} in {value!r}")
        extra = set(persona) - set(FIELDS)
        if extra:
            errors.append(f"{animal_id}: unexpected fields {sorted(extra)}")
    return errors


def previous_progress(path):
    """Carry image_generated / saved_filename across re-runs, by animal id."""
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8", newline="") as f:
        return {row["event_name"]: row for row in csv.DictReader(f)}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", default=DEFAULT_OUT)
    args = parser.parse_args()

    animals = load_json(AVATARS)["animals"]
    personas = load_json(PERSONAS)

    errors = check(animals, personas)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    progress = previous_progress(args.out)
    rows = []
    for animal in animals:
        animal_id = animal["id"]
        if animal_id in SKIPPED:
            continue
        p = {k: v.strip() for k, v in personas[animal_id].items()}
        name = animal["label"].lower()
        done = progress.get(animal_id, {})
        rows.append(
            {
                "event_name": animal_id,
                "research_prompt": RESEARCH.format(animal=name, **p),
                "image_prompt": SKELETON.format(animal=name, **p),
                "image_generated": done.get("image_generated", ""),
                "saved_filename": done.get("saved_filename", ""),
            }
        )

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {os.path.relpath(args.out, BASE_DIR)}")


if __name__ == "__main__":
    main()
