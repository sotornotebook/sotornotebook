import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { FACADE_X, WORKSHOP_Z } from './layout';
import { glowMats, radialTex, toon } from './materials';
import { archFrame, extrude, wallWithArch, useSignFont } from './shapes';
import { useStore, useT } from '../store/useStore';
import { MODELS } from '../data/models';
import { ModelSlot } from './ModelSlot';

const W = FACADE_X * 2 + 0.4;
const H = 9;

/** "ورشة جدو عبده" — the lantern workshop closing the alley, teasing the next book. */
export function Workshop() {
  const t = useT();
  const font = useSignFont();
  const setFocus = useStore((s) => s.setFocus);
  const focus = useStore((s) => s.focus);
  const lit = useStore((s) => s.lit);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const active = hovered || focus === 'workshop';

  const geoms = useMemo(
    () => ({
      wall: extrude(wallWithArch(W, H, 2.6, 2.4), 0.3),
      frame: extrude(archFrame(3.4, 4.1, 2.6, 2.4), 0.16, true),
    }),
    [],
  );
  const signMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#2BB3A3', emissive: '#2BB3A3', emissiveIntensity: 0 }), []);
  const pyramid = useRef<THREE.Group>(null!);

  // hanging lanterns inside the workshop (part of the display)
  const hanging = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -1.05 + i * 0.35,
        y: 2.6 - (i % 2) * 0.35,
        c: new THREE.Color(['#FFC15E', '#F06C5B', '#2BB3A3', '#FFD27A'][i % 4]).multiplyScalar(2.4),
      })),
    [],
  );

  useFrame(({ clock }, dt) => {
    easing.damp(signMat, 'emissiveIntensity', active ? 0.9 : 0.1, 0.15, dt);
    pyramid.current.rotation.y = clock.elapsedTime * 0.4;
    pyramid.current.position.y = 1.25 + Math.sin(clock.elapsedTime * 1.3) * 0.04;
  });

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (lit) setHovered(true);
    },
    onPointerOut: () => setHovered(false),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (lit) setFocus('workshop');
    },
  };

  if (MODELS.workshop) {
    return (
      <group position={[0, 0, WORKSHOP_Z]} {...handlers}>
        <ModelSlot url={MODELS.workshop} />
      </group>
    );
  }

  return (
    <group position={[0, 0, WORKSHOP_Z]} {...handlers}>
      <mesh visible={false} position={[0, H / 2, 0.5]} userData={{ noBatch: true }}>
        <boxGeometry args={[W, H, 1]} />
      </mesh>
      <mesh geometry={geoms.wall} material={toon('#C98F6B', { key: 'workshop' })} position={[0, 0, -0.3]} />
      <mesh geometry={geoms.frame} material={toon('#F3E2C4', { key: 'trim' })} />
      {/* back of the room */}
      <mesh position={[0, 0, -3.5]} material={toon('#8E5A3A', { key: 'wbody' })}>
        <boxGeometry args={[W, 0.1, 6]} />
      </mesh>
      <mesh position={[0, 2, -2]} material={glowMats.interior}>
        <planeGeometry args={[3.2, 4]} />
      </mesh>
      {/* workbench */}
      <mesh position={[0, 0.75, -1.2]} material={toon('#6B4027', { key: 'easel' })}>
        <boxGeometry args={[2.2, 0.1, 0.8]} />
      </mesh>
      {/* lanterns being made */}
      {hanging.map((h, i) => (
        <group key={i} position={[h.x, h.y, -1.6]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.07, 0.22, 6]} />
            <meshBasicMaterial color={h.c} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={toon('#5B4636', { key: 'brass' })}>
            <coneGeometry args={[0.12, 0.12, 6]} />
          </mesh>
        </group>
      ))}

      {/* teaser: a glowing golden pyramid for the Grand Egyptian Museum adventure */}
      <group position={[0, 0, 1.2]}>
        <mesh position={[0, 0.45, 0]} material={toon('#2BB3A3', { key: 'pedestal' })}>
          <cylinderGeometry args={[0.3, 0.4, 0.9, 8]} />
        </mesh>
        <group ref={pyramid} position={[0, 1.25, 0]} userData={{ noBatch: true }}>
          <mesh>
            <coneGeometry args={[0.32, 0.42, 4]} />
            <meshBasicMaterial color={new THREE.Color('#F2A93B').multiplyScalar(1.8)} toneMapped={false} />
          </mesh>
        </group>
        <sprite position={[0, 1.25, 0]} scale={[1.6, 1.6, 1]}>
          <spriteMaterial map={radialTex} color="#FFE3A3" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>

      {/* main sign */}
      <group position={[0, 4.7, 0.12]}>
        <mesh material={signMat}>
          <boxGeometry args={[4.6, 1.0, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={toon('#1E2A5A', { key: 'sign-navy' })}>
          <boxGeometry args={[4.4, 0.84, 0.02]} />
        </mesh>
        <Text font={font} fontSize={0.44} maxWidth={4.2} position={[0, 0.03, 0.07]} anchorX="center" anchorY="middle" color={active ? '#ffffff' : '#FFE3A3'} outlineWidth={0.012} outlineColor="#0b3b36" direction="auto">
          {t.workshopName}
        </Text>
      </group>
      {/* teaser board */}
      <group position={[0, 6.0, 0.1]}>
        <mesh material={toon('#FFF8EC', { key: 'paper' })}>
          <boxGeometry args={[4.2, 0.7, 0.05]} />
        </mesh>
        <Text font={font} fontSize={0.24} maxWidth={4} position={[0, 0.02, 0.04]} anchorX="center" anchorY="middle" color="#1E2A5A" direction="auto">
          {t.workshopTeaser}
        </Text>
      </group>
    </group>
  );
}
