import { HistoricalEvent } from '../types';
import { getImageUrl } from './cloudinaryImage';

/**
 * Renders the 4:5 card that gets attached to a share.
 *
 * Why an image at all: Instagram does not accept text or URL payloads from a share
 * sheet, so a text-only `navigator.share()` never lists it as a target. Attaching a
 * file is the only route to Instagram from the web, and it makes the WhatsApp/Messages
 * share considerably more eye-catching too.
 *
 * ## Why 4:5 and not 9:16
 *
 * This was 1080x1920 and **WhatsApp center-cropped it**, showing roughly a 1:1.41 slice
 * and eating ~200px from the top and bottom — which is exactly where the wordmark and
 * the URL sat. Losing the URL is the serious half: the files-only share tier drops the
 * message text entirely, so the burned-in URL is the only thing telling a viewer where
 * to play. 1080x1350 sits inside that threshold and is also the native max-portrait size
 * for an Instagram feed post. The cost is that a Story shows it centred with bars rather
 * than full-bleed; that is the accepted trade for never being cropped in chat, where most
 * sharing happens. A test pins the ratio.
 *
 * ## Sizing type for a chat bubble, not a phone screen
 *
 * The binding constraint is *width*, not height: a chat bubble is ~400 CSS px wide, so a
 * 1080px canvas renders at ~0.37x and a 34px label lands at ~12px on screen. Every size
 * below is chosen by dividing the intended on-screen size by 0.37. Do not judge them
 * against the full-size render — `/share-preview` has a 400px view for exactly this.
 * For the same reason the art's apparent size depends only on `CARD_SIZE / WIDTH`; making
 * the canvas shorter does nothing for it.
 *
 * ## The one card we are allowed to show
 *
 * The hero art is the **seed card** — the event already sitting on the timeline when
 * the game starts, and the same card the home screen shows as the daily preview. It is
 * therefore not a spoiler: it gives away nothing a recipient would not see on their own
 * first screen. Do NOT extend this to placed cards. Rendering the events a player
 * actually placed would leak the composition of that day's puzzle to everyone who sees
 * the story.
 *
 * ## Cloudinary cost
 *
 * The art is fetched through `getImageUrl(url, 'detail')` — the existing 768x768 rung,
 * **not** a new transform string. `detail` rather than `thumbnail` because the hero is
 * drawn at 660px on a 1080px canvas: the 400px thumbnail would be upscaled and visibly
 * soft, while 768 downscales cleanly.
 *
 * Do not introduce a bespoke size for this surface. Cost scales as
 * `images touched x rungs x formats`, so a third rung is roughly 13,000 transformations
 * across the catalogue — about half a month's free-plan allowance. Reusing an existing
 * rung keeps the marginal cost at, worst case, one derived asset per day (the daily seed
 * card is the same for every player, and is often already minted from someone tapping
 * it in-game). See docs/cloudinary-cost-controls.md.
 *
 * One wrinkle: `crossOrigin = 'anonymous'` is required here (an untagged image taints
 * the canvas and `toBlob()` throws), and that is a different HTTP cache key from the
 * plain `<img>` tags the game uses. Worst case that is one extra fetch of an
 * already-derived asset — bandwidth, never a transformation.
 */

/**
 * 4:5. Exported so `shareImage.test.ts` can pin the ratio — see the header for why
 * anything taller gets cropped in WhatsApp.
 */
export const WIDTH = 1080;
export const HEIGHT = 1350;

/** Hero art. As a fraction of WIDTH this is what governs how big the art looks in chat. */
const CARD_SIZE = 640;

/** Palette lifted from `src/index.css` (.dark) — the card is always dark. */
const INK = '#f4f1ec';
/** 0.78, not the 0.62 this started at: at ~16px on screen the dimmer value vanished. */
const INK_MUTED = 'rgba(244, 241, 236, 0.78)';
const ACCENT = '#d4a84b';
const FALLBACK_BASE = '#0d1b2a';

const DISPLAY_FONT = '"Playfair Display", Georgia, serif';
const BODY_FONT = 'Inter, system-ui, sans-serif';

