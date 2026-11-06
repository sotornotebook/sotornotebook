import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { coverOf, isPurchasable, type Product } from '../data/catalog';
import { useStore, useT } from '../store/useStore';
import { formatPrice } from './format';
import { productUrl } from './nav';
import { quoteLink, titleOf } from './whatsapp';

export function Price({ p, big = false }: { p: Product; big?: boolean }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  if (p.quoteOnly) return <span className={`font-display ${big ? 'text-2xl' : 'text-lg'} text-navy`}>{t.requestQuote}</span>;
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-display ${big ? 'text-3xl' : 'text-xl'} text-navy`}>{formatPrice(p.price, lang)}</span>
      {p.compareAtPrice && p.compareAtPrice > p.price && (
        <s className={`font-body ${big ? 'text-base' : 'text-xs'} text-navy/45`} aria-label={`${formatPrice(p.compareAtPrice, lang)}`}>
          {formatPrice(p.compareAtPrice, lang)}
        </s>
      )}
    </span>
  );
}

export function Badges({ p }: { p: Product }) {
  const t = useT();
  return (
    <>
      {p.isNew && p.inStock && <span className="rounded-full bg-coral px-2 py-0.5 font-body text-[11px] font-bold text-cream">{t.newBadge}</span>}
      {!p.inStock && <span className="rounded-full bg-dhallam px-2 py-0.5 font-body text-[11px] font-bold text-cream">{t.comingSoon}</span>}
    </>
  );
}

/** Product card: image + title + price + the right buy action. Clicking opens the detail page. */
export function ProductCard({ p, compact = false, replace = false }: { p: Product; compact?: boolean; replace?: boolean }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const addToCart = useStore((s) => s.addToCart);
  const location = useLocation();
  const [added, setAdded] = useState(false);
  const linkState = replace ? location.state : { from: 'shop' };

  return (
    <article className={`group flex ${compact ? 'gap-3' : 'flex-col'} overflow-hidden rounded-2xl bg-white/80 text-navy shadow-md ring-1 ring-navy/5`}>
      <Link to={productUrl(p.id)} replace={replace} state={linkState} className={`relative block shrink-0 overflow-hidden bg-cream ${compact ? 'w-24' : ''}`}>
        <img src={coverOf(p)} alt={titleOf(p, lang)} width={600} height={800} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute start-2 top-2 flex gap-1">
          <Badges p={p} />
        </span>
      </Link>
      <div className={`flex min-w-0 flex-1 flex-col ${compact ? 'py-2 pe-3' : 'p-3'}`}>
        <Link to={productUrl(p.id)} replace={replace} state={linkState} className="font-display text-lg leading-tight hover:text-coral">
          {titleOf(p, lang)}
        </Link>
        <p className="mt-0.5 font-body text-xs text-navy/60">
          {t.ageRange(p.ageMin, p.ageMax)}
          {p.pages ? ` · ${t.pagesCount(p.pages)}` : ''}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <Price p={p} />
          {isPurchasable(p) ? (
            <button
              className="btn-gold px-3 py-1.5 text-sm"
              onClick={() => {
                addToCart(p.id);
                setAdded(true);
              }}
            >
              {added ? t.added : t.addToCart}
            </button>
          ) : p.quoteOnly ? (
            <a className="btn px-3 py-1.5 text-sm ring-2 ring-teal text-teal" href={quoteLink(p, lang)} target="_blank" rel="noopener noreferrer">
              {t.requestQuote}
            </a>
          ) : (
            <Link className="btn px-3 py-1.5 text-sm ring-2 ring-dhallam text-dhallam" to={productUrl(p.id)} replace={replace} state={linkState}>
              {t.notifyMe}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
