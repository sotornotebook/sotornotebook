import { useLayoutEffect, useMemo, useRef } from 'react';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BLOCKS, BLOCK_DEPTH, ENTRANCE_Z, FACADE_X, WINDOWS, type Block } from './layout';
import { latticeTex, radialTex, toon } from './materials';
import { archFrame, archSolid, extrude, useSignFont } from './shapes';
import { useT } from '../store/useStore';
import { Floor } from './Floor';
import { Lanterns } from './Lanterns';

/** Night sky dome with a soft navy gradient. */
function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#0E1638') },
          mid: { value: new THREE.Color('#1E2A5A') },
          bottom: { value: new THREE.Color('#3B3F72') },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
          void main(){ float h = vP.y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.8, h)) : mix(bottom, mid, smoothstep(-0.1, 0.15, h)); gl_FragColor = vec4(c,1.0); }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[140, 24, 12]} />
    </mesh>
  );
}

function Moon() {
  return (
    <group position={[9, 36, -100]}>
      <mesh>
        <sphereGeometry args={[4.2, 20, 14]} />
        <meshBasicMaterial color={new THREE.Color('#FFF3D6').multiplyScalar(1.6)} toneMapped={false} fog={false} />
      </mesh>
      <sprite scale={[26, 26, 1]}>
        <spriteMaterial map={radialTex} color="#FFE3A3" transparent opacity={0.28} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/** Instanced mashrabiya windows: lit (warm) and dark sets = 2 draw calls. */
function Mashrabiyas() {
  const litRef = useRef<THREE.InstancedMesh>(null!);
  const darkRef = useRef<THREE.InstancedMesh>(null!);
  const lit = useMemo(() => WINDOWS.filter((w) => w.lit), []);
  const dark = useMemo(() => WINDOWS.filter((w) => !w.lit), []);
  const mats = useMemo(() => {
    const warm = latticeTex('#FFB54A');
    const night = latticeTex('#1b2142');
    const wood = toon('#6B4027', { key: 'mash-wood' });
    // front face (+Z local) shows the lattice; the rest is wood
    const litFront = new THREE.MeshBasicMaterial({ map: warm, toneMapped: false });
    litFront.color.setScalar(1.25);
    const darkFront = new THREE.MeshToonMaterial({ map: night });
    return { lit: [wood, wood, wood, wood, litFront, wood], dark: [wood, wood, wood, wood, darkFront, wood], litFront };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const set = (ref: THREE.InstancedMesh, list: typeof WINDOWS) => {
      list.forEach((w, i) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), w.side === 1 ? -Math.PI / 2 : Math.PI / 2);
        m.compose(new THREE.Vector3(...w.pos), q, one);
        ref.setMatrixAt(i, m);
      });
      ref.instanceMatrix.needsUpdate = true;
      ref.computeBoundingSphere();
    };
    set(litRef.current, lit);
    set(darkRef.current, dark);
  }, [lit, dark]);

  return (
    <group>
      <instancedMesh ref={litRef} args={[undefined, mats.lit, lit.length]}>
        <boxGeometry args={[1.0, 1.45, 0.26]} />
      </instancedMesh>
      <instancedMesh ref={darkRef} args={[undefined, mats.dark, dark.length]}>
        <boxGeometry args={[1.0, 1.45, 0.26]} />
      </instancedMesh>
    </group>
  );
}

