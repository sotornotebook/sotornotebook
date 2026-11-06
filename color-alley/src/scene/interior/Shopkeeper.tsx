import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Shopkeeper as Keeper } from '../../data/catalog';
import { toon } from '../materials';

/**
 * Stylised placeholder shopkeepers built from primitives (swap for GLTF via
 * src/data/models.ts later). Idle: breathing + head tilt + blinking.
 */
export function Shopkeeper({ keeper, onClick }: { keeper: Keeper; onClick?: () => void }) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const eyes = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    root.current.position.y = Math.sin(t * 1.6) * 0.012;
    head.current.rotation.z = Math.sin(t * 0.7) * 0.06;
    head.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    const blink = (t % 4) < 0.12 ? 0.1 : 1;
    eyes.current.scale.y = blink;
  });

  const dark = toon('#2a1a12', { key: 'eye' });
  const handlers = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onClick?.();
    },
  };

  if (keeper.kind === 'cat') {
    const orange = toon('#F28C3B', { key: 'cat' });
    return (
      <group ref={root} {...handlers}>
        <mesh position={[0, 0.25, 0]} scale={[0.9, 1.1, 0.8]} material={orange}>
          <sphereGeometry args={[0.25, 12, 10]} />
        </mesh>
        <mesh position={[0, 0.2, 0.12]} scale={[0.7, 0.9, 0.5]} material={toon('#FFE1B8', { key: 'cat-belly' })}>
          <sphereGeometry args={[0.22, 10, 8]} />
        </mesh>
        <group ref={head} position={[0, 0.62, 0.02]}>
          <mesh material={orange}>
            <sphereGeometry args={[0.2, 14, 12]} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.11, 0.17, 0]} rotation-z={-k * 0.3} material={orange}>
              <coneGeometry args={[0.07, 0.14, 4]} />
            </mesh>
          ))}
          <group ref={eyes}>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.075, 0.03, 0.17]} material={dark}>
                <sphereGeometry args={[0.028, 8, 6]} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, -0.03, 0.19]} material={toon('#F06C5B', { key: 'cat-nose' })}>
            <sphereGeometry args={[0.018, 6, 4]} />
          </mesh>
        </group>
        <mesh position={[0.24, 0.15, -0.1]} rotation-z={-0.6} material={orange}>
          <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
        </mesh>
      </group>
    );
  }

  if (keeper.kind === 'fanous') {
    // a friendly lantern with a face
    return (
      <group ref={root} {...handlers}>
        <group ref={head} position={[0, 0.55, 0]}>
          <mesh>
            <cylinderGeometry args={[0.26, 0.2, 0.62, 6]} />
            <meshBasicMaterial color={new THREE.Color('#FFC560').multiplyScalar(1.6)} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={toon('#B8862E', { key: 'fanous-cap' })}>
            <coneGeometry args={[0.32, 0.3, 6]} />
          </mesh>
          <mesh position={[0, -0.38, 0]} material={toon('#B8862E', { key: 'fanous-cap' })}>
            <cylinderGeometry args={[0.2, 0.12, 0.14, 6]} />
          </mesh>
          <group ref={eyes}>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.08, 0.06, 0.23]} material={dark}>
                <sphereGeometry args={[0.035, 8, 6]} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, -0.06, 0.23]} rotation-z={Math.PI} material={dark}>
            <torusGeometry args={[0.06, 0.012, 4, 10, Math.PI]} />
          </mesh>
        </group>
        {/* little arms */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.3, 0.5, 0]} rotation-z={k * 0.9} material={toon('#B8862E', { key: 'fanous-cap' })}>
            <capsuleGeometry args={[0.025, 0.18, 4, 6]} />
          </mesh>
        ))}
      </group>
    );
  }

  const l = keeper.look ?? { skin: '#C98E63', outfit: '#2BB3A3' };
  const skin = toon(l.skin);
  return (
    <group ref={root} {...handlers}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} material={toon(l.outfit)}>
        <capsuleGeometry args={[0.22, 0.6, 4, 10]} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.25, 0.75, 0.08]} rotation={[0.6, 0, k * 0.25]} material={toon(l.outfit)}>
          <capsuleGeometry args={[0.06, 0.32, 4, 6]} />
        </mesh>
      ))}
      <group ref={head} position={[0, 1.18, 0]}>
        <mesh material={skin}>
          <sphereGeometry args={[0.19, 14, 12]} />
        </mesh>
        {l.hair && !l.scarf && (
          <mesh position={[0, 0.06, -0.03]} scale={[1.05, 0.85, 1.05]} material={toon(l.hair)}>
            <sphereGeometry args={[0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
        )}
        {l.scarf && (
          <mesh position={[0, 0.02, -0.02]} scale={[1.15, 1.12, 1.12]} material={toon(l.scarf)}>
            {/* open at the front: three's phi = π/2 points along +Z */}
            <sphereGeometry args={[0.19, 12, 10, Math.PI / 2 + Math.PI * 0.17, Math.PI * 1.66]} />
          </mesh>
        )}
        {l.fez && (
          <mesh position={[0, 0.2, 0]} material={toon('#B3261E', { key: 'fez' })}>
            <cylinderGeometry args={[0.1, 0.13, 0.16, 12]} />
          </mesh>
        )}
        {l.cap && (
          <group position={[0, 0.13, 0]}>
            <mesh material={toon(l.cap)}>
              <sphereGeometry args={[0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, 0.17]} material={toon(l.cap)}>
              <boxGeometry args={[0.24, 0.02, 0.14]} />
            </mesh>
          </group>
        )}
        {l.beard && (
          <mesh position={[0, -0.1, 0.09]} scale={[1, 0.9, 0.7]} material={toon('#F2F2F2', { key: 'beard' })}>
            <sphereGeometry args={[0.14, 10, 8]} />
          </mesh>
        )}
        <group ref={eyes}>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.065, 0.03, 0.17]} material={dark}>
              <sphereGeometry args={[0.022, 8, 6]} />
            </mesh>
          ))}
        </group>
        {l.glasses && (
          <group position={[0, 0.03, 0.18]}>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.065, 0, 0]} material={dark}>
                <torusGeometry args={[0.04, 0.008, 4, 12]} />
              </mesh>
            ))}
          </group>
        )}
        <mesh position={[0, -0.05, 0.175]} rotation-z={Math.PI} material={toon('#8A3B2A', { key: 'mouth' })}>
          <torusGeometry args={[0.04, 0.01, 4, 10, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}
