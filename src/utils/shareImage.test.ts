import { HEIGHT, shareCardLayout, shareGridLayout, WIDTH } from './shareImage';

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

/**
 * Where the blocks of the collage card go. The first collage card had fixed baselines, and a
 * collage that did not fill its box left two empty bands beside the paintings while the
 * wordmark and the URL sat against the edges. These pin what replaced it: fixed outer margins,
 * and one gap, the same three times, that takes up the slack.
 */
describe('shareCardLayout', () => {
  const MARGIN = 72;
  const SIDE = 76;
  const variants = [
    { hasEyebrow: true, hasRank: true },
    { hasEyebrow: true, hasRank: false },
    { hasEyebrow: false, hasRank: true },
    { hasEyebrow: false, hasRank: false },
  ];
  const everyCard = () =>
    variants.flatMap((variant) =>
      Array.from({ length: 59 }, (_, i) => ({
        input: { tileCount: i + 2, ...variant },
        layout: shareCardLayout({ tileCount: i + 2, ...variant }),
      }))
    );

  it('stacks header, collage, score, rank and URL in that order', () => {
    for (const { layout } of everyCard()) {
      const order = [
        layout.wordmarkY,
        layout.eyebrowY ?? layout.wordmarkY,
        layout.collageTop,
        layout.collageBottom,
        layout.scoreY,
        layout.rankY ?? layout.scoreY,
        layout.urlY,
      ];
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });

  it('keeps the outer margins whatever the game length', () => {
    for (const { layout } of everyCard()) {
      // The wordmark's ink starts at the top margin; the URL's ends at the bottom one.
      expect(layout.wordmarkY - 72).toBeCloseTo(MARGIN, 5);
      expect(HEIGHT - layout.urlY).toBeGreaterThanOrEqual(MARGIN);
      for (const cell of layout.grid.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(SIDE - 0.01);
        expect(cell.x + layout.grid.tileWidth).toBeLessThanOrEqual(WIDTH - SIDE + 0.01);
      }
    }
  });

  it('never squeezes a gap below the minimum, however full the collage', () => {
    for (const { layout } of everyCard()) {
      expect(layout.gap).toBeGreaterThanOrEqual(56 - 0.01);
    }
  });

  it('puts the collage exactly one gap below the header and one above the score', () => {
    for (const { input, layout } of everyCard()) {
      const headerBottom = input.hasEyebrow ? (layout.eyebrowY as number) : layout.wordmarkY;
      expect(layout.collageTop - headerBottom).toBeCloseTo(layout.gap, 5);
      // The score's ink reaches 116px above its baseline.
      expect(layout.scoreY - 116 - layout.collageBottom).toBeCloseTo(layout.gap, 5);
      const first = layout.grid.cells[0];
      const last = layout.grid.cells[layout.grid.cells.length - 1];
      expect(first.y).toBeCloseTo(layout.collageTop, 5);
      expect(last.y + layout.grid.tileHeight).toBeCloseTo(layout.collageBottom, 5);
    }
  });

  it("shares a short collage's spare height between the gaps", () => {
    const base = { hasEyebrow: true, hasRank: true };
    // Fifteen cards fill the box; seventeen leave some of it unused.
    const full = shareCardLayout({ tileCount: 15, ...base });
    const short = shareCardLayout({ tileCount: 17, ...base });
    const height = (l: typeof full) => l.collageBottom - l.collageTop;
    expect(height(short)).toBeLessThan(height(full));
    expect(short.gap).toBeGreaterThan(full.gap);
    // All of the difference, and nothing else, went into the three gaps.
    expect(3 * (short.gap - full.gap)).toBeCloseTo(height(full) - height(short), 5);
  });

  it('keeps the rank with the score and the URL apart from both', () => {
    const { scoreY, rankY, urlY } = shareCardLayout({
      tileCount: 17,
      hasEyebrow: true,
      hasRank: true,
    });
    expect((rankY as number) - scoreY).toBeLessThan(urlY - (rankY as number));
  });

  it('gives a card with no puzzle line or rank a taller collage', () => {
    const height = (l: ReturnType<typeof shareCardLayout>) => l.collageBottom - l.collageTop;
    const bare = shareCardLayout({ tileCount: 20, hasEyebrow: false, hasRank: false });
    const full = shareCardLayout({ tileCount: 20, hasEyebrow: true, hasRank: true });
    expect(height(bare)).toBeGreaterThan(height(full));
  });
});
