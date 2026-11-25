/* Ontologi jaringan (KJ-06): hitungan murni tanpa DOM, dimuat layar dan diuji Node.
   Kontrak: docs/perencanaan/KEMBARAN-JARINGAN.md §3 dan §6 butir 10. Masukan: objek-inti.json + objek-rs.json digabung (op, sis, prov, pb, gi, jl, rs). */

export const LAPIS = ["op", "sis", "prov", "pb", "gi", "jl", "rs"];
const kosong = () => Object.fromEntries(LAPIS.map((l) => [l, []]));
const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Indeks tetangga langsung (undirected) dari kunci asing tiap objek. Kode provinsi ("11") dinormalkan ke id prov_11. */
export function bangunIndeks(o) {
  const lap = new Map(), per = {}, adj = new Map();
  for (const l of LAPIS) { per[l] = new Map(); for (const x of o?.[l] || []) { per[l].set(x.id, x); lap.set(x.id, l); adj.set(x.id, new Set()); } }
  const id = (v) => (lap.has(v) ? v : lap.has("prov_" + v) ? "prov_" + v : null);
  for (const [l, m] of Object.entries(per)) {
    for (const x of m.values()) {
      for (const f of ["op", "sis", "prov", "pb", "gi", "jl", "rs"]) {
        if (f === l) continue;
        for (const v of arr(x[f])) { const k = typeof v === "string" ? id(v) : null; if (k && k !== x.id) { adj.get(x.id).add(k); adj.get(k).add(x.id); } }
      }
    }
  }
  return { per, lap, adj };
}

const dari = (ix, ids, l) => { const r = []; for (const i of ids) if (ix.lap.get(i) === l) r.push(i); return r; };

/** Objek terkait per lapis. Tetangga langsung, lalu penutup supaya hitungan lintas lapis konsisten (§6.10):
    ruas terkait mengikutkan jalurnya dan gardu ujungnya; jalur/ruas/pembangkit saling menarik lewat gardu; op/sis/prov/jalur menarik
    op, sis, prov dari anggotanya. Objek terpilih sendiri masuk lapisnya (1), bukan tabel kosong. */
export function terkait(ix, idObj) {
  const hasil = kosong(), L0 = ix.lap.get(idObj);
  if (!L0) return hasil;
  const N = new Set(ix.adj.get(idObj));
  const nb = (i) => ix.adj.get(i) || new Set();
  const rsN = dari(ix, N, "rs"), giN = dari(ix, N, "gi");
  if (L0 === "op" || L0 === "sis" || L0 === "prov") {
    for (const r of rsN) for (const k of nb(r)) { const l = ix.lap.get(k); if (l === "jl" || l === "gi") N.add(k); }
    const anggota = [...dari(ix, N, "gi"), ...rsN, ...dari(ix, N, "pb")];
    for (const a of anggota) for (const k of nb(a)) { const l = ix.lap.get(k); if (l === "op" || l === "sis" || l === "prov") N.add(k); }
  } else if (L0 === "jl") {
    for (const r of rsN) for (const k of nb(r)) { const l = ix.lap.get(k); if (l === "op" || l === "prov") N.add(k); }
    for (const g of giN) for (const k of nb(g)) if (ix.lap.get(k) === "pb") N.add(k);
  } else if (L0 === "rs") {
    for (const g of giN) for (const k of nb(g)) if (ix.lap.get(k) === "pb") N.add(k);
  } else if (L0 === "pb") {
    for (const g of giN) for (const k of nb(g)) { const l = ix.lap.get(k); if (l === "rs" || l === "jl") N.add(k); }
  }
  for (const i of N) { const l = ix.lap.get(i); if (l) hasil[l].push(i); }
  hasil[L0] = [idObj];
  return hasil;
}

/** Lapis tabel bawaan sesudah memilih objek: lapis terkait terdekat (menurun, lalu menaik) yang tidak kosong; objek sendiri bila semuanya kosong. */
export function lapisBawaan(hasil, lapisObj) {
  const i = LAPIS.indexOf(lapisObj);
  for (let d = 1; d < LAPIS.length; d++) for (const j of [i + d, i - d]) if (j >= 0 && j < LAPIS.length && hasil[LAPIS[j]].length) return LAPIS[j];
  return lapisObj;
}

