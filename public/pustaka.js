/* /pustaka: kisi kartu bersampul + modal detail (Overview, Insight, Berkas) + unduh bertanggung jawab.
   Data: /data/pustaka.json + /data/pustaka_ulasan.json (statis) digabung dengan GET /api/pustaka (angka unduhan agregat, daftar berkas, data akun).
   INP: nilai filter dan tombol berubah seketika; render kisi menyusul lewat nanti(), dan kartu dirender per 18 (muat lagi). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal, tanggalSah } from "/i18n.js";
import { esc, api, nanti, debounce, kosongHtml, galatHtml, ikon, pesanHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml, terkaitHtml } from "/inti/komponen.js";
import { kabar } from "/inti/aksi_ex.js";
import { penerbitHtml } from "/penerbit.js";
import { tautOrg } from "/inti/tautan.js";

const PER = 18;
const TUJUAN = ["riset", "kebijakan", "bisnis", "media", "lainnya"];
const IKON_JENIS = { kajian: "analisis", regulasi: "regulasi", laporan: "daftar2", panduan: "buku", "paparan-konferensi": "tabel" };
const S = { q: "", jenis: "", topik: "", tahun: "", penerbit: "", urut: "pilihan", id: "", tampil: PER };
const KUNCI = ["q", "jenis", "topik", "tahun", "penerbit", "urut", "id"];
let D = null, SAYA = null, DAFTAR = [];

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tahunDari = (d) => (String(d.tanggal || "").match(/^\d{4}/) || [""])[0];
const labelJenis = (j) => t("pu.jenis." + j);
const labelTopik = (k) => t("pu.topik." + k);

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
}
function tulisUrl() {
  const u = new URL(location.href);
  for (const k of KUNCI) { const v = S[k]; !v || (k === "urut" && v === "pilihan") ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
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
  const jenis = opsi(hitung((d) => [d.jenis]), labelJenis, (a, b) => a[1].localeCompare(b[1]));
  const topik = opsi(hitung((d) => d.kepakaran || []), labelTopik, (a, b) => a[1].localeCompare(b[1]));
  const tahun = [...hitung((d) => [d.tahun]).keys()].sort((a, b) => b - a).map((v) => [v, v]);
  const penerbit = [...hitung((d) => [d.penerbit])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v, n]) => [v, v, "", angka(n)]);
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
function kartuHtml(d) {
  const b = esc(t("pu.buka", { judul: d.judul }));
  return `<article class="pu-kartu" data-id="${esc(d.id)}">
    <button type="button" class="pu-sampul-tbl" data-buka="${esc(d.id)}" aria-label="${b}">${sampulHtml(d)}</button>
    <div class="pu-badan"><h3><button type="button" data-buka="${esc(d.id)}">${esc(d.judul)}</button></h3>
      <p class="pu-ring">${esc(d.ringkasan || "")}</p>
      <button type="button" class="pu-lanjut" data-buka="${esc(d.id)}" aria-label="${b}">${esc(t("pu.selengkapnya"))}${ikon("panah-kanan", 16)}</button></div>
    <footer class="pu-kaki"><span class="pu-tgl">${esc(tglTerbit(d))}</span><span class="jm-pil pu-jenis pu-j-${esc(d.jenis)}">${esc(labelJenis(d.jenis))}</span><span class="pu-n" title="${esc(t("pu.diunduh", { n: angka(d.n) }))}">${ikon("unduh", 14)}<span>${esc(angka(d.n))}</span></span></footer></article>`;
}
function gambarKisi() {
  const baris = DAFTAR = saring();
  document.getElementById("hitung").textContent = t("pu.hitung", { n: angka(baris.length), total: angka(D.docs.length) });
  document.getElementById("hapus").hidden = !adaFilter();
  const isi = document.getElementById("isi"), lagi = document.getElementById("lagi");
  if (!baris.length) { isi.innerHTML = kosongHtml("pu.kosong", { data: "reset", kunci: "jm.kosong.reset" }); lagi.innerHTML = ""; return; }
  const potong = baris.slice(0, S.tampil);
  isi.innerHTML = `<div class="pu-kisi">${potong.map(kartuHtml).join("")}</div>`;
  lagi.innerHTML = baris.length > potong.length ? `<button type="button" class="jm-tbl" data-aksi="lagi">${esc(t("pu.lagi", { n: angka(baris.length - potong.length) }))}</button>` : "";
}
function ubin() {
  const penerbit = new Set(D.docs.map((d) => d.penerbit)).size, unduh = D.docs.reduce((a, d) => a + d.n, 0);
  khUbin("khUbin", [{ ikon: "buku", nilai: angka(D.docs.length), label: t("pu.ubin.dok") }, { ikon: "direktori", nilai: angka(penerbit), label: t("pu.ubin.penerbit") }, { ikon: "unduh", nilai: angka(unduh), label: t("pu.ubin.unduh") }]);
}

/* ------------------------------------------------- modal detail ------------------------------------------------- */
const info = (ik, kunci, isi) => `<li>${ikon(ik, 18)}<span><small>${esc(t(kunci))}</small><b>${isi}</b></span></li>`;
function terkait(d) {
  const skor = (x) => (x.kepakaran || []).filter((k) => (d.kepakaran || []).includes(k)).length * 2 + (x.penerbit === d.penerbit ? 2 : 0) + (x.jenis === d.jenis ? 1 : 0) + (x.u.sampul ? 1 : 0);
  return D.docs.filter((x) => x.id !== d.id).map((x) => [skor(x), x]).filter(([s]) => s >= 3).sort((a, b) => b[0] - a[0] || String(b[1].tanggal).localeCompare(String(a[1].tanggal))).slice(0, 3).map(([, x]) => x);
}
const ptsHtml = (daftar) => `<ul class="pu-poin">${daftar.map((p) => `<li><span>${esc(p.teks)}</span>${p.hlm ? `<small class="pu-hlm">${esc(p.hlm)}</small>` : ""}</li>`).join("")}</ul>`;
function overviewHtml(d) {
  const angkaH = (d.u.angka || []).length ? `<div class="pu-angka">${d.u.angka.map((a) => `<div class="pu-ang"><p><b>${esc(a.nilai)}</b>${a.satuan ? `<span>${esc(a.satuan)}</span>` : ""}</p><small>${esc(a.label)}</small><small class="pu-hlm">${esc(a.hlm || "")}</small></div>`).join("")}</div>` : "";
  return `<section><h3>${esc(t("pu.ringkasan"))}</h3><p>${esc(d.ringkasan || "")}</p></section>
    ${angkaH ? `<section><h3>${esc(t("pu.angka"))}</h3>${angkaH}</section>` : ""}
    ${(d.poin_kunci || []).length ? `<section><h3>${esc(t("pu.poin"))}</h3>${ptsHtml(d.poin_kunci)}</section>` : ""}`;
}
function insightHtml(d) {
  const tt = d.u.temuan || [], tau = d.u.tautan || [];
  if (!tt.length && !tau.length) return `<div class="jm-kosong">${ikon("info", 28)}<p>${esc(t("pu.insight.kosong"))}</p></div>`;
  const kel = (j) => tau.filter((x) => x.jenis === j);
  const grup = ["regulasi", "proyek", "organisasi", "provinsi", "teknologi"].filter((j) => kel(j).length).map((j) => `<div class="pu-tau"><h4>${esc(t("pu.tautan." + j))}</h4><div class="pu-chips">${kel(j).map((x) => `<a class="pu-chip" href="${esc(x.href)}">${esc(x.label)}</a>`).join("")}</div></div>`).join("");
  return `${tt.length ? `<section><h3>${esc(t("pu.temuan"))}</h3>${ptsHtml(tt)}</section>` : ""}${grup ? `<section><h3>${esc(t("pu.tautan"))}</h3><p class="pu-bantu">${esc(t("pu.tautan.bantu"))}</p>${grup}</section>` : ""}`;
}
const namaBerkas = (d, b) => b.nama || (b.id === "utama" ? t("pu.berkas.utama") : b.id);
function berkasHtml(d) {
  const ada = d.bisa;
  const baris = d.berkas.map((b) => `<li><span class="pu-b-ik">${ikon("pdf", 22)}</span><span class="pu-b-nama"><b>${esc(namaBerkas(d, b))}</b><small>${esc([String(b.format).toUpperCase(), ukuranTeks(b.ukuran), b.halaman ? t("pu.hlm", { n: angka(b.halaman) }) : ""].filter(Boolean).join(", "))}</small></span>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-unduh="${esc(d.id)}" data-berkas="${esc(b.id)}"${ada ? "" : " disabled"}>${ikon("unduh", 16)}${esc(t("pu.unduh"))}</button></li>`).join("");
  return `<section><h3>${esc(t("pu.berkas"))}</h3>${ada ? "" : `<p class="pu-bantu">${esc(t("pu.berkas.belum"))}</p>`}<ul class="pu-berkas">${baris}</ul></section>`;
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
        ${info("unduh", "pu.i.unduhan", esc(angka(d.n)))}
        ${info("pdf", "pu.i.ukuran", esc(ukuranTeks(ukuranTotal || d.ukuran) || "-"))}
        ${info("daftar2", "pu.i.berkas", esc(angka(d.berkas.length)))}
        ${info("tahun", "pu.i.terbit", esc(tglTerbit(d)))}
        ${info("jejak", "pu.i.diperbarui", esc(tanggalSah(d.diperbarui) ? tanggal(d.diperbarui) : "-"))}
        ${info("direktori", "pu.i.penerbit", d.penerbit ? `<span class="pu-pen">${penerbitHtml(d.penerbit, 24)}<span>${tautOrg(d.penerbit)}</span></span>` : "-")}
        ${info("bahasa", "pu.i.bahasa", esc(t("pu.bahasa." + (d.bahasa === "en" ? "en" : "id"))))}
        ${info("buku", "pu.i.halaman", esc(d.halaman ? angka(d.halaman) : "-"))}
      </ul></aside>
    <div class="pu-d-kanan">
      <header class="pu-d-kepala"><p class="pu-d-ey"><span class="jm-pil pu-jenis pu-j-${esc(d.jenis)}">${esc(labelJenis(d.jenis))}</span>${d.acara ? `<span>${esc(d.acara)}</span>` : ""}</p>
        <h2 id="pu-dj">${esc(d.judul)}</h2>
        <div class="pu-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-unduh="${esc(d.id)}" data-berkas="utama"${d.bisa ? "" : " disabled"}>${ikon("unduh", 18)}${esc(t("pu.unduh"))}</button>
          <span class="pu-bagi" role="group" aria-label="${esc(t("aksi.bagi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-bagi="salin" data-url="${esc(url)}">${ikon("salin", 16)}${esc(t("aksi.salin"))}</button>
            <a class="jm-tbl jm-tbl-kecil" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(d.judul + " " + url)}">${esc(t("aksi.wa"))}</a>
            <a class="jm-tbl jm-tbl-kecil" href="mailto:?subject=${encodeURIComponent(d.judul)}&body=${encodeURIComponent(url)}">${esc(t("pu.surel"))}</a></span></div></header>
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
  const ubahFilter = () => { S.tampil = PER; tulisUrl(); nanti(gambarKisi); };
  const cariTunda = debounce(ubahFilter, 120);
  saring_.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  saring_.addEventListener("change", (e) => { const k = e.target.id; if (["jenis", "topik", "tahun", "penerbit", "urut"].includes(k)) { S[k] = e.target.value; ubahFilter(); } });
  saring_.addEventListener("click", (e) => {
    if (!e.target.closest("[data-aksi=reset]")) return;
    Object.assign(S, { q: "", jenis: "", topik: "", tahun: "", penerbit: "" });
    gambarSaring(); ubahFilter();
  });
  document.getElementById("lagi").addEventListener("click", (e) => { if (e.target.closest("[data-aksi=lagi]")) { S.tampil += PER; nanti(gambarKisi); } });
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
    else if (b.dataset.bagi === "salin") { try { await navigator.clipboard.writeText(b.dataset.url); kabar(t("aksi.disalin")); } catch (err) { kabar(t("aksi.gagal")); } }
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
