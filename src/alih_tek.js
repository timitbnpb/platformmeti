// Satu teknologi, satu rumah: modul ujung ke ujung. Tautan lama /teknologi/<kode>, /topik?id=<x>, /pelacak?tek=<x> dialihkan 301.
// Cermin public/inti/rumah_tek.js (tests/rute-gabung.test.mjs menjaga keduanya sama).
export const MODUL_TEK = { surya: "/surya", bayu: "/angin", hidro: "/hidro", "panas-bumi": "/panas-bumi", bioenergi: "/bioenergi", "biomassa-sampah": "/sampah-energi", sampah: "/sampah-energi", wte: "/sampah-energi", penyimpanan: "/baterai-ev", hidrogen: "/hidrogen", nuklir: "/nuklir", gas: "/gas", pltu: "/transisi-pltu" };
export const MODUL_TOPIK = { surya: "/surya", bayu: "/angin", hidro: "/hidro", "panas-bumi": "/panas-bumi", bioenergi: "/bioenergi", hidrogen: "/hidrogen", penyimpanan: "/baterai-ev", "kendaraan-listrik": "/baterai-ev", nuklir: "/nuklir", "transisi-berkeadilan": "/transisi-pltu", "sampah-energi": "/sampah-energi" };
export const MODUL_PELACAK = { "plts-atap": "/surya", "plts-terapung": "/surya", bayu: "/angin", "panas-bumi": "/panas-bumi", plta: "/hidro", bioenergi: "/bioenergi", psel: "/sampah-energi", baterai: "/baterai-ev", "kendaraan-listrik": "/baterai-ev", hidrogen: "/hidrogen", nuklir: "/nuklir" };

// Mengembalikan alamat tujuan (jalur + query + hash) atau null bila path/query ini tidak punya modul.
export function tujuanAlihTek(url) {
  const { pathname: p, searchParams: q } = url;
  let m;
  if ((m = p.match(/^\/teknologi\/([^/]+)$/)) && Object.hasOwn(MODUL_TEK, m[1])) return MODUL_TEK[m[1]] + "?tab=ringkasan";
  if (p === "/topik" && Object.hasOwn(MODUL_TOPIK, q.get("id") || "")) {
    const id = q.get("id");
    return MODUL_TOPIK[id] + "?tab=dasar" + (id === "kendaraan-listrik" ? "&topik=" + id : "");
  }
  if (p === "/pelacak" && Object.hasOwn(MODUL_PELACAK, q.get("tek") || "")) return MODUL_PELACAK[q.get("tek")];
  return null;
}
