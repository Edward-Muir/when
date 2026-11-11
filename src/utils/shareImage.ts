import { HistoricalEvent } from '../types';
import { getImageUrl } from './cloudinaryImage';

/**
 * Renders the 4:5 card that gets attached to a share: the player's timeline as a collage of
 * its paintings, with the score under it.
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
 * ## The paintings, never their order
 *
 * The art is the player's timeline as a collage: every card they placed, plus the starting
 * card. This used to be the starting card alone, on the rule that a share must not show
 * placed cards. The rule that matters is narrower: a share must not show the **order**.
 * The Daily deals everyone the same cards, and so does a challenge link, so a grid in date
 * order would hand the answer to a friend who has not played yet.
 *
 * So the tiles arrive here already shuffled (`shareTiles` in `share.ts`), with a seed that
 * has nothing to do with the dates, and the missed cards are left out. What a viewer learns
 * is which paintings are in the deck, which is also what the first few cards of their own
 * game will show them. Do NOT draw the tiles in timeline order, add years or names to them,
 * or grey the missed ones in place: each of those is the answer.
 *
 * With fewer than two tiles there is no collage to make, and the card falls back to the
 * starting card alone, face up, as before. It is on the board before the first move.
 *
 * ## Cloudinary cost
 *
 * Collage tiles are fetched through `getImageUrl(url, 'thumbnail')`, the 400x400 rung the
 * board has already loaded. With two to four tiles one is drawn up to about 660px tall, a
 * soft upscale accepted for games that short; from five tiles up it is drawn at or below
 * its source size. The
 * single-card fallback uses `detail` (768x768), because it is drawn at 680px.
 *
 * Do not introduce a bespoke size for this surface. Cost scales as
 * `images touched x rungs x formats`, so a third rung is roughly 13,000 transformations
 * across the catalogue, about half a month's free-plan allowance. See
 * docs/cloudinary-cost-controls.md.
 *
 * One wrinkle: `crossOrigin = 'anonymous'` is required here (an untagged image taints
 * the canvas and `toBlob()` throws), and that is a different HTTP cache key from the
 * plain `<img>` tags the game uses. The service worker's image cache stores CORS copies of
 * the board's thumbnails, so a collage is normally drawn from cache. Without it, the worst
 * case is one re-fetch per tile of an already-derived asset: bandwidth, never a
 * transformation.
 */

/**
 * 4:5. Exported so `shareImage.test.ts` can pin the ratio — see the header for why
 * anything taller gets cropped in WhatsApp.
 */
export const WIDTH = 1080;
export const HEIGHT = 1350;

/**
 * Hero art. As a fraction of WIDTH this is what governs how big the art looks in chat.
 *
 * 640 -> 680 in 2026-08, paid for by dropping the seed card's year line: the vertical
 * budget is the only thing capping this, and that line was the slack. Still inside the
 * `detail` rung's 768px, so the art continues to downscale rather than upscale — going
 * past 768 would mint a new Cloudinary rung, which the header forbids.
 */
const CARD_SIZE = 680;

/**
 * Where the collage sits: 93% of the card's width, against the single card's 63%. That
 * fraction is the only thing that governs how big the art looks in a chat bubble.
 *
 * The box ends where the starting card's name used to be drawn. A collage has no one card
 * to name, and that line's height is what the art gained.
 */
const COLLAGE_BOX: ShareBox = { x: 40, y: 198, width: 1000, height: 788 };
const COLLAGE_GAP = 8;
const COLLAGE_RADIUS = 18;
/** Below this there is nothing to arrange, and the card shows the starting card alone. */
const MIN_COLLAGE_TILES = 2;

/** Palette lifted from `src/index.css` (.dark) — the card is always dark. */
const INK = '#f4f1ec';
/** 0.78, not the 0.62 this started at: at ~16px on screen the dimmer value vanished. */
const INK_MUTED = 'rgba(244, 241, 236, 0.78)';
const FALLBACK_BASE = '#0d1b2a';

const DISPLAY_FONT = '"Playfair Display", Georgia, serif';
const BODY_FONT = 'Inter, system-ui, sans-serif';

