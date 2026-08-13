#!/usr/bin/env python3
"""Split the catalogue into per-category grading batches, one per agent.

Batching is by `category`, not by file. The category is what the game filters a themed
day on, and it is independent of which JSON file an event happens to live in — `trade`
events are scattered across a dozen files. Calibrating a target distribution per file
therefore gives no guarantee at all for the pools the deck builder actually draws from;
measured, a per-file target collapses trade's band-0 pool from 30 to 17.

Categories over BATCH_SIZE are split round-robin by year rank rather than into
contiguous era chunks, so every part carries the same spread of eras and the same
target distribution applies to each.

Usage:
    python3 scripts/difficulty/grade/extract_batches.py
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalogue import DIFFICULTIES, load_catalogue  # noqa: E402

BATCH_DIR = Path(__file__).resolve().parent / "batches"
BATCH_SIZE = 250

# The fields an agent is allowed to see. Crowding is deliberately absent: it is
# computed by difficultyScore.ts from the year distribution, and a grader who also
# scores it by hand double-counts it. Wikipedia view counts are absent too — they
# cover only the events an older process already graded, and they measure article
# traffic rather than event recognition.
FIELDS = ["name", "friendly_name", "year", "category", "description"]


def batches_for(category, events):
    """Round-robin a category's events into parts of at most BATCH_SIZE."""
    ordered = sorted(events, key=lambda e: (e["year"], e["name"]))
    parts = -(-len(ordered) // BATCH_SIZE)
    if parts <= 1:
        return [(category, ordered)]
    buckets = [[] for _ in range(parts)]
    for i, event in enumerate(ordered):
        buckets[i % parts].append(event)
    return [(f"{category}_part{i + 1}", sorted(b, key=lambda e: e["year"])) for i, b in enumerate(buckets)]


def main():
    events = load_catalogue()
    by_category = defaultdict(list)
    for event in events:
        by_category[event["category"]].append(event)

    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for stale in BATCH_DIR.glob("*.json"):
        stale.unlink()

    written = 0
    total = 0
    for category in sorted(by_category):
        members = by_category[category]
        labels = Counter(e["difficulty"] for e in members)
        for batch_name, batch_events in batches_for(category, members):
            payload = {
                "batch": batch_name,
                "category": category,
                "count": len(batch_events),
                "category_total": len(members),
                "category_current_labels": {d: labels[d] for d in DIFFICULTIES},
                "events": [
                    {**{k: e[k] for k in FIELDS}, "current_difficulty": e["difficulty"]}
                    for e in batch_events
                ],
            }
            path = BATCH_DIR / f"{batch_name}.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"{batch_name:24}{len(batch_events):>5} events")
            written += 1
            total += len(batch_events)

    print(f"\n{written} batches, {total} events -> {BATCH_DIR.relative_to(Path.cwd()) if BATCH_DIR.is_relative_to(Path.cwd()) else BATCH_DIR}")
    if total != len(events):
        print(f"ERROR: batched {total} but catalogue holds {len(events)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
