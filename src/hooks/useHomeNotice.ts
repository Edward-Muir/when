import { useCallback, useState } from 'react';
import { clearHomeNotice, readHomeNotice } from '../utils/homeNotice';

/**
 * The toast the home screen opens with, if the screen before it left one (utils/homeNotice.ts):
 * "Saved" after leaving a Daily in progress.
 */
export function useHomeNotice(): { message: string; visible: boolean; close: () => void } {
  const [notice, setNotice] = useState(readHomeNotice);
  const close = useCallback(() => {
    clearHomeNotice();
    setNotice(null);
  }, []);
  return { message: notice === 'saved' ? 'Saved' : '', visible: notice !== null, close };
}
