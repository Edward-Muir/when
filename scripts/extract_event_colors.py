#!/usr/bin/env python3
"""
Extract dominant colors from event images and write them to event JSON files.

Uses a simplified "Okmain" algorithm:
  1. Download Wikipedia thumbnail
  2. Resize to 64x64
  3. Convert to Oklab color space
  4. K-means cluster (K=4)
  5. Pick most prominent cluster (pixel count * saturation boost)
  6. Clamp lightness, convert to hex

Dependencies: pip install Pillow numpy requests
Usage: python scripts/extract_event_colors.py [--force] [--category NAME] [--dry-run] [--sample N]
"""

import argparse
import json
import sys
import time
from io import BytesIO
from pathlib import Path

import numpy as np
import requests
from PIL import Image

EVENTS_DIR = Path(__file__).parent.parent / "public" / "events"
MANIFEST_FILE = EVENTS_DIR / "manifest.json"

DOWNSAMPLE_SIZE = 64
K_CLUSTERS = 4
KMEANS_MAX_ITER = 20
RATE_LIMIT_S = 10  # 10s between downloads (Wikipedia rate limits aggressively)
MAX_RETRIES = 5
RETRY_BACKOFF_S = 30  # Base backoff for 429 retries (doubles each retry)

MIN_LIGHTNESS = 0.25
MAX_LIGHTNESS = 0.75
SATURATION_WEIGHT = 0.5
TEXT_COLOR_THRESHOLD = 0.6  # Oklab L above this -> dark text

USER_AGENT = "Mozilla/5.0 (compatible; WhenTimelineGame/1.0; image-color-extraction)"


# ── Oklab color space conversions ──────────────────────────────────────────

def srgb_to_linear(srgb: np.ndarray) -> np.ndarray:
    """Convert sRGB [0,1] to linear RGB."""
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(linear: np.ndarray) -> np.ndarray:
    """Convert linear RGB to sRGB [0,1]."""
    linear = np.clip(linear, 0, 1)
    return np.where(linear <= 0.0031308, linear * 12.92, 1.055 * linear ** (1 / 2.4) - 0.055)


def linear_rgb_to_oklab(rgb: np.ndarray) -> np.ndarray:
    """Convert linear RGB (N,3) to Oklab (N,3)."""
    # RGB to LMS (cone response)
    m1 = np.array([
        [0.4122214708, 0.5363325363, 0.0514459929],
        [0.2119034982, 0.6806995451, 0.1073969566],
        [0.0883024619, 0.2817188376, 0.6299787005],
    ])
    lms = rgb @ m1.T
    # Cube root (handle negatives gracefully)
    lms_ = np.sign(lms) * np.abs(lms) ** (1 / 3)
    # LMS' to Lab
    m2 = np.array([
        [0.2104542553, 0.7936177850, -0.0040720468],
        [1.9779984951, -2.4285922050, 0.4505937099],
        [0.0259040371, 0.7827717662, -0.8086757660],
    ])
    return lms_ @ m2.T


def oklab_to_linear_rgb(lab: np.ndarray) -> np.ndarray:
    """Convert Oklab (N,3) or (3,) to linear RGB."""
    m2_inv = np.array([
        [1.0, 0.3963377774, 0.2158037573],
        [1.0, -0.1055613458, -0.0638541728],
        [1.0, -0.0894841775, -1.2914855480],
    ])
    if lab.ndim == 1:
        lab = lab.reshape(1, 3)
    lms_ = lab @ m2_inv.T
    lms = lms_ ** 3
    m1_inv = np.array([
        [4.0767416621, -3.3077115913, 0.2309699292],
        [-1.2684380046, 2.6097574011, -0.3413193965],
        [-0.0041960863, -0.7034186147, 1.7076147010],
    ])
    return lms @ m1_inv.T


# ── K-means clustering ────────────────────────────────────────────────────

def kmeans_pp_init(data: np.ndarray, k: int, rng: np.random.Generator) -> np.ndarray:
    """K-means++ initialization."""
    n = data.shape[0]
    centers = np.empty((k, data.shape[1]))
    centers[0] = data[rng.integers(n)]
    for i in range(1, k):
        dists = np.min(
            np.sum((data[:, None, :] - centers[None, :i, :]) ** 2, axis=2), axis=1
        )
        probs = dists / dists.sum()
        centers[i] = data[rng.choice(n, p=probs)]
    return centers


def kmeans(data: np.ndarray, k: int, max_iter: int = KMEANS_MAX_ITER) -> tuple:
    """K-means clustering. Returns (centers, labels, counts)."""
    rng = np.random.default_rng(42)
    centers = kmeans_pp_init(data, k, rng)

    for _ in range(max_iter):
        # Assign
        dists = np.sum((data[:, None, :] - centers[None, :, :]) ** 2, axis=2)
        labels = np.argmin(dists, axis=1)
        # Update
        new_centers = np.empty_like(centers)
        for j in range(k):
            mask = labels == j
            if mask.any():
                new_centers[j] = data[mask].mean(axis=0)
            else:
                new_centers[j] = centers[j]
        if np.allclose(centers, new_centers, atol=1e-6):
            break
        centers = new_centers

    labels = np.argmin(
        np.sum((data[:, None, :] - centers[None, :, :]) ** 2, axis=2), axis=1
    )
    counts = np.bincount(labels, minlength=k)
    return centers, labels, counts


