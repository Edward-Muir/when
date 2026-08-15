import { HistoricalEvent } from '../types';
import { getImageUrl } from './cloudinaryImage';

/**
 * Renders the 9:16 "story card" that gets attached to a share.
 *
 * Why an image at all: Instagram does not accept text or URL payloads from a share
 * sheet, so a text-only `navigator.share()` never lists it as a target. Attaching a
 * file is the only route to Instagram from the web, and it makes the WhatsApp/Messages
 * share considerably more eye-catching too.
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
 * The art is fetched through `getImageUrl(url, 'thumbnail')` — the existing 400x400
 * rung, no new transform string. For the daily that image was already minted and is
 * already in the service-worker image cache, so a share costs zero transformations and
 * ~zero bandwidth. Do not introduce a bespoke size for this surface: a third rung is
 * roughly 13,000 transformations across the catalogue. See docs/cloudinary-cost-controls.md.
 *
 * One wrinkle: `crossOrigin = 'anonymous'` is required here (an untagged image taints
 * the canvas and `toBlob()` throws), and that is a different HTTP cache key from the
 * plain `<img>` tags the game uses. Worst case that is one extra fetch of an
 * already-derived asset — bandwidth, never a transformation.
 */

/** Instagram/TikTok story canvas. */
const WIDTH = 1080;
const HEIGHT = 1920;

/** Palette lifted from `src/index.css` (.dark) — the card is always dark. */
const INK = '#f4f1ec';
const INK_MUTED = 'rgba(244, 241, 236, 0.62)';
const ACCENT = '#d4a84b';
const FALLBACK_BASE = '#0d1b2a';

const DISPLAY_FONT = '"Playfair Display", Georgia, serif';
const BODY_FONT = 'Inter, system-ui, sans-serif';

export interface ShareCardSpec {
  /** The pre-placed seed card, used as hero art. Omit to render a typographic card. */
  event?: HistoricalEvent | null;
  /** Small line above the wordmark, e.g. "Daily · Aug 15 · Everything". */
  eyebrow: string;
  /** The number that is the whole point, e.g. "11". */
  score: string;
  /** What the number counts, e.g. "events in my timeline". */
  scoreLabel: string;
  /** Optional secondary stats, e.g. "best run 4 · #47 globally". */
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

/** Shrink the font until the text fits, then draw it centred. */
function fittedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  weight: string,
  size: number,
  family: string,
  color: string
): void {
  let fontSize = size;
  do {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > 16);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, y);
}

/** Centred word wrap. Returns the y baseline after the last line. */
function wrappedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  let baseline = y;
  for (const entry of lines) {
    ctx.fillText(entry, WIDTH / 2, baseline);
    baseline += lineHeight;
  }
  return baseline;
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

    const artUrl = getImageUrl(spec.event?.image_url, 'thumbnail');
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

    // --- Header ---
    fittedCenteredText(ctx, 'When', 300, 900, '600', 132, DISPLAY_FONT, INK);
    ctx.font = `500 34px ${BODY_FONT}`;
    ctx.fillStyle = INK_MUTED;
    ctx.fillText(spec.eyebrow.toUpperCase(), WIDTH / 2, 372);

    // --- Hero card: the seed event, face up ---
    const cardSize = 560;
    const cardX = (WIDTH - cardSize) / 2;
    const cardY = 470;
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
    if (spec.event) {
      ctx.font = `600 46px ${DISPLAY_FONT}`;
      ctx.fillStyle = INK;
      const afterName = wrappedCenteredText(
        ctx,
        spec.event.friendly_name,
        cardY + cardSize + 84,
        820,
        58,
        2
      );
      ctx.font = `500 34px ${BODY_FONT}`;
      ctx.fillStyle = ACCENT;
      ctx.fillText(formatYear(spec.event.year), WIDTH / 2, afterName + 4);
    }

    // --- Score ---
    // Playfair Display sets old-style figures: 3, 4, 5, 7 and 9 drop well below the
    // baseline. At 210px that overshoot is ~45px, so the label needs far more clearance
    // than the cap height suggests — "11" looks fine at a tight gap and "23" collides.
    fittedCenteredText(ctx, spec.score, 1470, 900, '600', 210, DISPLAY_FONT, INK);
    fittedCenteredText(ctx, spec.scoreLabel, 1584, 900, '500', 38, BODY_FONT, INK);
    if (spec.detail) {
      fittedCenteredText(ctx, spec.detail, 1644, 900, '500', 32, BODY_FONT, INK_MUTED);
    }

    // --- Footer ---
    ctx.fillStyle = ACCENT;
    ctx.fillRect(WIDTH / 2 - 44, 1712, 88, 3);
    fittedCenteredText(ctx, spec.url, 1790, 900, '500', 36, BODY_FONT, INK);

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
