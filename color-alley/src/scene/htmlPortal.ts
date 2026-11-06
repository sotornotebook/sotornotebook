import type { MutableRefObject } from 'react';

/**
 * A fixed overlay <div> (same box as the canvas) that every drei <Html> portals into.
 * Without it, Html attaches to whatever element R3F events are connected to —
 * ScrollControls' scrolling div in the alley (so labels scroll away) or the
 * <canvas> itself after it unmounts (where children are never rendered).
 */
export const htmlPortal = { current: null } as unknown as MutableRefObject<HTMLElement>;

/** drei <Html> ignores camera.setViewOffset, so shift the overlay by the same amount. */
export function setPortalShift(x: number, y: number) {
  const el = htmlPortal.current;
  if (el) el.style.transform = x || y ? `translate(${-x}px, ${-y}px)` : '';
}
