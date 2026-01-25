import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  eventName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDialog({ eventName, onClose, onConfirm }: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <h2 className="text-lg font-semibold text-text">Delete Event</h2>
        </div>

        <p className="mb-2 text-sm text-text">
          Are you sure you want to delete <strong>"{eventName}"</strong>?
        </p>

        <p className="mb-6 text-sm text-text-secondary">
          The event will be moved to the deprecated events file and can be restored if needed.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded bg-error px-4 py-2 text-sm text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
