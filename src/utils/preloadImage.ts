import { getImageUrl, ImageVariant } from './cloudinaryImage';

const requested = new Set<string>();

/** Fetch priority for the warm request. `'low'` keeps background warming from
 * competing on the wire with visible `<img>` tags. */
type PreloadPriority = 'low' | 'auto';

/**
 * Warm the browser cache for an image URL. Fire-and-forget and deduplicated, so
 * the same URL is only ever fetched once. No-op for falsy URLs or non-browser envs.
 */
export function preloadImage(url: string | undefined, priority: PreloadPriority = 'auto'): void {
  if (!url || typeof window === 'undefined' || requested.has(url)) return;
  requested.add(url);
  const img: HTMLImageElement & { fetchPriority?: string } = new Image();
  if (priority === 'low') img.fetchPriority = 'low';
  img.src = url;
}

/**
 * Warm a batch of event images for the given Cloudinary variants. Each event is
 * mapped through getImageUrl per variant, so thumbnail and detail warm
 * independently (distinct URLs → independent dedup). Used for look-ahead warming
 * (intro animation, game deck) and detail prefetch (achievements, QC).
 */
export function preloadEventImages(
  events: Array<{ image_url?: string } | undefined>,
  variants: ImageVariant[],
  priority: PreloadPriority = 'auto'
): void {
  for (const event of events) {
    if (!event) continue;
    for (const variant of variants) {
      preloadImage(getImageUrl(event.image_url, variant), priority);
    }
  }
}
