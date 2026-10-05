import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Support from './Support';

describe('Support page', () => {
  it('describes the real rules and the three entry points', () => {
    render(
      <MemoryRouter>
        <Support />
      </MemoryRouter>
    );
    // Placement is binary: there is no "closer is better".
    expect(screen.queryByText(/closer your placement/i)).toBeNull();
    expect(screen.getByText(/your hand is one card smaller/)).toBeInTheDocument();
    expect(screen.getByText('Daily Challenge:')).toBeInTheDocument();
    expect(screen.getByText('Archive:')).toBeInTheDocument();
    expect(screen.getByText('Custom Game:')).toBeInTheDocument();
  });
});
