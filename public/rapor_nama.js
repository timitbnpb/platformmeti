/* Normalisasi nama pengembang/pendana untuk /rapor: alias digabung lalu porsi dihitung ulang, logo (resolver organisasi atau bendera), format uang ringkas.
   Alias mengikuti riwayat nama resmi (Indonesia Power menjadi PLN Indonesia Power 2022; Pembangkitan Jawa Bali menjadi PLN Nusantara Power; INCO = PT Vale Indonesia).
   Murni, tanpa DOM, kecuali logoHtml (string). */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { namaBaku } from "/inti/nama_baku.js";
import { NORM } from "/inti/org_sensus.js";
import { uangHtml } from "/inti/uang.js";

/* pengembang: [pola nama mentah, nama baku, logo] (urutan penting: pola pertama yang cocok menang) */
const DEV = [
  [/indonesia power/i, "PLN Indonesia Power", "/img/logo/pln-indonesia-power.png"],
  [/pembangkitan jawa.?bali|nusantara power/i, "PLN Nusantara Power", "/img/logo/pln-nusantara-power.png"],
  [/^pt\.? pln \(persero\)$|^pln$/i, "PT PLN (Persero)", "/img/logo/pln.png"],
  [/^inco$|vale indonesia/i, "PT Vale Indonesia", ""],
  [/inalum/i, "PT Inalum", ""],
  [/poso energ/i, "PT Poso Energy", ""],
];
/* pendana: [pola, nama baku, kode bendera atau ""] */
const DANA = [
  [/asian development bank/i, "Asian Development Bank (ADB)", ""],
  [/federal ministry for economic cooperation/i, "German Federal Ministry for Economic Cooperation (BMZ)", "de"],
  [/netherlands enterprise agency/i, "Netherlands Enterprise Agency (RVO)", "nl"],
  [/ministry of foreign affairs of the netherlands/i, "Ministry of Foreign Affairs of the Netherlands", "nl"],
  [/green climate fund/i, "Green Climate Fund (GCF)", ""],
  [/u\.?s\.? agency for international development|usaid/i, "U.S. Agency for International Development (USAID)", "us"],
  [/foreign, commonwealth|fcdo/i, "UK Foreign, Commonwealth and Development Office (FCDO)", "gb"],
  [/science, innovation and technology/i, "UK Department for Science, Innovation and Technology", "gb"],
  [/finland/i, "Ministry for Foreign Affairs of Finland", "fi"],
  [/^sweden/i, "Sweden", "se"],
  [/dfatd|canada/i, "Global Affairs Canada (DFATD)", "ca"],
  [/australia/i, "Australian Aid", "au"],
  [/office for government policy coordination/i, "Office for Government Policy Coordination", "kr"],
  [/denmark/i, "Ministry of Foreign Affairs, Denmark", "dk"],
  [/world bank|bank dunia/i, "World Bank", ""],
];
const bersih = (s) => String(s).replace(/\s*\((ipp|persero)?\)\s*$/i, (m) => (/persero/i.test(m) ? m : "")).replace(/\s+PT\.?$/i, "").replace(/^PT\.\s*/i, "PT ").replace(/\s+/g, " ").trim();

/* gabungkan baris bernama sama setelah dinormalkan; porsi dihitung ulang terhadap penyebut (bila ada) */
export function gabungPengembang(baris, penyebutMw) {
  const peta = new Map();
  for (const b of baris) {
    const a = DEV.find(([re]) => re.test(b.nama));
    const nama = a ? a[1] : namaBaku(bersih(b.nama)).nama, k = NORM(nama);
    const x = peta.get(k) || { nama, logo: a ? a[2] : "", mw: 0, proyek: 0, asal: [] };
    x.mw += b.mw || 0; x.proyek += b.proyek || 0; if (b.nama !== nama) x.asal.push(b.nama);
    peta.set(k, x);
  }
  return [...peta.values()].sort((p, q) => q.mw - p.mw).map((x, i) => ({ ...x, peringkat: i + 1, porsi: penyebutMw ? (x.mw / penyebutMw) * 100 : null }));
}
export function gabungPendana(baris) {
  const peta = new Map();
  for (const b of baris) {
    const a = DANA.find(([re]) => re.test(b.nama));
    const nama = a ? a[1] : namaBaku(bersih(b.nama)).nama, k = NORM(nama);
    const x = peta.get(k) || { nama, bendera: a ? a[2] : "", proyek: 0, nilai: null, asal: [] };
    x.proyek += b.proyek || 0; if (b.nilai_usd != null) x.nilai = (x.nilai || 0) + b.nilai_usd; if (b.nama !== nama) x.asal.push(b.nama);
    peta.set(k, x);
  }
  return [...peta.values()].sort((p, q) => q.proyek - p.proyek || (q.nilai || 0) - (p.nilai || 0)).map((x, i) => ({ ...x, peringkat: i + 1 }));
}
export const namaPendanaBaku = (nama) => { const a = DANA.find(([re]) => re.test(nama)); return a ? { nama: a[1], bendera: a[2] } : { nama: namaBaku(bersih(nama)).nama, bendera: "" }; };

/* logo: berkas lokal bila ada, bendera untuk pemerintah, selain itu monogram berwarna */
const inisial = (n) => String(n).replace(/\(.*?\)/g, "").replace(/^(PT|CV|The)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const warna = (n) => [...String(n)].reduce((a, c) => (a + c.charCodeAt(0)) % 5, 0);
export function logoHtml({ nama, logo = "", bendera = "", id = null }) {
  const u = logo || logoOrgSatu(id, nama, "");
  const isi = bendera ? `<img src="/img/bendera/${esc(bendera)}.svg" alt="" width="24" height="18" decoding="async">` : u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="${esc(inisial(nama))}">` : esc(inisial(nama));
  return `<span class="rp-lg${!bendera && !u ? " rp-mono rp-m" + warna(nama) : ""}">${isi}</span>`;
}

/* uang ringkas: "6,5 M" (miliar), "230 juta", "1,3 juta"; angka penuh di tooltip. Mengembalikan HTML sel (simbol kiri, angka kanan). */
export function uangRingkas(n, satuan) {
  if (n == null) return "";
  const idr = satuan === "IDR", simbol = idr ? "Rp" : "US$", d = (v) => angka(v, { desimal: v >= 100 || Number.isInteger(v) ? 0 : 1 });
  const baku = idr ? n / 1e12 : n >= 1e9 ? n / 1e9 : n >= 1e6 ? n / 1e6 : n / 1e3;
  const sat = idr ? t("rp.u.triliun") : n >= 1e9 ? t("rp.u.miliar") : n >= 1e6 ? t("rp.u.juta") : t("rp.u.ribu");
  return uangHtml(simbol, `${d(baku)} ${sat}`, `${simbol}${angka(n)}`);
}
