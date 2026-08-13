#!/usr/bin/env python3
"""Print the composite difficulty bands the game will compute for the catalogue.

This is the acceptance gate for a regrade. The number that matters is the smallest
band-0 pool across the 20 categories: that is the warm-up pool a themed day draws its
opening cards from, and it must not go down.

Usage:
    python3 scripts/difficulty/grade/band_report.py                  # report
    python3 scripts/difficulty/grade/band_report.py --save before.json
    python3 scripts/difficulty/grade/band_report.py --compare before.json
"""

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalogue import (  # noqa: E402
    DIFFICULTIES,
    band_table,
    format_distribution,
    load_catalogue,
    score_catalogue,
)

# The floor the regrade must hold: today's smallest band-0 category pool.
MIN_BAND0_FLOOR = 27

# deckBuilder.test.ts asserts floor(bandSize / SPREAD) > RAMP_WINDOW for every band on
# the full catalogue, i.e. every band needs at least 150 cards.
MIN_BAND_SIZE = 150


def build_report():
    events = load_catalogue()
    metrics = score_catalogue(events)
    rows = band_table(events, metrics)
    totals = Counter(metrics[e["name"]]["band"] for e in events)
    labels = Counter(e["difficulty"] for e in events)
    return {
        "total": len(events),
        "band_totals": [totals[b] for b in range(4)],
        "label_counts": {d: labels[d] for d in DIFFICULTIES},
        "min_band0": min(r["bands"][0] for r in rows),
        "categories": {
            r["category"]: {
                "total": r["total"],
                "bands": r["bands"],
                "budget": r["budget"],
                "labels": {d: r["labels"][d] for d in DIFFICULTIES},
            }
            for r in rows
        },
    }


def print_report(report, baseline=None):
    n = report["total"]
    print(f"catalogue: {n} playable events\n")

    counts = Counter(report["label_counts"])
    print(f"labels        {format_distribution(counts, n)}")
    shares = [b / n for b in report["band_totals"]]
    print("bands         " + "  ".join(f"b{i}={b} ({s * 100:.1f}%)" for i, (b, s) in enumerate(zip(report["band_totals"], shares))))
    print()

    header = f"{'category':14}{'n':>5}{'band0':>7}{'band1':>7}{'band2':>7}{'band3':>7}{'budget':>8}   labels"
    print(header)
    print("-" * len(header))
    cats = sorted(report["categories"].items(), key=lambda kv: kv[1]["bands"][0])
    for name, row in cats:
        delta = ""
        if baseline and name in baseline["categories"]:
            d = row["bands"][0] - baseline["categories"][name]["bands"][0]
            delta = f" ({d:+d})" if d else ""
        bands = "".join(f"{b:>7}" for b in row["bands"])
        labels = format_distribution(Counter(row["labels"]), row["total"])
        print(f"{name:14}{row['total']:>5}{bands}{row['budget']:>8}   {labels}{delta}")

    print()
    ok = True

    min_b0 = report["min_band0"]
    worst = min(cats, key=lambda kv: kv[1]["bands"][0])[0]
    line = f"min band-0 pool: {min_b0} ({worst})   floor {MIN_BAND0_FLOOR}"
    if baseline:
        line += f"   baseline {baseline['min_band0']}"
    if min_b0 < MIN_BAND0_FLOOR:
        ok = False
        print(f"FAIL  {line}")
    else:
        print(f"pass  {line}")

    smallest_band = min(report["band_totals"])
    if smallest_band < MIN_BAND_SIZE:
        ok = False
        print(f"FAIL  smallest band holds {smallest_band} cards, deckBuilder needs {MIN_BAND_SIZE}")
    else:
        print(f"pass  smallest band holds {smallest_band} cards (need {MIN_BAND_SIZE})")

    if all(0.15 < s < 0.35 for s in shares):
        print("pass  every band share inside the 15-35% difficultyScore.test.ts bound")
    else:
        ok = False
        print("FAIL  a band share fell outside the 15-35% difficultyScore.test.ts bound")

    thin = [name for name, row in cats if row["budget"] < 24]
    if thin:
        print(f"note  categories whose band budget is under a 24-card deck: {', '.join(thin)}")

    return ok


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--save", metavar="PATH", help="write the report as JSON for a later --compare")
    parser.add_argument("--compare", metavar="PATH", help="show deltas against a saved report")
    args = parser.parse_args()

    report = build_report()
    baseline = None
    if args.compare:
        with open(args.compare, encoding="utf-8") as f:
            baseline = json.load(f)

    ok = print_report(report, baseline)

    if args.save:
        with open(args.save, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"\nsaved {args.save}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