# ── Color extraction ──────────────────────────────────────────────────────

def extract_color(image_bytes: bytes) -> tuple[str, str] | None:
    """Extract dominant color from image bytes. Returns (hex_color, text_color) or None."""
    try:
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return None

    # Downsample
    img = img.resize((DOWNSAMPLE_SIZE, DOWNSAMPLE_SIZE), Image.LANCZOS)
    pixels = np.array(img, dtype=np.float64).reshape(-1, 3) / 255.0

    # sRGB -> linear -> Oklab
    linear = srgb_to_linear(pixels)
    oklab = linear_rgb_to_oklab(linear)

    # K-means
    k = min(K_CLUSTERS, len(oklab))
    centers, _labels, counts = kmeans(oklab, k)

    # Score: pixel_count * (1 + SATURATION_WEIGHT * chroma)
    chroma = np.sqrt(centers[:, 1] ** 2 + centers[:, 2] ** 2)
    scores = counts * (1 + SATURATION_WEIGHT * chroma)
    best_idx = np.argmax(scores)
    best = centers[best_idx].copy()

    # Clamp lightness
    best[0] = np.clip(best[0], MIN_LIGHTNESS, MAX_LIGHTNESS)

    # Determine text color
    text_color = "dark" if best[0] > TEXT_COLOR_THRESHOLD else "light"

    # Convert back to hex
    linear_rgb = oklab_to_linear_rgb(best.reshape(1, 3))[0]
    srgb = linear_to_srgb(linear_rgb)
    srgb = np.clip(srgb, 0, 1)
    r, g, b = (srgb * 255).astype(int)
    hex_color = f"#{r:02x}{g:02x}{b:02x}"

    return hex_color, text_color


def download_image(url: str) -> bytes | None:
    """Download image with retry on 429. Returns bytes or None on failure."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=10)
            if resp.status_code == 429 and attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF_S * (2 ** attempt)
                print(f"  ⏳ Rate limited, waiting {wait:.0f}s (attempt {attempt + 1}/{MAX_RETRIES})...", file=sys.stderr)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.content
        except requests.exceptions.HTTPError as e:
            if resp.status_code == 429 and attempt < MAX_RETRIES:
                continue  # Already handled above
            print(f"  ⚠ Download failed: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"  ⚠ Download failed: {e}", file=sys.stderr)
            return None
    return None


# ── Main ──────────────────────────────────────────────────────────────────

def process_events(args: argparse.Namespace) -> None:
    manifest = json.loads(MANIFEST_FILE.read_text())
    categories = manifest["categories"]

    if args.category:
        categories = [c for c in categories if c["name"] == args.category]
        if not categories:
            print(f"Category '{args.category}' not found in manifest.", file=sys.stderr)
            sys.exit(1)

    total_processed = 0
    total_skipped = 0
    total_failed = 0

    for cat in categories:
        for filename in cat["files"]:
            filepath = EVENTS_DIR / filename
            if not filepath.exists():
                print(f"File not found: {filepath}", file=sys.stderr)
                continue

            events = json.loads(filepath.read_text())
            modified = False

            for i, event in enumerate(events):
                if args.sample and total_processed >= args.sample:
                    break

                name = event.get("friendly_name", event.get("name", "?"))
                url = event.get("image_url")

                if not url:
                    total_skipped += 1
                    continue

                if event.get("color") and not args.force:
                    total_skipped += 1
                    continue

                # Download
                image_bytes = download_image(url)
                if not image_bytes:
                    total_failed += 1
                    continue

                # Extract
                result = extract_color(image_bytes)
                if not result:
                    print(f"  ⚠ Could not extract color for: {name}", file=sys.stderr)
                    total_failed += 1
                    continue

                hex_color, text_color = result

                if args.dry_run:
                    print(f"  {name}: {hex_color} (text: {text_color})")
                else:
                    event["color"] = hex_color
                    event["text_color"] = text_color
                    modified = True

                total_processed += 1
                if total_processed % 50 == 0:
                    print(f"  Processed {total_processed} events...")

                time.sleep(RATE_LIMIT_S)

            if modified and not args.dry_run:
                filepath.write_text(json.dumps(events, indent=2, ensure_ascii=False) + "\n")
                print(f"  Updated {filepath.name}")

            if args.sample and total_processed >= args.sample:
                break

        if args.sample and total_processed >= args.sample:
            break

    print(f"\nDone: {total_processed} extracted, {total_skipped} skipped, {total_failed} failed")


def main():
    parser = argparse.ArgumentParser(description="Extract dominant colors from event images")
    parser.add_argument("--force", action="store_true", help="Re-extract even if color already exists")
    parser.add_argument("--category", type=str, help="Process only this category")
    parser.add_argument("--dry-run", action="store_true", help="Print colors without writing to JSON")
    parser.add_argument("--sample", type=int, help="Process only first N events")
    args = parser.parse_args()
    process_events(args)


if __name__ == "__main__":
    main()
