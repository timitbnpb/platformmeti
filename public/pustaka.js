/* /pustaka: kisi kartu bersampul + modal detail (Overview, Insight, Berkas) + unduh bertanggung jawab.
   Data: /data/pustaka.json + /data/pustaka_ulasan.json (statis) digabung dengan GET /api/pustaka (angka unduhan agregat, daftar berkas, data akun).
   INP: nilai filter dan tombol berubah seketika; render kisi menyusul lewat nanti(), dan kartu dirender per 18 (muat lagi). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal, tanggalSah } from "/i18n.js";
import { esc, api, nanti, debounce, kosongHtml, galatHtml, ikon, pesanHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml, terkaitHtml } from "/inti/komponen.js";
import { kabar } from "/inti/aksi_ex.js";
import { logoUrl, PROV } from "/penerbit.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { bagikanHtml } from "/inti/komponen.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { tautOrg } from "/inti/tautan.js";

const PER = 10; // 2 baris x 5 kartu
const TUJUAN = ["riset", "kebijakan", "bisnis", "media", "lainnya"];
const IKON_JENIS = { kajian: "kajian", regulasi: "palu", laporan: "grafik", panduan: "kompas", "paparan-konferensi": "presentasi" };
const S = { q: "", jenis: "", topik: "", tahun: "", penerbit: "", urut: "pilihan", id: "", hal: 1 };
const KUNCI = ["q", "jenis", "topik", "tahun", "penerbit", "urut", "id", "hal"];
let D = null, SAYA = null, DAFTAR = [];

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tahunDari = (d) => (String(d.tanggal || "").match(/^\d{4}/) || [""])[0];
const labelJenis = (j) => t("pu.jenis." + j);
const labelTopik = (k) => t("pu.topik." + k);

/* ---- penerbit: nama ringkas, logo, kelompok ---- */
const kodeProv = (n) => { const m = /^Pemerintah Provinsi (.+)$/i.exec(n); return m && PROV[m[1].toLowerCase()] ? PROV[m[1].toLowerCase()] : null; };
const logoPen = (n) => logoOrgSatu(null, n) || logoUrl(n);
const ikonPen = (n) => (kodeProv(n) ? "prov:" + kodeProv(n) : "img:" + logoPen(n));
function ringkasPen(n) {
  const s = String(n || ""), kur = /\(([A-Za-z][A-Za-z0-9 &.-]{1,14})\)\s*$/.exec(s);
  if (kur && !/persero/i.test(kur[1])) return kur[1];
  const r = [[/^Pemerintah Provinsi Daerah Khusus Ibukota Jakarta$/i, "Pemprov DKI Jakarta"], [/^Pemerintah Provinsi Daerah Istimewa Yogyakarta$/i, "Pemprov DIY"], [/^Pemerintah Provinsi (.+)$/i, "Pemprov $1"],
    [/^Pemerintah Kabupaten (.+)$/i, "Pemkab $1"], [/^Pemerintah Kota (.+)$/i, "Pemkot $1"], [/^Direktorat Jenderal EBTKE/i, "Ditjen EBTKE"], [/^Kementerian ESDM dan PT PLN/i, "ESDM, PLN"], [/^Kementerian Energi dan Sumber Daya Mineral$/i, "Kementerian ESDM"], [/^PT PLN \(Persero\)/i, "PLN"], [/^CELIOS/i, "CELIOS"], [/^Institut Teknologi PLN/i, "Institut Teknologi PLN"], [/^Puslitbang.*Diponegoro/i, "Puslitbang PLN, Undip"],
    [/^Kementerian Perindustrian$/i, "Kemenperin"], [/^Kementerian Perhubungan$/i, "Kemenhub"], [/^Kementerian Keuangan$/i, "Kemenkeu"], [/^Kementerian Pekerjaan Umum.*$/i, "Kementerian PU"], [/^Kementerian PPN\/Bappenas.*$|^.*Perencanaan Pembangunan Nasional.*$/i, "Bappenas"],
    [/^Badan Pengawas Tenaga Nuklir$/i, "Bapeten"], [/^Badan Meteorologi.*$/i, "BMKG"], [/^Badan Informasi Geospasial$/i, "BIG"], [/^Sekretariat Jenderal DPD RI$/i, "Setjen DPD RI"], [/^PT /i, ""]].find(([re]) => re.test(s));
  return r ? s.replace(r[0], r[1]) : s;
}
function grupPen(n) {
  const s = String(n || "");
  if (/^Pemerintah (Provinsi|Kabupaten|Kota)\b/i.test(s)) return "daerah";
  if (/^(Kementerian|Badan |Direktorat|Pemerintah Pusat)/i.test(s)) return "pusat";
  if (/universitas|institut|centre|center|research|riset|foundation|yayasan|\(METI\)|IESR|CELIOS|publishing|puslitbang/i.test(s) && !/^PT\b/.test(s)) return "riset";
  if (/\bPLN\b|pertamina|persero|\bBUMN\b/i.test(s)) return "bumn";
  if (/^(Pemerintah Pusat|Presiden|Kementerian|Badan |Sekretariat|Dewan|Otoritas|Naskah RUU)|DPR|DPD|BRIN/i.test(s)) return "pusat";
  return "lain";
}
const GRUP_URUT = ["pusat", "daerah", "bumn", "riset", "lain"];
const ikonTopik = (k) => (IKON_TEK[k] ? "tek:" + k : "topik");
const pilTopik = (k) => `<span class="jm-pil pu-topik">${IKON_TEK[k] || ikon("topik", 14)}<span>${esc(labelTopik(k))}</span></span>`;
const pilJenis = (d, k = "") => `<span class="jm-pil pu-jenis pu-j-${esc(d.jenis)} ${k}">${ikon(IKON_JENIS[d.jenis] || "buku", 14)}<span>${esc(labelJenis(d.jenis))}</span></span>`;
const logoImg = (n, ukuran, kelas = "") => `<img class="jm-pen-lg pu-lb ${kelas}" src="${esc(logoPen(n))}" width="${ukuran}" height="${ukuran}" alt="" loading="lazy" decoding="async">`;

