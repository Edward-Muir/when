#!/usr/bin/env python3
"""
Fix Wikipedia Misattributions

This script fixes incorrect Wikipedia URLs that were returned by the search
and fetches correct pageviews for the corrected articles.

Usage:
    python scripts/difficulty/fix_misattributions.py           # Apply all fixes
    python scripts/difficulty/fix_misattributions.py --dry-run # Preview changes
"""

import argparse
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

import requests

# Configuration
USER_AGENT = "WhenGame/1.0 (difficulty-metric-script; github.com/timeline/when)"
EVENTS_DIR = Path(__file__).parent.parent.parent / "public" / "events"
PAGEVIEW_DAYS = 365
REQUEST_DELAY = 0.2  # Seconds between API calls

# Corrections mapping: event_name -> correct_wikipedia_article
# Format: "event-name": "Correct_Wikipedia_Article_Title"
CORRECTIONS = {
    # Diplomatic events
    "mandela-sentenced": "Rivonia_Trial",
    "uk-joins-eec": "Accession_of_the_United_Kingdom_to_the_European_Communities",
    "sdi-announced": "Strategic_Defense_Initiative",
    "abbasid-caliphate": "Abbasid_Caliphate",
    "mughal-empire": "Mughal_Empire",
    "stamp-act": "Stamp_Act_1765",
    "dominion-of-canada": "Dominion_of_Canada",
    "toledo-reconquered": "Siege_of_Toledo_(1085)",
    "first-english-parliament": "Parliament_of_England",
    "khrushchev-ousted": "1964_Soviet_leadership_change",
    "bismarck-dismissed": "Dropping_the_Pilot",
    "who-founded": "World_Health_Organization",
    "five-good-emperors": "Nerva–Antonine_dynasty",
    "kangxi-emperor": "Kangxi_Emperor",
    "last-emperor-abdicates": "Puyi",
    "serbia-independence": "Principality_of_Serbia",
    "final-solution": "Final_Solution",
    "minamoto-yoritomo": "Minamoto_no_Yoritomo",
    "fultons-steamboat": "North_River_Steamboat",
    "venezuela-declares": "Venezuelan_Declaration_of_Independence",
    "commodore-perry": "Perry_Expedition",
    "taliban-return": "Fall_of_Kabul_(2021)",
    "boris-johnson": "Boris_Johnson",
    "peace-corps": "Peace_Corps",
    "african-national-congress-founded": "African_National_Congress",

    # Cultural events
    "birth-of-confucius": "Confucius",
    "birth-of-martin-luther": "Martin_Luther",
    "human-genome-project": "Human_Genome_Project",
    "harlem-renaissance": "Harlem_Renaissance",
    "death-of-leonardo": "Leonardo_da_Vinci",
    "nelson-mandela-released": "Nelson_Mandela",
    "nelson-mandela-elected": "1994_South_African_general_election",
    "citizen-kane": "Citizen_Kane",
    "death-of-napoleon": "Napoleon",
    "elvis-first-single": "That's_All_Right",
    "first-miss-america": "Miss_America",
    "dante-divine-comedy": "Divine_Comedy",
    "the-thinker": "The_Thinker",
    "shakespeare-hamlet": "Hamlet",
    "giotto-scrovegni": "Scrovegni_Chapel",
    "same-sex-marriage-us": "Obergefell_v._Hodges",
    "death-of-socrates": "Socrates",
    "birth-of-socrates": "Socrates",
    "pride-and-prejudice": "Pride_and_Prejudice",
    "joan-of-arc-leads": "Joan_of_Arc",
    "joan-of-arc-executed": "Trial_of_Joan_of_Arc",
    "first-talking-film": "The_Jazz_Singer",
    "mickey-mouse-debuts": "Mickey_Mouse",
    "pinocchio-premieres": "Pinocchio_(1940_film)",
    "the-prince-written": "The_Prince",
    "women-vote-uk": "Women's_suffrage_in_the_United_Kingdom",
    "aristotle-tutors-alexander": "Aristotle",
    "alcatraz-federal-prison": "Alcatraz_Federal_Penitentiary",
    "television-invented": "History_of_television",
    "i-ching": "I_Ching",
    "apartheid-begins": "Apartheid",
    "pax-romana-begins": "Pax_Romana",
    "french-revolution-begins": "French_Revolution",
    "louvre-opens": "Louvre",
    "beethovens-first-symphony": "Symphony_No._1_(Beethoven)",
    "catch-22": "Catch-22",

    # Exploration events
    "world-wide-web": "World_Wide_Web",
    "first-motion-picture": "Cinematograph",
    "stanley-finds-livingstone": "David_Livingstone",
    "channel-tunnel-breakthrough": "Channel_Tunnel",
    "eyeglasses-invented": "Glasses",
    "columbus-reaches-americas": "Christopher_Columbus",
    "bacteria-discovered": "Antonie_van_Leeuwenhoek",
    "radioactivity-discovered": "Radioactivity",
    "mayflower-lands": "Mayflower",
    "cell-theory": "Cell_theory",
    "first-exoplanet": "51_Pegasi_b",
    "dutch-reach-australia": "European_exploration_of_Australia",
    "gravitational-waves": "First_observation_of_gravitational_waves",
    "general-relativity": "General_relativity",
    "first-powered-flight": "Wright_brothers",
    "first-insulin-injection": "Insulin",
    "laser-invented": "Laser",
    "anaesthesia-discovered": "History_of_general_anesthesia",
    "paper-invented": "Paper",
    "telescope-invented": "History_of_the_telescope",
    "galileo-telescope": "Galileo_Galilei",
    "machu-picchu-rediscovered": "Machu_Picchu",
    "pasteur-germ-theory": "Germ_theory_of_disease",
    "bunsen-burner": "Bunsen_burner",
    "first-new-york-synagogue": "Shearith_Israel",
    "boeing-747": "Boeing_747",
    "ibn-battuta": "Ibn_Battuta",
    "agriculture-begins": "Neolithic_Revolution",
    "humans-master-fire": "Control_of_fire_by_early_humans",
    "first-woman-senate": "Hattie_Caraway",
    "dna-structure": "DNA",
    "neutron-discovered": "Neutron",
    "change-4-lands": "Chang'e_4",
    "copernicus-heliocentrism": "Copernican_heliocentrism",
    "expanding-universe": "Expansion_of_the_universe",
    "first-nuclear-reactor": "Chicago_Pile-1",
    "hudson-explores": "Henry_Hudson",

    # Conflict events
    "siege-of-sarajevo": "Siege_of_Sarajevo",
    "first-crusade": "First_Crusade",
    "albigensian-crusade": "Albigensian_Crusade",
    "german-peasants-war": "German_Peasants'_War",
    "franco-prussian-war": "Franco-Prussian_War",
    "capture-of-jerusalem": "Siege_of_Jerusalem_(1099)",
    "tibet-invasion": "Annexation_of_Tibet_by_the_People's_Republic_of_China",
    "korean-air-007": "Korean_Air_Lines_Flight_007",
    "nuremberg-trials": "Nuremberg_trials",
    "v-e-day": "Victory_in_Europe_Day",
    "charlemagne-crowned": "Coronation_of_Charlemagne",
    "napoleon-crowned": "Coronation_of_Napoleon_I",
    "dutch-revolt": "Eighty_Years'_War",
    "seven-years-war": "Seven_Years'_War",
    "wars-of-roses": "Wars_of_the_Roses",
    "great-northern-war": "Great_Northern_War",
    "finnish-civil-war": "Finnish_Civil_War",
    "world-war-i-ends": "Armistice_of_11_November_1918",
    "mussolini-takes-power": "March_on_Rome",
    "brexit-referendum": "2016_United_Kingdom_European_Union_membership_referendum",

    # Disasters events
    "spanish-flu-second-wave": "Spanish_flu",
    "great-boston-fire": "Great_fire_of_Boston_(1872)",
    "nepal-bihar-earthquake": "1934_Nepal–Bihar_earthquake",
    "irish-forgotten-famine": "Irish_Famine_(1740–1741)",
    "london-cholera": "1854_Broad_Street_cholera_outbreak",
    "dust-bowl": "Dust_Bowl",
    "black-death-peaks": "Black_Death",
    "guatemala-earthquake": "1976_Guatemala_earthquake",
    "peru-earthquake": "1970_Ancash_earthquake",
    "iran-earthquake": "1990_Manjil–Rudbar_earthquake",
    "great-chinese-famine": "Great_Chinese_Famine",
    "chile-earthquake": "1960_Valdivia_earthquake",
    "stock-market-crash": "Wall_Street_Crash_of_1929",
    "malaysia-airlines-370": "Malaysia_Airlines_Flight_370",
    "super-tornado": "1974_Super_Outbreak",

    # Infrastructure events
    "gobekli-tepe": "Göbekli_Tepe",
    "hagia-sophia": "Hagia_Sophia",
    "st-peters-basilica": "St._Peter's_Basilica",
    "new-amsterdam-new-york": "New_Amsterdam",
    "machu-picchu-built": "Machu_Picchu",
    "great-wall-begins": "Great_Wall_of_China",
    "burj-khalifa": "Burj_Khalifa",
    "first-cotton-mill": "Cromford_Mill",
    "first-commercial-radio": "History_of_radio",
    "un-headquarters": "Headquarters_of_the_United_Nations",
    "museum-of-alexandria": "Library_of_Alexandria",
}


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

    headers = {"User-Agent": USER_AGENT}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 404:
            print(f"    [WARNING] Article not found: {article_title}")
            return None
        response.raise_for_status()
        data = response.json()
        total_views = sum(item["views"] for item in data.get("items", []))
        return total_views
    except Exception as e:
        print(f"    [ERROR] Pageview error for '{article_title}': {e}")
        return None


