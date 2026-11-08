// Bagian murni/offline untuk data_pemerintah*.mjs: daftar HS, pembangun Comtrade bulanan, penyaring batas negara.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const TANGGAL = '2026-11-08';
export const HS_BULANAN = {
  '854142': { komponen: 'surya', nama: 'Sel fotovoltaik tanpa rakitan modul' },
  '854143': { komponen: 'surya', nama: 'Sel fotovoltaik rakitan modul/panel' },
  '850440': { komponen: 'inverter', nama: 'Konverter statis (inverter, pengisi daya, UPS)' },
  '850760': { komponen: 'baterai', nama: 'Akumulator litium-ion' },
  '850231': { komponen: 'angin', nama: 'Set pembangkit tenaga angin' },
  '8410': { komponen: 'hidro', nama: 'Turbin hidrolik, kincir air, dan bagiannya' },
  '8419': { komponen: 'termal', nama: 'Mesin/peralatan pemanas-pendingin proses (termasuk pemanas air surya)' },
};

export function bulanRentang(dari, sampai) {
  const o = []; let [y, m] = dari.split('-').map(Number); const [y2, m2] = sampai.split('-').map(Number);
  while (y < y2 || (y === y2 && m <= m2)) { o.push(`${y}${String(m).padStart(2, '0')}`); if (++m > 12) { m = 1; y++; } }
  return o;
}

/** Bangun baris bulanan dari berkas mentah. peta: kode Comtrade -> {iso2,iso3,nama}. Per (hs,alir,bulan): total dunia + top mitra. */
export function bangunBulanan(files, peta, top = 15) {
  const baris = [];
  for (const m of files) {
    const rows = m.data || [];
    const dunia = rows.find((r) => r.p === 0);
    const mitra = rows.filter((r) => r.p !== 0 && peta.has(r.p) && r.v > 0).sort((a, b) => b.v - a.v);
    if (!dunia && !mitra.length) continue;
    const usd = dunia ? Math.round(dunia.v) : Math.round(mitra.reduce((a, r) => a + r.v, 0));
    baris.push({ hs: m.hs, komponen: HS_BULANAN[m.hs].komponen, alir: m.alir === 'M' ? 'impor' : 'ekspor', bulan: `${m.bulan.slice(0, 4)}-${m.bulan.slice(4)}`, usd, kg: dunia ? Math.round(dunia.w || 0) : null, mitra: mitra.slice(0, top).map((r) => ({ iso2: peta.get(r.p).iso2, usd: Math.round(r.v), kg: Math.round(r.w || 0) })), lainnya_usd: Math.max(0, usd - mitra.slice(0, top).reduce((a, r) => a + Math.round(r.v), 0)), tanggal: m.ambil });
  }
  return baris.sort((a, b) => a.hs.localeCompare(b.hs) || a.alir.localeCompare(b.alir) || a.bulan.localeCompare(b.bulan));
}

