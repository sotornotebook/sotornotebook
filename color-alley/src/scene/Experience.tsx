import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor, Preload, ScrollControls } from '@react-three/drei';
import { Bloom, EffectComposer, HueSaturation, Vignette } from '@react-three/postprocessing';
import type { BloomEffect, HueSaturationEffect } from 'postprocessing';
import { easing } from 'maath';
import * as THREE from 'three';
import { Alley } from './Alley';
import { Shop } from './Shop';
import { Workshop } from './Workshop';
import { Cat } from './Cat';
import { Dust } from './Dust';
import { CameraRig } from './CameraRig';
import { StaticBatch } from './StaticBatch';
import { BLOCKS, FACADE_X, SHOPS, START_Z } from './layout';
import { BASE_GLOW, glowMats, world } from './materials';
import { PRODUCTS } from '../data/products';
import { useStore } from '../store/useStore';

const GRAY_FOG = new THREE.Color('#4d4a63');
const NIGHT_FOG = new THREE.Color('#1E2A5A');
const DIM = new THREE.Color('#5a5870');

/**
 * Animates the "light up the alley" transition and owns the 4 real lights:
 * hemisphere (sky), directional (moon), a warm point light that walks with
 * the visitor, and a point light on the nearest/focused shop.
 * Everything else glowing is emissive + bloom.
 */
function LitDriver({ bloom, hue }: { bloom: React.RefObject<BloomEffect>; hue: React.RefObject<HueSaturationEffect> }) {
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const walker = useRef<THREE.PointLight>(null!);
  const shopLight = useRef<THREE.PointLight>(null!);
  const scene = useThree((s) => s.scene);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera }, dt) => {
    const { lit, nearShop } = useStore.getState();
    world.lit = THREE.MathUtils.damp(world.lit, lit ? 1 : 0, 1.4, dt);
    const L = world.lit;

    glowMats.bulb.color.copy(DIM).lerp(BASE_GLOW.bulb, L);
    glowMats.lanternGlass.color.copy(DIM).lerp(BASE_GLOW.lanternGlass, L);
    glowMats.interior.color.copy(DIM).multiplyScalar(0.6).lerp(BASE_GLOW.interior, L);
    glowMats.pool.opacity = 0.55 * L;

    if (scene.fog) (scene.fog as THREE.Fog).color.copy(GRAY_FOG).lerp(NIGHT_FOG, L);
    hemi.current.intensity = 0.75 + L * 0.55;
    hemi.current.color.copy(tmp.set('#9a98ad')).lerp(tmp.set('#8C9BE8'), L);
    hemi.current.groundColor.set('#3a3040').lerp(tmp.set('#7A4A2E'), L);

    walker.current.intensity = 12 * L;
    walker.current.position.set(camera.position.x, 3.2, camera.position.z - 3.2);

    const s = SHOPS.find((x) => x.id === nearShop);
    if (s) shopLight.current.position.set(s.side * (FACADE_X - 2.4), 3.0, s.z + 1.2);
    easing.damp(shopLight.current, 'intensity', s ? 7 * L : 0, 0.3, dt);

    if (bloom.current) bloom.current.intensity = 0.15 + L * 1.1;
    if (hue.current) hue.current.saturation = -0.9 + L * 1.0;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#9a98ad', '#3a3040', 0.75]} />
      <directionalLight position={[9, 36, -60]} intensity={0.55} color="#B9C8FF" />
      <pointLight ref={walker} color="#FFB45A" intensity={0} distance={16} decay={2} />
      <pointLight ref={shopLight} color="#FFC870" intensity={0} distance={9} decay={2} />
    </>
  );
}

/** Dev-only handle for profiling (renderer.info) from the console / tests. */
function DevHandle() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene });
  return null;
}

function Scene({ low }: { low: boolean }) {
  const bloom = useRef<BloomEffect>(null);
  const hue = useRef<HueSaturationEffect>(null);
  return (
    <>
      <color attach="background" args={['#1E2A5A']} />
      <fog attach="fog" args={['#4d4a63', 10, 52]} />
      <DevHandle />
      <LitDriver bloom={bloom} hue={hue} />
      <Environment resolution={32} frames={1}>
        <Lightformer intensity={1.2} color="#FFC870" position={[0, 5, -6]} scale={[10, 3, 1]} />
        <Lightformer intensity={0.6} color="#4b5fb8" position={[0, 8, 6]} scale={[10, 6, 1]} />
      </Environment>

      <ScrollControls pages={9} damping={0.28} distance={1}>
        <CameraRig />
      </ScrollControls>

      <Suspense fallback={null}>
        {/* everything static is merged into one mesh per material (see StaticBatch) */}
        <StaticBatch>
          <Alley />
          {SHOPS.map((slot) => (
            <Shop key={slot.id} slot={slot} product={PRODUCTS[slot.index]} block={BLOCKS.find((b) => b.shop?.id === slot.id)!} />
          ))}
          <Workshop />
        </StaticBatch>
        <Cat />
        <Dust count={low ? 120 : 260} />
        <Preload all />
      </Suspense>

      <EffectComposer multisampling={low ? 0 : 4}>
        <Bloom ref={bloom as never} mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.15} radius={0.75} />
        <HueSaturation ref={hue as never} saturation={-0.9} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </>
  );
}

export default function Experience() {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, 1.75));
  const [low, setLow] = useState(() => window.innerWidth < 768);
  return (
    <Canvas
      className="!fixed inset-0"
      flat
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 58, near: 0.1, far: 200, position: [0, 1.6, START_Z] }}
      aria-label="3D alley"
    >
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.75))}
        onDecline={() => {
          setDpr(1);
          setLow(true);
        }}
        flipflops={3}
        onFallback={() => setDpr(0.85)}
      >
        <AdaptiveDpr pixelated />
        <Scene low={low} />
      </PerformanceMonitor>
    </Canvas>
  );
}
