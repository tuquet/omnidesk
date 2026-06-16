import { Platform } from '@/lib/platform';

/**
 * Invisible resize handles for frameless Tauri windows.
 * Renders 8 hit-zones (4 edges + 4 corners) that mimic native Windows resize behavior.
 * Must be placed as a direct child of the root layout container (position: relative).
 */

const EDGE = 6;   // px – width of edge resize zones
const CORNER = 12; // px – size of corner resize zones

type ResizeDirection =
  | 'North' | 'South' | 'East' | 'West'
  | 'NorthEast' | 'NorthWest' | 'SouthEast' | 'SouthWest';

const zones: { direction: ResizeDirection; style: React.CSSProperties; cursor: string }[] = [
  // Edges
  { direction: 'North',  cursor: 'ns-resize',   style: { top: 0, left: CORNER, right: CORNER, height: EDGE } },
  { direction: 'South',  cursor: 'ns-resize',   style: { bottom: 0, left: CORNER, right: CORNER, height: EDGE } },
  { direction: 'West',   cursor: 'ew-resize',   style: { left: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  { direction: 'East',   cursor: 'ew-resize',   style: { right: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  // Corners
  { direction: 'NorthWest', cursor: 'nwse-resize', style: { top: 0, left: 0, width: CORNER, height: CORNER } },
  { direction: 'NorthEast', cursor: 'nesw-resize', style: { top: 0, right: 0, width: CORNER, height: CORNER } },
  { direction: 'SouthWest', cursor: 'nesw-resize', style: { bottom: 0, left: 0, width: CORNER, height: CORNER } },
  { direction: 'SouthEast', cursor: 'nwse-resize', style: { bottom: 0, right: 0, width: CORNER, height: CORNER } },
];

export function ResizeHandles() {
  if (!Platform.isDesktop) return null;

  return (
    <>
      {zones.map(({ direction, style, cursor }) => (
        <div
          key={direction}
          style={{
            position: 'absolute',
            zIndex: 9999,
            cursor,
            ...style,
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            Platform.startResizeDragging(direction);
          }}
        />
      ))}
    </>
  );
}
