/* /bidang (indeks sembilan bidang) dan /bidang/<slug> (ruang kerja): kumpulan tautan alat. Tanpa data jaringan, tanpa angka.
   Tautan yang rumah utamanya di menu lain diberi pil "dari <menu>"; tautan ke /direktori* diberi pil "Perlu masuk".
   Tanpa kontrol berchrome: semua tautan biasa. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { lihatSemuaHtml } from "/inti/komponen.js";

const $ = (id) => document.getElementById(id);
const EBT = "n7.ebt", PUS = "nav.pustaka", TNT = "n7.tentang", PEN = "bid.n.pendanaan";
/* [href, kunci nama, ikon, kunci menu asal (opsional)] */
const A = (h, k, i, dari) => ({ h, k, i, dari });
const BIDANG = {
  organisasi: { ikon: "gedung", alat: [A("/direktori?tampil=pakar", "bid.t.orang", "orang"), A("/direktori?tampil=lembaga", "bid.t.institusi", "gedung"), A("/jejaring", "nav.jejaring", "tautan"), A("/korporat", "kr2.nav", "pabrik")] },
  advokasi: { ikon: "parlemen", alat: [A("/dpr-energi", "dp2.nav", "parlemen"), A("/isu", "isu.nav", "lonceng"), A("/perizinan", "pz2.nav", "lencana"), A("/target#strategi", "nav.strategi", "analisis"), A("/target#transisi", "nav.transisi", "tek-panas"), A("/regulasi", "nav.regulasi", "regulasi", PUS), A("/izin-kontrak", "izk.nav", "kunci"), A("/kebijakan", "kbj.nav", "palu"), A("/pemda", "pmd.nav", "gedung"), A("/program", "nav.program", "bintang", EBT)] },
  sdm: { ikon: "akademi", alat: [A("/panduan#akademi", "ad.nav", "akademi"), A("/kerja", "nav.kerja", "koper"), A("/panduan#istilah", "is2.nav", "kamus")] },
  pendanaan: { ikon: "kartu", alat: [A("/direktori?tampil=pendanaan", "nav.d_pendanaan", "kartu"), A("/radar", "nav.radar", "berlian"), A("/investasi", "iv.nav", "medali"), A("/peluang", "nav.peluang", "kompas"), A("/transaksi", "tr3.nav", "transaksi"), A("/keuangan-hijau", "nav.keuangan_hijau", "tek-bio"), A("/pasar-listrik-hijau", "nav.pasar_hijau", "tek-listrik"), A("/risiko", "rs3.nav", "peringatan"), A("/indeks-keyakinan", "ky.nav", "survei"), A("/model-keuangan", "nav.model_keuangan", "piala"), A("/biaya-listrik", "nav.biaya_listrik", "kalkulator"), A("/banding", "bd2.nav", "banding")] },
  umkm: { ikon: "tag", alat: [A("/desa-energi", "de2.nav", "desa"), A("/akses-energi", "akn.nav", "ponsel"), A("/rantai-global?tab=tkdn", "nav.rantai", "rantai", EBT)] },
  esg: { ikon: "karbon", alat: [A("/karbon", "kb2.nav", "karbon"), A("/air-energi", "ae2.nav", "air-energi"), A("/lokasi-hijau", "lh2.nav", "denah"), A("/industri", "in3.nav", "industri", EBT)] },
  komunikasi: { ikon: "presentasi", alat: [A("/insight", "n7.gambaran", "kajian", EBT), A("/target#rapor", "nav.rapor", "presentasi"), A("/insight#ringkasan", "re2.nav", "ringkasan"), A("/galeri", "nav.foto", "gambar", TNT), A("/siaran-pers", "n7.meti_berita", "mikrofon", TNT)] },
  internasional: { ikon: "asean", alat: [A("/rantai-global", "rg3.nav", "kapal"), A("/asean", "nav.asean", "asean"), A("/direktori?tampil=pendanaan", "nav.d_pendanaan", "kartu", PEN)] },
  data: { ikon: "tabel", alat: [A("/data", "kdt.nav", "unduh"), A("/dokumen-data", "nav.dokumen_data", "tabel"), A("/direktori?tampil=sistem_data", "nav.d_sistem", "csv"), A("/indeks", "nav.indeks", "grafik"), A("/metode", "nav.sub.metode", "metode")] },
};
const SLUG = Object.keys(BIDANG);

