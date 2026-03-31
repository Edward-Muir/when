#!/usr/bin/env python3
"""
Regenerate all image prompts with mobile-optimized compositions.
Key changes:
- Bold simplified composition with one dominant focal subject
- Strong silhouettes, high contrast, minimal background detail
- 1-2 figures max, close-up framing
- Event-specific scene descriptions (not generic templates)
- 3-4 dominant colors
"""

import json
import csv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVENTS_DIR = os.path.join(BASE_DIR, "public", "events")
PROMPTS_DIR = os.path.join(BASE_DIR, "images", "claude_prompts")

# Mobile optimization prefix (goes after "1:1 square composition.")
MOBILE_PREFIX = "Bold simplified composition optimized for small screen viewing. One dominant focal subject filling most of the frame. Strong silhouettes, high contrast, minimal background detail. Few figures, not crowds."

# Style suffix (always at end)
STYLE_SUFFIX = "No text, no dates, no numbers, no labels, no borders, no watermarks."

# Era-based color palettes
def get_era_palette(year):
    if year < -3000:
        return "warm ochres, deep earth browns, cave-shadow blacks, firelight oranges"
    elif year < -500:
        return "warm golds, burnt sienna, polished bronze, lapis lazuli blues"
    elif year < 500:
        return "marble whites, imperial purples, bronze metallics, crimson reds"
    elif year < 1000:
        return "deep jewel tones, burnished golds, dark iron grays, rich burgundies"
    elif year < 1400:
        return "stone grays, heraldic reds and blues, aged parchment yellows, forest greens"
    elif year < 1600:
        return "rich Renaissance golds, deep vermillion, ultramarine blues, warm flesh tones"
    elif year < 1800:
        return "candlelit ambers, powder-blue, burgundy velvet, dark mahogany"
    elif year < 1900:
        return "industrial iron grays, coal blacks, steam whites, gaslight yellows"
    elif year < 1950:
        return "sepia browns, military olive, gunmetal grays, propaganda poster reds"
    elif year < 2000:
        return "cool steel blues, nuclear whites, television grays, Cold War reds"
    else:
        return "digital blues, clean whites, chrome silvers, LED-lit greens"


def generate_scene(event):
    """Generate a mobile-optimized scene description for a single event."""
    name = event["name"]
    friendly = event["friendly_name"]
    desc = event["description"]
    year = event["year"]
    cat = event["category"]

    # Build the core scene - close-up, 1-2 subjects, strong focal point
    # We use the event description but reframe it for mobile viewing

    palette = get_era_palette(year)

    # Create the scene composition based on the event description
    # Focus on a single iconic moment/image rather than a wide scene
    scene = f"{friendly} — {desc}"

    # Category-specific framing guidance
    if cat == "conflict":
        framing = "Close-up dramatic angle. Show one or two key figures or a single iconic moment of the conflict, not a wide battlefield. Extreme foreground detail with blurred or minimal background."
    elif cat == "cultural":
        framing = "Intimate close-up view. Show a single defining object, figure, or moment that captures this cultural milestone. Tight framing with atmospheric background."
    elif cat == "diplomatic":
        framing = "Tight composition showing hands, documents, or a single key figure at the pivotal moment. Dramatic lighting on faces or objects, dark surroundings."
    elif cat == "disasters":
        framing = "Dramatic single focal point — one building, one ship, one crack in the earth — dominating the frame. A single human figure for scale. Extreme contrast between destruction and surroundings."
    elif cat == "exploration":
        framing = "One explorer or scientist in the foreground, large against a vast but simplified backdrop. The discovery or achievement as the clear focal point. Strong figure-ground contrast."
    elif cat == "infrastructure":
        framing = "The structure or invention filling the frame from a dramatic low angle. One or two human figures for scale. Strong geometric shapes and clean lines."
    else:
        framing = "Close-up with one dominant subject. Strong contrast and simplified background."

    prompt = f"A dramatic oil painting with rich visible brushstrokes and chiaroscuro lighting. 1:1 square composition. {MOBILE_PREFIX} {scene}. {framing} {palette} painting aesthetic. {STYLE_SUFFIX}"

    return prompt


def main():
    # Load all events from JSONs
    all_events = {}
    categories = ["conflict", "cultural", "diplomatic", "disasters", "exploration", "infrastructure"]

    for cat in categories:
        json_path = os.path.join(EVENTS_DIR, f"{cat}.json")
        with open(json_path) as f:
            events = json.load(f)
        for e in events:
            all_events[e["name"]] = e
        print(f"Loaded {len(events)} events from {cat}.json")

    print(f"\nTotal events: {len(all_events)}")

    # Read existing CSV to preserve image_generated status
    existing_status = {}
    csv_path = os.path.join(PROMPTS_DIR, "all_prompts.csv")
    if os.path.exists(csv_path):
        with open(csv_path) as f:
            reader = csv.reader(f)
            next(reader)  # skip header
            for row in reader:
                if len(row) >= 4:
                    existing_status[row[0]] = (row[2], row[3])  # (image_generated, saved_filename)
                elif len(row) >= 1:
                    existing_status[row[0]] = ("", "")

    # Generate new prompts
    rows = []
    missing = []

    # Sort events by category then year for organized output
    sorted_events = sorted(all_events.values(), key=lambda e: (
        categories.index(e["category"]) if e["category"] in categories else 99,
        e["year"]
    ))

    for event in sorted_events:
        name = event["name"]
        prompt = generate_scene(event)

        # Preserve existing generation status
        status = existing_status.get(name, ("", ""))
        rows.append([name, prompt, status[0], status[1]])

    # Check for events in CSV but not in JSONs
    for name in existing_status:
        if name not in all_events:
            missing.append(name)

    if missing:
        print(f"\nWARNING: {len(missing)} events in CSV but not in JSONs: {missing[:5]}...")

    # Write new CSV
    # Backup old one first
    backup_path = os.path.join(PROMPTS_DIR, "all_prompts_old.csv")
    if os.path.exists(csv_path):
        import shutil
        shutil.copy2(csv_path, backup_path)
        print(f"\nBacked up old CSV to {backup_path}")

    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["event_name", "prompt", "image_generated", "saved_filename"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} prompts to {csv_path}")

    # Show a few sample prompts
    print("\n=== SAMPLE PROMPTS ===")
    samples = ["battle-megiddo", "moon-landing", "great-fire-london", "construction-panama-canal", "treaty-versailles"]
    for name in samples:
        if name in all_events:
            prompt = generate_scene(all_events[name])
            print(f"\n--- {name} ---")
            print(prompt[:300] + "...")


if __name__ == "__main__":
    main()
