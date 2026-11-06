import { useEffect, useRef, useState } from 'react';
import { productById } from '../data/products';
import { useStore, useT } from '../store/useStore';
import { Dialog } from './Dialog';
import { formatPrice } from './format';
import { leaveShop } from './nav';

/** Side panel (bottom sheet on mobile) for the focused shop's product. */
export function ProductPanel() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const focus = useStore((s) => s.focus);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const product = productById(focus);
  const [added, setAdded] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setAdded(false), [focus]);

  if (!product) return null;
  const titleId = `panel-title-${product.id}`;

  return (
    <Dialog
      open
      onClose={leaveShop}
      labelledBy={titleId}
      initialFocus={addRef}
      className="panel fixed inset-x-0 bottom-0 z-40 flex max-h-[62vh] flex-col overflow-hidden rounded-t-3xl motion-safe:animate-[slideUp_.35s_ease-out] md:inset-x-auto md:bottom-0 md:top-0 md:max-h-none md:w-[440px] md:rounded-none md:start-0 md:motion-safe:animate-[slideIn_.35s_ease-out]"
    >
      <style>{`
        @keyframes slideIn { from { transform: translateX(${lang === 'ar' ? '100%' : '-100%'}); } to { transform: none; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>
      <div className="flex items-center justify-between border-b border-navy/10 px-5 py-3">
        <span className="font-display text-lg text-coral">{product.sign[lang]}</span>
        <button className="rounded-full p-2 text-navy/70 hover:bg-navy/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60" onClick={leaveShop} aria-label={t.close}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="flex gap-4 md:block">
          <img
            src={product.cover}
            alt={product.title[lang]}
            width={600}
            height={800}
            className="w-28 shrink-0 rounded-lg shadow-lg ring-1 ring-navy/10 md:mx-auto md:mb-4 md:w-56"
          />
          <div>
            <h2 id={titleId} className="font-display text-2xl leading-tight text-navy md:text-3xl">
              {product.title[lang]}
            </h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-body text-sm">
              <dt className="text-navy/60">{t.age}</dt>
              <dd className="font-bold">{product.age[lang]}</dd>
              <dt className="text-navy/60">{t.pages}</dt>
              <dd className="font-bold">{product.pages[lang]}</dd>
            </dl>
          </div>
        </div>
        <p className="mt-4 font-body leading-relaxed text-navy/85">{product.description[lang]}</p>
        {product.contents && <p className="mt-2 font-body text-sm text-navy/60">{product.contents[lang]}</p>}
      </div>

      <div className="border-t border-navy/10 bg-white/60 px-5 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-body text-sm text-navy/60">{t.price}</span>
          <span className="font-display text-3xl text-navy">{formatPrice(product.price, lang)}</span>
        </div>
        <div className="flex gap-2">
          <button
            ref={addRef}
            className="btn-gold flex-1"
            onClick={() => {
              addToCart(product.id);
              setAdded(true);
            }}
          >
            {added ? t.added : t.addToCart}
          </button>
          <button className="btn flex-1 border-2 border-navy/20 text-navy hover:bg-navy/5" onClick={leaveShop}>
            {t.keepWalking}
          </button>
        </div>
        {added && (
          <button className="mt-2 w-full font-body text-sm text-teal underline" onClick={() => setCartOpen(true)}>
            {t.cart}
          </button>
        )}
      </div>
    </Dialog>
  );
}
