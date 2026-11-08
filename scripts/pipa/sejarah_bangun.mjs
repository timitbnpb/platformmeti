// Bangun public/data/sejarah.json dari kurasi sejarah_data.mjs + kapasitas_tren.json (IRENA) + regulasi.json.
// Tidak ada permintaan jaringan; cek URL terpisah: node scripts/pipa/sejarah_bangun.mjs --cek-url (UA proyek, jeda 2 dtk, berhenti di 403/429).
import { readFileSync, writeFileSync } from "node:fs";
import { PERISTIWA } from "./sejarah_data.mjs";
import { namaProyek } from "../../public/inti/nama_proyek.js";
import { logoOrgSatu } from "../../public/inti/logo_org.js";

const TOPIK = { surya: ["Energi surya", "Solar energy"], bayu: ["Energi bayu", "Wind energy"], hidro: ["Hidro", "Hydro"], "panas-bumi": ["Panas bumi", "Geothermal"], karbon: ["Karbon", "Carbon"], "transisi-berkeadilan": ["Transisi berkeadilan", "Just transition"], "pembiayaan-hijau": ["Pembiayaan hijau", "Green finance"], "sampah-energi": ["Sampah menjadi energi", "Waste to energy"] };
const JENIS = { uu: "UU", pp: "PP", perpres: "Perpres", keppres: "Keppres", inpres: "Inpres", "permen-esdm": "Permen ESDM", "permen-kemenkeu": "PMK", "permen-kemenperin": "Permenperin", perda: "Perda" };
export const labelReg = (r) => `${JENIS[r.id.replace(/-\d+-\d{4}$/, "").replace(/-b?\d+.*$/, "")] ?? JENIS[r.jenis] ?? r.jenis} ${r.nomor}/${r.tahun}`;

const J = (f) => JSON.parse(readFileSync(new URL("../../public/data/" + f, import.meta.url), "utf8"));
const OUT = new URL("../../public/data/sejarah.json", import.meta.url);
export const KATEGORI = ["proyek", "regulasi", "kelembagaan", "teknologi", "pendanaan"];
export const SERI = ["hidro", "panas-bumi", "bioenergi", "surya", "bayu"]; // biomassa-sampah dilipat ke bioenergi

