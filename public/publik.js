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
