/* Format murni halaman kalender (tanpa DOM, diuji di Node): lokasi, sumber, penyelenggara, gambar. */
const bersih = (v) => String(v ?? "").trim();
const hostDari = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

/** Lokasi string atau objek {tempat, kota, negara} jadi "Tempat, Kota, Negara"; kosong bila tak ada. */
export function lokasiTeks(l) {
  if (!l) return "";
  if (typeof l === "string") return bersih(l);
  const p = [];
  for (const k of ["tempat", "kota", "negara"]) { const v = bersih(l[k]); if (v && !p.includes(v)) p.push(v); }
  return p.join(", ");
}
/** Tautan peta: koordinat bila ada, selain itu pencarian teks lokasi. */
export function petaUrl(l) {
  const teks = lokasiTeks(l);
  if (!teks) return "";
  const lat = Number(l?.lat), lon = Number(l?.lon ?? l?.lng);
  if (l && typeof l === "object" && l.lat != null && l.lat !== "" && Number.isFinite(lat) && Number.isFinite(lon)) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(teks)}`;
}
/** Sumber bisa objek tunggal atau larik; tanggal bisa `tanggal` atau `tanggal_periksa`. */
export const sumberDaftar = (s) => (Array.isArray(s) ? s : s ? [s] : []).filter((x) => x && typeof x === "object")
  .map((x) => ({ label: bersih(x.label), url: /^https?:\/\//i.test(x.url || "") ? x.url : "", tanggal: bersih(x.tanggal || x.tanggal_periksa) })).filter((x) => x.label || x.url);
/** Nama tampil satu sumber: kamus bila ada, selain itu host URL; "" bila tak ada keduanya. */
export const namaSumber = (s, nama) => (s.label && nama(s.label)) || hostDari(s.url) || "";
/** "Nama, diambil 8 Nov 2026" dari sumber pertama; "" (baris disembunyikan) bila tak ada. */
export function sumberTeks(sumber, { nama, diambil }) {
  const s = sumberDaftar(sumber)[0];
  const n = s && namaSumber(s, nama);
  return n ? n + (s.tanggal ? ", " + diambil(s.tanggal) : "") : "";
}
/** Nama penyelenggara: `penyelenggara` bila ada, selain itu `mitra` (string atau larik). */
export function namaPenyelenggara(b) {
  const a = [].concat(b.penyelenggara?.length ? b.penyelenggara : b.mitra ?? []);
  return [...new Set(a.map(bersih).filter(Boolean))];
}
const TEMA = [[/hidro|plta|bendungan/i, "hidro-saguling"], [/surya|plts|solar/i, "surya-cirata"], [/bayu|angin|pltb/i, "bayu-sidrap"], [/panas ?bumi|geotermal|plt[pa]/i, "panas-bumi-sibayak"],
  [/sawit|bioenergi|biodiesel|biofuel/i, "bioenergi-sawit"], [/bioetanol|etanol|tebu/i, "bioetanol-tebu"], [/baterai|penyimpanan/i, "penyimpanan-baterai"], [/nuklir/i, "nuklir-siwabessy"], [/sampah|psel/i, "sampah-psel"], [/biomassa/i, "biomassa-bantargebang"]];
/** Gambar kepala: poster lokal, lalu foto tema beranda menurut teknologi di teks, selain itu "" (gradien brand). */
export function gambarAcara(b) {
  const p = b.poster?.file;
  if (typeof p === "string" && p.startsWith("/img/acara/")) return p;
  const teks = [b.judul, b.deskripsi, ...(b.kata_kunci || [])].join(" ");
  const m = TEMA.find(([re]) => re.test(teks));
  return m ? `/img/beranda/${m[1]}.webp` : "";
}
