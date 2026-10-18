#!/usr/bin/env python3

"""
Downsample generated art to JPEG for Cloudinary upload.

Converts the ~3.5 MB 2048px Gemini downloads to ~200-500 KB JPEGs, keyed on the file stem
(the event slug). Cloudinary handles final format delivery (WebP/AVIF) via f_auto.

The folders default to `generated_images/` and `downsampled_generated_images/` under the images
folder, which is WHEN_IMAGES_DIR (see scripts/images/paths.py; default ../when-images).

Usage:
  python3 scripts/images/downsample.py                     # Process new images only
  python3 scripts/images/downsample.py --force             # Reprocess all
  python3 scripts/images/downsample.py --quality 85        # Override JPEG quality (default: 80)
  python3 scripts/images/downsample.py --slugs a,b --force # Only these stems (the factory's C3)
  python3 scripts/images/downsample.py --input DIR --output DIR
"""

import argparse
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import DOWNSAMPLED_DIR, GENERATED_DIR  # noqa: E402

INPUT_DIR = GENERATED_DIR
OUTPUT_DIR = DOWNSAMPLED_DIR

INPUT_EXTS = (".png", ".jpg", ".jpeg")

DEFAULT_QUALITY = 80
CONCURRENCY = 5


def format_bytes(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    kb = size / 1024
    if kb < 1024:
        return f"{kb:.0f} KB"
    return f"{kb / 1024:.1f} MB"


def process_image(filename: str, quality: int) -> dict:
    input_path = INPUT_DIR / filename
    output_filename = Path(filename).stem + ".jpg"
    output_path = OUTPUT_DIR / output_filename

    input_size = input_path.stat().st_size

    with Image.open(input_path) as img:
        # Convert RGBA to RGB (JPEG doesn't support alpha)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(output_path, "JPEG", quality=quality, optimize=True)

    output_size = output_path.stat().st_size
    reduction = (1 - output_size / input_size) * 100

    return {
        "filename": filename,
        "input_size": input_size,
        "output_size": output_size,
        "reduction": reduction,
    }


def main():
    parser = argparse.ArgumentParser(description="Downsample PNGs to JPEG for Cloudinary")
    parser.add_argument("--file", type=str, help="Process a single source file by name, with or without extension (e.g. elvis-first-single)")
    parser.add_argument("--slugs", type=str, help="Process only these stems, comma-separated")
    parser.add_argument("--input", type=str, help=f"Source folder (default: {GENERATED_DIR})")
    parser.add_argument("--output", type=str, help=f"Output folder (default: {DOWNSAMPLED_DIR})")
    parser.add_argument("--force", action="store_true", help="Reprocess all images")
    parser.add_argument(
        "--quality", type=int, default=DEFAULT_QUALITY, help=f"JPEG quality 1-100 (default: {DEFAULT_QUALITY})"
    )
    args = parser.parse_args()

    if args.quality < 1 or args.quality > 100:
        print("Quality must be between 1 and 100")
        sys.exit(1)

    global INPUT_DIR, OUTPUT_DIR
    if args.input:
        INPUT_DIR = Path(args.input)
    if args.output:
        OUTPUT_DIR = Path(args.output)

    print("Image Downsampler")
    print(f"  Input:   {INPUT_DIR.resolve()}")
    print(f"  Output:  {OUTPUT_DIR.resolve()}")
    print(f"  Quality: {args.quality}")
    print(f"  Force:   {args.force}\n")

    if not INPUT_DIR.exists():
        print(f"Input directory not found: {INPUT_DIR.resolve()}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.file:
        # Single file mode
        filename = args.file
        if not filename.lower().endswith(INPUT_EXTS):
            filename = next(
                (filename + ext for ext in INPUT_EXTS if (INPUT_DIR / (filename + ext)).exists()),
                filename + ".png",
            )
        if not (INPUT_DIR / filename).exists():
            print(f"File not found: {INPUT_DIR.resolve() / filename}")
            sys.exit(1)
        to_process = [filename]
        print(f"Processing single file: {filename}\n")
    else:
        # Gemini has emitted both .png and .jpeg over the life of the pipeline;
        # accept either, since the output is always a .jpg keyed on the stem.
        all_inputs = sorted(f for f in os.listdir(INPUT_DIR) if f.lower().endswith(INPUT_EXTS))
        if args.slugs:
            wanted = {s.strip() for s in args.slugs.split(",") if s.strip()}
            all_inputs = [f for f in all_inputs if Path(f).stem in wanted]
            missing = sorted(wanted - {Path(f).stem for f in all_inputs})
            if missing:
                # A named slug with no source file is a broken hand-off, never a skip.
                print(f"No source image for: {', '.join(missing)}")
                sys.exit(1)
        print(f"Found {len(all_inputs)} source images\n")

        # Filter to only unprocessed files (unless --force)
        if args.force:
            to_process = all_inputs
        else:
            to_process = [
                f for f in all_inputs if not (OUTPUT_DIR / (Path(f).stem + ".jpg")).exists()
            ]

    if not to_process:
        print("All images already processed. Use --force to reprocess.")
        return

    print(f"Processing {len(to_process)} images...\n")

    total_input_size = 0
    total_output_size = 0
    processed = 0

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = {
            pool.submit(process_image, f, args.quality): f for f in to_process
        }
        for future in as_completed(futures):
            r = future.result()
            processed += 1
            total_input_size += r["input_size"]
            total_output_size += r["output_size"]
            print(
                f'  [{processed}/{len(to_process)}] {r["filename"]} — '
                f'{format_bytes(r["input_size"])} → {format_bytes(r["output_size"])} '
                f'({r["reduction"]:.0f}% smaller)'
            )

    print("\n" + "=" * 50)
    print("Summary:")
    print(f"  Files processed: {processed}")
    print(f"  Total input:     {format_bytes(total_input_size)}")
    print(f"  Total output:    {format_bytes(total_output_size)}")
    print(f"  Space saved:     {format_bytes(total_input_size - total_output_size)}")
    print("=" * 50)


if __name__ == "__main__":
    main()
