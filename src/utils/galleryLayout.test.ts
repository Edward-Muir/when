import { galleryColumns, galleryGridHeight, MAX_GALLERY_COLUMNS } from './galleryLayout';

describe('galleryColumns', () => {
  it('uses at most two columns for a handful of tiles', () => {
    expect(galleryColumns(0)).toBe(1);
    expect(galleryColumns(1)).toBe(1);
    expect(galleryColumns(2)).toBe(2);
    expect(galleryColumns(4)).toBe(2);
  });

  it('never drops below three columns from five tiles up', () => {
    expect(galleryColumns(5)).toBe(3);
    expect(galleryColumns(6)).toBe(3);
    expect(galleryColumns(9)).toBe(3);
  });

  it('keeps the grid no taller than it is wide', () => {
    for (let count = 5; count <= MAX_GALLERY_COLUMNS * MAX_GALLERY_COLUMNS; count++) {
      const columns = galleryColumns(count);
      expect(Math.ceil(count / columns)).toBeLessThanOrEqual(columns);
    }
  });

  it('matches the sizes the screen was designed at', () => {
    expect(galleryColumns(20)).toBe(5);
    expect(galleryColumns(30)).toBe(6);
    expect(galleryColumns(34)).toBe(6);
    expect(galleryColumns(36)).toBe(6);
  });

  it('stops widening at the cap and grows downward', () => {
    expect(galleryColumns(65)).toBe(MAX_GALLERY_COLUMNS);
    expect(galleryColumns(200)).toBe(MAX_GALLERY_COLUMNS);
  });
});

describe('galleryColumns with a height to fit', () => {
  // A 375x667 phone: the popup is 90% of each, and the Daily's body takes about 384px of it.
  const short = { cardWidth: 337.5, maxGridHeight: 667 * 0.9 - 384 };
  // 402x874, the size the screen was designed at.
  const tall = { cardWidth: 361.8, maxGridHeight: 874 * 0.9 - 384 };

  it('leaves the square grid alone where it already fits', () => {
    for (const count of [6, 9, 20, 30, 36]) {
      expect(galleryColumns(count, tall)).toBe(galleryColumns(count));
    }
  });

  it('goes to more, smaller tiles on a short screen', () => {
    expect(galleryColumns(20, short)).toBeGreaterThan(galleryColumns(20));
    for (const count of [6, 9, 12, 20, 30, 36]) {
      const columns = galleryColumns(count, short);
      expect(galleryGridHeight(count, columns, short.cardWidth)).toBeLessThanOrEqual(
        short.maxGridHeight
      );
    }
  });

  it('gives up at the cap when nothing fits', () => {
    expect(galleryColumns(60, { cardWidth: 300, maxGridHeight: 40 })).toBe(MAX_GALLERY_COLUMNS);
  });
});
