import { useEffect, useMemo, useState } from 'react';
import { categoryById, productsIn, type Product, type ProductType } from '../data/catalog';
import { useStore, useT } from '../store/useStore';
import { ProductCard } from './ProductCard';
import { catName } from './Header';

type AgeKey = 'all' | 'small' | 'kids' | 'adults';
type PriceKey = 'all' | 0 | 1 | 2;

const AGE: Record<Exclude<AgeKey, 'all'>, [number, number]> = { small: [3, 6], kids: [7, 10], adults: [14, 99] };
const PRICE: [number, number][] = [
  [0, 99],
  [100, 250],
  [251, Infinity],
];
const ageOk = (p: Product, k: AgeKey) => k === 'all' || (p.ageMin <= AGE[k][1] && p.ageMax >= AGE[k][0]);
const priceOk = (p: Product, k: PriceKey) => k === 'all' || (!p.quoteOnly && p.price >= PRICE[k][0] && p.price <= PRICE[k][1]);

function Chips<K extends string | number>({ label, options, value, onChange }: { label: string; options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  if (options.length <= 2) return null; // "all" + a single option: nothing to filter
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 font-body text-xs font-bold text-navy/60">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.key)}
            type="button"
            aria-pressed={value === o.key}
            onClick={() => onChange(o.key)}
            className={`rounded-full px-3 py-1 font-body text-xs font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${value === o.key ? 'bg-navy text-cream' : 'bg-navy/10 text-navy hover:bg-navy/20'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * 2D list of the shop's products next to the 3D interior: fast browsing,
 * filters (age / price / type) and a fully accessible alternative to the shelves.
 * Docked on desktop, a collapsible bottom sheet on mobile.
 */
export function ShopDrawer({ categoryId }: { categoryId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const cat = categoryById(categoryId)!;
  const all = useMemo(() => productsIn(categoryId), [categoryId]);
  const [age, setAge] = useState<AgeKey>('all');
  const [price, setPrice] = useState<PriceKey>('all');
  const [type, setType] = useState<ProductType | 'all'>('all');
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    useStore.getState().set({ drawerOpen: open });
  }, [open]);
  useEffect(() => () => useStore.getState().set({ drawerOpen: false }), []);

  useEffect(() => {
    setAge('all');
    setPrice('all');
    setType('all');
  }, [categoryId]);

  const ageOpts = [{ key: 'all' as AgeKey, label: t.all }, ...(['small', 'kids', 'adults'] as const).filter((k) => all.some((p) => ageOk(p, k))).map((k) => ({ key: k as AgeKey, label: k === 'small' ? '٣–٦' : k === 'kids' ? '٧–١٠' : '+١٤' }))];
  const priceOpts = [{ key: 'all' as PriceKey, label: t.all }, ...([0, 1, 2] as const).filter((k) => all.some((p) => priceOk(p, k))).map((k) => ({ key: k as PriceKey, label: t.priceBuckets[k] }))];
  const typeOpts = [{ key: 'all' as const, label: t.all }, ...(['book', 'bundle', 'tool', 'gift'] as const).filter((k) => all.some((p) => p.type === k)).map((k) => ({ key: k, label: t.types[k] }))];
  const list = all.filter((p) => ageOk(p, age) && priceOk(p, price) && (type === 'all' || p.type === type));

  return (
    <aside
      aria-label={`${t.allProducts} — ${catName(cat, lang)}`}
      className={`panel fixed z-30 flex flex-col transition-transform duration-300 max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70vh] max-md:rounded-t-3xl md:bottom-4 md:end-4 md:top-24 md:w-[360px] md:rounded-3xl ${open ? '' : 'max-md:translate-y-[calc(100%_-_3.5rem)] md:translate-x-[calc(var(--dir)*(100%_-_3.5rem))]'}`}
      style={{ ['--dir' as string]: lang === 'ar' ? -1 : 1 }}
    >
      <button
        className="flex h-14 shrink-0 items-center justify-between gap-2 px-5 text-start focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 md:rounded-t-3xl"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="shop-drawer-list"
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-lg leading-tight">{t.allProducts}</span>
          <span className="block font-body text-xs text-navy/60">
            {catName(cat, lang)} · {t.productsCount(all.length)}
          </span>
        </span>
        <span className="rounded-full bg-navy/10 px-3 py-1 font-body text-xs font-bold">{open ? t.hideProducts : t.showProducts}</span>
      </button>
      <div id="shop-drawer-list" className={`flex min-h-0 flex-1 flex-col ${open ? '' : 'invisible'}`}>
        <div className="space-y-2 border-y border-navy/10 bg-white/50 px-5 py-3">
          <Chips label={t.filterAge} options={ageOpts} value={age} onChange={setAge} />
          <Chips label={t.filterPrice} options={priceOpts} value={price} onChange={setPrice} />
          <Chips label={t.filterType} options={typeOpts} value={type} onChange={setType} />
        </div>
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {list.length === 0 && <li className="py-6 text-center font-body text-sm text-navy/60">{t.noMatches}</li>}
          {list.map((p) => (
            <li key={p.id}>
              <ProductCard p={p} compact />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
