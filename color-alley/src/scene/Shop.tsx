import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import type { Product } from '../data/products';
import { FACADE_X, type Block, type ShopSlot } from './layout';
import { glowMats, radialTex, stripeTex, toon, world } from './materials';
import { archFrame, extrude, wallWithArch, useSignFont } from './shapes';
import { ProductDisplay } from './ProductDisplay';
import { useStore } from '../store/useStore';

const WALL_W = 5.88;
const DOOR_W = 1.7;
const SPRING = 1.95;
const ROOM_D = 1.05;
const SPINES = ['#F06C5B', '#F2A93B', '#2BB3A3', '#1E2A5A', '#FFF8EC', '#7A5CC9'];

interface Props {
  slot: ShopSlot;
  block: Block;
  product: Product;
}

export function Shop({ slot, block, product }: Props) {
  const lang = useStore((s) => s.lang);
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);
  const lit = useStore((s) => s.lit);
  const font = useSignFont();
  const [hovered, setHovered] = useState(false);
  const [near, setNear] = useState(false);
  const active = hovered || focus === slot.id;
  useCursor(hovered);

  const s = slot.side;
  const rotY = s === 1 ? -Math.PI / 2 : Math.PI / 2;

  const geoms = useMemo(
    () => ({
      wall: extrude(wallWithArch(WALL_W, block.height, DOOR_W, SPRING), 0.2),
      frame: extrude(archFrame(2.5, 3.2, DOOR_W, SPRING), 0.12, true),
    }),
    [block.height],
  );

  // per-shop materials (they animate on hover)
  const mats = useMemo(() => {
    const sign = new THREE.MeshToonMaterial({ color: product.accent, emissive: new THREE.Color(product.accent), emissiveIntensity: 0 });
    const awning = new THREE.MeshToonMaterial({ map: stripeTex(product.accent, '#FFF8EC') });
    return { sign, awning };
  }, [product.accent]);

  const halo = useRef<THREE.Sprite>(null!);

  useFrame(({ camera }, dt) => {
    // lazy-load the cover once the visitor is within ~24m
    if (!near && Math.abs(camera.position.z - slot.z) < 24) setNear(true);
    const on = active ? 1 : 0;
    easing.damp(mats.sign, 'emissiveIntensity', on * 0.9 + world.lit * 0.15, 0.15, dt);
    const hm = halo.current.material as THREE.SpriteMaterial;
    easing.damp(hm, 'opacity', on * 0.9, 0.15, dt);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!lit) return;
    setHovered(true);
    world.hoverShop = slot.id;
  };
  const out = () => {
    setHovered(false);
    if (world.hoverShop === slot.id) world.hoverShop = null;
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!lit) return;
    setFocus(slot.id);
  };

  const signText = product.sign[lang];
  const textColor = active ? '#FFFFFF' : '#FFE3A3';

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {/* ---------- facade (local space: +Z faces the alley) ---------- */}
      <group position={[s * FACADE_X, 0, slot.z]} rotation-y={rotY}>
        {/* invisible hit area: the facade itself is merged into the global static batch */}
        <mesh visible={false} position={[0, block.height / 2, 0.3]} userData={{ noBatch: true }}>
          <boxGeometry args={[WALL_W, block.height, 0.6]} />
        </mesh>
        <mesh geometry={geoms.wall} material={toon(block.color)} position={[0, 0, -0.2]} />
        <mesh geometry={geoms.frame} material={toon('#F3E2C4', { key: 'trim' })} />

        {/* warm interior seen through the arch */}
        <mesh position={[0, 1.6, -0.2 - ROOM_D]} material={glowMats.interior}>
          <planeGeometry args={[DOOR_W + 0.4, 3.2]} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * (DOOR_W / 2 + 0.2), 1.6, -0.2 - ROOM_D / 2]} rotation-y={-k * Math.PI / 2} material={toon('#E7A35A', { key: 'room' })}>
            <planeGeometry args={[ROOM_D, 3.2]} />
          </mesh>
        ))}
        <mesh position={[0, 0.01, -0.2 - ROOM_D / 2]} rotation-x={-Math.PI / 2} material={toon('#7A4A2E', { key: 'roomfloor' })}>
          <planeGeometry args={[DOOR_W + 0.4, ROOM_D]} />
        </mesh>
        {/* shelves with book spines */}
        {[0.9, 1.6, 2.3].map((y, row) => (
          <group key={y} position={[0, y, -0.2 - ROOM_D + 0.15]}>
            <mesh material={toon('#6B4027', { key: 'shelf' })}>
              <boxGeometry args={[DOOR_W + 0.3, 0.04, 0.3]} />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => (
              <mesh key={i} position={[-0.8 + i * 0.2, 0.15, 0]} material={toon(SPINES[(i + row * 2 + slot.index) % SPINES.length])}>
                <boxGeometry args={[0.07, 0.26 - ((i * 3 + row) % 3) * 0.03, 0.22]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* striped awning */}
        <mesh position={[0, 3.32, 0.45]} rotation-x={0.42} material={mats.awning}>
          <boxGeometry args={[2.7, 0.04, 1.0]} />
        </mesh>

        {/* facade sign above the awning */}
        <group position={[0, 3.98, 0.08]}>
          <mesh material={toon('#1E2A5A', { key: 'sign-navy' })}>
            <boxGeometry args={[2.7, 0.62, 0.06]} />
          </mesh>
          <mesh position={[0, 0, -0.01]} material={mats.sign}>
            <boxGeometry args={[2.82, 0.74, 0.04]} />
          </mesh>
          <Text font={font} fontSize={0.3} maxWidth={2.5} position={[0, 0.02, 0.05]} anchorX="center" anchorY="middle" color={textColor} outlineWidth={active ? 0.02 : 0.008} outlineColor={active ? product.accent : '#3a2608'} direction="auto">
            {signText}
          </Text>
        </group>

        {/* display table in the alley */}
        <group position={[0, 0, 1.05]}>
          <mesh position={[0, 0.8, 0]} material={toon('#8A5A3B', { key: 'table' })}>
            <boxGeometry args={[1.6, 0.06, 0.85]} />
          </mesh>
          <mesh position={[0, 0.6, 0.43]} material={toon(product.accent)}>
            <boxGeometry args={[1.62, 0.4, 0.02]} />
          </mesh>
          {[-0.7, 0.7].map((x) =>
            [-0.35, 0.35].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.4, z]} material={toon('#6B4027', { key: 'easel' })}>
                <boxGeometry args={[0.06, 0.8, 0.06]} />
              </mesh>
            )),
          )}
          {/* fake contact shadow */}
          <mesh position={[0, 0.105, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[2, 1.2]} />
            <meshBasicMaterial map={radialTex} color="#000" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <group position={[0, 0.83, 0]}>
            <ProductDisplay product={product} near={near} />
          </group>
        </group>
      </group>

      {/* ---------- hanging blade sign (world space, faces visitors walking in) ---------- */}
      <group position={[s * (FACADE_X - 0.78), 3.2, slot.z - 2.35]}>
        <mesh position={[s * 0.1, 0.55, 0]} material={toon('#3a2e2a', { key: 'chain' })}>
          <boxGeometry args={[1.6, 0.05, 0.05]} />
        </mesh>
        <group>
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} position={[x, 0.42, 0]} material={toon('#3a2e2a', { key: 'chain' })}>
              <boxGeometry args={[0.02, 0.22, 0.02]} />
            </mesh>
          ))}
          <mesh material={mats.sign}>
            <boxGeometry args={[1.22, 0.66, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.035]} material={toon('#1E2A5A', { key: 'sign-navy' })}>
            <boxGeometry args={[1.1, 0.54, 0.01]} />
          </mesh>
          <Text font={font} fontSize={0.17} maxWidth={1.0} lineHeight={1.1} textAlign="center" position={[0, 0.01, 0.045]} anchorX="center" anchorY="middle" color={textColor} outlineWidth={active ? 0.012 : 0.004} outlineColor={active ? product.accent : '#3a2608'} direction="auto">
            {signText}
          </Text>
          <sprite ref={halo} scale={[2.4, 1.6, 1]} position={[0, 0, -0.05]}>
            <spriteMaterial map={radialTex} color="#FFE3A3" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        </group>
      </group>
    </group>
  );
}