export function bangun(hariIni = new Date().toISOString().slice(0, 10)) {
  const reg = new Map(J("regulasi.json").baris.map((b) => [b.id, b]));
  const PR = new Map(J("proyek.json").baris.map((b) => [b.id, b])), OR = new Map(J("organisasi.json").baris.map((b) => [b.id, b])), IS = new Map(J("istilah.json").istilah.map((b) => [b.id, b]));
  const ada = { proyek: PR, org: OR, istilah: IS, topik: new Set(J("topik/indeks.json").topik.map((b) => b.id)) };
  const galat = [], ids = new Set();
  const peristiwa = PERISTIWA.map((e) => {
    if (ids.has(e.id)) galat.push("id ganda " + e.id); ids.add(e.id);
    if (!KATEGORI.includes(e.kat)) galat.push(e.id + ": kategori " + e.kat);
    const sumber = [...e.sumber], regs = e.reg ?? [];
    let t = e.t;
    for (const rid of regs) {
      const r = reg.get(rid); if (!r) { galat.push(e.id + ": regulasi hilang " + rid); continue; }
      if (r.tanggal_ditetapkan) t = r.tanggal_ditetapkan;
      sumber.unshift({ judul: `${r.jenis.toUpperCase()} ${r.nomor}/${r.tahun}: ${r.judul}`.slice(0, 160), penerbit: "BPK (JDIH)", url: r.url_sumber, bukti: "resmi" });
    }
    const k = e.tautan ?? {};
    for (const [jenis, himp] of [["proyek", ada.proyek], ["org", ada.org], ["istilah", ada.istilah], ["topik", ada.topik]]) for (const id of k[jenis] ?? []) if (!himp.has(id)) galat.push(`${e.id}: ${jenis} ${id} tak ada`);
    if (!sumber.length) galat.push(e.id + ": tanpa sumber");
    for (const l of ["id", "en"]) if (!e.judul[l] || !e.ringkas[l]) galat.push(`${e.id}: teks ${l} kosong`);
    const bukti = sumber.some((s) => s.bukti === "resmi") ? "resmi" : sumber.some((s) => s.bukti === "media") ? "media" : "ensiklopedia";
    const tahun = +t.slice(0, 4);
    return { id: e.id, t, tahun, dekade: Math.floor(tahun / 10) * 10, kat: e.kat, tek: e.tek ?? null, judul: e.judul, ringkas: e.ringkas,
      tautan: { proyek: (k.proyek ?? []).map((id) => ({ id, nama: namaProyek(PR.get(id)) })),
        org: (k.org ?? []).map((id) => ({ id, nama: OR.get(id).nama, logo: logoOrgSatu(id, OR.get(id).nama, OR.get(id).logo) })),
        regulasi: regs.map((id) => ({ id, nama: labelReg(reg.get(id)), status: reg.get(id).status })),
        istilah: (k.istilah ?? []).map((id) => ({ id, nama: IS.get(id).nama })),
        topik: (k.topik ?? []).map((id) => ({ id, nama: { id: TOPIK[id][0], en: TOPIK[id][1] } })), regulasi_luar: k.regulasi_luar ?? null }, sumber, bukti, tanggal_ambil: hariIni };
  }).sort((a, b) => a.t.localeCompare(b.t) || a.id.localeCompare(b.id));
  if (galat.length) throw new Error("sejarah_bangun:\n" + galat.join("\n"));

  const tren = J("kapasitas_tren.json"), tahun = [], peta = {};
  for (const b of tren.baris) { if (b.kapasitas_mw == null) continue; const s = b.taksonomi === "biomassa-sampah" ? "bioenergi" : b.taksonomi; if (!SERI.includes(s)) continue; (peta[s] ??= {})[b.tahun] = (peta[s][b.tahun] ?? 0) + b.kapasitas_mw; }
  for (let y = 2000; y <= Math.max(...tren.baris.map((b) => b.tahun)); y++) tahun.push(y);
  const seri = Object.fromEntries(SERI.map((s) => [s, tahun.map((y) => Math.round((peta[s]?.[y] ?? 0) * 100) / 100)]));
  const total = tren.baris.filter((b) => b.teknologi === "total_ebt").map((b) => ({ tahun: b.tahun, mw: b.kapasitas_mw }));
  return { lapis: "publik", dibangun_pada: hariIni, jumlah: peristiwa.length, kategori: KATEGORI, peristiwa,
    kapasitas: { tahun, seri, total_irena: total, sumber: tren.sumber.filter((s) => s.id === "s-irena"), tingkat_bukti: "resmi", catatan_id: "Kapasitas terpasang akhir tahun menurut IRENA (on-grid dan off-grid); angka PLN/ESDM bisa berbeda. Tahun terbaru bersifat sementara.", catatan_en: "Year-end installed capacity per IRENA (on- and off-grid); PLN/ESDM figures can differ. The latest year is provisional." },
    celah: ["Sebelum 2000 tidak ada deret kapasitas terbuka yang kami baca; grafik mulai 2000.", "Tahun PLTA kolonial (Bengkok, Plengan, Tonsealama, Rasak Bungo) berasal dari media dan bervariasi antar sumber; belum diverifikasi ke arsip primer.", "Bengkok dan Plengan belum ada di proyek.json sehingga tidak bertaut ke profil proyek."] };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const d = bangun();
  if (process.argv.includes("--cek-url")) {
    const UA = "METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)";
    const urls = [...new Set(d.peristiwa.flatMap((e) => e.sumber.map((s) => s.url)))];
    for (const u of urls) {
      const r = await fetch(u, { method: "GET", headers: { "user-agent": UA }, redirect: "follow" }).catch((e) => ({ status: "ERR " + e.message }));
      console.log(r.status, u);
      if (r.status === 403 || r.status === 429) { console.log("berhenti: " + r.status); break; }
      await new Promise((s) => setTimeout(s, 2000));
    }
  } else { writeFileSync(OUT, JSON.stringify(d)); console.log("sejarah.json", d.jumlah, "peristiwa"); }
}
