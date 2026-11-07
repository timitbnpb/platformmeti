// sitemap.mjs: public/sitemap.xml = halaman utama + semua /o/<id> dan /p/<id> dari lapis publik. Jalan: node scripts/pipa/sitemap.mjs [--cek]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const PUB = new URL("../../public/", import.meta.url);
const ASAL = "https://direktori.metiires.or.id";
const UTAMA = ["/", "/proyek", "/regulasi", "/wilayah", "/berita", "/siaran-pers", "/insight", "/rantai", "/asean", "/kalender", "/metode", "/tentang"];
const baca = (n) => JSON.parse(readFileSync(new URL(`data/${n}.json`, PUB), "utf8"));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

export function bangunSitemap() {
  const org = baca("organisasi"), pro = baca("proyek");
  const tgl = (pro.dibangun_pada || org.dibangun_pada || "").slice(0, 10);
  const u = [...UTAMA, ...org.baris.map((o) => `/o/${o.id}`), ...pro.baris.map((p) => `/p/${p.id}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.map((p) => `<url><loc>${esc(ASAL + p)}</loc>${tgl ? `<lastmod>${tgl}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("sitemap.xml", PUB), bangunSitemap());
  console.log("sitemap.xml ditulis");
}
