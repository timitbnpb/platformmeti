/* Rumus pencarian global (murni, tanpa DOM): normalisasi tanpa aksen/huruf besar, awalan kata, singkatan, peringkat. */
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* singkatan -> frasa panjang (dua arah: "surya" menemukan PLTS, "plts" menemukan "pembangkit listrik tenaga surya") */
export const ALIAS = {
  plts: "pembangkit listrik tenaga surya", pltp: "pembangkit listrik tenaga panas bumi", plta: "pembangkit listrik tenaga air",
  pltb: "pembangkit listrik tenaga bayu angin", pltu: "pembangkit listrik tenaga uap batubara", pltbm: "pembangkit listrik tenaga biomassa",
  pltsa: "pembangkit listrik tenaga sampah", esdm: "energi sumber daya mineral", pln: "perusahaan listrik negara",
  ebt: "energi baru terbarukan", dpr: "dewan perwakilan rakyat", ojk: "otoritas jasa keuangan", bumn: "badan usaha milik negara",
  ruptl: "rencana usaha penyediaan tenaga listrik", ruen: "rencana umum energi nasional", ipp: "produsen listrik swasta",
  pltmh: "pembangkit listrik tenaga mikrohidro", pltd: "pembangkit listrik tenaga diesel", pltg: "pembangkit listrik tenaga gas",
  bpp: "biaya pokok penyediaan", bbn: "bahan bakar nabati", kdmp: "koperasi desa merah putih", tkdn: "tingkat komponen dalam negeri",
  amdal: "analisis mengenai dampak lingkungan", uu: "undang undang", pp: "peraturan pemerintah", perpres: "peraturan presiden",
  permen: "peraturan menteri", inpres: "instruksi presiden", ev: "kendaraan listrik", jetp: "kemitraan transisi energi berkeadilan",
};

export const kata = (s) => norm(s).split(" ").filter(Boolean);

/* teks pencarian satu butir: normalisasi + perluasan singkatan yang muncul di teks */
export function jerami(...bagian) {
  const n = norm(bagian.filter(Boolean).join(" ")), tambah = [];
  for (const w of n.split(" ")) if (ALIAS[w]) tambah.push(ALIAS[w]);
  return tambah.length ? n + " " + tambah.join(" ") : n;
}

/* bobot jenis: butir yang lebih "pasti" menang saat skor lexical sama */
export const BOBOT_JENIS = { org: 1.15, proyek: 1.1, reg: 1.1, hukum: 1.05, topik: 1.05, program: 1.05, wilayah: 1.1, orang: 1, pakar: 0.95, pendanaan: 1, inovasi: 0.95, pustaka: 0.9, produk: 0.95, berita: 0.85, halaman: 1 };

/* jarak edit <= 1 (sisip, hapus, ganti, tukar tetangga) untuk toleransi salah ketik; murah, tanpa matriks */
export function mirip1(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;                                   // ganti satu huruf
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);    // tukar dua huruf
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);          // sisip/hapus
}

/* kecocokan satu kata kueri pada daftar kata: 1 tepat, .7 awalan, .45 salah ketik (kata >= 5 huruf), 0 tidak */
function cocokKata(q, kata) {
  let m = 0;
  for (const w of kata) {
    if (w === q) return 1;
    if (m < 0.7 && w.startsWith(q)) m = 0.7;
    else if (m < 0.45 && q.length >= 5 && w.length >= 4 && mirip1(q, w)) m = 0.45;
  }
  return m;
}

/* skor leksikal gaya bm25 sederhana: idf (kata langka lebih berharga) x saturasi tf, judul berbobot 3x.
   idf: objek {kata: bobot} dari kueri (lihat cari); tanpa idf semua kata sama berat. 0 = ada kata kueri yang tak cocok. */
export function skor(qKata, hay, judulNorm = "", idf = null, avgdl = 12) {
  if (!qKata.length) return 0;
  const kh = hay.split(" "), kj = judulNorm ? judulNorm.split(" ") : [];
  const K1 = 1.2, B = 0.5, dl = kh.length;
  let s = 0;
  for (const q of qKata) {
    const ekspansi = ALIAS[q] ? ALIAS[q].split(" ")[0] : null;
    let mj = cocokKata(q, kj), mh = cocokKata(q, kh);
    if (!mj && !mh && ekspansi && hay.includes(ALIAS[q])) mh = 0.5;
    const m = Math.max(mj * 3, mh);
    if (!m) return 0;
    const tf = m * (mj ? 3 : 1);
    s += (idf?.[q] ?? 1.5) * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * dl / avgdl));
  }
  if (judulNorm && judulNorm.startsWith(qKata.join(" "))) s += 2;               // awalan judul utuh
  else if (judulNorm && judulNorm.includes(" " + qKata.join(" "))) s += 0.8;      // frasa di tengah judul
  return s;
}

/* kembalikan maks `per` butir per grup, terurut skor lalu judul terpendek */
export function cari(indeks, q, per = 6) {
  const qk = kata(q), keluar = new Map();
  if (!qk.length) return keluar;
  // idf per kata kueri: df = banyak butir yang kata/awalan-nya cocok; log((N - df + .5)/(df + .5) + 1)
  const N = indeks.length || 1, df = Object.fromEntries(qk.map((k) => [k, 0]));
  let tot = 0;
  for (const it of indeks) { tot += it.h.length; for (const k of qk) if (it.h.includes(k)) df[k]++; }
  const idf = Object.fromEntries(qk.map((k) => [k, Math.log((N - df[k] + 0.5) / (df[k] + 0.5) + 1)]));
  const avgdl = Math.max(4, tot / N / 6.5);
  for (const it of indeks) {
    const s = skor(qk, it.h, it.j, idf, avgdl) * (BOBOT_JENIS[it.g] ?? 1);
    if (!s) continue;
    const g = keluar.get(it.g) || []; g.push({ it, s }); keluar.set(it.g, g);
  }
  for (const [g, a] of keluar) keluar.set(g, a.sort((x, y) => y.s - x.s || x.it.j.length - y.it.j.length).slice(0, per).map((x) => x.it));
  return keluar;
}

/* sorot: bungkus awalan kata yang cocok dengan <mark>; teks di-escape lebih dulu */
const E = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function sorot(teks, q) {
  const qk = kata(q), s = String(teks ?? "");
  if (!qk.length) return E(s);
  let o = "";
  for (const m of s.split(/(\p{L}[\p{L}\p{N}]*|\p{N}+)/u)) {
    const n = norm(m);
    o += n && qk.some((k) => n.startsWith(k)) ? `<mark>${E(m)}</mark>` : E(m);
  }
  return o;
}
