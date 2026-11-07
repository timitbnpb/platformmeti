/* Satu peta nama media baku + kunci berkas logo lokal (/img/media/<domain>.png, dari scripts/panen/logo_media.mjs).
   domainMedia(hostAtauUrl) -> domain dasar tanpa subdomain ("berita.liputan6.com" -> "liputan6.com"); namaMedia(x) -> nama baku. */
const NAMA = {
  "antaranews.com": "Antara", "viva.co.id": "Viva", "jawapos.com": "Jawa Pos", "liputan6.com": "Liputan6", "koran-jakarta.com": "Koran Jakarta",
  "tribunnews.com": "Tribun", "kompas.com": "Kompas", "tempo.co": "Tempo", "republika.co.id": "Republika", "kontan.co.id": "Kontan",
  "bisnis.com": "Bisnis Indonesia", "cnbcindonesia.com": "CNBC Indonesia", "cnnindonesia.com": "CNN Indonesia", "detik.com": "Detik",
  "okezone.com": "Okezone", "sindonews.com": "Sindonews", "jpnn.com": "JPNN", "rri.co.id": "RRI", "merdeka.com": "Merdeka", "katadata.co.id": "Katadata",
  "harianjogja.com": "Harian Jogja", "metrotvnews.com": "Metro TV", "beritajatim.com": "Berita Jatim", "thejakartapost.com": "The Jakarta Post",
  "batampos.co.id": "Batam Pos", "ruangenergi.com": "Ruang Energi", "news.cn": "Xinhua", "yahoo.com": "Yahoo", "forbes.com": "Forbes"
};
const DUA = /\.(co|com|net|org|or|go|ac)\.(id|my|sg|uk|au|pk|ph|cn|tz)$|\.(co|com)\.[a-z]{2}$/;
export function domainMedia(x) {
  let h = String(x ?? "").trim();
  try { h = new URL(h).hostname; } catch { /* sudah host */ }
  h = h.toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return "";
  const p = h.split("."), n = DUA.test(h) ? 3 : 2;
  return p.slice(-n).join(".");
}
export function namaMedia(x) {
  const d = domainMedia(x);
  if (!d) return String(x ?? "");
  if (NAMA[d]) return NAMA[d];
  const inti = d.split(".")[0].replace(/-/g, " ");
  return inti.charAt(0).toUpperCase() + inti.slice(1);
}
export const logoLokal = (x) => { const d = domainMedia(x); return d ? `/img/media/${d}.png` : ""; };
