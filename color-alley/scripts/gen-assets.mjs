// Generates placeholder product images in /public/products/<id>/ and the OG
// image (/public/og.png) by drawing on canvases in headless Chromium.
//   npm run assets                 → only missing files
//   npm run assets -- --force      → regenerate everything
// Replace any generated file with a real photo of the same name.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Node ≥ 22.18 strips TypeScript types natively
const { PRODUCTS, CATEGORIES } = await import(join(root, 'src/data/catalog.ts'));
const force = process.argv.includes('--force');

const b64 = (f) => readFileSync(join(root, f)).toString('base64');
const fonts = { lalezar: b64('public/fonts/Lalezar-Regular.ttf'), tajawal: b64('node_modules/@fontsource/tajawal/files/tajawal-arabic-700-normal.woff') };

const jobs = [];
for (const p of PRODUCTS) {
  const cat = CATEGORIES.find((c) => c.id === p.categoryId);
  for (const img of p.images) {
    const file = join(root, 'public', img.src);
    if (!force && existsSync(file)) continue;
    const n = Number((img.src.match(/inside-(\d+)/) || [])[1] || 0);
    jobs.push({
      file, kind: img.kind, n,
      p: { id: p.id, title: p.titleAr, type: p.type, accent: p.accent, age: p.ageMax >= 99 ? `+${p.ageMin}` : `${p.ageMin}–${p.ageMax}`, contents: p.contents || [], cat: cat.nameAr },
    });
  }
}
const ogFile = join(root, 'public/og.png');
if (force || !existsSync(ogFile)) jobs.push({ file: ogFile, kind: 'og' });
console.log(`${jobs.length} images to draw`);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.evaluate(async (fonts) => {
  const load = async (name, data) => {
    const ff = new FontFace(name, Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
    await ff.load();
    document.fonts.add(ff);
  };
  await load('Lalezar', fonts.lalezar);
  await load('Tajawal', fonts.tajawal);

  const R = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7);
  const RAINBOW = ['#F06C5B', '#F2A93B', '#FFD84A', '#7BC86C', '#2BB3A3', '#3D7BD9', '#7A5CC9', '#E35DA0'];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const rtl = (g, font, color, align = 'center') => { g.direction = 'rtl'; g.textAlign = align; g.font = font; g.fillStyle = color; };
  const wrap = (g, text, x, y, maxW, lh) => {
    const words = text.split(' '); const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); lines.forEach((l, i) => g.fillText(l, x, y + i * lh)); return lines.length;
  };

  function lantern(g, x, y, s, glass = '#FFE3A3', stroke = null) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const shape = () => {
      g.beginPath();
      g.moveTo(0, -42); g.lineTo(16, -26); g.lineTo(-16, -26); g.closePath();
      g.moveTo(-16, -24); g.lineTo(16, -24); g.lineTo(11, 22); g.lineTo(-11, 22); g.closePath();
      g.moveTo(-11, 22); g.lineTo(11, 22); g.lineTo(5, 34); g.lineTo(-5, 34); g.closePath();
    };
    if (stroke) {
      g.lineWidth = 4 / s; g.strokeStyle = stroke; shape(); g.stroke();
      g.beginPath(); g.moveTo(-5, -24); g.lineTo(-4, 22); g.moveTo(5, -24); g.lineTo(4, 22); g.stroke();
    } else {
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, 60);
      grd.addColorStop(0, 'rgba(255,227,163,.65)'); grd.addColorStop(1, 'rgba(255,227,163,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill();
      g.fillStyle = '#F2A93B'; shape(); g.fill();
      g.fillStyle = glass; g.beginPath(); g.moveTo(-16, -24); g.lineTo(16, -24); g.lineTo(11, 22); g.lineTo(-11, 22); g.fill();
      g.strokeStyle = '#F2A93B'; g.lineWidth = 3; g.beginPath(); g.moveTo(-5, -24); g.lineTo(-4, 22); g.moveTo(5, -24); g.lineTo(4, 22); g.stroke();
    }
    g.restore();
  }

  /** front of any product: book cover / box lid / tin label */
  function front(g, p, w, h) {
    g.fillStyle = p.accent; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(30,42,90,.88)'; g.fillRect(0, h * 0.54, w, h * 0.46);
    for (let i = 0; i < 6; i++) { const hh = h * 0.15 + ((i * 53) % 90); g.globalAlpha = 0.14; g.fillStyle = '#FFF8EC'; g.fillRect(i * (w / 6) + 6, h * 0.54 - hh, w / 6 - 12, hh); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(255,248,236,.95)';
    g.beginPath(); g.moveTo(w * 0.28, h); g.lineTo(w * 0.28, h * 0.75); g.arc(w / 2, h * 0.75, w * 0.22, Math.PI, 0); g.lineTo(w * 0.72, h); g.fill();
    lantern(g, w / 2, h * 0.79, w / 270);
    lantern(g, w * 0.15, h * 0.65, w / 600); lantern(g, w * 0.85, h * 0.67, w / 560, '#2BB3A3');
    const u = w / 600;
    g.fillStyle = '#FFF8EC'; g.beginPath(); g.roundRect(w / 2 - 100 * u, 40 * u, 200 * u, 56 * u, 28 * u); g.fill();
    rtl(g, `${28 * u}px Tajawal`, p.accent); g.fillText(p.age, w / 2, 78 * u);
    const title = p.title.replace(/ – .*/, '');
    const fs = title.length > 16 ? 56 : 64;
    rtl(g, `${fs * u}px Lalezar`, '#FFF8EC'); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 8;
    const n = wrap(g, title, w / 2, h * 0.27, w * 0.86, fs * 1.2 * u); g.shadowBlur = 0;
    rtl(g, `${26 * u}px Tajawal`, 'rgba(255,248,236,.85)'); g.fillText(p.cat, w / 2, h * 0.27 + n * fs * 1.2 * u);
    rtl(g, `${32 * u}px Lalezar`, '#F2A93B'); g.fillText('حارة الألوان', w / 2, h - 40 * u);
    g.direction = 'ltr'; g.font = `${13 * u}px Tajawal`; g.fillStyle = 'rgba(30,42,90,.55)'; g.fillText('PLACEHOLDER', w / 2, h - 18 * u);
  }

  function back(g, p, w, h) {
    g.fillStyle = '#FFF8EC'; g.fillRect(0, 0, w, h);
    g.fillStyle = p.accent; g.fillRect(0, 0, w, 120); g.fillRect(0, h - 40, w, 40);
    rtl(g, '44px Lalezar', '#FFF8EC'); g.fillText(p.title.replace(/ – .*/, ''), w / 2, 80);
    rtl(g, '26px Tajawal', '#1E2A5A', 'right');
    wrap(g, 'ظهر الغلاف: هنا هيتكتب ملخص الحكاية والفئة العمرية وعدد الصفحات. الصورة دي مؤقتة، استبدلها بصورة ظهر الغلاف الحقيقية بنفس اسم الملف.', w - 50, 200, w - 100, 42);
    for (let i = 0; i < 3; i++) lantern(g, 140 + i * 160, 520, 1.1, ['#FFE3A3', '#F06C5B', '#2BB3A3'][i]);
    g.fillStyle = '#fff'; g.fillRect(w - 230, h - 190, 180, 120); g.fillStyle = '#111';
    const r = R(hash(p.id)); for (let x = w - 220; x < w - 60; x += 3 + Math.floor(r() * 3)) g.fillRect(x, h - 180, 1 + Math.floor(r() * 3), 80);
  }

  /** black line-art colouring page */
  function inside(g, p, w, h, n) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 4 * (w / 600); g.lineJoin = 'round'; g.lineCap = 'round';
    const r = R(hash(p.id + n));
    if (p.id === 'islamic-patterns' || (p.age.startsWith('+') && n % 2 === 0)) {
      const s = 100 * (w / 600);
      for (let y = 0; y < h + s; y += s) for (let x = 0; x < w + s; x += s) {
        g.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; const rr = k % 2 ? s * 0.22 : s * 0.48; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        g.closePath(); g.stroke(); g.beginPath(); g.arc(x, y, s * 0.12, 0, 7); g.stroke();
      }
    } else {
      const u = w / 600;
      let x = 0;
      while (x < w) {
        const bw = (90 + r() * 70) * u, bh = (260 + r() * 220) * u;
        g.strokeRect(x, h - bh, bw, bh);
        for (let wy = h - bh + 30 * u; wy < h - 140 * u; wy += 90 * u) {
          g.strokeRect(x + bw * 0.25, wy, bw * 0.5, 55 * u);
          for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + bw * 0.25 + (bw * 0.5 * i) / 4, wy); g.lineTo(x + bw * 0.25 + (bw * 0.5 * i) / 4, wy + 55 * u); g.stroke(); }
        }
        x += bw;
      }
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(w * 0.35, h); g.lineTo(w * 0.35, h - 160 * u); g.arc(w / 2, h - 160 * u, w * 0.15, Math.PI, 0); g.lineTo(w * 0.65, h); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, 120 * u); g.quadraticCurveTo(w / 2, 260 * u, w, 120 * u); g.stroke();
      for (let i = 1; i < 6; i++) { const t = i / 6; const ly = ((1 - t) * (1 - t) * 120 + 2 * (1 - t) * t * 260 + t * t * 120) * u; lantern(g, t * w, ly + 40 * u, 0.9 * u, null, '#1b1b1b'); }
      if (n % 2 === 1) {
        const cx = w * 0.2, cy = h - 40 * u;
        g.beginPath(); g.ellipse(cx, cy, 60 * u, 30 * u, 0, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.arc(cx - 60 * u, cy - 20 * u, 26 * u, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(cx - 78 * u, cy - 38 * u); g.lineTo(cx - 72 * u, cy - 60 * u); g.lineTo(cx - 60 * u, cy - 44 * u); g.moveTo(cx - 56 * u, cy - 46 * u); g.lineTo(cx - 44 * u, cy - 62 * u); g.lineTo(cx - 40 * u, cy - 38 * u); g.stroke();
      }
      for (let i = 0; i < 6; i++) { const sx = r() * w, sy = (20 + r() * 70) * u; g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2; const rr = (k % 2 ? 6 : 14) * u; g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } g.closePath(); g.stroke(); }
    }
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - 70, h - 46, 140, 34);
    rtl(g, '22px Tajawal', '#888'); g.fillText(`صفحة ${n}`, w / 2, h - 22);
  }

  function table(g, w, h) {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#B7804F'); grd.addColorStop(1, '#8A5A3B');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3; for (let y = 60; y < h; y += 110) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 10); g.stroke(); }
  }
  function pencil(g, x, y, len, a, color, thick = 16) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = color; g.fillRect(0, -thick / 2, len, thick);
    g.fillStyle = '#F3D9A9'; g.beginPath(); g.moveTo(len, -thick / 2); g.lineTo(len + thick * 1.6, 0); g.lineTo(len, thick / 2); g.fill();
    g.fillStyle = color; g.beginPath(); g.moveTo(len + thick, -thick / 5); g.lineTo(len + thick * 1.6, 0); g.lineTo(len + thick, thick / 5); g.fill();
    g.restore();
  }
  function mini(g, p, x, y, w, h, a = 0) {
    const [c, cg] = canvas(300, 400); front(cg, p, 300, 400);
    g.save(); g.translate(x, y); g.rotate(a); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.drawImage(c, -w / 2, -h / 2, w, h); g.restore();
  }

  function contents(g, p, w, h) {
    table(g, w, h);
    const r = R(hash(p.id));
    const all = p.contents.join(' ');
    const tool = p.type === 'tool';
    if (!tool) mini(g, p, w * 0.27, h * 0.45, 250, 333, -0.08);
    const n = /٢٤/.test(all) ? 16 : 12;
    if (/قلم|لون|ألوان/.test(all)) for (let i = 0; i < n; i++) pencil(g, w * (tool ? 0.15 : 0.52), h * 0.12 + i * ((h * 0.6) / n), w * (tool ? 0.55 : 0.32), -0.05 + r() * 0.1, RAINBOW[i % 8], /شمع/.test(all) ? 26 : 14);
    if (/نسخ|نسخة/.test(all)) for (let i = 0; i < 6; i++) mini(g, p, w * 0.62 + i * 8, h * 0.42 - i * 8, 200, 266, 0.05);
    if (/برّاية|برايات/.test(all)) { g.fillStyle = '#F2A93B'; g.fillRect(w * 0.3, h * 0.55, 90, 60); g.fillStyle = '#ddd'; g.fillRect(w * 0.55, h * 0.55, 120, 50); }
    g.fillStyle = 'rgba(255,248,236,.92)'; g.beginPath(); g.roundRect(30, h - 100, w - 60, 70, 16); g.fill();
    rtl(g, '24px Tajawal', '#1E2A5A'); g.fillText(p.contents.join(' • ').slice(0, 64), w / 2, h - 55);
  }

  function lifestyle(g, p, w, h) {
    table(g, w, h);
    g.save(); g.translate(w * 0.5, h * 0.52); g.rotate(-0.06);
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 30; g.fillStyle = '#fff'; g.fillRect(-300, -190, 600, 380); g.shadowBlur = 0;
    const [c, cg] = canvas(300, 380); inside(cg, p, 300, 380, 1); g.drawImage(c, 0, -190, 300, 380);
    g.strokeStyle = '#ddd'; g.beginPath(); g.moveTo(0, -190); g.lineTo(0, 190); g.stroke();
    g.globalAlpha = 0.7; const r = R(hash(p.id + 'l'));
    for (let i = 0; i < 9; i++) { g.fillStyle = RAINBOW[i % 8]; g.beginPath(); g.ellipse(20 + r() * 260, -170 + r() * 340, 20 + r() * 30, 14 + r() * 20, r(), 0, 7); g.fill(); }
    g.globalAlpha = 1; g.restore();
    mini(g, p, w * 0.16, h * 0.3, 170, 227, 0.12);
    for (let i = 0; i < 5; i++) pencil(g, w * 0.62, h * 0.82 + i * 12, 220, -0.3 + i * 0.05, RAINBOW[(i * 3) % 8]);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(w * 0.86, h * 0.1, 70, 100); g.fillStyle = '#B5491F'; g.fillRect(w * 0.86 + 6, h * 0.1 + 30, 58, 64);
  }

  function og(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0E1638'); sky.addColorStop(1, '#1E2A5A');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(1020, 110, 55, 0, 7); g.fill();
    for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,248,236,.7)'; g.fillRect((i * 137) % 1200, (i * 71) % 300, 2, 2); }
    const cols = ['#E8C9A0', '#D9A877', '#C98F6B', '#A9BFAF', '#CFA27E'];
    for (let i = 0; i < 5; i++) { const bw = 170 - i * 22, bh = 420 - i * 50, x = i * (bw - 10); g.fillStyle = cols[i]; g.fillRect(x, 630 - bh, bw, bh); g.fillRect(1200 - x - bw, 630 - bh + 20, bw, bh); g.fillStyle = 'rgba(255,181,74,.95)'; g.fillRect(x + bw * 0.3, 630 - bh + 60, bw * 0.4, 60); g.fillRect(1200 - x - bw * 0.7, 630 - bh + 80, bw * 0.4, 60); }
    g.strokeStyle = '#2a2230'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 160); g.quadraticCurveTo(600, 330, 1120, 160); g.stroke();
    for (let i = 1; i < 10; i++) { const t = i / 10, x = 80 + t * 1040, y = (1 - t) * (1 - t) * 160 + 2 * (1 - t) * t * 330 + t * t * 160; lantern(g, x, y + 30, 0.8, ['#FFE3A3', '#F06C5B', '#2BB3A3'][i % 3]); }
    rtl(g, '120px Lalezar', '#F2A93B'); g.shadowColor = 'rgba(242,169,59,.6)'; g.shadowBlur = 30; g.fillText('حارة الألوان', 600, 430); g.shadowBlur = 0;
    rtl(g, '38px Tajawal', '#FFF8EC'); g.fillText('كتب تلوين بحكاية مصرية — نوّر الفوانيس وادخل', 600, 500);
    g.direction = 'ltr'; g.font = '34px Lalezar'; g.fillStyle = '#FFE3A3'; g.fillText('COLOR ALLEY', 600, 560);
  }

  window.__draw = (job) => {
    const land = job.kind === 'contents' || job.kind === 'lifestyle';
    const [c, g] = job.kind === 'og' ? canvas(1200, 630) : land ? canvas(800, 600) : canvas(600, 800);
    if (job.kind === 'og') og(g, 1200, 630);
    else if (job.kind === 'cover') front(g, job.p, 600, 800);
    else if (job.kind === 'back') back(g, job.p, 600, 800);
    else if (job.kind === 'inside') inside(g, job.p, 600, 800, job.n);
    else if (job.kind === 'contents') contents(g, job.p, 800, 600);
    else lifestyle(g, job.p, 800, 600);
    return job.kind === 'og' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.8);
  };
}, fonts);

for (const job of jobs) {
  const url = await page.evaluate((j) => window.__draw(j), job);
  mkdirSync(dirname(job.file), { recursive: true });
  writeFileSync(job.file, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
console.log('done');
