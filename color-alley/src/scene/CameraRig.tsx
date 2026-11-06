import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { ALLEY_LEN, FACADE_X, SHOPS, STOP_AHEAD, WORKSHOP_Z } from './layout';
import { PATH } from './path';
import { useStore } from '../store/useStore';
import { setPortalShift } from './htmlPortal';

const PANEL_W = 440;
const WALK_IN = 1.0; // seconds
const WALK_OUT = 1.1;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bezier = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number, out: THREE.Vector3) =>
  out.set(0, 0, 0).addScaledVector(a, (1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

interface Tween {
  kind: 'in' | 'out';
  /** walk position to resume at (walk-out) */
  offset?: number;
  t0: number;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  l0: THREE.Vector3;
  l1: THREE.Vector3;
}

/**
 * Drives the camera from the ScrollControls offset along a CatmullRom spline,
 * with head-bob, idle sway, pointer parallax, a glance at each shop, the
 * walk-through-the-door tween into a shop and the walk-back-out tween.
 */
export function CameraRig() {
  const scroll = useScroll();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const setScrollEl = useStore((s) => s.setScrollEl);
  const tween = useRef<Tween | null>(null);

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

  useEffect(() => {
    setScrollEl(scroll.el);
    scroll.el.setAttribute('aria-hidden', 'true');
    scroll.el.tabIndex = -1;
    scroll.el.style.touchAction = 'pan-y';
    // Walking is locked until the lanterns are lit, while a panel is open and during the door walk.
    const apply = (s: { lit: boolean; focus: string | null; entering: string | null }) => {
      scroll.el.style.overflowY = s.lit && !s.focus && !s.entering ? 'auto' : 'hidden';
    };
    apply(useStore.getState());
    const unsub = useStore.subscribe(apply);

    // Coming back out of a shop: restore the walk position in front of it and
    // play the "walk back out of the door" tween.
    const { returnFrom } = useStore.getState();
    const shop = SHOPS.find((s) => s.id === returnFrom);
    if (shop) {
      scroll.offset = shop.offset;
      const top = () => (scroll.el.scrollTop = shop.offset * (scroll.el.scrollHeight - scroll.el.clientHeight));
      top();
      requestAnimationFrame(() => requestAnimationFrame(top)); // after ScrollControls' first-run guard
      const p0 = new THREE.Vector3(shop.side * (FACADE_X + 0.5), 1.5, shop.z);
      camera.position.copy(p0);
      v.look.set(-shop.side * 4, 1.6, shop.z);
      tween.current = {
        kind: 'out',
        offset: shop.offset,
        t0: -1,
        p0,
        p1: new THREE.Vector3(shop.side * (FACADE_X - 1.8), 1.6, shop.z + 0.6),
        p2: PATH.getPointAt(shop.offset, new THREE.Vector3()),
        l0: v.look.clone(),
        l1: PATH.getPointAt(Math.min(shop.offset + 0.05, 1), new THREE.Vector3()).setY(1.7),
      };
    }
    // the fade overlay lifts once the alley has rendered a frame
    requestAnimationFrame(() => useStore.getState().set({ fade: false }));

    // Walking into a shop
    const unsubEnter = useStore.subscribe((s, prev) => {
      if (s.entering && s.entering !== prev.entering) {
        const target = SHOPS.find((x) => x.id === s.entering)!;
        tween.current = {
          kind: 'in',
          t0: -1,
          p0: camera.position.clone(),
          p1: new THREE.Vector3(target.side * (FACADE_X - 1.7), 1.6, target.z + 0.3),
          p2: new THREE.Vector3(target.side * (FACADE_X + 0.6), 1.5, target.z),
          l0: v.look.clone(),
          l1: new THREE.Vector3(target.side * (FACADE_X + 4), 1.45, target.z),
        };
      }
    });
    return () => {
      unsub();
      unsubEnter();
      setScrollEl(null);
    };
  }, [scroll, setScrollEl, camera, v]);

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

    // ---- door tweens take over the camera completely
    const tw = tween.current;
    if (tw) {
      if (tw.t0 < 0) tw.t0 = time;
      const k = Math.min((time - tw.t0) / (tw.kind === 'in' ? WALK_IN : WALK_OUT), 1);
      const e = ease(k);
      bezier(tw.p0, tw.p1, tw.p2, e, camera.position);
      camera.position.y += Math.sin(e * Math.PI * 4) * 0.025; // footsteps
      v.look.lerpVectors(tw.l0, tw.l1, ease(Math.min(k * 1.6, 1)));
      camera.lookAt(v.look);
      if (camera.view?.enabled) camera.clearViewOffset();
      setPortalShift(0, 0);
      if (k >= 1) {
        tween.current = null;
        if (tw.kind === 'out' && tw.offset !== undefined) {
          // ScrollControls ignores the first scroll after mounting: re-sync it now
          scroll.offset = tw.offset;
          scroll.el.scrollTop = tw.offset * (scroll.el.scrollHeight - scroll.el.clientHeight);
          scroll.el.dispatchEvent(new Event('scroll'));
          useStore.getState().set({ returnFrom: null });
        }
        walk.current.prev = scroll.offset;
      }
      return;
    }

    if (focus === 'workshop') {
      v.pos.set(0, 1.8, WORKSHOP_Z + 8.2);
      v.lookTarget.set(0, 3.0, WORKSHOP_Z);
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
      v.lookTarget.lerp(v.end, THREE.MathUtils.smoothstep(t, 0.9, 1) * 0.6);

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

    // Shift the frame so the workshop isn't hidden behind its side panel.
    const { width, height } = state.size;
    const mobile = width < 768;
    const tx = focus && !mobile ? (lang === 'ar' ? PANEL_W / 2 : -PANEL_W / 2) : 0;
    const ty = focus && mobile ? height * 0.24 : 0;
    v.view.x = THREE.MathUtils.damp(v.view.x, tx, 4, dt);
    v.view.y = THREE.MathUtils.damp(v.view.y, ty, 4, dt);
    const shifted = Math.abs(v.view.x) > 0.5 || Math.abs(v.view.y) > 0.5;
    if (shifted) camera.setViewOffset(width, height, v.view.x, v.view.y, width, height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    setPortalShift(shifted ? v.view.x : 0, shifted ? v.view.y : 0);

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
