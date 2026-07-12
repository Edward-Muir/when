#!/usr/bin/env node

/**
 * Build Dedup Clusters
 *
 * Produces `public/dedup/clusters.json` for the dev-only `/admin/dedup` review tool.
 * The app doesn't serve `docs/`, so the review CSV a sweep produced has to be flattened
 * into something the browser can fetch.
 *
 * Primary source: `docs/sports-events/duplicate-clusters-review.csv`
 *   Columns: cluster, size, year, title, category_file, has_image, name
 *   Rows sharing a `cluster` number form one duplicate group.
 *
 * Fallback: if that CSV is absent, clusters are generated heuristically from the live
 * event data in `public/events/*.json` (very similar friendly names) so the tool still
 * works end-to-end. This is clearly logged so it's never mistaken for the real sweep.
 *
 * Output shape (matches what the page expects): an array of clusters, each an array of
 * event `name` ids — e.g. [["wwi-end","world-war-one-ends"], ["moon-landing", ...]].
 * The page joins these ids against the event loader for full details.
 *
 * Usage: node scripts/build-dedup-clusters.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/sports-events/duplicate-clusters-review.csv');
const EVENTS_DIR = path.join(__dirname, '../public/events');
const OUT_DIR = path.join(__dirname, '../public/dedup');
const OUT_PATH = path.join(OUT_DIR, 'clusters.json');

/**
 * Minimal CSV parser that understands double-quoted fields (so titles containing
 * commas survive). Returns an array of row objects keyed by the header names.
 */
function parseCsv(text) {
  const rows = [];
  let field = '';
  let record = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      // Ignore blank lines produced by trailing newlines.
      if (field !== '' || record.length > 0) {
        record.push(field);
        rows.push(record);
        record = [];
        field = '';
      }
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    rows.push(record);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}

/** Group CSV rows into clusters (array of arrays of `name`), preserving cluster order. */
function clustersFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const byCluster = new Map();
  const order = [];

  for (const row of rows) {
    const cluster = row.cluster;
    const name = row.name;
    if (!cluster || !name) continue;
    if (!byCluster.has(cluster)) {
      byCluster.set(cluster, []);
      order.push(cluster);
    }
    byCluster.get(cluster).push(name);
  }

  return order
    .map((c) => byCluster.get(c))
    .filter((members) => members.length > 1);
}

// --- Heuristic fallback -----------------------------------------------------

function loadEvents() {
  const files = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  const events = [];
  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf-8'));
    for (const event of content) events.push(event);
  }
  return events;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.includes(shorter) && shorter.length > 5) {
    return shorter.length / longer.length;
  }

  // Levenshtein
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let last = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let next = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1]) {
          next = Math.min(Math.min(next, last), costs[j]) + 1;
        }
        costs[j - 1] = last;
        last = next;
      }
    }
    if (i > 0) costs[s2.length] = last;
  }
  return (longer.length - costs[s2.length]) / longer.length;
}

/**
 * Group events whose friendly names are highly similar into clusters via a simple
 * union-find. Intentionally loose enough to surface real duplicates (and the odd false
 * positive) so the manual keep-which tool has something to chew on.
 */
function clustersFromEvents(events) {
  const parent = events.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const SIM_THRESHOLD = 0.86;
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (similarity(events[i].friendly_name, events[j].friendly_name) >= SIM_THRESHOLD) {
        union(i, j);
      }
    }
  }

  const groups = new Map();
  for (let i = 0; i < events.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(events[i].name);
  }

  return [...groups.values()].filter((members) => members.length > 1);
}

// --- Main -------------------------------------------------------------------

function main() {
  let clusters;
  let source;

  if (fs.existsSync(CSV_PATH)) {
    console.log(`📄 Reading clusters from ${path.relative(process.cwd(), CSV_PATH)}`);
    clusters = clustersFromCsv(fs.readFileSync(CSV_PATH, 'utf-8'));
    source = 'csv';
  } else {
    console.log('⚠️  Review CSV not found at docs/sports-events/duplicate-clusters-review.csv');
    console.log('    Falling back to heuristic detection over public/events/*.json.');
    console.log('    (Re-run this script once the real CSV is in place to use it instead.)');
    clusters = clustersFromEvents(loadEvents());
    source = 'heuristic';
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(clusters, null, 2) + '\n');

  const totalEvents = clusters.reduce((sum, c) => sum + c.length, 0);
  console.log(
    `✅ Wrote ${clusters.length} clusters (${totalEvents} events, source: ${source}) → ${path.relative(
      process.cwd(),
      OUT_PATH
    )}`
  );
}

main();
