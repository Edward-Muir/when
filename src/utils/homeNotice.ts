/**
 * A one-line notice for the home screen to show as it appears, set by the screen being left.
 *
 * Module state rather than a prop: leaving a game on `/daily` or `/challenge/:code` navigates
 * to `/`, which unmounts that route's `App` and mounts another, so nothing in the component
 * tree survives the trip. It expires rather than being cleared by its reader, so a home screen
 * that mounts twice on the way (StrictMode, a route change) still shows it once.
 */
export type HomeNotice = 'saved';

const NOTICE_TTL_MS = 2500;

let pending: { notice: HomeNotice; at: number } | null = null;

export function setHomeNotice(notice: HomeNotice): void {
  pending = { notice, at: Date.now() };
}

export function readHomeNotice(): HomeNotice | null {
  if (!pending || Date.now() - pending.at > NOTICE_TTL_MS) return null;
  return pending.notice;
}

export function clearHomeNotice(): void {
  pending = null;
}
