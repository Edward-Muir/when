import React from 'react';
import { render, screen } from '@testing-library/react';
import Portrait from './Portrait';

describe('Portrait', () => {
  // Every surface draws art through this one <img>, and `portraitArtUrl` is the only URL seam.
  // The picker's 62 tiles and every board row must load lazily, so this pins the attributes
  // rather than trusting the next change to keep them.
  it('loads its art lazily and decodes off the main thread', () => {
    render(<Portrait animal="goldfish" size={44} />);

    // alt="" gives the art the presentation role; the tile is decorative, so it is hidden.

    const img = screen.getByRole('presentation', { hidden: true });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  // A smaller tile shows the middle of the painting at the larger size, not a shrunken whole.
  it('crops art painted at a larger size about the face, and not otherwise', () => {
    const { rerender } = render(<Portrait animal="goldfish" size={44} paintedAt={60} />);
    expect(screen.getByRole('presentation', { hidden: true })).toHaveStyle({
      transform: `scale(${60 / 44})`,
      transformOrigin: '50% 30%',
    });

    rerender(<Portrait animal="goldfish" size={60} paintedAt={60} />);
    expect(screen.getByRole('presentation', { hidden: true }).style.transform).toBe('');
  });
});
