import { render, screen, fireEvent } from '@testing-library/react';
import ThemeIntroPopup from './ThemeIntroPopup';
import { CuratedTheme } from '../utils/curatedThemes';

const theme: CuratedTheme = {
  id: 'mapmakers',
  name: 'Mapmakers',
  eventNames: [],
  dates: [],
  intro: {
    blurb: 'Maps, charts and surveys that changed how people pictured the world.',
    fact: 'One copy survives.',
  },
};

describe('ThemeIntroPopup', () => {
  it('shows the theme name, the blurb and the fact', () => {
    render(<ThemeIntroPopup intro={{ theme, open: true, dismiss: jest.fn() }} />);
    expect(screen.getByText('Mapmakers')).toBeInTheDocument();
    expect(screen.getByText(theme.intro!.blurb)).toBeInTheDocument();
    expect(screen.getByText('Did you know?')).toBeInTheDocument();
    expect(screen.getByText(theme.intro!.fact)).toBeInTheDocument();
  });

  it("dismisses from the Let's go button", () => {
    const dismiss = jest.fn();
    render(<ThemeIntroPopup intro={{ theme, open: true, dismiss }} />);
    fireEvent.click(screen.getByRole('button', { name: "Let's go" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    render(<ThemeIntroPopup intro={{ theme: undefined, open: false, dismiss: jest.fn() }} />);
    expect(screen.queryByText('Did you know?')).not.toBeInTheDocument();
  });
});
