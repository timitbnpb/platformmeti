// public/data/karbon_registri.json (registri karbon Indonesia terpadu, semua sektor) + public/data/karbon_pasar.json (pasar karbon energi).
//   node scripts/pipa/karbon_registri.mjs <dirMentah> <tgl>   (tanpa jaringan; mentah dari scripts/panen/registri_karbon.mjs + vrod_ekstrak.py + pdftotext)
// Tiap baris punya sumber + tanggal. Proyek sama lintas registri disatukan (nama + pengembang + lokasi); ragu masuk meta.antrean_tinjau.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { muat, indeksOrg, cocokOrg, provinsi, token, jaccard, mwDariNama } from './_cocok.mjs';
import { statusBaku } from './karbon_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BULAN_EN = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
export const tglSerial = (n) => (Number.isFinite(+n) && +n > 20000 ? new Date(Date.UTC(1899, 11, 30) + Math.round(+n) * 864e5).toISOString().slice(0, 10) : null);
const tglIso = (v) => (typeof v === 'number' ? tglSerial(v) : v ? String(v).slice(0, 10) : null);
const thn = (v) => { const d = tglIso(v); return d ? d.slice(0, 4) : null; };

/* sektor baku: energi-terbarukan, efisiensi, redd, mangrove, gambut, agroforestri, limbah, lain */
export function sektorDari({ nama = '', metode = '', scope = '', tipe = '' }) {
  const n = `${nama} ${metode}`.toLowerCase(), sc = scope.toLowerCase();
  if (/mangrove|blue carbon|karbon biru|tidal|seagrass|vm0033/.test(n)) return 'mangrove';
  if (/peat|gambut|vm0004|vm0036|vm0027/.test(n)) return 'gambut';
  if (/redd|vm0007|vm0006|vm0009|vm0010|vm0015|vm0048|avoided|deforestation|conservation|katingan|rimba|forest protection|ecosystem restoration/.test(n)) return 'redd';
  if (/a\/r|afforest|reforest|agroforest|ar-am|ar-acm|vm0047|ar-ams|plantation|planting/.test(n + ' ' + tipe.toLowerCase())) return 'agroforestri';
  if (/geotherm|hydro|wind|solar|photovolt|biogas|biomass|acm0002|ams-i\.[adf]|acm0018|acm0006/.test(n + ' ' + tipe.toLowerCase()) && !/waste/.test(sc)) return 'energi-terbarukan';
  if (/waste|landfill|methane|pome|wastewater|sampah|limbah|ams-iii\.h|ams-iii\.d|acm0001|acm0022/.test(n + ' ' + sc)) return 'limbah';
  if (/energy efficiency|energy demand|cookstove|efisiensi|ams-ii\.|ams-iii\.a[ev]/.test(n + ' ' + sc + ' ' + tipe.toLowerCase())) return 'efisiensi';
  if (/energy industries/.test(sc)) return 'energi-terbarukan';
  return 'lain';
}
const STATUS_GS = { 'gold standard certified project': 'tersertifikasi', 'gold standard certified design': 'desain_tersertifikasi', listed: 'dicantumkan' };
const KATEGORI_PENGEMBANG = (n) => (/yayasan|foundation|trust|society|ngo|konservasi|conservation|\bwwf\b|prcf|\bwcs\b/i.test(n) ? 'lsm-yayasan' : 'swasta');

const jumlahPer = (rows, kunci, f) => { const m = new Map(); for (const r of rows) { const k = String(r[kunci]); m.set(k, (m.get(k) || 0) + (Number(f(r)) || 0)); } return m; };
function tahunan(terbitRows, pensiunRows, kunci, idv, fT, fP) {
  const o = {};
  for (const r of terbitRows) if (String(r[kunci]) === idv) { const y = thn(fT(r)); if (y) (o[y] ||= { t: 0, p: 0 }).t += Number(r.Units ?? r.Quantity) || 0; }
  for (const r of pensiunRows) if (String(r[kunci]) === idv) { const y = thn(fP(r)); if (y) (o[y] ||= { t: 0, p: 0 }).p += Number(r['Retirement QTY'] ?? r.Quantity) || 0; }
  return Object.fromEntries(Object.entries(o).sort());
}
const modus = (a) => { const m = new Map(); for (const x of a.filter(Boolean)) m.set(x, (m.get(x) || 0) + 1); return [...m].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null; };

