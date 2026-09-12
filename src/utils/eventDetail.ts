import { getSourceFile } from './eventLoader';

/**
 * Loads the long-form "read more" prose for a single event.
 *
 * The prose lives in a sidecar under `public/events/detail/`, sharded to mirror the 19
 * manifest filenames exactly and keyed by slug. It is deliberately NOT part of the event
 * records: at full corpus it is roughly 2.4 MiB gzipped against a 0.49 MiB catalogue, and
 * `loadAllEvents` blocks the loading screen. Inlining it would make every cold start pay for
 * text most players never open, so a shard is fetched only when someone actually asks for it.
 *
 * Why mirror the source files rather than shard evenly: the biggest shard (`exploration.json`,
 * 1,040 events) will land around 375 KB gzipped once written, which is a real first-tap cost —
 * but it buys a layout where an authoring batch, a shard and a review unit are all the same
 * thing, and where the shard for a slug is derivable with no index file. After the first tap
 * the whole shard is warm, and the service worker already network-first caches `/events/*.json`.
 * If that first tap ever proves too slow, the escape hatch is to emit per-event files at build
 * time from the same authored shards — this module is the only thing that would change.
 */

/** One event's long-form entry, as stored in a sidecar shard. */
interface DetailEntry {
  paragraphs: string[];
}

type DetailShard = Record<string, DetailEntry | undefined>;

// Per-shard cache plus in-flight dedupe, mirroring `loadAllEvents`: a shard is static for the
// session, and two cards from the same file opened in quick succession must not fetch twice.
// Only successful loads are cached, so a failed fetch can be retried.
const shardCache = new Map<string, DetailShard>();
const inflight = new Map<string, Promise<DetailShard | null>>();

async function loadShard(file: string): Promise<DetailShard | null> {
  const cached = shardCache.get(file);
  if (cached) return cached;

  const existing = inflight.get(file);
  if (existing) return existing;

  const request = (async () => {
    try {
      const response = await fetch(`/events/detail/${file}`);
      // A missing shard is the normal state for a file nobody has written prose for yet, so
      // it is not worth a console warning — `has_detail` should have kept us from asking.
      if (!response.ok) return null;
      const shard: DetailShard = await response.json();
      shardCache.set(file, shard);
      return shard;
    } catch (error) {
      console.warn(`Error loading event detail shard ${file}:`, error);
      return null;
    } finally {
      inflight.delete(file);
    }
  })();

  inflight.set(file, request);
  return request;
}

/**
 * The paragraphs for an event, or null when there are none (or the fetch failed).
 * Never throws — the caller renders a retry row, same discipline as `submitCardReport`.
 */
export async function loadEventDetail(name: string): Promise<string[] | null> {
  const file = getSourceFile(name);
  if (!file) return null;

  const shard = await loadShard(file);
  // eslint-disable-next-line security/detect-object-injection -- slug key into a fetched data map
  const paragraphs = shard?.[name]?.paragraphs;
  return paragraphs && paragraphs.length > 0 ? paragraphs : null;
}

/**
 * The paragraphs for an event if its shard is already cached, else `undefined` for "don't know
 * yet". Lets the detail view re-open instantly once a shard is warm, instead of flashing a
 * skeleton for one tick every time the card is turned back over.
 */
export function peekEventDetail(name: string): string[] | null | undefined {
  const file = getSourceFile(name);
  if (!file) return null;

  const shard = shardCache.get(file);
  if (!shard) return undefined;

  // eslint-disable-next-line security/detect-object-injection -- slug key into a fetched data map
  const paragraphs = shard[name]?.paragraphs;
  return paragraphs && paragraphs.length > 0 ? paragraphs : null;
}

/** Test seam: drops every cached shard so a suite can control what the next fetch returns. */
export function resetEventDetailCache(): void {
  shardCache.clear();
  inflight.clear();
}
