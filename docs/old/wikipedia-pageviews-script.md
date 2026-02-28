# Wikipedia Pageviews Difficulty Script

## Overview

A Python script that looks up Wikipedia pageviews for each historical event to use as a difficulty metric. More pageviews = more well-known event = easier difficulty.

## Scripts

| Script                                      | Purpose                                                       |
| ------------------------------------------- | ------------------------------------------------------------- |
| `scripts/difficulty/wikipedia_pageviews.py` | Main script - searches Wikipedia and adds pageviews to events |
| `scripts/difficulty/fix_misattributions.py` | Correction script - fixes incorrect Wikipedia URL matches     |

## Usage

```bash
cd /Users/emuir/Documents/GitHub/Vibes/timeline/when

# Test with sample events (doesn't modify files)
python3 scripts/difficulty/wikipedia_pageviews.py --test

# Process all events and update JSON files
python3 scripts/difficulty/wikipedia_pageviews.py

# Preview misattribution fixes (dry run)
python3 scripts/difficulty/fix_misattributions.py --dry-run

# Apply misattribution fixes
python3 scripts/difficulty/fix_misattributions.py
```

## What It Does

### wikipedia_pageviews.py

1. Loads all events from JSON files in `public/events/`
2. For each event, searches Wikipedia using `friendly_name`
3. Gets annual pageviews for the top search result
4. Adds `wikipedia_views` and `wikipedia_url` fields to each event
5. Writes updated JSON files back

### fix_misattributions.py

1. Contains a curated list of ~144 known misattributions
2. For each misattributed event, replaces the incorrect URL with the correct one
3. Fetches fresh pageview counts from Wikipedia for the corrected articles
4. Updates the event JSON files

### Example Output

```json
{
  "name": "moon-landing",
  "friendly_name": "Moon Landing",
  "year": 1969,
  "wikipedia_views": 525236,
  "wikipedia_url": "https://en.wikipedia.org/wiki/Moon_landing",
  ...
}
```

## APIs Used

1. **MediaWiki Action API** - Find article title from event name
   - Endpoint: `https://en.wikipedia.org/w/api.php?action=query&list=search`
   - No authentication required for read operations
   - More generous rate limits than api.wikimedia.org

2. **Wikimedia Pageviews API** - Get view counts
   - Endpoint: `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/...`

## Configuration

The script loads credentials from `.env` file (optional - not required for basic operation):

```
WIKI_ACCESS_TOKEN=eyJ0eXAiOiJKV1QiLC...
WIKI_CLIENT_ID=294d726493f5a0933ad798c02876bd93
WIKI_CLIENT_SECRET=47dc31ace05ec3a0fe6aab39508b5895def45cd9
```

## Features

- **Progress tracking**: Shows `[15/247] >> Event Name` as it runs
- **Logging**: Creates timestamped log files in `logs/` directory
- **Skip existing**: Events with `wikipedia_views` are skipped on re-run
- **Retry logic**: Automatically retries on rate limit (429) with backoff
- **Auth fallback**: Falls back to unauthenticated mode if token rejected

---

## Misattribution Fixes (2026-01-25)

### Problem: Wikipedia Search Returns Wrong Articles

The `wikipedia_pageviews.py` script uses Wikipedia's search API to find articles. However, the top search result is often incorrect:

| Event                   | Wrong Article Found                      | Correct Article               |
| ----------------------- | ---------------------------------------- | ----------------------------- |
| Agriculture Begins      | Menachem Begin (politician)              | Neolithic Revolution          |
| Cell Theory Established | Splinter Cell: Chaos Theory (video game) | Cell theory                   |
| Wars of the Roses       | The Roses (1989 film)                    | Wars of the Roses             |
| Great Northern War      | World War I                              | Great Northern War            |
| Mickey Mouse Debuts     | Mickey Mouse Clubhouse+                  | Mickey Mouse                  |
| Alcatraz Becomes Prison | Alligator Alcatraz                       | Alcatraz Federal Penitentiary |

### Solution: fix_misattributions.py

A correction script was created with 144 known misattributions mapped to correct Wikipedia articles. Running this script:

1. Reads each event JSON file
2. Finds events with incorrect URLs (matched by event name)
3. Replaces the URL with the correct Wikipedia article
4. Fetches fresh pageview counts from the Pageviews API
5. Saves the updated JSON

### Results

On 2026-01-25, the script fixed **100 misattributed events**:

| Category            | Events Fixed |
| ------------------- | ------------ |
| disasters.json      | 7            |
| exploration.json    | 26           |
| cultural.json       | 18           |
| conflict.json       | 16           |
| diplomatic.json     | 23           |
| infrastructure.json | 10           |

### Adding New Corrections

To fix additional misattributions, edit the `CORRECTIONS` dictionary in `fix_misattributions.py`:

```python
CORRECTIONS = {
    # Format: "event-name": "Correct_Wikipedia_Article_Title"
    "my-event": "Correct_Article_Name",
    ...
}
```

Then run: `python3 scripts/difficulty/fix_misattributions.py`

---

## Historical Issue: 403 Forbidden with API Token

When using the `WIKI_ACCESS_TOKEN` from `.env`, the Wikipedia Search API returned 403 errors. This was resolved by switching to the MediaWiki Action API (`en.wikipedia.org/w/api.php`) which doesn't require authentication.

### Relevant Documentation

- [MediaWiki Action API - Search](https://www.mediawiki.org/wiki/API:Search)
- [MediaWiki API Etiquette](https://www.mediawiki.org/wiki/API:Etiquette)
- [Wikimedia API Rate Limits](https://api.wikimedia.org/wiki/Rate_limits)

---

## Difficulty Grading (Future Step)

After all events have `wikipedia_views`, we'll grade on a curve:

- Top 1/3 by views → easy
- Middle 1/3 → medium
- Bottom 1/3 → hard
