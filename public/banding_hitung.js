/* banding_hitung.js: fungsi murni pembanding /banding (tanpa DOM, tanpa fetch), dipakai halaman dan uji.
   Tiga mode: provinsi (2 sampai 4 dari 38), organisasi, atau proyek (2 sampai 4). Tiap metrik: nilai angka atau null (null tampil "-", tidak pernah 0 karangan).
   Pemenang per baris = nilai tertinggi (satu-satunya ukuran yang dipakai, tertulis di kolom "arah" supaya bisa diperiksa); butuh minimal dua nilai berisi. */

export const MIN = 2, MAKS = 4;
export const MODE = ["prov", "org", "pro"];

/* arah: "tinggi" = lebih besar lebih baik. Semua metrik di sini bermakna begitu (jumlah, kapasitas, skor). */
export const METRIK_PROV = [
  { k: "terpasang", ikon: "petir", sat: "MW", d: 0 },
  { k: "mw_proyek", ikon: "proyek", sat: "MW", d: 0 },
  { k: "proyek", ikon: "tingkat", sat: "", d: 0 },
  { k: "potensi", ikon: "globe", sat: "MW", d: 0 },
  { k: "rued", ikon: "regulasi", sat: "%", d: 1 },
  { k: "kesiapan", ikon: "berlian", sat: "", d: 1 },
  { k: "peluang", ikon: "kompas", sat: "", d: 1 },
  { k: "perda", ikon: "palu", sat: "", d: 0 },
  { k: "pakar", ikon: "orang", sat: "", d: 0 },
  { k: "berita", ikon: "berita", sat: "", d: 0 },
];
export const METRIK_ORG = [
  { k: "proyek", ikon: "proyek", sat: "", d: 0 },
  { k: "mw", ikon: "petir", sat: "MW", d: 0 },
  { k: "provinsi", ikon: "wilayah", sat: "", d: 0 },
  { k: "program", ikon: "bintang", sat: "", d: 0 },
  { k: "pakar", ikon: "orang", sat: "", d: 0 },
  { k: "regulasi", ikon: "regulasi", sat: "", d: 0 },
  { k: "berita", ikon: "berita", sat: "", d: 0 },
  { k: "produk_tkdn", ikon: "centang", sat: "", d: 0 },
  { k: "tkdn_maks", ikon: "tingkat", sat: "%", d: 1 },
];
/* Komponen sertifikat TKDN (F65-102): kategori di tkdn_produk.json. Saringan komponen mempersempit pilihan organisasi dan dua baris TKDN. */
export const KOMPONEN = ["modul", "baterai", "inverter", "kabel", "struktur", "trafo", "turbin"];
/* Proyek (F65-101). pecah: true = nilai bukan bulat ditampilkan dengan desimal (0,17 MW tidak boleh tampil "0"). tahun: true = tahun COD, bukan besaran: tanpa pemenang, tanpa batang, tanpa pemisah ribuan. */
export const METRIK_PRO = [
  { k: "mw", ikon: "petir", sat: "MW", d: 0, pecah: true },
  { k: "investasi", ikon: "tingkat", sat: "", d: 0, pecah: true },
  { k: "cod", ikon: "kalender", sat: "", d: 0, tahun: true },
  { k: "program", ikon: "bintang", sat: "", d: 0 },
  { k: "regulasi", ikon: "regulasi", sat: "", d: 0 },
  { k: "berita", ikon: "berita", sat: "", d: 0 },
  { k: "sumber", ikon: "buku", sat: "", d: 0 },
];
/* baris teks proyek: tampil apa adanya, tidak pernah dinilai */
export const TEKS_PRO = ["teknologi", "status", "provinsi", "pemilik", "bukti"];
/* sumbu radar: provinsi memakai 10 komponen indeks kesiapan (skor 0-100 bawaan sumber); organisasi memakai metrik terhadap yang tertinggi */
export const KOMPONEN_PROV = ["potensi", "terpasang", "elektrifikasi", "bpp", "ruptl", "proyek", "organisasi", "rued", "plts_atap", "wkp"];
export const SUMBU_ORG = ["proyek", "mw", "provinsi", "program", "pakar", "regulasi", "berita"];

