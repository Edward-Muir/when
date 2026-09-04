import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HintStrip from './HintStrip';

// jsdom has no matchMedia; framer's useReducedMotion reads it.
beforeEach(() => {
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

describe('HintStrip', () => {
  it('is an empty live region when there is nothing to say', () => {
    render(<HintStrip text={null} onDismiss={jest.fn()} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('can be an invitation: the body acts, the X dismisses', async () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    render(<HintStrip text="Tap for how to play" onSelect={onSelect} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tap for how to play' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss hint' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('announces the hint and dismisses on tap anywhere on the pill', async () => {
    const onDismiss = jest.fn();
    render(<HintStrip text="Drag the card" onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toHaveTextContent('Drag the card');
    await userEvent.click(screen.getByRole('button', { name: 'Drag the card' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
