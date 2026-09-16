#!/usr/bin/env node
/**
 * Fills every event with placeholder long-form prose, so the detail view's design can be judged
 * on real layout — varying paragraph counts and lengths, the real title and category — before a
 * single word of the actual corpus exists.
 *
 * Usage:
 *   node scripts/events/detail-placeholder.js            # fill every event that has no real prose
 *   node scripts/events/detail-placeholder.js --revert   # undo: drop placeholder entries + flags
 *
 * BOTH MODES LEAVE WRITTEN PROSE ALONE. Only entries flagged `placeholder: true` are generated,
 * replaced or reverted; a real entry and its `has_detail` survive either run untouched. Before
 * Phase 2 there was no written prose to lose, and both paths took the whole shard — a `--revert`
 * (which docs/event-detail/index.md recommends before syncing with origin/main) would have
 * silently deleted the corpus.
 *
 * Its output IS committed on the feature branch, so the branch's preview deploy is testable —
 * without `has_detail` every card falls back to its short description, which makes the preview
 * useless for
 * looking at the thing it exists to show. What keeps that safe is not leaving it uncommitted but
 * that the branch never merges until the corpus is written, and that every entry is flagged
 * `placeholder: true` so `detail-report.js` refuses to call the job done. See Guardrail 1 in
 * docs/event-detail/index.md.
 *
 * `--revert` deletes the shards and strips the flags again — use it before merging `origin/main`
 * into the branch if main has touched any event JSON, then regenerate.
 *
 * Text is seeded off the slug, so a re-run produces byte-identical output and reviewing a diff
 * stays meaningful.
 */

const {
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
  MIN_PARAGRAPH_CHARS,
  MAX_PARAGRAPH_CHARS,
  MIN_TOTAL_CHARS,
  MAX_TOTAL_CHARS,
} = require('./detail-spec');
const {
  manifestFiles,
  readEvents,
  writeEvents,
  readDetailShard,
  writeDetailShard,
  deleteDetailShard,
} = require('./detail-catalogue');

/** FNV-1a. Any stable hash would do; this one is short and dependency-free. */
function seedFrom(slug) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** mulberry32 — a small deterministic PRNG so each slug gets its own stable shape. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FILLER = [
  'The circumstances were less tidy than the summary suggests, and the people involved did not know which way it would go',
  'Contemporary accounts disagree on the details, which is itself part of the story',
  'What followed was shaped as much by accident as by intent',
  'The consequences took decades to settle, and some of them are still being argued over',
  'It is easy to read the outcome backwards as inevitable, and worth resisting that',
  'The figures at the centre of it were working with far less information than we have now',
  'Several smaller decisions, none of them obviously important at the time, turned out to matter more than the famous ones',
  'The record here is thinner than we would like, and the gaps have been filled in more than once',
];

/**
 * A paragraph of `sentences` filler sentences, topped up until it clears the spec's minimum.
 * Built to satisfy detail-spec by construction rather than by a tuned sentence count: the filler
 * sentences vary in length, so a fixed count lands under the floor for some seeds, and a
 * placeholder run that fails its own validator is no use for exercising the pipeline.
 */
function paragraph(next, sentences, prefixLength = 0, cap = MAX_PARAGRAPH_CHARS) {
  const parts = [];
  const length = () => prefixLength + parts.join('. ').length + 1;
  const ceiling = Math.max(cap, MIN_PARAGRAPH_CHARS);

  while (parts.length < sentences || length() < MIN_PARAGRAPH_CHARS) {
    const candidate = FILLER[Math.floor(next() * FILLER.length)];
    if (length() + candidate.length + 2 > ceiling) break;
    parts.push(candidate);
  }
  return parts.join('. ') + '.';
}

function placeholderFor(event) {
  const next = rng(seedFrom(event.name));
  // Derived from the spec rather than hardcoded, so a future change to the paragraph allowance
  // does not silently produce a placeholder corpus its own validator rejects.
  const count = MIN_PARAGRAPHS + Math.floor(next() * (MAX_PARAGRAPHS - MIN_PARAGRAPHS + 1));

  // `PLACEHOLDER:` rather than `PLACEHOLDER —`: the em dash is banned in written prose from
  // Phase 2 on, and a marker that fails the spec it is meant to sit inside is a confusing signal.
  // The marker itself is load-bearing for Guardrail 1 and stays.
  const prefix = `PLACEHOLDER: ${event.friendly_name}. `;
  const paragraphs = [`${prefix}${paragraph(next, 3, prefix.length)}`];
  for (let i = 1; i < count; i++) {
    // 3-5 sentences: enough spread to show short and long paragraphs side by side. Each is capped
    // by what is left of the total budget, because the per-paragraph floor alone does not reach
    // MIN_TOTAL_CHARS on a two-paragraph entry and three can overrun MAX_TOTAL_CHARS.
    const suffix = ` (${event.category})`;
    const used = paragraphs.reduce((sum, p) => sum + p.length, 0);
    const remaining = count - i;
    // Clamped to the per-paragraph ceiling as well as the remaining total: with only two
    // paragraphs the whole leftover budget lands on the second one, which overran 450 by itself.
    const budget = Math.min(MAX_PARAGRAPH_CHARS, Math.floor((MAX_TOTAL_CHARS - used) / remaining));
    paragraphs.push(
      `${paragraph(next, 2 + Math.floor(next() * 3), suffix.length, budget)}${suffix}`
    );
  }

  // Top the last paragraph up if the entry came in under the floor.
  while (paragraphs.reduce((sum, p) => sum + p.length, 0) < MIN_TOTAL_CHARS) {
    const last = paragraphs.length - 1;
    const filler = FILLER[Math.floor(next() * FILLER.length)];
    const grown = `${paragraphs[last].replace(/\.?( \(\w[\w-]*\))?$/, '')}. ${filler}.`;
    if (grown.length > MAX_PARAGRAPH_CHARS) break;
    paragraphs[last] = grown;
  }
  // Flagged so the tooling can tell placeholder from written prose. `detail-report.js` counts a
  // flagged entry as still to do, which keeps the Phase 3 progress meter and worklist honest even
  // though the whole corpus is committed; `detail-apply.js` replaces the entry wholesale, so a
  // real entry drops the flag with no extra code. The runtime ignores it and reads `paragraphs`.
  return { placeholder: true, paragraphs };
}

function main() {
  const revert = process.argv.includes('--revert');
  let touched = 0;
  let kept = 0;

  for (const file of manifestFiles()) {
    const events = readEvents(file);
    const existing = readDetailShard(file);

    if (revert) {
      const kept_ = {};
      for (const [slug, entry] of Object.entries(existing)) {
        if (!entry || !entry.placeholder) kept_[slug] = entry;
      }
      for (const event of events) {
        if ('has_detail' in event && !kept_[event.name]) {
          delete event.has_detail;
          touched++;
        }
      }
      kept += Object.keys(kept_).length;
      if (Object.keys(kept_).length) writeDetailShard(file, kept_);
      else deleteDetailShard(file);
      writeEvents(file, events);
      continue;
    }

    const shard = {};
    for (const event of events) {
      const written = existing[event.name];
      if (written && !written.placeholder) {
        shard[event.name] = written;
        kept++;
      } else {
        shard[event.name] = placeholderFor(event);
        touched++;
      }
      event.has_detail = true;
    }
    writeDetailShard(file, shard);
    writeEvents(file, events);
  }

  console.log(
    revert
      ? `Reverted: ${touched} placeholder entr(ies) dropped; ${kept} written entr(ies) kept.`
      : `Filled ${touched} event(s) with placeholder prose; ${kept} already had written prose.`
  );
}

main();
