import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { coverOf, type Product } from '../data/catalog';

const CELL_W = 384;
const CELL_H = 512;

/**
 * Loads the covers of `products` and packs them into ONE canvas atlas
 * (one GPU upload per room). Each product gets a cloned Texture that shares
 * the same image source, with its own offset/repeat into the atlas.
 * Suspends while the images load.
 */
export function useCoverAtlas(products: Product[]) {
  const urls = useMemo(() => products.map(coverOf), [products]);
  const images = useLoader(THREE.ImageLoader, urls) as HTMLImageElement[];

  return useMemo(() => {
    const n = images.length;
    const cols = Math.min(n, 8);
    const rows = Math.ceil(n / cols);
    const c = document.createElement('canvas');
    c.width = cols * CELL_W;
    c.height = rows * CELL_H;
    const g = c.getContext('2d')!;
    images.forEach((img, i) => g.drawImage(img, (i % cols) * CELL_W, Math.floor(i / cols) * CELL_H, CELL_W, CELL_H));
    const base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.anisotropy = 4;
    const map = new Map<string, THREE.Texture>();
    products.forEach((p, i) => {
      const t = base.clone();
      t.repeat.set(1 / cols, 1 / rows);
      t.offset.set((i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows);
      t.needsUpdate = true;
      map.set(p.id, t);
    });
    return map;
  }, [images, products]);
}