/* tanggal terbit: lengkap bila ada hari, bulan-tahun bila ada bulan, selain itu tahun */
function tglTerbit(d) {
  const s = String(d.tanggal || "");
  if (tanggalSah(s)) return tanggal(s);
  if (/^\d{4}-\d{2}$/.test(s)) return tanggal(s + "-01").split(" ").slice(1).join(" ");
  return tahunDari(d) || "-";
}
const ukuranTeks = (b) => (!b ? "" : b < 1048576 ? t("pu.kb", { n: angka(Math.max(1, Math.round(b / 1024))) }) : t("pu.mb", { n: angka(b / 1048576, { desimal: 1 }) }));

/* ------------------------------------------------ data ------------------------------------------------ */
async function statis(jalur) {
  const r = await fetch(jalur, { credentials: "same-origin" });
  if (!r.ok) throw new Error(jalur);
  return r.json();
}
async function muat() {
  const [dasar, ulasan, peta] = await Promise.all([statis("/data/pustaka.json"), statis("/data/pustaka_ulasan.json").catch(() => ({ dokumen: [], ulasan: {} })), api("/api/pustaka")]);
  SAYA = peta.saya;
  const api_ = new Map(peta.dokumen.map((d) => [d.id, d]));
  const docs = [...dasar.baris, ...(ulasan.dokumen || [])].filter((d) => d.lapis === "publik" && !d.rahasia && api_.has(d.id)).map((d) => {
    const a = api_.get(d.id), u = ulasan.ulasan?.[d.id] || {};
    const d2 = { ...d, u, n: a.jumlah_unduh, bisa: a.bisa_unduh, berkas: a.berkas, tahun: tahunDari(d), diperbarui: ulasan.ulasan?.[d.id] ? ulasan.dibangun_pada : dasar.dibangun_pada };
    d2.cari = norm([d.judul, d.penerbit, d.ringkasan, d.acara, ...(d.kepakaran || []).map(labelTopik), labelJenis(d.jenis)].join(" "));
    return d2;
  });
  D = { docs, byId: new Map(docs.map((d) => [d.id, d])) };
}

