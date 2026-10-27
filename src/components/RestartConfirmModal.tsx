import Modal from './ui/Modal';

/**
 * The gate on the top bar's mid-game Restart. Same shape as Game's "Leave game?" confirm: a
 * restart throws the run away, and the button sits a thumb's width from Home and Menu.
 */
const RestartConfirmModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ open, onClose, onConfirm }) => (
  <Modal
    open={open}
    onDismiss={onClose}
    backdrop="scrim"
    widthClass="w-full max-w-sm"
    rounded="2xl"
    shadow="xl"
    bordered={false}
    cardClassName="p-6"
  >
    <h2 className="text-lg font-display text-text mb-2">Restart game?</h2>
    <p className="text-text-muted text-sm mb-6 font-body">
      You'll go back to the first card, and this run won't be saved.
    </p>
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-3 px-4 bg-border text-text rounded-xl font-medium transition-colors active:scale-95 font-body"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 py-3 px-4 bg-accent text-white rounded-xl font-medium transition-colors active:scale-95 font-body"
      >
        Restart
      </button>
    </div>
  </Modal>
);

export default RestartConfirmModal;
