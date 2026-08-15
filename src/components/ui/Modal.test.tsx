import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

/**
 * The dismissal matrix is the part of `Modal` worth pinning: every popup picks one of these
 * four modes, and getting one wrong is silent — the popup still renders, it just becomes
 * escapable (or inescapable) in a way nobody notices until a player is stuck or skips a step.
 *
 * `canDismiss` in particular guards a real regression: the daily game-over popup must not be
 * dismissable until the leaderboard submit resolves, and ESC used to slip past that gate while
 * the backdrop was correctly blocked.
 */

const backdrop = () => screen.getByTestId('modal-backdrop');
const card = () => screen.getByTestId('modal-card');

/** Modal listens on `document`, so dispatch there rather than on a node. */
const pressEscape = () => fireEvent.keyDown(document, { key: 'Escape' });

const renderModal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => {
  const onDismiss = jest.fn();
  render(
    <Modal open onDismiss={onDismiss} {...props}>
      <p>body</p>
    </Modal>
  );
  return { onDismiss };
};

describe('Modal dismissal modes', () => {
  it("'backdrop' dismisses on the backdrop but not on the card", () => {
    const { onDismiss } = renderModal();

    userEvent.click(card());
    expect(onDismiss).not.toHaveBeenCalled();

    userEvent.click(backdrop());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("'tap-advance' dismisses on the card too", () => {
    const { onDismiss } = renderModal({ dismiss: 'tap-advance' });

    userEvent.click(card());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("'locked' ignores the card, the backdrop and ESC", () => {
    // The daily leaderboard gate. Backdrop and ESC are one decision here: gating only the
    // backdrop is how the popup ended up escapable by keyboard but not by tap.
    const { onDismiss } = renderModal({ dismiss: 'locked' });

    userEvent.click(card());
    userEvent.click(backdrop());
    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('Modal ESC handling', () => {
  it('dismisses on ESC in the default backdrop mode', () => {
    const { onDismiss } = renderModal();

    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on ESC in tap-advance mode', () => {
    const { onDismiss } = renderModal({ dismiss: 'tap-advance' });

    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not listen for ESC while closed', () => {
    const onDismiss = jest.fn();
    render(
      <Modal open={false} onDismiss={onDismiss}>
        <p>body</p>
      </Modal>
    );

    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });
});

describe('Modal shell composition', () => {
  it('renders a string header as a heading, and children below it', () => {
    render(
      <Modal open header="Timeline Stats">
        <p>body</p>
      </Modal>
    );
    expect(screen.getByRole('heading', { name: 'Timeline Stats' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('renders a node header as-is', () => {
    render(
      <Modal open header={<button>Close</button>}>
        <p>body</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('applies the layer, backdrop and size presets to the shell', () => {
    renderModal({ layer: 'reveal', backdrop: 'celebration', size: 'compact' });

    expect(backdrop()).toHaveClass('z-[60]', 'bg-black/40');
    expect(card()).toHaveClass('max-w-[320px]');
  });

  it('appends cardClassName without dropping the shell classes', () => {
    // ShareStepPopup relies on `relative` reaching the card so its toast stays anchored.
    renderModal({ cardClassName: 'relative px-5 py-6' });

    expect(card()).toHaveClass('relative', 'px-5', 'py-6', 'bg-surface');
  });

  it('scroll="card" caps the height and scrolls the whole card', () => {
    renderModal({ scroll: 'card' });
    expect(card()).toHaveClass('max-h-[90vh]', 'overflow-y-auto');
  });

  it('scroll="body" makes the card a flex column so content owns its scroll region', () => {
    renderModal({ scroll: 'body' });
    expect(card()).toHaveClass('max-h-[80vh]', 'flex', 'flex-col', 'overflow-hidden');
  });

  it('bordered={false} drops the border', () => {
    renderModal({ bordered: false });
    expect(card()).not.toHaveClass('border');
  });
});
