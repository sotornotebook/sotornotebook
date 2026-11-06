import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FACADE_X } from './layout';
import { radialTex, world } from './materials';

/** Floating dust motes drifting in the lantern light. They follow the visitor. */
export function Dust({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { geom, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (Math.random() * 2 - 1) * (FACADE_X - 0.3);
      seeds[i * 3 + 1] = 0.3 + Math.random() * 4.5;
      seeds[i * 3 + 2] = Math.random() * 22;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geom: g, seeds };
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: radialTex,
        color: new THREE.Color('#FFE3A3').multiplyScalar(1.6),
        size: 0.07,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime;
    const arr = (geom.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const cz = camera.position.z;
    for (let i = 0; i < count; i++) {
      const sx = seeds[i * 3];
      const sy = seeds[i * 3 + 1];
      const sz = seeds[i * 3 + 2];
      arr[i * 3] = sx + Math.sin(t * 0.3 + i) * 0.25;
      arr[i * 3 + 1] = sy + Math.sin(t * 0.2 + i * 0.7) * 0.3;
      // wrap a 22m window that travels just ahead of the camera
      const z = cz + 2 - (((sz - cz) % 22) + 22) % 22;
      arr[i * 3 + 2] = z;
    }
    geom.attributes.position.needsUpdate = true;
    mat.opacity = 0.75 * world.lit;
  });

  return <points ref={ref} geometry={geom} material={mat} frustumCulled={false} />;
}