export interface ShareCardSpec {
  /**
   * The pre-placed seed card. It colours the backdrop, and is the hero art when there is no
   * collage. Omit to render a typographic card.
   */
  event?: HistoricalEvent | null;
  /**
   * The timeline's cards for the collage, **already shuffled** (see the header: never in
   * date order). Fewer than two, or none, and the card shows `event` alone.
   */
  tiles?: HistoricalEvent[];
  /** Small line under the wordmark, e.g. "Daily #49 · Everything". Omitted for a
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

export interface ShareBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShareGrid {
  columns: number;
  rows: number;
  /** One tile's size. Not always square: see `shareGridLayout`. */
  tileWidth: number;
  tileHeight: number;
  /** Top-left corner of each tile, in the order the tiles were given. */
  cells: Array<{ x: number; y: number }>;
}

/**
 * The most a tile may depart from square, either way. The paintings are square, so a tile
 * this shape crops a quarter of one off; past it the crop starts losing the subject.
 */
const MAX_TILE_ASPECT = 4 / 3;

/**
 * Arrange `count` tiles in a box so the art covers as much of it as it can.
 *
 * Square tiles left the box half empty: fifteen of them are a 5 by 3 strip with a band of
 * nothing above and below, and how much of the card is art is the whole point of this
 * layout. So a tile takes its cell's shape, up to `MAX_TILE_ASPECT`, and fifteen become
 * five columns of portrait tiles that fill the box.
 *
 * Every column count is tried. The score is the tile's area, marked down for empty cells so
 * a full grid beats a slightly larger one with a stray tile on its last row (three tiles are
 * a row of three, not two over one). The grid is centred in the box, and a short last row is
 * centred under the others, which reads as intended where a left-aligned one reads as
 * unfinished.
 *
 * Pure, and exported, because the renderer itself cannot run under jsdom.
 */
export function shareGridLayout(
  count: number,
  box: ShareBox = COLLAGE_BOX,
  gap: number = COLLAGE_GAP
): ShareGrid {
  if (count <= 0) return { columns: 0, rows: 0, tileWidth: 0, tileHeight: 0, cells: [] };

  let best = { columns: 1, rows: count, tileWidth: 0, tileHeight: 0, score: -1 };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const cellWidth = (box.width - gap * (columns - 1)) / columns;
    const cellHeight = (box.height - gap * (rows - 1)) / rows;
    const tileWidth = Math.min(cellWidth, cellHeight * MAX_TILE_ASPECT);
    const tileHeight = Math.min(cellHeight, cellWidth * MAX_TILE_ASPECT);
    const filled = count / (columns * rows);
    const score = tileWidth * tileHeight * filled * filled;
    if (score > best.score) best = { columns, rows, tileWidth, tileHeight, score };
  }

  const { columns, rows, tileWidth, tileHeight } = best;
  const stepX = tileWidth + gap;
  const stepY = tileHeight + gap;
  const left = box.x + (box.width - (columns * stepX - gap)) / 2;
  const top = box.y + (box.height - (rows * stepY - gap)) / 2;
  const inLastRow = count - columns * (rows - 1);
  const lastRowInset = ((columns - inLastRow) * stepX) / 2;

  const cells = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / columns);
    return {
      x: left + (i % columns) * stepX + (row === rows - 1 ? lastRowInset : 0),
      y: top + row * stepY,
    };
  });
  return { columns, rows, tileWidth, tileHeight, cells };
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
  // A wide slot keeps the upper part of the painting, as the board's cards do
  // (`.card-art-fade`, 35%): faces and skylines sit above centre. A tall one is centred.
  const anchorY = w > h ? 0.35 : 0.5;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * anchorY, dw, dh);
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

/** Backdrop: the blurred art over the card's own dominant colour, darkened for the type. */
function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  art: HTMLImageElement | null,
  color: string | undefined
): void {
  ctx.fillStyle = color || FALLBACK_BASE;
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
}

/**
 * The wordmark and the line under it. The game is "When?" everywhere else; the mark keeps
 * its question mark. The collage card sets both smaller and higher, to give the art the
 * room.
 */
