#!/usr/bin/env python3
"""
Wikipedia Pageviews Script

Looks up Wikipedia pageviews for historical events and adds them to event JSON files.
More pageviews = more well-known event (useful for difficulty metrics).

Usage:
    python scripts/difficulty/wikipedia_pageviews.py           # Process all events
    python scripts/difficulty/wikipedia_pageviews.py --test    # Test with sample events
"""

import argparse
import json
import logging
import os
import requests
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv

# Load .env file from project root
ENV_PATH = Path(__file__).parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

# Configuration
USER_AGENT = "WhenGame/1.0 (difficulty-metric-script; github.com/timeline/when)"
EVENTS_DIR = Path(__file__).parent.parent.parent / "public" / "events"
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
PAGEVIEW_DAYS = 365  # Look at last year of pageviews
REQUEST_DELAY = 0.5  # Seconds between API calls
MAX_RETRIES = 3  # Retry on rate limit
RATE_LIMIT_WAIT = 60  # Seconds to wait when rate limited

# API token from .env file (optional, but gives 10x higher rate limit)
WIKI_ACCESS_TOKEN = os.environ.get("WIKI_ACCESS_TOKEN")


def setup_logging():
    """Setup logging to both console and file."""
    LOG_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"wikipedia_pageviews_{timestamp}.log"

    # Create formatter
    formatter = logging.Formatter("%(asctime)s | %(message)s", datefmt="%H:%M:%S")

    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Setup logger
    logger = logging.getLogger("wikipedia_pageviews")
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info(f"Log file: {log_file}")
    return logger


log = None  # Global logger, initialized in main


def make_request_with_retry(url: str, params: dict = None, max_retries: int = MAX_RETRIES, use_auth: bool = True) -> requests.Response | None:
    """Make an HTTP request with retry logic for rate limiting."""
    global _auth_disabled

    headers = {"User-Agent": USER_AGENT}
    # Only use auth if enabled and not previously disabled due to 403
    if use_auth and WIKI_ACCESS_TOKEN and not getattr(make_request_with_retry, '_auth_disabled', False):
        headers["Authorization"] = f"Bearer {WIKI_ACCESS_TOKEN}"

    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, headers=headers)

            # Handle 403 - token might be invalid, retry without auth
            if response.status_code == 403 and "Authorization" in headers:
                if log:
                    log.info("   [AUTH ERROR] Token rejected, falling back to unauthenticated mode")
                else:
                    print("   [AUTH ERROR] Token rejected, falling back to unauthenticated mode")
                make_request_with_retry._auth_disabled = True
                del headers["Authorization"]
                continue

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", RATE_LIMIT_WAIT))
                if log:
                    log.info(f"   [RATE LIMITED] Waiting {retry_after}s (attempt {attempt + 1}/{max_retries})")
                else:
                    print(f"   [RATE LIMITED] Waiting {retry_after}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_after)
                continue

            response.raise_for_status()
            return response

        except requests.exceptions.HTTPError as e:
            if "429" not in str(e):
                raise
            # Already handled above, but just in case
            time.sleep(RATE_LIMIT_WAIT)
            continue

    return None


def search_wikipedia(query: str) -> list[dict] | None:
    """Search Wikipedia for articles matching the query.

    Uses MediaWiki Action API (en.wikipedia.org/w/api.php) which has
    more generous rate limits than api.wikimedia.org.
    """
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json",
        "srlimit": 3,
    }

    try:
        # Use make_request_with_retry but without auth (not needed for this API)
        response = make_request_with_retry(url, params, use_auth=False)
        if response is None:
            print(f"  Search failed after {MAX_RETRIES} retries")
            return None

        data = response.json()

        if "query" in data and "search" in data["query"]:
            return [
                {
                    "title": p["title"],
                    "key": p["title"].replace(" ", "_"),
                    "description": p.get("snippet", ""),
                }
                for p in data["query"]["search"]
            ]
        return None
    except Exception as e:
        print(f"  Search error: {e}")
        return None


def get_pageviews(article_title: str) -> int | None:
    """Get total pageviews for a Wikipedia article over the last year."""
    encoded_title = quote(article_title.replace(" ", "_"), safe="")

    end_date = datetime.now() - timedelta(days=1)
    start_date = end_date - timedelta(days=PAGEVIEW_DAYS)

    url = (
        f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
        f"en.wikipedia/all-access/user/{encoded_title}/daily/"
        f"{start_date.strftime('%Y%m%d')}/{end_date.strftime('%Y%m%d')}"
    )

    try:
        response = make_request_with_retry(url)
        if response is None:
            print(f"  Pageview lookup failed after {MAX_RETRIES} retries")
            return None

        data = response.json()

        total_views = sum(item["views"] for item in data.get("items", []))
        return total_views
    except Exception as e:
        print(f"  Pageview error for '{article_title}': {e}")
        return None


def get_wikipedia_url(article_title: str) -> str:
    """Generate Wikipedia URL from article title."""
    encoded_title = article_title.replace(" ", "_")
    return f"https://en.wikipedia.org/wiki/{encoded_title}"


