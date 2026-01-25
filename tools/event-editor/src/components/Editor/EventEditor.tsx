import { Trash2, FolderInput, AlertTriangle } from 'lucide-react';
import type { HistoricalEvent, CategoryOrDeprecated } from '../../types';
import { EventNavigation } from '../Navigation/EventNavigation';
import { EventForm } from './EventForm';
import { EventPreview } from './EventPreview';
import { MetadataPanel } from './MetadataPanel';

interface EventEditorProps {
  event: HistoricalEvent;
  category: CategoryOrDeprecated;
  currentIndex: number;
  totalCount: number;
  onUpdate: (updates: Partial<HistoricalEvent>) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onDelete: () => void;
  onChangeCategory: () => void;
  metadata: {
    fetchingDimensions: boolean;
    dimensionsError: string | null;
    fetchDimensions: (url: string) => Promise<{ width: number; height: number } | null>;
    searchingWikipedia: boolean;
    wikiSearchResults: { title: string; description: string }[];
    wikiSearchError: string | null;
    searchWiki: (query: string) => Promise<void>;
    clearWikiSearch: () => void;
    fetchingPageviews: boolean;
    pageviewsError: string | null;
    fetchPageviews: (title: string) => Promise<{ views: number; url: string } | null>;
  };
  isDeprecated: boolean;
}

export function EventEditor({
  event,
  category,
  currentIndex,
  totalCount,
  onUpdate,
  onPrev,
  onNext,
  onJump,
  onDelete,
  onChangeCategory,
  metadata,
  isDeprecated,
}: EventEditorProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <EventNavigation
        currentIndex={currentIndex}
        totalCount={totalCount}
        onPrev={onPrev}
        onNext={onNext}
        onJump={onJump}
      />

      {isDeprecated && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          This event is deprecated and cannot be edited
        </div>
      )}

      <EventPreview event={event} />

      <div className="rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{event.friendly_name}</h2>
          <span className="rounded bg-bg-secondary px-2 py-1 text-xs font-medium text-text-secondary">
            {category}
          </span>
        </div>

        <EventForm event={event} onUpdate={onUpdate} isDeprecated={isDeprecated} />
      </div>

      <div className="mt-4">
        <MetadataPanel
          event={event}
          onUpdate={onUpdate}
          metadata={metadata}
          isDeprecated={isDeprecated}
        />
      </div>

      {!isDeprecated && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={onChangeCategory}
            className="flex items-center gap-2 rounded border border-border bg-white px-4 py-2 text-sm text-text transition-colors hover:bg-bg-secondary"
          >
            <FolderInput className="h-4 w-4" />
            Change Category
          </button>

          <button
            onClick={onDelete}
            className="flex items-center gap-2 rounded border border-error bg-white px-4 py-2 text-sm text-error transition-colors hover:bg-error hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete Event
          </button>
        </div>
      )}
    </div>
  );
}