/* id alat untuk kunci bid.a.<id> */
const SPESIAL = { "/direktori?tampil=pakar": "orang", "/direktori?tampil=lembaga": "institusi", "/direktori?tampil=pendanaan": "pendanaan", "/direktori?tampil=sistem_data": "sistem-data", "/siaran-pers": "meti-berita" };
const idAlat = (h) => SPESIAL[h] || h.replace(/^\//, "");
/* satu-satunya foto (pemilik 8 Nov 2026): Pelaku orang */
const KEG = "/img/kegiatan/audiensi-mpr-2026-10-05.webp", BR = (f) => `/img/beranda/${f}.webp`;
/* foto berlisensi yang sudah ada di repo (kredit: data/kredit-foto.json). Satu foto hanya sekali per halaman (kemunculan pertama); tanpa padanan = gradien. */
const FOTO = { "/direktori?tampil=pakar": KEG, "/jejaring": BR("jaringan"), "/perizinan": BR("panas-bumi-sibayak"), "/target#transisi": BR("transisi-berkeadilan"), "/program": BR("surya-cirata"), "/keuangan-hijau": BR("pembiayaan-hijau"), "/pasar-listrik-hijau": BR("jaringan"), "/biaya-listrik": BR("efisiensi"), "/desa-energi": BR("surya-cirata"), "/akses-energi": BR("jaringan"), "/rantai-global?tab=tkdn": BR("penyimpanan-baterai"), "/rantai-global": BR("penyimpanan-baterai"), "/karbon": BR("karbon"), "/air-energi": BR("hidro-saguling"), "/lokasi-hijau": BR("bayu-sidrap"), "/industri": BR("transisi-berkeadilan"), "/galeri": KEG };
const FOTO_BIDANG = { organisasi: KEG, advokasi: BR("transisi-berkeadilan"), pendanaan: BR("pembiayaan-hijau"), umkm: BR("surya-cirata"), esg: BR("karbon") };
let dipakai = new Set();
const ambilFoto = (f) => { if (!f || dipakai.has(f)) return ""; dipakai.add(f); return f; };
/* lencana angka dari data yang sudah ada: href -> [berkas, kunci i18n]; diisi sesudah render, galat = tanpa lencana */
const ANGKA = { "/direktori?tampil=lembaga": ["organisasi", "bid.b.institusi"], "/regulasi": ["regulasi", "bid.b.regulasi"], "/program": ["program", "bid.b.program"] };
const simpan = new Map();
const jumlah = (n) => { if (!simpan.has(n)) simpan.set(n, fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((d) => d.jumlah ?? d.baris?.length ?? null).catch(() => { simpan.delete(n); return null; })); return simpan.get(n); };
const KUNCI = '<svg class="jm-ik" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

/* kartu bersama: visual atas (foto atau gradien + ikon), lencana, judul, penjelas, garis, "Buka" + panah. Satu <a>. */
const kartu = ({ href, ikonNama, foto, lencana, judul, ket, pil, h }) => `<a class="jm-bd-kt" href="${esc(href)}"${h ? ` data-h="${esc(h)}"` : ""}>
  <span class="jm-bd-vis${foto ? "" : " jm-batik"}">${foto ? `<img src="${esc(foto)}" data-foto="${esc(foto)}" alt="" width="640" height="360" loading="lazy" decoding="async">` : ikon(ikonNama, 40)}${lencana || ""}</span>
  <span class="jm-bd-isi"><span class="jm-bd-j">${esc(judul)}</span>${pil ? `<span class="jm-bd-pil">${pil}</span>` : ""}<span class="jm-bd-ket">${esc(ket)}</span></span>
  <span class="jm-bd-buka"><span>${esc(t("bid.buka_kt"))}</span>${ikon("panah-kanan", 18)}</span></a>`;
const lencanaHtml = (isi) => `<span class="jm-bd-lc">${isi}</span>`;
const kartuAlat = (a) => {
  const masuk = a.h.startsWith("/direktori"), angka = ANGKA[a.h];
  const pil = [a.dari ? `<span class="jm-pil">${esc(t("bid.dari", { menu: t(a.dari) }))}</span>` : "", masuk && angka ? `<span class="jm-pil jm-pil-warn">${esc(t("bid.masuk"))}</span>` : ""].join("");
  const lencana = masuk && !angka ? lencanaHtml(`${KUNCI}${esc(t("bid.masuk"))}`) : angka ? lencanaHtml("") .replace('class="jm-bd-lc"', 'class="jm-bd-lc" hidden') : "";
  return kartu({ href: a.h, ikonNama: a.i, foto: ambilFoto(FOTO[a.h]), lencana, judul: t(a.k), ket: t("bid.a." + idAlat(a.h)), pil, h: angka ? a.h : "" });
};
const kartuBidang = (s) => kartu({ href: `/bidang/${s}`, ikonNama: BIDANG[s].ikon, foto: ambilFoto(FOTO_BIDANG[s]), lencana: lencanaHtml(esc(t("bid.b.alat", { n: angka(BIDANG[s].alat.length) }))), judul: t("bid.n." + s), ket: t("bid.d." + s) });

/* isi lencana angka sesudah data tiba */
function isiLencana() {
  document.querySelectorAll("#isi .jm-bd-kt[data-h]").forEach(async (el) => {
    const [berkas, kunci] = ANGKA[el.dataset.h], n = await jumlah(berkas), lc = el.querySelector(".jm-bd-lc");
    if (n == null || !lc || !el.isConnected) return;
    lc.textContent = t(kunci, { n: angka(n) }); lc.hidden = false;
  });
}

function gambar() {
  dipakai = new Set();
  const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
  const B = BIDANG[slug];
  if (slug && !B) { $("judul").textContent = t("bid.tak_dikenal"); $("jawab").textContent = t("bid.lead"); }
  else if (!slug) { $("judul").textContent = t("bid.judul"); $("jawab").textContent = t("bid.lead"); document.title = t("bid.judul") + " | " + t("jm.merek"); }
  else { $("judul").textContent = t("bid.n." + slug); $("jawab").textContent = t("bid.d." + slug); document.title = t("bid.n." + slug) + " | " + t("jm.merek"); }
  $("isi").innerHTML = B
    ? `<a class="jm-bd-balik" href="/bidang">${esc(t("bid.semua"))}</a><div class="jm-bd-kisi">${B.alat.map(kartuAlat).join("")}</div>`
    : `<div class="jm-bd-kisi">${SLUG.map(kartuBidang).join("")}</div>`;
  isiLencana(); isiKredit(); isiPengurus(B ? SLUG.indexOf(slug) + 1 : 0);
}

/* pemilik 9 Nov 2026: tiap bidang menampilkan ketua dan anggotanya (SK METI 0008/2026, pengurus-meti.json; urutan bidang = Bidang Kerja 1-9) */
let PENGURUS = null;
const inisialNama = (n) => String(n).split(/\s+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const avatarP = (o, u) => (o.foto ? `<img src="${esc(o.foto)}" alt="" width="${u}" height="${u}" loading="lazy" decoding="async">` : `<span aria-hidden="true">${esc(inisialNama(o.nama))}</span>`);
async function isiPengurus(no) {
  const el = $("pengurusBid");
  if (!no) { el.hidden = true; return; }
  try { PENGURUS ||= await (await fetch("/data/pengurus-meti.json")).json(); } catch { el.hidden = true; return; }
  const bid = PENGURUS.bidang.find((b) => b.anggota.some((o) => new RegExp(`(Bidang Kerja|BK) ${no}\\b`).test(o.jabatan)));
  if (!bid || !el.isConnected) { el.hidden = true; return; }
  const [ketua, ...lain] = bid.anggota;
  el.innerHTML = `<div class="bd-png-k"><span class="bd-png-ey">${ikon("orang", 16)}${esc(t("bid.png.ey"))}</span><small>${esc(t("bid.png.sk", { periode: PENGURUS.periode }))}</small></div>
  <div class="bd-png-ketua"><span class="bd-png-av bd-png-av-b">${avatarP(ketua, 72)}</span><span class="bd-png-n"><small>${esc(t("bid.png.ketua"))}</small><b>${esc(ketua.nama)}</b><span>${esc(ketua.jabatan)}</span></span></div>
  ${lain.length ? `<ul class="bd-png-ag">${lain.map((o) => `<li><span class="bd-png-av">${avatarP(o, 44)}</span><span class="bd-png-n"><b>${esc(o.nama)}</b><span>${esc(o.jabatan)}</span></span></li>`).join("")}</ul>` : ""}
  ${lihatSemuaHtml("/tentang", t("bid.png.semua"))}`;
  el.hidden = false;
}

/* kredit foto: baris kecil di bawah kisi, dari data/kredit-foto.json (dimuat malas; galat = baris tidak muncul) */
let KREDIT = null;
async function isiKredit() {
  const wadah = $("kredit"), pakai = [...new Set([...document.querySelectorAll("#isi img[data-foto]")].map((i) => i.dataset.foto))];
  if (!pakai.length) { wadah.hidden = true; return; }
  try { KREDIT ||= await (await fetch("/data/kredit-foto.json")).json(); } catch { wadah.hidden = true; return; }
  const baris = pakai.map((f) => KREDIT.baris.find((b) => b.berkas === f.split("/").pop())).filter(Boolean);
  if (!baris.length) { wadah.hidden = true; return; }
  const nama = (b) => (b.url && /^https:\/\//.test(b.url) ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(b.foto)}</a>` : esc(b.foto));
  wadah.innerHTML = `<strong>${esc(t("bid.kredit"))}</strong> ${baris.map((b) => `${nama(b)}, ${esc(b.pembuat)}, ${esc(b.lisensi)}`).join("; ")}.`;
  wadah.hidden = false;
}

await mulaiHalaman();
gambar();
document.addEventListener("jm:bahasa", gambar);
