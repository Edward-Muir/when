import { HEIGHT, shareGridLayout, WIDTH } from './shareImage';

/**
 * The renderer itself needs a real canvas, which jsdom does not provide — it is verified
 * visually through `/share-preview`. What is worth pinning here is the frame, because the
 * failure it guards against already shipped once and was invisible until someone posted a
 * card to WhatsApp.
 */
describe('share card dimensions', () => {
  /**
   * WhatsApp center-crops a chat image taller than roughly 1:1.41. At the original 9:16
   * that removed ~200px from the top and bottom — the "When?" wordmark and, more
   * seriously, the URL. The files-only share tier drops the message text, so that
   * burned-in URL is the only thing telling a viewer where to play.
   */
  it('stays inside the aspect ratio WhatsApp will show uncropped', () => {
    expect(HEIGHT / WIDTH).toBeLessThanOrEqual(1.41);
  });

  it('is 4:5, the native max-portrait size for an Instagram feed post', () => {
    expect(WIDTH / HEIGHT).toBeCloseTo(4 / 5, 5);
  });
});

/**
 * Where the collage's tiles go. The drawing cannot run here, but the arithmetic can, and it is
 * the part that decides whether the art fills the card or sits in a strip across the middle.
 */
describe('shareGridLayout', () => {
  const box = { x: 40, y: 198, width: 1000, height: 788 };
  const gap = 8;
  const layout = (count: number) => shareGridLayout(count, box, gap);

  it('is empty for no tiles', () => {
    expect(layout(0).cells).toEqual([]);
  });

  it('keeps every tile inside the box, one cell each, for any game length', () => {
    for (let count = 1; count <= 60; count++) {
      const { cells, tileWidth, tileHeight } = layout(count);
      expect(cells).toHaveLength(count);
      expect(new Set(cells.map((cell) => `${cell.x},${cell.y}`)).size).toBe(count);
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(box.x - 0.01);
        expect(cell.y).toBeGreaterThanOrEqual(box.y - 0.01);
        expect(cell.x + tileWidth).toBeLessThanOrEqual(box.x + box.width + 0.01);
        expect(cell.y + tileHeight).toBeLessThanOrEqual(box.y + box.height + 0.01);
      }
    }
  });

  it('never crops a painting past 4:3 either way', () => {
    for (let count = 1; count <= 60; count++) {
      const { tileWidth, tileHeight } = layout(count);
      const aspect = tileWidth / tileHeight;
      expect(aspect).toBeLessThanOrEqual(4 / 3 + 0.001);
      expect(aspect).toBeGreaterThanOrEqual(3 / 4 - 0.001);
    }
  });

  it('fills the whole box at the sizes a daily usually ends on', () => {
    for (const [count, columns, rows] of [
      [9, 3, 3],
      [15, 5, 3],
      [20, 5, 4],
      [36, 6, 6],
    ]) {
      const grid = layout(count);
      expect([grid.columns, grid.rows]).toEqual([columns, rows]);
      expect(grid.columns * grid.tileWidth + gap * (grid.columns - 1)).toBeCloseTo(box.width, 0);
      expect(grid.rows * grid.tileHeight + gap * (grid.rows - 1)).toBeCloseTo(box.height, 0);
    }
  });

  it('prefers a full row to a bigger grid with a stray tile', () => {
    const three = layout(3);
    expect([three.columns, three.rows]).toEqual([3, 1]);
  });

  it('centres a short last row under the others', () => {
    // Seven tiles: four over three.
    const { cells, columns, tileWidth } = layout(7);
    expect(columns).toBe(4);
    const step = tileWidth + gap;
    expect(cells[4].x - cells[0].x).toBeCloseTo(step / 2, 5);
    expect(cells[4].y).toBeGreaterThan(cells[0].y);
  });
});
