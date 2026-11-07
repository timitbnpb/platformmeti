// Turunan halaman /proyek-besar, /proyek-berhenti, dan angka tenaga kerja EST (public/data/proyek_besar.json).
// Masukan: public/data/proyek.json, organisasi.json, data/metode/faktor_kerja.json. Tanpa angka karangan: faktor dikutip di faktor_kerja.json.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const AMBANG_MW = 100;
const MW_SATUAN = new Set(['MW', 'MWp']);
const TIDAK_DIUNGKAP = /^(ipp|sh-pln|pln|-)$/i;

const kapasitas = (p) => {
  const k = (p.kapasitas || []).find((x) => Number.isFinite(x.nilai) && MW_SATUAN.has(x.satuan));
  return k ? { mw: k.nilai, sat: k.satuan } : null;
};
const statusDari = (p) => ((p.status || [])[0] || {}).nilai || 'tidak-diketahui';
const codMin = (p) => { const a = (p.cod_target || []).map((c) => c.nilai).filter(Number.isFinite); return a.length ? Math.min(...a) : null; };
const sumberUtama = (p) => { const s = (p.sumber || [])[0] || {}; return { url: s.url || '', tanggal: s.tanggal || '', jenis: s.jenis || '' }; };
const pemilikDari = (p) => {
  const d = ((p.pihak || {}).pemilik || []).filter((x) => x.nilai && !TIDAK_DIUNGKAP.test(x.nilai.trim()));
  const x = d[0]; if (!x) return null;
  const m = /(\d+(?:[.,]\d+)?)\s*%/.exec(x.catatan || '');
  return { nama: x.nilai, org_id: x.organisasi_id || '', porsi: m ? Number(m[1].replace(',', '.')) : null, lainnya: d.length - 1 };
};

export function tingkat(p) {
  const st = statusDari(p);
  if (st === 'beroperasi') return 'beroperasi';
  if ((p.status || []).some((s) => /^PPA$/i.test(s.status_asli || ''))) return 'ppa';
  if ((p.program_ids || []).includes('ruptl')) return 'ruptl';
  return 'est';
}

export function faktorKerja(p, F) {
  const k = kapasitas(p); if (!k || !p.teknologi) return null;
  let kunci = p.teknologi;
  if (kunci === 'hidro') kunci = k.mw > F.ambang_hidro_besar_mw ? 'hidro-besar' : 'hidro-kecil';
  const f = F.faktor[kunci]; if (!f) return null;
  const m = F.pengali_wilayah.nilai;
  return { konstruksi: Math.round(k.mw * f.konstruksi * m), om: Math.round(k.mw * f.om * m) };
}

