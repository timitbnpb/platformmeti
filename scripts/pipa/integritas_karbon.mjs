#!/usr/bin/env node
// public/data/integritas_karbon.json: uji integritas proyek karbon dari data publik. Bahasa netral: bendera = "perlu verifikasi", BUKAN tuduhan.
//   node scripts/pipa/integritas_karbon.mjs   (offline; butuh public/data/klaim_lahan.json dari klaim_lahan.mjs bangun)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { muatKarbon } from './klaim_lahan.mjs';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TGL = new Date().toISOString().slice(0, 10);
export const JENIS = [
  { id: 'ganda_registri', tingkat: 'perhatian', ikon: 'salin' }, { id: 'tumpang_karbon', tingkat: 'perhatian', ikon: 'peta' },
  { id: 'tumpang_konsesi', tingkat: 'perhatian', ikon: 'pabrik' }, { id: 'tumpang_adat', tingkat: 'tinggi', ikon: 'orang' },
  { id: 'kawasan_lindung', tingkat: 'info', ikon: 'perisai' }, { id: 'metodologi_kosong', tingkat: 'info', ikon: 'buku' },
  { id: 'status_tak_jelas', tingkat: 'perhatian', ikon: 'tanya' }, { id: 'otorisasi_tak_disebut', tingkat: 'info', ikon: 'lencana' },
  { id: 'lokasi_umum', tingkat: 'info', ikon: 'lokasi' },
];
const kata = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !/^(project|indonesia|power|programme|activities|energy|plant)$/.test(w)));
const jacc = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; return i / Math.max(1, a.size + b.size - i); };
const km = (a, b) => Math.hypot((a.lat - b.lat) * 110.57, (a.lng - b.lng) * 111.32 * Math.cos((a.lat * Math.PI) / 180));
const SRC = (r) => ({ url: r.sumber_url, judul: `${r.registri} ${r.registri_id}`, tanggal: r.tanggal || TGL });

