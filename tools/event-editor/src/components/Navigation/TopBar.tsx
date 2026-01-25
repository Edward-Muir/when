import { Save, X, Search, Loader2, AlertCircle } from 'lucide-react';

interface TopBarProps {
  hasUnsavedChanges: boolean;
  pendingChangesCount: number;
  onSave: () => void;
  onDiscard: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function TopBar({
  hasUnsavedChanges,
  pendingChangesCount,
  onSave,
  onDiscard,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
}: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-text">Event Editor</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isLoading}
            className="flex items-center gap-2 rounded bg-accent px-3 py-1.5 text-sm text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>

          <button
            onClick={onDiscard}
            disabled={!hasUnsavedChanges || isLoading}
            className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Discard
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-64 rounded border border-border bg-bg py-1.5 pl-9 pr-3 text-sm text-text placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {pendingChangesCount} unsaved change{pendingChangesCount !== 1 ? 's' : ''}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </header>
  );
}
