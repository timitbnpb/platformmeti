/* insentif_cek.js (F65-107): fungsi murni pemeriksa insentif fiskal. Tanpa DOM, tanpa fetch, dipakai /investasi#pembiayaan dan uji.
   Satu-satunya dasar syarat adalah kolom `teknologi` dan `status_berlaku` di insentif_fiskal.json (basis_syarat = "judul"): teks peraturannya tidak ada di repo,
   jadi besaran, ambang investasi, lokasi, dan jenis badan usaha TIDAK dinilai dan tidak ditanyakan. Hasil tidak pernah berarti "berhak". */

export const TANYA = ["pembangkit", "panas_bumi", "industri", "kbl"];
/* nilai kolom teknologi (huruf kecil, tanpa keterangan dalam kurung) -> pertanyaan */
const PETA = {
  pembangkit: "pembangkit", "semua pembangkit": "pembangkit", "pembangkit listrik": "pembangkit",
  "panas bumi": "panas_bumi",
  industri: "industri", "industri komponen ebt": "industri",
  "kendaraan listrik": "kbl",
};

/** Syarat satu insentif dari kolom teknologi: { kunci: pertanyaan yang salah satunya harus "ya", catatan: keterangan dalam kurung (belum dinilai), asing: nilai yang tak terpetakan }. */
export function syaratDari(r) {
  const kunci = [], catatan = [], asing = [];
  for (const x of r.teknologi || []) {
    const m = /^(.*?)\s*\((.*)\)\s*$/.exec(x), k = PETA[(m ? m[1] : x).trim().toLowerCase()];
    if (m) catatan.push(m[2]);
    if (!k) asing.push(x); else if (!kunci.includes(k)) kunci.push(k);
  }
  return { kunci, catatan, asing };
}

/** jawab: { pertanyaan: true | false } (tak dijawab = tak ada). -> { kelompok: "ya" | "tidak" | "cek", alasan, cocok } */
export function nilaiInsentif(r, jawab = {}) {
  if (r.status_berlaku !== "berlaku") return { kelompok: "tidak", alasan: "tidak_berlaku", cocok: [] };
  const { kunci, asing } = syaratDari(r);
  if (!kunci.length || asing.length) return { kelompok: "cek", alasan: "tak_terpetakan", cocok: [] };
  const cocok = kunci.filter((k) => jawab[k] === true);
  if (cocok.length) return { kelompok: "ya", alasan: "kegiatan_cocok", cocok };
  if (kunci.every((k) => jawab[k] === false)) return { kelompok: "tidak", alasan: "kegiatan_beda", cocok: [] };
  return { kelompok: "cek", alasan: "belum_dijawab", cocok: [] };
}

/** Tiga kelompok, urutan baris dipertahankan. */
export function kelompokkan(baris, jawab = {}) {
  const o = { ya: [], tidak: [], cek: [] };
  for (const r of baris) { const n = nilaiInsentif(r, jawab); o[n.kelompok].push({ r, ...n, ...syaratDari(r) }); }
  return o;
}
