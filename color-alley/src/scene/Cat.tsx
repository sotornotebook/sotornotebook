import { useMemo, useRef, useState } from 'react';
import { htmlPortal } from './htmlPortal';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { toon } from './materials';
import { MODELS } from '../data/models';
import { ModelSlot } from './ModelSlot';
import { FACADE_X, SHOPS } from './layout';
import { useT } from '../store/useStore';

/** Basbousa, the sleepy orange cat, curled on a doorstep. Breathes, twitches an ear. */
export function Cat() {
  const t = useT();
  const body = useRef<THREE.Group>(null!);
  const ear = useRef<THREE.Mesh>(null!);
  const tail = useRef<THREE.Group>(null!);
  const zzz = useRef<THREE.Group>(null!);
  const [hover, setHover] = useState(false);
  const shop = SHOPS[1]; // left side, second shop
  const pos: [number, number, number] = [shop.side * (FACADE_X - 0.5), 0, shop.z + 2.0];

  const orange = toon('#F28C3B', { key: 'cat' });
  const cream = toon('#FFE1B8', { key: 'cat-belly' });
  const dark = toon('#3a2316', { key: 'cat-eye' });
  const tailGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.06, -0.05),
      new THREE.Vector3(0.28, 0.06, 0.12),
      new THREE.Vector3(0.12, 0.06, 0.24),
      new THREE.Vector3(-0.1, 0.07, 0.22),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.035, 5, false);
  }, []);

  useFrame(({ clock }) => {
    const e = clock.elapsedTime;
    const b = 1 + Math.sin(e * 1.6) * 0.035;
    body.current.scale.set(1, b, 1 + (b - 1) * 0.5);
    const twitch = Math.max(0, Math.sin(e * 0.7) - 0.96) * 12;
    ear.current.rotation.z = 0.35 + twitch * 0.25;
    tail.current.rotation.y = Math.sin(e * 0.5) * 0.08;
    zzz.current.position.y = 0.55 + ((e * 0.18) % 0.4);
    (zzz.current.children[0] as THREE.Mesh).scale.setScalar(0.6 + ((e * 0.18) % 0.4));
  });

  if (MODELS.cat) return <ModelSlot url={MODELS.cat} position={pos} />;

  return (
    <group position={pos} rotation-y={0.6}>
      {/* stone step */}
      <mesh position={[0, 0.12, 0]} material={toon('#B9A58C', { key: 'step' })}>
        <boxGeometry args={[0.9, 0.24, 0.75]} />
      </mesh>
      <group position={[0, 0.24, 0]} onPointerOver={(e) => (e.stopPropagation(), setHover(true))} onPointerOut={() => setHover(false)}>
        <group ref={body}>
          <mesh position={[0, 0.11, 0]} scale={[1.25, 0.72, 1]} material={orange}>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.06, 0.1]} scale={[1.1, 0.5, 0.6]} material={cream}>
            <sphereGeometry args={[0.18, 8, 6]} />
          </mesh>
          {/* stripes */}
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.24, 0]} rotation-z={x * 2} material={toon('#C9661F', { key: 'cat-stripe' })}>
              <boxGeometry args={[0.035, 0.02, 0.26]} />
            </mesh>
          ))}
        </group>
        {/* head tucked on paws */}
        <group position={[-0.22, 0.1, 0.1]}>
          <mesh material={orange}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
          <mesh ref={ear} position={[-0.04, 0.11, -0.04]} rotation-z={0.35} material={orange}>
            <coneGeometry args={[0.045, 0.09, 4]} />
          </mesh>
          <mesh position={[0.05, 0.11, -0.04]} rotation-z={-0.35} material={orange}>
            <coneGeometry args={[0.045, 0.09, 4]} />
          </mesh>
          {/* closed eyes */}
          {[-0.05, 0.03].map((x) => (
            <mesh key={x} position={[x - 0.02, 0.02, 0.105]} material={dark}>
              <boxGeometry args={[0.04, 0.008, 0.01]} />
            </mesh>
          ))}
          <mesh position={[-0.04, -0.03, 0.115]} material={toon('#F06C5B', { key: 'cat-nose' })}>
            <sphereGeometry args={[0.012, 4, 3]} />
          </mesh>
        </group>
        <group ref={tail}>
          <mesh geometry={tailGeom} material={orange} />
        </group>
        <group ref={zzz} position={[-0.25, 0.55, 0]}>
          <mesh>
            <torusGeometry args={[0.03, 0.008, 4, 8]} />
            <meshBasicMaterial color="#FFE3A3" transparent opacity={0.8} />
          </mesh>
        </group>
        {hover && (
          <Html portal={htmlPortal} position={[0, 0.6, 0]} center distanceFactor={6} zIndexRange={[20, 0]}>
            <div className="pointer-events-none whitespace-nowrap rounded-full bg-cream/90 px-3 py-1 font-body text-sm text-navy shadow">{t.catName}</div>
          </Html>
        )}
      </group>
    </group>
  );
}
