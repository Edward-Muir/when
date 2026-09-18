// The human-readable release history, as the app reads it.
//
// public/release-notes.json is hand-edited and served statically rather than bundled, for
// one reason: the What's New page has to show releases NEWER than the running bundle. A
// build-time import would freeze the history at whatever shipped with that build, so a
// player on an old version would never see what they are being offered.
//
// The format rules the file has to obey live in scripts/release-notes-lib.js and are
// enforced by scripts/check-release-notes.js at release time and by releaseNotes.test.ts
// in the suite. Nothing here validates: by the time the app reads the file it has already
// passed both gates, and a player is better served by rendering what is there.

export interface ReleaseEntry {
  /** Matches a CHANGELOG.md heading exactly. */
  version: string;
  /** ISO yyyy-mm-dd, taken from that same heading. */
  date: string;
  /** One short sentence per notable change. */
  notes: string[];
}

export interface ReleaseNotes {
  /** Notes are mandatory from this version on; older entries are optional backfill. */
  documentedFrom: string;
  /** Staged for the next release. Not shown in the app. */
  unreleased: string[];
  /** Newest first. */
  releases: ReleaseEntry[];
}

/** What public/version.json carries: the version being offered, and what is in it. */
export interface VersionManifest {
  version: string;
  date: string | null;
  notes: string[];
}

const isEntry = (value: unknown): value is ReleaseEntry => {
  const entry = value as ReleaseEntry;
  return (
    typeof entry?.version === 'string' &&
    typeof entry?.date === 'string' &&
    Array.isArray(entry?.notes) &&
    entry.notes.every((note) => typeof note === 'string')
  );
};

/**
 * Fetch the release history. Throws on a network error or an unusable payload, so callers
 * can tell "could not load" from "nothing to show" — an empty page with no explanation is
 * the one outcome worth avoiding here.
 */
export async function fetchReleaseNotes(signal?: AbortSignal): Promise<ReleaseEntry[]> {
  // Same no-store as useVersionCheck: a cached history is a history missing the release
  // the player just installed.
  const response = await fetch('/release-notes.json', { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`release-notes.json responded ${response.status}`);

  const data = (await response.json()) as Partial<ReleaseNotes>;
  if (!Array.isArray(data.releases)) throw new Error('release-notes.json has no releases');

  return data.releases.filter(isEntry).filter((entry) => entry.notes.length > 0);
}

/** "2026-09-17" -> "17 September 2026". Falls back to the raw string if it will not parse. */
export function formatReleaseDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
