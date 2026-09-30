#!/usr/bin/env node
/**
 * Cross-checks region tags against the card's own text: lists every card whose name or
 * description names a place (a country, a demonym, a historical polity) that none of its tags
 * satisfies. Advisory only; it always exits 0.
 *
 * Usage:
 *   node scripts/events/region-audit.js                    # every tagged event in the catalogue
 *   node scripts/events/region-audit.js batch-001.json     # entries in a map, before applying it
 *   node scripts/events/region-audit.js --detail           # also scan the detail paragraphs
 *
 * This is the cheap second opinion on a tagger's batch. It is deliberately a list for a human
 * rather than a gate: text names places in passing ("triggering declarations of war from
 * Britain and France"), and the spec's answer to that is often "consequence, not tagged".
 * What it reliably catches is the outright miss: a card called "Siege of Vienna" with no
 * Austria. Scanning the detail prose finds more misses and a lot more noise, so it is opt-in.
 *
 * A mention is satisfied when any tag it maps to is on the card, or, for a region, when the
 * card's tags resolve to it. A country mention is *not* satisfied by its region alone: a card
 * that says "German" and is tagged only "Europe" is exactly what a reviewer should look at.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, readDetailShard } = require('./detail-catalogue');
const {
  REGIONS,
  COUNTRIES,
  GLOBAL,
  isRegion,
  regionSetOf,
  canonicalRegions,
} = require('./region-spec');
const { ALIASES, STOP_PHRASES } = require('./region-aliases');

const MAPS_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-regions');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bounded = (s) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(s)}(?![\\p{L}\\p{N}])`, 'gu');

/**
 * term -> tags that satisfy it. Taxonomy names map to themselves first, and the alias table
 * overrides them, which is how "Georgia" also accepts the US state.
 */
function buildTerms() {
  const terms = new Map();
  for (const name of Object.keys(COUNTRIES)) terms.set(name, [name]);
  for (const region of REGIONS) if (region !== GLOBAL) terms.set(region, [region]);
  for (const [term, tags] of Object.entries(ALIASES)) terms.set(term, tags);
  // Longest first, so "Holy Roman Empire" is consumed before "Roman" can match inside it.
  return [...terms.entries()]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([term, tags]) => ({ term, tags, re: bounded(term) }));
}

const TERMS = buildTerms();
const STOPS = [...STOP_PHRASES].sort((a, b) => b.length - a.length).map(bounded);

/** Every place the text names, as `{ term, tags }`, each span counted once. */
function mentionsIn(text) {
  let rest = text;
  for (const re of STOPS) rest = rest.replace(re, ' ');
  const found = [];
  for (const { term, tags, re } of TERMS) {
    if (!re.test(rest)) continue;
    re.lastIndex = 0;
    found.push({ term, tags });
    rest = rest.replace(re, ' ');
  }
  return found;
}

function satisfied(mention, tags, regionSet) {
  return mention.tags.some((t) => tags.includes(t) || (isRegion(t) && regionSet.has(t)));
}

/**
 * One line per card whose text names a place its tags miss. `entries` is
 * `[{ slug, event, tags, detail? }]`; `detail` is the card's paragraphs when `withDetail`.
 */
function auditEntries(entries, { withDetail = false } = {}) {
  const lines = [];
  for (const { slug, event, tags, detail } of entries) {
    const text = [event.friendly_name, event.description]
      .concat(withDetail && Array.isArray(detail) ? detail : [])
      .join(' \n ');
    const regionSet = regionSetOf(tags);
    const missed = mentionsIn(text).filter((m) => !satisfied(m, tags, regionSet));
    if (!missed.length) continue;
    const what = missed.map((m) => `"${m.term}" (${m.tags.join(' | ')})`).join(', ');
    lines.push(`${slug} [${tags.join(', ')}]: names ${what}`);
  }
  return lines;
}

function catalogueIndex() {
  const locate = new Map();
  for (const file of manifestFiles()) {
    for (const event of readEvents(file)) {
      if (event && event.name) locate.set(event.name, { file, event });
    }
  }
  return locate;
}

function detailFor(file, slug, cache) {
  if (!cache.has(file)) cache.set(file, readDetailShard(file));
  const entry = cache.get(file)[slug];
  return entry && entry.paragraphs;
}

function main() {
  const argv = process.argv.slice(2);
  const withDetail = argv.includes('--detail');
  const mapNames = argv.filter((a) => !a.startsWith('--')).map((a) => path.basename(a));
  const locate = catalogueIndex();
  const detailCache = new Map();

  const entries = [];
  if (mapNames.length) {
    for (const name of mapNames) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-supplied map name
      const map = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, name), 'utf8'));
      for (const [slug, entry] of Object.entries(map)) {
        const found = locate.get(slug);
        if (!found || !entry || !Array.isArray(entry.regions)) continue;
        entries.push({
          slug,
          event: found.event,
          tags: canonicalRegions(entry.regions),
          file: found.file,
        });
      }
    }
  } else {
    for (const [slug, { file, event }] of locate) {
      if (Array.isArray(event.regions) && event.regions.length) {
        entries.push({ slug, event, tags: event.regions, file });
      }
    }
  }
  if (withDetail) {
    for (const e of entries) e.detail = detailFor(e.file, e.slug, detailCache);
  }

  const lines = auditEntries(entries, { withDetail });
  for (const line of lines) console.log(line);
  console.log(
    `\n${lines.length} of ${entries.length} card(s) name a place their tags miss` +
      (withDetail
        ? ' (name, description and detail).'
        : ' (name and description; --detail for prose).')
  );
}

if (require.main === module) main();

module.exports = { auditEntries, mentionsIn };
