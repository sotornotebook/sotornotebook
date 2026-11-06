import { DICT, type Lang } from '../data/i18n';
import { productById } from '../data/products';
import type { CartLine } from '../store/useStore';
import { cartTotal } from '../store/useStore';
import { formatPrice, formatNumber } from './format';

const NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

export const waLink = (text: string) => `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`;

export function orderMessage(cart: CartLine[], lang: Lang) {
  const t = DICT[lang];
  const lines = cart.map((l) => {
    const p = productById(l.id)!;
    return `• ${p.title[lang]} × ${formatNumber(l.qty, lang)} = ${formatPrice(p.price * l.qty, lang)}`;
  });
  return [t.orderGreeting, '', ...lines, '', `${t.total}: ${formatPrice(cartTotal(cart), lang)}`].join('\n');
}

export const orderLink = (cart: CartLine[], lang: Lang) => waLink(orderMessage(cart, lang));
