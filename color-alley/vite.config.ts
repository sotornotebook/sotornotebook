import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { PRODUCTS } from './src/data/products';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Injects a real, crawlable HTML product list + JSON-LD into index.html at
 * build time (from src/data/products.ts). React replaces it on mount.
 */
function seo(site: string): Plugin {
  return {
    name: 'color-alley-seo',
    transformIndexHtml(html) {
      const items = PRODUCTS.map(
        (p) => `
        <li>
          <article lang="ar">
            <img src="${p.cover}" alt="${esc(p.title.ar)}" width="300" height="400" loading="lazy" />
            <h2>${esc(p.title.ar)}</h2>
            <p>${esc(p.sign.ar)} — ${esc(p.age.ar)} — ${esc(p.pages.ar)}</p>
            <p>${esc(p.description.ar)}</p>
            <p><strong>${p.price} ج.م</strong></p>
            <p lang="en">${esc(p.title.en)} — ${esc(p.age.en)} — ${p.price} EGP</p>
          </article>
        </li>`,
      ).join('');
      const list = `
      <main id="seo-content" style="max-width:960px;margin:0 auto;padding:24px;font-family:Tajawal,system-ui,sans-serif;color:#FFF8EC">
        <h1>حارة الألوان — كتب تلوين بحكاية مصرية</h1>
        <p>ضِلّام سرق ألوان الحارة! نوّر الفوانيس وامشي في حارة الألوان واختار كتاب الحكاية اللي يناسبك.</p>
        <ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">${items}
        </ul>
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
            name: p.title.ar,
            alternateName: p.title.en,
            description: p.description.ar,
            image: `${site}${p.cover}`,
            brand: { '@type': 'Brand', name: 'حارة الألوان' },
            audience: { '@type': 'PeopleAudience', suggestedMinAge: p.age.en },
            offers: { '@type': 'Offer', price: p.price, priceCurrency: 'EGP', availability: 'https://schema.org/InStock' },
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