export function bangun(proyek, organisasi, F, tanggal) {
  const orgInduk = new Map(organisasi.map((o) => [o.id, o.induk || '']));
  const L = proyek.baris;
  const besar = { beroperasi: [], ppa: [], ruptl: [], est: [] }, dikeluarkan = [], terlihat = new Map();
  const baris = (p, k) => {
    const o = pemilikDari(p), kj = faktorKerja(p, F);
    return { id: p.id, nama: p.nama, tek: p.teknologi || '', prov: (p.lokasi || {}).provinsi || '', mw: k.mw, sat: k.sat, status: statusDari(p), cod: codMin(p), tahun_operasi: ((p.cod_aktual || [])[0] || {}).nilai ?? null,
      pemilik: o ? o.nama : '', org_id: o ? o.org_id : '', porsi: o ? o.porsi : null, induk: o && o.org_id ? orgInduk.get(o.org_id) || '' : '', bukti: p.tingkat_bukti, sumber_url: sumberUtama(p).url, sumber_jenis: sumberUtama(p).jenis, sumber_tanggal: sumberUtama(p).tanggal, kerja: kj };
  };
  const nama = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const p of L) {
    const k = kapasitas(p); if (!k || k.mw < AMBANG_MW) continue;
    const st = statusDari(p), r = baris(p, k);
    if (st === 'dibatalkan' || st === 'ditunda') { dikeluarkan.push({ id: p.id, nama: p.nama, mw: k.mw, dalam: '', alasan: 'berhenti' }); continue; }
    if (p.teknologi === 'penyimpanan') { dikeluarkan.push({ id: p.id, nama: p.nama, mw: k.mw, dalam: '', alasan: 'penyimpanan' }); continue; }
    const kunci = [nama(p.nama.replace(/\b(\w+)( \1\b)+/gi, '$1')), p.teknologi, k.mw].join('|');
    if (terlihat.has(kunci)) { dikeluarkan.push({ id: p.id, nama: p.nama, mw: k.mw, dalam: terlihat.get(kunci), alasan: 'ganda' }); continue; }
    terlihat.set(kunci, p.id);
    besar[tingkat(p)].push(r);
  }
  // anak usaha: MW yang tercatat pada pemilik anak usaha sudah ada di kelompok induknya
  const kelompok = new Map();
  for (const r of Object.values(besar).flat()) {
    if (!r.pemilik) continue;
    const kunciK = r.induk || r.pemilik, g = kelompok.get(kunciK) || { kelompok: kunciK, mw: 0, n: 0, anak: new Set() };
    g.mw += r.mw * ((r.porsi ?? 100) / 100); g.n += 1; if (r.induk) g.anak.add(r.pemilik);
    kelompok.set(kunciK, g);
    if (r.induk) dikeluarkan.push({ id: r.id, nama: r.pemilik, mw: r.mw, dalam: r.induk, alasan: 'anak' });
  }
  const per_kelompok = [...kelompok.values()].map((g) => ({ kelompok: g.kelompok, mw: Math.round(g.mw), n: g.n, anak: [...g.anak] })).sort((a, b) => b.mw - a.mw).slice(0, 15);
  const jumlah_mw = {}; for (const [k, v] of Object.entries(besar)) jumlah_mw[k] = Math.round(v.reduce((a, r) => a + r.mw, 0));

  // proyek berhenti: dibatalkan/ditunda (status sumber) atau lewat COD target (turunan dari target sumber, bukan laporan penundaan)
  const tahunIni = Number(tanggal.slice(0, 4)), berhenti = [];
  for (const p of L) {
    const st = statusDari(p), k = kapasitas(p), s = sumberUtama(p);
    if (!s.url) continue;
    const asli = ((p.status || [])[0] || {}).status_asli || '';
    let jenis = '';
    if (st === 'dibatalkan') jenis = 'batal'; else if (st === 'ditunda' || /tunda|henti|mangkrak/i.test(asli)) jenis = 'henti';
    else if (st !== 'beroperasi' && codMin(p) !== null && codMin(p) < tahunIni) jenis = 'mundur';
    if (!jenis) continue;
    // sumber tidak memuat tanggal pembatalan: tahun = tahun pencatatan sumber, tanggal dikosongkan
    const tgl = '';
    berhenti.push({ id: p.id, nama: p.nama, tek: p.teknologi || '', prov: (p.lokasi || {}).provinsi || '', mw: k ? k.mw : null, sat: k ? k.sat : '', jenis,
      tahun: jenis === 'mundur' ? codMin(p) : Number(s.tanggal.slice(0, 4)), tanggal: tgl, cod: codMin(p), bukti: p.tingkat_bukti, dilaporkan_media: p.tingkat_bukti === 'media', sumber_url: s.url, sumber_jenis: s.jenis, status_asli: asli });
  }
  const pt = new Map();
  for (const b of berhenti) { const g = pt.get(b.tahun) || { tahun: b.tahun, jumlah: 0, mw: 0 }; g.jumlah++; g.mw += b.mw || 0; pt.set(b.tahun, g); }
  const per_tahun = [...pt.values()].sort((a, b) => b.tahun - a.tahun);

  // tenaga kerja EST: proyek yang masih hidup (bukan batal/tunda)
  const per = (f) => { const m = new Map(); for (const p of L) { const st = statusDari(p); if (st === 'dibatalkan' || st === 'ditunda') continue; const kj = faktorKerja(p, F), k = kapasitas(p); const key = f(p); if (!kj || !key) continue;
      const g = m.get(key) || { kunci: key, n: 0, mw: 0, konstruksi: 0, om: 0 }; g.n++; g.mw += k.mw; if (st === 'beroperasi') g.om += kj.om; else g.konstruksi += kj.konstruksi; m.set(key, g); }
    return [...m.values()].map((g) => ({ ...g, mw: Math.round(g.mw) })).sort((a, b) => b.konstruksi + b.om - a.konstruksi - a.om); };
  const per_proyek = {}; for (const p of L) { const kj = faktorKerja(p, F); if (kj) per_proyek[p.id] = kj; }

  // alasan sel kosong
  const tak = { pemilik: { tidak_diungkap: 0, belum_bersumber: 0, di_luar_cakupan: 0, tidak_berlaku: 0 }, kapasitas: { tidak_diungkap: 0, belum_bersumber: 0, di_luar_cakupan: 0, tidak_berlaku: 0 }, cod: { tidak_diungkap: 0, belum_bersumber: 0, di_luar_cakupan: 0, tidak_berlaku: 0 }, lokasi: { tidak_diungkap: 0, belum_bersumber: 0, di_luar_cakupan: 0, tidak_berlaku: 0 } };
  for (const p of L) {
    const luar = p.asal === 'worldbank' || p.asal === 'jica' || !p.teknologi, st = statusDari(p);
    const o = ((p.pihak || {}).pemilik || [])[0];
    if (!pemilikDari(p)) tak.pemilik[o ? 'tidak_diungkap' : luar ? 'di_luar_cakupan' : 'belum_bersumber']++;
    if (!kapasitas(p)) tak.kapasitas[(p.kapasitas || []).length || luar ? 'di_luar_cakupan' : 'belum_bersumber']++;
    if (codMin(p) === null) tak.cod[st === 'beroperasi' || st === 'dibatalkan' ? 'tidak_berlaku' : luar ? 'di_luar_cakupan' : 'belum_bersumber']++;
    if (!p.lokasi) tak.lokasi[luar ? 'di_luar_cakupan' : 'belum_bersumber']++;
  }
  return { lapis: 'publik', dibangun_pada: tanggal, ambang_mw: AMBANG_MW, jumlah_proyek: L.length, besar, jumlah_mw, per_kelompok, dikeluarkan, berhenti: { per_tahun, baris: berhenti },
    kerja: { faktor: F.faktor, pengali: F.pengali_wilayah, ambang_hidro: F.ambang_hidro_besar_mw, sumber: F.sumber, tanpa_faktor: F.tanpa_faktor, per_provinsi: per((p) => (p.lokasi || {}).provinsi), per_teknologi: per((p) => p.teknologi), per_proyek }, sel_kosong: tak };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const proyek = J('public/data/proyek.json');
  const out = bangun(proyek, J('public/data/organisasi.json').baris, J('data/metode/faktor_kerja.json'), proyek.dibangun_pada);
  fs.writeFileSync('public/data/proyek_besar.json', JSON.stringify(out));
  console.log('proyek_besar.json', Object.entries(out.besar).map(([k, v]) => k + ':' + v.length).join(' '), 'berhenti', out.berhenti.baris.length, 'dikeluarkan', out.dikeluarkan.length);
}
