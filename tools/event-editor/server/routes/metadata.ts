import { Router, Request, Response } from 'express';
import { getImageDimensions } from '../utils/imageDimensions.js';
import { searchWikipedia, getPageviews, getWikipediaUrl } from '../utils/wikipediaApi.js';

const router = Router();

// POST /api/metadata/image-dimensions - Fetch image dimensions from URL
router.post('/image-dimensions', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'Missing URL' });
      return;
    }

    const dimensions = await getImageDimensions(url);

    if (!dimensions) {
      res.status(404).json({ error: 'Could not determine image dimensions' });
      return;
    }

    res.json(dimensions);
  } catch (err) {
    console.error('Error fetching image dimensions:', err);
    res.status(500).json({ error: 'Failed to fetch image dimensions' });
  }
});

// POST /api/metadata/wikipedia-search - Search Wikipedia for articles
router.post('/wikipedia-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

    const results = await searchWikipedia(query);
    res.json(results);
  } catch (err) {
    console.error('Error searching Wikipedia:', err);
    res.status(500).json({ error: 'Failed to search Wikipedia' });
  }
});

// POST /api/metadata/wikipedia-pageviews - Get pageviews for an article
router.post('/wikipedia-pageviews', async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Missing title' });
      return;
    }

    const views = await getPageviews(title);

    if (views === null) {
      res.status(404).json({ error: 'Could not fetch pageviews' });
      return;
    }

    res.json({
      views,
      url: getWikipediaUrl(title),
    });
  } catch (err) {
    console.error('Error fetching pageviews:', err);
    res.status(500).json({ error: 'Failed to fetch pageviews' });
  }
});

export default router;
