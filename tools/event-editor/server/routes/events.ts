import { Router, Request, Response } from 'express';
import {
  readAllEvents,
  readEventFile,
  addEventToCategory,
  updateEventInCategory,
  removeEventFromCategory,
  deprecateEvent,
  findEventInCategory,
  moveEventBetweenCategories,
} from '../utils/fileIO.js';

const router = Router();

// GET /api/events - Get all events from all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await readAllEvents();
    res.json(events);
  } catch (err) {
    console.error('Error reading events:', err);
    res.status(500).json({ error: 'Failed to read events' });
  }
});

// GET /api/events/:category - Get events for a specific category
router.get('/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const filename = `${category}.json`;
    const events = await readEventFile(filename);
    res.json(events);
  } catch (err) {
    console.error('Error reading category:', err);
    res.status(500).json({ error: 'Failed to read category' });
  }
});

// POST /api/events/:category - Add new event to category
router.post('/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const event = req.body;

    // Validate required fields
    if (!event.name || !event.friendly_name || event.year === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Ensure category matches
    event.category = category;

    await addEventToCategory(category, event);
    res.json(event);
  } catch (err) {
    console.error('Error adding event:', err);
    const message = err instanceof Error ? err.message : 'Failed to add event';
    res.status(500).json({ error: message });
  }
});

// PUT /api/events/:category/:name - Update event
router.put('/:category/:name', async (req: Request, res: Response) => {
  try {
    const { category, name } = req.params;
    const event = req.body;

    await updateEventInCategory(category, name, event);
    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    const message = err instanceof Error ? err.message : 'Failed to update event';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/events/:category/:name - Move event to deprecated.json
router.delete('/:category/:name', async (req: Request, res: Response) => {
  try {
    const { category, name } = req.params;

    // Find the event first
    const event = await findEventInCategory(category, name);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Deprecate the event
    await deprecateEvent(event, category);

    // Remove from original category
    await removeEventFromCategory(category, name);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete event';
    res.status(500).json({ error: message });
  }
});

// POST /api/events/:name/move - Move event to different category
router.post('/:name/move', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { fromCategory, toCategory } = req.body;

    if (!fromCategory || !toCategory) {
      res.status(400).json({ error: 'Missing fromCategory or toCategory' });
      return;
    }

    await moveEventBetweenCategories(name, fromCategory, toCategory);
    res.json({ success: true });
  } catch (err) {
    console.error('Error moving event:', err);
    const message = err instanceof Error ? err.message : 'Failed to move event';
    res.status(500).json({ error: message });
  }
});

export default router;
