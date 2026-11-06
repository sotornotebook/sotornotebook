import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { htmlPortal, setPortalShift } from '../htmlPortal';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, Text, useCursor } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { categoryById, isPurchasable, productsIn, type Product } from '../../data/catalog';
import { useStore, useT } from '../../store/useStore';
import { formatPrice } from '../../ui/format';
import { openProduct } from '../../ui/nav';
import { glowMats, latticeTex, radialTex, toon } from '../materials';
import { useSignFont, wallWithArch, extrude } from '../shapes';
import { ProductModel } from '../ProductModel';
import { useCoverAtlas } from '../covers';
import { Shopkeeper } from './Shopkeeper';
import { interiorPan } from './pan';

// Room: x ∈ [-W/2, W/2], z ∈ [-D/2, D/2], floor at y = 0, barrel vault on top.
const W = 7;
const D = 7;
const H = 3;
const SHELF_Z = -D / 2 + 0.3;
const SHELF_X = 2.5;
const SHELF_YS = [0.42, 1.22, 2.02, 2.74];
const PRODUCT_SHELVES = [1, 2, 0]; // fill eye level first, then above, then below
const SPINES = ['#F06C5B', '#F2A93B', '#2BB3A3', '#1E2A5A', '#FFF8EC', '#7A5CC9', '#E35DA0'];

/** world positions on the back shelves for n products */
function productSlots(n: number) {
  const perRow = 5;
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const k = i % perRow;
    const span = Math.min(SHELF_X * 2 - 0.8, (inRow - 1) * 1.45);
    const x = inRow === 1 ? 0 : -span / 2 + (span * k) / (inRow - 1);
    out.push(new THREE.Vector3(x, SHELF_YS[PRODUCT_SHELVES[row % 3]] + 0.025, SHELF_Z + 0.02));
  }
  return out;
}