export function barisVerra(vrod) {
  const I = vrod['Verra VCS Issuances'], R = vrod['Verra VCS Retirements'];
  return vrod['Verra VCS Projects'].map((p) => {
    const id = String(p['Project ID']), metode = String(p.Methodology ?? '').replace(/\s*\(Version[^)]*\)/i, '').trim() || null;
    const per = tahunan(I, R, 'Project ID', id, (r) => r['Issuance Date'], (r) => r['Retirement Date']);
    const sum = (k) => Object.values(per).reduce((a, y) => a + y[k], 0);
    const label = [...new Set(R.filter((r) => String(r['Project ID']) === id).map((r) => r['Additional Certifications/Labels']).filter(Boolean).flatMap((x) => String(x).split(/[,;]\s*/)))];
    const dev = String(p.Proponents ?? '').replace(/\s*\(PP\)\s*$/, '').trim() || null;
    return {
      sumber_registri: 'verra', registri: [{ nama: 'Verra VCS', id: 'VCS' + id, url: 'https://registry.verra.org/app/projectDetail/VCS/' + id }], nama: p['Project Name'], pengembang: dev,
      verifikator: modus(I.filter((r) => String(r['Project ID']) === id).map((r) => r.Verifier)), validator: p.Validator || null, metodologi: metode,
      sektor: sektorDari({ nama: p['Project Name'], metode: metode || '', scope: String(p['Sectoral Scope'] ?? '') }), lingkup_asal: p['Sectoral Scope'] || null,
      lokasi: { provinsi: provinsi(p['State/Province']) || provinsi(p['Project Name']), kabupaten: null, lat: null, lng: null, teks_asal: p['State/Province'] || null },
      luas_ha: null, kapasitas_mw: mwDariNama(p['Project Name']), status: statusBaku(p.Status), status_asli: p.Status,
      kredit: { diterbitkan: sum('t'), dipensiunkan: sum('p'), per_tahun: per, taksiran_tahunan: Number(p['Estimated Average Annual Emission Reductions and Carbon Dioxide Removals']) || null, satuan: 'tCO2e' },
      periode_kredit: { mulai: tglIso(p['Crediting Period Duration Start Date']), akhir: tglIso(p['Crediting Period Duration End Date']) }, tanggal_registrasi: tglIso(p['Project Registration Date']),
      otorisasi: null, label, tingkat_bukti: 'via-pihak-ketiga', sumber_id: 's-vrod', sumber_url: 'https://registry.verra.org/app/projectDetail/VCS/' + id,
    };
  });
}
export function barisGs(gs, vrod) {
  const I = vrod['Gold Issuances'], R = vrod['Gold Retirements'];
  return gs.map((g) => {
    const gsid = String(g.sustaincert_id ?? ''), per = tahunan(I, R, 'GSID', gsid, (r) => r['Issuance Date'], (r) => r['Retirement Date']);
    const sum = (k) => Object.values(per).reduce((a, y) => a + y[k], 0);
    const iss = I.filter((r) => String(r.GSID) === gsid), art6 = [...new Set([...iss, ...R.filter((r) => String(r.GSID) === gsid)].map((r) => r['Article Six Authorization']).filter((x) => x && !/not applicable/i.test(x)))];
    const dev = g.project_developer || null;
    return {
      sumber_registri: 'gs', registri: [{ nama: 'Gold Standard', id: 'GS' + gsid, url: g.sustaincert_url || `https://registry.goldstandard.org/projects?q=gs${gsid}` }], nama: String(g.name).replace(/\s+,/g, ','), pengembang: dev,
      verifikator: null, validator: null, metodologi: g.methodology || modus(iss.map((r) => r.Methodology)),
      sektor: sektorDari({ nama: g.name + ' ' + (g.description || '').slice(0, 300), metode: g.methodology || '', tipe: g.type || '' }), lingkup_asal: g.type || null,
      lokasi: { provinsi: provinsi(g.state) || provinsi(g.name), kabupaten: null, lat: g.latitude != null ? Number(g.latitude) : null, lng: g.longitude != null ? Number(g.longitude) : null, teks_asal: g.state || null },
      luas_ha: null, kapasitas_mw: mwDariNama(g.name), status: STATUS_GS[String(g.status).toLowerCase().replace(/_/g, ' ')] || STATUS_GS[String(g.status).toLowerCase()] || 'lainnya', status_asli: g.status,
      kredit: { diterbitkan: sum('t'), dipensiunkan: sum('p'), per_tahun: per, taksiran_tahunan: Number(g.estimated_annual_credits) || null, satuan: 'tCO2e' },
      periode_kredit: { mulai: g.crediting_period_start_date || null, akhir: g.crediting_period_end_date || null }, tanggal_registrasi: null,
      otorisasi: art6.length ? art6.join('; ') : null, label: Array.isArray(g.labels) ? g.labels.map((x) => x.name || x).filter(Boolean) : [], tingkat_bukti: 'resmi', sumber_id: 's-gs', sumber_url: g.sustaincert_url || 'https://registry.goldstandard.org/',
    };
  });
}
export function barisIdx(spe, raw) {
  const out = [];
  const teks = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  for (const tr of spe.split(/<tr/).filter((x) => /SPE-\d/.test(x))) {
    const td = [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((x) => teks(x[1])), srn = (tr.match(/href="(https:[^"]*srn[^"]*)"/) || [])[1] || 'https://srn.menlhk.go.id/';
    if (td.length < 5) continue;
    const [, seri, std, nama, vin] = td, i = raw.indexOf('SRN Series: ' + seri); if (i < 0) continue;

    const pra = raw.slice(Math.max(0, i - 220), i), pemilik = (pra.match(/Project Owner:\s*([^\n]+)\n?[^\n]*$/) || [])[1]?.trim() || null;
    const pasca = raw.slice(i, i + 520).split(/\n(?=[A-Z\[]{3,}|IDTBS|CARBON MARKET|DISCLAIMER)/)[0], tgl = (pasca.match(/Listed Date:\s*(\d+)\w*\s+(\w+)\s+(\d{4})/) || []);
    const vol = {}; for (const v of pasca.matchAll(/(20\d\d):\s*([\d,]+)/g)) vol[v[1]] = Number(v[2].replace(/,/g, ''));
    const tot = Object.keys(vol).length ? Object.values(vol).reduce((a, b) => a + b, 0) : Number((pasca.match(/Listed Volume \(tCO2\):\s*([\d,]+)/) || [])[1]?.replace(/,/g, '')) || null;
    const re = /-RE/.test(std);
    out.push({
      sumber_registri: 'idx', registri: [{ nama: 'IDXCarbon (SPE-GRK)', id: seri, url: 'https://idxcarbon.co.id/product-spe-grk' }, { nama: 'SRN PPI', id: seri, url: srn }], nama: nama.trim().replace(/\s+/g, ' '), pengembang: pemilik, verifikator: null, validator: null, metodologi: null,
      sektor: re ? 'energi-terbarukan' : /pome|limbah/i.test(nama) ? 'limbah' : 'lain', lingkup_asal: std.trim(), lokasi: { provinsi: provinsi(nama), kabupaten: null, lat: null, lng: null, teks_asal: null }, luas_ha: null, kapasitas_mw: mwDariNama(nama),
      status: 'tercatat_bursa', status_asli: 'listed di IDXCarbon', kredit: { diterbitkan: null, dipensiunkan: null, tercatat_bursa: tot, per_tahun: {}, taksiran_tahunan: null, satuan: 'tCO2e' },
      periode_kredit: { mulai: null, akhir: null, vintage: vin.trim() }, tanggal_registrasi: tgl[3] ? `${tgl[3]}-${BULAN_EN[tgl[2].slice(0, 3)] || '01'}-${tgl[1].padStart(2, '0')}` : null, otorisasi: /A\b|\/\s*IDT\w*A|IDTBSA/.test(std) ? 'seri bertanda Authorized dapat diperdagangkan internasional (klasifikasi seri IDXCarbon)' : null, label: [],
      tingkat_bukti: 'resmi', sumber_id: 's-idx', sumber_url: 'https://idxcarbon.co.id/product-spe-grk',
    });
  }
  return out;
}
export function barisPlanVivo(html) {
  const t = html.replace(/<(script|style)[^>]*>.*?<\/\1>/gs, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (!/Nanga Lauk/.test(t)) return [];
  const g = (re) => (t.match(re) || [])[1];
  return [{
    sumber_registri: 'pv', registri: [{ nama: 'Plan Vivo', id: 'PV-Nanga-Lauk', url: 'https://www.planvivo.org/projects/nanga-lauk-indonesia' }], nama: 'Nanga Lauk', pengembang: g(/Coordinators:\s*(.*?)\s+PVCs/) || null, verifikator: null, validator: null, metodologi: g(/Certified beneath:\s*(.*?)\s+Activities/) || null,
    sektor: 'redd', lingkup_asal: g(/Activities:\s*(.*?)\s+Participants/) || null, lokasi: { provinsi: 'Kalimantan Barat', kabupaten: 'Kapuas Hulu', lat: null, lng: null, teks_asal: 'Kapuas Hulu District, West Kalimantan' }, luas_ha: null, kapasitas_mw: null,
    status: 'terdaftar', status_asli: 'Plan Vivo project', kredit: { diterbitkan: Number((g(/PVCs issued to date:\s*([\d,]+)/) || '').replace(/,/g, '')) || null, dipensiunkan: null, per_tahun: {}, taksiran_tahunan: null, satuan: 'PVC (tCO2e)' },
    periode_kredit: { mulai: g(/Start date:\s*(\d{4})/) || null, akhir: null }, tanggal_registrasi: null, otorisasi: null, label: [], tingkat_bukti: 'situs-sendiri', sumber_id: 's-pv', sumber_url: 'https://www.planvivo.org/projects/nanga-lauk-indonesia',
  }];
}

/* satukan proyek sama lintas registri: skor nama (Jaccard) dan kecocokan pengembang/provinsi; >= 0.8 digabung, 0.5..0.8 antrean tinjau */
export function satukan(rows) {
  const t = rows.map((r) => token(r.nama)), antrean = [], induk = rows.map((_, i) => i);
  const cari = (i) => (induk[i] === i ? i : (induk[i] = cari(induk[i])));
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    if (rows[i].sumber_registri === rows[j].sumber_registri) continue;
    let s = jaccard(t[i], t[j]); if (s < 0.4) continue;
    const pi = rows[i].lokasi.provinsi, pj = rows[j].lokasi.provinsi; if (pi && pj && pi !== pj) continue;
    if (rows[i].pengembang && rows[j].pengembang && jaccard(token(rows[i].pengembang), token(rows[j].pengembang)) >= 0.5) s += 0.15;
    if (s >= 0.8) induk[cari(j)] = cari(i); else if (s >= 0.5) antrean.push({ a: rows[i].registri[0].id, b: rows[j].registri[0].id, skor: Math.round(s * 100) / 100, nama_a: rows[i].nama, nama_b: rows[j].nama });
  }
  const grup = new Map(); rows.forEach((r, i) => (grup.get(cari(i)) || grup.set(cari(i), []).get(cari(i))).push(r));
  const hasil = [...grup.values()].map((g) => {
    const [a, ...lain] = g.sort((x, y) => (y.kredit.diterbitkan || 0) - (x.kredit.diterbitkan || 0));
    if (!lain.length) return a;
    return { ...a, registri: g.flatMap((x) => x.registri), kredit: { ...a.kredit, diterbitkan: Math.max(...g.map((x) => x.kredit.diterbitkan || 0)), dipensiunkan: Math.max(...g.map((x) => x.kredit.dipensiunkan || 0)) }, digabung_dari: g.map((x) => x.registri[0].id), catatan_gabung: 'kredit = nilai terbesar dari registri yang memuat proyek ini (tidak dijumlah, mencegah hitung ganda)' };
  });
  return { hasil, antrean };
}

export function tautkanOrg(rows, org) {
  const io = indeksOrg(org), byId = new Map(org.map((o) => [o.id, o])); const calon = new Map();
  for (const r of rows) {
    const o = r.pengembang && cocokOrg(r.pengembang, io); const kat = o ? byId.get(o.id) : null;
    r.organisasi_id = o?.id ?? null; r.pengembang_org = o ? { id: o.id, nama: o.nama } : null;
    if (r.pengembang && !o) calon.set(r.pengembang, (calon.get(r.pengembang) || 0) + 1);
  }
  return [...calon.keys()].sort();
}
export function bangunRegistri(m, tgl, org) {
  const gabung = [...barisVerra(m.vrod), ...barisGs(m.gs, m.vrod), ...barisIdx(m.idxSpe, m.idxRaw), ...barisPlanVivo(m.planvivo)];
  const { hasil, antrean } = satukan(gabung);
  const calon = tautkanOrg(hasil, org);
  hasil.sort((a, b) => (b.kredit.diterbitkan || 0) - (a.kredit.diterbitkan || 0) || a.nama.localeCompare(b.nama));
  hasil.forEach((r, i) => { r.id = 'kr_' + r.registri[0].id.toLowerCase().replace(/[^a-z0-9]+/g, '_'); r.tanggal = tgl; });
  const hitung = (f) => Object.fromEntries([...new Set(hasil.map(f))].sort().map((k) => [k, hasil.filter((r) => f(r) === k).length]));
  const nReg = (nm) => hasil.filter((r) => r.registri.some((x) => x.nama.startsWith(nm))).length;
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: hasil.length, baris: hasil, sumber: SUMBER, meta: {
    diperbarui: tgl, per_registri: { Verra: nReg('Verra'), 'Gold Standard': nReg('Gold'), IDXCarbon: nReg('IDX'), 'Plan Vivo': nReg('Plan') }, per_sektor: hitung((r) => r.sektor), per_status: hitung((r) => r.status),
    antrean_tinjau: antrean, calon_pengembang: calon, celah: CELAH } };
}
const SUMBER = [
  { id: 's-vrod', judul: 'VROD registry files 2026-08: Verra VCS Projects, Issuances, Retirements (Indonesia)', penerbit: 'Berkeley Carbon Trading Project, UC Berkeley (data asal Verra Registry)', tahun: 2026, url: 'https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-gs', judul: 'Gold Standard public API: projects (countries=ID); penerbitan dan pensiun dari VROD Gold Issuances/Retirements', penerbit: 'Gold Standard Foundation; Berkeley VROD', tahun: 2026, url: 'https://public-api.goldstandard.org/projects?countries=ID', lisensi: 'data registri publik; atribusi Gold Standard', tingkat_bukti: 'resmi' },
  { id: 's-idx', judul: 'IDXCarbon: Product SPE-GRK (daftar seri) dan laporan bulanan Oktober 2026 (Listed Project)', penerbit: 'Bursa Efek Indonesia (IDXCarbon)', tahun: 2026, url: 'https://idxcarbon.co.id/product-spe-grk', lisensi: 'halaman publik', tingkat_bukti: 'resmi' },
  { id: 's-pv', judul: 'Plan Vivo: Nanga Lauk, Indonesia', penerbit: 'Plan Vivo Foundation', tahun: 2026, url: 'https://www.planvivo.org/projects/nanga-lauk-indonesia', lisensi: 'halaman publik (robots mengizinkan agen umum)', tingkat_bukti: 'situs-sendiri' },
];
const CELAH = [
  'Verra dibaca dari salinan Berkeley VROD (CC BY 4.0, rilis 2026-08), bukan dari registry.verra.org: registry itu SPA berkunci API dan tidak dipanen. Karena itu tingkat_bukti Verra = via-pihak-ketiga; koordinat, kabupaten, dan luas Verra kosong.',
  'SRN PPI KLHK (srn.menlhk.go.id) tidak terjangkau (koneksi gagal) dan tidak dipanen; hanya 10 seri SPE-GRK yang tercatat di IDXCarbon yang masuk.',
  'Luas (ha) tidak ada di VROD maupun API Gold Standard publik; kolom kosong, tidak ditaksir. Kapasitas MW hanya bila tertulis di nama proyek.',
  'Otorisasi/corresponding adjustment: Gold Standard melaporkan "Not Applicable" untuk semua unit Indonesia; Verra tidak memuatnya di VROD. Kolom otorisasi terisi hanya bila registri menyebut.',
  'Kredit proyek lintas-registri tidak dijumlah (nilai terbesar dipakai) untuk mencegah hitung ganda. Proyek Plan Vivo hanya yang dicantumkan di halaman daftar proyek.',
  'Sektor diklasifikasi aturan teks (nama, metodologi, lingkup sektoral); proyek ambigu jatuh ke "lain".',
];

/* ---------------- pasar karbon energi ---------------- */
const angkaId = (s) => Number(String(s).replace(/,/g, '').replace(/^(\d+)\.(\d{3})$/, '$1$2'));
export function bulananIdx(teks) { // satu PDF: dua kolom (bulan ini, bulan lalu); tiga angka sumber '1.021' = 1.021 (typo titik ribuan)
  const h = teks.match(/TRADING SUMMARY\s+([A-Z][a-z]{2}) (\d{4})\s+([A-Z][a-z]{2}) (\d{4})/); if (!h) return [];
  const g = (lab) => { const m = teks.match(new RegExp(lab + '[^\\n]*?([\\d,.]+)\\s+([\\d,.]+)\\s*\\n')); return m ? [angkaId(m[1]), angkaId(m[2])] : [null, null]; };
  const sat = { vol: g('Total Volume   '), nil: g('Total Value   '), fr: g('Total Frequency   '), proy: g('No. of Listed Project'), unit: g('Available Carbon Unit'), pens: g('Retired Carbon Unit'), peserta: g('No. of Participant') };
  const kol = (i) => ({ periode: `${i ? h[4] : h[2]}-${BULAN_EN[i ? h[3] : h[1]]}`, volume: sat.vol[i], nilai_idr: sat.nil[i], frekuensi: sat.fr[i], proyek_tercatat: sat.proy[i], unit_tersedia: sat.unit[i], unit_pensiun: sat.pens[i], peserta: sat.peserta[i] });
  return [kol(0), kol(1)];
}
export function bangunPasar(m, tgl, registri) {
  const bln = new Map();
  m.idxBulanan.forEach(({ teks, url }) => { for (const [k, r] of bulananIdx(teks).entries()) { const p = r.periode; if (k === 0 || !bln.has(p)) bln.set(p, { ...r, harga_rata: r.volume ? Math.round(r.nilai_idr / r.volume) : null, url: k === 0 ? url : bln.get(p)?.url || url }); } });
  const bulan = [...bln.values()].sort((a, b) => a.periode.localeCompare(b.periode));
  const fosil = m.karbon.baris.filter((b) => b.jenis_aset === 'coal'), kat = (b) => (/mine.?mouth|mulut tambang/i.test(b.nama) ? 'mulut-tambang' : b.kapasitas_mw >= 400.0001 ? '>400' : b.kapasitas_mw >= 100 ? '100-400' : b.kapasitas_mw >= 25 ? '25-100' : '<25');
  const kel = {}; for (const b of fosil) { const k = (kel[kat(b)] ||= { kelompok: kat(b), pltu: 0, mw: 0, emisi_tco2e: 0, mwh: 0 }); k.pltu++; k.mw += b.kapasitas_mw || 0; k.emisi_tco2e += b.emisi_tco2e || 0; k.mwh += b.aktivitas_mwh || 0; }
  const ebt = registri.baris.filter((r) => r.sektor === 'energi-terbarukan'), jml = (rs, k) => rs.reduce((a, r) => a + (r.kredit[k] || 0), 0);
  return { lapis: 'publik', dibangun_pada: tgl, idxcarbon: { bulanan: bulan, sumber_id: 's-idxb', catatan: 'harga rata-rata = nilai transaksi / volume; bukan harga acuan resmi. Dua kolom tiap laporan; bulan yang sama dari laporan berikutnya tidak menimpa laporan asalnya.' },
    ptbae_pu: { dasar: 'Permen ESDM 16 Tahun 2022 Pasal 4 sampai 6', fase: [{ nama: 'Fase 1', tahun: '2023 sampai 2024', cakupan: 'hanya PLTU' }, { nama: 'Fase 2', tahun: '2025 sampai 2027', cakupan: 'ditetapkan Menteri' }, { nama: 'Fase 3', tahun: '2028 sampai 2030', cakupan: 'ditetapkan Menteri' }],
      kategori: [{ kode: '25-100', teks: 'PLTU nonmulut tambang dan mulut tambang, 25 MW sampai kurang dari 100 MW' }, { kode: '100-400', teks: 'PLTU nonmulut tambang, 100 MW sampai 400 MW' }, { kode: '>400', teks: 'PLTU nonmulut tambang, lebih dari 400 MW' }, { kode: 'mulut-tambang', teks: 'PLTU mulut tambang, 100 MW atau lebih' }],
      aktual_est: Object.values(kel).sort((a, b) => b.mw - a.mw).map((k) => ({ ...k, mw: Math.round(k.mw), emisi_tco2e: Math.round(k.emisi_tco2e), intensitas_t_per_mwh: k.mwh ? Math.round((k.emisi_tco2e / k.mwh) * 1000) / 1000 : null })),
      catatan: 'Angka batas atas (tCO2e/MWh) per kategori ditetapkan dengan keputusan Menteri ESDM dan tidak ada di korpus; tidak ditulis. Intensitas aktual = Climate TRACE 2024 (estimasi satelit/model, EST), kategori dihitung dari kapasitas aset; mulut tambang dikenali dari nama.', sumber_id: 's-p16' },
    pajak_karbon: { dasar: 'UU 7/2021 (HPP) Bab VI Pasal 13', tarif_minimum_rp_per_kg: 30, tarif_minimum_rp_per_ton: 30000, ketentuan: 'Tarif ditetapkan lebih tinggi atau sama dengan harga karbon di pasar karbon; bila harga pasar lebih rendah dari Rp30 per kg CO2e, tarif paling rendah Rp30 per kg CO2e (Pasal 13 ayat 8 dan 9). Tarif rinci dan dasar pengenaan diatur PMK (ayat 10).', status: 'belum berlaku', status_catatan: 'Naskah topik karbon platform ini mencatat pajak karbon belum diberlakukan; tanggal berlaku tidak ada di naskah UU HPP, jadi tidak ditulis.', sumber_id: 's-hpp' },
    faktor_emisi: { pltu_batubara_t_per_mwh: m.faktor.batubara, gas_t_per_mwh: m.faktor.gas, sumber_id: 's-ct', catatan: 'Faktor rata-rata armada PLTU batubara dan gas dari Climate TRACE 2024 (EST). Faktor emisi grid resmi per sistem (Kepmen ESDM) tidak ada di korpus; intensitas per sistem memakai turunan RUPTL.', grid_est: m.sistem },
    kredit_ebt: { proyek: ebt.length, diterbitkan: jml(ebt, 'diterbitkan'), dipensiunkan: jml(ebt, 'dipensiunkan'), satuan: 'tCO2e', per_tahun: tahunEbt(ebt) },
    hukum_nek: hukumNek(m.katalog),
    harga_internasional: { tersedia: false, alasan: 'carbonpricingdashboard.worldbank.org membalas 403 (Cloudflare, verifikasi bot) pada robots.txt dan halaman; API data.worldbank.org tanpa seri harga karbon. Dilewati sesuai aturan, bot tidak dilewati.', tanggal: tgl },
    sumber: [
      { id: 's-idxb', judul: 'IDXCarbon Monthly Report September 2025 sampai Oktober 2026 (Carbon Market Trading Summary)', penerbit: 'Bursa Efek Indonesia (IDXCarbon)', tahun: 2026, url: 'https://idxcarbon.co.id/data-monthly', tingkat_bukti: 'resmi', tanggal: tgl },
      { id: 's-p16', judul: 'Permen ESDM 16 Tahun 2022 tentang Tata Cara Penyelenggaraan Nilai Ekonomi Karbon Subsektor Pembangkit Tenaga Listrik', penerbit: 'Kementerian ESDM', tahun: 2022, url: 'https://jdih.esdm.go.id/dokumen/view?id=2357', tingkat_bukti: 'resmi', tanggal: tgl },
      { id: 's-hpp', judul: 'UU 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan, Bab VI Pajak Karbon', penerbit: 'Pemerintah RI (JDIH BPK)', tahun: 2021, url: 'https://peraturan.bpk.go.id/Details/185162', tingkat_bukti: 'resmi', tanggal: tgl },
      { id: 's-ct', judul: 'Climate TRACE v6: emisi aset ketenagalistrikan Indonesia 2024', penerbit: 'Climate TRACE', tahun: 2024, url: 'https://api.climatetrace.org/v6/assets', tingkat_bukti: 'via-pihak-ketiga', tanggal: tgl },
    ] };
}
/* pustaka hukum (katalog dibangun agen lain): hanya dokumen NEK yang ada di katalog -> tautan /hukum#d=<id>; sisanya tautan /regulasi */
const ID_NEK = ['permen-esdm-16-2022', 'pojk-10-2026', 'permen-esdm-2-2023', 'permen-esdm-16-2024'];
const hukumNek = (katalog) => ({
  pustaka: (katalog?.dok || []).filter((d) => ID_NEK.includes(d.id)).map((d) => ({ id: d.id, jenis: d.jenis, nomor: d.nomor, tahun: d.tahun, judul: d.judul, status: d.status || null, url: d.url, pdf: d.pdf?.[0] || null, href: '/hukum#d=' + encodeURIComponent(d.id) })),
  regulasi: [{ id: 'perpres-110-2025', judul: 'Perpres 110/2025 tentang Penyelenggaraan Instrumen Nilai Ekonomi Karbon dan Pengendalian Emisi GRK Nasional', href: '/regulasi?id=perpres-110-2025' }],
  catatan: katalog ? 'tautan per dokumen; pasal dibuka dari halaman dokumen di /hukum' : 'katalog /data/hukum/katalog.json belum ada saat bangun; semua tautan ke /regulasi',
});
const tahunEbt = (rs) => { const o = {}; for (const r of rs) for (const [y, v] of Object.entries(r.kredit.per_tahun || {})) { (o[y] ||= { t: 0, p: 0 }).t += v.t; o[y].p += v.p; } return Object.fromEntries(Object.entries(o).sort()); };

/* tambah pengembang yang belum ada di direktori ke data/direktori/entitas_tambah.json (dibaca potret); idempoten: hanya baris bertanda _asal ini yang ditulis ulang */
const SAMPAH_PENGEMBANG = /credits transferred|multiple project|^n\/a$|kphp/i;
export function tambahEntitas(reg, tgl, berkas = path.join(ROOT, 'data/direktori/entitas_tambah.json')) {
  const d = JSON.parse(fs.readFileSync(berkas, 'utf8')); const asing = d.baris.filter((b) => b._asal !== 'karbon_registri'), ada = new Set(asing.map((b) => b.nama.toLowerCase()));
  const baru = reg.meta.calon_pengembang.filter((n) => !SAMPAH_PENGEMBANG.test(n) && !ada.has(n.toLowerCase())).map((nama) => {
    const p = reg.baris.find((r) => r.pengembang === nama), u = p.registri[0].url;
    return { _asal: 'karbon_registri', nama, nama_lain: [], kategori: KATEGORI_PENGEMBANG(nama), kepakaran: ['karbon'], peran_rantai: ['pengembang'], sumber: [{ url: u, tingkat_bukti: p.tingkat_bukti, keterangan: `pengembang proyek karbon ${p.registri[0].nama} ${p.registri[0].id}, dibaca ${tgl}` }] };
  });
  d.baris = [...asing, ...baru]; const { baris, ...kepala } = d; // tata letak asli: satu baris per entitas
  fs.writeFileSync(berkas, '{\n' + Object.entries(kepala).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`).join('') + '  "baris": [\n' + baris.map((b) => '    ' + JSON.stringify(b)).join(',\n') + '\n  ]\n}\n'); return baru.length;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, tgl] = process.argv.slice(2); if (!dir || !tgl) { console.error('pakai: karbon_registri.mjs <dirMentah> <yyyy-mm-dd>'); process.exit(2); }
  const w = (n) => path.join(dir, n), j = (n) => JSON.parse(fs.readFileSync(w(n), 'utf8')), tx = (n) => fs.readFileSync(w(n), 'utf8');
  const org = muat('organisasi.json').baris;
  const reg = bangunRegistri({ vrod: j('vrod_id.json'), gs: j('gs_semua.json'), idxSpe: tx('idx_spe.html'), idxRaw: tx('idx_b_1.raw'), planvivo: tx('nanga.html') }, tgl, org);
  const dasar = muat('topik/dasar-karbon.json').karbon, ft = Object.fromEntries(dasar.pembangkit.per_jenis.map((x) => [x.jenis, x.faktor]));
  const idxBulanan = fs.readdirSync(dir).filter((f) => /^idx_b_\d+\.txt$/.test(f)).sort().map((f) => ({ teks: tx(f), url: 'https://idxcarbon.co.id/data-monthly' }));
  let katalog = null; try { katalog = muat('hukum/katalog.json'); } catch {}
  const pasar = bangunPasar({ katalog, idxBulanan, karbon: muat('karbon.json'), faktor: ft, sistem: dasar.sistem.map((s) => ({ id: s.id, nama: s.nama, tahun: s.tahun[0], intensitas_t_per_mwh: s.intensitas[0], tabel: s.tabel, skenario: s.skenario })) }, tgl, reg);
  fs.writeFileSync(path.join(ROOT, 'public/data/karbon_registri.json'), JSON.stringify(reg) + '\n');
  fs.writeFileSync(path.join(ROOT, 'public/data/karbon_pasar.json'), JSON.stringify(pasar) + '\n');
  if (process.argv.includes('--entitas')) console.log('entitas ditambah:', tambahEntitas(reg, tgl));
  console.log('registri', reg.jumlah, reg.meta.per_registri, reg.meta.per_sektor, 'antrean', reg.meta.antrean_tinjau.length, 'calon pengembang', reg.meta.calon_pengembang.length, '| pasar bulan', pasar.idxcarbon.bulanan.length);
}
