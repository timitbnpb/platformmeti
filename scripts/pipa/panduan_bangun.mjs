// Bangun public/data/panduan.json dari panduan_data.mjs; periksa tautan (regulasi, organisasi, istilah, kunci skala biaya). Tanpa jaringan.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { namaProyek as _n } from "../../public/inti/nama_proyek.js";
import { logoOrgSatu } from "../../public/inti/logo_org.js";
import { labelReg } from "./sejarah_bangun.mjs";
import { PANDUAN, TEMPLAT, MITOS, PENAFIAN } from "./panduan_data.mjs";

// B-11: rujukan gambar yang berkasnya tidak ada dibuang (layar jatuh ke ikon).
const logoAda = (u) => (u && existsSync(new URL("../../public" + u, import.meta.url)) ? { logo: u } : {});
const J = (f) => JSON.parse(readFileSync(new URL("../../public/data/" + f, import.meta.url), "utf8"));
const OUT = new URL("../../public/data/panduan.json", import.meta.url);

export function bangun(hariIni = new Date().toISOString().slice(0, 10)) {
  const RG = new Map(J("regulasi.json").baris.map((b) => [b.id, b])), OG = new Map(J("organisasi.json").baris.map((b) => [b.id, b])), IM = new Map(J("istilah.json").istilah.map((b) => [b.id, b]));
  const reg = new Set(RG.keys()), org = new Set(OG.keys());
  const ist = new Set(IM.keys()), skala = new Set(J("biaya_bangun.json").skala.map((b) => b.id));
  const galat = [], ids = new Set();
  const cek = (g, himp, daftar, nama) => { for (const x of daftar ?? []) if (!himp.has(x)) galat.push(`${g}: ${nama} ${x} tak ada`); };
  for (const p of PANDUAN) {
    if (ids.has(p.id)) galat.push("id ganda " + p.id); ids.add(p.id);
    cek(p.id, reg, p.regulasi, "regulasi"); cek(p.id, org, p.org, "org"); cek(p.id, ist, p.istilah, "istilah");
    if (p.skala) { cek(p.id, skala, [p.skala.id, p.skala.tambah?.id].filter(Boolean), "skala"); }
    if (p.langkah.length < 4) galat.push(p.id + ": langkah < 4");
    for (const l of p.langkah) if (!l.ikon || !l.judul.en || !l.isi.en) galat.push(p.id + ": langkah tak lengkap");
    if (!p.faq?.length) galat.push(p.id + ": tanpa FAQ");
  }
  for (const m of MITOS) { if (m.reg) cek(m.id, reg, [m.reg], "regulasi"); if (!m.fakta.en) galat.push(m.id + ": en kosong"); }
  if (galat.length) throw new Error("panduan_bangun:\n" + galat.join("\n"));
  const taut = (p) => ({ regulasi: (p.regulasi ?? []).map((id) => ({ id, nama: labelReg(RG.get(id)), judul: RG.get(id).judul, status: RG.get(id).status })), org: (p.org ?? []).map((id) => ({ id, nama: OG.get(id).nama, ...logoAda(logoOrgSatu(id, OG.get(id).nama, OG.get(id).logo)) })), istilah: (p.istilah ?? []).map((id) => ({ id, nama: IM.get(id).nama })) });
  const panduan = PANDUAN.map(({ regulasi, org, istilah, ...sisa }) => ({ ...sisa, taut: taut({ regulasi, org, istilah }) }));
  const mitos = MITOS.map((m) => ({ ...m, taut_reg: m.reg ? taut({ regulasi: [m.reg] }).regulasi[0] : null }));
  return { lapis: "publik", dibangun_pada: hariIni, penafian: PENAFIAN, jumlah: PANDUAN.length, panduan, templat: TEMPLAT, mitos,
    celah: ["Durasi adalah perkiraan editorial (EST), bukan janji instansi.", "Angka biaya dibaca dari biaya_bangun.json (hipotesis/EST di sana); panduan tidak menambah angka baru.", "Syarat dokumen bersifat umum; PLN setempat dan pemberi dana dapat meminta tambahan."] };
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const d = bangun(); writeFileSync(OUT, JSON.stringify(d)); console.log("panduan.json", d.jumlah, "panduan"); }
