import React from 'react';
import { render, screen } from '@testing-library/react';
import ModePager from './ModePager';

const LABELS = ['Daily', 'Archive', 'Custom', 'Stats', 'Timeline'];

const renderPager = (initialIndex?: number) =>
  render(
    <ModePager labels={LABELS} initialIndex={initialIndex}>
      {LABELS.map((label) => (
        <div key={label}>{label} page</div>
      ))}
    </ModePager>
  );

describe('ModePager initialIndex', () => {
  it('marks the first page active by default', () => {
    renderPager();
    expect(screen.getByText('Daily')).not.toHaveClass('invisible');
    expect(screen.getByText('Timeline')).toHaveClass('invisible');
  });

  it('opens on the requested page', () => {
    renderPager(4);
    expect(screen.getByText('Timeline')).not.toHaveClass('invisible');
    expect(screen.getByText('Daily')).toHaveClass('invisible');
  });
});
