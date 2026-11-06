import { coverOf, productById } from '../data/catalog';
import { cartTotal, useStore, useT } from '../store/useStore';
import { Dialog } from './Dialog';
import { formatNumber, formatPrice } from './format';
import { orderLink, titleOf } from './whatsapp';

/** Cart drawer. Checkout opens WhatsApp with the order pre-filled. */
export function Cart() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const total = cartTotal(cart);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} labelledBy="cart-title" className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="panel relative ms-auto flex h-full w-full max-w-sm flex-col">
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl">
            {t.cart}
          </h2>
          <button className="rounded-full p-2 text-navy/70 hover:bg-navy/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60" onClick={() => setOpen(false)} aria-label={t.close}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <p className="mt-8 text-center font-body text-navy/70">{t.cartEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((l) => {
                const p = productById(l.id)!;
                return (
                  <li key={l.id} className="flex gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-navy/5">
                    <img src={coverOf(p)} alt="" width={60} height={80} className="h-20 w-[60px] rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-lg leading-tight">{titleOf(p, lang)}</div>
                      <div className="font-body text-xs text-navy/60">{t.ageRange(p.ageMin, p.ageMax)}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1" role="group" aria-label={titleOf(p, lang)}>
                          <button className="h-8 w-8 rounded-full bg-navy/10 font-bold hover:bg-navy/20" onClick={() => setQty(l.id, l.qty - 1)} aria-label={t.decrease}>
                            −
                          </button>
                          <span className="w-8 text-center font-bold" aria-live="polite">
                            {formatNumber(l.qty, lang)}
                          </span>
                          <button className="h-8 w-8 rounded-full bg-navy/10 font-bold hover:bg-navy/20" onClick={() => setQty(l.id, l.qty + 1)} aria-label={t.increase}>
                            +
                          </button>
                        </div>
                        <span className="font-bold">{formatPrice(p.price * l.qty, lang)}</span>
                      </div>
                      <button className="mt-1 font-body text-xs text-coral underline" onClick={() => remove(l.id)}>
                        {t.remove}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-navy/10 px-5 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-body text-navy/70">{t.total}</span>
            <span className="font-display text-3xl">{formatPrice(total, lang)}</span>
          </div>
          <a
            href={cart.length ? orderLink(cart, lang) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!cart.length}
            className={`btn w-full bg-[#25D366] text-white hover:brightness-105 ${cart.length ? '' : 'pointer-events-none opacity-50'}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.2z" />
            </svg>
            {t.checkout}
          </a>
        </div>
      </div>
    </Dialog>
  );
}
