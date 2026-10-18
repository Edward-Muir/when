#!/usr/bin/env python3
"""
The free checks on a deck's downloaded art, before any model looks at it (factory.md, C2).

    python3 scripts/factory/image-precheck.py --deck <id>
    python3 scripts/factory/image-precheck.py --dir <folder> --report out.json   # calibration

For every slug the deck's status.json has at `downloaded`:

- the file decodes, and is square at 1024 or 2048 px;
- its sha256 equals the one status.json and the inbox manifest recorded at download, so the
  file on the slug is the file that was taken for it;
- no other image in the deck has the same sha256;
- **dHash** against every other image in the deck and the whole catalogue
  (downsampled_generated_images/). A near-duplicate is the October 2026 audit's main failure,
  another card's picture on this card, and dHash alone found 16 of them.

It writes, under factory/decks/<id>/qc/:
- `<slug>.precheck.json`: {slug, sha256, ok, problems, width, height, dhash, nearest};
- `cards/<slug>.json`: what the reviewer reads after describing the image (name,
  description, year, scene, warnings);
- `img/<slug>.jpg`: a 768 px review copy, so the reviewer reads a small file inside the repo
  (gitignored).

The catalogue's hashes are cached in <images>/factory-cache/dhash.json, keyed on file name,
size and mtime, so only new or changed files are hashed again.
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

from PIL import Image

try:
    import imagehash
except ImportError:
    sys.exit("imagehash is missing: pip3 install imagehash")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "images"))
from paths import DOWNSAMPLED_DIR, EVENTS_DIR, IMAGES_DIR, INBOX_DIR, REPO_ROOT  # noqa: E402

DECKS_DIR = Path(os.environ.get("FACTORY_DECKS_DIR") or REPO_ROOT / "factory" / "decks")
CACHE_FILE = IMAGES_DIR / "factory-cache" / "dhash.json"
SIZES = (1024, 2048)
# Hamming distance on a 64-bit dHash at or under which two images are the same picture.
# Measured on the catalogue: see factory.md, "Calibration".
NEAR_DUPLICATE = 6
REVIEW_PX = 768
IMAGE_EXTS = (".jpeg", ".jpg", ".png", ".webp")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dhash(img):
    return imagehash.dhash(img.convert("L"), hash_size=8)


def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}


def catalogue_hashes():
    """{stem: imagehash} for every downsampled catalogue image, from the cache where fresh."""
    cache = load_cache()
    fresh = {}
    changed = False
    files = sorted(p for p in DOWNSAMPLED_DIR.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    for i, path in enumerate(files):
        st = path.stat()
        key = path.name
        entry = cache.get(key)
        if entry and entry["size"] == st.st_size and entry["mtime"] == int(st.st_mtime):
            fresh[key] = entry
            continue
        try:
            with Image.open(path) as img:
                value = str(dhash(img))
        except Exception as error:  # an unreadable catalogue file is reported, not fatal
            print(f"  warning: cannot hash {path.name}: {error}", file=sys.stderr)
            continue
        fresh[key] = {"size": st.st_size, "mtime": int(st.st_mtime), "dhash": value}
        changed = True
        if i and i % 500 == 0:
            print(f"  hashed {i}/{len(files)} catalogue images...", file=sys.stderr)
    if changed or len(fresh) != len(cache):
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(json.dumps(fresh))
    return {Path(name).stem: imagehash.hex_to_hash(e["dhash"]) for name, e in fresh.items()}


def nearest(value, others, exclude):
    best = None
    for stem, other in others.items():
        if stem in exclude:
            continue
        distance = value - other
        if best is None or distance < best[1]:
            best = (stem, distance)
    return best


def check_file(path):
    """Decode and measure one image. Returns (problems, info, image or None)."""
    problems = []
    try:
        with Image.open(path) as img:
            img.load()
            image = img.convert("RGB")
    except Exception as error:
        return [f"does not decode: {error}"], {}, None
    w, h = image.size
    if w != h:
        problems.append(f"not square: {w}x{h}")
    elif w not in SIZES:
        problems.append(f"{w}px; want {' or '.join(map(str, SIZES))}")
    return problems, {"width": w, "height": h}, image


def load_events():
    manifest = json.loads((EVENTS_DIR / "manifest.json").read_text())
    events = {}
    for name in manifest["files"]:
        for event in json.loads((EVENTS_DIR / name).read_text()):
            events[event["name"]] = event
    return events


def load_scenes(deck):
    path = REPO_ROOT / "docs" / "curated-themes" / "art" / "scenes-factory" / deck / "scenes.json"
    return json.loads(path.read_text()) if path.exists() else {}


def manifest_shas(deck):
    """The sha256 of the last download recorded for each slug."""
    path = INBOX_DIR / deck / "manifest.jsonl"
    out = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                out[row["slug"]] = row["sha256"]
    return out


def find_inbox_file(deck, slug):
    for ext in IMAGE_EXTS:
        path = INBOX_DIR / deck / f"{slug}{ext}"
        if path.exists():
            return path
    return None


def run_deck(deck, threshold):
    status = json.loads((DECKS_DIR / deck / "status.json").read_text())
    slugs = [s for s, e in status["slugs"].items() if e["state"] == "downloaded"]
    if not slugs:
        print(json.dumps({"checked": 0, "failed": []}))
        return 0

    qc = DECKS_DIR / deck / "qc"
    (qc / "img").mkdir(parents=True, exist_ok=True)
    (qc / "cards").mkdir(parents=True, exist_ok=True)
    events = load_events()
    scenes = load_scenes(deck)
    recorded = manifest_shas(deck)
    catalogue = catalogue_hashes()

    # Every image in the deck that has a file, for the in-deck comparisons.
    deck_files = {s: find_inbox_file(deck, s) for s in status["slugs"]}
    deck_hashes, deck_shas = {}, {}
    for s, path in deck_files.items():
        if path is None:
            continue
        deck_shas[s] = sha256(path)
        try:
            with Image.open(path) as img:
                deck_hashes[s] = dhash(img)
        except Exception:
            pass

    failed = []
    for slug in slugs:
        path = deck_files[slug]
        result = {"slug": slug, "problems": []}
        if path is None:
            result["problems"].append("no file in the inbox")
        else:
            problems, info, image = check_file(path)
            result.update(info)
            result["problems"] += problems
            digest = deck_shas[slug]
            result["sha256"] = digest
            if digest != status["slugs"][slug]["sha256"]:
                result["problems"].append("sha256 differs from status.json: not the file taken for this slug")
            if recorded.get(slug) != digest:
                result["problems"].append("sha256 differs from the inbox manifest")
            twins = [s for s, d in deck_shas.items() if d == digest and s != slug]
            if twins:
                result["problems"].append(f"byte-identical to {', '.join(twins)} in this deck")
            if slug in deck_hashes:
                value = deck_hashes[slug]
                result["dhash"] = str(value)
                in_deck = nearest(value, deck_hashes, {slug})
                in_catalogue = nearest(value, catalogue, {slug})
                for where, best in (("this deck", in_deck), ("the catalogue", in_catalogue)):
                    if best and best[1] <= threshold:
                        result["problems"].append(
                            f"near-duplicate of {best[0]} in {where} (dHash distance {best[1]})"
                        )
                result["nearest"] = {
                    "deck": in_deck and {"slug": in_deck[0], "distance": int(in_deck[1])},
                    "catalogue": in_catalogue and {"slug": in_catalogue[0], "distance": int(in_catalogue[1])},
                }
            if image is not None:
                copy = image.copy()
                copy.thumbnail((REVIEW_PX, REVIEW_PX))
                copy.save(qc / "img" / f"{slug}.jpg", "JPEG", quality=85)

        event = events.get(slug, {})
        scene = scenes.get(slug, {})
        name = event.get("friendly_name", "")
        card = {
            "slug": slug,
            "friendly_name": name,
            "description": event.get("description", ""),
            "year": event.get("year"),
            "scene": scene.get("scene", ""),
            "is_birth_card": name.lower().startswith("birth of") or " born" in name.lower(),
            "warnings": scene.get("qc_warnings", []),
        }
        (qc / "cards" / f"{slug}.json").write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n")

        result["ok"] = not result["problems"]
        result["attempt"] = status["slugs"][slug]["attempts"]
        (qc / f"{slug}.precheck.json").write_text(json.dumps(result, indent=2) + "\n")
        if not result["ok"]:
            failed.append({"slug": slug, "problems": result["problems"]})

    print(json.dumps({"checked": len(slugs), "failed": failed}, indent=2))
    return 0


def run_dir(folder, report, threshold, exclude_stems=False):
    """Calibration: check every image in a folder against the catalogue, by its file stem."""
    catalogue = catalogue_hashes()
    rows = []
    for path in sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in IMAGE_EXTS):
        problems, info, image = check_file(path)
        row = {"file": path.name, "problems": problems, **info}
        if image is not None:
            best = nearest(dhash(image), catalogue, {path.stem} if exclude_stems else set())
            if best:
                row["nearest"] = {"slug": best[0], "distance": int(best[1])}
        rows.append(row)
    Path(report).write_text(json.dumps(rows, indent=2) + "\n")
    print(f"checked {len(rows)} images; wrote {report}")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Free pre-checks on downloaded card art")
    parser.add_argument("--deck", help="Deck id: check its downloaded slugs")
    parser.add_argument("--dir", help="Calibration: check every image in this folder")
    parser.add_argument("--report", help="With --dir: where to write the JSON report")
    parser.add_argument("--exclude-own-stem", action="store_true", help="With --dir: skip a file's own stem in the catalogue")
    parser.add_argument("--threshold", type=int, default=NEAR_DUPLICATE, help="dHash near-duplicate distance")
    args = parser.parse_args()
    if args.deck:
        return run_deck(args.deck, args.threshold)
    if args.dir and args.report:
        return run_dir(args.dir, args.report, args.threshold, args.exclude_own_stem)
    parser.error("give --deck, or --dir with --report")


if __name__ == "__main__":
    sys.exit(main())
