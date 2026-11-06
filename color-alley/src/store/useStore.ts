import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DICT, type Lang } from '../data/i18n';
import { productById } from '../data/products';

export type CartLine = { id: string; qty: number };
export type ViewMode = '3d' | '2d';
/** 'workshop' is the end-of-alley sign-up dialog; any other string is a product id */
export type Focus = string | null;

interface State {
  lang: Lang;
  view: ViewMode;
  lit: boolean;
  soundOn: boolean;
  /** 0..1 position along the alley (mirrors the scroll offset) */
  progress: number;
  /** id of the shop currently in front of the visitor */
  nearShop: string | null;
  /** shop/workshop the camera is focused on (panel open) */
  focus: Focus;
  cartOpen: boolean;
  cart: CartLine[];
  scrollEl: HTMLElement | null;

  setLang: (l: Lang) => void;
  toggleLang: () => void;
  setView: (v: ViewMode) => void;
  lightUp: () => void;
  toggleSound: () => void;
  setProgress: (p: number) => void;
  setNearShop: (id: string | null) => void;
  setFocus: (f: Focus) => void;
  setCartOpen: (o: boolean) => void;
  addToCart: (id: string) => void;
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
      progress: 0,
      nearShop: null,
      focus: null,
      cartOpen: false,
      cart: [],
      scrollEl: null,

      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'ar' ? 'en' : 'ar' }),
      setView: (view) => set({ view }),
      lightUp: () => set({ lit: true }),
      toggleSound: () => set({ soundOn: !get().soundOn }),
      setProgress: (progress) => set({ progress }),
      setNearShop: (nearShop) => set({ nearShop }),
      setFocus: (focus) => set({ focus }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      addToCart: (id) => {
        const cart = get().cart;
        const line = cart.find((l) => l.id === id);
        set({
          cart: line
            ? cart.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
            : [...cart, { id, qty: 1 }],
        });
      },
      setQty: (id, qty) =>
        set({
          cart:
            qty <= 0
              ? get().cart.filter((l) => l.id !== id)
              : get().cart.map((l) => (l.id === id ? { ...l, qty } : l)),
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
      // Drop lines for products that no longer exist.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          lang: p.lang === 'en' ? 'en' : 'ar',
          cart: (p.cart ?? []).filter((l) => productById(l.id) && l.qty > 0),
        };
      },
    },
  ),
);

/** Translation hook */
export const useT = () => DICT[useStore((s) => s.lang)];

export const cartCount = (cart: CartLine[]) => cart.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (cart: CartLine[]) =>
  cart.reduce((n, l) => n + (productById(l.id)?.price ?? 0) * l.qty, 0);