/** Jejak: objek baru terkait dengan objek terakhir = tambah satu langkah; tidak terkait = jejak baru [objek]. Jejak berisi id. */
export function langkahJejak(ix, jejak, idBaru) {
  const i = jejak.indexOf(idBaru);
  if (i >= 0) return jejak.slice(0, i + 1);
  const akhir = jejak[jejak.length - 1], l = ix.lap.get(idBaru);
  return akhir && ix.lap.get(akhir) !== l && terkait(ix, akhir)[l].includes(idBaru) ? [...jejak, idBaru] : [idBaru];
}
/** Klik langkah jejak: potong sampai langkah itu. */
export const potongJejak = (jejak, i) => jejak.slice(0, i + 1);

/** Himpunan sistem dan provinsi sebuah objek (untuk saringan Sistem/Provinsi lapis 4-7). Jalur: prov dari ruasnya. */
export function sisProvDari(ix, x, l) {
  const sis = x.sis ? [x.sis] : [];
  let prov = arr(x.prov);
  if (l === "jl") prov = [...new Set(arr(x.rs).flatMap((r) => arr(ix.per.rs.get(r)?.prov)))];
  return { sis, prov: prov.map((p) => (typeof p === "string" && p.startsWith("prov_") ? p.slice(5) : p)) };
}

/** Saringan teks (tanpa huruf besar) + sistem + provinsi atas daftar id. nama(id) -> string. */
export function saring(ix, ids, l, { q = "", sis = "", prov = "", nama }) {
  const k = q.trim().toLowerCase();
  return ids.filter((i) => {
    const x = ix.per[l].get(i);
    if (k && !String(nama(x, l) ?? "").toLowerCase().includes(k)) return false;
    if (!sis && !prov) return true;
    const sp = sisProvDari(ix, x, l);
    return (!sis || sp.sis.includes(sis)) && (!prov || sp.prov.includes(prov));
  });
}

/** Urut stabil; nilai null/kosong selalu di ujung. arah: 1 naik, -1 turun. */
export function urut(ids, nilai, arah = 1) {
  const kosongV = (v) => v == null || v === "" || (typeof v === "number" && Number.isNaN(v));
  return ids.map((id, i) => [id, nilai(id), i]).sort((a, b) => {
    const ka = kosongV(a[1]), kb = kosongV(b[1]);
    if (ka || kb) return ka === kb ? a[2] - b[2] : ka ? 1 : -1;
    const c = typeof a[1] === "number" && typeof b[1] === "number" ? a[1] - b[1] : String(a[1]).localeCompare(String(b[1]), "id", { numeric: true });
    return c ? c * arah : a[2] - b[2];
  }).map((r) => r[0]);
}

/** Pelurusan titik untuk gambar pelat: buang titik yang kurang dari tol dari titik terakhir yang disimpan; ujung selalu disimpan. */
export function sederhana(pts, tol) {
  if (pts.length < 3) return pts;
  const out = [pts[0]], t2 = tol * tol;
  for (let i = 1; i < pts.length - 1; i++) { const p = out[out.length - 1], q = pts[i]; if ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= t2) out.push(q); }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Invarian §6.10 untuk satu objek; kembalikan daftar pelanggaran (kosong = sah). */
export function cekInvarian(ix, idObj) {
  const h = terkait(ix, idObj), salah = [], L0 = ix.lap.get(idObj);
  if (h.rs.length && L0 !== "rs") {
    const jl = new Set(h.jl);
    for (const r of h.rs) { const j = ix.per.rs.get(r)?.jl; if (j && ix.per.jl.has(j) && !jl.has(j) && L0 !== "gi") salah.push(`rs-${r}: jl-${j} missing`); }
    if (!h.jl.length) salah.push("rs>0 jalur 0");
  }
  if (h.jl.length && !h.rs.length && L0 !== "rs") salah.push("jl>0 rs 0");
  if (h[L0].length !== 1) salah.push("self-layer != 1");
  return salah;
}
