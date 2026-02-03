import { useState } from 'react';
import { ImageIcon, Search, Loader2, Check, X } from 'lucide-react';
import type { HistoricalEvent, WikiSearchResult } from '../../types';

interface MetadataPanelProps {
  event: HistoricalEvent;
  onUpdate: (updates: Partial<HistoricalEvent>) => void;
  metadata: {
    fetchingDimensions: boolean;
    dimensionsError: string | null;
    fetchDimensions: (url: string) => Promise<{ width: number; height: number } | null>;
    searchingWikipedia: boolean;
    wikiSearchResults: WikiSearchResult[];
    wikiSearchError: string | null;
    searchWiki: (query: string) => Promise<void>;
    clearWikiSearch: () => void;
    fetchingPageviews: boolean;
    pageviewsError: string | null;
    fetchPageviews: (title: string) => Promise<{ views: number; url: string } | null>;
  };
  isDeprecated: boolean;
}

export function MetadataPanel({ event, onUpdate, metadata, isDeprecated }: MetadataPanelProps) {
  const [showWikiSearch, setShowWikiSearch] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const handleFetchDimensions = async () => {
    if (!event.image_url) return;

    const dimensions = await metadata.fetchDimensions(event.image_url);
    if (dimensions) {
      onUpdate({
        image_width: dimensions.width,
        image_height: dimensions.height,
      });
    }
  };

  const handleSearchWikipedia = async () => {
    setShowWikiSearch(true);
    await metadata.searchWiki(event.friendly_name);
  };

  const handleSelectArticle = async (title: string) => {
    setSelectedArticle(title);
    const result = await metadata.fetchPageviews(title);
    if (result) {
      onUpdate({
        wikipedia_views: result.views,
        wikipedia_url: result.url,
      });
    }
    setShowWikiSearch(false);
    setSelectedArticle(null);
    metadata.clearWikiSearch();
  };

  const handleCloseWikiSearch = () => {
    setShowWikiSearch(false);
    setSelectedArticle(null);
    metadata.clearWikiSearch();
  };

  if (isDeprecated) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg p-4">
      <h3 className="font-medium text-text">Metadata</h3>

      {/* Fetch Image Dimensions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleFetchDimensions}
          disabled={!event.image_url || metadata.fetchingDimensions}
          className="flex items-center gap-2 rounded border border-border bg-white px-3 py-1.5 text-sm text-text transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {metadata.fetchingDimensions ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          Fetch Image Dimensions
        </button>
        {event.image_width && event.image_height && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" />
            {event.image_width} x {event.image_height}
          </span>
        )}
        {metadata.dimensionsError && (
          <span className="text-sm text-error">{metadata.dimensionsError}</span>
        )}
      </div>

      {/* Fetch Wikipedia Data */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSearchWikipedia}
            disabled={metadata.searchingWikipedia}
            className="flex items-center gap-2 rounded border border-border bg-white px-3 py-1.5 text-sm text-text transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {metadata.searchingWikipedia ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Fetch Wikipedia Data
          </button>
          {event.wikipedia_views !== undefined && (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" />
              {event.wikipedia_views.toLocaleString()} views/year
            </span>
          )}
        </div>

        {/* Wikipedia Search Results */}
        {showWikiSearch && (
          <div className="rounded border border-border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-text">
                Select Wikipedia article for "{event.friendly_name}"
              </span>
              <button
                onClick={handleCloseWikiSearch}
                className="text-text-secondary hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {metadata.searchingWikipedia && (
              <div className="flex items-center gap-2 py-2 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {metadata.wikiSearchError && (
              <div className="py-2 text-sm text-error">{metadata.wikiSearchError}</div>
            )}

            {!metadata.searchingWikipedia && metadata.wikiSearchResults.length === 0 && (
              <div className="py-2 text-sm text-text-secondary">No results found</div>
            )}

            {metadata.wikiSearchResults.length > 0 && (
              <div className="space-y-1">
                {metadata.wikiSearchResults.map((result) => (
                  <button
                    key={result.title}
                    onClick={() => handleSelectArticle(result.title)}
                    disabled={metadata.fetchingPageviews && selectedArticle === result.title}
                    className="block w-full rounded p-2 text-left transition-colors hover:bg-bg disabled:cursor-wait"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-text">
                      {metadata.fetchingPageviews && selectedArticle === result.title && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {result.title}
                    </div>
                    {result.description && (
                      <div className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                        {result.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {metadata.pageviewsError && (
              <div className="mt-2 text-sm text-error">{metadata.pageviewsError}</div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview */}
      {event.image_url && (
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Image Preview
          </label>
          <img
            src={event.image_url}
            alt={event.friendly_name}
            crossOrigin="anonymous"
            className="max-h-48 max-w-full rounded border border-border object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}
