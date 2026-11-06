import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DICT, type Lang } from '../data/i18n';
import { productById } from '../data/catalog';

export type CartLine = { id: string; qty: number };
export type ViewMode = '3d' | '2d';

interface State {
  lang: Lang;
  view: ViewMode;
  lit: boolean;
  soundOn: boolean;

  // ----- 3D scene state (driven by the router via SceneDirector) -----
  /** which world is rendered in the canvas */
  scene: 'alley' | 'interior';
  /** category whose interior is rendered */
  sceneCategory: string | null;
  /** product whose detail is open (camera leans towards it) */
  detailId: string | null;
  /** alley → door walk-in animation in progress for this shop */
  entering: string | null;
  /** the alley was just re-mounted after leaving this shop */
  returnFrom: string | null;
  /** black fade overlay between worlds */
  fade: boolean;
  /** the interior's product drawer is expanded (desktop: the 3D frame shifts aside) */
  drawerOpen: boolean;

  /** 0..1 position along the alley (mirrors the scroll offset) */
  progress: number;
  /** shop currently in front of the visitor */
  nearShop: string | null;
  /** 'workshop' when the end-of-alley sign-up is open */
  focus: string | null;
  cartOpen: boolean;
  cart: CartLine[];
  scrollEl: HTMLElement | null;

  set: (p: Partial<State>) => void;
  toggleLang: () => void;
  setView: (v: ViewMode) => void;
  lightUp: () => void;
  toggleSound: () => void;
  setProgress: (p: number) => void;
  setNearShop: (id: string | null) => void;
  setFocus: (f: string | null) => void;
  setCartOpen: (o: boolean) => void;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setScrollEl: (el: HTMLElement | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      view: '3d',
      lit: false,
      soundOn: false,
      scene: 'alley',
      sceneCategory: null,
      detailId: null,
      entering: null,
      returnFrom: null,
      fade: false,
      drawerOpen: false,
      progress: 0,
      nearShop: null,
      focus: null,
      cartOpen: false,
      cart: [],
      scrollEl: null,

      set: (p) => set(p),
      toggleLang: () => set({ lang: get().lang === 'ar' ? 'en' : 'ar' }),
      setView: (view) => set({ view }),
      lightUp: () => set({ lit: true }),
      toggleSound: () => set({ soundOn: !get().soundOn }),
      setProgress: (progress) => set({ progress }),
      setNearShop: (nearShop) => set({ nearShop }),
      setFocus: (focus) => set({ focus }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      addToCart: (id, qty = 1) => {
        const cart = get().cart;
        const line = cart.find((l) => l.id === id);
        set({
          cart: line ? cart.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...cart, { id, qty }],
        });
      },
      setQty: (id, qty) =>
        set({
          cart: qty <= 0 ? get().cart.filter((l) => l.id !== id) : get().cart.map((l) => (l.id === id ? { ...l, qty } : l)),
        }),
      removeFromCart: (id) => set({ cart: get().cart.filter((l) => l.id !== id) }),
      clearCart: () => set({ cart: [] }),
      setScrollEl: (scrollEl) => set({ scrollEl }),
    }),
    {
      name: 'color-alley',
      storage: createJSONStorage(() => localStorage),
      // Only the cart and language survive a reload.
      partialize: (s) => ({ cart: s.cart, lang: s.lang }),
      // Drop lines for products that no longer exist or can't be bought.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          lang: p.lang === 'en' ? 'en' : 'ar',
          cart: (p.cart ?? []).filter((l) => {
            const prod = productById(l.id);
            return prod && prod.inStock && !prod.quoteOnly && l.qty > 0;
          }),
        };
      },
    },
  ),
);

/** Translation hook */
export const useT = () => DICT[useStore((s) => s.lang)];

export const cartCount = (cart: CartLine[]) => cart.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (cart: CartLine[]) => cart.reduce((n, l) => n + (productById(l.id)?.price ?? 0) * l.qty, 0);
