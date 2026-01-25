#!/usr/bin/env python3
"""
Visualize Wikipedia pageviews distribution for historical events.
Creates a CSV export and histogram of the pageview distribution.
"""

import json
import csv
import os
from pathlib import Path

# Try to import matplotlib, provide helpful message if not installed
try:
    import matplotlib.pyplot as plt
    import numpy as np
except ImportError:
    print("Required packages not installed. Run:")
    print("  pip3 install matplotlib numpy")
    exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
EVENTS_DIR = PROJECT_ROOT / "public" / "events"
OUTPUT_DIR = SCRIPT_DIR / "output"

def load_all_events():
    """Load all events from JSON files."""
    events = []
    json_files = [f for f in EVENTS_DIR.glob("*.json") if f.name != "manifest.json"]

    for json_file in json_files:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for event in data:
                event["_source_file"] = json_file.name
            events.extend(data)

    return events

def export_csv(events, output_path):
    """Export events to CSV with name, url, views."""
    # Filter to events with wikipedia_views
    events_with_views = [e for e in events if "wikipedia_views" in e]

    # Sort by difficulty (very-hard, hard, medium, easy) then by views ascending within each difficulty
    difficulty_order = {'very-hard': 0, 'hard': 1, 'medium': 2, 'easy': 3}
    events_with_views.sort(key=lambda e: (
        difficulty_order.get(e.get("difficulty", ""), -1),
        e.get("wikipedia_views", 0)
    ))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["friendly_name", "wikipedia_url", "wikipedia_views", "category", "year", "difficulty"])

        for event in events_with_views:
            writer.writerow([
                event.get("friendly_name", event.get("name")),
                event.get("wikipedia_url", ""),
                event.get("wikipedia_views", 0),
                event.get("category", ""),
                event.get("year", ""),
                event.get("difficulty", "")
            ])

    return len(events_with_views)

def create_distribution_plot(events, output_path):
    """Create histogram of pageview distribution."""
    # Get views data
    views = [e["wikipedia_views"] for e in events if "wikipedia_views" in e and e["wikipedia_views"] > 0]

    if not views:
        print("No pageview data found!")
        return

    # Create figure with three subplots
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # Plot 1: Log-scale histogram
    ax1 = axes[0]
    log_views = np.log10(views)
    ax1.hist(log_views, bins=30, edgecolor='black', alpha=0.7, color='steelblue')
    ax1.set_xlabel('Log₁₀(Wikipedia Pageviews)')
    ax1.set_ylabel('Number of Events')
    ax1.set_title('Distribution of Wikipedia Pageviews (Log Scale)')

    # Add percentile lines
    percentiles = [33, 66]
    colors = ['green', 'orange']
    labels = ['Easy/Medium cutoff', 'Medium/Hard cutoff']
    for pct, color, label in zip(percentiles, colors, labels):
        pct_val = np.percentile(log_views, 100 - pct)  # Higher views = easier
        ax1.axvline(pct_val, color=color, linestyle='--', linewidth=2, label=f'{label} ({10**pct_val:,.0f} views)')
    ax1.legend()

    # Plot 2: Box plot by category
    ax2 = axes[1]
    categories = {}
    for event in events:
        if "wikipedia_views" in event and event["wikipedia_views"] > 0:
            cat = event.get("category", "unknown")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(np.log10(event["wikipedia_views"]))

    cat_names = list(categories.keys())
    cat_data = [categories[c] for c in cat_names]

    bp = ax2.boxplot(cat_data, labels=cat_names, patch_artist=True)

    # Color the boxes
    colors = ['#ef4444', '#a855f7', '#3b82f6', '#6b7280', '#14b8a6', '#f59e0b']
    for patch, color in zip(bp['boxes'], colors[:len(cat_names)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)

    ax2.set_ylabel('Log₁₀(Wikipedia Pageviews)')
    ax2.set_title('Pageviews by Category')
    ax2.tick_params(axis='x', rotation=45)

    # Plot 3: Box plot by difficulty
    ax3 = axes[2]
    difficulties = {}
    difficulty_order = ['easy', 'medium', 'hard']

    for event in events:
        if "wikipedia_views" in event and event["wikipedia_views"] > 0:
            diff = event.get("difficulty", "unknown")
            if diff not in difficulties:
                difficulties[diff] = []
            difficulties[diff].append(np.log10(event["wikipedia_views"]))

    # Order difficulties logically (easy, medium, hard, then any others)
    diff_names = [d for d in difficulty_order if d in difficulties]
    diff_names += [d for d in difficulties.keys() if d not in difficulty_order]
    diff_data = [difficulties[d] for d in diff_names]

    if diff_data:
        bp3 = ax3.boxplot(diff_data, labels=diff_names, patch_artist=True)

        # Color the boxes (green=easy, yellow=medium, red=hard)
        difficulty_colors = {'easy': '#22c55e', 'medium': '#eab308', 'hard': '#ef4444', 'unknown': '#6b7280'}
        for patch, diff_name in zip(bp3['boxes'], diff_names):
            patch.set_facecolor(difficulty_colors.get(diff_name, '#6b7280'))
            patch.set_alpha(0.7)

        ax3.set_ylabel('Log₁₀(Wikipedia Pageviews)')
        ax3.set_title('Pageviews by Difficulty Rating')
        ax3.tick_params(axis='x', rotation=45)

        # Print difficulty stats
        print(f"\n📈 Pageviews by Difficulty:")
        for diff_name in diff_names:
            data = difficulties[diff_name]
            median_views = 10 ** np.median(data)
            print(f"   {diff_name.capitalize()}: {len(data)} events, median {median_views:,.0f} views")

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"Plot saved to: {output_path}")

    # Print statistics
    print(f"\n📊 Statistics:")
    print(f"   Total events with views: {len(views)}")
    print(f"   Min views: {min(views):,}")
    print(f"   Max views: {max(views):,}")
    print(f"   Median views: {int(np.median(views)):,}")
    print(f"   Mean views: {int(np.mean(views)):,}")

    # Difficulty thresholds
    sorted_views = sorted(views, reverse=True)
    easy_threshold = sorted_views[len(sorted_views) // 3]
    hard_threshold = sorted_views[2 * len(sorted_views) // 3]
    print(f"\n🎯 Suggested difficulty thresholds (by terciles):")
    print(f"   Easy: > {easy_threshold:,} views ({len([v for v in views if v > easy_threshold])} events)")
    print(f"   Medium: {hard_threshold:,} - {easy_threshold:,} views ({len([v for v in views if hard_threshold <= v <= easy_threshold])} events)")
    print(f"   Hard: < {hard_threshold:,} views ({len([v for v in views if v < hard_threshold])} events)")

def main():
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Loading events...")
    events = load_all_events()
    print(f"Loaded {len(events)} total events")

    # Export CSV
    csv_path = OUTPUT_DIR / "wikipedia_pageviews.csv"
    count = export_csv(events, csv_path)
    print(f"\n📄 CSV exported: {csv_path}")
    print(f"   Events with pageview data: {count}")

    # Create plot
    plot_path = OUTPUT_DIR / "pageviews_distribution.png"
    create_distribution_plot(events, plot_path)

if __name__ == "__main__":
    main()
