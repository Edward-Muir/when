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
 * Source assets are square (1024x1024, some 2048x2048), so `c_fill` with only `w_`
 * scales without cropping and the framing matches what `dpr_auto` produced before.
 *  - thumbnail: ~2x the largest render slot (~180px deck card; timeline rows ~112px)
 *  - detail:    ~1.5x the 340x384 popup box in GamePopup. Capping this is the single
 *               biggest saving — it previously had no width at all, so `c_fill` was a
 *               no-op and Cloudinary shipped the full original (191KB-818KB per card).
 *
 * `f_auto` and `g_auto` must stay in the delivery URL: both are resolved per-request
 * at the CDN edge and are inert inside named transformations.
 */
const VARIANT_TRANSFORM: Record<ImageVariant, string> = {
  thumbnail: 'c_fill,f_auto,g_auto,q_auto:eco,w_360',
  detail: 'c_fill,f_auto,g_auto,q_auto:eco,w_512,h_578',
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