// ----------------------------------------------------------------- shelving
function Shelving({ occupied }: { occupied: Set<number> }) {
  const boards = useRef<THREE.InstancedMesh>(null!);
  const spines = useRef<THREE.InstancedMesh>(null!);
  const uprightsX = [-SHELF_X, -SHELF_X / 3, SHELF_X / 3, SHELF_X];
  const spineCount = 120;

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    // horizontal boards (one shared geometry, instanced)
    for (const y of SHELF_YS) {
      m.compose(new THREE.Vector3(0, y, SHELF_Z), new THREE.Quaternion(), new THREE.Vector3(SHELF_X * 2 + 0.1, 1, 1));
      boards.current.setMatrixAt(i++, m);
    }
    // vertical uprights, same box scaled
    for (const x of uprightsX) {
      m.compose(new THREE.Vector3(x, SHELF_YS[SHELF_YS.length - 1] / 2 + 0.1, SHELF_Z), new THREE.Quaternion(), new THREE.Vector3(0.06, (SHELF_YS[SHELF_YS.length - 1] + 0.2) / 0.05, 1));
      boards.current.setMatrixAt(i++, m);
    }
    boards.current.count = i;
    boards.current.instanceMatrix.needsUpdate = true;
    boards.current.computeBoundingSphere();

    // decorative book spines on shelves that don't hold products
    const c = new THREE.Color();
    let s = 0;
    SHELF_YS.forEach((y, row) => {
      if (occupied.has(row)) return;
      let x = -SHELF_X + 0.12;
      while (x < SHELF_X - 0.12 && s < spineCount) {
        const h = 0.22 + ((s * 7) % 5) * 0.03;
        const w = 0.05 + ((s * 3) % 3) * 0.015;
        const lean = s % 11 === 0 ? 0.25 : 0;
        m.compose(new THREE.Vector3(x, y + 0.025 + h / 2, SHELF_Z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lean)), new THREE.Vector3(w, h, 0.24));
        spines.current.setMatrixAt(s, m);
        spines.current.setColorAt(s, c.set(SPINES[(s * 5 + row) % SPINES.length]));
        x += w + 0.01 + (s % 9 === 0 ? 0.25 : 0);
        s++;
      }
    });
    spines.current.count = s;
    spines.current.instanceMatrix.needsUpdate = true;
    if (spines.current.instanceColor) spines.current.instanceColor.needsUpdate = true;
    spines.current.computeBoundingSphere();
  }, [occupied]);

  return (
    <group>
      <instancedMesh ref={boards} args={[undefined, toon('#7A4A2E', { key: 'shelf-i' }), 8]}>
        <boxGeometry args={[1, 0.05, 0.42]} />
      </instancedMesh>
      <instancedMesh ref={spines} args={[undefined, toon('#ffffff', { key: 'spines-i' }), spineCount]}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

// -------------------------------------------------------------- one product
function ShelfProduct({ product, pos, cover, active }: { product: Product; pos: THREE.Vector3; cover?: THREE.Texture; active: boolean }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const [hovered, setHovered] = useState(false);
  const lift = useRef<THREE.Group>(null!);
  useCursor(hovered);

  useFrame((_, dt) => {
    const up = hovered || active ? 0.09 : 0;
    easing.damp(lift.current.position, 'y', up, 0.12, dt);
    easing.damp(lift.current.rotation, 'y', hovered ? Math.sin(performance.now() / 600) * 0.12 : 0, 0.2, dt);
  });

  const label = product.quoteOnly ? t.requestQuote : !product.inStock ? t.comingSoon : formatPrice(product.price, lang);
  return (
    <group
      position={pos}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!(e.nativeEvent as PointerEvent & { __dragged?: boolean }).__dragged) openProduct(product.id);
      }}
    >
      {/* generous invisible hit box so small items are easy to tap */}
      <mesh visible={false} position={[0, 0.38, 0.1]}>
        <boxGeometry args={[0.8, 0.8, 0.4]} />
      </mesh>
      <group ref={lift}>
        <group scale={1.2}>
          <ProductModel product={product} cover={cover} easel={false} />
        </group>
      </group>
      {(hovered || active) && (
        <Html portal={htmlPortal} position={[0, 0.92, 0.15]} center zIndexRange={[25, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="whitespace-nowrap rounded-lg bg-cream px-3 py-1 font-display text-base text-navy shadow-lantern ring-2 ring-gold">{label}</div>
            <div className="mt-0.5 max-w-[180px] truncate rounded bg-navy/80 px-2 py-0.5 font-body text-xs text-cream">{lang === 'ar' ? product.titleAr : product.titleEn}</div>
          </div>
        </Html>
      )}
      {product.isNew && (
        <Html portal={htmlPortal} position={[0.28, 0.74, 0.12]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <span className="rounded-full bg-coral px-2 py-0.5 font-body text-[10px] font-bold text-cream">{t.newBadge}</span>
        </Html>
      )}
      {!isPurchasable(product) && !product.quoteOnly && (
        <mesh position={[0, 0.02, 0.2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.5, 0.12]} />
          <meshBasicMaterial color="#6E6A86" />
        </mesh>
      )}
    </group>
  );
}

function Products({ products, slots }: { products: Product[]; slots: THREE.Vector3[] }) {
  const atlas = useCoverAtlas(products);
  const detailId = useStore((s) => s.detailId);
  return (
    <>
      {products.map((p, i) => (
        <ShelfProduct key={p.id} product={p} pos={slots[i]} cover={atlas.get(p.id)} active={detailId === p.id} />
      ))}
    </>
  );
}

// --------------------------------------------------------------------- room
function Room({ wall, title }: { wall: string; title: string }) {
  const font = useSignFont();
  const geo = useMemo(() => {
    const vault = new THREE.CylinderGeometry(W / 2, W / 2, D, 28, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2);
    const lunette = new THREE.CircleGeometry(W / 2, 28, 0, Math.PI);
    const front = extrude(wallWithArch(W, H + W / 2, 1.8, 2.0), 0.2);
    return { vault, lunette, front };
  }, []);
  const mats = useMemo(() => {
    const c = new THREE.Color(wall);
    const light = '#' + c.clone().lerp(new THREE.Color('#FFF8EC'), 0.45).getHexString();
    const dark = '#' + c.clone().multiplyScalar(0.8).getHexString();
    return {
      wall: toon(light, { key: 'iw' }),
      vault: new THREE.MeshToonMaterial({ color: light, side: THREE.BackSide }),
      band: toon(dark, { key: 'iband' }),
      floor: toon('#9C6B45', { key: 'ifloor' }),
      plank: toon('#7F5435', { key: 'iplank' }),
      lattice: new THREE.MeshBasicMaterial({ map: latticeTex('#FFB54A'), toneMapped: false }),
      rug: new THREE.MeshToonMaterial({ color: '#F06C5B' }),
    };
  }, [wall]);

  return (
    <group>
      {/* floor + planks */}
      <mesh rotation-x={-Math.PI / 2} material={mats.floor}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-W / 2 + 0.45 + i * 0.89, 0.002, 0]} rotation-x={-Math.PI / 2} material={mats.plank}>
          <planeGeometry args={[0.03, D]} />
        </mesh>
      ))}
      {/* rug */}
      <mesh position={[0, 0.006, -0.6]} rotation-x={-Math.PI / 2} material={mats.rug}>
        <planeGeometry args={[3.2, 2.2]} />
      </mesh>
      <mesh position={[0, 0.008, -0.6]} rotation-x={-Math.PI / 2} material={toon('#F2A93B', { key: 'rug2' })}>
        <planeGeometry args={[2.9, 1.9]} />
      </mesh>
      <mesh position={[0, 0.01, -0.6]} rotation-x={-Math.PI / 2} material={mats.rug}>
        <planeGeometry args={[2.6, 1.6]} />
      </mesh>
      {/* walls */}
      <mesh position={[0, H / 2, -D / 2]} material={mats.wall}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[0, H, -D / 2 + 0.001]} material={mats.wall}>
        <primitive object={geo.lunette} attach="geometry" />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (W / 2), H / 2, 0]} rotation-y={(-k * Math.PI) / 2} material={mats.wall}>
          <planeGeometry args={[D, H]} />
        </mesh>
      ))}
      {/* front wall with the door we came through (behind the camera) */}
      <mesh geometry={geo.front} position={[0, 0, D / 2]} rotation-y={Math.PI} material={mats.wall} />
      {/* barrel-vault ceiling */}
      <mesh geometry={geo.vault} position={[0, H, 0]} material={mats.vault} />
      {/* painted band */}
      <mesh position={[0, H - 0.08, -D / 2 + 0.01]} material={mats.band}>
        <planeGeometry args={[W, 0.16]} />
      </mesh>
      {/* mashrabiya window on the left wall, glowing */}
      <group position={[-W / 2 + 0.05, 1.9, -0.6]} rotation-y={Math.PI / 2}>
        <mesh material={[toon('#6B4027', { key: 'mash-wood' }), toon('#6B4027', { key: 'mash-wood' }), toon('#6B4027', { key: 'mash-wood' }), toon('#6B4027', { key: 'mash-wood' }), mats.lattice, toon('#6B4027', { key: 'mash-wood' })]}>
          <boxGeometry args={[1.3, 1.7, 0.2]} />
        </mesh>
        <sprite position={[0, 0, 0.4]} scale={[3, 3, 1]}>
          <spriteMaterial map={radialTex} color="#FFC870" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      {/* shop sign painted above the shelves */}
      <Text font={font} fontSize={0.34} position={[0, H + 0.55, -D / 2 + 0.02]} anchorX="center" anchorY="middle" color="#1E2A5A" outlineWidth={0.01} outlineColor="#FFF8EC" direction="auto">
        {title}
      </Text>
    </group>
  );
}

