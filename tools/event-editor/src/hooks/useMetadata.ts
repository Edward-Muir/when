import { useState, useCallback } from 'react';
import type { WikiSearchResult, ImageDimensions } from '../types';
import * as api from '../api/client';

interface UseMetadataReturn {
  // Image dimensions
  fetchingDimensions: boolean;
  dimensionsError: string | null;
  fetchDimensions: (imageUrl: string) => Promise<ImageDimensions | null>;

  // Wikipedia search
  searchingWikipedia: boolean;
  wikiSearchResults: WikiSearchResult[];
  wikiSearchError: string | null;
  searchWiki: (query: string) => Promise<void>;
  clearWikiSearch: () => void;

  // Wikipedia pageviews
  fetchingPageviews: boolean;
  pageviewsError: string | null;
  fetchPageviews: (articleTitle: string) => Promise<{ views: number; url: string } | null>;
}

export function useMetadata(): UseMetadataReturn {
  // Image dimensions state
  const [fetchingDimensions, setFetchingDimensions] = useState(false);
  const [dimensionsError, setDimensionsError] = useState<string | null>(null);

  // Wikipedia search state
  const [searchingWikipedia, setSearchingWikipedia] = useState(false);
  const [wikiSearchResults, setWikiSearchResults] = useState<WikiSearchResult[]>([]);
  const [wikiSearchError, setWikiSearchError] = useState<string | null>(null);

  // Wikipedia pageviews state
  const [fetchingPageviews, setFetchingPageviews] = useState(false);
  const [pageviewsError, setPageviewsError] = useState<string | null>(null);

  const fetchDimensions = useCallback(async (imageUrl: string): Promise<ImageDimensions | null> => {
    if (!imageUrl) return null;

    setFetchingDimensions(true);
    setDimensionsError(null);

    try {
      const result = await api.fetchImageDimensions(imageUrl);
      if (!result) {
        setDimensionsError('Could not fetch image dimensions');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dimensions';
      setDimensionsError(message);
      return null;
    } finally {
      setFetchingDimensions(false);
    }
  }, []);

  const searchWiki = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setWikiSearchResults([]);
      return;
    }

    setSearchingWikipedia(true);
    setWikiSearchError(null);

    try {
      const results = await api.searchWikipedia(query);
      setWikiSearchResults(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wikipedia search failed';
      setWikiSearchError(message);
      setWikiSearchResults([]);
    } finally {
      setSearchingWikipedia(false);
    }
  }, []);

  const clearWikiSearch = useCallback(() => {
    setWikiSearchResults([]);
    setWikiSearchError(null);
  }, []);

  const fetchPageviews = useCallback(
    async (articleTitle: string): Promise<{ views: number; url: string } | null> => {
      if (!articleTitle) return null;

      setFetchingPageviews(true);
      setPageviewsError(null);

      try {
        const result = await api.fetchWikipediaPageviews(articleTitle);
        if (!result) {
          setPageviewsError('Could not fetch pageviews');
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch pageviews';
        setPageviewsError(message);
        return null;
      } finally {
        setFetchingPageviews(false);
      }
    },
    []
  );

  return {
    fetchingDimensions,
    dimensionsError,
    fetchDimensions,
    searchingWikipedia,
    wikiSearchResults,
    wikiSearchError,
    searchWiki,
    clearWikiSearch,
    fetchingPageviews,
    pageviewsError,
    fetchPageviews,
  };
}
