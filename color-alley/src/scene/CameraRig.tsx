import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { ALLEY_LEN, FACADE_X, SHOPS, STOP_AHEAD, WORKSHOP_Z } from './layout';
import { PATH } from './path';
import { useStore } from '../store/useStore';

const PANEL_W = 440;

/**
 * Drives the camera from the ScrollControls offset along a CatmullRom spline,
 * with head-bob while walking, gentle idle sway, pointer parallax,
 * and an eased "face the shop" pose when a shop is focused.
 */
export function CameraRig() {
  const scroll = useScroll();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const setScrollEl = useStore((s) => s.setScrollEl);

  useEffect(() => {
    setScrollEl(scroll.el);
    scroll.el.setAttribute('aria-hidden', 'true');
    scroll.el.tabIndex = -1;
    // allow horizontal drag gestures to reach our pointer handlers on touch screens
    scroll.el.style.touchAction = 'pan-y';
    // Walking is locked until the lanterns are lit, and while a shop panel is open.
    // (Programmatic scrollTo still works while overflow is hidden.)
    const apply = (s: { lit: boolean; focus: string | null }) => {
      scroll.el.style.overflowY = s.lit && !s.focus ? 'auto' : 'hidden';
    };
    apply(useStore.getState());
    const unsub = useStore.subscribe(apply);
    return () => {
      unsub();
      setScrollEl(null);
    };
  }, [scroll.el, setScrollEl]);

  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      look: new THREE.Vector3(0, 1.5, 0),
      lookTarget: new THREE.Vector3(),
      end: new THREE.Vector3(0, 2.4, WORKSHOP_Z),
      view: { x: 0, y: 0 },
    }),
    [],
  );
  const walk = useRef({ prev: 0, phase: 0, amt: 0, lastProgress: -1, lastNear: '' as string | null });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const { focus, setProgress, setNearShop, lang } = useStore.getState();
    const t = THREE.MathUtils.clamp(scroll.offset, 0, 1);
    const time = state.clock.elapsedTime;
    let roll = 0;
    const portrait = state.size.width < state.size.height;
    const fov = portrait ? 72 : 58;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (focus) {
      if (focus === 'workshop') {
        v.pos.set(0, 1.8, WORKSHOP_Z + 8.2);
        v.lookTarget.set(0, 3.0, WORKSHOP_Z);
      } else {
        const shop = SHOPS.find((s) => s.id === focus)!;
        v.pos.set(-shop.side * 2.3, 1.85, shop.z + 0.5);
        v.lookTarget.set(shop.side * FACADE_X, portrait ? 1.45 : 2.2, shop.z);
      }
      v.pos.y += Math.sin(time * 0.8) * 0.01;
    } else {
      PATH.getPointAt(t, v.pos);
      PATH.getPointAt(Math.min(t + 0.05, 1), v.ahead);
      // at the entrance, look up a little at the welcome sign
      const up = (1 - THREE.MathUtils.smoothstep(t, 0, 0.05)) * 1.1;
      v.lookTarget.set(v.ahead.x, 1.62 + up, v.ahead.z - (t > 0.96 ? 4 : 0));
      // glance toward the shop when standing at its stop
      let glance = 0;
      let glanceSide = 0;
      for (const s of SHOPS) {
        const w = 1 - THREE.MathUtils.smoothstep(Math.abs(v.pos.z - (s.z + STOP_AHEAD)), 0.3, 3.2);
        if (w > glance) {
          glance = w;
          glanceSide = s.side;
        }
      }
      v.lookTarget.x += glanceSide * glance * 1.5;
      v.lookTarget.y += glance * 0.3;
      // near the end, turn the gaze to the workshop
      const endBlend = THREE.MathUtils.smoothstep(t, 0.9, 1);
      v.lookTarget.lerp(v.end, endBlend * 0.6);

      // head-bob proportional to walking speed (m/s)
      const speed = (Math.abs(t - walk.current.prev) / Math.max(dt, 1e-4)) * ALLEY_LEN;
      walk.current.prev = t;
      walk.current.amt = THREE.MathUtils.damp(walk.current.amt, Math.min(speed / 2.2, 1), 6, dt);
      walk.current.phase += Math.min(speed, 4) * dt * 2.4;
      const a = walk.current.amt;
      v.pos.y += Math.sin(walk.current.phase * 2) * 0.04 * a + Math.sin(time * 0.8) * 0.012;
      v.pos.x += Math.sin(walk.current.phase) * 0.025 * a;
      roll = Math.sin(walk.current.phase) * 0.008 * a + Math.sin(time * 0.45) * 0.004;

      // pointer parallax (look around a little)
      v.lookTarget.x += state.pointer.x * 0.9;
      v.lookTarget.y += state.pointer.y * 0.45;
    }

    easing.damp3(camera.position, v.pos, focus ? 0.45 : 0.12, dt);
    easing.damp3(v.look, v.lookTarget, focus ? 0.4 : 0.18, dt);
    camera.lookAt(v.look);
    camera.rotateZ(roll);

    // Shift the frame so the focused shop isn't hidden behind the side panel.
    const { width, height } = state.size;
    const mobile = width < 768;
    const tx = focus && !mobile ? (lang === 'ar' ? PANEL_W / 2 : -PANEL_W / 2) : 0;
    const ty = focus && mobile ? height * 0.24 : 0;
    v.view.x = THREE.MathUtils.damp(v.view.x, tx, 4, dt);
    v.view.y = THREE.MathUtils.damp(v.view.y, ty, 4, dt);
    if (Math.abs(v.view.x) > 0.5 || Math.abs(v.view.y) > 0.5) {
      camera.setViewOffset(width, height, v.view.x, v.view.y, width, height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }

    // HUD state (only push to React when it actually changes)
    if (Math.abs(t - walk.current.lastProgress) > 0.004) {
      walk.current.lastProgress = t;
      setProgress(t);
    }
    let near: string | null = null;
    if (focus) near = focus;
    else if (t > 0.93) near = 'workshop';
    else {
      let best = 3.4;
      for (const s of SHOPS) {
        const d = Math.abs(camera.position.z - s.z - STOP_AHEAD);
        if (d < best) {
          best = d;
          near = s.id;
        }
      }
    }
    if (near !== walk.current.lastNear) {
      walk.current.lastNear = near;
      setNearShop(near);
    }
  });

  return null;
}
