/* /bidang (indeks sembilan bidang) dan /bidang/<slug> (ruang kerja): kumpulan tautan alat. Tanpa data jaringan, tanpa angka.
   Tautan yang rumah utamanya di menu lain diberi pil "dari <menu>"; tautan ke /direktori* diberi pil "Perlu masuk".
   Tanpa kontrol berchrome: semua tautan biasa. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const $ = (id) => document.getElementById(id);
const EBT = "n7.ebt", PUS = "nav.pustaka", TNT = "n7.tentang", PEN = "bid.n.pendanaan";
/* [href, kunci nama, ikon, kunci menu asal (opsional)] */
const A = (h, k, i, dari) => ({ h, k, i, dari });
const BIDANG = {
  organisasi: { ikon: "gedung", alat: [A("/direktori?tampil=pakar", "bid.t.orang", "orang"), A("/direktori?tampil=lembaga", "bid.t.institusi", "gedung"), A("/jejaring", "nav.jejaring", "tautan"), A("/korporat", "kr2.nav", "pabrik")] },
  advokasi: { ikon: "parlemen", alat: [A("/dpr-energi", "dp2.nav", "parlemen"), A("/isu", "isu.nav", "lonceng"), A("/perizinan", "pz2.nav", "lencana"), A("/strategi", "nav.strategi", "analisis"), A("/transisi", "nav.transisi", "tek-panas"), A("/regulasi", "nav.regulasi", "regulasi", PUS), A("/hukum", "nav.hukum", "palu", PUS), A("/program", "nav.program", "bintang", EBT)] },
  sdm: { ikon: "akademi", alat: [A("/akademi", "ad.nav", "akademi"), A("/kerja", "nav.kerja", "koper"), A("/istilah", "is2.nav", "kamus")] },
  pendanaan: { ikon: "kartu", alat: [A("/direktori?tampil=pendanaan", "nav.d_pendanaan", "kartu"), A("/radar", "nav.radar", "berlian"), A("/peluang", "nav.peluang", "kompas"), A("/transaksi", "tr3.nav", "transaksi"), A("/keuangan-hijau", "nav.keuangan_hijau", "tek-bio"), A("/pasar-listrik-hijau", "nav.pasar_hijau", "tek-listrik"), A("/risiko", "rs3.nav", "peringatan"), A("/indeks-keyakinan", "ky.nav", "survei"), A("/model-keuangan", "nav.model_keuangan", "piala"), A("/biaya-listrik", "nav.biaya_listrik", "kalkulator"), A("/banding", "bd2.nav", "banding")] },
  umkm: { ikon: "tag", alat: [A("/desa-energi", "de2.nav", "desa"), A("/akses-energi", "akn.nav", "ponsel"), A("/rantai", "nav.rantai", "rantai", EBT)] },
  esg: { ikon: "karbon", alat: [A("/karbon", "kb2.nav", "karbon"), A("/air-energi", "ae2.nav", "air-energi"), A("/lokasi-hijau", "lh2.nav", "denah"), A("/industri", "in3.nav", "industri", EBT)] },
  komunikasi: { ikon: "presentasi", alat: [A("/insight", "n7.gambaran", "kajian", EBT), A("/rapor", "nav.rapor", "presentasi"), A("/ringkasan", "re2.nav", "ringkasan"), A("/galeri", "nav.foto", "gambar", TNT), A("/berita?q=METI", "n7.meti_berita", "mikrofon", TNT)] },
  internasional: { ikon: "asean", alat: [A("/rantai-global", "rg3.nav", "kapal"), A("/asean", "nav.asean", "asean"), A("/direktori?tampil=pendanaan", "nav.d_pendanaan", "kartu", PEN)] },
  data: { ikon: "tabel", alat: [A("/data", "kdt.nav", "unduh"), A("/dokumen-data", "nav.dokumen_data", "tabel"), A("/direktori?tampil=sistem_data", "nav.d_sistem", "csv"), A("/indeks", "nav.indeks", "grafik"), A("/metode", "nav.sub.metode", "metode")] },
};
const SLUG = Object.keys(BIDANG);

const kartuAlat = (a) => {
  const pil = [a.dari ? `<span class="jm-pil">${esc(t("bid.dari", { menu: t(a.dari) }))}</span>` : "", a.h.startsWith("/direktori") ? `<span class="jm-pil jm-pil-warn">${esc(t("bid.masuk"))}</span>` : ""].join("");
  return `<a class="jm-bd-kt" href="${esc(a.h)}"><span class="jm-bd-nama">${ikon(a.i, 28)}<span>${esc(t(a.k))}</span></span>${pil ? `<span class="jm-bd-pil">${pil}</span>` : ""}</a>`;
};
const kartuBidang = (s) => `<a class="jm-bd-kt" href="/bidang/${s}"><span class="jm-bd-nama">${ikon(BIDANG[s].ikon, 28)}<span>${esc(t("bid.n." + s))}</span></span><p class="jm-bd-ket">${esc(t("bid.d." + s))}</p></a>`;

function gambar() {
  const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
  const B = BIDANG[slug];
  if (slug && !B) { $("judul").textContent = t("bid.tak_dikenal"); $("jawab").textContent = t("bid.lead"); }
  else if (!slug) { $("judul").textContent = t("bid.judul"); $("jawab").textContent = t("bid.lead"); document.title = t("bid.judul") + " | " + t("jm.merek"); }
  else { $("judul").textContent = t("bid.n." + slug); $("jawab").textContent = t("bid.d." + slug); document.title = t("bid.n." + slug) + " | " + t("jm.merek"); }
  $("isi").innerHTML = B
    ? `<a class="jm-bd-balik" href="/bidang">${esc(t("bid.semua"))}</a><div class="jm-bd-kisi">${B.alat.map(kartuAlat).join("")}</div>`
    : `<div class="jm-bd-kisi">${SLUG.map(kartuBidang).join("")}</div>`;
}

await mulaiHalaman();
gambar();
document.addEventListener("jm:bahasa", gambar);
