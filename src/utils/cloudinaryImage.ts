export type ImageVariant = 'thumbnail' | 'detail';

const UPLOAD_MARKER = '/image/upload/';

/**
 * Transform segment per variant. Widths are CSS pixels — `dpr_auto` multiplies
 * by device DPR, so do not pre-multiply for retina.
 *  - thumbnail: small + eco quality, covers timeline (~112px) and deck (~180px) cards
 *  - detail:    full-size source + good quality for the popout view (no width cap,
 *               matching the original baked transform — width-capping it visibly
 *               pixelates the larger image)
 */
const VARIANT_TRANSFORM: Record<ImageVariant, string> = {
  thumbnail: 'c_fill,dpr_auto,f_auto,g_auto,q_auto:eco,w_220',
  detail: 'c_fill,dpr_auto,f_auto,g_auto,q_auto:good',
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
