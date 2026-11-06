import { useEffect, useRef, type ReactNode } from 'react';

/** open dialogs, topmost last — only the top one traps focus / handles Esc */
const stack: HTMLElement[] = [];

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
  /** element to focus first (defaults to first focusable) */
  initialFocus?: React.RefObject<HTMLElement>;
}

/** Accessible modal dialog: role=dialog, aria-modal, focus trap, Esc to close, focus restore. */
export function Dialog({ open, onClose, labelledBy, className = '', children, initialFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current!;
    stack.push(node);
    const first = initialFocus?.current ?? node.querySelector<HTMLElement>(FOCUSABLE);
    // wait for the slide-in to start so focus doesn't jump the scroll
    const id = requestAnimationFrame(() => (first ?? node).focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== node) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return e.preventDefault();
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey, true);
      stack.splice(stack.indexOf(node), 1);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocus]);

  if (!open) return null;
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={className}>
      {children}
    </div>
  );
}