/* ---------------------------------------------- url + filter --------------------------------------------- */
function bacaUrl() {
  const p = new URLSearchParams(location.search);
  for (const k of KUNCI) if (p.has(k)) S[k] = p.get(k);
  if (!["pilihan", "terbaru", "terunduh"].includes(S.urut)) S.urut = "pilihan";
  S.hal = Math.max(1, parseInt(S.hal, 10) || 1);
}
function tulisUrl() {
  const u = new URL(location.href);
  for (const k of KUNCI) { const v = S[k]; !v || (k === "urut" && v === "pilihan") || (k === "hal" && Number(v) <= 1) ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  history.replaceState(null, "", u);
}
const adaFilter = () => !!(S.q || S.jenis || S.topik || S.tahun || S.penerbit);
const urutan = {
  pilihan: (a, b) => (!!b.u.sampul - !!a.u.sampul) || (!!b.u.temuan - !!a.u.temuan) || String(b.tanggal || "").localeCompare(String(a.tanggal || "")),
  terbaru: (a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")),
  terunduh: (a, b) => b.n - a.n || String(b.tanggal || "").localeCompare(String(a.tanggal || "")),
};
function saring() {
  const q = norm(S.q.trim());
  return D.docs.filter((d) => (!S.jenis || d.jenis === S.jenis) && (!S.topik || (d.kepakaran || []).includes(S.topik)) && (!S.tahun || d.tahun === S.tahun)
    && (!S.penerbit || d.penerbit === S.penerbit) && (!q || d.cari.includes(q))).sort(urutan[S.urut]);
}
function gambarSaring() {
  const hitung = (f) => { const m = new Map(); for (const d of D.docs) for (const v of f(d)) if (v) m.set(v, (m.get(v) || 0) + 1); return m; };
  const opsi = (m, label, urut) => [...m].map(([v, n]) => [v, label(v), "", angka(n)]).sort(urut);
  const jenis = opsi(hitung((d) => [d.jenis]), labelJenis, (a, b) => a[1].localeCompare(b[1])).map((o) => [o[0], o[1], IKON_JENIS[o[0]] || "buku", o[3]]);
  const topik = opsi(hitung((d) => d.kepakaran || []), labelTopik, (a, b) => a[1].localeCompare(b[1])).map((o) => [o[0], o[1], ikonTopik(o[0]), o[3]]);
  const tahun = [...hitung((d) => [d.tahun]).keys()].sort((a, b) => b - a).map((v) => [v, v]);
  const penerbit = [...hitung((d) => [d.penerbit])].map(([v, n]) => [v, ringkasPen(v), ikonPen(v), angka(n), grupPen(v), v, n])
    .sort((a, b) => GRUP_URUT.indexOf(a[4]) - GRUP_URUT.indexOf(b[4]) || b[6] - a[6] || a[1].localeCompare(b[1])).map((o) => [o[0], o[1], o[2], o[3], t("pu.grup." + o[4]), o[5]]);
  const p = (id, ik, semua, daftar, nilai) => pilihHtml({ id, ikon: ik, label: t(semua), opsi: [["", t(semua)], ...daftar], nilai });
  const urut = ["pilihan", "terbaru", "terunduh"].map((v) => [v, t("pu.urut." + v)]);
  document.getElementById("saring").innerHTML = cariHtml({ id: "q", label: t("pu.cari") }) + p("jenis", "jenis", "pu.semua.jenis", jenis, S.jenis) + p("topik", "topik", "pu.semua.topik", topik, S.topik)
    + p("tahun", "tahun", "pu.semua.tahun", tahun, S.tahun) + p("penerbit", "direktori", "pu.semua.penerbit", penerbit, S.penerbit) + pilihHtml({ id: "urut", ikon: "analisis", label: t("pu.urut"), opsi: urut, nilai: S.urut })
    + hapusHtml({ id: "hapus", label: t("jm.kosong.reset") }) + hitungHtml({ id: "hitung", teks: "" });
  document.getElementById("q").value = S.q;
  document.getElementById("hapus").dataset.aksi = "reset";
  document.getElementById("hapus").hidden = !adaFilter();
}

/* --------------------------------------------------- kartu -------------------------------------------------- */
function sampulHtml(d, kelas = "", ceper = false) {
  const jenisIk = IKON_JENIS[d.jenis] || "buku";
  return d.u.sampul
    ? `<span class="pu-sampul ${kelas}"><img${d.u.sampul_lanskap ? ' class="pu-lanskap"' : ""} src="${esc(d.u.sampul)}" width="600" height="849" alt="" loading="${ceper ? "eager" : "lazy"}" decoding="async"></span>`
    : `<span class="pu-sampul pu-sampul-ik ${kelas}" data-jenis="${esc(d.jenis)}"><span class="pu-sampul-lingkar">${ikon(jenisIk, 34)}</span><b>${esc(labelJenis(d.jenis))}</b>${d.tahun ? `<small>${esc(d.tahun)}</small>` : ""}</span>`;
}
const atr = esc; // atribut title (nama lengkap), bukan teks tampak
const penBaris = (d) => (d.penerbit ? `<p class="pu-pen-baris" title="${atr(d.penerbit)}">${logoImg(d.penerbit, 18)}<span>${tautOrg(d.penerbit, ringkasPen(d.penerbit))}</span></p>` : "");
function kartuHtml(d) {
  const b = esc(t("pu.buka", { judul: d.judul })), top = (d.kepakaran || [])[0];
  const dok = d.halaman ? `${ikon("buku", 14)}<span>${esc(t("pu.hlm", { n: angka(d.halaman) }))}</span>` : "";
  return `<article class="pu-kartu" data-id="${esc(d.id)}">
    <button type="button" class="pu-sampul-tbl" data-buka="${esc(d.id)}" aria-label="${b}">${sampulHtml(d)}
      ${d.penerbit ? `<span class="pu-lencana" title="${atr(d.penerbit)}">${logoImg(d.penerbit, 32)}</span>` : ""}${pilJenis(d, "pu-pojok")}</button>
    <div class="pu-badan"><h3><button type="button" data-buka="${esc(d.id)}">${esc(d.judul)}</button></h3>
      ${penBaris(d)}
      <p class="pu-meta"><span class="pu-m" title="${esc(t("pu.i.terbit"))}">${ikon("tahun", 14)}<span>${esc(d.tahun || "-")}</span></span>${top ? pilTopik(top) : ""}<span class="pu-m pu-n" title="${esc(t("pu.diunduh", { n: angka(d.n) }))}">${ikon("unduh", 14)}<span>${esc(angka(d.n))}</span></span></p>
      <p class="pu-ring">${esc(d.ringkasan || "")}</p></div>
    <footer class="pu-kaki"><button type="button" class="pu-lanjut" data-buka="${esc(d.id)}" aria-label="${b}">${esc(t("pu.selengkapnya"))}${ikon("panah-kanan", 16)}</button><span class="pu-m">${dok}</span></footer></article>`;
}
function gambarKisi() {
  const baris = DAFTAR = saring();
  const jumlah = Math.max(1, Math.ceil(baris.length / PER));
  if (S.hal > jumlah) S.hal = jumlah;
  document.getElementById("hitung").textContent = t("pu.hitung", { n: angka(baris.length), total: angka(D.docs.length) });
  document.getElementById("hapus").hidden = !adaFilter();
  const isi = document.getElementById("isi"), hal = document.getElementById("lagi");
  if (!baris.length) { isi.innerHTML = kosongHtml("pu.kosong", { data: "reset", kunci: "jm.kosong.reset" }); hal.innerHTML = ""; return; }
  const potong = baris.slice((S.hal - 1) * PER, S.hal * PER);
  isi.innerHTML = `<div class="pu-kisi">${potong.map(kartuHtml).join("")}</div>`;
  hal.innerHTML = paginasiHtml({ hal: S.hal, total: baris.length, per: PER });
}
function ubin() {
  const penerbit = new Set(D.docs.map((d) => d.penerbit)).size, unduh = D.docs.reduce((a, d) => a + d.n, 0);
  khUbin("khUbin", [{ ikon: "buku", nilai: angka(D.docs.length), label: t("pu.ubin.dok") }, { ikon: "direktori", nilai: angka(penerbit), label: t("pu.ubin.penerbit") }, { ikon: "unduh", nilai: angka(unduh), label: t("pu.ubin.unduh") }]);
}

/* ------------------------------------------------- modal detail ------------------------------------------------- */
const info = (ik, kunci, isi, lebar = false) => {
  const kosong = isi == null || isi === "" || isi === "0";
  return `<li${lebar ? ' class="pu-lebar"' : ""}>${ikon(ik, 18)}<span><small>${esc(t(kunci))}</small>${kosong ? `<b class="pu-kosong" title="${esc(t("pu.i.kosong"))}">-</b>` : `<b>${isi}</b>`}</span></li>`;
};
const sh = (ik, kunci) => `<h3 class="pu-sh"><span class="pu-sh-ik">${ikon(ik, 18)}</span>${esc(t(kunci))}</h3>`;
function terkait(d) {
  const skor = (x) => (x.kepakaran || []).filter((k) => (d.kepakaran || []).includes(k)).length * 2 + (x.penerbit === d.penerbit ? 2 : 0) + (x.jenis === d.jenis ? 1 : 0) + (x.u.sampul ? 1 : 0);
  return D.docs.filter((x) => x.id !== d.id).map((x) => [skor(x), x]).filter(([s]) => s >= 3).sort((a, b) => b[0] - a[0] || String(b[1].tanggal).localeCompare(String(a[1].tanggal))).slice(0, 3).map(([, x]) => x);
}
/* angka dalam teks ditebalkan beraksen; ikon kategori bila mudah ditebak */
const ANGKA = /(\d+(?:[.,]\d+)*(?:\s?(?:%|persen|GWh|MWh|TWh|kWh|GW|MW|TW|kW|MtCO2e|Mt|Gt|ton|juta|miliar|triliun|ribu|USD|Rp))?)/g;
const angkaTebal = (txt) => String(txt).split(ANGKA).map((x, i) => (i % 2 ? `<b class="pu-an">${esc(x)}</b>` : esc(x))).join("");
const KATEGORI = [[/emisi|karbon|co2|gas rumah kaca/i, "peringatan"], [/investasi|pembiayaan|biaya|usd|rp\b|triliun|miliar/i, "tabel"], [/konsumsi|permintaan|kebutuhan|bauran|porsi/i, "analisis"], [/potensi|kapasitas|gw\b|mw\b|tw\b|target/i, "tek-listrik"]];
const ikonPoin = (txt) => (KATEGORI.find(([re]) => re.test(txt)) || [])[1] || "";
const pdfUrl = (d) => (/^https?:\/\/\S+\.pdf(\?\S*)?$/i.test(d.url || "") ? d.url : "");
function hlmPil(d, hlm) {
  const n = /\d+/.exec(hlm || ""); if (!n) return "";
  const isi = `${ikon("pdf", 14)}<span>${esc(t("pu.hlm.pendek", { n: n[0] }))}</span>`, u = pdfUrl(d);
  return u ? `<a class="pu-hlm" href="${esc(u)}#page=${n[0]}" target="_blank" rel="noopener noreferrer" title="${esc(t("pu.hlm.buka", { n: n[0] }))}">${isi}</a>` : `<span class="pu-hlm">${isi}</span>`;
}
const ptsHtml = (daftar, d) => `<ol class="pu-poin${daftar.length >= 4 ? " pu-dua" : ""}">${daftar.map((p) => { const ik = ikonPoin(p.teks); return `<li><span class="pu-no" aria-hidden="true"></span><span class="pu-poin-t">${ik ? `<span class="pu-poin-ik">${ikon(ik, 16)}</span>` : ""}<span>${angkaTebal(p.teks)}</span></span>${hlmPil(d, p.hlm)}</li>`; }).join("")}</ol>`;
function overviewHtml(d) {
  const angkaH = (d.u.angka || []).length ? `<div class="pu-angka">${d.u.angka.map((a) => `<div class="pu-ang"><span class="pu-ang-ik">${ikon(ikonPoin(a.label + " " + (a.satuan || "")) || "analisis", 18)}</span><div><p><b>${esc(a.nilai)}</b>${a.satuan ? `<span>${esc(a.satuan)}</span>` : ""}</p><small>${esc(a.label)}</small>${hlmPil(d, a.hlm)}</div></div>`).join("")}</div>` : "";
  return `<section>${sh("info", "pu.ringkasan")}<p>${esc(d.ringkasan || "")}</p></section>
    ${angkaH ? `<section>${sh("analisis", "pu.angka")}${angkaH}</section>` : ""}
    ${(d.poin_kunci || []).length ? `<section>${sh("centang", "pu.poin")}${ptsHtml(d.poin_kunci, d)}</section>` : ""}`;
}
function insightHtml(d) {
  const tt = d.u.temuan || [], tau = d.u.tautan || [];
  if (!tt.length && !tau.length) return `<div class="jm-kosong">${ikon("info", 28)}<p>${esc(t("pu.insight.kosong"))}</p></div>`;
  const kel = (j) => tau.filter((x) => x.jenis === j);
  const grup = ["regulasi", "proyek", "organisasi", "provinsi", "teknologi"].filter((j) => kel(j).length).map((j) => `<div class="pu-tau"><h4>${esc(t("pu.tautan." + j))}</h4><div class="pu-chips">${kel(j).map((x) => `<a class="pu-chip" href="${esc(x.href)}">${esc(x.label)}</a>`).join("")}</div></div>`).join("");
  return `${tt.length ? `<section>${sh("insight", "pu.temuan")}${ptsHtml(tt, d)}</section>` : ""}${grup ? `<section>${sh("tautan", "pu.tautan")}<p class="pu-bantu">${esc(t("pu.tautan.bantu"))}</p>${grup}</section>` : ""}`;
}
const namaBerkas = (d, b) => b.nama || (b.id === "utama" ? t("pu.berkas.utama") : b.id);
function berkasHtml(d) {
  const ada = d.bisa;
  const baris = d.berkas.map((b) => `<li><span class="pu-b-ik">${ikon("pdf", 22)}</span><span class="pu-b-nama"><b>${esc(namaBerkas(d, b))}</b><small>${esc([String(b.format).toUpperCase(), ukuranTeks(b.ukuran), b.halaman ? t("pu.hlm", { n: angka(b.halaman) }) : ""].filter(Boolean).join(", "))}</small></span>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-unduh="${esc(d.id)}" data-berkas="${esc(b.id)}"${ada ? "" : " disabled"}>${ikon("unduh", 16)}${esc(t("pu.unduh"))}</button></li>`).join("");
  return `<section>${sh("pdf", "pu.berkas")}${ada ? "" : `<p class="pu-bantu">${esc(t("pu.berkas.belum"))}</p>`}<ul class="pu-berkas">${baris}</ul></section>`;
}
function detailHtml(d) {
  const i = DAFTAR.findIndex((x) => x.id === d.id), sebelum = DAFTAR[i - 1], sesudah = DAFTAR[i + 1];
  const rel = terkait(d), url = `${location.origin}/pustaka?id=${encodeURIComponent(d.id)}`;
  const tabs = [["overview", "pu.tab.overview"], ["insight", "pu.tab.insight"], ["berkas", "pu.tab.berkas"]];
  const ukuranTotal = d.berkas.reduce((a, b) => a + (b.ukuran || 0), 0);
  const nav = (x, arah) => (x ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-buka="${esc(x.id)}" aria-label="${esc(t("pu." + arah, { judul: x.judul }))}">${arah === "sebelumnya" ? ikon("panah-kiri", 16) : ""}<span>${esc(t("pu." + arah))}</span>${arah === "berikutnya" ? ikon("panah-kanan", 16) : ""}</button>` : "<span></span>");
  return `<div class="pu-d-atas"><button type="button" class="iconbtn pu-tutup" data-aksi="tutup" aria-label="${esc(t("jm.tutup"))}" title="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button></div>
  <div class="pu-d">
    <aside class="pu-d-kiri">${sampulHtml(d, "pu-sampul-besar", true)}
      <ul class="pu-info">
        ${info("direktori", "pu.i.penerbit", d.penerbit ? `<span class="pu-pen">${logoImg(d.penerbit, 24)}<span>${tautOrg(d.penerbit)}</span></span>` : "", true)}
        ${info(IKON_JENIS[d.jenis] || "jenis", "pu.i.jenis", esc(labelJenis(d.jenis)))}
        ${info("tahun", "pu.i.terbit", esc(tglTerbit(d) === "-" ? "" : tglTerbit(d)))}
        ${info("topik", "pu.i.topik", (d.kepakaran || []).length ? `<span class="pu-pils">${d.kepakaran.map(pilTopik).join("")}</span>` : "", true)}
        ${info("buku", "pu.i.halaman", d.halaman ? esc(angka(d.halaman)) : "")}
        ${info("pdf", "pu.i.ukuran", esc(ukuranTeks(ukuranTotal || d.ukuran)))}
        ${info("unduh", "pu.i.unduhan", d.n ? esc(angka(d.n)) : "")}
        ${info("daftar2", "pu.i.berkas", d.berkas.length ? esc(angka(d.berkas.length)) : "")}
        ${info("bahasa", "pu.i.bahasa", esc(t("pu.bahasa." + (d.bahasa === "en" ? "en" : "id"))))}
        ${info("jejak", "pu.i.diperbarui", tanggalSah(d.diperbarui) ? esc(tanggal(d.diperbarui)) : "")}
      </ul></aside>
    <div class="pu-d-kanan">
      <header class="pu-d-kepala"><p class="pu-d-ey">${pilJenis(d)}${d.penerbit ? `<span class="pu-pen-baris">${logoImg(d.penerbit, 20)}<span>${tautOrg(d.penerbit, ringkasPen(d.penerbit))}</span></span>` : ""}${d.acara ? `<span>${esc(d.acara)}</span>` : ""}</p>
        <h2 id="pu-dj">${esc(d.judul)}</h2>
        <p class="pu-d-meta">${[d.penerbit ? `${ikon("direktori", 14)}<span>${tautOrg(d.penerbit)}</span>` : "", `${ikon("tahun", 14)}<span>${esc(tglTerbit(d))}</span>`, d.halaman ? `${ikon("buku", 14)}<span>${esc(t("pu.hlm", { n: angka(d.halaman) }))}</span>` : "", ukuranTeks(ukuranTotal || d.ukuran) ? `${ikon("pdf", 14)}<span>${esc(ukuranTeks(ukuranTotal || d.ukuran))}</span>` : ""].filter(Boolean).map((x) => `<span class="pu-m">${x}</span>`).join("")}</p>
        <div class="pu-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-unduh="${esc(d.id)}" data-berkas="utama"${d.bisa ? "" : " disabled"}>${ikon("unduh", 18)}${esc(t("pu.unduh"))}</button>
          ${bagikanHtml({ url, judul: d.judul, kelas: "pu-bagi bulat", lengkap: true })}</div></header>
      <div class="jm-tab pu-tab" role="tablist" aria-label="${esc(t("pu.tab.label"))}">${tabs.map(([k, kunci], n) => `<button type="button" role="tab" id="pu-t-${k}" data-tab="${k}" aria-selected="${n === 0}" aria-controls="pu-p-${k}" tabindex="${n === 0 ? 0 : -1}">${esc(t(kunci))}</button>`).join("")}</div>
      <div id="pu-p-overview" role="tabpanel" aria-labelledby="pu-t-overview" class="pu-panel">${overviewHtml(d)}</div>
      <div id="pu-p-insight" role="tabpanel" aria-labelledby="pu-t-insight" class="pu-panel" hidden>${insightHtml(d)}</div>
      <div id="pu-p-berkas" role="tabpanel" aria-labelledby="pu-t-berkas" class="pu-panel" hidden>${berkasHtml(d)}</div>
    </div>
  </div>
  ${rel.length ? `<section class="pu-rel"><h3>${esc(t("pu.terkait"))}</h3><div class="pu-rel-kisi">${rel.map((x) => `<button type="button" class="pu-rel-k" data-buka="${esc(x.id)}">${sampulHtml(x, "pu-sampul-kecil")}<span><b>${esc(x.judul)}</b><small>${esc(tglTerbit(x))}, ${esc(labelJenis(x.jenis))}</small></span></button>`).join("")}</div></section>` : ""}
  <footer class="pu-d-nav">${nav(sebelum, "sebelumnya")}${nav(sesudah, "berikutnya")}</footer>`;
}
function bukaDetail(id) {
  const d = D.byId.get(id), dlg = document.getElementById("detail");
  if (!d) return;
  S.id = id; tulisUrl();
  dlg.innerHTML = detailHtml(d);
  dlg.setAttribute("aria-labelledby", "pu-dj");
  terkaitHtml("dokumen", id).then((h) => { const a = dlg.querySelector(".pu-d-kanan") || dlg; if (h && dlg.open && S.id === id && !dlg.querySelector("#terkait")) a.insertAdjacentHTML("beforeend", h); });
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0; dlg.querySelector(".pu-d-kanan")?.scrollTo?.(0, 0);
}
function pilihTab(dlg, k) {
  for (const b of dlg.querySelectorAll("[data-tab]")) { const aktif = b.dataset.tab === k; b.setAttribute("aria-selected", String(aktif)); b.tabIndex = aktif ? 0 : -1; }
  for (const p of dlg.querySelectorAll(".pu-panel")) p.hidden = p.id !== "pu-p-" + k;
}

/* --------------------------------------------- dialog konfirmasi unduh --------------------------------------------- */
let TARGET = null;
function konfirmHtml(d, b) {
  const pernah = SAYA.pernah;
  const ro = (kunci, v) => `<div class="pu-f"><span class="pu-f-l">${esc(t(kunci))}</span><span class="pu-f-v">${esc(v)}</span></div>`;
  const isian = (kunci, id, v, tipe, ph) => (v ? ro(kunci, v) : `<label class="pu-f"><span class="pu-f-l">${esc(t(kunci))}</span><input id="${id}" type="${tipe}" maxlength="${id === "pu-ins" ? 120 : 20}" autocomplete="${id === "pu-ins" ? "organization" : "tel"}" placeholder="${esc(t(ph))}"></label>`);
  const tujuan = TUJUAN.map((k) => `<label class="pu-tj"><input type="radio" name="pu-tujuan" value="${k}"${SAYA.tujuan === k ? " checked" : ""}><span>${esc(t("pu.tujuan." + k))}</span></label>`).join("");
  return `<form method="dialog" class="pu-k" id="pu-form" novalidate>
    <header><h2 id="pu-kj">${esc(t(pernah ? "pu.k.judul2" : "pu.k.judul"))}</h2>
      <button type="button" class="iconbtn" data-aksi="batal" aria-label="${esc(t("jm.tutup"))}" title="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button></header>
    <p class="pu-k-dok">${ikon("pdf", 20)}<span><b>${esc(d.judul)}</b><small>${esc(namaBerkas(d, b))}</small></span></p>
    <div class="pu-k-data">${ro("pu.k.nama", SAYA.nama)}${ro("pu.k.surel", SAYA.surel)}${isian("pu.k.instansi", "pu-ins", SAYA.instansi, "text", "pu.k.instansi.ph")}${isian("pu.k.telepon", "pu-tel", SAYA.telepon, "tel", "pu.k.telepon.ph")}</div>
    ${pernah ? "" : `<p class="pu-bantu">${esc(t("pu.k.profil"))}</p>`}
    <fieldset class="pu-tjs"><legend>${esc(t("pu.k.tujuan"))}</legend><div class="pu-tj-baris">${tujuan}</div></fieldset>
    ${pernah ? `<p class="pu-bantu">${esc(t("pu.k.dicatat"))}</p>` : `<label class="pu-setuju"><input type="checkbox" id="pu-setuju"><span>${esc(t("pu.k.setuju"))}</span></label>`}
    <div id="pu-pesan" aria-live="polite"></div>
    <footer><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("pu.k.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="pu-ok" disabled>${ikon("unduh", 18)}${esc(t("pu.k.ok"))}</button></footer></form>`;
}
function siapKirim() {
  const f = document.getElementById("pu-form"); if (!f) return;
  const tujuan = f.querySelector("input[name=pu-tujuan]:checked"), setuju = !document.getElementById("pu-setuju") || document.getElementById("pu-setuju").checked;
  document.getElementById("pu-ok").disabled = !(tujuan && setuju);
}
function bukaKonfirm(id, berkasId) {
  const d = D.byId.get(id), b = d?.berkas.find((x) => x.id === berkasId);
  if (!d || !b || !d.bisa) return;
  TARGET = { id, berkasId };
  const dlg = document.getElementById("konfirm");
  dlg.innerHTML = konfirmHtml(d, b);
  dlg.showModal();
  siapKirim();
  dlg.querySelector("input:not([type=radio]):not([type=checkbox]), input[type=radio]:checked, input[type=radio]")?.focus();
}
async function kirimUnduh() {
  const dlg = document.getElementById("konfirm"), f = document.getElementById("pu-form"), ok = document.getElementById("pu-ok");
  if (!TARGET || ok.disabled) return;
  const badan = { berkas: TARGET.berkasId, tujuan: f.querySelector("input[name=pu-tujuan]:checked").value };
  if (!SAYA.pernah) badan.setuju = true;
  const ins = document.getElementById("pu-ins")?.value.trim(), tel = document.getElementById("pu-tel")?.value.trim();
  if (ins) badan.instansi = ins;
  if (tel) badan.telepon = tel;
  ok.disabled = true; ok.setAttribute("aria-busy", "true");
  document.getElementById("pu-pesan").innerHTML = "";
  try {
    const r = await api(`/api/pustaka/${encodeURIComponent(TARGET.id)}/unduh`, { metode: "POST", badan });
    SAYA = { ...SAYA, pernah: true, tujuan: badan.tujuan, instansi: SAYA.instansi || ins || null, telepon: SAYA.telepon || tel || null };
    const d = D.byId.get(TARGET.id); d.n += 1;
    if (r.via === "sumber") window.open(r.url, "_blank", "noopener,noreferrer");
    else { const a = document.createElement("a"); a.href = r.url; a.download = ""; document.body.append(a); a.click(); a.remove(); }
    dlg.close();
    kabar(t(r.via === "sumber" ? "pu.k.sumber" : "pu.k.mulai"));
    ubin();
    if (document.getElementById("detail").open) bukaDetail(d.id); // angka unduhan di panel info
    nanti(gambarKisi);
  } catch (e) {
    ok.removeAttribute("aria-busy"); ok.disabled = false;
    document.getElementById("pu-pesan").innerHTML = pesanHtml("galat", t(e.kode === "berkas_belum_ada" ? "pu.k.belum" : e.kode === "persetujuan_wajib" ? "pu.k.wajib" : "galat." + (e.kode && /^[a-z_-]+$/.test(e.kode) ? e.kode : "umum")));
  }
}

/* --------------------------------------------------- penangan --------------------------------------------------- */
function pasang() {
  const saring_ = document.getElementById("saring"), isi = document.getElementById("isi"), detail = document.getElementById("detail"), konfirm = document.getElementById("konfirm");
  const ubahFilter = () => { S.hal = 1; tulisUrl(); nanti(gambarKisi); };
  const cariTunda = debounce(ubahFilter, 120);
  saring_.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  saring_.addEventListener("change", (e) => { const k = e.target.id; if (["jenis", "topik", "tahun", "penerbit", "urut"].includes(k)) { S[k] = e.target.value; ubahFilter(); } });
  saring_.addEventListener("click", (e) => {
    if (!e.target.closest("[data-aksi=reset]")) return;
    Object.assign(S, { q: "", jenis: "", topik: "", tahun: "", penerbit: "" });
    gambarSaring(); ubahFilter();
  });
  document.getElementById("lagi").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hal]"); if (!b || b.disabled) return;
    S.hal = Number(b.dataset.hal); tulisUrl();
    nanti(() => { gambarKisi(); document.getElementById("isi").scrollIntoView({ block: "start" }); });
  });
  isi.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) { location.reload(); return; }
    if (e.target.closest("[data-aksi=reset]")) { Object.assign(S, { q: "", jenis: "", topik: "", tahun: "", penerbit: "" }); gambarSaring(); ubahFilter(); return; }
    const b = e.target.closest("[data-buka]"); if (b) bukaDetail(b.dataset.buka);
  });
  detail.addEventListener("click", async (e) => {
    const b = e.target.closest("button, a"); if (!b) { if (e.target === detail) detail.close(); return; }
    if (b.dataset.aksi === "tutup") detail.close();
    else if (b.dataset.buka) bukaDetail(b.dataset.buka);
    else if (b.dataset.tab) pilihTab(detail, b.dataset.tab);
    else if (b.dataset.unduh) bukaKonfirm(b.dataset.unduh, b.dataset.berkas);
  });
  detail.addEventListener("keydown", (e) => {
    const tb = e.target.closest?.("[data-tab]"); if (!tb || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const semua = [...detail.querySelectorAll("[data-tab]")], n = (semua.indexOf(tb) + (e.key === "ArrowRight" ? 1 : -1) + semua.length) % semua.length;
    pilihTab(detail, semua[n].dataset.tab); semua[n].focus();
  });
  detail.addEventListener("close", () => { S.id = ""; tulisUrl(); });
  konfirm.addEventListener("click", (e) => { const b = e.target.closest("[data-aksi=batal]"); if (b || e.target === konfirm) konfirm.close(); });
  konfirm.addEventListener("change", siapKirim);
  konfirm.addEventListener("submit", (e) => { e.preventDefault(); kirimUnduh(); });
}

(async function awal() {
  await mulaiHalaman();
  const isi = document.getElementById("isi");
  bacaUrl();
  try { await muat(); } catch (e) { isi.innerHTML = galatHtml(e.kode || "umum"); isi.addEventListener("click", (x) => { if (x.target.closest("[data-aksi=ulang]")) location.reload(); }); return; }
  ubin(); gambarSaring(); gambarKisi(); pasang();
  if (S.id && D.byId.has(S.id)) bukaDetail(S.id);
})();
