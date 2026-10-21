import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarPickerModal from './AvatarPickerModal';

// jsdom has no matchMedia, which the modal's motion reads. Stubbed per test because CRA's Jest
// config sets `resetMocks: true` (see Menu.test.tsx).
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('when-display-name', 'Linguistic Platypus');
  localStorage.setItem(
    'when-achievements',
    JSON.stringify({ unlocked: { 'cat-art': '2026-10-01' } })
  );
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
});

const earnedGrid = () => screen.getByRole('radiogroup', { name: 'Earned' });

describe('AvatarPickerModal earned portraits', () => {
  it('lists every earned portrait and counts the unlocked ones', () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    expect(screen.getByText('· 1 of 60')).toBeInTheDocument();
    expect(within(earnedGrid()).getAllByRole('radio')).toHaveLength(60);
    expect(within(earnedGrid()).getByRole('radio', { name: 'Chameleon' })).toBeInTheDocument();
    expect(within(earnedGrid()).getByRole('radio', { name: 'Unicorn, locked' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('groups every locked portrait after the unlocked ones', () => {
    localStorage.setItem(
      'when-achievements',
      JSON.stringify({ unlocked: { 'meta-categories': '2026-10-02', '27': '2026-10-01' } })
    );
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    const labels = within(earnedGrid())
      .getAllByRole('radio')
      .map((tile) => tile.getAttribute('aria-label'));
    expect(labels.slice(0, 3)).toEqual(['Unicorn', 'Kitsune', 'Hatchling, locked']);
    expect(labels.slice(2).every((label) => label?.endsWith(', locked'))).toBe(true);
  });

  it('saves an unlocked portrait like any other pick', async () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    await userEvent.click(within(earnedGrid()).getByRole('radio', { name: 'Chameleon' }));
    expect(localStorage.getItem('when-avatar')).toBe('chameleon');
  });

  it('previews a locked portrait with its unlock line, without saving it', async () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    await userEvent.click(within(earnedGrid()).getByRole('radio', { name: 'Unicorn, locked' }));

    expect(localStorage.getItem('when-avatar')).toBeNull();
    const preview = screen.getByTestId('locked-preview');
    expect(preview).toHaveTextContent('Unicorn');
    expect(preview).toHaveTextContent('Play 100 days in a row');

    // Any real pick clears the preview.
    await userEvent.click(screen.getByRole('radio', { name: 'Koala' }));
    expect(screen.queryByTestId('locked-preview')).toBeNull();
    expect(localStorage.getItem('when-avatar')).toBe('koala');
  });
});