function HangingLanterns() {
  const g = useRef<THREE.Group>(null!);
  const items = useMemo(
    () => [-1.9, 0, 1.9].map((x, i) => ({ x, z: i === 1 ? 0.4 : -0.8, c: new THREE.Color(['#FFC15E', '#FF9A6B', '#7FE3D6'][i]).multiplyScalar(2.4) })),
    [],
  );
  useFrame(({ clock }) => {
    g.current.children.forEach((c, i) => (c.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i) * 0.05));
  });
  return (
    <group ref={g}>
      {items.map((l, i) => (
        <group key={i} position={[l.x, H + W / 2 - 0.3 - Math.abs(l.x) * 0.35, l.z]}>
          <mesh position={[0, -0.5, 0]} material={toon('#3a2e2a', { key: 'chain' })}>
            <cylinderGeometry args={[0.008, 0.008, 1, 3]} />
          </mesh>
          <group position={[0, -1.25, 0]}>
            <mesh>
              <cylinderGeometry args={[0.16, 0.13, 0.42, 6]} />
              <meshBasicMaterial color={l.c} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.3, 0]} material={toon('#5B4636', { key: 'brass' })}>
              <coneGeometry args={[0.22, 0.22, 6]} />
            </mesh>
            <mesh position={[0, -0.27, 0]} material={toon('#5B4636', { key: 'brass' })}>
              <coneGeometry args={[0.08, 0.14, 6]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Counter({ categoryId }: { categoryId: string }) {
  const cat = categoryById(categoryId)!;
  const lang = useStore((s) => s.lang);
  const [bubble, setBubble] = useState(true);
  useEffect(() => {
    setBubble(true);
    const id = setTimeout(() => setBubble(false), window.innerWidth < 768 ? 5000 : 9000);
    return () => clearTimeout(id);
  }, [categoryId]);
  const k = cat.shopkeeper;
  return (
    <group position={[1.95, 0, -1.85]}>
      {/* counter */}
      <mesh position={[0, 0.5, 0]} material={toon('#8A5A3B', { key: 'table' })}>
        <boxGeometry args={[0.7, 1.0, 1.6]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} material={toon('#6B4027', { key: 'easel' })}>
        <boxGeometry args={[0.8, 0.05, 1.7]} />
      </mesh>
      <mesh position={[-0.36, 0.5, 0]} material={toon(cat.wallColor)}>
        <boxGeometry args={[0.02, 0.6, 1.4]} />
      </mesh>
      {/* tea glass + pencil cup on the counter */}
      <mesh position={[0, 1.1, 0.5]} material={toon('#B5491F', { key: 'tea' })}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 8]} />
      </mesh>
      <mesh position={[0, 1.12, -0.5]} material={toon('#2BB3A3', { key: 'cup' })}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 8]} />
      </mesh>
      <group position={[0.6, 0, -0.1]} rotation-y={-0.55}>
        <group position={[0, k.kind === 'person' ? 0 : 1.05, 0]} scale={k.kind === 'person' ? 1.05 : 1}>
          <Shopkeeper keeper={k} onClick={() => setBubble((b) => !b)} />
        </group>
      </group>
      {bubble && (
        <Html portal={htmlPortal} position={[0.2, 2.05, 0]} center zIndexRange={[24, 0]}>
          <div className="relative w-44 rounded-2xl bg-cream p-2.5 font-body text-xs leading-relaxed text-navy shadow-xl md:w-56 md:p-3 md:text-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'} role="status">
            <div className="mb-0.5 font-display text-base text-coral">{lang === 'ar' ? k.nameAr : k.nameEn}</div>
            {lang === 'ar' ? k.greetingAr : k.greetingEn}
            <span className="absolute -bottom-2 start-8 h-4 w-4 rotate-45 bg-cream" aria-hidden="true" />
          </div>
        </Html>
      )}
    </group>
  );
}