// ---- batas negara: luar-indonesia.json = persegi dunia berlubang Indonesia; titik "di Indonesia" = di dalam salah satu lubang.
const dalamCincin = (x, y, r) => { let d = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [a, b] = r[i], [c, e] = r[j]; if ((b > y) !== (e > y) && x < ((c - a) * (y - b)) / (e - b) + a) d = !d; } return d; };
export function pembatasIndonesia(luar) {
  const lubang = luar.geometry.coordinates.flatMap((p) => p.slice(1));
  const kotak = lubang.map((r) => { const xs = r.map((p) => p[0]), ys = r.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const dalam = (x, y) => lubang.some((r, i) => x >= kotak[i][0] && x <= kotak[i][2] && y >= kotak[i][1] && y <= kotak[i][3] && dalamCincin(x, y, r));
  // jarak kasar (derajat) ke simpul terdekat; pantai disederhanakan, jadi toleransi dipakai agar kabel laut/pantai tidak terbuang
  const dekat = (x, y, tol) => lubang.some((r) => r.some((p) => Math.abs(p[0] - x) < tol && Math.abs(p[1] - y) < tol));
  return { dalam, dalamToleran: (x, y, tol = 0.08) => dalam(x, y) || dekat(x, y, tol) };
}
/** Objek "luar negeri" bila TIDAK ada satu pun titik yang dalam/dekat poligon Indonesia. */
export const luarNegeri = (titik, b) => !titik.some(([x, y]) => b.dalamToleran(x, y));

// ---- BKPM: realisasi investasi (LKPM/OSS) per triwulan. Berkas 2022-2025 bertanda koma, 2026 bertanda titik koma + desimal koma.
export function parseCsv(txt) {
  txt = txt.replace(/^﻿/, '');
  const sep = txt.slice(0, txt.indexOf('\n')).includes(';') ? ';' : ',', kom = sep === ';';
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === sep) { r.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; r.push(f); f = ''; if (r.length > 1 || r[0]) rows.push(r); r = []; }
    else f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const h = rows.shift();
  return rows.map((x) => { const o = {}; h.forEach((k, i) => { o[k] = x[i]; }); o.rp = num(o.investasi_rp_juta, kom); o.usd = num(o.investasi_us_ribu, kom); o.tki = num(o.tki, kom); return o; });
}
const num = (s, kom) => { const n = Number(kom ? String(s || '0').replace(',', '.') : s || 0); return Number.isFinite(n) ? n : 0; };
const norm = (s) => String(s).toLowerCase().replace(/^daerah khusus ibukota /, '').replace(/^dki /, '').replace(/^di /, '').replace(/^daerah istimewa /, '').replace(/[^a-z]/g, '');
const SEKTOR = 'Listrik, Gas dan Air';
// Nama negara asal PMA di berkas BKPM -> iso2 (kunci tautan wiki negara).
export const ISO_NEGARA = new Map(Object.entries({ 'Hongkong, RRT': 'hk', Jepang: 'jp', Mauritius: 'mu', Singapura: 'sg', 'R.R. Tiongkok': 'cn', 'Amerika Serikat': 'us', Belanda: 'nl', Malaysia: 'my', Jerman: 'de', Australia: 'au', 'Kepulauan Virgin Inggris': 'vg', 'Uni Emirat Arab': 'ae', Seychelles: 'sc', 'Korea Selatan': 'kr', Philipina: 'ph', Bermuda: 'bm', Inggris: 'gb', Denmark: 'dk', Thailand: 'th', Turki: 'tr', 'Kepulauan Cayman': 'ky', Vietnam: 'vn', Perancis: 'fr', India: 'in', Norwegia: 'no', Taiwan: 'tw', Swiss: 'ch', Spanyol: 'es', Italia: 'it', Kanada: 'ca', Luxemburg: 'lu', Arab: 'sa', 'Arab Saudi': 'sa', Qatar: 'qa', Swedia: 'se', Finlandia: 'fi', Austria: 'at', Belgia: 'be', Selandia: 'nz', 'Selandia Baru': 'nz', Brunei: 'bn', 'Brunei Darussalam': 'bn', Mesir: 'eg', Kuwait: 'kw', Oman: 'om' }));
const tambah = (m, k, b) => { const o = m.get(k) || { rp_juta: 0, usd_ribu: 0, tki: 0, baris: 0 }; o.rp_juta += b.rp; o.usd_ribu += b.usd; o.tki += b.tki; o.baris++; m.set(k, o); };
const bulat = (o) => ({ ...o, rp_juta: Math.round(o.rp_juta), usd_ribu: Math.round(o.usd_ribu) });

/** per: [{tahun,tw,baris}], provinsiKode: Map(norm(nama)->{kode,nama}), isoNegara: Map(nama negara -> iso2). */
export function ringkasBkpm(per, provinsiKode, isoNegara = ISO_NEGARA) {
  const sektor = [], prov = [], negara = [], tidakCocok = new Set(); let total = [];
  for (const { tahun, triwulan: tw, baris } of per) {
    const tot = new Map(), lga = new Map(), kb = new Map(), pl = new Map(), pv = new Map(), ng = new Map();
    for (const b of baris) {
      tambah(tot, b.status_penanaman_modal, b);
      const kbli = (/\((\d\d)-/.exec(b.deskripsi_kbli_2digit) || [])[1];
      if (b.nama_sektor.trim() === SEKTOR) {
        tambah(lga, b.status_penanaman_modal, b); tambah(kb, `${b.status_penanaman_modal}|${kbli}`, b);
        const p = provinsiKode.get(norm(b.provinsi)); if (!p) tidakCocok.add(b.provinsi);
        tambah(pv, `${b.status_penanaman_modal}|${p ? p.kode : ''}|${b.provinsi}`, b);
        if (b.status_penanaman_modal === 'PMA') tambah(ng, b.negara, b);
      }
      if (kbli === '27' || kbli === '26') tambah(pl, `${b.status_penanaman_modal}|${kbli}`, b);
    }
    for (const st of ['PMA', 'PMDN']) {
      sektor.push({ tahun, triwulan: tw, status: st, total_semua_sektor: bulat(tot.get(st) || { rp_juta: 0, usd_ribu: 0, tki: 0, baris: 0 }), listrik_gas_air: bulat(lga.get(st) || { rp_juta: 0, usd_ribu: 0, tki: 0, baris: 0 }),
        menurut_kbli: Object.fromEntries([...kb].filter(([k]) => k.startsWith(st + '|')).map(([k, v]) => [k.split('|')[1], bulat(v)])),
        industri_peralatan_elektronik: Object.fromEntries([...pl].filter(([k]) => k.startsWith(st + '|')).map(([k, v]) => [k.split('|')[1], bulat(v)])) });
    }
    for (const [k, v] of pv) { const [st, kode, nama] = k.split('|'); prov.push({ tahun, triwulan: tw, status: st, kode: kode || null, provinsi: nama, ...bulat(v) }); }
    for (const [n, v] of [...ng].sort((a, b) => b[1].rp_juta - a[1].rp_juta).slice(0, 15)) negara.push({ tahun, triwulan: tw, negara: n.trim(), iso2: isoNegara.get(n.trim()) || null, ...bulat(v) });
  }
  return { sektor, provinsi: prov.sort((a, b) => a.tahun - b.tahun || a.triwulan - b.triwulan || (a.kode || '').localeCompare(b.kode || '')), negara_asal_pma: negara, tidak_cocok: [...tidakCocok] };
}
export { norm as normNama };
