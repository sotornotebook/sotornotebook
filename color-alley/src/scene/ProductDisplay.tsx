import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Product } from '../data/products';
import { toon } from './materials';
import { MODELS } from '../data/models';
import { ModelSlot } from './ModelSlot';

const RAINBOW = ['#F06C5B', '#F2A93B', '#FFD84A', '#7BC86C', '#2BB3A3', '#3D7BD9', '#7A5CC9', '#E35DA0', '#8B5A3C', '#1E2A5A', '#FF8A3D', '#59C3E8'];
const BOOK_W = 0.42;
const BOOK_H = 0.58;
const BOOK_D = 0.045;

/** Face materials for a book box: [right, left, top, bottom, front(cover), back] */
function bookMaterials(accent: string, cover?: THREE.Material) {
  const pages = toon('#FFF8EC', { key: 'pages' });
  const spine = toon(accent);
  return [pages, spine, pages, pages, cover ?? spine, spine];
}

function CoveredBook({ product, ...props }: { product: Product } & JSX.IntrinsicElements['group']) {
  const tex = useTexture(product.cover);
  const coverMat = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.32, roughness: 0.7 });
  }, [tex]);
  return (
    <group {...props}>
      <mesh material={bookMaterials(product.accent, coverMat)}>
        <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
      </mesh>
    </group>
  );
}

function PlainBook({ accent, ...props }: { accent: string } & JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <mesh material={bookMaterials(accent)}>
        <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
      </mesh>
    </group>
  );
}

/** Book standing on a little easel. Cover texture is only fetched once `near` is true (lazy). */
function StandingBook({ product, near, x = 0, z = 0, rot = 0 }: { product: Product; near: boolean; x?: number; z?: number; rot?: number }) {
  const pose = { position: [x, BOOK_H / 2 + 0.02, z] as [number, number, number], rotation: [-0.22, rot, 0] as [number, number, number] };
  return (
    <group>
      {/* the book swaps from plain → covered when its texture loads, so keep it out of the static batch */}
      <group userData={{ noBatch: true }}>
      {near ? (
        <Suspense fallback={<PlainBook accent={product.accent} {...pose} />}>
          <CoveredBook product={product} {...pose} />
        </Suspense>
      ) : (
        <PlainBook accent={product.accent} {...pose} />
      )}
      </group>
      {/* easel */}
      <mesh position={[x, 0.2, z - 0.12]} rotation-x={0.35} material={toon('#6B4027', { key: 'easel' })}>
        <boxGeometry args={[0.04, 0.42, 0.03]} />
      </mesh>
    </group>
  );
}

/** Pencils / crayons, one instanced draw call per shop. */
function Sticks({ count, crayon }: { count: number; crayon: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const len = crayon ? 0.14 : 0.3;
  const r = crayon ? 0.022 : 0.011;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // fan them out on the table in front of the kraft box
      const a = (i / Math.max(1, count - 1) - 0.5) * (crayon ? 1.2 : 1.6);
      q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, a));
      const row = crayon ? 0 : Math.floor(i / 12) * 0.035;
      m.compose(new THREE.Vector3(Math.sin(a) * 0.18, r + row, 0.2 + Math.cos(a) * 0.05 - row * 2), q, new THREE.Vector3(1, 1, 1));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(RAINBOW[i % RAINBOW.length]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [count, crayon, r]);
  return (
    <instancedMesh ref={ref} args={[undefined, toon('#ffffff', { key: 'sticks' }), count]}>
      <cylinderGeometry args={[r, r, len, 6]} />
    </instancedMesh>
  );
}

function KraftBox() {
  const kraft = toon('#C49A6C', { key: 'kraft' });
  return (
    <group position={[0.35, 0, -0.05]}>
      <mesh position={[0, 0.09, 0]} material={kraft}>
        <boxGeometry args={[0.46, 0.18, 0.34]} />
      </mesh>
      {/* open lid leaning back */}
      <mesh position={[0, 0.2, -0.2]} rotation-x={-1.1} material={kraft}>
        <boxGeometry args={[0.47, 0.02, 0.34]} />
      </mesh>
      {/* string tie */}
      <mesh position={[0, 0.181, 0]} material={toon('#FFF8EC', { key: 'pages' })}>
        <boxGeometry args={[0.03, 0.005, 0.345]} />
      </mesh>
    </group>
  );
}

export function ProductDisplay({ product, near }: { product: Product; near: boolean }) {
  // Drop a GLTF into /public/models and register it in src/data/models.ts to replace this.
  const custom = MODELS.products[product.id];
  if (custom) return <ModelSlot url={custom} />;

  if (product.kind === 'book') {
    return (
      <group>
        <StandingBook product={product} near={near} />
        {/* small stack beside it */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.45, 0.025 + i * 0.05, 0.05]} rotation={[-Math.PI / 2, 0, 0.15 * i]} material={bookMaterials(product.accent)}>
            <boxGeometry args={[BOOK_W * 0.9, BOOK_H * 0.9, BOOK_D]} />
          </mesh>
        ))}
      </group>
    );
  }

  if (product.kind === 'pack') {
    return (
      <group>
        <StandingBook product={product} near={near} x={-0.35} />
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0.25, 0.025 + i * 0.048, 0]} rotation={[-Math.PI / 2, 0, (i % 3) * 0.04]} material={bookMaterials(i % 2 ? '#F2A93B' : '#2BB3A3')}>
            <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
          </mesh>
        ))}
        {/* ribbon */}
        <mesh position={[0.25, 0.25, 0]} material={toon('#F06C5B', { key: 'ribbon' })}>
          <boxGeometry args={[0.05, 0.5, BOOK_H + 0.01]} />
        </mesh>
      </group>
    );
  }

  // bundle
  const books = product.extras?.books ?? 1;
  return (
    <group>
      <StandingBook product={product} near={near} x={-0.3} z={-0.05} />
      {books > 1 && <PlainBook accent="#2BB3A3" position={[-0.05, BOOK_H / 2 - 0.05, -0.16]} rotation={[-0.25, -0.3, 0]} scale={0.85} />}
      <KraftBox />
      <group position={[0.1, 0, 0]}>
        <Sticks count={Math.min(product.extras?.crayons ?? product.extras?.pencils ?? 12, 24)} crayon={!!product.extras?.crayons} />
      </group>
    </group>
  );
}
