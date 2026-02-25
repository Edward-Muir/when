import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const EVENTS_DIR = path.resolve(__dirname, '../../../../public/events');
export const DEPRECATED_FILE = path.join(EVENTS_DIR, 'deprecated.json');
