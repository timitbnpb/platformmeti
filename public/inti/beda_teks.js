/* beda_teks.js (F65-111): beda teks dua versi pasal. Fungsi murni: tanpa DOM, tanpa fetch, dipakai /regulasi (Pustaka hukum) dan uji.
   Keluaran selalu larik { j: "sama" | "tambah" | "hapus", s: teks }, berurutan menurut teks baru. Teks hanya dipindah, tidak pernah ditafsirkan sebagai HTML.
   Beda per kata memakai urutan umum terpanjang (LCS). Tabel LCS berukuran n x m, jadi di atas AMBANG sel perbandingan turun ke per baris (ayat),
   lalu per kata hanya di blok baris yang berubah; blok yang masih terlalu besar ditandai hapus lalu tambah seutuhnya. */

export const AMBANG = 250000;
export const RE_PASAL = /^Pasal\s*(\d+\s*[A-Z]?)$/;
const kata = (s) => String(s ?? "").split(/\s+/).filter(Boolean);
const baris = (s) => String(s ?? "").split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);

/* LCS atas dua larik token; mengembalikan langkah [j, token] berurutan, atau null bila n x m di atas ambang. */
function lcs(a, b, ambang) {
  const n = a.length, m = b.length;
  if (n * m > ambang) return null;
  const L = m + 1, T = new Uint32Array((n + 1) * L);
  for (let i = n - 1; i >= 0; i--) for (let k = m - 1; k >= 0; k--) T[i * L + k] = a[i] === b[k] ? T[(i + 1) * L + k + 1] + 1 : Math.max(T[(i + 1) * L + k], T[i * L + k + 1]);
  const out = []; let i = 0, k = 0;
  while (i < n && k < m) {
    if (a[i] === b[k]) { out.push(["sama", a[i]]); i++; k++; }
    else if (T[(i + 1) * L + k] >= T[i * L + k + 1]) out.push(["hapus", a[i++]]);
    else out.push(["tambah", b[k++]]);
  }
  while (i < n) out.push(["hapus", a[i++]]);
  while (k < m) out.push(["tambah", b[k++]]);
  return out;
}
/* gabung langkah berurutan yang sejenis; di dalam satu blok ubahan, hapusan ditulis dulu lalu tambahan */
function rapat(langkah, sambung) {
  const out = []; let h = [], t = [];
  const buang = () => { if (h.length) out.push({ j: "hapus", s: h.join(sambung) }); if (t.length) out.push({ j: "tambah", s: t.join(sambung) }); h = []; t = []; };
  for (const [j, s] of langkah) {
    if (j === "hapus") h.push(s); else if (j === "tambah") t.push(s);
    else { buang(); const akhir = out[out.length - 1]; if (akhir?.j === "sama") akhir.s += sambung + s; else out.push({ j: "sama", s }); }
  }
  buang();
  return out;
}

/** Beda per kata. null bila terlalu besar untuk ambang. */
export function bedaKata(lama, baru, ambang = AMBANG) {
  const l = lcs(kata(lama), kata(baru), ambang);
  return l && rapat(l, " ");
}

/** Beda dua teks: per kata bila muat, selain itu per baris dengan beda kata di blok yang berubah. */
export function bedaTeks(lama, baru, ambang = AMBANG) {
  const a = kata(lama).join(" "), b = kata(baru).join(" ");
  if (a === b) return a ? [{ j: "sama", s: a }] : [];
  const langsung = bedaKata(lama, baru, ambang);
  if (langsung) return langsung;
  const lb = lcs(baris(lama), baris(baru), ambang);
  if (!lb) return [{ j: "hapus", s: a }, { j: "tambah", s: b }];   // ponytail: di atas ambang pada dua tingkat, tanpa penjajaran; naikkan ke Myers O(ND) bila ada pasal sepanjang itu
  const out = [];
  for (const blok of rapat(lb, "\n")) {
    const dulu = out[out.length - 1];
    if (blok.j === "tambah" && dulu?.j === "hapus") {
      const halus = bedaKata(dulu.s, blok.s, ambang);
      if (halus) { out.pop(); out.push(...halus); continue; }
    }
    out.push(blok);
  }
  return out;
}

/** Jumlah kata yang ditambah dan dihapus. */
export const ringkasBeda = (ops) => ops.reduce((r, o) => { if (o.j !== "sama") r[o.j] += kata(o.s).length; return r; }, { tambah: 0, hapus: 0 });

/** "Pasal 5", "Pasal5", "Pasal 5 A" -> "5", "5A"; label lain (Pasal I, Menimbang) -> null. Angka Romawi peraturan perubahan sengaja tidak cocok. */
export const kunciPasal = (label) => { const m = String(label ?? "").trim().match(RE_PASAL); return m ? m[1].replace(/\s+/g, "") : null; };

/** Peraturan perubahan menulis perintah berikutnya ("4. Ketentuan Pasal 6 diubah sehingga berbunyi sebagai berikut:") tepat sesudah bunyi pasal,
    dan pemecah segmen ikut membawanya. Buang ekor itu (paling banyak 4 baris terakhir) supaya tidak terhitung sebagai tambahan. */
const RE_PERINTAH = /^\d+\.?\s*(Ketentuan|Di antara|Diantara|Penjelasan|Judul|Lampiran)\b/;
export function buangPerintah(teks) {
  const b = String(teks ?? "").replace(/\s+$/, "").split("\n");
  for (let i = b.length - 1; i >= Math.max(1, b.length - 4); i--) {
    if (RE_PERINTAH.test(b[i].trim()) && /(diubah|disisipkan|dihapus|ditambah|sebagai berikut)/.test(b.slice(i).join(" "))) return b.slice(0, i).join("\n").replace(/\s+$/, "");
  }
  return b.join("\n");
}

/** Pasangkan pasal dua dokumen dari segmen { label, teks }. Tiap pasal bernomor di dokumen baru dicari padanannya di dokumen lama:
    ada = berubah atau sama, tidak ada = sisipan. Pasal dokumen lama yang tidak disebut dokumen baru dihitung di `tetap` (peraturan perubahan hanya memuat pasal yang diubah). */
export function pasangPasal(segLama, segBaru) {
  const lama = new Map(), pakai = new Set(), pasangan = [];
  for (const s of segLama || []) { const k = kunciPasal(s.label); if (k && !lama.has(k)) lama.set(k, s.teks ?? ""); }
  for (const s of segBaru || []) {
    const k = kunciPasal(s.label);
    if (!k || pakai.has(k)) continue;
    pakai.add(k);
    pasangan.push({ pasal: k, lama: lama.has(k) ? lama.get(k) : null, baru: buangPerintah(s.teks) });
  }
  return { pasangan, tetap: [...lama.keys()].filter((k) => !pakai.has(k)).length };
}