/** Limited camera: pans left/right along the shelves, slight look-around, leans toward an opened product. */
function InteriorRig({ slots, products }: { slots: THREE.Vector3[]; products: Product[] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const look = useMemo(() => new THREE.Vector3(0, 1.3, -D / 2), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const view = useMemo(() => ({ x: 0 }), []);

  useEffect(() => {
    interiorPan.target = 0;
    camera.position.set(0, 1.6, D / 2 - 0.3);
    camera.lookAt(look);
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (useStore.getState().detailId) return;
      interiorPan.target = THREE.MathUtils.clamp(interiorPan.target + (e.deltaY + e.deltaX) * 0.004, -interiorPan.limit, interiorPan.limit);
    };
    let x0 = 0;
    let p0 = 0;
    let down = false;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = false;
      x0 = e.clientX;
      p0 = interiorPan.target;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 8) moved = true;
      if (moved) interiorPan.target = THREE.MathUtils.clamp(p0 - dx * 0.006, -interiorPan.limit, interiorPan.limit);
    };
    const onUp = (e: PointerEvent) => {
      // tell the product click handler this was a drag, not a tap
      if (moved) (e as PointerEvent & { __dragged?: boolean }).__dragged = true;
      down = false;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) (e as MouseEvent & { __dragged?: boolean }).__dragged = true;
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClickCapture, true);
    el.style.touchAction = 'none';
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClickCapture, true);
      el.style.touchAction = '';
    };
  }, [camera, gl, look]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const portrait = state.size.width < state.size.height;
    const fov = portrait ? 68 : 60;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    // keep the room centred in the area the product drawer doesn't cover (desktop)
    const { drawerOpen, lang } = useStore.getState();
    const { width, height } = state.size;
    const shift = drawerOpen && width >= 768 ? (lang === "ar" ? -150 : 150) : 0;
    view.x = THREE.MathUtils.damp(view.x, shift, 5, dt);
    if (Math.abs(view.x) > 0.5) camera.setViewOffset(width, height, view.x, 0, width, height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    setPortalShift(Math.abs(view.x) > 0.5 ? view.x : 0, 0);
    interiorPan.limit = portrait ? 2.1 : 1.2;
    const { detailId } = useStore.getState();
    const i = products.findIndex((p) => p.id === detailId);
    if (i >= 0) {
      // lean in toward the opened product (visible behind the detail backdrop)
      const s = slots[i];
      pos.set(s.x, s.y + 0.5, s.z + 2.0);
      target.set(s.x, s.y + 0.3, s.z);
    } else {
      const p = interiorPan.target;
      pos.set(p, (portrait ? 1.45 : 1.6) + Math.sin(state.clock.elapsedTime * 0.8) * 0.01, portrait ? 1.0 : 2.0);
      target.set(p * 0.9 + state.pointer.x * 0.7, 1.3 + state.pointer.y * 0.35, -D / 2);
    }
    easing.damp3(camera.position, pos, i >= 0 ? 0.35 : 0.25, dt);
    easing.damp3(look, target, 0.25, dt);
    camera.lookAt(look);
  });
  return null;
}

