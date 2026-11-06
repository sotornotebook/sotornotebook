// ---------------------------------------------------------------------------
// GLTF drop-in slots.
//
// Everything in the alley is built procedurally so the site works with zero
// downloads. To replace a piece with a real model:
//   1. put the file in /public/models   (e.g. /public/models/cat.glb)
//   2. set its path below               (e.g. cat: '/models/cat.glb')
// The model is loaded with drei's useGLTF (Draco-compressed files work too)
// and rendered in place of the procedural version.
// ---------------------------------------------------------------------------
export const MODELS: {
  cat: string | null;
  lantern: string | null;
  workshop: string | null;
  /** per product id: replaces the table display (book / bundle) */
  products: Record<string, string | null>;
} = {
  cat: null,
  lantern: null,
  workshop: null,
  products: {},
};
