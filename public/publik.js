/* Pembantu halaman publik statis (beranda, regulasi, kalender): baca /data/*.json dan label kamus. */
import { t, ada } from "/i18n.js";

const simpan = new Map();
/** Baca /data/<nama>.json sekali; gagal tidak disimpan supaya "Coba lagi" bisa mengulang. */
export function muat(nama) {
  if (!simpan.has(nama)) {
    simpan.set(nama, fetch(`/data/${nama}.json`).then((r) => { if (!r.ok) throw new Error(nama); return r.json(); }).catch((e) => { simpan.delete(nama); throw e; }));
  }
  return simpan.get(nama);
}

/** Label kamus berawalan (mis. label("reg.status.", "berlaku")); kode tak dikenal tampil apa adanya. */
export const label = (awal, kode) => (ada(awal + kode) ? t(awal + kode) : String(kode ?? "-"));

/** Hanya tautan http(s); selainnya kosong (KPV §3). */
export const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");

export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const SINGKAT = { uu: "UU", perppu: "Perppu", pp: "PP", perpres: "Perpres", keppres: "Keppres", inpres: "Inpres", permen: "Permen", perda: "Perda" };
export const namaRegulasi = (r) => `${SINGKAT[r.jenis] || label("reg.jenis.", r.jenis)} ${r.nomor}/${r.tahun}`;
export const kelasStatus = (s) => (s === "berlaku" ? "jm-pil-ok" : s === "diubah" ? "jm-pil-warn" : s === "dicabut" ? "jm-pil-bad" : "");

/** Data tak tersedia: sembunyikan seluruh bagian (judul ikut), cukup peringatan di konsol. Pengunjung tidak melihat kotak galat. */
export function sembunyi(el, e) {
  console.warn("bagian disembunyikan:", el?.id || "", e?.message || e);
  const s = el?.closest("section"); if (s) s.hidden = true;
}

/** Lapis anggota/pengurus dari GET /api/direktori/potret/<benda> (digabung per peran di server): Map id -> baris. 401/403/galat = null, diam (tamu tidak melihat apa pun). */
const lapisSimpan = {};
export const lapisAnggota = (benda) => lapisSimpan[benda] ||= fetch(`/api/direktori/potret/${benda}`, { credentials: "same-origin", headers: { accept: "application/json" } })
  .then((r) => (r.ok && /json/.test(r.headers.get("content-type") || "") ? r.json() : null))
  .then((d) => (d && Array.isArray(d.baris) ? new Map(d.baris.map((x) => [x.id, x])) : null)).catch(() => null);

const teksNilai = (v) => (v == null ? "" : Array.isArray(v) ? v.map(teksNilai).filter(Boolean).join(", ") : typeof v === "object" ? [teksNilai(v.nilai ?? v.nama), v.catatan].filter(Boolean).join(" ") : String(v));
/** Daftar [kunciKamus, nilai] -> <dl>; baris kosong dibuang; semua kosong = "". Isi di-escape oleh pemanggil lewat esc. */
export function anggotaDl(pasangan, esc) {
  const p = pasangan.map(([k, v]) => [k, teksNilai(v)]).filter(([, v]) => v);
  return p.length ? `<dl class="jm-dl">${p.map(([k, v]) => `<dt>${esc(t(k))}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "";
}
