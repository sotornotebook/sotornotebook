import * as THREE from 'three';

/**
 * Wall outline with a door-arch notch cut out of the bottom edge
 * (a single simple polygon — avoids holes touching the outline).
 */
export function wallWithArch(w: number, h: number, doorW: number, springY: number, cx = 0) {
  const r = doorW / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(cx - r, 0);
  s.lineTo(cx - r, springY);
  s.absarc(cx, springY, r, Math.PI, 0, true);
  s.lineTo(cx + r, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  return s;
}

/** Solid arch (door leaf / panel) */
export function archSolid(w: number, springY: number) {
  const r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, springY);
  s.absarc(0, springY, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}

/** Arch frame: outer rect minus an arched opening, as a notch polygon. */
export function archFrame(outerW: number, outerH: number, innerW: number, springY: number) {
  return wallWithArch(outerW, outerH, innerW, springY);
}

export const extrude = (shape: THREE.Shape, depth: number, bevel = false) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 1,
    curveSegments: 14,
  });

/** Full Lalezar (Arabic + Latin) used by troika for all 3D signs. */
export const SIGN_FONT = '/fonts/Lalezar-Regular.ttf';
export const useSignFont = () => SIGN_FONT;
