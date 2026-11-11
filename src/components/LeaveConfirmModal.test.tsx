import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaveConfirmModal from './LeaveConfirmModal';

const renderModal = (props: Partial<React.ComponentProps<typeof LeaveConfirmModal>> = {}) => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(<LeaveConfirmModal open onClose={onClose} onConfirm={onConfirm} {...props} />);
  return { onClose, onConfirm };
};

describe('LeaveConfirmModal', () => {
  it('offers Cancel and Leave, and no Restart unless the game has one', async () => {
    const { onClose, onConfirm } = renderModal();
    expect(screen.getByRole('heading', { name: 'Leave game?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restart/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('restarts from the prompt with no second confirm, and closes', async () => {
    const onRestart = jest.fn();
    const { onClose, onConfirm } = renderModal({ onRestart });
    await userEvent.click(screen.getByRole('button', { name: /restart instead/i }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('holds Restart while a placement animates', async () => {
    const onRestart = jest.fn();
    renderModal({ onRestart, restartDisabled: true });
    const restart = screen.getByRole('button', { name: /restart instead/i });
    expect(restart).toBeDisabled();
    await userEvent.click(restart);
    expect(onRestart).not.toHaveBeenCalled();
  });
});