def get_event_pageviews(friendly_name: str) -> tuple[int | None, str | None, str | None]:
    """
    Search Wikipedia for an event and return its pageviews.
    Returns (pageviews, article_title, wikipedia_url) tuple.
    """
    search_results = search_wikipedia(friendly_name)

    if not search_results:
        return None, None, None

    # Use the top result
    top_article = search_results[0]["title"]
    views = get_pageviews(top_article)
    url = get_wikipedia_url(top_article)

    return views, top_article, url


def load_events(file_path: Path) -> list:
    """Load events from a JSON file."""
    with open(file_path) as f:
        return json.load(f)


def save_events(file_path: Path, events: list):
    """Save events to a JSON file with nice formatting."""
    with open(file_path, "w") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")


def process_all_events():
    """Process all events in all JSON files and add wikipedia_views field."""
    json_files = list(EVENTS_DIR.glob("*.json"))
    json_files = [f for f in json_files if f.name != "manifest.json"]

    # Count total events for progress
    total_event_count = sum(len(load_events(f)) for f in json_files)

    log.info("=" * 60)
    log.info("Wikipedia Pageviews - Processing All Events")
    log.info("=" * 60)
    if WIKI_ACCESS_TOKEN:
        log.info("Using API token (5,000 requests/hour limit)")
    else:
        log.info("No API token - using unauthenticated access (500 requests/hour limit)")
        log.info("Set WIKI_ACCESS_TOKEN env var for higher limits")
    log.info(f"Events directory: {EVENTS_DIR}")
    log.info(f"Files to process: {[f.name for f in json_files]}")
    log.info(f"Total events: {total_event_count}")
    log.info("")

    processed = 0
    successful = 0
    failed = 0
    skipped = 0

    for json_file in json_files:
        log.info(f"\n{'='*60}")
        log.info(f"Processing: {json_file.name}")
        log.info("=" * 60)

        events = load_events(json_file)
        modified = False

        for event in events:
            friendly_name = event.get("friendly_name", event.get("name", ""))
            processed += 1
            progress = f"[{processed}/{total_event_count}]"

            # Skip if already has pageviews
            if "wikipedia_views" in event:
                log.info(f"{progress} [SKIP] {friendly_name} (already has data)")
                skipped += 1
                continue

            log.info(f"\n{progress} >> {friendly_name}")

            views, article, url = get_event_pageviews(friendly_name)

            if views is not None:
                event["wikipedia_views"] = views
                event["wikipedia_url"] = url
                modified = True
                successful += 1
                log.info(f"   -> {article}: {views:,} views/year")
            else:
                failed += 1
                log.info(f"   -> No data found")

            time.sleep(REQUEST_DELAY)

        if modified:
            save_events(json_file, events)
            log.info(f"\n[SAVED] {json_file.name}")

    # Summary
    log.info("\n" + "=" * 60)
    log.info("SUMMARY")
    log.info("=" * 60)
    log.info(f"  Total events: {total_event_count}")
    log.info(f"  Successful:   {successful}")
    log.info(f"  Skipped:      {skipped}")
    log.info(f"  Failed:       {failed}")


def test_sample_events():
    """Test the script with a few sample events."""
    sample_events = [
        "Formation of Earth",
        "First Life on Earth",
        "General Relativity Published",
        "Moon Landing",
        "World Wide Web Invented",
        "Domestication of Dogs",
    ]

    print("=" * 60)
    print("Wikipedia Pageviews - Test Mode")
    print("=" * 60)

    results = []

    for event_name in sample_events:
        print(f"\n>> {event_name}")

        search_results = search_wikipedia(event_name)

        if not search_results:
            print("  No Wikipedia results found")
            results.append({"event": event_name, "article": None, "views": None})
            continue

        print("  Top Wikipedia matches:")
        for i, result in enumerate(search_results):
            desc = result["description"][:50] + "..." if result["description"] else ""
            print(f"    {i+1}. {result['title']}")
            if desc:
                print(f"       {desc}")

        top_article = search_results[0]["title"]
        views = get_pageviews(top_article)
        url = get_wikipedia_url(top_article)

        if views:
            print(f"  -> Using: '{top_article}' ({views:,} views/year)")
            print(f"     {url}")
            results.append({"event": event_name, "article": top_article, "views": views, "url": url})
        else:
            print(f"  -> No pageview data for '{top_article}'")
            results.append({"event": event_name, "article": top_article, "views": None, "url": url})

        time.sleep(REQUEST_DELAY)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY (sorted by pageviews)")
    print("=" * 60)

    valid_results = [r for r in results if r["views"]]
    valid_results.sort(key=lambda x: x["views"], reverse=True)

    for r in valid_results:
        print(f"  {r['views']:>12,} views | {r['event']}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Look up Wikipedia pageviews for historical events"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode with sample events (doesn't modify files)",
    )
    args = parser.parse_args()

    log = setup_logging()

    if args.test:
        test_sample_events()
    else:
        process_all_events()
