#!/usr/bin/env python3

"""
Extract dominant colors from local generated images and update event JSON files.

Reads .jpg files from downsampled_generated_images/ under the images folder (WHEN_IMAGES_DIR,
see scripts/images/paths.py), matches each filename to events by the `name` field, and writes
`color`, `text_color`, and optionally `image_width`/`image_height` into the event JSON files.

Uses the Oklab K-means algorithm from scripts/extract_event_colors.py. That script downloads the
Cloudinary thumbnail; this one reads the local JPEG, so it needs no network and no upload yet.

Dependencies: pip install Pillow numpy
Usage:
  python3 scripts/images/extract_colors.py              # Process all matched images
  python3 scripts/images/extract_colors.py --dry-run    # Preview without writing
  python3 scripts/images/extract_colors.py --force      # Re-extract even if color exists
  python3 scripts/images/extract_colors.py --force --slugs a,b   # Only these events
  python3 scripts/images/extract_colors.py --category conflict --sample 5
  python3 scripts/images/extract_colors.py --width 330 --height 440  # Set portrait dimensions
"""

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from paths import DOWNSAMPLED_DIR, EVENTS_DIR  # noqa: E402

IMAGES_DIR = DOWNSAMPLED_DIR
MANIFEST_FILE = EVENTS_DIR / "manifest.json"

# Import color extraction from the Cloudinary-thumbnail script, so the two never disagree.
sys.path.insert(0, str(SCRIPT_DIR.parent))
from extract_event_colors import extract_color  # noqa: E402


def build_image_index(images_dir: Path) -> dict[str, Path]:
    """Scan images directory and return {stem: Path} mapping."""
    index = {}
    for p in images_dir.iterdir():
        if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
            index[p.stem] = p
    return index


def process_events(args: argparse.Namespace) -> None:
    if not IMAGES_DIR.exists():
        print(f"Images directory not found: {IMAGES_DIR.resolve()}", file=sys.stderr)
        sys.exit(1)

    image_index = build_image_index(IMAGES_DIR)
    print(f"Found {len(image_index)} images in {IMAGES_DIR.resolve()}\n")

    slugs = {s.strip() for s in args.slugs.split(",") if s.strip()} if args.slugs else None
    if slugs:
        missing = sorted(s for s in slugs if s not in image_index)
        if missing:
            print(f"No downsampled image for: {', '.join(missing)}", file=sys.stderr)
            sys.exit(1)
        image_index = {k: v for k, v in image_index.items() if k in slugs}

    manifest = json.loads(MANIFEST_FILE.read_text())
    # New flat manifest format is {"files": [...]}; adapt to the per-category
    # shape the rest of this script expects (name = file stem, files = [that file]).
    categories = [{"name": Path(f).stem, "files": [f]} for f in manifest["files"]]

    if args.category:
        categories = [c for c in categories if c["name"] == args.category]
        if not categories:
            print(f"Category '{args.category}' not found in manifest.", file=sys.stderr)
            sys.exit(1)

    set_dims = args.width is not None and args.height is not None
    colors_updated = 0
    dims_updated = 0
    skipped_no_image = 0
    skipped_existing = 0
    failed = 0
    matched_names: set[str] = set()
    total_processed = 0

    for cat in categories:
        for filename in cat["files"]:
            filepath = EVENTS_DIR / filename
            if not filepath.exists():
                print(f"File not found: {filepath}", file=sys.stderr)
                continue

            events = json.loads(filepath.read_text())
            modified = False

            for event in events:
                if args.sample and total_processed >= args.sample:
                    break

                name = event.get("name", "")
                friendly = event.get("friendly_name", name)

                if name not in image_index:
                    skipped_no_image += 1
                    continue

                matched_names.add(name)

                # Check what needs updating
                has_color = bool(event.get("color"))
                has_matching_dims = (
                    event.get("image_width") == args.width
                    and event.get("image_height") == args.height
                ) if set_dims else True
                needs_color = not has_color or args.force
                needs_dims = set_dims and (not has_matching_dims or args.force)

                if not needs_color and not needs_dims:
                    skipped_existing += 1
                    continue

                # Extract color if needed
                if needs_color:
                    image_path = image_index[name]
                    image_bytes = image_path.read_bytes()
                    result = extract_color(image_bytes)

                    if not result:
                        print(f"  ⚠ Could not extract color for: {friendly}", file=sys.stderr)
                        failed += 1
                        continue

                    hex_color, text_color = result

                    if args.dry_run:
                        print(f"  {friendly}: {hex_color} (text: {text_color})", end="")
                    else:
                        event["color"] = hex_color
                        event["text_color"] = text_color
                        modified = True
                    colors_updated += 1
                else:
                    if args.dry_run:
                        print(f"  {friendly}:", end="")

                # Set dimensions if needed
                if needs_dims:
                    if args.dry_run:
                        print(f" dims: {args.width}x{args.height}", end="")
                    else:
                        event["image_width"] = args.width
                        event["image_height"] = args.height
                        modified = True
                    dims_updated += 1

                if args.dry_run:
                    print()  # newline

                total_processed += 1

            if modified and not args.dry_run:
                filepath.write_text(json.dumps(events, indent=2, ensure_ascii=False) + "\n")
                print(f"  Updated {filepath.name}")

            if args.sample and total_processed >= args.sample:
                break
        if args.sample and total_processed >= args.sample:
            break

    # Summary
    parts = []
    if colors_updated:
        parts.append(f"{colors_updated} colors extracted")
    if dims_updated:
        parts.append(f"{dims_updated} dimensions set ({args.width}x{args.height})")
    if skipped_existing:
        parts.append(f"{skipped_existing} skipped (already up to date)")
    if skipped_no_image:
        parts.append(f"{skipped_no_image} skipped (no image)")
    if failed:
        parts.append(f"{failed} failed")
    print(f"\nDone: {', '.join(parts) or 'nothing to do'}")

    # Report unmatched images
    unmatched = set(image_index.keys()) - matched_names
    if unmatched:
        print(f"\n⚠ {len(unmatched)} images did not match any event:")
        for name in sorted(unmatched):
            print(f"  - {name}")
        if slugs:
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Extract dominant colors from local generated images")
    parser.add_argument("--force", action="store_true", help="Re-extract even if color already exists")
    parser.add_argument("--category", type=str, help="Process only this manifest file's stem")
    parser.add_argument("--slugs", type=str, help="Process only these event names, comma-separated")
    parser.add_argument("--dry-run", action="store_true", help="Print colors without writing to JSON")
    parser.add_argument("--sample", type=int, help="Process only first N events")
    parser.add_argument("--width", type=int, help="Set image_width on matched events (requires --height)")
    parser.add_argument("--height", type=int, help="Set image_height on matched events (requires --width)")
    args = parser.parse_args()

    if (args.width is None) != (args.height is None):
        parser.error("--width and --height must be used together")

    process_events(args)


if __name__ == "__main__":
    main()
