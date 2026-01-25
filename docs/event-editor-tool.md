# Event Editor Tool

An internal tool for managing historical events in the "When" timeline game.

## Location

`tools/event-editor/`

## Features

- **Browse Events**: Navigate through events by category with collapsible sidebar
- **Edit Events**: Update all event fields (name, year, description, difficulty, image, etc.)
- **Add Events**: Create new events in any category with validation
- **Delete Events**: Move events to `deprecated.json` for safekeeping (preserves original category)
- **Change Categories**: Move events between category files
- **Fetch Metadata**:
  - Fetch image dimensions (width/height) from image URL
  - Search Wikipedia and fetch yearly pageview counts

## Getting Started

```bash
cd tools/event-editor
npm install
npm run dev
```

This runs both:

- Express API server on port 3001
- Vite dev server on port 5173 (or next available)

Open the Vite URL in your browser.

## Keyboard Shortcuts

| Shortcut         | Action         |
| ---------------- | -------------- |
| Arrow Left/Up    | Previous event |
| Arrow Right/Down | Next event     |
| Ctrl/Cmd + S     | Save changes   |

## Architecture

### Frontend (React + Vite + Tailwind)

```
src/
├── App.tsx                 # Main app with state management
├── api/client.ts           # API client for server communication
├── hooks/
│   ├── useEvents.ts        # Event data, navigation, CRUD operations
│   └── useMetadata.ts      # Image dimensions & Wikipedia fetch
├── components/
│   ├── Navigation/
│   │   ├── TopBar.tsx      # Save/discard buttons, search, status
│   │   └── EventNavigation.tsx  # Prev/next/jump controls
│   ├── Sidebar/
│   │   └── Sidebar.tsx     # Category tree with event lists
│   ├── Editor/
│   │   ├── EventEditor.tsx # Main editor container
│   │   ├── EventForm.tsx   # All editable fields
│   │   └── MetadataPanel.tsx # Fetch buttons for dimensions/pageviews
│   └── Dialogs/
│       ├── AddEventDialog.tsx
│       ├── DeleteDialog.tsx
│       └── ChangeCategoryDialog.tsx
└── types/index.ts          # TypeScript types
```

### Backend (Express)

```
server/
├── index.ts               # Express entry point (port 3001)
├── routes/
│   ├── events.ts          # CRUD endpoints for events
│   └── metadata.ts        # Wikipedia/image fetch endpoints
└── utils/
    ├── fileIO.ts          # JSON read/write with automatic backups
    ├── imageDimensions.ts # Parse PNG, JPEG, GIF, WebP, SVG headers
    └── wikipediaApi.ts    # Wikipedia search and pageview API
```

## API Endpoints

### Events

| Method | Endpoint                      | Description                        |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/events`                 | Get all events from all categories |
| GET    | `/api/events/:category`       | Get events for a specific category |
| POST   | `/api/events/:category`       | Add new event to category          |
| PUT    | `/api/events/:category/:name` | Update event                       |
| DELETE | `/api/events/:category/:name` | Move event to deprecated.json      |
| POST   | `/api/events/:name/move`      | Move event between categories      |

### Metadata

| Method | Endpoint                            | Description                       |
| ------ | ----------------------------------- | --------------------------------- |
| POST   | `/api/metadata/image-dimensions`    | Fetch width/height from image URL |
| POST   | `/api/metadata/wikipedia-search`    | Search Wikipedia articles         |
| POST   | `/api/metadata/wikipedia-pageviews` | Get yearly pageviews for article  |

## Data Flow

### Editing Events

1. User edits a field in EventForm
2. Change stored in `pendingChanges` Map (dirty state)
3. "Unsaved changes" indicator appears in TopBar
4. User clicks Save → all pending changes sent to server
5. Server creates backup, writes updated JSON file

### Deleting Events

1. User clicks "Delete Event" → confirmation dialog
2. Server moves event to `deprecated.json` with metadata:
   ```json
   {
     ...originalEventFields,
     "_originalCategory": "cultural",
     "_deprecatedAt": "2026-01-25T12:00:00.000Z"
   }
   ```
3. Event removed from original category file

### Fetching Wikipedia Data

1. User clicks "Fetch Wikipedia Data"
2. Server searches Wikipedia for `friendly_name`
3. Top 5 results displayed for user to select
4. User selects article → server fetches yearly pageviews
5. `wikipedia_views` and `wikipedia_url` fields populated

## Backups

Automatic backups are created in `public/events/backups/` before each save:

- Format: `{category}.backup-{timestamp}.json`
- Example: `cultural.backup-1706183200000.json`

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Save] [Discard]     Search: [________]     Unsaved: 3        │
├─────────────────┬───────────────────────────────────────────────┤
│                 │  ← 42 of 301 →   [Jump: ___]                  │
│ 📁 conflict     │                                               │
│ 📁 cultural     │  Name: epic-gilgamesh (readonly)              │
│   > Epic of...  │  Friendly Name: [_________________________]   │
│   > Code of...  │  Year: [-2100____]                            │
│ 📁 diplomatic   │  Category: [cultural ▼]                       │
│ 📁 disasters    │  Difficulty: [hard ▼]                         │
│ 📁 exploration  │  Description: [___________________________]   │
│ 📁 infrastructure│                                              │
│ 📁 deprecated   │  Image URL: [____________________________]    │
│                 │  [Fetch Dimensions]  [Fetch Wikipedia]        │
│                 │                                               │
│                 │  [Delete Event] [Change Category]             │
└─────────────────┴───────────────────────────────────────────────┘
```

## Dependencies

### Runtime

- `react`, `react-dom` - UI framework
- `express`, `cors` - Backend server
- `lucide-react` - Icons

### Development

- `vite`, `@vitejs/plugin-react` - Build tooling
- `typescript` - Type checking
- `tailwindcss`, `postcss`, `autoprefixer` - Styling
- `tsx` - TypeScript execution for server
- `concurrently` - Run server and client together
