import { PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { PointerEvent, TouchEvent } from 'react';

/**
 * Check if an element or any of its ancestors has the data-no-dnd attribute.
 * If found, we should NOT handle this event for drag-and-drop.
 */
function shouldHandleEvent(element: HTMLElement | null): boolean {
  let cur = element;
  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

/**
 * Custom PointerSensor that respects data-no-dnd attribute.
 * Elements with data-no-dnd="true" (or any truthy value) will not trigger drag.
 */
export class JsonCvPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: PointerEvent) => {
        if (!event.isPrimary || event.button !== 0) {
          return false;
        }
        return shouldHandleEvent(event.target as HTMLElement);
      },
    },
  ];
}

/**
 * Custom TouchSensor that respects data-no-dnd attribute.
 * Elements with data-no-dnd="true" (or any truthy value) will not trigger drag.
 */
export class JsonCvTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: ({ nativeEvent: event }: TouchEvent) => {
        return shouldHandleEvent(event.target as HTMLElement);
      },
    },
  ];
}
