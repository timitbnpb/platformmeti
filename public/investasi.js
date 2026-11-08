/* /investasi "Ruang investasi": proyek EBT rencana dan berizin yang dinilai kesiapan pendanaannya (scripts/pipa/investasi.mjs -> data/investasi.json).
   Skor, model keuangan, dan kecocokan pendana adalah Hipotesis terbuka (rumus: /inti/investasi_rumus.js, dijelaskan di /metode#investasi); bukan rekomendasi investasi.
   INP: saringan, urut, dan banding menyalakan chrome seketika (aria-pressed, hitungan); grid kartu dan lembar menyusul lewat nanti(). */
import { t, angka } from "/i18n.js";
import { esc, nanti, debounce, ikon, galatHtml, hantuHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, cariHtml, pilihHtml, hapusHtml, hitungHtml, sumberHtml, pasangUrutTabel } from "/inti/komponen.js";
import { hlHtml, kabar } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { BOBOT, KELAS_UKURAN, AMBANG } from "/inti/investasi_rumus.js";
import { KOMP, N, pct, rpkwh, usd, hipPil, pilTek, pilTahap, pilTingkat, skorHtml, lokasiHtml, pemilikHtml } from "/investasi_umum.js";
import { lembarHtml, cetakHtml, bandingHtml } from "/investasi_lembar.js";

const $ = (id) => document.getElementById(id);
const PER = 12, MAKS_BANDING = 3;
const S = { q: "", tek: "", prov: "", ukuran: "", skor: "", uk: "skor", hal: 1, banding: [] };
let D, CTX, isi;

const URUT = {
  skor: (a, z) => (z.skor ?? -1) - (a.skor ?? -1),
  mw: (a, z) => z.mw - a.mw,
  irr: (a, z) => (z.model.irr ?? -9) - (a.model.irr ?? -9),
  lcoe: (a, z) => (a.model.lcoe ?? 1e9) - (z.model.lcoe ?? 1e9),
  dana: (a, z) => (a.model.capex_usd_juta ?? 1e9) - (z.model.capex_usd_juta ?? 1e9),
};
const teksCari = (b) => `${b.nama} ${b.prov || ""} ${b.pemilik?.nama || ""}`.toLowerCase();
function saring() {
  const q = S.q.trim().toLowerCase();
  return D.baris.filter((b) => (!S.tek || b.tek === S.tek) && (!S.prov || b.prov_kode === S.prov) && (!S.ukuran || b.ukuran === S.ukuran) && (!S.skor || b.tingkat === S.skor) && (!q || teksCari(b).includes(q)))
    .sort((a, z) => URUT[S.uk](a, z) || z.mw - a.mw || a.nama.localeCompare(z.nama, "id"));
}
const adaFilter = () => !!(S.q || S.tek || S.prov || S.ukuran || S.skor);

/* ---------- kartu ---------- */
function kartu(b) {
  const m = b.model, dipilih = S.banding.includes(b.id);
  const model = m.galat ? `<p class="iv-k-tanpa">${ikon("info", 16)}<span>${esc(t("iv.c.tanpa_model"))}</span></p>`
    : `<ul class="iv-k-model"><li><span>${esc(t("iv.c.irr"))}</span><b>${esc(pct(m.irr))}</b></li><li><span>${esc(t("iv.c.lcoe"))}</span><b>${esc(rpkwh(m.lcoe))}</b></li><li><span>${esc(t("iv.c.dana"))}</span><b>${esc(usd(m.capex_usd_juta))}</b></li></ul>`;
  return `<article class="iv-kartu jm-tek-${esc(b.tek)}" data-id="${esc(b.id)}"><header class="iv-k-hd"><span class="iv-k-pil">${pilTek(b.tek)}${pilTahap(b)}</span>
    <button type="button" class="iv-bd-tb" data-banding="${esc(b.id)}" aria-pressed="${dipilih}" title="${esc(t("iv.c.banding"))}">${ikon("banding", 16)}<span>${esc(t("iv.c.banding"))}</span></button></header>
    <h3 class="iv-k-j"><button type="button" class="iv-buka" data-lembar="${esc(b.id)}">${esc(b.nama)}</button></h3>
    <dl class="iv-k-fakta"><div><dt>${esc(t("iv.c.kap"))}</dt><dd><b>${esc(N(b.mw, b.mw < 100 ? 1 : 0))}</b> MW <small>${esc(t("iv.uk." + b.ukuran))}</small></dd></div>
      <div><dt>${esc(t("iv.c.lokasi"))}</dt><dd>${lokasiHtml(b)}</dd></div><div><dt>${esc(t("iv.c.pemilik"))}</dt><dd>${pemilikHtml(b)}</dd></div></dl>
    <div class="iv-k-skor"><div>${skorHtml(b)}<small>${esc(t("iv.c.skor"))}</small></div><div class="iv-k-tg">${pilTingkat(b.skor)}${hipPil()}</div></div>
    ${model}
    <footer class="iv-k-ft"><button type="button" class="jm-tbl jm-tbl-utama" data-lembar="${esc(b.id)}">${ikon("tabel", 16)}<span>${esc(t("iv.c.lembar"))}</span></button></footer></article>`;
}

