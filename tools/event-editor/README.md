# Event Editor

An internal tool for managing historical events in the "When" timeline game.

## Features

- **Browse Events**: Navigate through events by category
- **Edit Events**: Update all event fields (name, year, description, difficulty, etc.)
- **Add Events**: Create new events in any category
- **Delete Events**: Move events to deprecated.json for safekeeping
- **Change Categories**: Move events between categories
- **Fetch Metadata**:
  - Fetch image dimensions from image URL
  - Search Wikipedia and fetch pageview data

## Getting Started

1. Install dependencies:

```bash
cd tools/event-editor
npm install
```

2. Start the development server:

```bash
npm run dev
```

This runs both the Express API server (port 3001) and the Vite dev server (port 5173).

3. Open http://localhost:5173 in your browser.

## Keyboard Shortcuts

- **Arrow Left/Up**: Previous event
- **Arrow Right/Down**: Next event
- **Ctrl/Cmd + S**: Save changes

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express server for JSON file I/O

The Express server reads and writes directly to `when/public/events/*.json` files.

## API Endpoints

### Events

- `GET /api/events` - Get all events from all categories
- `GET /api/events/:category` - Get events for a category
- `POST /api/events/:category` - Add new event
- `PUT /api/events/:category/:name` - Update event
- `DELETE /api/events/:category/:name` - Move event to deprecated.json
- `POST /api/events/:name/move` - Move event between categories

### Metadata

- `POST /api/metadata/image-dimensions` - Fetch image dimensions from URL
- `POST /api/metadata/wikipedia-search` - Search Wikipedia articles
- `POST /api/metadata/wikipedia-pageviews` - Get pageviews for an article

## File Structure

```
tools/event-editor/
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes/       # API route handlers
│   └── utils/        # File I/O and API utilities
├── src/              # React frontend
│   ├── components/   # UI components
│   ├── hooks/        # React hooks
│   ├── api/          # API client
│   └── types/        # TypeScript types
└── README.md
```

## Backups

When events are saved, automatic backups are created in `public/events/backups/`.
