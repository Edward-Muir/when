/* The dash is `aria-hidden` and carries no role, label or text — by design, it is decoration —
   so there is nothing for a Testing Library query to reach it by, and these assertions read the
   DOM directly. Same escape as TopBar.test.tsx's svg lookup. */
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render } from '@testing-library/react';
import TimelineTick from './TimelineTick';
import { TICK_H, TICK_W } from './tickLanding';

/** The painted dash, if this variant has one, and the footprint box that always exists. */
function renderTick(variant?: 'normal' | 'muted' | 'none') {
  const { container } = render(<TimelineTick variant={variant} />);
  return {
    box: container.querySelector('[data-tick]'),
    body: container.querySelector('[data-tick-body]'),
  };
}

describe('TimelineTick', () => {
  it('paints a dash for the variants that have one', () => {
    expect(renderTick().body).not.toBeNull();
    expect(renderTick('muted').body).not.toBeNull();
  });

  // The gap a drag is previewing draws `none`, so the only mark there is the travelling marker
  // and the dash's first appearance IS the landing (see TimelineTick, TimelineMarker).
  it('draws nothing for variant="none"', () => {
    expect(renderTick('none').body).toBeNull();
  });

  // The board's 96px gutter ENDS in this box, so it is load-bearing even when it paints nothing:
  // drop it with the dash and every ghost row's label jumps 12px right, into the rail. See the
  // BOARD COLUMN invariant in index.css.
  it('keeps the footprint even when it draws nothing', () => {
    const { box } = renderTick('none');
    // Tailwind's `w-3 h-1` — the same 12x4 the landing animates into.
    expect([TICK_W, TICK_H]).toEqual([12, 4]);
    expect(box?.className).toContain('w-3');
    expect(box?.className).toContain('h-1');
  });
});
