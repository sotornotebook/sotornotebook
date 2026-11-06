import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP = ['position', 'normal', 'uv'];

/**
 * Static batching: after mount, merges every plain (non-instanced, single
 * material, non-text) mesh in its subtree into one mesh per material, and
 * hides the originals. Cuts hundreds of draw calls down to a handful.
 * Mark a subtree with userData.noBatch to leave it alone (animated parts,
 * lazily-swapped content).
 * The wrapper group must not carry a transform of its own.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const src = useRef<THREE.Group>(null!);
  const [merged, setMerged] = useState<THREE.Mesh[]>([]);

  useLayoutEffect(() => {
    const root = src.current;
    root.updateWorldMatrix(true, true);
    const inv = root.matrixWorld.clone().invert();
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const used: THREE.Mesh[] = [];
    const m4 = new THREE.Matrix4();

    const visit = (o: THREE.Object3D) => {
      if (o.userData.noBatch) return;
      const mesh = o as THREE.Mesh;
      const ok =
        mesh.isMesh &&
        !(mesh as THREE.InstancedMesh).isInstancedMesh &&
        !Array.isArray(mesh.material) &&
        !('text' in mesh) && // troika Text
        mesh.geometry?.attributes?.position;
      if (ok) {
        let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.clearGroups();
        g = g.applyMatrix4(m4.multiplyMatrices(inv, mesh.matrixWorld));
        const mat = mesh.material as THREE.Material;
        if (!buckets.has(mat)) buckets.set(mat, []);
        buckets.get(mat)!.push(g);
        used.push(mesh);
      }
      o.children.forEach(visit);
    };
    root.children.forEach(visit);

    const out: THREE.Mesh[] = [];
    buckets.forEach((geoms, mat) => {
      const g = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
      if (!g) return;
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      m.matrixAutoUpdate = false;
      out.push(m);
    });
    used.forEach((m) => {
      m.visible = false;
      m.raycast = () => {};
    });
    setMerged(out);
    return () => {
      used.forEach((m) => {
        m.visible = true;
        m.raycast = THREE.Mesh.prototype.raycast;
      });
      out.forEach((m) => m.geometry.dispose());
    };
  }, []);

  return (
    <>
      <group ref={src}>{children}</group>
      {merged.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  );
}
