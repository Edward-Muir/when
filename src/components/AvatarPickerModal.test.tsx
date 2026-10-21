import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarPickerModal from './AvatarPickerModal';

const unlock = (unlocked: Record<string, string>) =>
  localStorage.setItem('when-achievements', JSON.stringify({ unlocked }));

// jsdom has no matchMedia, which the modal's motion reads. Stubbed per test because CRA's Jest
// config sets `resetMocks: true` (see Menu.test.tsx).
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('when-display-name', 'Linguistic Platypus');
  unlock({ 'cat-art': '2026-10-01' });
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

const grid = () => screen.getByRole('radiogroup', { name: 'Achievements' });
const labels = () =>
  within(grid())
    .getAllByRole('radio')
    .map((tile) => tile.getAttribute('aria-label'));

describe('AvatarPickerModal achievement portraits', () => {
  it('lists every achievement portrait and counts the unlocked ones', () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    expect(screen.getByText('· 1 of 60')).toBeInTheDocument();
    expect(within(grid()).getAllByRole('radio')).toHaveLength(60);
    expect(within(grid()).getByRole('radio', { name: 'Unicorn, locked' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('saves an unlocked portrait like any other pick', async () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    await userEvent.click(within(grid()).getByRole('radio', { name: /^Chameleon/ }));
    expect(localStorage.getItem('when-avatar')).toBe('chameleon');
  });

  it('previews a locked portrait with its unlock line, without saving it', async () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    await userEvent.click(within(grid()).getByRole('radio', { name: 'Unicorn, locked' }));

    expect(localStorage.getItem('when-avatar')).toBeNull();
    const preview = screen.getByTestId('locked-preview');
    expect(preview).toHaveTextContent('Unicorn');
    expect(preview).toHaveTextContent('Play 100 days in a row');

    // Any real pick clears the preview.
    await userEvent.click(screen.getByRole('radio', { name: 'Koala' }));
    expect(screen.queryByTestId('locked-preview')).toBeNull();
    expect(localStorage.getItem('when-avatar')).toBe('koala');
  });

  it('orders new, then the other unlocked, then every locked one', () => {
    unlock({ 'meta-categories': '2026-10-02', '27': '2026-10-01', '01': '2026-09-01' });
    localStorage.setItem('when-portraits-seen', JSON.stringify(['hatchling']));
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    expect(labels().slice(0, 4)).toEqual([
      'Unicorn, new',
      'Kitsune, new',
      'Hatchling',
      'Capybara, locked',
    ]);
    expect(
      labels()
        .slice(3)
        .every((label) => label?.endsWith(', locked'))
    ).toBe(true);
  });

  it('tags a new portrait for one visit only', () => {
    const { rerender } = render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    expect(within(grid()).getByRole('radio', { name: 'Chameleon, new' })).toHaveTextContent('New');
    expect(JSON.parse(localStorage.getItem('when-portraits-seen') ?? '[]')).toEqual(['chameleon']);

    rerender(<AvatarPickerModal open={false} onDismiss={jest.fn()} />);
    rerender(<AvatarPickerModal open onDismiss={jest.fn()} />);
    const tile = within(grid()).getByRole('radio', { name: 'Chameleon' });
    expect(tile).not.toHaveTextContent('New');
  });

  it('never tags a locked portrait as new', () => {
    render(<AvatarPickerModal open onDismiss={jest.fn()} />);
    expect(labels().filter((label) => label?.endsWith(', new'))).toEqual(['Chameleon, new']);
  });
});