function daftar() {
  const semua = saring(), maks = Math.max(1, Math.ceil(semua.length / PER));
  S.hal = Math.min(S.hal, maks);
  const hit = $("ivHitung"); if (hit) hit.textContent = t("iv.hitung", { n: N(semua.length), total: N(D.baris.length) });
  $("ivHapus").hidden = !adaFilter();
  $("ivGrid").innerHTML = semua.length ? semua.slice((S.hal - 1) * PER, S.hal * PER).map(kartu).join("") : `<div class="jm-kosong" role="status">${ikon("info", 32)}<p>${esc(t("iv.kosong"))}</p></div>`;
  $("ivPag").innerHTML = paginasiHtml({ hal: S.hal, total: semua.length, per: PER, satuan: "iv.satuan" });
}
const tunda = () => nanti(daftar);

/* ---------- kerangka ---------- */
const opsiTek = () => [["", t("iv.f.semua_tek"), "tek:surya"], ...["surya", "hidro", "bayu", "panas-bumi", "bioenergi"].filter((k) => D.baris.some((b) => b.tek === k)).map((k) => [k, t("pj.tek." + k), "tek:" + k, D.baris.filter((b) => b.tek === k).length])];
const opsiProv = () => {
  const m = new Map(D.baris.map((b) => [b.prov_kode, b.prov]));
  return [["", t("iv.f.semua_prov"), "peta"], ...[...m].sort((a, z) => a[1].localeCompare(z[1], "id")).map(([k, n]) => [k, n, "prov:" + k, D.baris.filter((b) => b.prov_kode === k).length])];
};
const opsiUkuran = () => [["", t("iv.f.semua_ukuran"), "petir"], ...KELAS_UKURAN.map(([k]) => [k, t("iv.uk." + k), "petir", D.baris.filter((b) => b.ukuran === k).length])];
const opsiSkor = () => [["", t("iv.f.semua_skor"), "grafik"], ...["t", "s", "r"].map((k) => [k, t("iv.sk." + k, { a: AMBANG.tinggi, b: AMBANG.sedang }), "grafik", D.baris.filter((b) => b.tingkat === k).length])];
const opsiUrut = () => Object.keys(URUT).map((k) => [k, t("iv.urut." + k), "tabel"]);

function kerangka() {
  const sk = sumberHtml(D.sumber.map((s) => `${esc(s.judul)} (${esc(s.berkas)}, ${esc(s.tanggal)})`).join("<br>") + `<br><a href="/metode#investasi">${esc(t("iv.met.link"))}</a>`);
  isi.innerHTML = `${exHtml({ id: "exIv", ikon: "medali", topik: t("iv.ex.ey"), judulHtml: hlHtml("iv.ex.j", N(D.baris.length)), subHtml: `${esc(t("iv.ex.s"))} ${hipPil()}`, aksiHtml: sk,
    isiHtml: `<div class="jm-saring iv-saring">${cariHtml({ id: "ivQ", label: t("iv.f.cari"), placeholder: t("iv.f.cari") })}
      ${pilihHtml({ id: "ivTek", ikon: "tek:surya", label: t("iv.f.tek"), opsi: opsiTek(), nilai: S.tek })}${pilihHtml({ id: "ivProv", ikon: "peta", label: t("iv.f.prov"), opsi: opsiProv(), nilai: S.prov })}
      ${pilihHtml({ id: "ivUkuran", ikon: "petir", label: t("iv.f.ukuran"), opsi: opsiUkuran(), nilai: S.ukuran })}${pilihHtml({ id: "ivSkor", ikon: "grafik", label: t("iv.f.skor"), opsi: opsiSkor(), nilai: S.skor })}
      ${pilihHtml({ id: "ivUrut", ikon: "tabel", label: t("iv.f.urut"), opsi: opsiUrut(), nilai: S.uk })}${hapusHtml({ id: "ivHapus", label: t("jm.hapus_filter") })}${hitungHtml({ id: "ivHitung", teks: "" })}</div>
      <div class="iv-grid" id="ivGrid"></div><div id="ivPag"></div>` })}${metode()}`;
  $("ivQ").value = S.q;
  daftar();
}

