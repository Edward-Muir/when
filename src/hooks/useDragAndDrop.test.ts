import { insertionIndexFor } from './useDragAndDrop';

/** Year-label centres for a column of rows of the given heights, starting at `top`. */
function centres(heights: number[], top = 100): number[] {
  let y = top;
  return heights.map((h) => {
    const mid = y + h / 2;
    y += h;
    return mid;
  });
}

describe('insertionIndexFor', () => {
  it('is 0 on an empty board', () => {
    expect(insertionIndexFor(300, [])).toBe(0);
  });

  it('counts the rows centred above the pointer', () => {
    const pos = centres([88, 88, 88]); // 144, 232, 320
    expect(insertionIndexFor(100, pos)).toBe(0);
    expect(insertionIndexFor(200, pos)).toBe(1);
    expect(insertionIndexFor(300, pos)).toBe(2);
    expect(insertionIndexFor(400, pos)).toBe(3);
  });

  it('a tall row splits at its own middle and moves no other boundary in the gap order', () => {
    // Row 1 is the 184px reveal row: rows span 100-188, 188-372, 372-460.
    const pos = centres([88, 184, 88]); // 144, 280, 416
    expect(insertionIndexFor(190, pos)).toBe(1); // just inside the tall row's top: before it
    expect(insertionIndexFor(279, pos)).toBe(1);
    expect(insertionIndexFor(281, pos)).toBe(2); // past its middle: after it
    expect(insertionIndexFor(370, pos)).toBe(2); // just inside its bottom: still after it
    expect(insertionIndexFor(417, pos)).toBe(3);
  });

  it('gives every gap a non-empty band whichever row is tall', () => {
    for (let tall = 0; tall < 4; tall++) {
      const pos = centres([88, 88, 88, 88].map((h, i) => (i === tall ? 184 : h)));
      const hit = new Set<number>();
      for (let y = 0; y < 700; y++) hit.add(insertionIndexFor(y, pos));
      expect([...hit].sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });
});
