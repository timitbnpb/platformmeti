/* Kertas posisi METI (hanya staf: tombol dipasang konsultasi_naskah.js bila S.d.saya.putus). Bagian murni, diuji; tampilan di konsultasi_kertas_tampil.js.
   Kerahasiaan: butir bertanda internal/rahasia dan tanggapan tersembunyi atau ditarik tidak ikut; nama pengirim tidak dicetak. */
import { labelBagian } from "./inti/naskah.js";

const UBAHAN = ["ubah", "coret", "tambah"], MARKA = /^\[(setuju|tanya|usul)\]\s*/i;
const RAHASIA = /internal|rahasia/i;
const RE_REG = /\b(UU|PP|Perpres|Permen(?:\s+ESDM)?|Kepmen(?:\s+ESDM)?|Inpres)\s*(?:No\.?\s*)?(\d+[A-Za-z.]*)\s*(?:\/|\s+Tahun\s+)(\d{4})/gi;
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Regulasi dari teks rujukan: cocok jenis awal + nomor + tahun terhadap daftar regulasi (id, jenis, nomor, tahun, judul, url_sumber). */
export function cocokRegulasi(rujukan, regs) {
  const hasil = new Map();
  for (const m of String(rujukan || "").matchAll(RE_REG)) {
    const jenis = norm(m[1]).replace(/esdm$/, "");
    const r = regs.find((x) => String(x.nomor) === String(m[2]).replace(/\.$/, "") && String(x.tahun) === m[3] && norm(x.jenis).startsWith(jenis.slice(0, 3)));
    if (r) hasil.set(r.id, r);
  }
  return [...hasil.values()];
}

/** Ringkasan per butir: [{ id, label, judul, usulan, alasan, rujukan, dukungan, komentar, usul, setuju, kutipan: [teks], regs }]. */
export function susunKertas(d, regs = [], { kutip = 2 } = {}) {
  const hidup = d.utas.filter((u) => !u.tersembunyi && u.status !== "ditarik" && u.isi != null);
  const butir = d.dokumen.bentuk === "butir";
  let pasal = "";
  const baris = [];
  for (const b of d.bagian) {
    if (b.tingkat === "pasal") pasal = b.nomor;
    if (b.tingkat === "bab") continue;
    if (RAHASIA.test(`${b.status_asal || ""} ${b.sumber_asal || ""} ${b.judul || ""}`)) continue;
    const us = hidup.filter((u) => u.bagian_id === b.id);
    const penanda = (u) => (u.jenis === "umum" ? (u.isi.match(MARKA)?.[1] || "").toLowerCase() : "");
    const usul = us.filter((u) => UBAHAN.includes(u.jenis) || penanda(u) === "usul");
    const setuju = us.filter((u) => penanda(u) === "setuju");
    const komentar = us.filter((u) => !UBAHAN.includes(u.jenis) && !["setuju", "usul"].includes(penanda(u)));
    const dukungan = us.reduce((n, u) => n + (u.dukung || 0), 0) + setuju.length;
    const pilih = [...us].filter((u) => (u.isi || "").replace(MARKA, "").trim().length >= 20)
      .sort((a, z) => (z.dukung || 0) - (a.dukung || 0) || z.isi.length - a.isi.length).slice(0, kutip)
      .map((u) => (u.isi.replace(MARKA, "").trim().slice(0, 280)));
    const label = butir ? labelBagian(b) : labelBagian(b, pasal);
    if (!butir && !us.length) continue;
    baris.push({ id: b.id, label, judul: b.judul || "", usulan: b.teks || "", alasan: b.alasan || "", rujukan: b.rujukan || "", dukungan, komentar: komentar.length, usul: usul.length, setuju: setuju.length, kutipan: pilih, regs: cocokRegulasi(b.rujukan, regs) });
  }
  return baris;
}

