import { HistoricalEvent } from '../types';
import { isCloudinaryImage } from './cloudinaryImage';
import { shuffleArraySeeded } from './gameLogic';

/** Number of events shown in the game-start intro animation. */
export const INTRO_EVENT_COUNT = 20;

/**
 * How many distinct catalogue images the intro animation is allowed to touch in a week.
 *
 * This is a hard cost control, not a tuning knob. The intro is decorative, but it used to
 * draw its 20 cards uniformly at random from all 5,291 events on every entry to modeSelect
 * — so its ceiling was the whole catalogue, and each first-ever delivery URL mints a derived
 * asset (billed as a transformation, x3 formats on this account). Bounding the pool makes
 * the cost `POOL_SIZE x rungs x formats` per rotation — flat, and independent of traffic.
 * At 60/week that's ~783 transformations/month against a 25,000/month allowance.
 *
 * Keep it a multiple of INTRO_EVENT_COUNT: that's what makes same-day rotations disjoint,
 * so a player starting several games in a row never sees the same intro twice.
 *
 * See docs/cloudinary-cost-controls.md; guarded by introEvents.test.ts.
 */
export const INTRO_POOL_SIZE = 3 * INTRO_EVENT_COUNT;

const MS_PER_DAY = 86_400_000;
// Epoch day 0 (1970-01-01) was a Thursday, so shifting by 3 puts the week boundary on a
// Monday — the pool refreshes overnight Sunday rather than mid-week.
const MONDAY_OFFSET_DAYS = 3;

export interface IntroPickOptions {
  /** UTC YYYY-MM-DD. The weekly pool key is derived from this, never computed separately. */
  dateString: string;
  /** Monotonic counter; rotates to the next disjoint subset of the same day's ordering. */
  rotation?: number;
  count?: number;
  poolSize?: number;
  /** Event names to keep out of the intro — today's daily deck, so it can't spoil itself. */
  exclude?: ReadonlySet<string>;
}

/**
 * Monday-aligned week index for a UTC YYYY-MM-DD date. Deliberately not an ISO week number:
 * this is just a monotonic integer, so it has no year-boundary or week-numbering edge cases,
 * and it is derived from the same date string the daily subset uses so the two can never
 * disagree about which week a given day belongs to.
 */
function weekKeyFrom(dateString: string): string {
  const epochDay = Math.floor(Date.parse(`${dateString}T00:00:00Z`) / MS_PER_DAY);
  return String(Math.floor((epochDay + MONDAY_OFFSET_DAYS) / 7));
}

/**
 * This week's bounded pool: a deterministic slice of the catalogue that every player shares.
 * Only Cloudinary-backed events are eligible — a placeholder card would otherwise sit in the
 * pool for everyone for a whole week, and it would break the pool-size cost invariant.
 */
export function pickIntroPool(
  allEvents: HistoricalEvent[],
  weekKey: string,
  poolSize: number = INTRO_POOL_SIZE
): HistoricalEvent[] {
  const eligible = allEvents.filter((event) => isCloudinaryImage(event.image_url));
  return shuffleArraySeeded(eligible, `intro-pool-${weekKey}`).slice(0, poolSize);
}

/**
 * Pick the events for one intro animation, sorted by year so they read as a timeline.
 *
 * Deterministic given (allEvents, dateString, rotation): the week seeds the pool, the day
 * seeds the ordering within it, and `rotation` walks disjoint windows of that ordering so
 * consecutive games in a session get different cards without touching any new images.
 *
 * Seed prefixes are namespaced away from the bare YYYY-MM-DD used by buildDailyConfig and
 * getDailyTheme, so intro ordering is never correlated with the daily deck's.
 */
export function pickIntroEvents(
  allEvents: HistoricalEvent[],
  options: IntroPickOptions
): HistoricalEvent[] {
  const { dateString, rotation = 0, count = INTRO_EVENT_COUNT, poolSize, exclude } = options;

  const pool = pickIntroPool(allEvents, weekKeyFrom(dateString), poolSize);
  const ordered = shuffleArraySeeded(pool, `intro-day-${dateString}`);
  const eligible = exclude ? ordered.filter((event) => !exclude.has(event.name)) : ordered;

  if (eligible.length === 0) return [];

  const take = Math.min(count, eligible.length);
  const start = (((rotation * take) % eligible.length) + eligible.length) % eligible.length;
  const picked = Array.from({ length: take }, (_, i) => eligible[(start + i) % eligible.length]);

  return picked.sort((a, b) => a.year - b.year);
}
