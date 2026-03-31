#!/usr/bin/env python3
"""
When? Game — AI Image Generator via Gemini API
Generates historical illustration images for game events using Google Gemini.
Designed to run daily, respecting the ~100 images/day Pro tier limit.

Usage:
  # First time setup:
  export GEMINI_API_KEY="your-api-key-here"
  pip install google-genai Pillow

  # Run (generates up to DAILY_LIMIT images per run):
  python scripts/generate_images.py

  # Dry run (just generate prompts, no API calls):
  python scripts/generate_images.py --dry-run

  # Override daily limit:
  python scripts/generate_images.py --limit 50

  # Generate for specific category only:
  python scripts/generate_images.py --category conflict
"""

import json
import os
import sys
import time
import base64
import argparse
from pathlib import Path
from datetime import datetime, date

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DAILY_LIMIT = 95  # stay a bit under 100 to avoid hitting hard cap
IMAGE_DIR = Path("public/events/images")
PROGRESS_FILE = Path("scripts/image_gen_progress.json")
EVENTS_DIR = Path("public/events")
MANIFEST_FILE = EVENTS_DIR / "manifest.json"
ASPECT_RATIO = "16:9"
MODEL = "gemini-2.0-flash-preview-image-generation"

# Category-specific art direction modifiers
CATEGORY_STYLE = {
    "conflict": (
        "Depict a dramatic battle or military scene. Show soldiers, weapons, and "
        "formations authentic to the era. Use dynamic composition with strong "
        "diagonal lines suggesting movement and conflict. Include period-accurate "
        "armor, uniforms, or weaponry."
    ),
    "cultural": (
        "Depict the cultural achievement or artistic milestone. Show the creative "
        "work, performers, thinkers, or cultural setting. Emphasize the human "
        "element — artists at work, audiences gathered, or the artifact itself "
        "in its original context."
    ),
    "diplomatic": (
        "Depict the political or diplomatic event. Show leaders, treaties, "
        "negotiations, or the political setting. Include period-appropriate "
        "clothing, architecture, and symbols of authority. Emphasize the gravity "
        "of the moment."
    ),
    "disasters": (
        "Depict the natural or man-made disaster dramatically. Show the scale "
        "and impact — destruction, natural forces, or human response. Use "
        "dramatic lighting (fire glow, storm clouds, volcanic ash) to convey "
        "the catastrophic nature of the event."
    ),
    "exploration": (
        "Depict the discovery, exploration, or scientific achievement. Show "
        "explorers, scientists, or the moment of discovery. Include period "
        "ships, instruments, landscapes, or laboratories. Emphasize the sense "
        "of wonder and human curiosity."
    ),
    "infrastructure": (
        "Depict the engineering achievement or construction. Show the structure "
        "being built or in its completed glory. Include workers, machinery, or "
        "crowds marveling at the achievement. Emphasize scale and human "
        "ingenuity."
    ),
}

