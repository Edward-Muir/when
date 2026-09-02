import React from 'react';
import { render, screen } from '@testing-library/react';
import ModePager from './ModePager';

const LABELS = ['Daily', 'Archive', 'Custom', 'Stats'];

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
    expect(screen.getByText('Stats')).toHaveClass('invisible');
  });

  it('opens on the requested page', () => {
    renderPager(3);
    expect(screen.getByText('Stats')).not.toHaveClass('invisible');
    expect(screen.getByText('Daily')).toHaveClass('invisible');
  });
});
