import { useEffect, useRef, useState } from 'react';
import type { ProductImage } from '../data/catalog';
import { useStore, useT } from '../store/useStore';
import { Dialog } from './Dialog';

/** Horizontal swipe helper. RTL: swiping right goes to the next item. */
function useSwipe(onNext: () => void, onPrev: () => void, onTap?: () => void) {
  const rtl = useStore((s) => s.lang) === 'ar';
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => (start.current = { x: e.clientX, y: e.clientY }),
    onPointerUp: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx > 0) === rtl ? onNext() : onPrev();
      else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) onTap?.();
    },
  };
}

const Arrow = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d={dir === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

/** Main image + thumbnails, swipeable; tap opens the fullscreen lightbox. */
export function Gallery({ images }: { images: ProductImage[] }) {
  const t = useT();
  const rtl = useStore((s) => s.lang) === 'ar';
  const [i, setI] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const n = images.length;
  const next = () => setI((x) => (x + 1) % n);
  const prev = () => setI((x) => (x - 1 + n) % n);
  const swipe = useSwipe(next, prev, () => setLightbox(true));
  useEffect(() => setI(0), [images]);
  const img = images[i];

  return (
    <section aria-label={t.gallery} className="select-none">
      <div className="relative overflow-hidden rounded-2xl bg-cream ring-1 ring-navy/10" style={{ touchAction: 'pan-y' }} {...swipe}>
        <img key={img.src} src={img.src} alt={img.alt} className="mx-auto aspect-[3/4] max-h-[60vh] w-full cursor-zoom-in object-contain motion-safe:animate-[fadeIn_.25s_ease-out]" draggable={false} />
        <span className="absolute bottom-2 start-2 rounded-full bg-navy/70 px-2 py-0.5 font-body text-xs text-cream">
          {t.imageKinds[img.kind]} · {i + 1}/{n}
        </span>
        <button className="absolute end-2 top-2 rounded-full bg-navy/70 p-2 text-cream" onClick={() => setLightbox(true)} aria-label={t.fullscreen}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
        {n > 1 && (
          <>
            <button className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-cream/90 p-2 text-navy shadow" onClick={prev} aria-label={t.prevImage}>
              <Arrow dir={rtl ? 'r' : 'l'} />
            </button>
            <button className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-cream/90 p-2 text-navy shadow" onClick={next} aria-label={t.nextImage}>
              <Arrow dir={rtl ? 'l' : 'r'} />
            </button>
          </>
        )}
      </div>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {images.map((im, k) => (
          <li key={im.src} className="shrink-0">
            <button
              onClick={() => setI(k)}
              aria-label={`${t.imageKinds[im.kind]} ${k + 1}`}
              aria-current={k === i}
              className={`block overflow-hidden rounded-lg ring-2 transition ${k === i ? 'ring-gold' : 'ring-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={im.src} alt="" loading="lazy" className="h-16 w-14 object-cover" draggable={false} />
            </button>
          </li>
        ))}
      </ul>
      {lightbox && <Lightbox images={images} index={i} onIndex={setI} onClose={() => setLightbox(false)} />}
    </section>
  );
}

/** Fullscreen viewer: click/double-tap to zoom, wheel zoom, pinch-zoom, drag to pan, swipe to change image. */
export function Lightbox({ images, index, onIndex, onClose }: { images: ProductImage[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const t = useT();
  const rtl = useStore((s) => s.lang) === 'ar';
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ d0: number; s0: number; x0: number; y0: number; px: number; py: number; moved: boolean } | null>(null);
  const n = images.length;
  const go = (d: number) => {
    onIndex((index + d + n) % n);
    setZ({ s: 1, x: 0, y: 0 });
  };
  const clamp = (v: { s: number; x: number; y: number }) => ({ s: Math.min(5, Math.max(1, v.s)), x: v.s <= 1 ? 0 : v.x, y: v.s <= 1 ? 0 : v.y });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(rtl ? 1 : -1);
      if (e.key === 'ArrowRight') go(rtl ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const down = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const d0 = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { d0, s0: z.s, x0: z.x, y0: z.y, px: e.clientX, py: e.clientY, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length > 1 && g.d0) {
      g.moved = true;
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setZ((v) => clamp({ ...v, s: (g.s0 * d) / g.d0 }));
    } else if (z.s > 1) {
      const dx = e.clientX - g.px;
      const dy = e.clientY - g.py;
      if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
      setZ((v) => clamp({ ...v, x: g.x0 + dx, y: g.y0 + dy }));
    }
  };
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g || pointers.current.size) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (!g.moved && z.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go((dx > 0) === rtl ? 1 : -1);
    else if (!g.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) {
      // tap: toggle zoom around the tap point
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - (r.left + r.width / 2);
      const cy = e.clientY - (r.top + r.height / 2);
      setZ((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: -cx * 1.5, y: -cy * 1.5 }));
    }
    gesture.current = null;
  };
  const img = images[index];

  return (
    <Dialog open onClose={onClose} labelledBy="lightbox-title" className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-cream">
      <div className="flex items-center justify-between p-3">
        <h2 id="lightbox-title" className="font-body text-sm">
          {img.alt} · {index + 1}/{n}
        </h2>
        <button className="rounded-full bg-white/10 p-2 hover:bg-white/20" onClick={onClose} aria-label={t.close}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div
        className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={(e) => setZ((v) => clamp({ ...v, s: v.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15) }))}
      >
        <img
          src={img.src}
          alt={img.alt}
          draggable={false}
          className={`max-h-full max-w-full object-contain transition-transform duration-100 ${z.s > 1 ? 'cursor-grab' : 'cursor-zoom-in'}`}
          style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})` }}
        />
        {n > 1 && (
          <>
            <button className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25" onPointerDown={(e) => e.stopPropagation()} onClick={() => go(-1)} aria-label={t.prevImage}>
              <Arrow dir={rtl ? 'r' : 'l'} />
            </button>
            <button className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25" onPointerDown={(e) => e.stopPropagation()} onClick={() => go(1)} aria-label={t.nextImage}>
              <Arrow dir={rtl ? 'l' : 'r'} />
            </button>
          </>
        )}
      </div>
      <p className="p-2 text-center font-body text-xs text-cream/60">{t.zoomHint}</p>
    </Dialog>
  );
}

/** "قلّب في الكتاب": a simple page-flip viewer for the sample colouring pages. */
export function FlipBook({ pages, title, onClose }: { pages: string[]; title: string; onClose: () => void }) {
  const t = useT();
  const rtl = useStore((s) => s.lang) === 'ar';
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState<null | { dir: 1 | -1; from: number }>(null);
  const n = pages.length;
  const turn = (dir: 1 | -1) => {
    const to = i + dir;
    if (flip || to < 0 || to >= n) return;
    setFlip({ dir, from: i });
    setI(to);
    window.setTimeout(() => setFlip(null), 650);
  };
  const swipe = useSwipe(
    () => turn(1),
    () => turn(-1),
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') turn(rtl ? 1 : -1);
      if (e.key === 'ArrowRight') turn(rtl ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Arabic books are bound on the right: the leaf turns around the right edge.
  const spineRight = rtl ? flip?.dir !== -1 : flip?.dir === -1;
  const anim = flip ? (spineRight ? 'flipFromLeft' : 'flipFromRight') : '';

  return (
    <Dialog open onClose={onClose} labelledBy="flip-title" className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-navy/95 p-4 text-cream">
      <div className="mb-3 flex w-full max-w-md items-center justify-between">
        <h2 id="flip-title" className="font-display text-xl">
          {t.flipBook} — {title}
        </h2>
        <button className="rounded-full bg-white/10 p-2 hover:bg-white/20" onClick={onClose} aria-label={t.close}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="relative aspect-[3/4] w-full max-w-md select-none [perspective:1600px]" style={{ touchAction: 'pan-y' }} {...swipe}>
        {/* the page underneath (destination) */}
        <img src={pages[i]} alt={`${title} — ${t.pageOf(i + 1, n)}`} draggable={false} className="absolute inset-0 h-full w-full rounded-md bg-white object-cover shadow-2xl" />
        <div className={`pointer-events-none absolute inset-y-0 w-6 from-black/25 to-transparent ${rtl ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'}`} />
        {/* the leaf turning away (previous page) */}
        {flip && (
          <div
            className="absolute inset-0 rounded-md [backface-visibility:hidden] [transform-style:preserve-3d]"
            style={{ transformOrigin: spineRight ? 'right center' : 'left center', animation: `${anim} .65s cubic-bezier(.4,.1,.3,1) forwards` }}
            aria-hidden="true"
          >
            <img src={pages[flip.from]} alt="" className="h-full w-full rounded-md bg-white object-cover" />
            <div className="absolute inset-0 rounded-md bg-gradient-to-l from-black/0 via-black/0 to-black/30" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4" dir="ltr">
        <button className="btn-icon h-12 w-12 disabled:opacity-30" onClick={() => turn(rtl ? 1 : -1)} disabled={rtl ? i >= n - 1 : i <= 0} aria-label={rtl ? t.nextPage : t.prevPage}>
          <Arrow dir="l" />
        </button>
        <span className="font-body text-sm" aria-live="polite">
          {t.pageOf(i + 1, n)}
        </span>
        <button className="btn-icon h-12 w-12 disabled:opacity-30" onClick={() => turn(rtl ? -1 : 1)} disabled={rtl ? i <= 0 : i >= n - 1} aria-label={rtl ? t.prevPage : t.nextPage}>
          <Arrow dir="r" />
        </button>
      </div>
    </Dialog>
  );
}
