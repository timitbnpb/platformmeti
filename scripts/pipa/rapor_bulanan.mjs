// Rapor "Kondisi EBT Indonesia" bulanan dan tahunan -> public/data/rapor/<YYYY-MM>.json, <YYYY>.json, indeks.json.
// Pakai: node scripts/pipa/rapor_bulanan.mjs [--tanggal=YYYY-MM-DD]   (tanggal beku dari masukan, bukan jam)
// Angka hanya dari berkas yang ada (proyek, berita, regulasi, tender, pendanaan_internasional). Tidak ada data = null + alasan, bukan tebakan.
// Keterbatasan data: COD proyek hanya per tahun (bukan bulan), sehingga MW baru hanya ada di rapor tahunan; berita hanya sejak Juli 2026.
import fs from 'node:fs';
import path from 'node:path';
import { AKAR, TANGGAL, tulis } from './_panen_umum.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const NAMA_UMUM = /status pengembang menurut RUPTL/i; // IPP / SH-PLN bukan perusahaan
const kunciOrg = (s) => String(s).toLowerCase().replace(/\(persero\)|\btbk\b|\bpt\b|\bltd\b|[.,]/g, '').replace(/\s+/g, ' ').trim();
const mwProyek = (p) => (p.kapasitas || []).find((k) => k.satuan === 'MW')?.nilai ?? null;
const statusProyek = (p) => p.status?.at(-1)?.nilai ?? null;
const bulanDari = (s) => String(s || '').slice(0, 7);
const bulat = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const TUNDA = /\b(batal|dibatalkan|mundur|tertunda|ditunda|molor|dihentikan|mangkrak|terhenti|gagal)\b/i;

export function peringkatPengembang(proyek, atas = 10) {
  const m = new Map(); let mwNama = 0, mwSemua = 0, nSemua = 0, nNama = 0;
  for (const p of proyek) {
    const mw = mwProyek(p); if (mw == null) continue;
    mwSemua += mw; nSemua++;
    const pem = (p.pihak?.pemilik || []).find((x) => x.nilai && !NAMA_UMUM.test(x.catatan || ''));
    if (!pem) continue;
    const k = kunciOrg(pem.nilai), g = m.get(k) || { nama: pem.nilai, mw: 0, proyek: 0 };
    if (pem.nilai.length > g.nama.length && /^PT/.test(pem.nilai)) g.nama = pem.nilai;
    g.mw += mw; g.proyek++; m.set(k, g); mwNama += mw; nNama++;
  }
  const urut = [...m.values()].sort((a, z) => z.mw - a.mw || a.nama.localeCompare(z.nama, 'id'));
  const top = urut.slice(0, atas), mwTop = top.reduce((n, g) => n + g.mw, 0);
  return { jumlah_pengembang: urut.length, atas: top.length, porsi_atas_persen: mwNama ? bulat(mwTop / mwNama * 100) : null, mw_bernama: bulat(mwNama, 0), mw_semua: bulat(mwSemua, 0), proyek_bernama: nNama, proyek_ber_mw: nSemua,
    baris: urut.slice(0, 15).map((g, i) => ({ peringkat: i + 1, nama: g.nama, mw: bulat(g.mw, 0), proyek: g.proyek, porsi_persen: mwNama ? bulat(g.mw / mwNama * 100) : null })) };
}

export function peringkatPendana(pendanaan) {
  const m = new Map();
  for (const x of pendanaan) { if (!x.pemberi) continue; const g = m.get(x.pemberi) || { nama: x.pemberi, n: 0, usd: 0 }; g.n++; g.usd += x.nilai_usd || 0; m.set(x.pemberi, g); }
  const urut = [...m.values()].sort((a, z) => z.n - a.n || z.usd - a.usd || a.nama.localeCompare(z.nama, 'id'));
  return { jumlah_pendana: urut.length, satu_saja: urut.filter((g) => g.n === 1).length, jumlah_aktivitas: pendanaan.length,
    baris: urut.slice(0, 15).map((g, i) => ({ peringkat: i + 1, nama: g.nama, proyek: g.n, nilai_usd: g.usd || null })) };
}

export function berhenti(proyek, berita) {
  const tahun = new Map();
  for (const b of berita) if (TUNDA.test(b.judul || '')) { const y = String(b.terbit || '').slice(0, 4); if (y) tahun.set(y, (tahun.get(y) || 0) + 1); }
  const proyekBerhenti = proyek.filter((p) => ['dibatalkan', 'ditunda'].includes(statusProyek(p))).map((p) => {
    const s = p.sumber?.[0] || {}, media = ['media', 'via-pihak-ketiga', 'cuplikan'].includes(p.tingkat_bukti);
    return { id: p.id, nama: p.nama, status: statusProyek(p), mw: mwProyek(p), tanggal: s.tanggal || null, dilaporkan_media: media, sumber_url: s.url || null };
  }).sort((a, z) => (z.mw || 0) - (a.mw || 0));
  return { per_tahun: [...tahun].sort().map(([th, n]) => ({ tahun: th, jumlah: n })), proyek: proyekBerhenti, catatan: 'Jumlah per tahun = judul berita bernada batal, mundur, atau tunda; bukan jumlah proyek.' };
}

export function keterbukaan(proyek) {
  const ada = proyek.filter((p) => p.nilai_investasi?.length);
  return { total: proyek.length, dengan_nilai: ada.length, dengan_ppa: 0, alasan_ppa: 'Tidak ada kolom PPA publik di data proyek; PPA umumnya rahasia.',
    baris: ada.map((p) => { const n = p.nilai_investasi[0]; return { id: p.id, nama: p.nama, nilai: n.nilai, satuan: n.satuan, jenis: /perkiraan|sekitar|hampir|kisaran/i.test(n.catatan || '') ? 'perkiraan' : 'dilaporkan', mw: mwProyek(p) }; })
      .sort((a, z) => (z.satuan === 'USD' ? z.nilai : z.nilai / 16000) - (a.satuan === 'USD' ? a.nilai : a.nilai / 16000)).slice(0, 15) };
}

