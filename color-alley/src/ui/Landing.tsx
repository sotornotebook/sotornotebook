import { useEffect, useState } from 'react';
import { useStore, useT } from '../store/useStore';

/** Intro card over the grey alley + the "نوّر الحارة" button; then a short walk hint. */
export function Landing() {
  const t = useT();
  const lit = useStore((s) => s.lit);
  const lightUp = useStore((s) => s.lightUp);
  const progress = useStore((s) => s.progress);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!lit) return;
    setHint(true);
    const id = setTimeout(() => setHint(false), 7000);
    return () => clearTimeout(id);
  }, [lit]);

  if (lit) {
    return hint && progress < 0.03 ? (
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-4" aria-live="polite">
        <div className="flex items-center gap-3 rounded-full bg-navy/75 px-5 py-3 font-body text-cream shadow-lantern backdrop-blur motion-safe:animate-bounce">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
          <span>
            {t.walkHint}
            <span className="hidden sm:inline"> · {t.walkHintKeys}</span>
          </span>
        </div>
      </div>
    ) : null;
  }

  return (
    <section className="fixed inset-0 z-20 flex items-end justify-center p-4 pb-[max(env(safe-area-inset-bottom),2rem)] sm:items-center" aria-labelledby="intro-title">
      <div className="max-w-md rounded-3xl border border-cream/10 bg-[#2b2940]/80 p-6 text-center shadow-2xl backdrop-blur-md sm:mt-40">
        <h1 id="intro-title" className="font-display text-3xl text-cream sm:text-4xl">
          {t.introTitle}
        </h1>
        <p className="mt-3 font-body leading-relaxed text-cream/80">{t.introBody}</p>
        <button className="btn-gold animate-lantern mt-5 px-8 py-3.5 text-2xl" onClick={lightUp} autoFocus>
          🏮 {t.lightUp}
        </button>
      </div>
    </section>
  );
}
