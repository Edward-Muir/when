import { useRef } from 'react';

// Max gap (ms) between two taps on the same pill to count as a double-tap.
// 400ms matches macOS/Windows double-click defaults and sits just above
// WebKit's 350ms touch threshold. Safe to be generous since a single tap
// fires instantly (no debounce), so a wider window adds no input lag.
const DOUBLE_TAP_MS = 400;

/**
 * The filter pills' tap handling, shared by every Custom and Timeline group and the country
 * picker, so they all behave alike.
 *
 * Plotly-style. Single-tap toggles a pill INSTANTLY (no debounce, so it never feels laggy). A
 * second tap on the same pill within the window is a double-tap: the two toggles cancel out
 * (net no-op on that pill), so we isolate to just that pill — or restore all if it was already
 * the only one. We act on the state captured at the first tap (`before`), not the live prop, so
 * the result is correct regardless of re-render timing. Works on touch too.
 *
 * One ref per hook instance, so keys must be unique across every group that shares it.
 */
export function usePillTap() {
  const lastTap = useRef<{ key: string; time: number; before: unknown[] } | null>(null);

  return function handlePillTap<T>(
    item: T,
    key: string,
    selected: T[],
    all: T[],
    onChange: (next: T[]) => void,
    toggle: (item: T) => void
  ) {
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && prev.key === key && now - prev.time < DOUBLE_TAP_MS) {
      // Double-tap: undo the flicker and isolate/restore from the pre-tap state.
      lastTap.current = null;
      const before = prev.before as T[];
      const wasOnlyThis = before.length === 1 && before[0] === item;
      onChange(wasOnlyThis ? [...all] : [item]); // restore all ↔ isolate one
    } else {
      // First tap: toggle immediately and remember the state for a possible double.
      lastTap.current = { key, time: now, before: selected };
      toggle(item);
    }
  };
}