function metode() {
  const kp = (k) => `<tr><td data-label="${esc(t("iv.col.komp"))}"><b>${esc(t("iv.kp." + k))}</b></td><td data-label="${esc(t("iv.col.bobot"))}" class="jm-num">${esc(N(BOBOT[k] * 100) + "%")}</td><td data-label="${esc(t("iv.col.cara"))}">${esc(t("iv.met.cara." + k))}</td></tr>`;
  const ol = (p, n) => `<ol class="iv-cara">${Array.from({ length: n }, (_, i) => `<li>${esc(t(p + (i + 1)))}</li>`).join("")}</ol>`;
  return exHtml({ id: "exMetode", ikon: "metode", topik: t("iv.met.ey"), judulHtml: esc(t("iv.met.j")), subHtml: hipPil(), aksiHtml: `<a class="jm-tbl" href="/metode#investasi">${ikon("metode", 16)}<span>${esc(t("iv.met.link"))}</span></a>`,
    isiHtml: `<div class="iv-met"><div>${ol("iv.cara", 4)}<p class="iv-cat">${esc(t("iv.cara.f1"))}</p></div>
      <div><div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap" data-urut="tidak"><thead><tr><th scope="col">${esc(t("iv.col.komp"))}</th><th scope="col" class="jm-num">${esc(t("iv.col.bobot"))}</th><th scope="col">${esc(t("iv.col.cara"))}</th></tr></thead><tbody>${KOMP.map(kp).join("")}</tbody></table></div></div></div>
      <h4 class="iv-sub">${esc(t("iv.met.batas"))}</h4><ul class="iv-isu">${[1, 2, 3, 4, 5].map((i) => `<li>${ikon("info", 14)}<span>${esc(t("iv.cara.b" + i))}</span></li>`).join("")}</ul>` });
}

/* ---------- tray banding ---------- */
function tray() {
  const el = $("ivTray"), n = S.banding.length;
  el.hidden = n === 0;
  if (!n) { el.innerHTML = ""; return; }
  const dp = S.banding.map((id) => CTX.per.get(id));
  el.innerHTML = `<div class="iv-tray-isi"><p class="iv-tray-j">${ikon("banding", 18)}<span>${esc(t("iv.tray.n", { n: N(n) }))}</span></p><ul class="iv-tray-daftar">${dp.map((b) => `<li><span>${esc(b.nama)}</span><button type="button" data-banding="${esc(b.id)}" aria-label="${esc(t("iv.b.lepas", { nama: b.nama }))}">${ikon("silang", 14)}</button></li>`).join("")}</ul>
    <div class="iv-tray-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-buka-banding${n < 2 ? " disabled" : ""}>${ikon("banding", 16)}<span>${esc(n < 2 ? t("iv.tray.min") : t("iv.tray.banding"))}</span></button><button type="button" class="jm-hapus" data-kosong>${ikon("silang", 16)}${esc(t("iv.tray.kosongkan"))}</button></div></div>`;
}
function ubahBanding(id) {
  const i = S.banding.indexOf(id);
  if (i >= 0) S.banding.splice(i, 1);
  else if (S.banding.length < MAKS_BANDING) S.banding.push(id);
  else kabar(t("iv.tray.maks", { n: MAKS_BANDING }));
  for (const b of document.querySelectorAll(`.iv-bd-tb[data-banding="${CSS.escape(id)}"]`)) b.setAttribute("aria-pressed", String(S.banding.includes(id)));
  tray();
}

/* ---------- dialog ---------- */
const dlg = () => $("ivDlg");
function buka(html, mode, id) {
  const d = dlg();
  d.dataset.mode = mode;
  d.innerHTML = `<div class="iv-dlg-isi">${hantuHtml(2)}</div>`;
  if (!d.open) d.showModal();
  nanti(() => { d.innerHTML = html(); pasangUrutTabel(d); d.scrollTop = 0; if (id) history.replaceState(null, "", "#" + id); });
}
const bukaLembar = (id) => { const b = CTX.per.get(id); if (b) buka(() => lembarHtml(b, CTX), "lembar", id); };
const bukaBanding = () => { const l = S.banding.map((id) => CTX.per.get(id)).filter(Boolean); if (l.length >= 2) buka(() => bandingHtml(l, CTX), "banding", ""); };
function cetak(id) {
  const b = CTX.per.get(id); if (!b) return;
  nanti(() => {
    $("ivCetak").innerHTML = cetakHtml(b, CTX);
    const h = document.documentElement; h.classList.add("iv-cetak-aktif");
    addEventListener("afterprint", () => h.classList.remove("iv-cetak-aktif"), { once: true });
    print();
  });
}

