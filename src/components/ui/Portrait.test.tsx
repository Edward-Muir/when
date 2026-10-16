import React from 'react';
import { render, screen } from '@testing-library/react';
import Portrait from './Portrait';

describe('Portrait', () => {
  // Every surface draws art through this one <img>, and `portraitArtUrl` is the only URL seam.
  // When the art moves to Cloudinary, the picker's 60 tiles and every board row must still load
  // lazily, so this pins the attributes rather than trusting the next change to keep them.
  it('loads its art lazily and decodes off the main thread', () => {
    render(<Portrait avatar={{ animal: 'goldfish', theme: 'mariner' }} size="md" labelled />);

    // alt="" gives the art the presentation role; the tile itself carries the name.
    const img = screen.getByRole('presentation');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('zooms the art about the face when cropped, and not otherwise', () => {
    const { rerender } = render(
      <Portrait avatar={{ animal: 'goldfish', theme: 'mariner' }} size="md" labelled crop={1.5} />
    );
    expect(screen.getByRole('presentation')).toHaveStyle({
      transform: 'scale(1.5)',
      transformOrigin: '50% 30%',
    });

    rerender(<Portrait avatar={{ animal: 'goldfish', theme: 'mariner' }} size="md" labelled />);
    expect(screen.getByRole('presentation').style.transform).toBe('');
  });
});
