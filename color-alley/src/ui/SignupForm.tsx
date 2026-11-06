import { useState } from 'react';
import { useStore, useT } from '../store/useStore';
import { Dialog } from './Dialog';
import { waLink } from './whatsapp';

const ENDPOINT = import.meta.env.VITE_SIGNUP_ENDPOINT;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s\-()]{8,16}$/;

/** Email / WhatsApp sign-up for the next book. Posts to VITE_SIGNUP_ENDPOINT, or falls back to WhatsApp. */
/** interest: what the visitor wants to hear about (default: the next museum book). */
export function SignupForm({ compact = false, interest = 'gem-adventure', message }: { compact?: boolean; interest?: string; message?: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'invalid' | 'sending' | 'done'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = contact.trim();
    if (!EMAIL.test(c) && !PHONE.test(c)) return setState('invalid');
    setState('sending');
    const payload = { name: name.trim(), contact: c, lang, interest, at: new Date().toISOString() };
    try {
      localStorage.setItem('color-alley-signup', JSON.stringify(payload));
    } catch {
      /* private mode */
    }
    if (ENDPOINT) {
      try {
        await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch {
        /* still thank the visitor; the entry is kept locally */
      }
    } else {
      window.open(waLink(`${message ?? t.orderSignupMsg}\n${payload.name} — ${payload.contact}`), '_blank', 'noopener');
    }
    setState('done');
  };

  if (state === 'done')
    return (
      <p className="rounded-2xl bg-teal/15 p-4 text-center font-body font-bold text-navy" role="status">
        {t.formThanks}
      </p>
    );

  return (
    <form onSubmit={submit} className={`space-y-3 ${compact ? '' : 'mx-auto max-w-md'}`} noValidate>
      <label className="block">
        <span className="mb-1 block font-body text-sm text-navy/70">{t.formName}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-navy/20 bg-white px-4 py-2.5 font-body text-navy focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/30" />
      </label>
      <label className="block">
        <span className="mb-1 block font-body text-sm text-navy/70">{t.formContact}</span>
        <input
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            if (state === 'invalid') setState('idle');
          }}
          required
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          aria-invalid={state === 'invalid'}
          aria-describedby={state === 'invalid' ? 'signup-err' : undefined}
          className="w-full rounded-xl border border-navy/20 bg-white px-4 py-2.5 text-start font-body text-navy focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/30"
        />
      </label>
      {state === 'invalid' && (
        <p id="signup-err" className="font-body text-sm text-coral" role="alert">
          {t.formInvalid}
        </p>
      )}
      <button type="submit" className="btn-gold w-full" disabled={state === 'sending'}>
        {t.formSubmit}
      </button>
    </form>
  );
}

export function WorkshopDialog() {
  const t = useT();
  const focus = useStore((s) => s.focus);
  const leaveShop = () => useStore.getState().setFocus(null);
  return (
    <Dialog
      open={focus === 'workshop'}
      onClose={leaveShop}
      labelledBy="workshop-title"
      className="panel fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-3xl p-6 md:inset-x-auto md:bottom-0 md:top-0 md:max-h-none md:w-[440px] md:rounded-none md:start-0"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-body text-sm text-teal">🏮 {t.workshopName}</p>
          <h2 id="workshop-title" className="font-display text-2xl leading-tight md:text-3xl">
            {t.workshopTeaser}
          </h2>
        </div>
        <button className="rounded-full p-2 text-navy/70 hover:bg-navy/10" onClick={leaveShop} aria-label={t.close}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="mb-5 font-body leading-relaxed text-navy/80">{t.workshopBody}</p>
      <SignupForm compact />
      <button className="btn mt-3 w-full border-2 border-navy/20 text-navy hover:bg-navy/5" onClick={leaveShop}>
        {t.keepWalking}
      </button>
    </Dialog>
  );
}
