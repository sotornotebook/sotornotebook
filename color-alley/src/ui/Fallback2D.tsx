import { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useStore, useT } from '../store/useStore';
import { formatPrice } from './format';
import { CartButton, LangButton, Logo } from './Header';
import { SignupForm } from './SignupForm';

/** Simple scrolling page with the same shops as cards (no WebGL / reduced motion). */
export function Fallback2D({ canUse3D, onView3D }: { canUse3D: boolean; onView3D: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const addToCart = useStore((s) => s.addToCart);
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-navy bg-[radial-gradient(ellipse_at_top,rgba(242,169,59,.18),transparent_60%)]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-cream/10 bg-navy/90 px-4 py-3 backdrop-blur sm:px-8">
        <Logo />
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
        </section>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <li key={p.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-cream text-navy shadow-xl" aria-labelledby={`card-${p.id}`}>
                <div className="px-4 pt-3 text-center font-display text-lg text-cream" style={{ background: p.accent }}>
                  {p.sign[lang]}
                </div>
                <img src={p.cover} alt={p.title[lang]} width={600} height={800} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                <div className="flex flex-1 flex-col p-4">
                  <h2 id={`card-${p.id}`} className="font-display text-xl leading-tight">
                    {p.title[lang]}
                  </h2>
                  <p className="mt-1 font-body text-sm text-navy/60">
                    {p.age[lang]} · {p.pages[lang]}
                  </p>
                  <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-navy/80">{p.description[lang]}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-display text-2xl">{formatPrice(p.price, lang)}</span>
                    <button
                      className="btn-gold px-4 py-2 text-base"
                      onClick={() => {
                        addToCart(p.id);
                        setAdded(p.id);
                      }}
                    >
                      {added === p.id ? t.added : t.addToCart}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

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
