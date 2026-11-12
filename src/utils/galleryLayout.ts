/** The widest the game-over gallery goes. Past this the tiles are too small to read as art. */
export const MAX_GALLERY_COLUMNS = 8;

/** The grid's own metrics, shared with `GameOverGallery`'s class names: `p-[3px] gap-[2px]`. */
const MAT_PX = 3;
const GAP_PX = 2;

/**
 * The room a grid has to fit in, where it must: the Daily's popup, which holds the submit form
 * under the grid and locks until it is used.
 */
export interface GalleryFit {
  /** The popup's width, which is the grid's. */
  cardWidth: number;
  /** The most height the grid may take. */
  maxGridHeight: number;
}

/** How tall a grid of `count` square tiles is at `columns` wide. */
export function galleryGridHeight(count: number, columns: number, cardWidth: number): number {
  const rows = Math.ceil(count / columns);
  const tile = (cardWidth - 2 * MAT_PX - GAP_PX * (columns - 1)) / columns;
  return 2 * MAT_PX + rows * tile + GAP_PX * Math.max(0, rows - 1);
}

function squareColumns(count: number): number {
  if (count <= 4) return Math.max(1, Math.min(2, count));
  return Math.min(MAX_GALLERY_COLUMNS, Math.max(3, Math.ceil(Math.sqrt(count))));
}

/**
 * How many columns the game-over gallery uses for `count` tiles (placed cards, tombstones and
 * the starting card).
 *
 * The square root, rounded up, so the grid is never taller than it is wide: 9 tiles make a
 * 3 by 3, 20 make five columns of four rows, 34 make six. Never fewer than three columns once
 * there are five tiles. A very long game stops at eight columns and grows downward, and the
 * popup scrolls.
 *
 * Given a `fit`, it widens past that until the grid is short enough. That is the Daily on a
 * short phone: at 375x667 the square grid pushes Submit to Leaderboard below the fold of a
 * popup the player cannot leave without it, so the grid goes to more, smaller tiles instead.
 */
export function galleryColumns(count: number, fit?: GalleryFit): number {
  const square = squareColumns(count);
  if (!fit) return square;
  for (let columns = square; columns < MAX_GALLERY_COLUMNS; columns++) {
    if (galleryGridHeight(count, columns, fit.cardWidth) <= fit.maxGridHeight) return columns;
  }
  return MAX_GALLERY_COLUMNS;
}
