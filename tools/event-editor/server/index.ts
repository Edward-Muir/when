import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import metadataRouter from './routes/metadata.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/metadata', metadataRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Event Editor API running on http://localhost:${PORT}`);
  console.log(`Frontend should be running on http://localhost:5173`);
});
