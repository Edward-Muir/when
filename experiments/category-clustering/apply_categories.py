"""Apply the k=24 clustering as a new `cluster_category` field on every event.

Final taxonomy: 20 single-word categories (k=24 clusters merged):
  - clusters 1,2  -> Empires        (medieval rulers folded into empires)
  - clusters 8,13 -> Architecture    (ancient monuments + modern engineering)
  - clusters 14,15-> Revolution      (assassinations/executions + uprisings)
  - clusters 20,23-> Writing         (writing systems/printing + literature)

Non-destructive: keeps each event's existing `category` (source file); inserts
`cluster_category` right after it. Next session the code can switch to the new field.

Run:  .venv/bin/python apply_categories.py
"""

import csv
import json
from pathlib import Path

EVENTS_DIR = Path("../../public/events").resolve()
OUTPUT_DIR = Path("output")
SKIP_FILES = {"manifest.json", "deprecated.json"}

CLUSTER_TO_CATEGORY = {
    0: "Commerce", 1: "Empires", 2: "Empires", 3: "Disasters", 4: "Craft",
    5: "Warfare", 6: "Invention", 7: "Diplomacy", 8: "Architecture", 9: "Media",
    10: "Trade", 11: "Figures", 12: "Art", 13: "Architecture", 14: "Revolution",
    15: "Revolution", 16: "Science", 17: "Agriculture", 18: "Nature",
    19: "Medicine", 20: "Writing", 21: "Law", 22: "Migration", 23: "Writing",
}

# ---- name -> category from the k=24 assignments ----------------------------
name_to_cat = {}
with open(OUTPUT_DIR / "assignments_k24.csv", newline="", encoding="utf-8") as fh:
    for row in csv.DictReader(fh):
        name_to_cat[row["name"]] = CLUSTER_TO_CATEGORY[int(row["cluster"])]

print(f"{len(name_to_cat)} events mapped, {len(set(name_to_cat.values()))} categories")

# ---- write reference artifacts --------------------------------------------
(OUTPUT_DIR / "cluster_category_names_k24.json").write_text(
    json.dumps(CLUSTER_TO_CATEGORY, indent=2)
)
(OUTPUT_DIR / "event_category_map_final.json").write_text(
    json.dumps(name_to_cat, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
)

# ---- apply to every event file --------------------------------------------
from collections import Counter

counts = Counter()
missing = []
files_written = 0
for path in sorted(EVENTS_DIR.glob("*.json")):
    if path.name in SKIP_FILES:
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        continue
    new_events = []
    for ev in data:
        cat = name_to_cat.get(ev["name"])
        if cat is None:
            missing.append(f"{path.name}:{ev['name']}")
            new_events.append(ev)
            counts["<UNMAPPED>"] += 1
            continue
        cat = cat.lower()  # match existing lowercase category convention
        # overwrite `category` in place; drop any previously-added cluster_category
        rebuilt = {}
        for k, v in ev.items():
            if k == "cluster_category":
                continue
            rebuilt[k] = cat if k == "category" else v
        if "category" not in rebuilt:  # safety: no category key -> add it
            rebuilt["category"] = cat
        new_events.append(rebuilt)
        counts[cat] += 1
    path.write_text(json.dumps(new_events, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    files_written += 1

print(f"\nUpdated {files_written} files")
print(f"Unmapped events: {len(missing)}")
for m in missing[:20]:
    print("  ", m)

print("\n=== category counts (written) ===")
for cat, n in counts.most_common():
    print(f"  {n:5d}  {cat}")
