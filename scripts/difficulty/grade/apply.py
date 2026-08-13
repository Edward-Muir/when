#!/usr/bin/env python3
"""Validate graded batch output and apply it to public/events/*.json.

Validation refuses the whole run rather than warning and continuing. The previous
generation of this script wrote the `difficulty` string straight through with no enum
check and silently skipped any graded file it did not recognise, which is how a tranche
of events ended up graded by nobody.

Events are rewritten with `json.dump(indent=2, ensure_ascii=False)` plus a trailing
newline. That round-trip is byte-identical for every file in public/events today, so
the diff contains exactly one changed line per relabelled event and nothing else — if
that ever stops being true, the check below fails the run.

Usage:
    python3 scripts/difficulty/grade/apply.py --dry-run
    python3 scripts/difficulty/grade/apply.py
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalogue import (  # noqa: E402
    DIFFICULTIES,
    EVENTS_DIR,
    load_catalogue,
    manifest_files,
)

GRADE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = GRADE_DIR / "output"
BATCH_DIR = GRADE_DIR / "batches"


class ValidationError(Exception):
    pass


def read_graded():
    """Load every graded_*.json, returning {name: entry} and the per-batch coverage."""
    paths = sorted(OUTPUT_DIR.glob("graded_*.json"))
    if not paths:
        raise ValidationError(f"no graded_*.json files in {OUTPUT_DIR}")

    grades = {}
    origin = {}
    by_batch = defaultdict(set)
    errors = []

    for path in paths:
        with open(path, encoding="utf-8") as f:
            try:
                payload = json.load(f)
            except json.JSONDecodeError as exc:
                errors.append(f"{path.name}: not valid JSON ({exc})")
                continue

        entries = payload.get("graded") if isinstance(payload, dict) else payload
        if not isinstance(entries, list):
            errors.append(f"{path.name}: expected a list, or an object with a 'graded' list")
            continue
        batch = payload.get("batch", path.stem) if isinstance(payload, dict) else path.stem

        for i, entry in enumerate(entries):
            where = f"{path.name}[{i}]"
            if not isinstance(entry, dict):
                errors.append(f"{where}: not an object")
                continue
            name = entry.get("name")
            difficulty = entry.get("difficulty")
            if not name or not isinstance(name, str):
                errors.append(f"{where}: missing 'name'")
                continue
            if difficulty not in DIFFICULTIES:
                errors.append(f"{where} ({name}): difficulty {difficulty!r} is not one of {DIFFICULTIES}")
                continue
            if name in grades:
                errors.append(f"{where} ({name}): duplicate, already graded in {origin[name]}")
                continue
            grades[name] = entry
            origin[name] = path.name
            by_batch[batch].add(name)

    if errors:
        raise ValidationError("\n".join(errors))
    return grades, by_batch


def check_coverage(grades, by_batch, catalogue):
    """Every graded name must exist; every batched event must have been graded."""
    known = {e["name"]: e for e in catalogue}
    errors = []

    unknown = sorted(set(grades) - set(known))
    if unknown:
        errors.append(
            f"{len(unknown)} graded name(s) are not in the catalogue: {', '.join(unknown[:10])}"
            + (" ..." if len(unknown) > 10 else "")
        )

    if BATCH_DIR.exists():
        for path in sorted(BATCH_DIR.glob("*.json")):
            with open(path, encoding="utf-8") as f:
                batch = json.load(f)
            expected = {e["name"] for e in batch["events"]}
            missing = sorted(expected - set(grades))
            if missing:
                errors.append(
                    f"batch {batch['batch']}: {len(missing)} event(s) never graded: "
                    + ", ".join(missing[:10])
                    + (" ..." if len(missing) > 10 else "")
                )

    # A changed label has to say why. An unchanged one needs no justification.
    unjustified = [
        name
        for name, entry in grades.items()
        if name in known
        and entry["difficulty"] != known[name]["difficulty"]
        and not (entry.get("reasoning") or "").strip()
    ]
    if unjustified:
        errors.append(
            f"{len(unjustified)} changed label(s) have no reasoning: "
            + ", ".join(sorted(unjustified)[:10])
            + (" ..." if len(unjustified) > 10 else "")
        )

    if errors:
        raise ValidationError("\n".join(errors))


def apply_grades(grades, dry_run):
    """Write the new labels, returning (transitions, per-file change counts)."""
    transitions = Counter()
    changed_by_file = Counter()

    for filename in manifest_files():
        path = EVENTS_DIR / filename
        original = path.read_text(encoding="utf-8")
        events = json.loads(original)

        # Guard the promise that this script only ever moves `difficulty`.
        if json.dumps(events, indent=2, ensure_ascii=False) + "\n" != original:
            raise ValidationError(
                f"{filename}: re-serialising is not byte-identical, so applying grades "
                "would reformat the file. Fix the formatting before regrading."
            )

        for event in events:
            entry = grades.get(event["name"])
            if not entry or entry["difficulty"] == event["difficulty"]:
                continue
            transitions[(event["difficulty"], entry["difficulty"])] += 1
            changed_by_file[filename] += 1
            event["difficulty"] = entry["difficulty"]

        if changed_by_file[filename] and not dry_run:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(events, f, indent=2, ensure_ascii=False)
                f.write("\n")

    return transitions, changed_by_file


def report(grades, catalogue, transitions, changed_by_file):
    known = {e["name"]: e for e in catalogue}
    total_changed = sum(transitions.values())

    print(f"graded {len(grades)} events, {total_changed} label(s) changed\n")

    print("changes by file")
    for filename, count in sorted(changed_by_file.items(), key=lambda kv: -kv[1]):
        if count:
            print(f"  {filename:24}{count:>5}")

    print("\ntransitions")
    header = f"  {'from':12}" + "".join(f"{d:>11}" for d in DIFFICULTIES)
    print(header)
    for old in DIFFICULTIES:
        row = "".join(f"{transitions[(old, new)]:>11}" for new in DIFFICULTIES)
        print(f"  {old:12}{row}")

    print("\nresulting distribution by category")
    by_category = defaultdict(Counter)
    for name, event in known.items():
        entry = grades.get(name)
        by_category[event["category"]][entry["difficulty"] if entry else event["difficulty"]] += 1
    print(f"  {'category':14}{'n':>5}" + "".join(f"{d:>11}" for d in DIFFICULTIES))
    overall = Counter()
    for category in sorted(by_category):
        counts = by_category[category]
        overall.update(counts)
        n = sum(counts.values())
        row = "".join(f"{counts[d] / n * 100:>10.1f}%" for d in DIFFICULTIES)
        print(f"  {category:14}{n:>5}{row}")
    n = sum(overall.values())
    print(f"  {'ALL':14}{n:>5}" + "".join(f"{overall[d] / n * 100:>10.1f}%" for d in DIFFICULTIES))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="validate and report without writing")
    args = parser.parse_args()

    try:
        grades, by_batch = read_graded()
        catalogue = load_catalogue(playable_only=False)
        check_coverage(grades, by_batch, catalogue)
        transitions, changed_by_file = apply_grades(grades, args.dry_run)
    except ValidationError as exc:
        print("VALIDATION FAILED\n", file=sys.stderr)
        print(exc, file=sys.stderr)
        return 1

    report(grades, catalogue, transitions, changed_by_file)
    print("\n(dry run, nothing written)" if args.dry_run else "\napplied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
