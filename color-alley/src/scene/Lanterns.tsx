import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FACADE_X, SHOPS, STRINGS, WORKSHOP_Z } from './layout';
import { glowMats, toon } from './materials';

// Lantern glass tints (HDR so bloom picks them up)
const TINTS = ['#FFC15E', '#FF9A6B', '#FFD27A', '#7FE3D6', '#FFB04A'].map((c) => new THREE.Color(c).multiplyScalar(2.6));
const BULB_TINTS = ['#FFE3A3', '#F2A93B', '#F06C5B', '#2BB3A3', '#FFE3A3'].map((c) => new THREE.Color(c).multiplyScalar(3));

interface Lantern {
  pos: THREE.Vector3;
  scale: number;
  sway: boolean;
  tint: THREE.Color;
}

export const LANTERNS: Lantern[] = (() => {
  const out: Lantern[] = [];
  STRINGS.forEach((s, i) => {
    out.push({ pos: new THREE.Vector3(0, s.y - s.sag - 0.55, s.z), scale: 1.25, sway: true, tint: TINTS[i % TINTS.length] });
  });
  SHOPS.forEach((s, i) => {
    for (const dz of [-1.65, 1.65]) {
      out.push({ pos: new THREE.Vector3(s.side * (FACADE_X - 0.32), 2.95, s.z + dz), scale: 0.8, sway: false, tint: TINTS[(i + 2) % TINTS.length] });
    }
  });
  // Workshop facade
  for (const x of [-2.3, 2.3]) out.push({ pos: new THREE.Vector3(x, 3.3, WORKSHOP_Z + 0.55), scale: 1, sway: false, tint: TINTS[0] });
  return out;
})();

/** Floor light pools — fake light without real lights */
const POOLS: { x: number; z: number; r: number }[] = [
  ...STRINGS.map((s) => ({ x: 0, z: s.z, r: 3.2 })),
  ...SHOPS.map((s) => ({ x: s.side * (FACADE_X - 1.1), z: s.z, r: 3.4 })),
  { x: 0, z: WORKSHOP_Z + 2.2, r: 5 },
];

function useLanternGeoms() {
  return useMemo(() => {
    const glass = new THREE.CylinderGeometry(0.13, 0.11, 0.34, 6);
    const metal = mergeGeometries([
      new THREE.ConeGeometry(0.19, 0.2, 6).translate(0, 0.27, 0),
      new THREE.CylinderGeometry(0.15, 0.15, 0.03, 6).translate(0, 0.17, 0),
      new THREE.CylinderGeometry(0.13, 0.1, 0.05, 6).translate(0, -0.19, 0),
      new THREE.ConeGeometry(0.06, 0.12, 6).rotateX(Math.PI).translate(0, -0.27, 0),
      new THREE.TorusGeometry(0.05, 0.012, 4, 8).translate(0, 0.42, 0),
    ])!;
    return { glass, metal };
  }, []);
}

export function Lanterns() {
  const glassRef = useRef<THREE.InstancedMesh>(null!);
  const metalRef = useRef<THREE.InstancedMesh>(null!);
  const bulbRef = useRef<THREE.InstancedMesh>(null!);
  const poolRef = useRef<THREE.InstancedMesh>(null!);
  const { glass, metal } = useLanternGeoms();

  // Wires + bulbs along each string (catenary ≈ quadratic bezier)
  const { wireGeom, bulbs } = useMemo(() => {
    const tubes: THREE.BufferGeometry[] = [];
    const bulbs: { p: THREE.Vector3; c: THREE.Color }[] = [];
    STRINGS.forEach((s, si) => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-FACADE_X, s.y, s.z),
        new THREE.Vector3(0, s.y - s.sag * 2, s.z + 0.3),
        new THREE.Vector3(FACADE_X, s.y, s.z),
      );
      tubes.push(new THREE.TubeGeometry(curve, 20, 0.012, 3, false));
      // drop wire to centre lantern
      const mid = curve.getPoint(0.5);
      tubes.push(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 3).translate(mid.x, mid.y - 0.11, mid.z));
      const n = 14;
      for (let i = 1; i < n; i++) {
        if (i === n / 2) continue;
        bulbs.push({ p: curve.getPoint(i / n).add(new THREE.Vector3(0, -0.06, 0)), c: BULB_TINTS[(i + si) % BULB_TINTS.length] });
      }
    });
    return { wireGeom: mergeGeometries(tubes)!, bulbs };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    LANTERNS.forEach((l, i) => {
      m.makeScale(l.scale, l.scale, l.scale).setPosition(l.pos);
      glassRef.current.setMatrixAt(i, m);
      metalRef.current.setMatrixAt(i, m);
      glassRef.current.setColorAt(i, l.tint);
    });
    bulbs.forEach((b, i) => {
      m.makeTranslation(b.p.x, b.p.y, b.p.z);
      bulbRef.current.setMatrixAt(i, m);
      bulbRef.current.setColorAt(i, b.c);
    });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    POOLS.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, 0.1 + i * 0.0005, p.z), q, new THREE.Vector3(p.r, p.r, 1));
      poolRef.current.setMatrixAt(i, m);
    });
    for (const r of [glassRef, metalRef, bulbRef, poolRef]) {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, [bulbs]);

  // gentle sway for the hanging lanterns
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    LANTERNS.forEach((l, i) => {
      if (!l.sway) return;
      const a = Math.sin(t * 0.9 + i * 1.7) * 0.08;
      tmp.e.set(Math.sin(t * 0.7 + i) * 0.04, 0, a);
      tmp.q.setFromEuler(tmp.e);
      // pivot around the hook ~0.45m above
      tmp.p.set(-Math.sin(a) * 0.45 * l.scale, 0, 0).add(l.pos);
      tmp.s.setScalar(l.scale);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      glassRef.current.setMatrixAt(i, tmp.m);
      metalRef.current.setMatrixAt(i, tmp.m);
    });
    glassRef.current.instanceMatrix.needsUpdate = true;
    metalRef.current.instanceMatrix.needsUpdate = true;
  });

  const poolMat = glowMats.pool;

  return (
    <group>
      <mesh geometry={wireGeom} material={toon('#2a2230', { key: 'wire' })} />
      <instancedMesh ref={glassRef} args={[glass, glowMats.bulb, LANTERNS.length]} />
      <instancedMesh ref={metalRef} args={[metal, toon('#5B4636', { key: 'brass' }), LANTERNS.length]} />
      <instancedMesh ref={bulbRef} args={[undefined, glowMats.bulb, bulbs.length]}>
        <sphereGeometry args={[0.045, 6, 4]} />
      </instancedMesh>
      <instancedMesh ref={poolRef} args={[undefined, poolMat, POOLS.length]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}
