import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FACADE_X, START_Z, WORKSHOP_Z } from './layout';
import { groundTex, toon } from './materials';

const STONE = 0.5;
const STONE_COLORS = ['#8C8494', '#7C7486', '#968A82', '#857A78', '#9A9099', '#746C7E'];

/** Instanced cobblestones (one draw call) over a dark grout plane. */
export function Floor() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const zFrom = START_Z + 3;
  const zTo = WORKSHOP_Z;
  const cols = Math.floor((FACADE_X * 2) / STONE);
  const rows = Math.floor((zFrom - zTo) / STONE);
  const count = cols * rows;

  const geom = useMemo(() => {
    const g = new THREE.BoxGeometry(STONE * 0.9, 0.07, STONE * 0.9, 1, 1, 1);
    // bevel-ish: shrink top face a bit so stones read as rounded
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) {
        pos.setX(i, pos.getX(i) * 0.88);
        pos.setZ(i, pos.getZ(i) * 0.88);
      }
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const jitter = (n: number) => (Math.sin(i * 91.7 + n * 13.1) * 0.5) * 0.06;
        p.set(-FACADE_X + STONE / 2 + k * STONE + (r % 2 ? STONE / 4 : -STONE / 4) + jitter(1), 0.02 + Math.abs(jitter(2)) * 0.3, zFrom - STONE / 2 - r * STONE + jitter(3));
        e.set(0, jitter(4) * 4, 0);
        q.setFromEuler(e);
        const sc = 0.92 + Math.abs(jitter(5)) * 2;
        s.set(sc, 1, sc);
        m.compose(p, q, s);
        ref.current.setMatrixAt(i, m);
        c.set(STONE_COLORS[(i * 7 + r) % STONE_COLORS.length]);
        ref.current.setColorAt(i, c);
        i++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [cols, rows, zFrom]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (zFrom + zTo) / 2]}>
        <planeGeometry args={[FACADE_X * 2 + 1, zFrom - zTo + 6]} />
        <meshBasicMaterial map={groundTex} color="#9a93a8" />
      </mesh>
      <instancedMesh ref={ref} args={[geom, toon('#ffffff', { key: 'stone' }), count]} frustumCulled={false} />
    </group>
  );
}
