import type { Lang } from '../data/i18n';
import { DICT } from '../data/i18n';

export const formatNumber = (n: number, lang: Lang) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG').format(n);
export const formatPrice = (n: number, lang: Lang) => `${formatNumber(n, lang)} ${DICT[lang].currency}`;
