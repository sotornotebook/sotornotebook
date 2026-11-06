import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsIn, sortedCategories } from '../data/catalog';
import { useStore, useT } from '../store/useStore';
import { CartButton, LangButton, Logo, catName } from './Header';
import { ProductCard } from './ProductCard';
import { SignupForm } from './SignupForm';
import { shopUrl } from './nav';

/** Simple scrolling page with the same shops (categories) and products, for no-WebGL / reduced motion. */
export function Fallback2D({ canUse3D, onView3D, categoryId }: { canUse3D: boolean; onView3D: () => void; categoryId: string | null }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const cats = sortedCategories();

  // /shop/:id in 2D → scroll to that shop's section
  useEffect(() => {
    if (categoryId) document.getElementById(`shop-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [categoryId]);

  return (
    <div className="min-h-full bg-navy bg-[radial-gradient(ellipse_at_top,rgba(242,169,59,.18),transparent_60%)]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-cream/10 bg-navy/90 px-4 py-3 backdrop-blur sm:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {canUse3D && (
            <button className="btn-icon w-auto px-3 font-body text-xs" onClick={onView3D}>
              {t.view3D}
            </button>
          )}
          <LangButton />
          <CartButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <section className="py-10 text-center">
          <h1 className="font-display text-4xl text-gold sm:text-5xl">{t.welcomeSign}</h1>
          <p className="mx-auto mt-3 max-w-xl font-body text-lg text-cream/80">{t.fallbackIntro}</p>
          <nav aria-label={t.shopsNav} className="mt-6 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <Link key={c.id} to={shopUrl(c.id)} className="rounded-full px-4 py-1.5 font-body text-sm font-bold text-navy" style={{ background: c.wallColor }}>
                {catName(c, lang)}
              </Link>
            ))}
          </nav>
        </section>

        {cats.map((c) => (
          <section key={c.id} id={`shop-${c.id}`} className="mb-12 scroll-mt-24" aria-labelledby={`h-${c.id}`}>
            <div className="mb-4 flex items-end justify-between gap-3 border-b-4 pb-2" style={{ borderColor: c.wallColor }}>
              <div>
                <h2 id={`h-${c.id}`} className="font-display text-3xl text-cream">
                  {catName(c, lang)}
                </h2>
                <p className="font-body text-sm text-cream/70">{lang === 'ar' ? c.taglineAr : c.taglineEn}</p>
              </div>
              <span className="font-body text-sm text-cream/60">{t.productsCount(productsIn(c.id).length)}</span>
            </div>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {productsIn(c.id).map((p) => (
                <li key={p.id}>
                  <ProductCard p={p} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-14 rounded-3xl bg-cream p-6 text-navy sm:p-10" aria-labelledby="ws-title">
          <p className="font-body text-teal">🏮 {t.workshopName}</p>
          <h2 id="ws-title" className="font-display text-3xl">
            {t.workshopTeaser}
          </h2>
          <p className="mb-6 mt-2 max-w-2xl font-body text-navy/80">{t.workshopBody}</p>
          <SignupForm />
        </section>
      </main>
    </div>
  );
}
