#!/usr/bin/env python3
"""
The QC golden set: known-bad and known-good card art for calibrating card-art-qc
(factory.md, C2, "Calibration before trusting it").

    python3 scripts/factory/qc-golden.py build    # writes factory/qc-golden/{golden.json,img,cards}
    python3 scripts/factory/qc-golden.py score    # reads factory/qc-golden/verdicts/, prints recall

**Bad:** the 70 images replaced in October 2026, kept in when-images/_replaced/: 44 from the art
audit and 26 from player card reports. Each is labelled by what was wrong with it:
- `swap`: another card's picture (37 audit + 17 reports);
- `mockup`: a frame, mat or canvas on a wall (7 audit + 2 reports);
- `error`: on topic with a clear error, such as a real handgun on a TV remote (3 reports);
- `remake`: remade on request, a matter of taste rather than a rule (4 reports).

**Good:** the art that replaced them, the same 70 cards. A paired design: every card is seen
once with the wrong picture and once with the right one, so the false-flag rate is measured on
exactly the cards the bad set uses.

Images get neutral ids (g001...) in a fixed shuffle, so a file name never hints at its label.
The reviewer reads `img/<id>.jpg` and `cards/<id>.json` and writes `verdicts/<id>.json`, the
same contract as a deck's QC. The images are gitignored; golden.json, the cards and the
verdicts are committed, so a re-run after a prompt change can be compared.
"""

import json
import random
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "images"))
from paths import DOWNSAMPLED_DIR, EVENTS_DIR, IMAGES_DIR, REPO_ROOT  # noqa: E402

OUT = REPO_ROOT / "factory" / "qc-golden"
REPLACED = IMAGES_DIR / "_replaced"
SEED = 20261018
REVIEW_PX = 768

AUDIT_MOCKUPS = {
    "christmas-carol-published",
    "grameen-microcredit",
    "maccabean-revolt",
    "namibia-independence",
    "slave-trade-arab",
    "year-three-popes",
    "plant-based-meat-mainstream",
}
REPORT_KINDS = {
    # docs/card-reports/index.md, the verdict table.
    "tv-remote-control": "error",
    "telescope-invention": "error",
    "statue-unity": "error",
    "servetus-burned-at-stake": "mockup",
    "treaty-of-bretigny": "mockup",
    "birth-napoleon": "remake",
    "human-genome-project": "remake",
    "ripken-breaks-iron-man-record-1995": "remake",
    "scots-reformation-movement": "remake",
}
CATCH = {"swap", "mockup"}  # the target: every one of these caught


def load_events():
    manifest = json.loads((EVENTS_DIR / "manifest.json").read_text())
    out = {}
    for name in manifest["files"]:
        for event in json.loads((EVENTS_DIR / name).read_text()):
            out[event["name"]] = event
    return out


def bad_entries():
    entries = []
    for batch in sorted(p for p in REPLACED.iterdir() if p.is_dir()):
        audit = batch.name.startswith("art-audit")
        for img in sorted((batch / "downsampled_generated_images").glob("*.jpg")):
            slug = img.stem
            kind = ("mockup" if slug in AUDIT_MOCKUPS else "swap") if audit else REPORT_KINDS.get(slug, "swap")
            entries.append({"slug": slug, "label": "bad", "kind": kind, "src": str(img.relative_to(IMAGES_DIR))})
    return entries


def build():
    events = load_events()
    bad = bad_entries()
    good = []
    for b in bad:
        current = DOWNSAMPLED_DIR / f"{b['slug']}.jpg"
        if current.exists():
            good.append({"slug": b["slug"], "label": "good", "kind": "good", "src": str(current.relative_to(IMAGES_DIR))})
    entries = bad + good
    random.Random(SEED).shuffle(entries)

    for sub in ("img", "cards", "verdicts"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
    golden = []
    for i, e in enumerate(entries, 1):
        gid = f"g{i:03d}"
        event = events.get(e["slug"], {})
        name = event.get("friendly_name", e["slug"])
        with Image.open(IMAGES_DIR / e["src"]) as img:
            copy = img.convert("RGB")
            copy.thumbnail((REVIEW_PX, REVIEW_PX))
            copy.save(OUT / "img" / f"{gid}.jpg", "JPEG", quality=85)
        card = {
            "slug": gid,
            "friendly_name": name,
            "description": event.get("description", ""),
            "year": event.get("year"),
            "scene": "",
            "is_birth_card": name.lower().startswith("birth of") or " born" in name.lower(),
            "warnings": [],
        }
        (OUT / "cards" / f"{gid}.json").write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n")
        golden.append({"id": gid, **e})
    (OUT / "golden.json").write_text(json.dumps(golden, indent=2) + "\n")
    kinds = {}
    for e in golden:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    print(f"built {len(golden)} golden images: {kinds}")


def read(path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def score():
    golden = json.loads((OUT / "golden.json").read_text())
    rows = []
    for e in golden:
        first = read(OUT / "verdicts" / f"{e['id']}.json")
        second = read(OUT / "verdicts" / f"{e['id']}.recheck.json")
        v1 = first["verdict"] if first else None
        final = v1 if v1 == "pass" else (second["verdict"] if second else None)
        rows.append({**e, "first": v1, "final": final, "reason": (second or first or {}).get("reason", "")})

    missing = [r["id"] for r in rows if r["first"] is None]
    pending = [r["id"] for r in rows if r["first"] in ("fail", "unsure") and r["final"] is None]
    flagged = lambda v: v in ("fail", "unsure")  # noqa: E731

    print(f"{len(rows)} images; {len(missing)} without a first verdict; {len(pending)} awaiting a second opinion\n")
    print(f"{'kind':8} {'n':>3}  {'first pass flags':>16}  {'after second opinion':>20}")
    for kind in ("swap", "mockup", "error", "remake", "good"):
        group = [r for r in rows if r["kind"] == kind]
        if not group:
            continue
        f1 = sum(flagged(r["first"]) for r in group)
        f2 = sum(flagged(r["final"]) for r in group)
        print(f"{kind:8} {len(group):>3}  {f1:>9} ({100 * f1 / len(group):3.0f}%)  {f2:>13} ({100 * f2 / len(group):3.0f}%)")

    target = [r for r in rows if r["kind"] in CATCH]
    missed = [r for r in target if not flagged(r["final"])]
    good = [r for r in rows if r["kind"] == "good"]
    false = [r for r in good if flagged(r["final"])]
    print(f"\nRecall on swaps and mockups: {len(target) - len(missed)}/{len(target)}")
    print(f"False flags on good art: {len(false)}/{len(good)} ({100 * len(false) / max(1, len(good)):.0f}%)")
    for r in missed:
        print(f"  missed  {r['id']} {r['kind']:6} {r['slug']}")
    for r in false:
        print(f"  flagged {r['id']} good   {r['slug']}: {r['reason']}")
    result = {
        "recall": [len(target) - len(missed), len(target)],
        "false_flags": [len(false), len(good)],
        "missed": [r["slug"] for r in missed],
        "false_flagged": [{"slug": r["slug"], "reason": r["reason"]} for r in false],
    }
    (OUT / "score.json").write_text(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    {"build": build, "score": score}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
