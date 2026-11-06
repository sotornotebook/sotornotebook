import { useStore, useT, cartCount } from '../store/useStore';
import { categoryById, CATEGORIES, type Category } from '../data/catalog';
import type { Lang } from '../data/i18n';
import { useLocation } from 'react-router-dom';
import { SHOPS } from '../scene/layout';
import { exitShop, goToOffset } from './nav';
import { setAmbient } from './audio';

export function Logo({ className = '' }: { className?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-9 w-9 drop-shadow-[0_0_10px_rgba(242,169,59,.7)]" aria-hidden="true">
        <path d="M32 6l9 9H23z" fill="#F2A93B" />
        <rect x="22" y="15" width="20" height="4" rx="2" fill="#F2A93B" />
        <path d="M22 19h20l-3 26H25z" fill="#FFE3A3" />
        <path d="M28 19v26M36 19v26" stroke="#F2A93B" strokeWidth="2" />
        <path d="M25 45h14l-4 7h-6z" fill="#F2A93B" />
        <circle cx="32" cy="32" r="5" fill="#F06C5B" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-xl text-gold sm:text-2xl">{t.brand}</div>
        <div className="hidden font-body text-[11px] text-cream/70 sm:block">{t.brandSub}</div>
      </div>
    </div>
  );
}

export function CartButton() {
  const t = useT();
  const count = useStore((s) => cartCount(s.cart));
  const setCartOpen = useStore((s) => s.setCartOpen);
  return (
    <button className="btn-icon relative" onClick={() => setCartOpen(true)} aria-label={`${t.cart} (${count})`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 7h14l-1.5 12h-11z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-cream" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}

export function LangButton() {
  const t = useT();
  const toggleLang = useStore((s) => s.toggleLang);
  return (
    <button className="btn-icon w-auto px-3 font-body text-sm font-bold" onClick={toggleLang} lang={t.langToggle === 'English' ? 'en' : 'ar'}>
      {t.langToggle}
    </button>
  );
}

export function SoundButton() {
  const t = useT();
  const soundOn = useStore((s) => s.soundOn);
  const toggle = useStore((s) => s.toggleSound);
  return (
    <button
      className="btn-icon"
      aria-pressed={soundOn}
      aria-label={soundOn ? t.muteOff : t.muteOn}
      title={soundOn ? t.muteOff : t.muteOn}
      onClick={() => {
        setAmbient(!soundOn);
        toggle();
      }}
    >
      {soundOn ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9z" />
          <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9z" />
          <path d="M17 9l5 6M22 9l-5 6" />
        </svg>
      )}
    </button>
  );
}

function ProgressBar() {
  const t = useT();
  const progress = useStore((s) => s.progress);
  const lang = useStore((s) => s.lang);
  const pct = Math.round(progress * 100);
  return (
    <div className="pointer-events-auto relative mx-auto mt-2 h-2 w-full max-w-md" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="absolute inset-0 rounded-full bg-cream/15" />
      <div className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-glow to-gold transition-[width] duration-150" style={{ width: `${pct}%` }} />
      {SHOPS.map((s) => (
        <button
          key={s.id}
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-navy bg-teal hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow"
          style={{ [lang === 'ar' ? 'right' : 'left']: `calc(${s.offset * 100}% - 6px)` }}
          onClick={() => goToOffset(s.offset)}
          aria-label={catName(categoryById(s.id)!, lang)}
          tabIndex={-1}
        />
      ))}
    </div>
  );
}

export const catName = (c: Category, lang: Lang) => (lang === 'ar' ? c.nameAr : c.nameEn);

export function Header({ onView2D }: { onView2D: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const nearShop = useStore((s) => s.nearShop);
  const lit = useStore((s) => s.lit);
  const progress = useStore((s) => s.progress);
  const scene = useStore((s) => s.scene);
  const sceneCategory = useStore((s) => s.sceneCategory);
  const location = useLocation();
  const inside = scene === 'interior' && sceneCategory ? categoryById(sceneCategory) : null;

  const nearCat = categoryById(nearShop);
  const here = inside
    ? catName(inside, lang)
    : nearShop === 'workshop'
      ? t.workshopName
      : nearCat
        ? catName(nearCat, lang)
        : progress < 0.04
          ? t.alleyEntrance
          : t.walking;
  const idx = CATEGORIES.findIndex((c) => c.id === (inside?.id ?? nearShop));
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-navy/90 via-navy/50 to-transparent px-3 pb-6 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="pointer-events-auto">
          <Logo />
        </div>
        {lit && (
          <div className="hidden min-w-0 flex-1 justify-center md:flex" aria-live="polite">
            <div className="truncate rounded-full border border-gold/40 bg-navy/70 px-4 py-1.5 font-body text-sm backdrop-blur">
              <span className="text-cream/70">{inside ? t.insideAt : t.youAreAt} </span>
              <span className="font-display text-base text-glow">{here}</span>
              {idx >= 0 && <span className="ms-2 text-xs text-cream/50">({t.shopOf(idx + 1, CATEGORIES.length)})</span>}
            </div>
          </div>
        )}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {inside ? (
            <button className="btn-gold px-4 py-2 text-base" onClick={() => exitShop(from)} aria-label={t.exitToAlley}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
              </svg>
              <span className="hidden sm:inline">{t.exitToAlley}</span>
            </button>
          ) : (
            <button className="btn-icon hidden w-auto px-3 font-body text-xs sm:inline-flex" onClick={onView2D}>
              {t.view2D}
            </button>
          )}
          <LangButton />
          <SoundButton />
          <CartButton />
        </div>
      </div>
      {lit && (
        <>
          <div className="mt-2 text-center md:hidden" aria-hidden="true">
            <span className="rounded-full bg-navy/70 px-3 py-1 font-body text-xs">
              <span className="text-cream/70">{inside ? t.insideAt : t.youAreAt} </span>
              <span className="font-display text-sm text-glow">{here}</span>
            </span>
          </div>
          {!inside && <ProgressBar />}
        </>
      )}
    </header>
  );
}
