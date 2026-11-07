// Pembantu panen sopan: UA jujur, robots.txt, jeda >= 2 dtk, satu percobaan ulang. Dipakai skrip ambil J.
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
const robotsCache = new Map();
export function bolehRobots(txt, path) { // agen * saja; Disallow terpanjang menang atas Allow
  let aktif = false, aturan = [];
  for (const g of String(txt || '').split(/\r?\n/)) {
    const [k, ...v] = g.split('#')[0].split(':'); const key = (k || '').trim().toLowerCase(); const val = v.join(':').trim();
    if (key === 'user-agent') aktif = val === '*'; else if (aktif && (key === 'disallow' || key === 'allow') && val) aturan.push([key, val]);
  }
  let best = null;
  for (const [t, p] of aturan) if (path.startsWith(p.replace(/\*$/, '')) && (!best || p.length >= best[1].length)) best = [t, p];
  return !best || best[0] === 'allow';
}
export async function ambil(url, { json = false, method = 'GET', body, headers = {}, buf = false } = {}) {
  const u = new URL(url);
  if (!robotsCache.has(u.host)) {
    await tidur(Math.max(0, 2100 - (Date.now() - terakhir))); terakhir = Date.now();
    let t = ''; try { const r = await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA } }); if (r.ok && /text\/plain/.test(r.headers.get('content-type') || '')) t = await r.text(); } catch {}
    robotsCache.set(u.host, t);
  }
  if (!bolehRobots(robotsCache.get(u.host), u.pathname)) throw new Error('robots melarang ' + url);
  for (let i = 0; i < 2; i++) {
    await tidur(Math.max(0, 2100 - (Date.now() - terakhir))); terakhir = Date.now();
    const r = await fetch(url, { method, body, headers: { 'user-agent': UA, ...headers }, redirect: 'follow' });
    if (r.status === 403) throw new Error('403 berhenti total ' + url);
    if (r.status === 429) { await tidur(Number(r.headers.get('retry-after') || 30) * 1000); continue; }
    if (r.ok) return buf ? Buffer.from(await r.arrayBuffer()) : json ? r.json() : r.text();
    if (i === 1 || r.status < 500) throw new Error(r.status + ' ' + url);
    await tidur(5000);
  }
}
export const sumberOk = (s) => !!(s && /^https:\/\//.test(s.url) && s.judul && s.penerbit && s.tahun && s.tingkat_bukti);