export interface ShareCardSpec {
  /** The pre-placed seed card, used as hero art. Omit to render a typographic card. */
  event?: HistoricalEvent | null;
  /** Small line under the wordmark, e.g. "Daily · Aug 15 · Everything". Omitted for a
   *  non-daily game, which has no mode to name. */
  eyebrow?: string;
  /** The number that is the whole point, e.g. "11". */
  score: string;
  /** What the number counts, e.g. "events in my timeline". */
  scoreLabel: string;
  /** Optional secondary stat, e.g. "#47 globally". */
  detail?: string;
  /** Shown at the foot of the card. The file may travel without any text, so this is
   *  the only thing telling a viewer where to play — it is not optional in practice. */
  url: string;
}

/** Load an image without letting a slow or dead CDN block the share. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const settle = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    img.crossOrigin = 'anonymous';
    img.onload = () => settle(img);
    img.onerror = () => settle(null);
    img.src = src;
    // A share is a button press; nobody waits 10s for art.
    setTimeout(() => settle(null), 3500);
  });
}

/**
 * Ask for the webfonts at the sizes we draw. Canvas silently falls back to the generic
 * family if the face is not loaded yet, which on a cold PWA start means the card renders
 * in Times instead of Playfair.
 */
async function ensureFonts(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.load) return;
  try {
    await Promise.all([
      fonts.load(`600 200px ${DISPLAY_FONT}`),
      fonts.load(`600 64px ${DISPLAY_FONT}`),
      fonts.load(`600 34px ${BODY_FONT}`),
      fonts.load(`500 34px ${BODY_FONT}`),
    ]);
  } catch {
    // Fall through and draw with whatever is available.
  }
}

/** Rounded rect — `ctx.roundRect` is too new to rely on across the iOS versions we support. */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw `img` covering the box, cropping the overflow (canvas `object-fit: cover`). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/**
 * Blur by round-tripping through a tiny canvas. `ctx.filter` would be cleaner but only
 * landed in Safari 16.4, and this surface has to work on the older iOS versions the
 * Capacitor shell still sees.
 */
function drawBlurredBackdrop(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const tiny = document.createElement('canvas');
  tiny.width = 24;
  tiny.height = 24;
  const tinyCtx = tiny.getContext('2d');
  if (!tinyCtx) return;
  drawCover(tinyCtx, img, 0, 0, 24, 24);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tiny, 0, 0, WIDTH, HEIGHT);
}

/**
 * Shrink the font until the text fits on one line, then draw it centred.
 *
 * Everything on this card is single-line by design. The layout below uses fixed
 * baselines, so a second line anywhere would push into whatever sits underneath —
 * shrinking to fit keeps that impossible. Event names make it safe: they are capped at
 * 35 characters (`MAX_FRIENDLY_NAME_LENGTH`, enforced by `eventNameLength.test.ts`), and
 * even the longest still clears the `minSize` floor.
 */
function fittedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  weight: string,
  size: number,
  family: string,
  color: string,
  minSize = 16
): void {
  let fontSize = size;
  do {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > minSize);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, y);
}

/**
 * Draw the score and its unit as one centred group — a big numeral with a small word
 * beside it, the way a score is normally set. Measuring both and centring the pair is the
 * point: centring the numeral alone and hanging the label off it puts the group visibly
 * off-centre.
 *
 * They share a baseline. Playfair's old-style figures drop 3, 4, 5, 7 and 9 below it, so
 * the label ends up *beside* that descender rather than under it — which is why this reads
 * more comfortably than the stacked arrangement it replaces.
 */
function drawScoreWithUnit(
  ctx: CanvasRenderingContext2D,
  score: string,
  unit: string,
  y: number
): void {
  const GAP = 18;
  const scoreFont = `600 175px ${DISPLAY_FONT}`;
  const unitFont = `500 46px ${BODY_FONT}`;

  ctx.font = scoreFont;
  const scoreWidth = ctx.measureText(score).width;
  ctx.font = unitFont;
  const unitWidth = ctx.measureText(unit).width;

  const startX = (WIDTH - (scoreWidth + GAP + unitWidth)) / 2;

  ctx.textAlign = 'left';
  ctx.font = scoreFont;
  ctx.fillStyle = INK;
  ctx.fillText(score, startX, y);
  ctx.font = unitFont;
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(unit, startX + scoreWidth + GAP, y);

  // Everything else on the card is centred; leaving 'left' set would silently shift it.
  ctx.textAlign = 'center';
}

/**
 * Render the share card. Returns null if anything goes wrong — every caller must be able
 * to fall back to a plain text share rather than leaving the player with a dead button.
 */
