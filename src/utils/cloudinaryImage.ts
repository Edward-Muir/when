export type ImageVariant = 'thumbnail' | 'detail';

const UPLOAD_MARKER = '/image/upload/';

/**
 * Transform segment per variant. Widths are *device* pixels and deliberately fixed:
 * `dpr_auto` used to multiply these by the device DPR, which both ballooned payloads
 * (a w_220 thumbnail cost 75KB on a DPR-3 phone vs 9.5KB at DPR 1) and minted a
 * separate derived asset per DPR — Cloudinary bills transformations when a derived
 * asset is *created*, so per-DPR fan-out is what drives the transformation count.
 * Fixed widths collapse that to one derived asset per variant per format.
 *
 * Both variants stay **square**, matching the (square) source assets, so each is a
 * faithful downscale and every consumer's CSS crops it exactly as it does today.
 * Do not box-crop these server-side: the same `detail` URL is also rendered
 * `object-contain` by the image-QC tool and inside a circle by AchievementCard, so a
 * popup-shaped crop would silently change what those surfaces show.
 *  - thumbnail: ~1.65x the largest card slot (180x243), more on 112px timeline rows
 *  - detail:    ~1.33x the 340x384 popup box in GamePopup. Capping this is the single
 *               biggest saving — it previously had no width at all, so `c_fill` was a
 *               no-op and Cloudinary shipped the full original (191KB-818KB per card).
 *
 * `f_auto` and `g_auto` must stay in the delivery URL: both are resolved per-request
 * at the CDN edge and are inert inside named transformations. Parameters are ordered
 * alphabetically to match Cloudinary's canonical form, so the string shown in the
 * console's transformation list is exactly the string to allow-list under Strict
 * Transformations.
 */
const VARIANT_TRANSFORM: Record<ImageVariant, string> = {
  thumbnail: 'c_fill,f_auto,g_auto,h_400,q_auto:eco,w_400',
  detail: 'c_fill,f_auto,g_auto,h_512,q_auto:eco,w_512',
};

/** Tokens that mark a URL path segment as a Cloudinary transformation. */
const TRANSFORM_TOKEN = /^(c_|q_|f_|w_|h_|g_|dpr_)/;

/**
 * True if the URL is a Cloudinary delivery URL (i.e. a custom game image),
 * as opposed to a legacy Wikimedia thumbnail or no image.
 */
export function isCloudinaryImage(url: string | undefined): url is string {
  return !!url && url.includes('res.cloudinary.com') && url.includes(UPLOAD_MARKER);
}

/**
 * Rewrite a Cloudinary delivery URL to a size/quality-optimized variant.
 * Non-Cloudinary URLs (e.g. Wikimedia thumbnails) and undefined pass through unchanged.
 */
export function getImageUrl(url: string | undefined, variant: ImageVariant): string | undefined {
  if (!isCloudinaryImage(url)) return url;

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  const left = url.slice(0, markerIndex);
  const rest = url.slice(markerIndex + UPLOAD_MARKER.length);

  // Drop an existing transform segment if present; otherwise keep the path intact.
  const slashIndex = rest.indexOf('/');
  const firstSegment = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
  const isTransform = firstSegment.includes(',') || TRANSFORM_TOKEN.test(firstSegment);
  const publicPath = isTransform && slashIndex !== -1 ? rest.slice(slashIndex + 1) : rest;

  // eslint-disable-next-line security/detect-object-injection
  const transform = VARIANT_TRANSFORM[variant];
  return `${left}${UPLOAD_MARKER}${transform}/${publicPath}`;
}