export function rapor(jenis, periode, D) {
  const ok = (s) => (jenis === 'bulanan' ? bulanDari(s) === periode : String(s || '').slice(0, 4) === periode);
  const sebelum = jenis === 'bulanan' ? (() => { const [y, m] = periode.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; })() : String(Number(periode) - 1);
  const oks = (s) => (jenis === 'bulanan' ? bulanDari(s) === sebelum : String(s || '').slice(0, 4) === sebelum);
  const hitung = (daftar, kunci) => [daftar.filter((x) => ok(x[kunci])).length, daftar.filter((x) => oks(x[kunci])).length];
  const [nBerita, nBeritaLalu] = hitung(D.berita, 'terbit'), [nReg, nRegLalu] = hitung(D.regulasi, 'tanggal_ditetapkan'), [nTender, nTenderLalu] = hitung(D.tender, 'tanggal');
  const cod = (th) => D.proyek.filter((p) => (p.cod_aktual || []).some((c) => String(c.nilai) === String(th)) && statusProyek(p) === 'beroperasi');
  let kapasitas = null, codN = null, mwBaru = null, mwLalu = null;
  if (jenis === 'tahunan') {
    const per = new Map(); for (const p of cod(periode)) { const mw = mwProyek(p); if (mw == null) continue; const t = p.teknologi || 'tidak-diketahui', g = per.get(t) || { teknologi: t, mw: 0, proyek: 0 }; g.mw += mw; g.proyek++; per.set(t, g); }
    kapasitas = [...per.values()].map((g) => ({ ...g, mw: bulat(g.mw) })).sort((a, z) => z.mw - a.mw);
    codN = cod(periode).length; mwBaru = bulat(kapasitas.reduce((n, g) => n + g.mw, 0));
    mwLalu = bulat(cod(sebelum).reduce((n, p) => n + (mwProyek(p) || 0), 0));
  }
  const reg = D.regulasi.filter((r) => ok(r.tanggal_ditetapkan)).sort((a, z) => String(z.tanggal_ditetapkan).localeCompare(a.tanggal_ditetapkan)).slice(0, 8).map((r) => ({ id: r.id, judul: r.judul, tanggal: r.tanggal_ditetapkan, jenis: r.jenis }));
  const ber = D.berita.filter((b) => ok(b.terbit)).sort((a, z) => String(z.terbit).localeCompare(a.terbit)).slice(0, 6).map((b) => ({ id: b.id, judul: b.judul, media: b.media, tanggal: String(b.terbit).slice(0, 10), url: b.url }));
  const tender = D.tender.filter((x) => ok(x.tanggal)).map((x) => ({ id: x.id, judul: x.judul, tahap: x.tahap, tanggal: x.tanggal, mw: x.rencana_mw ?? null }));
  return {
    jenis, periode, dibekukan: TANGGAL, cakupan: { berita_sejak: D.berita.map((b) => bulanDari(b.terbit)).sort()[0] },
    ubin: jenis === 'tahunan'
      ? { mw_baru: mwBaru, proyek_cod: codN, regulasi: nReg, berita: nBerita }
      : { mw_baru: null, proyek_cod: null, regulasi: nReg, berita: nBerita, tender: nTender },
    alasan: jenis === 'bulanan' ? { mw_baru: 'COD proyek di data hanya per tahun, tidak per bulan; lihat rapor tahunan.' } : {},
    banding: { periode_lalu: sebelum, berita: [nBerita, nBeritaLalu], regulasi: [nReg, nRegLalu], tender: [nTender, nTenderLalu], mw_baru: jenis === 'tahunan' ? [mwBaru, mwLalu] : null },
    kapasitas_baru: kapasitas, regulasi: reg, berita: ber, tender,
    bagian: { pengembang: peringkatPengembang(D.proyek), pendana: peringkatPendana(D.pendanaan), berhenti: berhenti(D.proyek, D.berita), terbuka: keterbukaan(D.proyek) },
  };
}

export function periodeAda(D) {
  const bulan = new Set([...D.berita.map((b) => bulanDari(b.terbit)), ...D.regulasi.map((r) => bulanDari(r.tanggal_ditetapkan)), ...D.tender.map((x) => bulanDari(x.tanggal))].filter((m) => /^2026-(0[1-9]|1[0-1])$/.test(m)));
  const tahun = new Set(D.proyek.flatMap((p) => (p.cod_aktual || []).map((c) => String(c.nilai))).filter((y) => /^20(1[5-9]|2\d)$/.test(y)));
  tahun.add(TANGGAL.slice(0, 4));
  return { bulanan: [...bulan].sort().reverse(), tahunan: [...tahun].sort().reverse() };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const D = { proyek: baca('proyek.json').baris, berita: baca('berita.json').baris, regulasi: baca('regulasi.json').baris, tender: baca('tender.json').baris, pendanaan: baca('pendanaan_internasional.json').baris };
  const { bulanan, tahunan } = periodeAda(D), dir = path.join(AKAR, 'public/data/rapor');
  for (const p of bulanan) tulis(path.join(dir, p + '.json'), rapor('bulanan', p, D));
  for (const p of tahunan) tulis(path.join(dir, p + '.json'), rapor('tahunan', p, D));
  tulis(path.join(dir, 'indeks.json'), { dibangun_pada: TANGGAL, bulanan, tahunan });
  console.log('rapor:', bulanan.length, 'bulanan,', tahunan.length, 'tahunan');
}
