import { useMemo } from 'react';
import * as THREE from 'three';
import type { Product } from '../data/catalog';
import { toon } from './materials';
import { MODELS } from '../data/models';
import { ModelSlot } from './ModelSlot';

// Shared geometries (one per shape for every product in the scene)
const GEO = {
  book: new THREE.BoxGeometry(0.42, 0.58, 0.045),
  box: new THREE.BoxGeometry(0.46, 0.34, 0.3),
  lid: new THREE.BoxGeometry(0.47, 0.03, 0.31),
  tin: new THREE.BoxGeometry(0.44, 0.3, 0.06),
  frame: new THREE.BoxGeometry(0.44, 0.6, 0.03),
  easel: new THREE.BoxGeometry(0.04, 0.42, 0.03),
  stick: new THREE.CylinderGeometry(0.011, 0.011, 0.26, 6),
};
const RAINBOW = ['#F06C5B', '#F2A93B', '#FFD84A', '#7BC86C', '#2BB3A3', '#3D7BD9', '#7A5CC9', '#E35DA0'];

const coverMatCache = new WeakMap<THREE.Texture, THREE.MeshStandardMaterial>();
function coverMaterial(tex?: THREE.Texture) {
  if (!tex) return null;
  let m = coverMatCache.get(tex);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.3, roughness: 0.7 });
    coverMatCache.set(tex, m);
  }
  return m;
}

/** Face order for boxes: [+x, -x, +y, -y, +z (front), -z] */
const faces = (side: THREE.Material, front: THREE.Material, top: THREE.Material = side) => [side, side, top, side, front, side];

interface Props {
  product: Product;
  /** cover texture (from useCoverAtlas); a plain colour is used until it's ready */
  cover?: THREE.Texture;
  /** stand the item on a little easel (tables) vs. upright on a shelf */
  easel?: boolean;
}

/**
 * A product as a 3D object, origin at the bottom centre, front facing +Z.
 * book → book with its cover · bundle → kraft box with a cover label ·
 * tool → pencil tin with label · gift → framed print / card.
 */
export function ProductModel({ product, cover, easel = true }: Props) {
  const custom = MODELS.products[product.id];
  const mats = useMemo(() => {
    const coverMat = coverMaterial(cover) ?? toon(product.accent);
    return {
      cover: coverMat,
      pages: toon('#FFF8EC', { key: 'pages' }),
      spine: toon(product.accent),
      kraft: toon('#C49A6C', { key: 'kraft' }),
      tin: toon('#9AA3B5', { key: 'tin' }),
      wood: toon('#6B4027', { key: 'easel' }),
    };
  }, [cover, product.accent]);

  if (custom) return <ModelSlot url={custom} />;

  const tilt = easel ? -0.2 : 0;

  if (product.type === 'book') {
    return (
      <group>
        <mesh geometry={GEO.book} material={faces(mats.pages, mats.cover).map((m, i) => (i === 1 || i === 5 ? mats.spine : m))} position={[0, 0.3, 0]} rotation-x={tilt} />
        {easel && <mesh geometry={GEO.easel} material={mats.wood} position={[0, 0.2, -0.12]} rotation-x={0.35} />}
      </group>
    );
  }

  if (product.type === 'bundle') {
    return (
      <group>
        <mesh geometry={GEO.box} material={faces(mats.kraft, mats.cover)} position={[0, 0.17, 0]} />
        <mesh geometry={GEO.lid} material={mats.kraft} position={[0, 0.355, 0]} />
        {/* string tie */}
        <mesh position={[0, 0.2, 0]} material={mats.pages}>
          <boxGeometry args={[0.03, 0.36, 0.305]} />
        </mesh>
        {/* pencils peeking out */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={GEO.stick} material={toon(RAINBOW[i * 2])} position={[-0.15 + i * 0.05, 0.42, -0.08]} rotation-z={(i - 1.5) * 0.12} />
        ))}
      </group>
    );
  }

  if (product.type === 'tool') {
    return (
      <group>
        <mesh geometry={GEO.tin} material={faces(mats.tin, mats.cover)} position={[0, 0.16, 0]} rotation-x={tilt * 0.8} />
        {easel && <mesh geometry={GEO.easel} material={mats.wood} position={[0, 0.15, -0.1]} rotation-x={0.4} scale-y={0.75} />}
        {/* a few loose pencils in front */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={GEO.stick} material={toon(RAINBOW[(i * 3 + 1) % 8])} position={[-0.08 + i * 0.08, 0.012, 0.12]} rotation={[Math.PI / 2, 0, 0.3 + i * 0.25]} />
        ))}
      </group>
    );
  }

  // gift: framed print
  return (
    <group>
      <mesh geometry={GEO.frame} material={faces(mats.wood, mats.cover)} position={[0, 0.31, 0]} rotation-x={tilt * 0.6} />
      {easel && <mesh geometry={GEO.easel} material={mats.wood} position={[0, 0.2, -0.12]} rotation-x={0.35} />}
    </group>
  );
}
