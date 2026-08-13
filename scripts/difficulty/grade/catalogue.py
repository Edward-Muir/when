"""Shared catalogue loading and composite-score maths for the grading scripts.

`score_catalogue` is a deliberate line-by-line port of `src/utils/difficultyScore.ts`.
It exists so the grading tooling can report the bands the game will actually compute
without booting the app. If you change the scoring in TypeScript, change it here too
and re-check `band_report.py` against the numbers in the PR body.
"""

import bisect
import json
import math
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
EVENTS_DIR = PROJECT_ROOT / "public" / "events"

DIFFICULTIES = ["easy", "medium", "hard", "very-hard"]

# Mirrors RECOGNITION_RANK in difficultyScore.ts.
RECOGNITION_RANK = {"easy": 0.0, "medium": 1 / 3, "hard": 2 / 3, "very-hard": 1.0}

W_RECOGNITION = 0.6
DENSITY_WINDOW_YEARS = 25

# Mirrors SPREAD in deckBuilder.ts: a band supplies at most floor(size / SPREAD) cards
# to any one deck.
SPREAD = 6


def manifest_files():
    """The event files the game actually loads, in manifest order."""
    with open(EVENTS_DIR / "manifest.json", encoding="utf-8") as f:
        return json.load(f)["files"]


def load_catalogue(playable_only=True):
    """Load the catalogue the way the app and the tests do.

    Dedupes by `name` (first occurrence wins) and, by default, keeps only events with
    a Cloudinary image — that is the pool `loadCatalogue` builds in the test helpers,
    so it is the pool whose quartiles the game sees.

    Returns a list of dicts, each with a `_file` key naming its source file.
    """
    seen = set()
    events = []
    for filename in manifest_files():
        with open(EVENTS_DIR / filename, encoding="utf-8") as f:
            for event in json.load(f):
                if event["name"] in seen:
                    continue
                if playable_only and "res.cloudinary.com" not in (event.get("image_url") or ""):
                    continue
                seen.add(event["name"])
                event["_file"] = filename
                events.append(event)
    return events


def score_catalogue(events):
    """Return {name: {'u', 'density', 'score', 'band'}} for the given catalogue.

    Port of `buildDifficultyIndex`. `events` must already be deduped by name — the
    TypeScript keys its metrics map by name, so duplicates collapse there too.
    """
    by_year = sorted(events, key=lambda e: e["year"])
    years = [e["year"] for e in by_year]
    denominator = max(1, len(by_year) - 1)

    metrics = {}
    densities = []
    for i, event in enumerate(by_year):
        year = event["year"]
        # Closed window [year - w, year + w], excluding the event itself.
        density = max(
            0,
            bisect.bisect_left(years, year + DENSITY_WINDOW_YEARS + 1)
            - bisect.bisect_left(years, year - DENSITY_WINDOW_YEARS)
            - 1,
        )
        densities.append(density)
        metrics[event["name"]] = {"u": i / denominator, "density": density, "score": 0.0, "band": 0}

    max_log_density = math.log1p(max(densities, default=0)) or 1
    for event in by_year:
        m = metrics[event["name"]]
        placeability = math.log1p(m["density"]) / max_log_density
        recognition = RECOGNITION_RANK.get(event["difficulty"], 0.5)
        m["score"] = W_RECOGNITION * recognition + (1 - W_RECOGNITION) * placeability

    ascending = sorted(m["score"] for m in metrics.values())

    def quartile(p):
        return ascending[min(len(ascending) - 1, int(len(ascending) * p))]

    q1, q2, q3 = quartile(0.25), quartile(0.5), quartile(0.75)
    for m in metrics.values():
        s = m["score"]
        m["band"] = 0 if s < q1 else 1 if s < q2 else 2 if s < q3 else 3
    return metrics


def band_table(events, metrics):
    """Per-category band counts and the deck budget each category can supply.

    `budget` mirrors the thin-pool cap in deckBuilder.ts summed across bands. A deck
    composes 24 cards, so a category whose budget is under 24 will push the builder
    onto its soft-cap fallback.
    """
    rows = []
    for category in sorted({e["category"] for e in events}):
        subset = [e for e in events if e["category"] == category]
        counts = Counter(metrics[e["name"]]["band"] for e in subset)
        budget = sum(max(1, counts[b] // SPREAD) for b in range(4) if counts[b])
        rows.append(
            {
                "category": category,
                "total": len(subset),
                "bands": [counts[b] for b in range(4)],
                "budget": budget,
                "labels": Counter(e["difficulty"] for e in subset),
            }
        )
    return rows


def format_distribution(counter, total=None):
    """Render a label Counter as `e=20.0% m=35.0% h=35.0% v=10.0%`."""
    total = total or sum(counter.values()) or 1
    initials = {"easy": "e", "medium": "m", "hard": "h", "very-hard": "v"}
    return "  ".join(f"{initials[d]}={counter[d] / total * 100:5.1f}%" for d in DIFFICULTIES)
