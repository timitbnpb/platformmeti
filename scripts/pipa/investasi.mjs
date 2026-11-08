#!/usr/bin/env node
// public/data/investasi.json: "Ruang investasi", proyek EBT berstatus rencana atau izin yang dinilai kesiapan pendanaannya. HIPOTESIS terbuka.
//   node scripts/pipa/investasi.mjs   (offline; membaca public/data/*.json, menulis public/data/investasi.json)
// Setiap angka diturunkan dari berkas yang sudah ada: proyek_terpadu, risiko_proyek, perizinan_provinsi, radar_kabupaten, peluang (harga patokan),
// biaya_bangun (lewat model_keuangan_data.js), gardu OSM, pembiayaan_luar, pendanaan, pelaku_global. Bukan rekomendasi investasi.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { komponen as komponenRadar } from '../../public/radar_rumus.js';
import { jarakKm } from '../../public/inti/geo_titik.js';
import { BOBOT, MIN_KOMPONEN, AMBANG, BATAS_GARDU_KM, RASIO_HARGA, BAND_TIKET, BOBOT_COCOK, BUKTI_DANA, KELAS_UKURAN, komponenSkor, skorKesiapan, tingkatKesiapan, kelasUkuran, modelProyek, cocokPendana } from '../../public/inti/investasi_rumus.js';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const J = (f) => JSON.parse(fs.readFileSync(AKAR + 'public/' + f, 'utf8'));
export const TEK_DIPAKAI = ['surya', 'hidro', 'bayu', 'panas-bumi', 'bioenergi'];
export const STATUS_DIPAKAI = ['rencana', 'izin'];
export const MW_MIN = 5;
const PER_PROYEK_MAKS = 6;
const bulat = (x, d = 3) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
const median = (a) => { const s = a.filter((x) => x != null).sort((p, q) => p - q); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

/** Daftar pendana (lembaga, skema, ECA) dalam bentuk seragam untuk cocokPendana. */
export function bangunPendana({ pendanaan, pelaku }) {
  const iso = new Map();
  for (const n of pendanaan.negara) for (const b of n.badan) iso.set(b, n.iso2);
  const keTek = (a) => (a || []).filter((x) => TEK_DIPAKAI.includes(x));
  const out = [];
  for (const p of pendanaan.pendana) {
    const mentah = p.teknologi || [], tek = keTek(mentah);
    if (mentah.length && !tek.length) continue; // hanya jaringan/efisiensi: bukan pembangkit
    out.push({ id: p.id, nama: p.nama, jenis: 'lembaga', sub: p.jenis_pendana, negara: iso.get(p.nama) || null, tek, tiket: p.nilai_n > 0 ? Math.round(p.nilai_usd / p.nilai_n) : null, jumlah: p.jumlah_proyek, url: null });
  }
  for (const s of pendanaan.pendanaan) {
    if (s.jenis_entri !== 'skema' || !['pinjaman lunak', 'blended', 'obligasi hijau', 'JETP', 'kredit karbon', 'hibah'].includes(s.jenis)) continue;
    const tek = keTek(s.sektor), umum = (s.sektor || []).some((x) => x === 'pembiayaan' || x === 'transisi-adil');
    if (!tek.length && !umum) continue;
    out.push({ id: s.id, nama: s.nama, jenis: 'skema', sub: s.jenis, negara: s.iso2 || null, tek, tiket: null, jumlah: null, url: s.url || null });
  }
  for (const b of pelaku.baris) if (b.kelompok === 'eca') out.push({ id: b.org_id || b.id, nama: b.nama, jenis: 'eca', sub: 'eca', negara: b.negara_iso2, tek: [], tiket: null, jumlah: null, url: b.situs || null, org_id: b.org_id });
  return out;
}

/** Negara pemilik: dari pelaku_global (org_id), atau Indonesia bila nama berbentuk badan hukum Indonesia (PT, Persero). */
export function negaraPemilik(pemilik, pelakuOrg) {
  if (!pemilik) return null;
  const b = pemilik.org_id && pelakuOrg.get(pemilik.org_id);
  if (b?.negara_iso2) return b.negara_iso2;
  return /^(PT|CV|Perum|Perumda)\b|\(Persero\)|\bPersero\b|^PLN\b|^Pertamina\b/i.test(pemilik.nama || '') ? 'ID' : null;
}

export function bangun(D) {
  const radar = D.radar.provinsi, izinProv = new Map(D.perizinan.baris.map((b) => [b.kode, b])), risiko = new Map(D.risiko.baris.map((b) => [b.id, b]));
  const pelakuOrg = new Map(D.pelaku.baris.filter((b) => b.org_id).map((b) => [b.org_id, b]));
  const psnPer = new Map(); for (const p of D.psn.baris) for (const i of [...(p.proyek_gem || []), ...(p.proyek_meti || [])]) psnPer.set(i, p);
  const amdal = new Map(D.izin.lead_time.daftar.filter((x) => x.proyek_id).map((x) => [x.proyek_id, x]));
  const lelang = new Map(); for (const p of D.lelang.putaran) for (const i of p.proyek_id || []) lelang.set(i, [...(lelang.get(i) || []), p]);
  const pendana = bangunPendana({ pendanaan: D.pendanaan, pelaku: D.pelaku });
  const kandidat = D.terpadu.baris.filter((x) => STATUS_DIPAKAI.includes(x.status) && x.mw >= MW_MIN && TEK_DIPAKAI.includes(x.tek));
  const baris = kandidat.map((x) => {
    const prov = x.prov_kode && radar[x.prov_kode] ? x.prov_kode : null;
    const m = modelProyek(x, D);
    const rk = risiko.get(x.id), iz = izinProv.get(x.prov_kode);
    const garduOk = prov && ['titik_persis', 'kabupaten'].includes(x.presisi) && Number.isFinite(x.lat);
    let jarak = null;
    if (garduOk) { jarak = Math.min(...D.gardu.gardu.map((g) => jarakKm(x, g))); if (jarak > 150) jarak = null; } // di luar cakupan panen gardu
    const pl = D.pelaku.per_proyek[x.id] || [];
    const dana = (D.pembiayaan.per_proyek[x.id] || []).length ? 'tercatat' : x.asal.includes('jetp-portfolio') ? 'jetp'
      : pl.some((p) => p.peran === 'pengembang') || x.pemilik?.org_id ? 'pengembang' : x.pemilik?.nama ? 'pemilik' : x.asal.includes('ruptl') ? 'ruptl' : 'tidak';
    const sumber = prov ? komponenRadar(x.tek, radar[prov].norma, null).sumber : null;
    const masuk = { status: x.status, izinProv: iz?.skor ?? null, risiko: rk?.skor ?? null, jarakKm: jarak, rasioHarga: m.rasioHarga ?? null, sumber: sumber ?? null, dana };
    const k = komponenSkor(masuk), s = skorKesiapan(k);
    const negara = negaraPemilik(x.pemilik, pelakuOrg);
    const cocok = m.capexUsd ? pendana.map((p) => ({ p, c: cocokPendana({ tek: x.tek, capexUsd: m.capexUsd, negara }, p) })).filter((q) => q.c)
      .sort((a, z) => z.c.skor - a.c.skor || ['lembaga', 'skema', 'eca'].indexOf(a.p.jenis) - ['lembaga', 'skema', 'eca'].indexOf(z.p.jenis) || a.p.nama.localeCompare(z.p.nama))
      .slice(0, PER_PROYEK_MAKS).map(({ p, c }) => ({ i: p.id, s: c.skor, a: c.alasan })) : [];
    const ps = psnPer.get(x.id), ll = lelang.get(x.id), am = amdal.get(x.id);
    return {
      id: x.id, nama: x.nama, tek: x.tek, status: x.status, mw: x.mw, ukuran: kelasUkuran(x.mw), prov: x.prov, prov_kode: x.prov_kode, lat: x.lat, lng: x.lng, presisi: x.presisi,
      cod: x.cod_terbaru || x.cod_rencana || null, pemilik: x.pemilik ? { nama: x.pemilik.nama, org_id: x.pemilik.org_id || null, logo: x.pemilik.logo || null, negara } : null,
      profil: !!x.profil, asal: x.asal, url: x.url || x.status_sumber?.url || null,
      skor: s.skor, tingkat: tingkatKesiapan(s.skor), k, m: masuk,
      model: m.galat ? { galat: m.galat, id: m.id || null } : { id: m.id, skala: m.skala, lok: m.lok, acuan: m.acuan, umur: m.umur, fk: bulat(m.fk, 1), capex_usd_kw: bulat(m.capexUsdKw, 0), opex_usd_kw_thn: bulat(m.opexUsdKwThn, 1), kurs: m.kurs, diskonto: m.diskonto,
        tarif: bulat(m.tarif, 0), tarif11: bulat(m.tarif11, 0), capex_usd_juta: bulat(m.capexUsd / 1e6, 1), capex_rp_miliar: bulat(m.capexRp / 1e9, 1), irr: bulat(m.irr, 4), npv_rp_miliar: bulat(m.npvRp / 1e9, 1), balik: bulat(m.balik, 1),
        lcoe: bulat(m.lcoe, 0), energi_gwh: bulat(m.energiGwh, 1), rasio_harga: bulat(m.rasioHarga, 3), diisi: m.diisi },
      pendana: cocok,
      risiko: rk && rk.skor != null ? { skor: rk.skor, kelas: rk.kelas, komponen: rk.komponen, dikeluarkan: rk.dikeluarkan || [] } : null,
      isu: ps ? (ps.isu || []).map((i) => ({ jenis: i.jenis, teks: i.teks })) : [],
      psn: ps ? { id: ps.id, nama: ps.nama } : null,
      izin: { prov_skor: iz?.skor ?? null, perda_n: iz?.komponen?.perda?.nilai?.n ?? null, amdal: am ? { tanggal: am.amdal_tanggal, bulan: am.bulan, url: am.amdal_url } : null, lelang: ll ? ll.map((p) => ({ id: p.id, nama: p.nama, tahap: p.tahap, tahun: p.tahun })) : [] },
    };
  }).sort((a, z) => (z.skor ?? -1) - (a.skor ?? -1) || z.mw - a.mw || a.nama.localeCompare(z.nama));
  const dipakai = new Set(baris.flatMap((b) => b.pendana.map((p) => p.i)));
  return {
    lapis: 'publik', dibangun_pada: TGL, hipotesis: true, jumlah: baris.length,
    metode: {
      status_bobot: 'Hipotesis', bobot: BOBOT, min_komponen: MIN_KOMPONEN, ambang: AMBANG, batas_gardu_km: BATAS_GARDU_KM, rasio_harga: RASIO_HARGA, bukti_dana: BUKTI_DANA, band_tiket: BAND_TIKET, bobot_cocok: BOBOT_COCOK,
      kelas_ukuran: KELAS_UKURAN.map(([k, b]) => [k, b === Infinity ? null : b]),
      saringan: { status: STATUS_DIPAKAI, tek: TEK_DIPAKAI, mw_min: MW_MIN },
      model: 'Model keuangan bawaan /model-keuangan: model bisnis IPP, harga patokan Perpres 112/2022 (tingkat menurut MW dan faktor lokasi), biaya dari biaya_bangun.json, tanpa utang, pajak 22 persen. Sel biaya yang kosong diisi titik tengah rentang bersumber dan ditandai.',
      celah: [
        'Penyimpanan, nuklir, dan sampah (WtE) tidak masuk: tidak ada dasar biaya dan harga patokan bersumber untuk model otomatis.',
        'Bioenergi masuk daftar tanpa model keuangan: biaya operasi tidak tersedia di biaya_bangun.json.',
        'Lokasi proyek berpresisi provinsi (titik pusat wilayah) tidak dipakai untuk jarak ke gardu; gardu OSM hanya terpanen di sebagian pulau.',
        'Pendana yang cocok adalah kecocokan teknologi, ukuran tiket tipikal, dan negara pemilik; bukan penawaran atau komitmen pendanaan.',
      ],
    },
    kurs: D.bangun.kurs_rp_usd.nilai,
    sumber: [
      { id: 'terpadu', judul: 'Proyek terpadu (RUPTL, GEM, Wikipedia, berita)', berkas: 'proyek_terpadu.json', tanggal: D.terpadu.dibangun_pada },
      { id: 'risiko', judul: 'Skor risiko proyek (kawasan hutan, gambut, bahaya)', berkas: 'risiko_proyek.json', tanggal: D.risiko.dibangun_pada },
      { id: 'izin', judul: 'Indeks perizinan provinsi', berkas: 'perizinan_provinsi.json', tanggal: D.perizinan.dibangun_pada },
      { id: 'radar', judul: 'Radar peluang investasi (sumber daya per provinsi)', berkas: 'radar_kabupaten.json', tanggal: D.radar.dibangun_pada },
      { id: 'harga', judul: 'Harga patokan Perpres 112/2022', berkas: 'peluang.json', tanggal: D.peluang.dibangun_pada },
      { id: 'biaya', judul: 'Biaya bangun (IRENA, ESDM, proyek Indonesia)', berkas: 'biaya_bangun.json', tanggal: D.bangun.dibangun_pada },
      { id: 'gardu', judul: 'Gardu induk 150 kV ke atas (OpenStreetMap, ODbL)', berkas: 'geo/gardu.json', tanggal: D.gardu.meta.diperbarui },
      { id: 'pendanaan', judul: 'Skema dan pemberi dana (pendanaan.json, pembiayaan_luar.json, pelaku_global.json)', berkas: 'pendanaan.json', tanggal: D.pendanaan.dibangun_pada },
    ],
    ringkas: { mw: Math.round(baris.reduce((a, b) => a + b.mw, 0)), dana_usd_miliar: bulat(baris.reduce((a, b) => a + (b.model.capex_usd_juta || 0), 0) / 1000, 1), skor_median: bulat(median(baris.map((b) => b.skor)), 1), bermodel: baris.filter((b) => !b.model.galat).length },
    pendana: pendana.filter((p) => dipakai.has(p.id)).map((p) => ({ id: p.id, nama: p.nama, jenis: p.jenis, sub: p.sub, negara: p.negara, tek: p.tek, tiket: p.tiket, url: p.url, org_id: p.org_id || null })),
    baris,
  };
}

export function muat() {
  return {
    terpadu: J('data/proyek_terpadu.json'), risiko: J('data/risiko_proyek.json'), perizinan: J('data/perizinan_provinsi.json'), radar: J('data/radar_kabupaten.json'), peluang: J('data/peluang.json'),
    atap: J('data/plts_atap_hitung.json'), bangun: J('data/biaya_bangun.json'), karbon: J('data/karbon_pasar.json'), gardu: J('geo/gardu.json'), pembiayaan: J('data/global/pembiayaan_luar.json'),
    pendanaan: J('data/pendanaan.json'), pelaku: J('data/global/pelaku_global.json'), psn: J('data/psn.json'), izin: J('data/izin_kontrak.json'), lelang: J('data/lelang.json'),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(muat());
  fs.writeFileSync(AKAR + 'public/data/investasi.json', JSON.stringify(d) + '\n');
  console.log(d.jumlah, 'proyek;', d.ringkas.bermodel, 'bermodel;', d.ringkas.mw, 'MW; skor median', d.ringkas.skor_median, ';', d.pendana.length, 'pendana dipakai');
}
