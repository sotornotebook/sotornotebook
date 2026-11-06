import { categoryById, sortedCategories } from '../data/catalog';

// World layout. The alley runs along -Z. Camera height ~1.6m.
// Right side (+X) and left side (-X) facades sit at |x| = FACADE_X.

export const FACADE_X = 3.2;
export const BLOCK_DEPTH = 6; // along Z
export const SHOP_SPACING = 6;
export const FIRST_SHOP_Z = -6;
export const ENTRANCE_Z = 3;
export const START_Z = 12;
export const WORKSHOP_Z = -57.4;
export const END_Z = -49.5;
export const ALLEY_LEN = START_Z - WORKSHOP_Z + 4;

/** the walker stops this far before a shop so it is seen at an angle */
export const STOP_AHEAD = 3.4;

export type Side = 1 | -1; // 1 = right (+X), -1 = left (-X)

export interface ShopSlot {
  id: string;
  index: number;
  side: Side;
  z: number;
  /** scroll offset (0..1) at which the walker stands in front of this shop */
  offset: number;
}

const BUILDING_COLORS = ['#E8C9A0', '#D9A877', '#C98F6B', '#E4D3B5', '#B8846A', '#A9BFAF', '#D7B58A', '#CFA27E'];

/**
 * Scroll offset (0..1) where the walker is at depth `z`. The walk spline
 * (path.ts) runs almost straight down -Z and is arc-length parameterised,
 * so a linear map is accurate to a few centimetres — and keeps this file
 * free of three.js so the 2D UI/fallback don't pull it in.
 */
const offsetForZ = (z: number) => Math.min(1, Math.max(0, (START_Z - z) / (START_Z - END_Z)));

/** One shopfront per category, in catalogue order, on the side the category asks for. */
export const SHOPS: ShopSlot[] = sortedCategories().map((c, i) => {
  const z = FIRST_SHOP_Z - i * SHOP_SPACING;
  return { id: c.id, index: i, side: (c.side === 'right' ? 1 : -1) as Side, z, offset: offsetForZ(z + STOP_AHEAD) };
});

/** stop points for prev/next buttons: entrance, every shop, workshop */
export const STOPS = [0, ...SHOPS.map((s) => s.offset), 1];

export interface Block {
  side: Side;
  z: number; // centre
  height: number;
  color: string;
  shop: ShopSlot | null;
}

/** Row of buildings on each side, one per 6m, from the entrance to the workshop. */
export const BLOCKS: Block[] = (() => {
  const out: Block[] = [];
  let k = 0;
  for (const side of [1, -1] as Side[]) {
    for (let i = 0; i <= 9; i++) {
      const z = -i * BLOCK_DEPTH;
      const shop = SHOPS.find((s) => s.side === side && Math.abs(s.z - z) < 0.1) ?? null;
      const rnd = Math.sin((i + 1) * 12.9898 * (side + 3)) * 43758.5453;
      const r = rnd - Math.floor(rnd);
      out.push({
        side,
        z,
        height: 6.2 + Math.round(r * 3) * 1.3,
        // shop facades take their category's wall colour
        color: shop ? categoryById(shop.id)!.wallColor : BUILDING_COLORS[k++ % BUILDING_COLORS.length],
        shop,
      });
    }
  }
  return out;
})();

export interface WindowSpot {
  pos: [number, number, number];
  side: Side;
  lit: boolean;
}

/** Mashrabiya windows on every upper floor (instanced). */
export const WINDOWS: WindowSpot[] = (() => {
  const out: WindowSpot[] = [];
  let n = 0;
  for (const b of BLOCKS) {
    const floors = Math.max(1, Math.floor((b.height - 4.0) / 2.3));
    for (let f = 0; f < floors; f++) {
      for (const dz of [-1.5, 1.5]) {
        n++;
        out.push({
          pos: [b.side * (FACADE_X - 0.08), 5.0 + f * 2.3, b.z + dz],
          side: b.side,
          lit: (n * 7) % 5 !== 0,
        });
      }
    }
  }
  return out;
})();

/** Catenary string lights crossing the alley between buildings. */
export const STRINGS = Array.from({ length: 9 }, (_, i) => ({
  z: -3 - i * BLOCK_DEPTH,
  y: 5.4 + (i % 2) * 0.35,
  sag: 0.9 + (i % 3) * 0.15,
}));