export async function renderShareCard(spec: ShareCardSpec): Promise<Blob | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const artUrl = getImageUrl(spec.event?.image_url, 'detail');
    const art = artUrl ? await loadImage(artUrl) : null;
    await ensureFonts();

    // --- Backdrop: blurred hero art over the card's own dominant colour ---
    ctx.fillStyle = spec.event?.color || FALLBACK_BASE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (art) {
      ctx.globalAlpha = 0.85;
      drawBlurredBackdrop(ctx, art);
      ctx.globalAlpha = 1;
    }
    // Darken enough that the type is legible over any image, but not so much that the
    // backdrop stops reading as the card's own art — that colour wash is the whole draw.
    ctx.fillStyle = 'rgba(6, 14, 22, 0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const vignette = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    vignette.addColorStop(0, 'rgba(6, 14, 22, 0.62)');
    vignette.addColorStop(0.45, 'rgba(6, 14, 22, 0.12)');
    vignette.addColorStop(1, 'rgba(6, 14, 22, 0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // --- Header. The game is "When?" everywhere else; the mark keeps its question mark. ---
    fittedCenteredText(ctx, 'When?', 150, 900, '600', 134, DISPLAY_FONT, INK);
    if (spec.eyebrow) {
      fittedCenteredText(
        ctx,
        spec.eyebrow.toUpperCase(),
        204,
        940,
        '500',
        40,
        BODY_FONT,
        INK_MUTED
      );
    }

    // --- Hero card: the seed event, face up ---
    const cardSize = CARD_SIZE;
    const cardX = (WIDTH - cardSize) / 2;
    const cardY = 238;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    roundedRect(ctx, cardX, cardY, cardSize, cardSize, 48);
    ctx.fillStyle = spec.event?.color || '#1b2838';
    ctx.fill();
    ctx.restore();

    if (art) {
      ctx.save();
      roundedRect(ctx, cardX, cardY, cardSize, cardSize, 48);
      ctx.clip();
      drawCover(ctx, art, cardX, cardY, cardSize, cardSize);
      ctx.restore();
    }
    ctx.save();
    roundedRect(ctx, cardX, cardY, cardSize, cardSize, 48);
    ctx.strokeStyle = 'rgba(244, 241, 236, 0.22)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Seed card caption — safe to name, it is on the board before the first move.
    // 42px floor: the longest names in the catalogue (35 chars) settle around 46px, so
    // the floor is headroom rather than something reached in practice.
    if (spec.event) {
      fittedCenteredText(ctx, spec.event.friendly_name, 946, 900, '600', 58, DISPLAY_FONT, INK, 42);
      fittedCenteredText(ctx, formatYear(spec.event.year), 1000, 900, '500', 42, BODY_FONT, ACCENT);
    }

    // --- Score: numeral and unit as one group, rank on its own line beneath ---
    // Playfair Display sets old-style figures: 3, 4, 5, 7 and 9 drop well below the
    // baseline. At 175px that overshoot is ~37px, so anything sitting *under* the numeral
    // needs far more clearance than the cap height suggests — "11" looked fine at a tight
    // gap and "23" collided. Do not close this gap up when retuning.
    drawScoreWithUnit(ctx, spec.score, spec.scoreLabel, 1158);
    if (spec.detail) {
      fittedCenteredText(ctx, spec.detail, 1246, 940, '500', 44, BODY_FONT, INK_MUTED);
    }

    // --- Footer. No divider rule above it: decorative, and it cost 40px of a tight budget.
    // Full-strength ink and a clear gap above, against a muted stat line: at equal weight
    // the two ran together as one block, and this is the line that has to survive being
    // read off a phone screen.
    fittedCenteredText(ctx, spec.url, 1310, 900, '500', 48, BODY_FONT, INK);

    // JPEG, not PNG: the backdrop is photographic, so PNG runs to several MB and some
    // share targets choke on large payloads.
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  } catch {
    return null;
  }
}

/** "1969" / "44 BC" — matches how years read on the cards. */
function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : `${year}`;
}

/** Render the card and wrap it as a `File` ready for `navigator.share`. */
export async function renderShareFile(spec: ShareCardSpec, filename: string): Promise<File | null> {
  const blob = await renderShareCard(spec);
  if (!blob) return null;
  try {
    return new File([blob], filename, { type: 'image/jpeg' });
  } catch {
    // `File` constructor is unavailable on some older WebViews.
    return null;
  }
}
