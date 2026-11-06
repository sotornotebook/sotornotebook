import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { categoryById, isPurchasable, productById, relatedTo } from '../data/catalog';
import { useStore, useT } from '../store/useStore';
import { Dialog } from './Dialog';
import { FlipBook, Gallery } from './Gallery';
import { Badges, Price, ProductCard } from './ProductCard';
import { SignupForm } from './SignupForm';
import { formatNumber } from './format';
import { catName } from './Header';
import { closeProduct } from './nav';
import { buyNowLink, quoteLink, titleOf } from './whatsapp';

/** Level 3: full product page as an RTL modal over the shop interior (or the 2D page). */
export function ProductDetail({ productId }: { productId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const p = productById(productId)!;
  const cat = categoryById(p.categoryId)!;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [notify, setNotify] = useState(false);
  const [flip, setFlip] = useState(false);
  const [copied, setCopied] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const close = () => closeProduct(p.id, from);

  useEffect(() => {
    setQty(1);
    setAdded(false);
    setNotify(false);
    scroller.current?.scrollTo({ top: 0 });
  }, [productId]);

  const share = async () => {
    const url = `${location.pathname.startsWith('/product') ? window.location.origin : ''}/product/${p.id}`;
    const data = { title: titleOf(p, lang), text: `${titleOf(p, lang)} — ${t.brand}`, url: new URL(url, window.location.origin).href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  const specs: [string, string][] = [
    [t.age, t.ageRange(p.ageMin, p.ageMax)],
    ...(p.pages ? ([[t.pages, t.pagesCount(p.pages)]] as [string, string][]) : []),
    ...(p.size ? ([[t.size, p.size]] as [string, string][]) : []),
    ...(p.paper ? ([[t.paper, p.paper]] as [string, string][]) : []),
    ...(p.binding ? ([[t.binding, p.binding]] as [string, string][]) : []),
  ];
  const contents = lang === 'en' && p.contentsEn ? p.contentsEn : p.contents;
  const related = relatedTo(p);

  return (
    <Dialog open onClose={close} labelledBy="pd-title" className="fixed inset-0 z-50 flex items-stretch justify-center bg-navy/55 backdrop-blur-sm md:items-center md:p-6">
      <div className="absolute inset-0" onClick={close} aria-hidden="true" />
      <div ref={scroller} className="panel relative flex h-full w-full max-w-6xl flex-col overflow-y-auto motion-safe:animate-[fadeIn_.25s_ease-out] md:h-auto md:max-h-[92vh] md:rounded-3xl">
        {/* top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur md:px-6">
          <button className="flex min-w-0 items-center gap-1 font-body text-sm text-teal hover:underline" onClick={close}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <span className="truncate">
              {t.backToShop}: {catName(cat, lang)}
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button className="rounded-full px-3 py-2 font-body text-sm text-navy hover:bg-navy/10" onClick={share}>
              {copied ? t.linkCopied : `↗ ${t.share}`}
            </button>
            <button className="rounded-full p-2 text-navy/70 hover:bg-navy/10" onClick={close} aria-label={t.close}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-4 md:grid-cols-2 md:gap-10 md:p-8">
          <div>
            <Gallery images={p.images} />
            {p.samplePages && p.samplePages.length > 0 && (
              <button className="btn mt-3 w-full border-2 border-navy/15 text-navy hover:bg-navy/5" onClick={() => setFlip(true)}>
                📖 {t.flipBook}
              </button>
            )}
          </div>

          <div className="font-body">
            <div className="flex flex-wrap gap-1.5">
              <Badges p={p} />
            </div>
            <h2 id="pd-title" className="mt-1 font-display text-3xl leading-tight text-navy md:text-4xl" lang="ar" dir="rtl">
              {p.titleAr}
            </h2>
            <p className="mt-1 text-sm text-navy/60" lang="en" dir="ltr">
              {p.titleEn}
            </p>
            <div className="mt-4">
              <Price p={p} big />
              {p.compareAtPrice && p.compareAtPrice > p.price && (
                <span className="ms-3 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal">{t.save(`${formatNumber(p.compareAtPrice - p.price, lang)} ${t.currency}`)}</span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl bg-white/60 p-4 text-sm ring-1 ring-navy/5">
              {specs.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-navy/60">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-5 font-display text-xl">{t.story}</h3>
            <p className="mt-1 leading-relaxed text-navy/85">{lang === 'ar' ? p.descriptionAr : p.descriptionEn}</p>

            {contents && contents.length > 0 && (
              <>
                <h3 className="mt-4 font-display text-xl">{t.inTheBox}</h3>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-navy/85">
                  {contents.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}

            {p.characters && p.characters.length > 0 && (
              <>
                <h3 className="mt-4 font-display text-xl">{t.characters}</h3>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {p.characters.map((c) => (
                    <li key={c} className="rounded-full bg-gold/20 px-3 py-1 text-sm font-bold text-navy">
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* buy box */}
            <div className="mt-6 rounded-2xl bg-white/70 p-4 ring-1 ring-navy/10">
              {isPurchasable(p) ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm text-navy/60">{t.quantity}</span>
                    <div className="flex items-center gap-1" role="group" aria-label={t.quantity}>
                      <button className="h-9 w-9 rounded-full bg-navy/10 font-bold hover:bg-navy/20" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t.decrease}>
                        −
                      </button>
                      <output className="w-10 text-center text-lg font-bold" aria-live="polite">
                        {formatNumber(qty, lang)}
                      </output>
                      <button className="h-9 w-9 rounded-full bg-navy/10 font-bold hover:bg-navy/20" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label={t.increase}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className="btn-gold flex-1"
                      onClick={() => {
                        addToCart(p.id, qty);
                        setAdded(true);
                      }}
                    >
                      {added ? t.added : t.addToCart}
                    </button>
                    <a className="btn flex-1 bg-[#25D366] text-white hover:brightness-105" href={buyNowLink(p, qty, lang)} target="_blank" rel="noopener noreferrer">
                      {t.buyWhatsapp}
                    </a>
                  </div>
                  {added && (
                    <button className="mt-2 w-full text-sm text-teal underline" onClick={() => setCartOpen(true)}>
                      {t.cart}
                    </button>
                  )}
                </>
              ) : p.quoteOnly ? (
                <a className="btn w-full bg-[#25D366] text-white hover:brightness-105" href={quoteLink(p, lang)} target="_blank" rel="noopener noreferrer">
                  {t.requestQuote}
                </a>
              ) : notify ? (
                <SignupForm compact interest={p.id} message={`${t.notifyMe}: ${titleOf(p, lang)}`} />
              ) : (
                <button className="btn w-full bg-dhallam text-cream hover:brightness-110" onClick={() => setNotify(true)}>
                  🔔 {t.notifyMe}
                </button>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="border-t border-navy/10 p-4 md:p-8" aria-labelledby="related-title">
            <h3 id="related-title" className="mb-3 font-display text-2xl">
              {t.youMayLike}
            </h3>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {related.map((r) => (
                <li key={r.id}>
                  {/* replace: browsing related items doesn't stack history, so Back still exits to the shop */}
                  <ProductCard p={r} replace />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {flip && p.samplePages && <FlipBook pages={p.samplePages} title={titleOf(p, lang)} onClose={() => setFlip(false)} />}
    </Dialog>
  );
}
