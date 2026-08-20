import type { CuratedTheme, ThemeCalendar } from '../../lib/themes/schema';

export type { CuratedTheme };

/**
 * The curated-theme calendar: hand-authored pools of event slugs pinned to explicit dates.
 *
 * Fetched once at boot and held in a module-level cache, because `getDailyTheme` has to stay
 * SYNCHRONOUS. It is called from the recency chain (which replays 28 days of decks), the
 * reminder scheduler, the share text, the saved daily result and the in-game TopBar — none
 * of which can await, and several of which have no way to reach an async boundary at all.
 *
 * There is deliberately no bundled fallback copy. The calendar has exactly one home, so a
 * theme can never be half-published: either the client has it or the date falls through to
 * the seeded category theme, exactly as before curated themes existed. A client that has
 * loaded once keeps the calendar through the service worker's network-first cache, and one
 * that has never been online cannot submit a score anyway.
 */

const CALENDAR_URL = '/api/themes';

let byDate = new Map<string, CuratedTheme>();
let loaded = false;
let inflight: Promise<void> | null = null;

/**
 * The calendar is also a tiny store, because every read of it is synchronous while the fetch
 * that fills it is not. Populating the Map on its own tells React nothing, so a component
 * that computed a theme name before the fetch landed would hold the seeded fallback for the
 * lifetime of the session. `revision` is the change signal; see `useCuratedThemes`.
 *
 * It is a plain counter and not the data on purpose: `useSyncExternalStore` compares
 * snapshots with `Object.is`, and `getDailyTheme` allocates a fresh object per call, so
 * returning one would re-render forever.
 */
let revision = 0;
/** The document `version` currently indexed. -1 until the first successful load. */
let appliedVersion = -1;
const listeners = new Set<() => void>();

function bumpRevision(): void {
  revision += 1;
  // Iterate a copy: React unsubscribes from inside its own listener on unmount.
  for (const listener of [...listeners]) listener();
}

/** Subscribe to calendar changes. Returns the unsubscribe. */
export function subscribeCuratedThemes(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current change signal. Bumped once per calendar change, never per read. */
export function getCuratedThemesRevision(): number {
  return revision;
}

function indexCalendar(calendar: ThemeCalendar): Map<string, CuratedTheme> {
  const index = new Map<string, CuratedTheme>();
  for (const theme of calendar.themes ?? []) {
    for (const date of theme.dates ?? []) {
      // First writer wins. The publish endpoint rejects a date claimed twice, so this only
      // matters if a stored document predates that check.
      if (!index.has(date)) index.set(date, theme);
    }
  }
  return index;
}

/**
 * Fetch the calendar into the cache. Safe to call repeatedly — concurrent calls share one
 * request, and once loaded it is a no-op unless `force` is set.
 *
 * Never rejects: a failed load leaves the cache as it was and the day is simply not curated.
 */
export async function loadCuratedThemes(options: { force?: boolean } = {}): Promise<void> {
  if (loaded && !options.force) return;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch(CALENDAR_URL);
      if (!response.ok) throw new Error(`themes ${response.status}`);
      const calendar = (await response.json()) as ThemeCalendar;
      // `{ force: true }` runs on every resume and every visibility change, not just at
      // midnight — see ModeSelect's `useToday` callback. Publishing a revision each time
      // would re-render mode select and re-walk the recency chain for an identical answer,
      // so gate it on the document's own version, which `api/themes/publish.ts` increments
      // on every write. An unchanged refetch then costs nothing.
      const changed = !loaded || calendar.version !== appliedVersion;
      byDate = indexCalendar(calendar);
      appliedVersion = calendar.version;
      loaded = true;
      if (changed) bumpRevision();
    } catch (error) {
      console.warn('Failed to load curated themes; today falls back to a category theme', error);
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * The curated theme for a local `YYYY-MM-DD` date, or undefined for an ordinary day.
 *
 * Synchronous by design (see the module comment). Returns undefined before the first
 * successful load, which is why callers that decide a puzzle must gate on
 * `loadCuratedThemes()` first.
 */
export function getCuratedThemeForDate(dateString: string): CuratedTheme | undefined {
  return byDate.get(dateString);
}

/** Whether the calendar has been fetched. Gates the game's warm-start path. */
export function areCuratedThemesLoaded(): boolean {
  return loaded;
}

/** Test seam. */
export function __setCuratedThemesForTest(themes: CuratedTheme[] | null): void {
  byDate = themes ? indexCalendar({ version: 0, themes }) : new Map();
  loaded = themes !== null;
  // Unconditional, unlike the fetch path: tests set and clear the same fixture repeatedly and
  // every one of those is a real change to what the synchronous readers see. Resetting
  // `appliedVersion` keeps the next real load publishing whatever version it carries.
  appliedVersion = -1;
  bumpRevision();
}