const ada = (v) => typeof v === "number" && Number.isFinite(v);
const jumlah = (l) => l.reduce((n, x) => n + (ada(x) ? x : 0), 0);
const rata = (l) => (l.length ? l.reduce((n, x) => n + x, 0) / l.length : null);
export const norma = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Satu provinsi -> { id, nama, m: {metrik: angka|null}, komponen: {nama: skor|null} }. D = { wilayah, indeks, radar, rued, peluang, berita } (isi berkas JSON-nya). */
export function metrikProvinsi(kode, D) {
  const w = D.wilayah.baris.find((b) => b.kode === kode);
  if (!w) return null;
  const idx = (D.indeks.provinsi || []).find((x) => x.kode === kode);
  const pl = (D.peluang.baris || []).find((x) => x.kode === kode);
  const ru = (D.rued.baris || []).find((x) => x.kode === kode);
  const kab = (D.radar.baris || []).filter((x) => x.prov === kode && ada(x.skor)).map((x) => x.skor);
  const nama = norma(w.nama);
  const potensi = pl ? jumlah(Object.values(pl.potensi || {}).map((p) => p?.mw)) : 0;
  const proyek = (w.proyek || []).filter((p) => p.status !== "dibatalkan");
  const komponen = {};
  for (const k of KOMPONEN_PROV) komponen[k] = idx?.komponen?.[k]?.skor ?? null;
  return {
    id: kode, nama: w.nama,
    m: {
      terpasang: w.terpasang_mw?.nilai ?? null,
      mw_proyek: proyek.length ? Math.round(jumlah(proyek.map((p) => p.mw)) * 10) / 10 : null,
      proyek: w.jumlah_proyek ?? null,
      potensi: potensi > 0 ? Math.round(potensi) : null,
      rued: ru && ada(ru.rasio_persen) ? ru.rasio_persen : null,
      kesiapan: idx?.skor ?? null,
      peluang: kab.length ? Math.round(rata(kab) * 10) / 10 : null,
      perda: (w.perda || []).filter((p) => p.status === "berlaku").length,
      pakar: (w.pakar || []).length,
      /* berita tidak punya kolom provinsi: dihitung dari judul yang menyebut nama provinsi (hipotesis, tertulis di catatan layar) */
      berita: (D.berita.baris || []).filter((b) => (" " + norma(b.judul) + " ").includes(" " + nama + " ")).length,
    },
    komponen,
  };
}

/** Satu organisasi -> { id, nama, m, ... }. D = { proyek, orang, berita, tkdn?, komponen? } (daftar baris; tkdn = baris tkdn_produk.json, komponen = saringan kategori atau "").
 *  Tanpa D.tkdn dua baris TKDN bernilai null. tkdn_maks null bila organisasi tidak punya sertifikat pada komponen itu (bukan 0). Hubungan proyek persis seperti /o/<id>. */
export function metrikOrganisasi(o, D) {
  const ids = new Set(o.proyek_ids || []);
  for (const p of D.proyek) if (Object.values(p.pihak || {}).flat().some((x) => x?.organisasi_id === o.id)) ids.add(p.id);
  const rows = D.proyek.filter((p) => ids.has(p.id));
  const mw = rows.map((p) => (p.kapasitas || []).find((k) => /^MWp?$/i.test(k.satuan))?.nilai).filter(ada);
  const prov = new Set(rows.map((p) => p.lokasi?.provinsi).filter(Boolean));
  const prog = new Set(rows.flatMap((p) => p.program_ids || []));
  const reg = new Set(rows.flatMap((p) => p.regulasi_ids || []));
  const sert = D.tkdn ? D.tkdn.filter((x) => x.pabrikan_org_id === o.id && (!D.komponen || x.kategori === D.komponen)) : null;
  const persen = sert ? sert.map((x) => x.tkdn_persen).filter(ada) : [];
  return {
    id: o.id, nama: o.nama, logo: o.logo || "",
    m: {
      proyek: rows.length,
      mw: mw.length ? Math.round(jumlah(mw) * 10) / 10 : null,
      provinsi: prov.size,
      program: prog.size,
      pakar: D.orang.filter((x) => x.organisasi_id === o.id).length + (o.pengurus || []).filter((x) => x.orang_id && !D.orang.some((q) => q.id === x.orang_id && q.organisasi_id === o.id)).length,
      regulasi: reg.size,
      berita: D.berita.filter((b) => (b.organisasi_ids || []).includes(o.id) || (o.berita_ids || []).includes(b.id)).length,
      produk_tkdn: sert ? sert.length : null,
      tkdn_maks: persen.length ? Math.max(...persen) : null,
    },
  };
}

