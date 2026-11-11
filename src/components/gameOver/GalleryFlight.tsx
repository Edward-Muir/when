import React from 'react';
import { createPortal } from 'react-dom';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { HistoricalEvent } from '../../types';
import { FlightPath } from '../../hooks/useGalleryTravel';
import { getImageUrl } from '../../utils/cloudinaryImage';
import { Z_LAYERS } from '../ui/zLayers';

export type GalleryTileKind = 'placed' | 'seed' | 'missed';

export interface GalleryTile {
  event: HistoricalEvent;
  kind: GalleryTileKind;
}

/** How much of the flight is spent sending clones off, earliest card first. */
const STAGGER = 0.5;
/** What is left is how long each clone is in the air, as a share of the flight. */
const AIRTIME = 1 - STAGGER;
/** A clone from off screen is fully opaque by this point of its own journey. */
const FADE_IN_BY = 0.3;

/** The board crops its art to this anchor (`.card-art-fade`); a tile is centred. */
const BOARD_ANCHOR = 35;
const TILE_ANCHOR = 50;
const BOARD_RADIUS = 7;
const TILE_RADIUS = 3;
/** A tombstone's art on the board, and in the grid (`opacity-70` there, `opacity-60` here). */
const BOARD_GREY = 0.7;
const TILE_GREY = 0.6;

const mix = (from: number, to: number, t: number) => from + (to - from) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const unit = (value: number) => Math.max(0, Math.min(1, value));

interface FlightTileProps {
  tile: GalleryTile;
  path: FlightPath;
  /** When this clone leaves, as a share of the flight. */
  start: number;
  progress: MotionValue<number>;
  shiftY: MotionValue<number>;
}

/**
 * One card's painting on its way from the board to the grid.
 *
 * Every style is a `useTransform` of the one `progress` value, the idiom `HandDragOverlay`
 * uses for its square-to-landscape morph. framer-motion writes these itself, frame by frame,
 * so no opacity is handed to the browser's animation engine (the Android WebView flicker in
 * docs/mobile-ios/index.md).
 *
 * A card that was on screen starts as its art exactly as the board shows it: a wide slice
 * anchored above centre, fading to nothing on the right. It opens to the whole square as it
 * travels. A card that was off screen has no slot to open from, so it is a square from the
 * start and fades in.
 */
const FlightTile: React.FC<FlightTileProps> = ({ tile, path, start, progress, shiftY }) => {
  const { from, to, fromBoard } = path;
  const { event, kind } = tile;
  const missed = kind === 'missed';

  const t = useTransform(progress, (p) => easeInOut(unit((p - start) / AIRTIME)));
  const x = useTransform(t, (v) => mix(from.left, to.left, v));
  const y = useTransform<number, number>([t, shiftY], ([v, shift]) =>
    mix(from.top, to.top + shift, v)
  );
  const width = useTransform(t, (v) => mix(from.width, to.width, v));
  const height = useTransform(t, (v) => mix(from.height, to.height, v));
  const opacity = useTransform(t, (v) => (fromBoard ? 1 : unit(v / FADE_IN_BY)));
  const borderRadius = useTransform(t, (v) => mix(fromBoard ? BOARD_RADIUS : TILE_RADIUS, 3, v));
  const objectPosition = useTransform(
    t,
    (v) => `50% ${mix(fromBoard ? BOARD_ANCHOR : TILE_ANCHOR, TILE_ANCHOR, v)}%`
  );
  // The board's fade is `linear-gradient(90deg, #000 50%, transparent)`. Both stops slide
  // right until the whole painting is solid.
  const mask = useTransform(t, (v) =>
    fromBoard
      ? `linear-gradient(90deg, #000 ${50 + 50 * v}%, transparent ${100 + 70 * v}%)`
      : 'none'
  );
  const grey = useTransform(t, (v) => mix(fromBoard ? BOARD_GREY : TILE_GREY, TILE_GREY, v));
  const pip = useTransform(t, [0.7, 1], [0, 1]);

  const src = getImageUrl(event.image_url, 'thumbnail');

  return (
    <motion.div
      className="absolute left-0 top-0 overflow-hidden"
      style={{
        x,
        y,
        width,
        height,
        opacity,
        borderRadius,
        // Behind the fading edge of the art: the card's own colour, as on the board. A
        // tombstone is hollow there, so it gets the page.
        backgroundColor: missed ? 'var(--color-bg)' : (event.color ?? 'var(--color-surface)'),
      }}
    >
      {src && (
        <motion.img
          src={src}
          alt=""
          decoding="sync"
          className={`absolute inset-0 w-full h-full max-w-none object-cover ${missed ? 'grayscale' : ''}`}
          style={{
            objectPosition,
            WebkitMaskImage: mask,
            maskImage: mask,
            opacity: missed ? grey : undefined,
          }}
        />
      )}
      {kind === 'seed' && <motion.span className="gallery-pip" style={{ opacity: pip }} />}
    </motion.div>
  );
};

interface GalleryFlightProps {
  tiles: GalleryTile[];
  paths: FlightPath[];
  progress: MotionValue<number>;
  shiftY: MotionValue<number>;
}

/**
 * The game-over gallery's cards in flight. See `useGalleryTravel` for the why of each part.
 *
 * A body portal, like `TimelineMarker`: the Modal card clips its content, and the clones have
 * to cross from the board into it. It is not a popup. It takes no input, is owned by the
 * gallery, and is unmounted the moment the tiles land or the popup begins to close.
 */
const GalleryFlight: React.FC<GalleryFlightProps> = ({ tiles, paths, progress, shiftY }) => {
  if (typeof document === 'undefined' || paths.length !== tiles.length) return null;
  const last = Math.max(1, tiles.length - 1);

  return createPortal(
    <div
      aria-hidden
      data-testid="gallery-flight"
      className={`pointer-events-none fixed inset-0 overflow-hidden ${Z_LAYERS.flight}`}
    >
      {tiles.map((tile, i) => (
        <FlightTile
          key={tile.event.name}
          tile={tile}
          // eslint-disable-next-line security/detect-object-injection -- index from map()
          path={paths[i]}
          start={(STAGGER * i) / last}
          progress={progress}
          shiftY={shiftY}
        />
      ))}
    </div>,
    document.body
  );
};

export default GalleryFlight;
