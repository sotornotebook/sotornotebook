import type { NavigateFunction } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SHOPS, STOPS } from '../scene/layout';
import { categoryById, coverOf, productById, productsIn } from '../data/catalog';

// The router's navigate(), registered by <SceneDirector>. Lets code inside the
// R3F canvas (and plain modules) change routes without router hooks.
let navigateFn: NavigateFunction | null = null;
export const registerNavigate = (fn: NavigateFunction) => (navigateFn = fn);
const go: NavigateFunction = ((...args: Parameters<NavigateFunction>) => navigateFn?.(...(args as [never]))) as NavigateFunction;

// ------------------------------------------------------------------ alley walk
/** Scroll the alley (ScrollControls' scroll container) to an offset in 0..1. */
export function goToOffset(offset: number, smooth = true) {
  const el = useStore.getState().scrollEl;
  if (!el) return;
  el.scrollTo({ top: offset * (el.scrollHeight - el.clientHeight), behavior: smooth ? 'smooth' : 'auto' });
}

// quick repeated presses advance stop-by-stop instead of reading the still-moving position
let last = { target: 0, at: 0 };
export function step(dir: 1 | -1) {
  const live = useStore.getState().progress;
  const p = performance.now() - last.at < 1500 ? last.target : live;
  const next = dir > 0 ? STOPS.find((s) => s > p + 0.012) ?? 1 : [...STOPS].reverse().find((s) => s < p - 0.012) ?? 0;
  last = { target: next, at: performance.now() };
  goToOffset(next);
}

// ------------------------------------------------------------------- routing
/** Walk into a shop (category). */
export function visitShop(id: string) {
  if (id === 'workshop') {
    const s = useStore.getState();
    if (!s.lit) s.lightUp();
    goToOffset(1, false);
    s.setFocus('workshop');
    return;
  }
  const shop = SHOPS.find((x) => x.id === id);
  if (shop && useStore.getState().scene === 'alley') goToOffset(shop.offset, false);
  go(`/shop/${id}`, { state: { from: 'alley' } });
}

/** Leave the shop interior back to the alley (back-button friendly). */
export function exitShop(from?: string) {
  if (from === 'alley') go(-1);
  else go('/');
}

export function openProduct(id: string, opts: { replace?: boolean } = {}) {
  go(`/product/${id}`, { state: { from: 'shop' }, replace: opts.replace });
}

export function closeProduct(productId: string, from?: string) {
  const p = productById(productId);
  if (from === 'shop') go(-1);
  else go(p ? `/shop/${p.categoryId}` : '/', { state: { from: 'alley' } });
}

export const shopUrl = (id: string) => `/shop/${id}`;
export const productUrl = (id: string) => `/product/${id}`;

// ---------------------------------------------------------------- preloading
const preloaded = new Set<string>();
/** Warm up the interior chunk and the category's cover images (hover > 300ms). */
export function preloadShop(categoryId: string) {
  if (preloaded.has(categoryId) || !categoryById(categoryId)) return;
  preloaded.add(categoryId);
  void import('../scene/interior/Interior');
  for (const p of productsIn(categoryId)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = coverOf(p);
  }
}
