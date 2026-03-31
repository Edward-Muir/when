#!/usr/bin/env python3
"""
Updates event JSON files to point to locally generated images
instead of Wikimedia URLs.

Run this after generate_images.py has produced images.

Usage:
  python scripts/update_event_images.py          # Preview changes
  python scripts/update_event_images.py --apply   # Apply changes to JSON files
"""

import json
import argparse
from pathlib import Path

EVENTS_DIR = Path("public/events")
IMAGE_DIR = Path("public/events/images")
PROGRESS_FILE = Path("scripts/image_gen_progress.json")
MANIFEST_FILE = EVENTS_DIR / "manifest.json"

# Standard dimensions for 16:9 generated images
GENERATED_WIDTH = 1024
GENERATED_HEIGHT = 576


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to JSON files")
    args = parser.parse_args()

    # Load progress to know which events have generated images
    if not PROGRESS_FILE.exists():
        print("No progress file found. Run generate_images.py first.")
        return

    with open(PROGRESS_FILE) as f:
        progress = json.load(f)

    generated = progress.get("generated", {})
    print(f"Found {len(generated)} generated images\n")

    # Load manifest
    with open(MANIFEST_FILE) as f:
        manifest = json.load(f)

    total_updated = 0

    for cat in manifest["categories"]:
        for filename in cat["files"]:
            filepath = EVENTS_DIR / filename
            with open(filepath) as f:
                events = json.load(f)

            updated_count = 0
            for event in events:
                name = event["name"]
                image_path = IMAGE_DIR / f"{name}.png"

                if name in generated and image_path.exists():
                    # Build the relative URL for the web app
                    new_url = f"/events/images/{name}.png"

                    if event.get("image_url") != new_url:
                        old_url = event.get("image_url", "none")
                        event["image_url"] = new_url
                        event["image_width"] = GENERATED_WIDTH
                        event["image_height"] = GENERATED_HEIGHT
                        # Preserve original URL for reference
                        if "original_image_url" not in event and old_url != "none":
                            event["original_image_url"] = old_url
                        updated_count += 1

            if updated_count > 0:
                print(f"  {filename}: {updated_count} events to update")
                total_updated += updated_count

                if args.apply:
                    with open(filepath, "w") as f:
                        json.dump(events, f, indent=2)
                    print(f"    ✓ Written to {filepath}")

    print(f"\nTotal: {total_updated} events {'updated' if args.apply else 'would be updated'}")
    if not args.apply and total_updated > 0:
        print("Run with --apply to write changes to disk.")


if __name__ == "__main__":
    main()