/** Satu proyek -> { id, nama, m: {metrik: angka|null}, teks: {baris: kode atau teks|null} }. Tanpa konversi mata uang: investasi hanya diisi bila sumbernya USD. */
export function metrikProyek(p) {
  if (!p) return null;
  const mw = (p.kapasitas || []).find((k) => /^MWp?$/i.test(k.satuan))?.nilai;
  const usd = (p.nilai_investasi || []).find((x) => x.satuan === "USD" && ada(x.nilai))?.nilai;
  const tahun = (l) => (l || []).map((x) => x.nilai).filter(ada);
  const aktual = tahun(p.cod_aktual), target = tahun(p.cod_target);
  const pemilik = (p.pihak?.pemilik || []).map((x) => x.nilai).filter(Boolean);
  return {
    id: p.id, nama: p.nama,
    m: {
      mw: ada(mw) ? mw : null,
      investasi: ada(usd) ? Math.round(usd / 1e5) / 10 : null,
      cod: aktual.length ? Math.min(...aktual) : target.length ? Math.max(...target) : null,
      program: (p.program_ids || []).length,
      regulasi: (p.regulasi_ids || []).length,
      berita: (p.berita_ids || []).length,
      sumber: (p.sumber || []).length,
    },
    teks: {
      teknologi: p.teknologi || null,
      status: p.status?.[0]?.nilai || null,
      provinsi: p.lokasi?.provinsi || null,
      pemilik: pemilik.length ? pemilik.slice(0, 2).join(", ") + (pemilik.length > 2 ? " +" + (pemilik.length - 2) : "") : null,
      bukti: p.tingkat_bukti || null,
    },
  };
}

/** Pemenang per metrik: indeks entitas bernilai tertinggi (kembar semua), atau [] bila kurang dari dua nilai berisi atau semuanya sama. */
export function pemenang(nilai) {
  const isi = nilai.map((v, i) => [v, i]).filter(([v]) => ada(v));
  if (isi.length < 2) return [];
  const maks = Math.max(...isi.map(([v]) => v));
  const menang = isi.filter(([v]) => v === maks).map(([, i]) => i);
  return menang.length === isi.length ? [] : menang;
}

/** Indeks terhadap pemimpin (pemimpin = 100) untuk grafik batang berkelompok; null tetap null. */
export function indeksPemimpin(nilai) {
  const maks = Math.max(0, ...nilai.filter(ada));
  return nilai.map((v) => (ada(v) && maks > 0 ? Math.round((v / maks) * 1000) / 10 : null));
}

/** Matriks tabel: [kepala, ...baris] metrik x entitas, siap CSV atau tabel. label(kunci) memberi nama metrik. */
export function matriks(entitas, metrik, label, format = (v) => String(v)) {
  return [[label("_metrik"), ...entitas.map((e) => e.nama)], ...metrik.map((mt) => [label(mt.k), ...entitas.map((e) => (ada(e.m[mt.k]) ? format(e.m[mt.k], mt) : "-"))])];
}
export const csv = (mat) => "﻿" + mat.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n") + "\r\n";

/* ---------- URL berbagi: ?m=prov&p=11,32  atau  ?m=org&o=l_aaa,p_bbb  atau  ?m=pro&j=pj_0001,pj_0002 ---------- */
const PARAM = { prov: "p", org: "o", pro: "j" };
const RE_ID = /^[A-Za-z0-9_-]{1,40}$/;
export function bacaUrl(search) {
  const q = new URLSearchParams(search);
  const mode = MODE.includes(q.get("m")) ? q.get("m") : "prov";
  const mentah = (q.get(PARAM[mode]) || "").split(",").map((s) => s.trim()).filter((s) => RE_ID.test(s));
  const k = q.get("k");
  return { mode, ids: [...new Set(mentah)].slice(0, MAKS), ...(mode === "org" && KOMPONEN.includes(k) ? { komponen: k } : {}) };
}
export const tulisUrl = ({ mode, ids, komponen }) => (ids.length ? `?m=${mode}&${PARAM[mode]}=${ids.join(",")}` : "?m=" + mode) + (mode === "org" && KOMPONEN.includes(komponen) ? "&k=" + komponen : "");
