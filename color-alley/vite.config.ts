import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { CATEGORIES, PRODUCTS, coverOf, productsIn } from './src/data/catalog';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Injects a real, crawlable HTML product list + JSON-LD into index.html at
 * build time (from src/data/products.ts). React replaces it on mount.
 */
function seo(site: string): Plugin {
  return {
    name: 'color-alley-seo',
    transformIndexHtml(html) {
      const section = (c: (typeof CATEGORIES)[number]) => `
        <section>
          <h2><a href="/shop/${c.id}">${esc(c.nameAr)}</a> — ${esc(c.nameEn)}</h2>
          <p>${esc(c.taglineAr)}</p>
          <ul>${productsIn(c.id)
            .map(
              (p) => `
            <li><article lang="ar">
              <a href="/product/${p.id}"><img src="${coverOf(p)}" alt="${esc(p.titleAr)}" width="150" height="200" loading="lazy" />
              <h3>${esc(p.titleAr)}</h3></a>
              <p lang="en">${esc(p.titleEn)}</p>
              <p>${p.ageMax >= 99 ? `+${p.ageMin}` : `${p.ageMin}–${p.ageMax}`} سنة${p.pages ? ` — ${p.pages} صفحة` : ''}</p>
              <p>${esc(p.descriptionAr)}</p>
              <p><strong>${p.quoteOnly ? 'اطلب عرض سعر' : `${p.price} ج.م`}</strong>${p.inStock ? '' : ' — قريبًا'}</p>
            </article></li>`,
            )
            .join('')}
          </ul>
        </section>`;
      const list = `
      <main id="seo-content" style="max-width:960px;margin:0 auto;padding:24px;font-family:Tajawal,system-ui,sans-serif;color:#FFF8EC">
        <h1>حارة الألوان — كتب تلوين بحكاية مصرية</h1>
        <p>ضِلّام سرق ألوان الحارة! نوّر الفوانيس وامشي في حارة الألوان، ادخل الدكاكين واختار كتاب الحكاية اللي يناسبك.</p>
        ${[...CATEGORIES].sort((a, b) => a.order - b.order).map(section).join('')}
        <section><h2>ورشة جدو عبده</h2><p>الحكاية الجاية: مغامرة في المتحف المصري الكبير.</p></section>
      </main>`;
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'حارة الألوان — Color Alley',
        itemListElement: PRODUCTS.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.titleAr,
            alternateName: p.titleEn,
            description: p.descriptionAr,
            url: `${site}/product/${p.id}`,
            image: p.images.map((i) => `${site}${i.src}`),
            category: CATEGORIES.find((c) => c.id === p.categoryId)?.nameAr,
            brand: { '@type': 'Brand', name: 'حارة الألوان' },
            audience: { '@type': 'PeopleAudience', suggestedMinAge: p.ageMin, ...(p.ageMax < 99 ? { suggestedMaxAge: p.ageMax } : {}) },
            ...(p.quoteOnly
              ? {}
              : { offers: { '@type': 'Offer', price: p.price, priceCurrency: 'EGP', availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: `${site}/product/${p.id}` } }),
          },
        })),
      };
      return html
        .replace('<!--SEO_PRODUCTS-->', list)
        .replace('<!--SEO_JSONLD-->', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = (env.VITE_SITE_URL || 'https://color-alley.vercel.app').replace(/\/$/, '');
  process.env.VITE_SITE_URL = site;
  return {
    plugins: [react(), seo(site)],
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // keep three.js & R3F out of the entry chunk: the 2D fallback never downloads them
          manualChunks(id) {
            if (/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store)\//.test(id)) return 'react';
            if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'react';
            if (id.includes('node_modules/three/')) return 'three';
            if (/node_modules\/(@react-three|postprocessing|maath|troika|three-stdlib|@monogrid|camera-controls)/.test(id)) return 'r3f';
          },
        },
      },
    },
  };
});
