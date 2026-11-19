import { render, screen, fireEvent } from '@testing-library/react';
import GameHud from './GameHud';
import { resetThemeForTests, useTheme } from '../hooks/useTheme';

beforeAll(() => {
  // jsdom has no matchMedia; `useTheme` reads the system preference when nothing is stored.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  resetThemeForTests();
});

const OtherToggle = () => {
  const { isDark } = useTheme();
  return <span data-testid="other">{isDark ? 'dark' : 'light'}</span>;
};

describe('GameHud', () => {
  it('calls onHome from the Home button', () => {
    const onHome = jest.fn();
    render(<GameHud onHome={onHome} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go home' }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('switches between light and dark, and persists the choice', () => {
    render(<GameHud onHome={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('when-theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('when-theme')).toBe('light');
  });

  it('keeps every other reader of the theme in step', () => {
    render(
      <>
        <GameHud onHome={() => {}} />
        <OtherToggle />
      </>
    );
    expect(screen.getByTestId('other')).toHaveTextContent('light');
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(screen.getByTestId('other')).toHaveTextContent('dark');
  });
});