# Era-specific visual cues
def get_era_style(year: int) -> str:
    """Return era-appropriate visual direction based on the year."""
    if year < -100000:
        return (
            "Prehistoric setting. Raw, primal landscape. No human structures. "
            "Dramatic geological or cosmic scenery. Deep earth tones and "
            "volcanic oranges."
        )
    if year < -3000:
        return (
            "Ancient prehistoric/neolithic setting. Simple stone or mud "
            "structures, primitive tools, tribal clothing. Warm ochre and "
            "sienna palette."
        )
    if year < -500:
        return (
            "Ancient Near East / Bronze Age setting. Ziggurats, chariots, "
            "bronze weapons, cuneiform tablets. Rich golds and deep blues."
        )
    if year < 500:
        return (
            "Classical antiquity setting. Greco-Roman or Han Chinese "
            "architecture, togas or robes, marble columns, iron weapons. "
            "White marble, terracotta, and laurel green palette."
        )
    if year < 1400:
        return (
            "Medieval setting. Castles, cathedrals, illuminated manuscripts, "
            "chainmail, feudal courts. Rich burgundy, gold leaf, and deep "
            "forest green palette."
        )
    if year < 1600:
        return (
            "Renaissance setting. Classical revival architecture, elaborate "
            "clothing, oil painting aesthetic, early firearms. Rich warm "
            "palette with chiaroscuro lighting."
        )
    if year < 1800:
        return (
            "Early modern / Age of Enlightenment setting. Baroque or "
            "neoclassical architecture, powdered wigs, sailing ships, "
            "muskets. Warm candlelight tones with deep shadows."
        )
    if year < 1900:
        return (
            "19th century / Industrial Age setting. Steam engines, top hats, "
            "gas lamps, ironworks, colonial era. Sepia and iron-grey palette "
            "with warm amber highlights."
        )
    if year < 1950:
        return (
            "Early 20th century setting. World wars, Art Deco, early aviation, "
            "radio era. Muted khaki, steel blue, and vintage photograph tones."
        )
    if year < 2000:
        return (
            "Late 20th century setting. Cold War, space age, computers, "
            "television era. Clean modernist aesthetic with period-accurate "
            "technology."
        )
    return (
        "21st century / contemporary setting. Modern technology, global "
        "connectivity, contemporary architecture. Clean, sharp, modern "
        "aesthetic."
    )


def build_prompt(event: dict) -> str:
    """Build a Gemini image generation prompt for an event."""
    name = event["friendly_name"]
    year = event["year"]
    desc = event["description"]
    category = event.get("category", "exploration")

    # Format the year display
    if year < 0:
        year_str = f"{abs(year):,} BCE"
    else:
        year_str = f"{year} CE"

    category_direction = CATEGORY_STYLE.get(category, CATEGORY_STYLE["exploration"])
    era_direction = get_era_style(year)

    prompt = (
        f"Create a historical illustration depicting: {name} ({year_str}). "
        f"{desc} "
        f"\n\nArt direction: {category_direction} "
        f"\n\nEra context: {era_direction} "
        f"\n\nStyle requirements: Render as a detailed historical illustration "
        f"with the rich, textured quality of a vintage engraving or hand-colored "
        f"print. Use muted earth tones — burnt umber, raw sienna, aged parchment "
        f"— with selective warm highlights in gold or amber to draw the eye to "
        f"the focal point. Include fine crosshatching or stippling texture. "
        f"The image should feel like a plate from an antique history book. "
        f"Compose for 16:9 landscape format with the key subject prominent. "
        f"No text, no labels, no borders, no watermarks."
    )
    return prompt


# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------

