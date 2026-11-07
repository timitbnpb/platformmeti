/* Rumus pencarian global (murni, tanpa DOM): normalisasi tanpa aksen/huruf besar, awalan kata, singkatan, peringkat. */
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* singkatan -> frasa panjang (dua arah: "surya" menemukan PLTS, "plts" menemukan "pembangkit listrik tenaga surya") */
export const ALIAS = {
  plts: "pembangkit listrik tenaga surya", pltp: "pembangkit listrik tenaga panas bumi", plta: "pembangkit listrik tenaga air",
  pltb: "pembangkit listrik tenaga bayu angin", pltu: "pembangkit listrik tenaga uap batubara", pltbm: "pembangkit listrik tenaga biomassa",
  pltsa: "pembangkit listrik tenaga sampah", esdm: "energi sumber daya mineral", pln: "perusahaan listrik negara",
  ebt: "energi baru terbarukan", dpr: "dewan perwakilan rakyat", ojk: "otoritas jasa keuangan", bumn: "badan usaha milik negara",
  ruptl: "rencana usaha penyediaan tenaga listrik", ruen: "rencana umum energi nasional", ipp: "produsen listrik swasta",
};

export const kata = (s) => norm(s).split(" ").filter(Boolean);

/* teks pencarian satu butir: normalisasi + perluasan singkatan yang muncul di teks */
export function jerami(...bagian) {
  const n = norm(bagian.filter(Boolean).join(" ")), tambah = [];
  for (const w of n.split(" ")) if (ALIAS[w]) tambah.push(ALIAS[w]);
  return tambah.length ? n + " " + tambah.join(" ") : n;
}

/* skor satu kueri terhadap satu butir; 0 = tidak cocok (semua kata kueri harus cocok awalan kata) */
export function skor(qKata, hay, judulNorm = "") {
  if (!qKata.length) return 0;
  const kh = hay.split(" "), kj = judulNorm ? judulNorm.split(" ") : [];
  let s = 0;
  for (const q of qKata) {
    const ekspansi = ALIAS[q] ? ALIAS[q].split(" ")[0] : null;
    if (kj.includes(q)) s += 6;
    else if (kj.some((w) => w.startsWith(q))) s += 4;
    else if (kh.includes(q)) s += 3;
    else if (kh.some((w) => w.startsWith(q))) s += 2;
    else if (ekspansi && hay.includes(ALIAS[q])) s += 1;
    else return 0;
  }
  if (judulNorm && judulNorm.startsWith(qKata.join(" "))) s += 5;
  return s;
}

/* kembalikan maks `per` butir per grup, terurut skor lalu judul terpendek */
export function cari(indeks, q, per = 6) {
  const qk = kata(q), keluar = new Map();
  if (!qk.length) return keluar;
  for (const it of indeks) {
    const s = skor(qk, it.h, it.j);
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
