#!/usr/bin/env python3
"""
Build the art-generation CSV for the avatar portraits.

Usage:
  python3 scripts/avatars/avatar-art-prompts.py
  python3 scripts/avatars/avatar-art-prompts.py --out path/to.csv
  python3 scripts/avatars/avatar-art-prompts.py --earned

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

## --earned: the achievement portraits

The pick-only creatures in avatars.json's `earned` list (one per achievement), from
scripts/avatars/earned-personas.json, into docs/avatars/art/earned_prompts.csv. Same template,
same rules, same five-column contract. None is skipped, every `achievementId` must be a badge id in
src/data/achievements.ts, and no badge may have two.

They are image-only: `research_prompt` is left empty, which means send the image prompt alone,
in a fresh chat. A portrait is a stylised bust, not a historical scene, so the priming step the
event cards rely on adds nothing; earned personas have no `research_focus`.

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
EARNED_PERSONAS = os.path.join(BASE_DIR, "scripts", "avatars", "earned-personas.json")
EARNED_OUT = os.path.join(BASE_DIR, "docs", "avatars", "art", "earned_prompts.csv")
ACHIEVEMENTS = os.path.join(BASE_DIR, "src", "data", "achievements.ts")

COLUMNS = ["event_name", "research_prompt", "image_prompt", "image_generated", "saved_filename"]

# The art that already exists and is final: the two previews, and a dog made outside the CSV.
SKIPPED = {"platypus", "goldfish", "dog"}

FIELDS = ["role", "persona", "feature", "expression", "costume", "prop", "light", "research_focus"]
# Optional: how the prompt names the animal when the label is too plain ("Burmilla cat" for Cat).
OPTIONAL_FIELDS = ["animal"]

SKELETON = (
    "A dramatic chiaroscuro oil painting in the manner of an Old Master {role} portrait. "
    "1:1 square composition optimized for very small screen viewing (it must read at 24 pixels). "
    "A tight head-and-shoulders bust of {a_animal} as {persona}, its {feature} filling most of "
    "the frame, turned three-quarters toward the viewer with {expression}. It wears {costume}. "
    "One prop only: {prop}. Strong simple silhouette, high contrast, warm {light} from one side, "
    "rich painterly brushwork but no fine detail. Set against a plain dark painted backdrop, like "
    "a gallery portrait, with nothing else behind the figure. No text, no letters, no numbers, "
    "no labels, no borders, no frame, no watermarks."
)

RESEARCH = (
    "Search the web for reference photographs of the {animal}, and for Old Master and period "
    "portraits of {a_role}. Study the {research_focus}."
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


def article(phrase):
    """'an owl', 'an Imperial Vienna concert conductor', 'a tiger'."""
    return ("an " if phrase[:1].lower() in "aeiou" else "a ") + phrase


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def check(animals, personas, skipped, fields):
    """Every animal but the skipped ones has exactly one complete, rule-abiding persona."""
    errors = []
    known = {a["id"] for a in animals}
    for animal_id in personas:
        if animal_id not in known:
            errors.append(f"{animal_id}: not in avatars.json")
        elif animal_id in skipped:
            errors.append(f"{animal_id}: has final preview art and must not have a persona")
    for animal in animals:
        animal_id = animal["id"]
        if animal_id in skipped:
            continue
        persona = personas.get(animal_id)
        if persona is None:
            errors.append(f"{animal_id}: no persona")
            continue
        for field in fields:
            value = persona.get(field, "")
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{animal_id}.{field}: empty")
                continue
            if field == "research_focus":
                continue
            hit = BANNED.search(value)
            if hit:
                errors.append(f"{animal_id}.{field}: banned word {hit.group(0)!r} in {value!r}")
        for field in OPTIONAL_FIELDS:
            value = persona.get(field)
            if value is not None and (not isinstance(value, str) or BANNED.search(value)):
                errors.append(f"{animal_id}.{field}: must be a plain string, got {value!r}")
        extra = set(persona) - set(fields) - set(OPTIONAL_FIELDS)
        if extra:
            errors.append(f"{animal_id}: unexpected fields {sorted(extra)}")
    return errors


def check_badges(earned):
    """Every earned portrait names a real badge, and no badge has two."""
    with open(ACHIEVEMENTS, encoding="utf-8") as f:
        badges = set(re.findall(r"^\s*id: '([^']+)',", f.read(), re.MULTILINE))
    errors = []
    seen = {}
    for portrait in earned:
        badge = portrait.get("achievementId")
        if badge not in badges:
            errors.append(f"{portrait['id']}: achievementId {badge!r} is not a badge")
        elif badge in seen:
            errors.append(f"{portrait['id']}: badge {badge} already earns {seen[badge]}")
        else:
            seen[badge] = portrait["id"]
    return errors


def previous_progress(path):
    """Carry image_generated / saved_filename across re-runs, by animal id."""
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8", newline="") as f:
        return {row["event_name"]: row for row in csv.DictReader(f)}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out")
    parser.add_argument(
        "--earned", action="store_true", help="the achievement portraits, not the 62 animals"
    )
    args = parser.parse_args()

    if args.earned:
        animals = load_json(AVATARS)["earned"]
        personas = load_json(EARNED_PERSONAS)
        # Image-only: no research step, so no research_focus and an empty research_prompt.
        fields = [f for f in FIELDS if f != "research_focus"]
        skipped, research, out = set(), None, args.out or EARNED_OUT
        errors = check(animals, personas, skipped, fields) + check_badges(animals)
    else:
        animals = load_json(AVATARS)["animals"]
        personas = load_json(PERSONAS)
        skipped, research, out = SKIPPED, RESEARCH, args.out or DEFAULT_OUT
        errors = check(animals, personas, skipped, FIELDS)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    progress = previous_progress(out)
    rows = []
    for animal in animals:
        animal_id = animal["id"]
        if animal_id in skipped:
            continue
        p = {k: v.strip() for k, v in personas[animal_id].items()}
        name = p.pop("animal", None) or animal["label"].lower()
        done = progress.get(animal_id, {})
        rows.append(
            {
                "event_name": animal_id,
                "research_prompt": (
                    research.format(animal=name, a_role=article(p["role"]), **p) if research else ""
                ),
                "image_prompt": SKELETON.format(animal=name, a_animal=article(name), **p),
                "image_generated": done.get("image_generated", ""),
                "saved_filename": done.get("saved_filename", ""),
            }
        )

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {os.path.relpath(out, BASE_DIR)}")


if __name__ == "__main__":
    main()
