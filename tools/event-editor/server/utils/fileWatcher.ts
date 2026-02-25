import fs from 'fs';
import type { Response } from 'express';
import { EVENTS_DIR } from './paths.js';

// --- SSE Client Management ---
const clients: Set<Response> = new Set();

export function addClient(res: Response): void {
  clients.add(res);
}

export function removeClient(res: Response): void {
  clients.delete(res);
}

function broadcast(data: { type: string; timestamp: number }): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

// --- Self-Write Suppression ---
// When the server writes a file (via the editor UI), we record a timestamp
// so we can ignore the subsequent fs.watch trigger.
let lastSelfWriteTimestamp = 0;
const SELF_WRITE_WINDOW_MS = 2000;

export function markSelfWrite(): void {
  lastSelfWriteTimestamp = Date.now();
}

function isSelfTriggered(): boolean {
  return Date.now() - lastSelfWriteTimestamp < SELF_WRITE_WINDOW_MS;
}

// --- Debounced File Watcher ---
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

export function startWatcher(): fs.FSWatcher {
  const watcher = fs.watch(EVENTS_DIR, { recursive: false }, (_eventType, filename) => {
    if (!filename) return;
    if (filename.startsWith('backups')) return;
    if (!filename.endsWith('.json')) return;

    if (isSelfTriggered()) return;

    // Debounce rapid changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      console.log(`[file-watcher] External change detected: ${filename}`);
      broadcast({ type: 'events-changed', timestamp: Date.now() });
    }, DEBOUNCE_MS);
  });

  console.log(`[file-watcher] Watching ${EVENTS_DIR} for changes`);
  return watcher;
}