/** A single building block on one side of the alley. Shop blocks only get a recessed body; Shop.tsx adds the facade. */
function Building({ b }: { b: Block }) {
  const d = BLOCK_DEPTH - 0.12;
  const body = b.shop ? 1.3 : 0;
  const door = useMemo(() => extrude(archSolid(1.05, 1.55), 0.08), []);
  const doorFrame = useMemo(() => extrude(archFrame(1.5, 2.35, 1.05, 1.55), 0.1), []);
  const wallMat = toon(b.color);
  const trimMat = toon('#F3E2C4', { key: 'trim' });
  return (
    <group position={[b.side * FACADE_X, 0, b.z]}>
      {/* main body */}
      <mesh position={[b.side * (2 + body), b.height / 2, 0]} material={wallMat}>
        <boxGeometry args={[4, b.height, d]} />
      </mesh>
      {/* roof parapet */}
      <mesh position={[b.side * 1.9, b.height + 0.15, 0]} material={trimMat}>
        <boxGeometry args={[4.2, 0.3, d + 0.05]} />
      </mesh>
      {/* floor band */}
      <mesh position={[b.side * 0.03, 3.35, 0]} material={trimMat}>
        <boxGeometry args={[0.12, 0.14, d]} />
      </mesh>
      {!b.shop && (
        <>
          {/* plinth */}
          <mesh position={[b.side * 0.02, 0.25, 0]} material={toon('#8E7462', { key: 'plinth' })}>
            <boxGeometry args={[0.1, 0.5, d]} />
          </mesh>
          {/* arched wooden door with stone frame */}
          <group rotation-y={b.side === 1 ? -Math.PI / 2 : Math.PI / 2} position={[0, 0, 0.6 * b.side]}>
            <mesh geometry={doorFrame} material={trimMat} position={[0, 0, 0]} />
            <mesh geometry={door} material={toon('#6B3F2A', { key: 'door' })} position={[0, 0, -0.02]} />
            {/* little ground-floor window */}
            <mesh position={[-1.7 * b.side, 1.7, 0.03]} material={toon('#2C2F4E', { key: 'gw' })}>
              <boxGeometry args={[0.7, 0.8, 0.06]} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}

/** Welcome arch at the alley entrance with the hanging sign. */
function EntranceArch() {
  const t = useT();
  const font = useSignFont();
  const geom = useMemo(() => extrude(archFrame(FACADE_X * 2 + 1.4, 7.2, FACADE_X * 2 - 0.2, 3.0), 0.7, true), []);
  const stone = toon('#CDB291', { key: 'arch' });
  const band = toon('#A8553F', { key: 'ablaq' });
  return (
    <group position={[0, 0, ENTRANCE_Z]}>
      <mesh geometry={geom} material={stone} position={[0, 0, -0.35]} />
      {/* ablaq stripes on the pillars */}
      {[0.8, 1.6, 2.4].flatMap((y) =>
        [-1, 1].map((k) => (
          <mesh key={`${y}${k}`} position={[k * (FACADE_X + 0.4), y, 0.37]} material={band}>
            <boxGeometry args={[0.8, 0.22, 0.03]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 6.75, 0.37]} material={band}>
        <boxGeometry args={[FACADE_X * 2 + 1.42, 0.22, 0.03]} />
      </mesh>
      {/* crenellations */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-3.6 + i * 0.9, 7.4, 0]} material={stone}>
          <boxGeometry args={[0.45, 0.4, 0.6]} />
        </mesh>
      ))}
      {/* chains */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, 5.35, 0.1]} material={toon('#3a2e2a', { key: 'chain' })}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
        </mesh>
      ))}
      {/* sign board */}
      <group position={[0, 4.35, 0.1]}>
        <mesh material={toon('#F2A93B', { key: 'sign-border' })}>
          <boxGeometry args={[4.5, 0.95, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={toon('#1E2A5A', { key: 'sign-navy' })}>
          <boxGeometry args={[4.3, 0.78, 0.02]} />
        </mesh>
        <Text font={font} fontSize={0.46} position={[0, 0.02, 0.07]} anchorX="center" anchorY="middle" color="#FFE3A3" outlineWidth={0.012} outlineColor="#8a4b10" direction="auto">
          {t.welcomeSign}
        </Text>
      </group>
    </group>
  );
}

export function Alley() {
  return (
    <group>
      <Sky />
      <Moon />
      <Stars radius={110} depth={20} count={1200} factor={5} saturation={0} fade speed={0.4} />
      <Floor />
      {BLOCKS.map((b) => (
        <Building key={`${b.side}:${b.z}`} b={b} />
      ))}
      <EntranceArch />
      <Mashrabiyas />
      <Lanterns />
    </group>
  );
}
