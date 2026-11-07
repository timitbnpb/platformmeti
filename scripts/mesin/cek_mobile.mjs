// Pemeriksa luber mobile: node scripts/mesin/cek_mobile.mjs [--basis=http://localhost:8822] [--foto=DIR] /proyek /peluang ...
// Perlu playwright (npx -y playwright@1.49.0 install chromium). Mencetak scrollWidth, pelanggar luber, target sentuh < 44px.
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const arg = process.argv.slice(2);
const opsi = k => (arg.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const basis = opsi('basis') || 'http://localhost:8822';
const foto = opsi('foto');
const urls = arg.filter(a => !a.startsWith('--'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
const pub = new URL('../../public/', import.meta.url).pathname;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.route('**/api/**', async r => {
  const u = new URL(r.request().url());
  if (u.pathname === '/api/saya') return r.fulfill({ json: { masuk: true, peran: 'admin', nama: 'Uji' } });
  const m = u.pathname.match(/^\/api\/direktori\/potret\/(.+)$/);
  if (m) { try { return r.fulfill({ body: readFileSync(join(pub, 'data', m[1] + '.json')), contentType: 'application/json' }); } catch {} }
  r.fulfill({ status: 503, json: { kode: 'fitur_belum_aktif' } });
});
if (foto) mkdirSync(foto, { recursive: true });
for (const u of urls) {
  const p = await ctx.newPage();
  await p.goto(basis + u, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(600);
  const h = await p.evaluate(() => {
    const W = 390, lu = [], kecil = [], kap = [];
    for (const e of document.body.querySelectorAll('*')) {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || cs.visibility === 'hidden' || cs.display === 'none') continue;
      const d = (e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ')[0] : '');
      if (r.right > W + 1 && lu.length < 6 && !e.closest('[class*=gulir],[class*=scroll],[class*=tab],[class*=seg]')) lu.push(e.tagName.toLowerCase() + d + ' ' + Math.round(r.right));
      if (/^(A|BUTTON|INPUT|SELECT)$/.test(e.tagName) && (r.height < 44 || r.width < 44) && r.height > 0 && cs.position !== 'fixed' && kecil.length < 40) kecil.push(e.tagName.toLowerCase() + d + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (cs.textTransform === 'uppercase' && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && kap.length < 8) kap.push(e.tagName.toLowerCase() + d);
    }
    return { sw: document.scrollingElement.scrollWidth, lu, kecil, kap };
  });
  console.log(u, 'scrollWidth=' + h.sw, h.sw > 390 ? 'LUBER' : 'ok');
  if (h.lu.length) console.log('  luber:', h.lu.join(' | '));
  if (h.kecil.length) console.log('  sentuh<44 (' + h.kecil.length + '):', [...new Set(h.kecil)].slice(0, 8).join(' | '));
  if (h.kap.length) console.log('  KAPITAL:', [...new Set(h.kap)].join(' | '));
  if (foto) await p.screenshot({ path: join(foto, u.replace(/\W+/g, '_') + '.png'), fullPage: true });
  await p.close();
}
await b.close();