def get_wikipedia_url(article_title: str) -> str:
    """Generate Wikipedia URL from article title."""
    return f"https://en.wikipedia.org/wiki/{article_title}"


def load_events(file_path: Path) -> list:
    """Load events from a JSON file."""
    with open(file_path) as f:
        return json.load(f)


def save_events(file_path: Path, events: list):
    """Save events to a JSON file with nice formatting."""
    with open(file_path, "w") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")


def find_event_by_name(events: list, name: str) -> dict | None:
    """Find an event by name (case-insensitive, partial match)."""
    name_lower = name.lower().replace("-", "").replace("_", "")
    for event in events:
        event_name = event.get("name", "").lower().replace("-", "").replace("_", "")
        if name_lower in event_name or event_name in name_lower:
            return event
    return None


def apply_corrections(dry_run: bool = False):
    """Apply all corrections to event JSON files."""
    json_files = list(EVENTS_DIR.glob("*.json"))
    json_files = [f for f in json_files if f.name != "manifest.json"]

    print("=" * 70)
    print("Wikipedia Misattribution Fixes")
    print("=" * 70)
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'APPLYING CHANGES'}")
    print(f"Corrections to apply: {len(CORRECTIONS)}")
    print()

    fixed = 0
    not_found = 0
    pageview_errors = 0

    for json_file in json_files:
        events = load_events(json_file)
        modified = False

        for event in events:
            event_name = event.get("name", "")

            # Check if this event needs correction
            if event_name not in CORRECTIONS:
                # Try partial match
                matching_key = None
                for key in CORRECTIONS:
                    if key in event_name or event_name in key:
                        matching_key = key
                        break
                if not matching_key:
                    continue
                event_name = matching_key

            correct_article = CORRECTIONS[event_name]
            old_url = event.get("wikipedia_url", "")
            old_views = event.get("wikipedia_views", 0)
            new_url = get_wikipedia_url(correct_article)

            # Skip if already correct
            if old_url == new_url:
                continue

            print(f"\n[{json_file.name}] {event.get('friendly_name', event_name)}")
            print(f"  OLD: {old_url}")
            print(f"       ({old_views:,} views)")
            print(f"  NEW: {new_url}")

            if not dry_run:
                # Fetch new pageviews
                new_views = get_pageviews(correct_article)
                time.sleep(REQUEST_DELAY)

                if new_views is not None:
                    print(f"       ({new_views:,} views)")
                    event["wikipedia_url"] = new_url
                    event["wikipedia_views"] = new_views
                    modified = True
                    fixed += 1
                else:
                    print(f"       [ERROR] Could not fetch pageviews")
                    pageview_errors += 1
            else:
                print(f"       (pageviews would be fetched)")
                fixed += 1

        if modified and not dry_run:
            save_events(json_file, events)
            print(f"\n[SAVED] {json_file.name}")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Corrections defined: {len(CORRECTIONS)}")
    print(f"  Events fixed:        {fixed}")
    print(f"  Pageview errors:     {pageview_errors}")

    if dry_run:
        print("\n  (Dry run - no changes made. Run without --dry-run to apply.)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fix Wikipedia misattributions in event data"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without modifying files",
    )
    args = parser.parse_args()

    apply_corrections(dry_run=args.dry_run)
