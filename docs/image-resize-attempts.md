# EventModal Image Resize - Attempted Solutions

## Goal

Make the EventModal image container dynamically resize based on the image's aspect ratio. Portrait images should get taller containers, landscape images shorter.

## Current State

The image container in EventModal.tsx is stuck at a fixed height (192px default). Despite multiple attempts, the dynamic resizing is not working.

## What Was Tried

### Attempt 1: Runtime onLoad Detection

**Approach**: Use `onLoad` event on the `<img>` to get `naturalWidth` and `naturalHeight`, then calculate and set container height.

```tsx
const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const containerWidth = 350;
  const calculatedHeight = containerWidth / aspectRatio;
  setImageHeight(Math.min(Math.max(calculatedHeight, 128), 384));
};
```

**Result**: Did not work. The `onLoad` event doesn't fire reliably, possibly due to browser caching.

### Attempt 2: useEffect for Cached Images

**Approach**: Add a `useEffect` to check if the image is already loaded (cached) when the component mounts, using `img.complete && img.naturalWidth`.

```tsx
useEffect(() => {
  const img = imageRef.current;
  if (img?.complete && img.naturalWidth) {
    calculateHeight(img);
  }
}, [event.image_url]);
```

**Result**: Did not work. The effect runs but the height still doesn't change visually.

### Attempt 3: Pre-stored Dimensions in JSON

**Approach**: Created a script (`scripts/fetch-image-dimensions.js`) to fetch all images and store their `image_width` and `image_height` in the event JSON files. Then calculate height directly from stored values.

**Changes made**:

1. Created `scripts/fetch-image-dimensions.js` - fetches dimensions from image URLs
2. Updated `src/types/index.ts` - added `image_width?: number` and `image_height?: number` to `HistoricalEvent`
3. Updated `src/components/EventModal.tsx` - simplified to calculate height from stored dimensions
4. Ran script - updated all event JSON files with dimensions (e.g., `"image_width": 330, "image_height": 341`)

**Current EventModal code**:

```tsx
const CONTAINER_WIDTH = 350;
const MIN_HEIGHT = 128;
const MAX_HEIGHT = 384;
const DEFAULT_HEIGHT = 192;

const getImageHeight = () => {
  if (!event.image_width || !event.image_height) return DEFAULT_HEIGHT;
  const aspectRatio = event.image_width / event.image_height;
  const calculatedHeight = CONTAINER_WIDTH / aspectRatio;
  return Math.min(Math.max(calculatedHeight, MIN_HEIGHT), MAX_HEIGHT);
};

const imageHeight = getImageHeight();

// In JSX:
<div
  className="w-full overflow-hidden bg-border/20"
  style={{ height: `${imageHeight}px` }}
>
```

**Result**: Still not working. The image shows but container height appears unchanged.

## Debugging Questions

1. Is `getImageHeight()` returning different values for different images?
2. Is the `style={{ height }}` actually being applied to the DOM?
3. Are the JSON files being loaded correctly with the new `image_width`/`image_height` fields?
4. Is there CSS somewhere overriding the inline style?
5. Is there a caching issue with the JSON files not being reloaded?

## Files Modified

- `src/components/EventModal.tsx` - The modal component
- `src/types/index.ts` - Added image dimension fields
- `scripts/fetch-image-dimensions.js` - Script to fetch dimensions
- `public/events/*.json` - Updated with image dimensions

## Example Event Data (after script ran)

```json
{
  "name": "thera-volcanic-eruption",
  "friendly_name": "Thera Volcanic Eruption",
  "year": -1600,
  "category": "disasters",
  "description": "A massive volcanic eruption devastated the Minoan civilization in the Aegean.",
  "difficulty": "hard",
  "image_url": "https://upload.wikimedia.org/...",
  "image_width": 330,
  "image_height": 341
}
```

For this image (330x341, roughly square), the expected height calculation:

- aspectRatio = 330/341 = 0.968
- calculatedHeight = 350/0.968 = 362px
- Clamped result = 362px (within 128-384 range)

The container should be 362px tall, but it's showing at what appears to be 192px.
