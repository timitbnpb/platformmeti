/* Kembaran jaringan (KJ-*): pemuat potret bersama + chip status fakta. Kontrak: docs/perencanaan/KEMBARAN-JARINGAN.md §2, §5.
   Tiap potret dimuat sekali per halaman; berkas yang belum ada menjadi null dan tab menampilkan keadaan kosong. */
import { t, esc, sumberBerkas } from "/jr_umum.js";

const URL_KJ = { ringkas: "/data/kembaran/ringkas.json", inti: "/data/kembaran/objek-inti.json", rs: "/data/kembaran/objek-rs.json", fakta: "/data/kembaran/objek-fakta.json", energi: "/data/kembaran/energi.json", geo: "/geo/kembaran.json", sumber: "/data/kembaran/sumber.json", deret: "/data/kembaran/deret.json", lapis: "/data/kembaran/lapis.json" };
const cache = {};
export const muatKJ = (n) => (cache[n] ??= fetch(URL_KJ[n], { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));

/** Daftar sumber penuh (sumber.json): meta.sumber di berkas lain hanya id. Panggil muatSumber() sebelum memakai kakiSumber(). */
let SUMBER = new Map();
export async function muatSumber() { const s = await muatKJ("sumber"); SUMBER = new Map((s?.sumber || []).map((x) => [x.id, x])); return SUMBER; }
export const sumberDari = (id) => SUMBER.get(id) || null;
/** Kaki "Sumber: ..." dari meta.sumber (id) dengan objek penuh dari sumber.json. */
export const kakiSumber = (meta) => sumberBerkas({ sumber: (meta?.sumber || []).map((id) => SUMBER.get(typeof id === "string" ? id : id?.id)).filter(Boolean) });

/** Chip status fakta: sumber | hitung | menunggu | est. */
export const chipSt = (st) => (st ? `<span class="kj-st kj-st-${esc(st)}">${esc(t("kj.st." + st))}</span>` : "");
/** Chip id sumber, menaut ke baris di tab Sumber. */
export const chipSrc = (id) => (id ? `<a class="kj-src" href="?tab=sumber#src-${encodeURIComponent(id)}">${esc(id)}</a>` : "");
/** Baris kaki fakta: status + sumber + tanggal. */
export const kakiFakta = (st, src, tgl) => `<p class="kj-kaki">${chipSt(st)}${[].concat(src || []).map(chipSrc).join("")}${tgl ? `<span class="kj-tgl">${esc(t("kj.per", { tgl }))}</span>` : ""}</p>`;

/** Tempel relasi yang dipindah pipa ke objek-rs (jl.rs dari jl_rs, jl.gi dari a/b berawalan gi_) dan ruas ke objek inti. Mengubah jl di tempat. */
export function gabungObjek(inti, rsb) {
  for (const j of inti.jl) { j.rs = rsb.jl_rs[j.id] || []; j.gi = [j.a, j.b].filter((v) => typeof v === "string" && v.startsWith("gi_")); }
  return { ...inti, rs: rsb.rs };
}
