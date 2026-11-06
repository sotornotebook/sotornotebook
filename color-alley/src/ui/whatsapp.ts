import { DICT, type Lang } from '../data/i18n';
import { productById, type Product } from '../data/catalog';
import type { CartLine } from '../store/useStore';
import { cartTotal } from '../store/useStore';
import { formatPrice, formatNumber } from './format';

const NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

export const waLink = (text: string) => `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`;
export const titleOf = (p: Product, lang: Lang) => (lang === 'ar' ? p.titleAr : p.titleEn);
const pageUrl = (id: string) => `${location.origin}/product/${id}`;

const line = (p: Product, qty: number, lang: Lang) => `• ${titleOf(p, lang)} × ${formatNumber(qty, lang)} = ${formatPrice(p.price * qty, lang)}`;

export function orderMessage(cart: CartLine[], lang: Lang) {
  const t = DICT[lang];
  const lines = cart.map((l) => line(productById(l.id)!, l.qty, lang));
  return [t.orderGreeting, '', ...lines, '', `${t.total}: ${formatPrice(cartTotal(cart), lang)}`].join('\n');
}
export const orderLink = (cart: CartLine[], lang: Lang) => waLink(orderMessage(cart, lang));

/** "اشتري على واتساب" for a single product */
export const buyNowLink = (p: Product, qty: number, lang: Lang) =>
  waLink([DICT[lang].buyNowMsg, '', line(p, qty, lang), '', pageUrl(p.id)].join('\n'));

export const quoteLink = (p: Product, lang: Lang) => waLink(`${DICT[lang].quoteMsg(titleOf(p, lang))}\n${pageUrl(p.id)}`);
