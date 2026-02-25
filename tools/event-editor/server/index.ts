import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import metadataRouter from './routes/metadata.js';
import { startWatcher, addClient, removeClient } from './utils/fileWatcher.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SSE endpoint — must be registered before the events router
// so Express doesn't match it as GET /api/events/:category
app.get('/api/events/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write('data: {"type":"connected"}\n\n');

  addClient(res);

  // Keepalive every 30s to prevent proxy/browser timeout
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepalive);
    removeClient(res);
  });
});

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/metadata', metadataRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server and file watcher
const watcher = startWatcher();

app.listen(PORT, () => {
  console.log(`Event Editor API running on http://localhost:${PORT}`);
  console.log(`Frontend should be running on http://localhost:5173`);
});

// Graceful shutdown
process.on('SIGTERM', () => watcher.close());
process.on('SIGINT', () => watcher.close());
