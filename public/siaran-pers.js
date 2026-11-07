// /siaran-pers: tiga segmen (siaran pers METI, liputan media, liputan kegiatan), kisi 3 kolom kartu berfoto.
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml, exHtml, sumberHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { norm } from "/publik.js";
import { JENIS, IKON_JENIS, muatSiaran, kartuHtml, topikLabel, pasangGalatFoto } from "/siaran_umum.js";

const PER = 12;
const S = { jenis: "siaran_pers", q: "", tahun: "", topik: "", media: "", hal: 1 };
let D = null;

const barisJenis = () => D.baris.filter((r) => r.jenis === S.jenis);
function saring() {
  const q = norm(S.q.trim());
  return barisJenis().filter((r) => (!S.tahun || r._tahun === S.tahun) && (!S.topik || (r.topik || []).includes(S.topik)) && (!S.media || r.media === S.media)
    && (!q || norm(`${r.judul} ${r.media} ${r.ringkasan}`).includes(q)));
}
function opsi() {
  const b = barisJenis(), uniq = (f) => [...new Set(b.flatMap(f).filter(Boolean))];
  return {
    tahun: [["", t("sp.f.tahun")], ...uniq((r) => [r._tahun]).sort().reverse().map((v) => [v, v])],
    topik: [["", t("sp.f.topik")], ...uniq((r) => r.topik || []).map((k) => [k, topikLabel(k), "tek:" + k]).sort((a, z) => a[1].localeCompare(z[1]))],
    media: [["", t("sp.f.media")], ...uniq((r) => [r.media]).sort((a, z) => a.localeCompare(z)).map((v) => [v, v])],
  };
}
function gambarTab() {
  document.getElementById("tab").innerHTML = JENIS.map((k) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.jenis === k}">${ikon(IKON_JENIS[k], 18)}<span>${esc(t("sp.jenis." + k))}</span></button>`).join("");
}
function gambarSaring() {
  const o = opsi();
  document.getElementById("saring").innerHTML = cariHtml({ id: "f-q", label: t("sp.cari") })
    + pilihHtml({ id: "f-tahun", ikon: "tahun", label: t("sp.f.tahun"), opsi: o.tahun, nilai: S.tahun })
    + pilihHtml({ id: "f-topik", ikon: "topik", label: t("sp.f.topik"), opsi: o.topik, nilai: S.topik })
    + pilihHtml({ id: "f-media", ikon: "jenis", label: t("sp.f.media"), opsi: o.media, nilai: S.media })
    + hapusHtml({ id: "f-hapus", label: t("jm.hapus_filter") }) + hitungHtml({ id: "f-hitung", teks: "" });
  document.getElementById("f-q").value = S.q;
  aturSaring();
}
/** Pilih media hanya bermakna untuk liputan media. */
function aturSaring() {
  document.getElementById("f-media").closest("label").hidden = S.jenis !== "liputan_media";
  document.getElementById("f-hapus").hidden = !(S.q || S.tahun || S.topik || S.media);
}
function gambarIsi() {
  const rows = saring(), total = barisJenis().length;
  document.getElementById("f-hitung").textContent = t("sp.hitung", { n: angka(rows.length), total: angka(total) });
  const el = document.getElementById("daftar");
  if (!rows.length) { el.innerHTML = `<p class="sp-kosong">${esc(t(total ? "sp.kosong" : "sp.kosong_jenis"))}</p>`; return; }
  S.hal = Math.min(S.hal, Math.max(1, Math.ceil(rows.length / PER)));
  const potong = rows.slice((S.hal - 1) * PER, S.hal * PER);
  el.innerHTML = `<ul class="sp-kisi">${potong.map((r) => kartuHtml(r, D.foto)).join("")}</ul>`
    + paginasiHtml({ hal: S.hal, total: rows.length, per: PER, satuan: "jm.pag.u.dokumen" });
}
function tulisUrl() {
  const u = new URL(location.href);
  for (const k of ["jenis", "q", "tahun", "topik", "media", "hal"]) { const v = S[k]; !v || (k === "hal" && v <= 1) || (k === "jenis" && v === "siaran_pers") ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  history.replaceState(null, "", u);
}
/** Chrome sinkron, daftar berat sesudah satu bingkai tercat. */
function ubah(sinkron) { S.hal = 1; sinkron && sinkron(); aturSaring(); tulisUrl(); nanti(gambarIsi); }

(async () => {
  await mulaiHalaman();
  document.getElementById("sp-ex").innerHTML = exHtml({ id: "ex-sp", ikon: "siaran", topik: t("sp.ex.ey"), judulHtml: esc(t("sp.ex.j")), subHtml: esc(t("sp.ex.sub")),
    aksiHtml: " ", isiHtml: `<div class="jm-tab" role="tablist" id="tab"></div><div class="jm-saring" id="saring"></div><div id="daftar" role="tabpanel"></div>` });
  document.getElementById("daftar").innerHTML = hantuHtml(6);
  try { D = await muatSiaran(); } catch { document.getElementById("daftar").innerHTML = galatHtml(); return; }
  window.__spMedia = new Map(D.baris.map((r) => [r.id, r]));
  pasangGalatFoto();
  const n = (j) => D.baris.filter((r) => r.jenis === j).length;
  khUbin("khUbin", JENIS.map((j) => ({ ikon: IKON_JENIS[j], nilai: angka(n(j)), label: t("sp.jenis." + j) })));
  document.querySelector("#ex-sp .jm-ex-aksi").innerHTML = aksiHtml({ csv: false }) + sumberHtml(`${esc(t("sp.sumber"))} ${esc(tanggal(D.dibangun))}.`);
  const p = new URLSearchParams(location.search);
  for (const k of Object.keys(S)) if (p.has(k)) S[k] = k === "hal" ? Math.max(1, +p.get(k) || 1) : p.get(k);
  if (!JENIS.includes(S.jenis)) S.jenis = "siaran_pers";
  gambarTab(); gambarSaring(); gambarIsi();
  document.getElementById("daftar").addEventListener("click", (e) => { const l = e.target.closest("[data-hal]"); if (l && !l.disabled) { S.hal = +l.dataset.hal; sorotHalaman(l, S.hal); tulisUrl(); nanti(gambarIsi); } });
  document.getElementById("tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b || b.dataset.tab === S.jenis) return;
    ubah(() => { S.jenis = b.dataset.tab; S.tahun = S.topik = S.media = ""; gambarTab(); gambarSaring(); });
  });
  const cariTunda = debounce(() => ubah(() => {}), 120), sr = document.getElementById("saring");
  sr.addEventListener("input", (e) => { if (e.target.id === "f-q") { S.q = e.target.value; cariTunda(); } });
  sr.addEventListener("change", (e) => { const k = e.target.id.slice(2); if (e.target.id.startsWith("f-") && k in S && k !== "q") ubah(() => { S[k] = e.target.value; }); });
  sr.addEventListener("click", (e) => { if (e.target.closest("#f-hapus")) ubah(() => { Object.assign(S, { q: "", tahun: "", topik: "", media: "" }); gambarSaring(); }); });
})();