function drawHeader(ctx: CanvasRenderingContext2D, eyebrow: string | undefined, collage: boolean) {
  const mark = collage ? { y: 118, size: 104 } : { y: 150, size: 134 };
  const line = collage ? { y: 170, size: 38 } : { y: 204, size: 40 };
  fittedCenteredText(ctx, 'When?', mark.y, 900, '600', mark.size, DISPLAY_FONT, INK);
  if (eyebrow) {
    fittedCenteredText(
      ctx,
      eyebrow.toUpperCase(),
      line.y,
      940,
      '500',
      line.size,
      BODY_FONT,
      INK_MUTED
    );
  }
}

/** One painting in a rounded frame with a soft shadow: a collage tile, or the hero. */
function drawFramedArt(
  ctx: CanvasRenderingContext2D,
  art: HTMLImageElement | null,
  color: string | undefined,
  box: ShareBox,
  radius: number,
  shadow: { blur: number; offsetY: number }
): void {
  const { x, y, width, height } = box;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetY = shadow.offsetY;
  roundedRect(ctx, x, y, width, height, radius);
  // What shows if the art never arrives: the card's own colour, not a hole.
  ctx.fillStyle = color || '#1b2838';
  ctx.fill();
  ctx.restore();

  if (art) {
    ctx.save();
    roundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
    drawCover(ctx, art, x, y, width, height);
    ctx.restore();
  }
  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = 'rgba(244, 241, 236, 0.22)';
  ctx.lineWidth = Math.max(1.5, Math.min(3, width / 120));
  ctx.stroke();
  ctx.restore();
}

/** The single-card layout: the seed event, face up, with its name under it. */
function drawHero(
  ctx: CanvasRenderingContext2D,
  event: HistoricalEvent | null | undefined,
  art: HTMLImageElement | null
): void {
  const box = { x: (WIDTH - CARD_SIZE) / 2, y: 238, width: CARD_SIZE, height: CARD_SIZE };
  drawFramedArt(ctx, art, event?.color, box, 48, { blur: 60, offsetY: 24 });

  // Seed card caption — safe to name, it is on the board before the first move.
  // 42px floor: the longest names in the catalogue (35 chars) settle around 46px, so
  // the floor is headroom rather than something reached in practice.
  //
  // The year is deliberately absent. Printing it would make the share completely
  // legible: score, rank, event, year, link — a recipient could read the whole thing and
  // would have no reason to ask about any of it.
  // Withholding it is the one lever this card has on Wordle's actual mechanism, where a
  // grid you cannot decode is what makes someone ask what the game is. The in-game seed
  // card still shows its year; only this render omits it.
  if (event) {
    fittedCenteredText(ctx, event.friendly_name, 986, 900, '600', 58, DISPLAY_FONT, INK, 42);
  }
}

/** The collage layout: every tile a framed painting, in the order given. No names, no years. */
function drawCollage(
  ctx: CanvasRenderingContext2D,
  tiles: HistoricalEvent[],
  art: Array<HTMLImageElement | null>
): void {
  const { tileWidth, tileHeight, cells } = shareGridLayout(tiles.length);
  const radius = Math.min(COLLAGE_RADIUS, Math.min(tileWidth, tileHeight) / 8);
  cells.forEach((cell, i) => {
    drawFramedArt(
      ctx,
      art.at(i) ?? null,
      tiles.at(i)?.color,
      { x: cell.x, y: cell.y, width: tileWidth, height: tileHeight },
      radius,
      { blur: 26, offsetY: 10 }
    );
  });
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

    const tiles = spec.tiles ?? [];
    const collage = tiles.length >= MIN_COLLAGE_TILES;
    // Either the collage's thumbnails or the hero's one `detail` image, never both.
    const load = (event: HistoricalEvent | null | undefined, variant: 'thumbnail' | 'detail') => {
      const url = getImageUrl(event?.image_url, variant);
      return url ? loadImage(url) : Promise.resolve(null);
    };
    const [tileArt, backdropArt] = await Promise.all([
      Promise.all(collage ? tiles.map((tile) => load(tile, 'thumbnail')) : []),
      load(spec.event ?? tiles.at(0), collage ? 'thumbnail' : 'detail'),
      ensureFonts(),
    ]);

    drawBackdrop(ctx, backdropArt, (spec.event ?? tiles.at(0))?.color);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    drawHeader(ctx, spec.eyebrow, collage);
    if (collage) drawCollage(ctx, tiles, tileArt);
    else drawHero(ctx, spec.event, backdropArt);

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