/** The inside of one shop. Lazy-loaded; the alley is unmounted while this is shown. */
export default function Interior({ categoryId }: { categoryId: string }) {
  const cat = categoryById(categoryId)!;
  const lang = useStore((s) => s.lang);
  const products = useMemo(() => productsIn(categoryId), [categoryId]);
  const slots = useMemo(() => productSlots(products.length), [products.length]);
  const occupied = useMemo(() => new Set(products.length > 5 ? [1, 2] : [1]), [products.length]);

  // lift the fade overlay once the room has rendered (covers loaded via Suspense)
  useEffect(() => {
    const id = requestAnimationFrame(() => useStore.getState().set({ fade: false }));
    return () => cancelAnimationFrame(id);
  }, [categoryId]);

  return (
    <group>
      <color attach="background" args={['#2a1a12']} />
      {/* 4 real lights: warm fill, ceiling lantern, shelf light, counter */}
      <hemisphereLight args={['#FFE3C0', '#6B4027', 1.15]} />
      <pointLight position={[0, 3.6, 0.3]} color="#FFC07A" intensity={16} distance={12} decay={2} />
      <pointLight position={[0, 2.4, -1.6]} color="#FFD9A0" intensity={9} distance={7} decay={2} />
      <pointLight position={[2.2, 2.4, 1.2]} color="#FFB45A" intensity={5} distance={6} decay={2} />

      <Room wall={cat.wallColor} title={lang === 'ar' ? cat.nameAr : cat.nameEn} />
      <Shelving occupied={occupied} />
      <HangingLanterns />
      <Counter categoryId={categoryId} />
      {/* shelf glow */}
      <mesh position={[0, 0.012, SHELF_Z + 1.2]} rotation-x={-Math.PI / 2} material={glowMats.pool} scale={[6, 2.4, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <Products products={products} slots={slots} />
      <InteriorRig slots={slots} products={products} />
    </group>
  );
}
