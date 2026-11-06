import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Shared "world" state read inside useFrame loops (no React re-renders).
// `lit` eases 0 → 1 after the visitor presses "نوّر الحارة".
// ---------------------------------------------------------------------------
export const world = {
  lit: 0,
  hoverShop: null as string | null,
};

// ---------------------------------------------------------------------------
// Toon shading: a soft 4-step gradient keeps the look friendly, not harsh.
// ---------------------------------------------------------------------------
const gradientMap = (() => {
  const data = new Uint8Array([120, 175, 225, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
})();

const toonCache = new Map<string, THREE.MeshToonMaterial>();
/** Cached toon material per colour so meshes share programs + uniforms. */
export function toon(color: string, extra?: THREE.MeshToonMaterialParameters & { key?: string }) {
  const key = color + (extra?.key ?? '');
  let m = toonCache.get(key);
  if (!m) {
    const { key: _k, ...params } = extra ?? {};
    void _k;
    m = new THREE.MeshToonMaterial({ color, gradientMap, ...params });
    toonCache.set(key, m);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Emissive "fake lights". Their brightness is driven by `world.lit`
// (see LitDriver in Experience.tsx). toneMapped:false + values > 1 → bloom.
// ---------------------------------------------------------------------------
export const glowMats = {
  /** lantern glass, bulbs etc. — colour comes from instanceColor */
  bulb: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
  lanternGlass: new THREE.MeshBasicMaterial({ color: '#FFC560', toneMapped: false }),
  interior: new THREE.MeshBasicMaterial({ color: '#FFB347', toneMapped: false }),
  pool: new THREE.MeshBasicMaterial({
    color: '#FFC870',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }),
};

export const BASE_GLOW = {
  bulb: new THREE.Color('#ffffff'),
  lanternGlass: new THREE.Color('#FFC560').multiplyScalar(2.4),
  interior: new THREE.Color('#FFB347').multiplyScalar(1.15),
};

// ---------------------------------------------------------------------------
// Canvas textures (generated at runtime, so no image downloads needed).
// ---------------------------------------------------------------------------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Mashrabiya lattice. Warm light shows through the gaps. */
export function latticeTex(bg: string) {
  return canvasTex(128, 192, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 128, 192);
    g.strokeStyle = '#5A3420';
    g.lineWidth = 7;
    const s = 21;
    for (let y = -s; y < 192 + s; y += s) {
      for (let x = -s; x < 128 + s; x += s) {
        g.beginPath();
        g.arc(x + ((y / s) % 2 ? s / 2 : 0), y, s / 2, 0, Math.PI * 2);
        g.stroke();
      }
    }
    g.lineWidth = 12;
    g.strokeRect(0, 0, 128, 192);
  });
}

/** Striped awning fabric */
export function stripeTex(a: string, b: string) {
  return canvasTex(128, 32, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(i * 16, 0, 16, 32);
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, 26, 128, 6);
  });
}

/** Grout/dirt under the cobblestones */
export const groundTex = (() => {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#3b3644';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${20 + Math.random() * 40},${20 + Math.random() * 30},${30 + Math.random() * 30},0.5)`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 30);
  return t;
})();

/** Soft radial gradient used for light pools, halos and dust. */
export const radialTex = canvasTex(128, 128, (g) => {
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
});

glowMats.pool.map = radialTex;