export function uji(baris, klaim) {
  const kl = new Map(klaim.proyek.filter((p) => p.jenis === 'karbon').map((p) => [p.id, p]));
  const lok = baris.filter((b) => b.lat != null);
  const kembar = new Map(); for (const b of lok) { const k = b.lat + ',' + b.lng; kembar.set(k, (kembar.get(k) || 0) + 1); }
  return baris.map((b) => {
    const r = b.raw, k = kl.get(b.id), f = [], tambah = (jenis, fakta) => f.push({ jenis, fakta, sumber: SRC(r), tanggal: TGL });
    if (b.lat != null && kembar.get(b.lat + ',' + b.lng) >= 3) tambah('lokasi_umum', `Koordinat ${b.lat}, ${b.lng} dipakai ${kembar.get(b.lat + ',' + b.lng)} entri registri sekaligus; kemungkinan titik pusat program, bukan lokasi tapak. Tumpang tindih lahan tidak dinilai.`);
    for (const o of lok) if (o !== b && b.lat != null && (r.registri !== o.raw.registri)) {
      const s = jacc(kata(b.nama), kata(o.nama)), d = km(b, o);
      if (s >= 0.5 || (d < 5 && s >= 0.25)) tambah('ganda_registri', `Nama dan lokasi mirip dengan ${o.raw.registri} ${o.raw.registri_id} ("${o.nama}", jarak sekitar ${Math.round(d)} km; kemiripan nama ${Math.round(s * 100)} persen). Perlu verifikasi apakah satu proyek tercatat di dua registri (risiko hitung ganda).`);
    }
    if (b.lat != null && !(kembar.get(b.lat + ',' + b.lng) >= 3)) {
      for (const o of lok) if (o !== b && o.id > b.id && km(b, o) < (k?.r_km || 3) + 3 && r.registri_id !== o.raw.registri_id && jacc(kata(b.nama), kata(o.nama)) < 0.5 && !(kembar.get(o.lat + ',' + o.lng) >= 3))
        tambah('tumpang_karbon', `Radius perkiraan berimpit dengan proyek karbon "${o.nama}" (${o.raw.registri} ${o.raw.registri_id}), jarak sekitar ${Math.round(km(b, o))} km. Tanpa poligon tapak ini Hipotesis; perlu verifikasi.`);
      const h = k?.hit || {};
      for (const j of ['hti', 'hph', 'sawit']) if (h[j] >= 0.3) {
        const nm = k.konsesi?.[j] || '', mirip = jacc(kata(b.pengembang), kata(nm)) > 0.3;
        if (!mirip) tambah('tumpang_konsesi', `Sekitar ${Math.round(h[j] * 100)} persen radius perkiraan berada dalam konsesi ${j === 'hti' ? 'HTI' : j === 'hph' ? 'HPH/IUPHHK' : 'sawit'}${nm ? ` (${nm})` : ''}; pengembang proyek ("${b.pengembang || 'tidak disebut'}") tampak berbeda. Perlu verifikasi hak atas lahan. Hipotesis.`);
      }
      if (h.adat >= 0.1) tambah('tumpang_adat', `Sekitar ${Math.round(h.adat * 100)} persen radius perkiraan beririsan dengan wilayah adat. Perlu verifikasi persetujuan bebas, didahulukan, dan diinformasikan (FPIC).`);
      if (h.lindung >= 0.3) tambah('kawasan_lindung', `Sekitar ${Math.round(h.lindung * 100)} persen radius perkiraan berada di kawasan hutan konservasi/lindung (KLHK 2017); perlu verifikasi dasar hak pengelolaan dan adisionalitas.`);
    }
    if (!r.metodologi) tambah('metodologi_kosong', 'Registri yang dipanen tidak mencantumkan metodologi proyek; status berlaku/dicabutnya metodologi tidak dapat diperiksa.');
    const kre = r.kredit || {};
    if (['pipa_pengembangan', 'pengajuan_registrasi', 'terdaftar_terlambat_verifikasi', 'ditarik'].includes(r.status) || (r.status === 'tersertifikasi' && kre.diterbitkan == null))
      tambah('status_tak_jelas', `Status registri "${r.status_asli || r.status}"${kre.diterbitkan != null ? `, kredit terbit ${kre.diterbitkan} ${kre.satuan || ''}` : ', jumlah kredit terbit tidak tercatat'}; status belum final atau perlu pembaruan. Perlu verifikasi.`);
    if (kre.diterbitkan > 0) tambah('otorisasi_tak_disebut', 'Data registri yang dipanen tidak memuat otorisasi Pasal 6 maupun penyesuaian korespondensi atas kredit yang terbit; ini keterbatasan data, belum temuan. Perlu verifikasi.');
    return { id: b.id, nama: b.nama, registri: r.registri, registri_id: r.registri_id, teknologi: r.teknologi || null, prov: k?.prov || null, kab: k?.kab || null, lat: b.lat, lng: b.lng, bendera: f };
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const klaim = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/klaim_lahan.json'), 'utf8'));
  const { berkas, baris } = muatKarbon(), hasil = uji(baris, klaim);
  const hitung = {}; for (const h of hasil) for (const b of h.bendera) hitung[b.jenis] = (hitung[b.jenis] || 0) + 1;
  const out = { lapis: 'publik', dibangun_pada: TGL, tingkat_bukti: 'hipotesis', sumber_baris: berkas, jenis: JENIS, jumlah_proyek: hasil.length, dengan_bendera: hasil.filter((h) => h.bendera.length).length, hitung,
    tidak_diperiksa: [{ id: 'srn', alasan: 'Registri SRN-PPI KLHK (srn.menlhk.go.id) tidak terjangkau dari lingkungan panen pada 8 Nov 2026 (koneksi gagal); status "tidak terdaftar di SRN" tidak dapat dinilai dan tidak dikarang.' }, { id: 'metodologi_dicabut', alasan: 'Daftar publik metodologi Verra (verra.org) tidak terjangkau; metodologi kedaluwarsa/dicabut tidak dinilai. Hanya metodologi yang kosong ditandai.' }],
    catatan: 'Bendera berarti perlu verifikasi, bukan bukti pelanggaran. Tumpang tindih memakai radius perkiraan (Hipotesis). Pemilik proyek dapat mengajukan koreksi lewat formulir koreksi.', baris: hasil.filter((h) => h.bendera.length) };
  fs.writeFileSync(path.join(AKAR, 'public/data/integritas_karbon.json'), JSON.stringify(out));
  console.log('integritas', out.jumlah_proyek, 'proyek', out.dengan_bendera, 'berbendera', hitung);
}
