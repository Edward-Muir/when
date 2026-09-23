/**
 * Guarded Web Storage access: the one place that talks to `localStorage` / `sessionStorage`.
 *
 * Storage can throw on any access — Safari private mode, a full quota, site data blocked by
 * the browser, or a sandboxed iframe where even reading `window.localStorage` throws — and
 * every stored value can be corrupt or from an older build. So nothing here ever throws:
 * a failed read returns the caller's fallback, and a failed write logs a warning and moves on.
 * Persisted state is a convenience, never something the game may crash over.
 */

export type StorageArea = 'local' | 'session';

// Resolved on every call, inside the callers' try: touching `window.localStorage` is itself
// what throws when storage is blocked.
function area(which: StorageArea): Storage {
  return which === 'session' ? window.sessionStorage : window.localStorage;
}

function areaName(which: StorageArea): string {
  return which === 'session' ? 'sessionStorage' : 'localStorage';
}

/** The raw string stored under `key`, or null when absent or unreadable. */
export function readString(key: string, which: StorageArea = 'local'): string | null {
  try {
    return area(which).getItem(key);
  } catch {
    return null;
  }
}

/**
 * Store a raw string. `what` names the value in the warning logged if the write fails,
 * e.g. `'display name'` → "Failed to save display name to localStorage".
 */
export function writeString(
  key: string,
  value: string,
  what: string,
  which: StorageArea = 'local'
): void {
  try {
    area(which).setItem(key, value);
  } catch {
    console.warn(`Failed to save ${what} to ${areaName(which)}`);
  }
}

/** Remove every key in `keys`; `what` names them in the warning logged on failure. */
export function removeKeys(keys: string[], what: string, which: StorageArea = 'local'): void {
  try {
    for (const key of keys) area(which).removeItem(key);
  } catch {
    console.warn(`Failed to clear ${what} from ${areaName(which)}`);
  }
}

/**
 * Parse the JSON stored under `key` and pass it through `normalize`, which validates the
 * shape and fills defaults (and may itself throw on a malformed record). Returns `fallback`
 * when the key is absent, unreadable, not JSON, or rejected by `normalize`. `normalize`
 * defaults to trusting the stored shape, which is only right for a value this build wrote.
 */
export function readJson<T>(
  key: string,
  fallback: T,
  normalize: (raw: unknown) => T = (raw) => raw as T,
  which: StorageArea = 'local'
): T {
  try {
    const stored = area(which).getItem(key);
    if (stored === null) return fallback;
    return normalize(JSON.parse(stored));
  } catch {
    return fallback;
  }
}

/** Store `value` as JSON; `what` names it in the warning logged if the write fails. */
export function writeJson(
  key: string,
  value: unknown,
  what: string,
  which: StorageArea = 'local'
): void {
  writeString(key, JSON.stringify(value), what, which);
}
