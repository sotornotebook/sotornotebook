import { useEffect } from 'react';
import { useStore, useT } from '../store/useStore';
import { PRODUCTS } from '../data/products';
import { step, visitShop } from './nav';

/**
 * Walking controls: on-screen ← → buttons, keyboard arrows, and horizontal
 * drag/swipe (vertical scroll / swipe is handled natively by ScrollControls).
 * In Arabic (RTL) "forward" points left (←); in English it points right (→).
 */
export function Controls() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const lit = useStore((s) => s.lit);
  const focus = useStore((s) => s.focus);
  const scrollEl = useStore((s) => s.scrollEl);
  const rtl = lang === 'ar';

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if (!st.lit || st.focus || st.cartOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === 'ArrowUp' || e.key === fwd || e.key === 'PageDown' || (e.key === ' ' && !(e.target instanceof HTMLButtonElement))) {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowDown' || e.key === back || e.key === 'PageUp') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Enter' && st.nearShop && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement)) {
        visitShop(st.nearShop);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rtl]);

  // horizontal drag / swipe on the scroll surface
  useEffect(() => {
    if (!scrollEl) return;
    let x0 = 0;
    let y0 = 0;
    let top0 = 0;
    let dragging = false;
    let horizontal = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      horizontal = false;
      x0 = e.clientX;
      y0 = e.clientY;
      top0 = scrollEl.scrollTop;
    };
    const move = (e: PointerEvent) => {
      if (!dragging || useStore.getState().focus || !useStore.getState().lit) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (!horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) horizontal = true;
      // mouse: vertical drag also walks (touch gets native vertical scrolling)
      const mouseVertical = e.pointerType === 'mouse' && Math.abs(dy) > 12 && !horizontal;
      if (!horizontal && !mouseVertical) return;
      // RTL: swipe right = forward. LTR: swipe left = forward.
      const amount = horizontal ? (rtl ? dx : -dx) : -dy;
      scrollEl.scrollTop = top0 + amount * 2.2;
    };
    const up = () => (dragging = false);
    scrollEl.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      scrollEl.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [scrollEl, rtl]);

  if (!lit || focus) return null;

  const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      {dir === 'left' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
  // visual order is always [← , →]; meaning flips with direction
  const leftIsForward = rtl;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 pb-[max(env(safe-area-inset-bottom),1rem)]" dir="ltr">
      <button className="btn-icon h-14 w-14" onClick={() => step(leftIsForward ? 1 : -1)} aria-label={leftIsForward ? t.forward : t.back}>
        <Arrow dir="left" />
      </button>
      <span className="w-20" aria-hidden="true" />
      <button className="btn-icon h-14 w-14" onClick={() => step(leftIsForward ? -1 : 1)} aria-label={leftIsForward ? t.back : t.forward}>
        <Arrow dir="right" />
      </button>
    </div>
  );
}

/** Hidden-but-focusable list of every shop (keyboard / screen-reader access). */
export function A11yNav() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  return (
    <nav aria-label={t.shopsNav} className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:inset-x-3 focus-within:top-20 focus-within:z-50 focus-within:rounded-2xl focus-within:bg-cream focus-within:p-3 focus-within:text-navy focus-within:shadow-2xl">
      <h2 className="mb-2 font-display text-lg">{t.shopsNav}</h2>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            <button className="w-full rounded-lg px-3 py-2 text-start font-body hover:bg-navy/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold" onClick={() => visitShop(p.id)}>
              {t.visitShop} {p.sign[lang]} — {p.title[lang]}
            </button>
          </li>
        ))}
        <li>
          <button className="w-full rounded-lg px-3 py-2 text-start font-body hover:bg-navy/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold" onClick={() => visitShop('workshop')}>
            {t.visitShop} {t.workshopName}
          </button>
        </li>
      </ul>
    </nav>
  );
}
