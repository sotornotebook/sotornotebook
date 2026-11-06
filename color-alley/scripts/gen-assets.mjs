// Generates placeholder covers (/public/covers/<id>.png) and the OG image
// (/public/og.png) by drawing on a canvas in headless Chromium.
// Run: npm run assets   — replace the PNGs with real covers any time.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// uses the project's playwright if installed, else a globally available one
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/data/products.ts'), 'utf8');
// tiny extraction so this script has no TS toolchain dependency
const products = [...src.matchAll(/id: '([^']+)',\s*sign: \{ ar: '([^']+)'[^}]*\},\s*title: \{ ar: '([^']+)', en: '([^']+)' \},\s*age: \{ ar: '([^']+)'[\s\S]*?accent: '([^']+)'/g)].map((m) => ({
  id: m[1], sign: m[2], title: m[3], titleEn: m[4], age: m[5], accent: m[6],
}));
if (products.length !== 8) throw new Error(`expected 8 products, parsed ${products.length}`);

const font = (f) => readFileSync(join(root, f)).toString('base64');
const fonts = {
  lalezar: font('public/fonts/Lalezar-Regular.ttf'),
  lalezarLatin: font('public/fonts/Lalezar-Regular.ttf'),
  tajawal: font('node_modules/@fontsource/tajawal/files/tajawal-arabic-700-normal.woff'),
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const out = await page.evaluate(
  async ({ products, fonts }) => {
    const load = async (name, b64) => {
      const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const ff = new FontFace(name, buf);
      await ff.load();
      document.fonts.add(ff);
    };
    await load('Lalezar', fonts.lalezar);
    await load('LalezarLatin', fonts.lalezarLatin);
    await load('Tajawal', fonts.tajawal);

    const lantern = (g, x, y, s, glass = '#FFE3A3') => {
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, 60);
      grd.addColorStop(0, 'rgba(255,227,163,.65)');
      grd.addColorStop(1, 'rgba(255,227,163,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill();
      g.fillStyle = '#F2A93B';
      g.beginPath(); g.moveTo(0, -42); g.lineTo(16, -26); g.lineTo(-16, -26); g.fill();
      g.fillStyle = glass;
      g.beginPath(); g.moveTo(-16, -24); g.lineTo(16, -24); g.lineTo(11, 22); g.lineTo(-11, 22); g.fill();
      g.strokeStyle = '#F2A93B'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-5, -24); g.lineTo(-4, 22); g.moveTo(5, -24); g.lineTo(4, 22); g.stroke();
      g.fillStyle = '#F2A93B';
      g.beginPath(); g.moveTo(-11, 22); g.lineTo(11, 22); g.lineTo(5, 34); g.lineTo(-5, 34); g.fill();
      g.restore();
    };
    const wrap = (g, text, x, y, maxW, lh) => {
      const words = text.split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
      }
      lines.push(line);
      lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
      return lines.length;
    };

    const result = {};
    for (const p of products) {
      const c = document.createElement('canvas');
      c.width = 600; c.height = 800;
      const g = c.getContext('2d');
      g.fillStyle = p.accent; g.fillRect(0, 0, 600, 800);
      // night alley band
      g.fillStyle = 'rgba(30,42,90,.9)'; g.fillRect(0, 430, 600, 370);
      // houses silhouette
      g.fillStyle = '#FFF8EC';
      for (let i = 0; i < 6; i++) {
        const h = 120 + ((i * 53) % 90);
        g.globalAlpha = 0.14; g.fillRect(i * 100 + 6, 430 - h, 88, h);
        g.globalAlpha = 1;
      }
      // arch window
      g.fillStyle = 'rgba(255,248,236,.95)';
      g.beginPath(); g.moveTo(170, 800); g.lineTo(170, 600); g.arc(300, 600, 130, Math.PI, 0); g.lineTo(430, 800); g.fill();
      lantern(g, 300, 630, 2.2);
      lantern(g, 90, 520, 1); lantern(g, 510, 540, 1.1, '#2BB3A3');
      // title
      g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#FFF8EC';
      g.font = '64px Lalezar';
      g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 8;
      const n = wrap(g, p.title, 300, 220, 520, 78);
      g.shadowBlur = 0;
      g.font = '30px Tajawal'; g.fillStyle = 'rgba(255,248,236,.9)';
      g.fillText(p.sign, 300, 220 + n * 78);
      // age badge
      g.fillStyle = '#FFF8EC'; g.beginPath(); g.roundRect(200, 40, 200, 56, 28); g.fill();
      g.fillStyle = p.accent; g.font = '28px Tajawal'; g.fillText(p.age, 300, 78);
      // brand
      g.fillStyle = '#F2A93B'; g.font = '34px Lalezar'; g.fillText('حارة الألوان', 300, 760);
      g.font = '14px Tajawal'; g.fillStyle = 'rgba(30,42,90,.55)'; g.direction = 'ltr';
      g.fillText('PLACEHOLDER COVER', 300, 785);
      result[p.id] = c.toDataURL('image/png');
    }

    // OG image
    const c = document.createElement('canvas');
    c.width = 1200; c.height = 630;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 630);
    sky.addColorStop(0, '#0E1638'); sky.addColorStop(1, '#1E2A5A');
    g.fillStyle = sky; g.fillRect(0, 0, 1200, 630);
    g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(1020, 110, 55, 0, 7); g.fill();
    for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,248,236,.7)'; g.fillRect((i * 137) % 1200, (i * 71) % 300, 2, 2); }
    // two rows of houses in perspective
    const cols = ['#E8C9A0', '#D9A877', '#C98F6B', '#A9BFAF', '#CFA27E'];
    for (let i = 0; i < 5; i++) {
      const w = 170 - i * 22, h = 420 - i * 50, x = i * (w - 10);
      g.fillStyle = cols[i]; g.fillRect(x, 630 - h, w, h);
      g.fillRect(1200 - x - w, 630 - h + 20, w, h);
      g.fillStyle = 'rgba(255,181,74,.95)';
      g.fillRect(x + w * 0.3, 630 - h + 60, w * 0.4, 60);
      g.fillRect(1200 - x - w * 0.7, 630 - h + 80, w * 0.4, 60);
    }
    // string of lanterns
    g.strokeStyle = '#2a2230'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(80, 160); g.quadraticCurveTo(600, 330, 1120, 160); g.stroke();
    for (let i = 1; i < 10; i++) {
      const t = i / 10, x = 80 + t * 1040, y = (1 - t) * (1 - t) * 160 + 2 * (1 - t) * t * 330 + t * t * 160;
      lantern(g, x, y + 30, 0.8, ['#FFE3A3', '#F06C5B', '#2BB3A3'][i % 3]);
    }
    g.direction = 'rtl'; g.textAlign = 'center';
    g.fillStyle = '#F2A93B'; g.font = '120px Lalezar';
    g.shadowColor = 'rgba(242,169,59,.6)'; g.shadowBlur = 30;
    g.fillText('حارة الألوان', 600, 430);
    g.shadowBlur = 0;
    g.fillStyle = '#FFF8EC'; g.font = '38px Tajawal';
    g.fillText('كتب تلوين بحكاية مصرية — نوّر الفوانيس وادخل', 600, 500);
    g.direction = 'ltr'; g.font = '34px LalezarLatin'; g.fillStyle = '#FFE3A3';
    g.fillText('COLOR ALLEY', 600, 560);
    result.og = c.toDataURL('image/png');
    return result;
  },
  { products, fonts },
);
await browser.close();

mkdirSync(join(root, 'public/covers'), { recursive: true });
for (const [id, url] of Object.entries(out)) {
  const file = id === 'og' ? join(root, 'public/og.png') : join(root, `public/covers/${id}.png`);
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', file.replace(root + '/', ''));
}