def load_progress() -> dict:
    """Load generation progress from disk."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"generated": {}, "errors": {}, "runs": []}


def save_progress(progress: dict):
    """Save generation progress to disk."""
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


# ---------------------------------------------------------------------------
# Event loading
# ---------------------------------------------------------------------------

def load_all_events(category_filter: str = None) -> list[dict]:
    """Load all events from the manifest, optionally filtered by category."""
    with open(MANIFEST_FILE) as f:
        manifest = json.load(f)

    events = []
    for cat in manifest["categories"]:
        if category_filter and cat["name"] != category_filter:
            continue
        for filename in cat["files"]:
            filepath = EVENTS_DIR / filename
            with open(filepath) as f:
                cat_events = json.load(f)
                for evt in cat_events:
                    evt["_source_file"] = filename
                events.extend(cat_events)

    return events


# ---------------------------------------------------------------------------
# Image generation
# ---------------------------------------------------------------------------

def generate_image(client, prompt: str, event_name: str) -> bytes | None:
    """Call Gemini API to generate an image. Returns PNG bytes or None."""
    from google.genai import types

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio=ASPECT_RATIO,
                ),
            ),
        )

        # Extract image from response
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    return base64.b64decode(part.inline_data.data)

        print(f"  ⚠ No image in response for {event_name}")
        return None

    except Exception as e:
        print(f"  ✗ Error generating {event_name}: {e}")
        return None


def save_image(image_bytes: bytes, event_name: str) -> str:
    """Save image bytes to disk. Returns the relative path."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{event_name}.png"
    filepath = IMAGE_DIR / filename
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    return str(filepath)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate images for When? events")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts only, no API calls")
    parser.add_argument("--limit", type=int, default=DAILY_LIMIT, help=f"Max images per run (default: {DAILY_LIMIT})")
    parser.add_argument("--category", type=str, default=None, help="Only process this category")
    parser.add_argument("--prompts-file", type=str, default=None, help="Export prompts to JSON file")
    args = parser.parse_args()

    # Load progress
    progress = load_progress()
    generated = progress["generated"]  # event_name -> image_path
    errors = progress["errors"]  # event_name -> error_message

    # Load events
    events = load_all_events(args.category)
    total_events = len(events)

    # Filter to events that still need images
    pending = [e for e in events if e["name"] not in generated]
    already_done = total_events - len(pending)

    print(f"{'='*60}")
    print(f"When? Image Generator")
    print(f"{'='*60}")
    print(f"Total events:     {total_events}")
    print(f"Already generated: {already_done}")
    print(f"Pending:          {len(pending)}")
    print(f"Today's limit:    {args.limit}")
    print(f"Days remaining:   {max(1, len(pending) // args.limit)}")
    print(f"{'='*60}")

    if not pending:
        print("✓ All events have images! Nothing to do.")
        return

    # If exporting prompts only
    if args.prompts_file:
        prompts = []
        for event in pending:
            prompts.append({
                "name": event["name"],
                "friendly_name": event["friendly_name"],
                "year": event["year"],
                "category": event.get("category", "unknown"),
                "prompt": build_prompt(event),
            })
        with open(args.prompts_file, "w") as f:
            json.dump(prompts, f, indent=2)
        print(f"Exported {len(prompts)} prompts to {args.prompts_file}")
        return

    if args.dry_run:
        for event in pending[:5]:
            print(f"\n--- {event['friendly_name']} ({event['year']}) ---")
            print(build_prompt(event))
        print(f"\n... and {len(pending) - 5} more")
        return

    # Initialize Gemini client
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("✗ GEMINI_API_KEY environment variable not set!")
        print("  Run: export GEMINI_API_KEY='your-key-here'")
        sys.exit(1)

    from google import genai
    client = genai.Client(api_key=api_key)

    # Generate images
    batch = pending[:args.limit]
    run_log = {
        "date": date.today().isoformat(),
        "started": datetime.now().isoformat(),
        "attempted": 0,
        "succeeded": 0,
        "failed": 0,
    }

    print(f"\nGenerating {len(batch)} images...\n")

    for i, event in enumerate(batch):
        name = event["name"]
        friendly = event["friendly_name"]
        print(f"[{i+1}/{len(batch)}] {friendly}...", end=" ", flush=True)

        prompt = build_prompt(event)
        run_log["attempted"] += 1

        image_bytes = generate_image(client, prompt, name)

        if image_bytes:
            path = save_image(image_bytes, name)
            generated[name] = path
            run_log["succeeded"] += 1
            print(f"✓ saved ({len(image_bytes)//1024}KB)")
        else:
            errors[name] = f"Failed on {date.today().isoformat()}"
            run_log["failed"] += 1
            print("✗ failed")

        # Brief pause to be respectful of rate limits
        if i < len(batch) - 1:
            time.sleep(2)

    # Save progress
    run_log["finished"] = datetime.now().isoformat()
    progress["runs"].append(run_log)
    progress["generated"] = generated
    progress["errors"] = errors
    save_progress(progress)

    # Summary
    print(f"\n{'='*60}")
    print(f"Run complete!")
    print(f"  Generated: {run_log['succeeded']}")
    print(f"  Failed:    {run_log['failed']}")
    print(f"  Total done: {len(generated)}/{total_events}")
    remaining = total_events - len(generated)
    if remaining > 0:
        print(f"  Remaining: {remaining} (~{max(1, remaining // args.limit)} more days)")
    else:
        print(f"  ✓ All events complete!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