function pasang() {
  const q = debounce((e) => { S.q = e.target.value; S.hal = 1; tunda(); }, 120);
  isi.addEventListener("input", (e) => { if (e.target.id === "ivQ") q(e); });
  isi.addEventListener("change", (e) => {
    const kunci = { ivTek: "tek", ivProv: "prov", ivUkuran: "ukuran", ivSkor: "skor", ivUrut: "uk" }[e.target.id];
    if (!kunci) return;
    S[kunci] = e.target.value; S.hal = 1; tunda();
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-lembar],[data-banding],[data-cetak],[data-buka-banding],[data-kosong],[data-tutup],#ivHapus,.jm-pag-b");
    if (!a) { if (e.target === dlg()) dlg().close(); return; }
    if (a.dataset.lembar) return bukaLembar(a.dataset.lembar);
    if (a.dataset.banding) { const id = a.dataset.banding; ubahBanding(id); if (dlg().open && dlg().dataset.mode === "banding") { if (S.banding.length >= 2) bukaBanding(); else dlg().close(); } else if (dlg().open && dlg().dataset.mode === "lembar") { a.setAttribute("aria-pressed", String(S.banding.includes(id))); } return; }
    if (a.dataset.cetak) return cetak(a.dataset.cetak);
    if (a.hasAttribute("data-buka-banding")) return bukaBanding();
    if (a.hasAttribute("data-kosong")) { S.banding = []; for (const b of document.querySelectorAll(".iv-bd-tb")) b.setAttribute("aria-pressed", "false"); return tray(); }
    if (a.hasAttribute("data-tutup")) return dlg().close();
    if (a.id === "ivHapus") {
      Object.assign(S, { q: "", tek: "", prov: "", ukuran: "", skor: "", hal: 1 });
      $("ivQ").value = ""; for (const [id, v] of [["ivTek", ""], ["ivProv", ""], ["ivUkuran", ""], ["ivSkor", ""]]) { $(id).value = v; }
      return tunda();
    }
    if (a.dataset.hal && a.closest("#ivPag")) { S.hal = +a.dataset.hal; sorotHalaman(a, S.hal); nanti(() => { daftar(); $("exIv").scrollIntoView({ block: "start" }); }); }
  });
  dlg().addEventListener("close", () => { if (location.hash) history.replaceState(null, "", location.pathname + location.search); });
  addEventListener("hashchange", () => { const id = decodeURIComponent(location.hash.slice(1)); if (id && CTX.per.has(id)) bukaLembar(id); });
}

function bacaUrl() {
  const q = new URLSearchParams(location.search);
  if (q.has("mw")) return; // tautan "Buka di Pemodelan keuangan" (?tek= &prov= &mw=) milik tab Model, bukan saringan proyek
  for (const [p, k] of [["tek", "tek"], ["prov", "prov"], ["ukuran", "ukuran"], ["skor", "skor"], ["q", "q"], ["urut", "uk"]]) { const v = q.get(p); if (v) S[k] = v; }
  if (!URUT[S.uk]) S.uk = "skor";
}
function hero() {
  const r = D.ringkas;
  khUbin("ivAngka", [
    { ikon: "proyek", nilai: N(D.jumlah), label: t("iv.k.proyek") },
    { ikon: "petir", nilai: N(r.mw / 1000, 1), satuan: "GW", label: t("iv.k.mw") },
    { ikon: "kartu", nilai: t("iv.usd_miliar", { n: N(r.dana_usd_miliar, 1) }), label: t("iv.k.dana") },
    { ikon: "grafik", nilai: N(r.skor_median, 1), label: t("iv.k.skor") },
  ]);
}

isi = $("ivIsi");
isi.innerHTML = hantuHtml(3);
try { D = await fetch("/data/investasi.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); }); } catch {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw new Error("data investasi");
}
CTX = { D, per: new Map(D.baris.map((b) => [b.id, b])), pn: new Map(D.pendana.map((p) => [p.id, p])) };
bacaUrl();
for (const k of ["banding"]) { const v = new URLSearchParams(location.search).get(k); if (v) S.banding = v.split(",").filter((id) => CTX.per.has(id)).slice(0, MAKS_BANDING); }
hero(); kerangka(); pasang();
tray();
{ const id = decodeURIComponent(location.hash.slice(1)); if (id && CTX.per.has(id)) bukaLembar(id); else if (S.banding.length >= 2 && new URLSearchParams(location.search).has("banding")) bukaBanding(); }
document.addEventListener("jm:bahasa", () => { hero(); kerangka(); tray(); });
