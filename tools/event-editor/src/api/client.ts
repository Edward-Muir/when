import type {
  HistoricalEvent,
  EventsByCategory,
  Category,
  WikiSearchResult,
  ImageDimensions,
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Events API
export async function getAllEvents(): Promise<EventsByCategory> {
  return fetchJSON<EventsByCategory>(`${API_BASE}/events`);
}

export async function getEventsByCategory(category: string): Promise<HistoricalEvent[]> {
  return fetchJSON<HistoricalEvent[]>(`${API_BASE}/events/${category}`);
}

export async function createEvent(
  category: Category,
  event: HistoricalEvent
): Promise<HistoricalEvent> {
  return fetchJSON<HistoricalEvent>(`${API_BASE}/events/${category}`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateEvent(
  category: string,
  name: string,
  event: HistoricalEvent
): Promise<HistoricalEvent> {
  return fetchJSON<HistoricalEvent>(`${API_BASE}/events/${category}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(category: string, name: string): Promise<void> {
  await fetchJSON<void>(`${API_BASE}/events/${category}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export async function moveEvent(
  name: string,
  fromCategory: string,
  toCategory: Category
): Promise<void> {
  await fetchJSON<void>(`${API_BASE}/events/${encodeURIComponent(name)}/move`, {
    method: 'POST',
    body: JSON.stringify({ fromCategory, toCategory }),
  });
}

// Metadata API
export async function fetchImageDimensions(imageUrl: string): Promise<ImageDimensions | null> {
  try {
    return await fetchJSON<ImageDimensions>(`${API_BASE}/metadata/image-dimensions`, {
      method: 'POST',
      body: JSON.stringify({ url: imageUrl }),
    });
  } catch {
    return null;
  }
}

export async function searchWikipedia(query: string): Promise<WikiSearchResult[]> {
  return fetchJSON<WikiSearchResult[]>(`${API_BASE}/metadata/wikipedia-search`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function fetchWikipediaPageviews(
  articleTitle: string
): Promise<{ views: number; url: string } | null> {
  try {
    return await fetchJSON<{ views: number; url: string }>(
      `${API_BASE}/metadata/wikipedia-pageviews`,
      {
        method: 'POST',
        body: JSON.stringify({ title: articleTitle }),
      }
    );
  } catch {
    return null;
  }
}
