import React from 'react';
import { render, screen } from '@testing-library/react';
import FilterPill, { PillState } from './FilterPill';

const renderPill = (state: PillState, size: 'md' | 'sm' = 'md') =>
  render(
    <FilterPill state={state} size={size} onClick={jest.fn()}>
      Science
    </FilterPill>
  );

describe('FilterPill', () => {
  it.each([
    [true, 'lucide-check', 'true'],
    [false, 'lucide-x', 'false'],
    ['partial' as const, 'lucide-minus', 'mixed'],
  ])('shows state %s with its own icon', (state, icon, pressed) => {
    renderPill(state);
    expect(screen.getByTestId('pill-icon')).toHaveClass(icon);
    expect(screen.getByRole('button', { name: 'Science' })).toHaveAttribute(
      'aria-pressed',
      pressed
    );
  });

  /** The icon slot and padding never change, so a tap never resizes a chip or moves its label. */
  it.each(['md', 'sm'] as const)('keeps the same box in every state (%s)', (size) => {
    const states: PillState[] = [true, false, 'partial'];
    states.forEach((state) => renderPill(state, size));
    const boxClasses = screen.getAllByRole('button').map((button) =>
      button.className
        .split(/\s+/)
        .filter((c) => /^(p[xlr]?|py|gap|text-(xs|sm))-/.test(c))
        .join(' ')
    );
    expect(boxClasses).toHaveLength(3);
    expect(new Set(boxClasses).size).toBe(1);
    expect(screen.getAllByTestId('pill-icon')).toHaveLength(3);
  });
});
