const USER_AGENT = 'WhenGameEventEditor/1.0 (github.com/timeline/when)';

export interface WikiSearchResult {
  title: string;
  description: string;
}

/**
 * Search Wikipedia for articles matching a query
 */
export async function searchWikipedia(query: string): Promise<WikiSearchResult[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('srlimit', '5');

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.query?.search) {
      return data.query.search.map((r: { title: string; snippet: string }) => ({
        title: r.title,
        description: r.snippet.replace(/<[^>]*>/g, ''), // Strip HTML
      }));
    }

    return [];
  } catch (err) {
    console.error('Wikipedia search error:', err);
    return [];
  }
}

/**
 * Get total pageviews for a Wikipedia article over the last year
 */
export async function getPageviews(articleTitle: string): Promise<number | null> {
  const encodedTitle = encodeURIComponent(articleTitle.replace(/ /g, '_'));

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `en.wikipedia/all-access/user/${encodedTitle}/daily/` +
    `${formatDate(startDate)}/${formatDate(endDate)}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const totalViews = data.items?.reduce(
      (sum: number, item: { views: number }) => sum + item.views,
      0
    );

    return totalViews ?? null;
  } catch (err) {
    console.error('Pageview fetch error:', err);
    return null;
  }
}

/**
 * Generate Wikipedia URL from article title
 */
export function getWikipediaUrl(articleTitle: string): string {
  return `https://en.wikipedia.org/wiki/${articleTitle.replace(/ /g, '_')}`;
}
