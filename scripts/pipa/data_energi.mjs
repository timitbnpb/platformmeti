// Bangun tiga dataset publik bersumber: public/data/{ruptl,plts_atap,wkp}.json.
// Masukan: data-panen/proyek/seed/ruptl.jsonl (hasil panen_proyek.mjs --ruptl-teks, lokal, tidak di repo),
//          data/energi/seed.json (kuota PLTS atap dari RUPTL Tabel 2.6, WKP kurasi), public/data/{proyek,berita,organisasi}.json.
// Tanpa jaringan; tanggal berasal dari masukan (bukan jam). Pakai: node scripts/pipa/data_energi.mjs [ruptl|plts_atap|wkp]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const tulis = (p, o) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(o) + '\n', 'utf8');

const URL_RUPTL = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf';
export const SUMBER = {
  'ruptl-2025': { id: 'ruptl-2025', judul: 'RUPTL PT PLN (Persero) 2025-2034 (lampiran Kepmen ESDM 188.K/TL.03/MEM.L/2025 tanggal 26 Mei 2025)', penerbit: 'PT PLN (Persero); disahkan Kementerian ESDM', tahun: 2025, url: URL_RUPTL },
  'permen-esdm-2-2024': { id: 'permen-esdm-2-2024', judul: 'Permen ESDM 2/2024 tentang PLTS Atap yang Terhubung pada Jaringan Tenaga Listrik IUPTLU untuk Kepentingan Umum', penerbit: 'Kementerian ESDM', tahun: 2024, url: 'https://jdih.esdm.go.id/' },
  'jica-hululais-2026': { id: 'jica-hululais-2026', judul: 'JICA, siaran pers perjanjian pinjaman PLTP Hululais', penerbit: 'JICA', tahun: 2026, url: 'https://www.jica.go.jp/english/information/press/2025/20260330_11.html' },
  'proyek-json': { id: 'proyek-json', judul: 'Data proyek METI (public/data/proyek.json; Wikipedia/Wikidata/RUPTL)', penerbit: 'METI Network', tahun: 2026, url: '/data/proyek.json' },
};
const TEK_REGIONAL = (sek) => { const [, h, n] = sek.match(/^([ABC])(\d+)$/); const k = +n; return h === 'B' ? 'jmb' : h === 'A' ? (k <= 10 ? 'sum' : 'kal') : 'smpnt'; };
const norm = (s) => String(s || '').toLowerCase().replace(/\(ftp2\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const tgl = (iso) => String(iso).slice(0, 10);

function beritaSumber(b, id, tahun) {
  return { id: 'berita-' + id, judul: b.judul, penerbit: b.media || b.penerbit || null, tahun: Number(tgl(b.terbit || b.tanggal).slice(0, 4)), url: b.url, tanggal: tgl(b.terbit || b.tanggal), tingkat_bukti: 'media' };
}
function petaBerita(seed) {
  const bj = baca('public/data/berita.json').baris; const m = new Map(bj.map((x) => [x.id, x]));
  return (id) => (seed.berita_url_tetap[id] ? beritaSumber(seed.berita_url_tetap[id], id) : (m.has(id) ? beritaSumber(m.get(id), id) : null));
}
const jumlahKunci = (arr, f) => arr.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
const urut = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

export function bangunRuptl(seedJsonl, proyek, seed) {
  const baris = []; let hal = null; let tanggal = null;
  const lines = seedJsonl.trim().split('\n').map((l) => JSON.parse(l));
  const peta = new Map(); // (nama normal | provinsi) -> id proyek
  for (const p of proyek) if ((p.program_ids || []).includes('ruptl')) peta.set(norm(p.nama) + '|' + (p.lokasi?.provinsi || ''), p.id);
  const petaNama = new Map(); for (const p of proyek) if ((p.program_ids || []).includes('ruptl')) petaNama.set(norm(p.nama), p.id);
  for (const r of lines) {
    if (r._sumber) { hal = Number(String(r._sumber.halaman).replace(/\D/g, '')); tanggal = r._sumber.tanggal_ambil; continue; }
    const sek = (r.catatan.match(/RUPTL ([ABC]\d+)/) || [])[1];
    const kunci = [sek, r.teknologi, norm(r.nama)].join('|');
    const nm = norm(r.nama);
    const pid = peta.get(nm + '|' + (r.provinsi || '')) || petaNama.get(nm) || null;
    baris.push({
      id: 'rp_' + crypto.createHash('sha1').update(kunci).digest('hex').slice(0, 8),
      nama: r.nama, teknologi: r.teknologi, provinsi: r.provinsi ?? null, regional: TEK_REGIONAL(sek), tabel_ruptl: sek,
      kapasitas_mw: r.kapasitas.nilai, kapasitas_catatan: r.kapasitas.catatan ?? null,
      cod_tahun: (r.cod_target || []).map((c) => c.nilai), cod_catatan: 'skenario RE Base' + ((r.cod_target || []).some((c) => /ARED/.test(c.catatan || '')) ? '; sebagian tahap beda di skenario ARED' : ''),
      status: r.status?.nilai ?? 'tidak-diketahui', status_asli: r.status?.status_asli ?? null,
      pengembang_status: r.pemilik?.nilai ?? null, // PLN / SH-PLN / IPP (bukan nama perusahaan)
      proyek_id: pid, nama_perlu_tinjau: r.nama_perlu_tinjau ? true : undefined,
      sumber_id: 'ruptl-2025', tahun: 2025, halaman: hal,
    });
  }
  const dedup = new Set(); for (const b of baris) { if (dedup.has(b.id)) b.id += '_' + baris.filter((x) => x.id.startsWith(b.id)).length; dedup.add(b.id); }
  baris.sort((a, b) => a.tabel_ruptl.localeCompare(b.tabel_ruptl, 'en', { numeric: true }) || a.nama.localeCompare(b.nama));
  const mw = (f) => { const o = {}; for (const b of baris) { const k = f(b); o[k] = +(((o[k]) || 0) + b.kapasitas_mw).toFixed(3); } return urut(o); };
  const sumber = [SUMBER['ruptl-2025']];
  return {
    meta: {
      diperbarui: tanggal, tahun_dokumen: 2025, periode: '2025-2034', jumlah: baris.length,
      tautan_proyek: baris.filter((b) => b.proyek_id).length,
      keterangan: 'Hanya pembangkit EBT bernama pada tabel rincian per provinsi (Lampiran A, B, C). Tahun COD = skenario RE Base. Pengembang = status menurut RUPTL (PLN/SH-PLN/IPP), bukan nama perusahaan.',
      celah: [
        'Tabel berupa gambar tidak diurai (tanpa OCR).',
        'Baris kuota/tersebar (mis. PLTS kuota, dedieselisasi) dilewati; bukan proyek bernama.',
        'Provinsi null untuk tabel gabungan Papua (C9, C10): provinsi per baris tidak pasti.',
        'Kapasitas baris bergabung = jumlah tahap/unit bernama sama dalam satu provinsi; COD per tahap tidak dipisah.',
        'Status null berarti kolom status tidak terbaca di PDF (dicatat tidak-diketahui).',
        'Nama berstatus nama_perlu_tinjau terpotong oleh tata letak PDF; belum dicocokkan manual.',
        'Pembangkit non-EBT (PLTU/PLTG/PLTGU) tidak dimasukkan.',
      ],
    },
    sumber,
    ringkasan: { per_teknologi: jumlahKunci(baris, (b) => b.teknologi), per_status: jumlahKunci(baris, (b) => b.status), mw_per_teknologi: mw((b) => b.teknologi), mw_per_status: mw((b) => b.status), mw_per_regional: mw((b) => b.regional) },
    baris,
  };
}

export function bangunPltsAtap(seed, bt) {
  const a = seed.plts_atap; const berita = seed.berita_atap.map((i) => bt(i)).filter(Boolean);
  const baris = [];
  for (const r of a.regional) a.tahun.forEach((y, i) => baris.push({ regional: r.kode, nama: r.nama, tahun: y, kuota_mw: r.mw[i], realisasi_mw: null, pelanggan: null, sumber_id: 'ruptl-2025' }));
  return {
    meta: {
      diperbarui: '2026-11-07', jumlah: baris.length,
      keterangan: 'Kuota PLTS atap PLN per regional (Tabel 2.6 RUPTL 2025-2034; kerangka Permen ESDM 2/2024: kuota per periode 5 tahun, dievaluasi tahunan, dipublikasikan IUPTLU). Kuota per UP3/klaster tidak dipublikasikan di dokumen ini.',
      celah: [
        'Realisasi (MW) dan jumlah pelanggan PLTS atap belum ditemukan pada sumber resmi yang boleh dipanen (laman EBTKE berupa SPA tanpa API publik terdokumentasi); kolom null.',
        'Kuota per sistem/UP3 (aplikasi PLN Mobile) tidak dipanen; hanya 4 regional dari RUPTL.',
        'Angka kuota RUPTL dapat berubah (dievaluasi tiap tahun); ini angka dokumen 2025.',
      ],
    },
    sumber: [SUMBER['ruptl-2025'], SUMBER['permen-esdm-2-2024'], ...berita],
    regional: a.regional.map(({ kode, nama }) => ({ kode, nama })),
    kuota_sampai_2024_mw: { nilai: a.kuota_sampai_2024_mw, tahun: 2024, sumber_id: 'ruptl-2025', halaman: a.halaman },
    total: { per_tahun: Object.fromEntries(a.tahun.map((y, i) => [y, a.total_tabel.mw[i]])), jumlah_mw: a.total_tabel.total, sumber_id: 'ruptl-2025', halaman: a.halaman },
    baris,
  };
}

export function bangunWkp(seed, bt, proyekIds, orgIds) {
  const sumber = new Map(); const pakai = (s) => { if (s && !sumber.has(s.id)) sumber.set(s.id, s); return s?.id; };
  const baris = seed.wkp.map((w) => {
    const sid = [];
    for (const b of w.berita || []) { const s = bt(b); if (!s) throw new Error('berita tidak ada: ' + b); sid.push(pakai(s)); }
    for (const r of w.resmi || []) sid.push(pakai(r.url.includes('jica') ? SUMBER['jica-hululais-2026'] : null));
    if (w.proyek_ids?.length || w.terpasang_sumber) sid.push(pakai(SUMBER['proyek-json']));
    if (w.rencana_catatan && /RUPTL/.test(w.rencana_catatan)) sid.push(pakai(SUMBER['ruptl-2025']));
    for (const p of w.proyek_ids || []) if (!proyekIds.has(p)) throw new Error('proyek_id tidak ada: ' + p);
    if (w.organisasi_id && !orgIds.has(w.organisasi_id)) throw new Error('organisasi_id tidak ada: ' + w.organisasi_id);
    const adaBerita = (w.berita || []).length > 0; const resmi = (w.resmi || []).length > 0;
    return {
      id: w.id, nama: w.nama, jenis: w.jenis, provinsi: w.provinsi, provinsi_catatan: w.provinsi_catatan ?? null,
      pemegang: w.pemegang ?? null, organisasi_id: w.organisasi_id ?? null, pemegang_catatan: w.pemegang_catatan ?? null,
      status: w.status, status_asli: w.status_asli,
      terpasang_mw: w.terpasang_mw ?? null, terpasang_sumber_id: w.terpasang_mw != null ? 'proyek-json' : null,
      rencana_mw: w.rencana_mw ?? null, rencana_catatan: w.rencana_catatan ?? null,
      lat: null, lng: null, proyek_ids: w.proyek_ids ?? [],
      tahun: w.tahun, tingkat_bukti: resmi ? 'resmi' : (adaBerita ? 'media' : 'tidak-diketahui'),
      sumber_ids: [...new Set(sid.filter(Boolean))],
    };
  });
  return {
    meta: {
      diperbarui: '2026-11-07', jumlah: baris.length,
      keterangan: 'Daftar kurasi WKP/PSPE panas bumi yang punya bukti publik: lelang 2025 (3 WKP + 7 PSPE) dan WKP/PLTP yang disebut berita 2026 atau dokumen resmi. Bukan daftar lengkap seluruh WKP nasional.',
      celah: [
        'Geoportal ESDM melarang semua robot (robots.txt Disallow /); koordinat WKP tidak dipanen (lat/lng null).',
        'Situs EBTKE (SPA) tidak punya daftar WKP yang dapat dipanen sopan; daftar WKP nasional lengkap (SK penetapan, pemegang izin) belum tersedia.',
        'Kapasitas terpasang hanya Kamojang (data proyek Wikipedia/Wikidata); lainnya null, belum ada sumber resmi per WKP.',
        'Hasil lelang 2025 (pemenang) belum ditemukan; pemegang null.',
        'Tingkat bukti media untuk semua entri berita; status mengikuti judul/isi berita, bukan Kepmen.',
        'Geo Dipa Energi belum ada di organisasi.json; organisasi_id null.',
      ],
    },
    sumber: [...sumber.values()].sort((a, b) => a.id.localeCompare(b.id)),
    baris,
  };
}

function main() {
  const a = process.argv[2] || 'semua'; const seed = baca('data/energi/seed.json'); const proyek = baca('public/data/proyek.json').baris;
  const bt = petaBerita(seed);
  if (a === 'semua' || a === 'ruptl') {
    const p = path.join(ROOT, 'data-panen/proyek/seed/ruptl.jsonl');
    if (!fs.existsSync(p)) { console.error('ruptl.jsonl tidak ada: jalankan panen_proyek.mjs --ruptl-teks=...'); process.exit(a === 'ruptl' ? 1 : 0); }
    const d = bangunRuptl(fs.readFileSync(p, 'utf8'), proyek, seed);
    d.sumber.push(...seed.berita_ruptl.map(bt).filter(Boolean)); d.meta.berita_terkait = seed.berita_ruptl.map((i) => 'berita-' + i);
    tulis('public/data/ruptl.json', d); console.log('ruptl', d.baris.length, 'tautan', d.meta.tautan_proyek);
  }
  if (a === 'semua' || a === 'plts_atap') { const d = bangunPltsAtap(seed, bt); tulis('public/data/plts_atap.json', d); console.log('plts_atap', d.baris.length); }
  if (a === 'semua' || a === 'wkp') {
    const org = new Set(baca('public/data/organisasi.json').baris.map((x) => x.id));
    const d = bangunWkp(seed, bt, new Set(proyek.map((x) => x.id)), org); tulis('public/data/wkp.json', d); console.log('wkp', d.baris.length);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
