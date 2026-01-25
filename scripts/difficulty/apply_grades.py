#!/usr/bin/env python3
"""
Apply difficulty grades from agent outputs to event JSON files.
Reads graded_*.json files and updates public/events/*.json files.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
EVENTS_DIR = PROJECT_ROOT / "public" / "events"
OUTPUT_DIR = SCRIPT_DIR / "output"

CATEGORIES = ["conflict", "cultural", "diplomatic", "disasters", "exploration", "infrastructure"]


def load_grades():
    """Load all graded files and create a lookup by name (slug)."""
    grades = {}

    for category in CATEGORIES:
        graded_file = OUTPUT_DIR / f"graded_{category}.json"
        if not graded_file.exists():
            print(f"Warning: {graded_file} not found, skipping {category}")
            continue

        with open(graded_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            name = item.get("name")
            # Support both "difficulty" and "recommended_difficulty" field names
            difficulty = item.get("difficulty") or item.get("recommended_difficulty")
            if name and difficulty:
                grades[name] = {
                    "difficulty": difficulty,
                    "reasoning": item.get("reasoning", "")
                }

    return grades


def update_events(grades, dry_run=False):
    """Update event JSON files with new difficulty grades."""
    stats = {
        "total": 0,
        "updated": 0,
        "not_found": 0,
        "changes": defaultdict(lambda: defaultdict(int))  # old -> new -> count
    }
    distribution = defaultdict(int)

    for category in CATEGORIES:
        event_file = EVENTS_DIR / f"{category}.json"
        if not event_file.exists():
            print(f"Warning: {event_file} not found")
            continue

        with open(event_file, "r", encoding="utf-8") as f:
            events = json.load(f)

        modified = False
        for event in events:
            stats["total"] += 1
            # Use "name" (slug) as the lookup key
            event_name = event.get("name")

            if event_name in grades:
                old_difficulty = event.get("difficulty", "unknown")
                new_difficulty = grades[event_name]["difficulty"]

                if old_difficulty != new_difficulty:
                    stats["updated"] += 1
                    stats["changes"][old_difficulty][new_difficulty] += 1
                    event["difficulty"] = new_difficulty
                    modified = True

                distribution[new_difficulty] += 1
            else:
                stats["not_found"] += 1
                # Keep existing difficulty in distribution count
                distribution[event.get("difficulty", "unknown")] += 1

        if modified and not dry_run:
            with open(event_file, "w", encoding="utf-8") as f:
                json.dump(events, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"Updated: {event_file.name}")

    return stats, distribution


def print_report(stats, distribution):
    """Print a summary report of changes."""
    print("\n" + "=" * 60)
    print("DIFFICULTY GRADING REPORT")
    print("=" * 60)

    print(f"\nTotal events: {stats['total']}")
    print(f"Updated: {stats['updated']}")
    print(f"Not found in grades: {stats['not_found']}")

    print("\n--- Difficulty Changes ---")
    for old_diff, new_diffs in sorted(stats["changes"].items()):
        for new_diff, count in sorted(new_diffs.items()):
            print(f"  {old_diff} -> {new_diff}: {count}")

    print("\n--- Final Distribution ---")
    total = sum(distribution.values())
    for diff in ["easy", "medium", "hard", "very-hard"]:
        count = distribution.get(diff, 0)
        pct = (count / total * 100) if total > 0 else 0
        bar = "█" * int(pct / 2)
        print(f"  {diff:10} {count:4} ({pct:5.1f}%) {bar}")

    print("\n" + "=" * 60)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Apply difficulty grades to event JSON files")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    args = parser.parse_args()

    print("Loading grades from agent outputs...")
    grades = load_grades()
    print(f"Loaded {len(grades)} grades")

    if args.dry_run:
        print("\n[DRY RUN - No files will be modified]\n")

    print("Updating event files...")
    stats, distribution = update_events(grades, dry_run=args.dry_run)

    print_report(stats, distribution)

    if args.dry_run:
        print("\n[DRY RUN COMPLETE - Run without --dry-run to apply changes]")


if __name__ == "__main__":
    main()
