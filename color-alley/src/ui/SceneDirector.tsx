import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { categoryById, productById } from '../data/catalog';
import { DICT } from '../data/i18n';
import { useStore } from '../store/useStore';
import { registerNavigate } from './nav';
import { titleOf } from './whatsapp';

/** Parse the URL into the 3-level state: alley / shop interior / product detail. */
export function useRoute() {
  const { pathname } = useLocation();
  const shop = pathname.match(/^\/shop\/([^/]+)\/?$/)?.[1];
  const prod = pathname.match(/^\/product\/([^/]+)\/?$/)?.[1];
  const product = productById(prod ? decodeURIComponent(prod) : null);
  const category = product ? categoryById(product.categoryId) : categoryById(shop ? decodeURIComponent(shop) : null);
  const valid = pathname === '/' || !!category;
  return { categoryId: category?.id ?? null, productId: product?.id ?? null, valid };
}

let timers: number[] = [];
const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

/**
 * Keeps the 3D world in sync with the URL and plays the transitions:
 *  alley → shop:  walk to the door (1s, doors swing open), fade, swap to the interior
 *  shop → alley:  fade, swap back, walk back out of the same door
 *  deep links start directly inside (history is seeded so Back still steps out a level).
 */
export function SceneDirector() {
  const navigate = useNavigate();
  const { categoryId, productId, valid } = useRoute();
  const { pathname } = useLocation();
  const first = useRef(true);
  const lang = useStore((s) => s.lang);
  registerNavigate(navigate);

  // Seed history for deep links: "/" ← "/shop/x" ← "/product/y"
  useLayoutEffect(() => {
    if (!valid) return void navigate('/', { replace: true });
    const state = window.history.state?.usr as { from?: string } | null;
    if (state?.from || !categoryId) return;
    navigate('/', { replace: true });
    navigate(`/shop/${categoryId}`, { state: { from: 'alley' } });
    if (productId) navigate(`/product/${productId}`, { state: { from: 'shop' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!valid) navigate('/', { replace: true });
  }, [valid, navigate]);

  // product detail → camera leans toward it inside the shop
  useEffect(() => {
    useStore.getState().set({ detailId: productId });
  }, [productId]);

  // page title per level
  useEffect(() => {
    const t = DICT[lang];
    const p = productById(productId);
    const c = categoryById(categoryId);
    document.title = p ? `${titleOf(p, lang)} | ${t.brand}` : c ? `${lang === 'ar' ? c.nameAr : c.nameEn} | ${t.brand}` : `${t.brand} — ${t.brandSub}`;
  }, [productId, categoryId, lang, pathname]);

  // scene transitions
  useEffect(() => {
    const s = useStore.getState();
    clearTimers();
    const isFirst = first.current;
    first.current = false;

    if (s.view === '2d') {
      s.set({ scene: categoryId ? 'interior' : 'alley', sceneCategory: categoryId, entering: null, fade: false });
      return;
    }
    if (categoryId) {
      if (s.scene === 'interior' && s.sceneCategory === categoryId) return;
      if (isFirst || s.scene !== 'alley') {
        // deep link, or switching from one shop to another
        if (isFirst) {
          s.set({ lit: true, fade: true, focus: null, scene: 'interior', sceneCategory: categoryId, entering: null });
          return;
        }
        s.set({ fade: true, focus: null });
        later(350, () => useStore.getState().set({ scene: 'interior', sceneCategory: categoryId, entering: null }));
        return;
      }
      // walk in from the alley
      if (!s.lit) s.lightUp();
      s.set({ entering: categoryId, focus: null, cartOpen: false });
      later(620, () => useStore.getState().set({ fade: true }));
      later(1050, () => useStore.getState().set({ scene: 'interior', sceneCategory: categoryId, entering: null }));
    } else if (s.scene === 'interior') {
      // walk back out to the same spot in the alley
      const from = s.sceneCategory;
      s.set({ fade: true });
      later(320, () => useStore.getState().set({ scene: 'alley', sceneCategory: null, returnFrom: from }));
    } else if (s.entering) {
      s.set({ entering: null, fade: false });
    }
  }, [categoryId]);

  return null;
}

/** Black fade between the alley and an interior, with a swinging lantern while the room loads. */
export function Transition() {
  const fade = useStore((s) => s.fade);
  const t = DICT[useStore((s) => s.lang)];
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-[#140d0a] transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!fade}
      role="status"
    >
      {fade && (
        <div className="flex flex-col items-center gap-3 motion-safe:animate-[fadeIn_.6s_ease-in]">
          <svg viewBox="0 0 64 80" className="h-20 w-16 origin-top drop-shadow-[0_0_24px_rgba(242,169,59,.9)] motion-safe:animate-[lantern-swing_1.6s_ease-in-out_infinite]" aria-hidden="true">
            <path d="M32 0v8" stroke="#F2A93B" strokeWidth="2" />
            <path d="M32 8l11 11H21z" fill="#F2A93B" />
            <path d="M21 21h22l-4 32H25z" fill="#FFE3A3" />
            <path d="M28 21v32M36 21v32" stroke="#F2A93B" strokeWidth="2" />
            <path d="M25 53h14l-4 8h-6z" fill="#F2A93B" />
          </svg>
          <span className="font-display text-lg text-glow">{t.loading}</span>
        </div>
      )}
    </div>
  );
}
