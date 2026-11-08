// Pustaka panen isu: aturan sopan santun (UA, robots.txt, jeda, berhenti saat 403/429) tanpa jaringan di fungsi murni.
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const JEDA_MS = 2200; // >= 2 detik antarpermintaan ke host yang sama
export const DILARANG_HOST = /(^|\.)(antaranews\.com|facebook\.com|instagram\.com|x\.com|twitter\.com|tiktok\.com|youtube\.com|linkedin\.com|t\.me)$/i;

/** Apakah host boleh dipanen (tanpa Antara dan media sosial)? */
export const hostBoleh = (url) => { try { const u = new URL(url); return u.protocol === 'https:' && !DILARANG_HOST.test(u.hostname); } catch { return false; } };

/** Urai robots.txt jadi aturan untuk UA kita atau '*'. Kembalikan fungsi (path) => boleh. */
export function urajRobots(teks) {
  const grup = []; let kini = null;
  for (const mentah of String(teks || '').split(/\r?\n/)) {
    const b = mentah.replace(/#.*/, '').trim(); if (!b) continue;
    const m = b.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!kini || kini.aturan.length) { kini = { ua: [], aturan: [] }; grup.push(kini); } kini.ua.push(v.toLowerCase()); }
    else if (kini && (k === 'allow' || k === 'disallow')) kini.aturan.push([k, v]);
  }
  const milik = grup.find((g) => g.ua.some((u) => u !== '*' && 'meti-network-research'.includes(u))) || grup.find((g) => g.ua.includes('*'));
  const aturan = milik ? milik.aturan : [];
  return (path) => {
    let terbaik = null;
    for (const [k, v] of aturan) {
      if (v === '') continue;
      const re = new RegExp('^' + v.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
      if (re.test(path) && (!terbaik || v.length > terbaik[1].length || (v.length === terbaik[1].length && k === 'allow'))) terbaik = [k, v];
    }
    return !terbaik || terbaik[0] === 'allow';
  };
}

/** Status yang menghentikan seluruh panen host itu. */
export const HENTI = new Set([403, 429]);
