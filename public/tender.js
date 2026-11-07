import { mulaiHalaman } from "/inti/kepala.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, kosongHtml, galatHtml, hantuHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, sumberHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { kodeProv } from "/inti/prov_singkat.js";
import { muat, label, urlAman, norm } from "/publik.js";

const HAL = 10, TAHUN_MIN = 5, TAHUN_MAKS = 15;
const S = { q: "", tek: "", prov: "", tahap: "", tahun: "", hal: 1, uk: "", ua: 1 };
const KUNCI = Object.keys(S);
/* satu ikon unik per teknologi dan per tahap (aturan pemilik: ikon tidak boleh sama antaropsi) */
const IK_TEK = { plts: "surya", pltb: "bayu", pltmh: "hidro", plta: "industri", pltp: "panas-bumi", pltbm: "bioenergi", pltsa: "biomassa-sampah", baterai: "penyimpanan", spklu: "elektrifikasi", jaringan: "jaringan", studi: "kebijakan" };
const IK_TAHAP = { perencanaan: "kalender", lelang: "palu", selesai: "centang", batal: "silang", gagal: "peringatan" };
const KELAS_TAHAP = { lelang: "jm-pil-warn", selesai: "jm-pil-ok", batal: "jm-pil-bad", gagal: "jm-pil-bad" };
let D = null;

const bacaUrl = () => { const p = new URLSearchParams(location.search); for (const k of KUNCI) if (p.has(k)) S[k] = k === "hal" ? Math.max(1, +p.get(k) || 1) : p.get(k); };
function tulisUrl() {
  const u = new URL(location.href);
  for (const k of KUNCI) { const v = S[k]; !v || (k === "hal" && v === 1) || (k === "ua" && v === 1) ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  history.replaceState(null, "", u);
}

const cocok = (r, abaikan = "") => (abaikan === "tahun" || !S.tahun || String(r.tahun) === S.tahun) && (!S.tek || r.teknologi === S.tek) && (!S.prov || r.provinsi === S.prov)
  && (!S.tahap || r.tahap === S.tahap) && (!S.q || r._cari.includes(norm(S.q.trim())));
const adaFilter = () => !!(S.q || S.tek || S.prov || S.tahap || S.tahun);
const strip = () => `<span class="jm-strip" title="${esc(t("jm.belum"))}">-</span>`;
const pilTek = (k) => k ? `<span class="jm-td-tek">${ikonTek(IK_TEK[k] || "jaringan")}<span>${esc(label("td.tek.", k))}</span></span>` : strip();
const pilTahap = (k) => `<span class="jm-pil ${KELAS_TAHAP[k] || ""}">${esc(label("td.tahap.", k))}</span>`;
const opsi = (f) => [...new Set(D.baris.map(f).filter(Boolean))];

function gambarSaring() {
  const p = (id, ik, semua, daftar) => pilihHtml({ id, ikon: ik, label: t(semua), opsi: [["", t(semua)], ...daftar], nilai: S[id] });
  const tek = opsi((r) => r.teknologi).map((v) => [v, label("td.tek.", v), "tek:" + (IK_TEK[v] || "jaringan")]).sort((a, b) => a[1].localeCompare(b[1], "id"));
  const prov = opsi((r) => r.provinsi).sort((a, b) => a.localeCompare(b, "id")).map((v) => [v, v, kodeProv(v) ? "prov:" + kodeProv(v) : "lokasi"]);
  const tahap = opsi((r) => r.tahap).map((v) => [v, label("td.tahap.", v), IK_TAHAP[v] || "info"]);
  document.getElementById("saring").innerHTML = cariHtml({ id: "q", label: t("td.cari") }) + p("tek", "topik", "td.semua.tek", tek) + p("prov", "lokasi", "td.semua.prov", prov) + p("tahap", "status", "td.semua.tahap", tahap)
    + hapusHtml({ id: "hapus", label: t("jm.kosong.reset") });
  document.getElementById("q").value = S.q;
  document.getElementById("hapus").hidden = !adaFilter();
}

/* grafik per tahun: kolom HTML dengan tooltip; klik kolom = saring tahun */
function gambarGrafik() {
  const per = new Map();
  for (const r of D.baris.filter((x) => cocok(x, "tahun"))) per.set(r.tahun, [...(per.get(r.tahun) || []), r]);
  const semua = D.baris.map((r) => r.tahun), akhir = Math.max(...semua), n = Math.min(TAHUN_MAKS, Math.max(TAHUN_MIN, akhir - Math.min(...semua) + 1));
  const d = Array.from({ length: n }, (_, i) => { const y = akhir - n + 1 + i, rs = per.get(y) || []; return { y, tot: rs.length, mw: rs.reduce((u, r) => u + (r.rencana_mw || 0), 0) }; });
  const mx = Math.max(1, ...d.map((x) => x.tot)), jumlah = d.reduce((u, x) => u + x.tot, 0), mw = d.reduce((u, x) => u + x.mw, 0);
  const puncak = d.filter((x) => x.tot === mx && x.tot).map((x) => x.y).join(", ") || "-";
  const kol = d.map(({ y, tot, mw: m }) => `<button type="button" class="jm-lg-k${String(y) === S.tahun ? " jm-lg-pilih" : ""}${tot === mx && tot ? " jm-lg-puncak" : ""}" data-th="${y}" aria-pressed="${String(y) === S.tahun}" aria-label="${y}: ${tot}, ${angka(m)} ${esc(t("td.mw"))}">
      <span class="jm-lg-v">${tot ? esc(angka(tot)) : ""}</span><span class="jm-lg-batang" data-h="${((tot / mx) * 100).toFixed(1)}"><i class="jm-lg-n" data-h="100"></i></span><span class="jm-lg-y">${y}</span>
      <span class="jm-lg-tip" role="tooltip"><b>${y}</b><span><i class="jm-lg-n"></i>${esc(t("td.tip.n"))} <b>${angka(tot)}</b></span><span><i class="jm-lg-d"></i>${esc(t("td.tip.mw"))} <b>${angka(m)} ${esc(t("td.mw"))}</b></span></span></button>`).join("");
  const el = document.getElementById("grafik");
  el.innerHTML = `<section class="jm-lg"><div class="jm-lg-kep"><div><p class="jm-lg-eb">${ikon("tahun", 16)}<span>${esc(t("td.grafik.ey"))}</span></p><h3>${esc(t("td.grafik.j", { n: angka(jumlah), th: n, puncak, mx: angka(mx) }))}</h3><p class="jm-lg-sub">${esc(t("td.grafik.s", { mw: angka(mw) }))}</p></div></div>`
    + `<div class="jm-lg-badan"><div class="jm-lg-kolom">${kol}</div></div></section>`;
  for (const x of el.querySelectorAll("[data-h]")) x.style.setProperty("--h", x.dataset.h + "%");
}

const KUNCI_URUT = { judul: (r) => r.judul, tek: (r) => label("td.tek.", r.teknologi), prov: (r) => r.provinsi || "", tahap: (r) => r.tahap, tanggal: (r) => r.tanggal || "", mw: (r) => r.rencana_mw ?? -1 };
function barisHtml(r, i) {
  const src = urlAman(r.sumber_url) ? `<a class="jm-td-ikon" href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("td.buka_sumber"))}: ${esc(tanggal(r.tanggal_sumber))}" aria-label="${esc(t("td.buka_sumber"))}: ${esc(r.judul)}">${ikon("tautan", 18)}</a>` : "";
  return `<tr><td class="jm-no" data-label="${esc(t("td.col.no"))}"><span class="jm-rank${i < 3 && S.hal === 1 && !S.uk ? " jm-rank-top" : ""}">${i + 1}</span></td>
    <td class="jm-id-sel" data-label="${esc(t("td.col.tender"))}"><span class="jm-id"><b>${esc(r.judul)}</b><small>${esc(r.instansi || "")}${r.tingkat_bukti ? " (" + esc(label("td.bukti.", r.tingkat_bukti)) + ")" : ""}</small></span></td>
    <td data-label="${esc(t("td.col.tek"))}">${pilTek(r.teknologi)}</td><td data-label="${esc(t("td.col.prov"))}">${r.provinsi ? esc(r.provinsi) : strip()}</td>
    <td class="jm-tengah" data-label="${esc(t("td.col.tahap"))}">${pilTahap(r.tahap)}</td>
    <td class="jm-num" data-label="${esc(t("td.col.tanggal"))}">${r.tanggal ? esc(tanggal(r.tanggal)) : strip()}</td>
    <td class="jm-num" data-label="${esc(t("td.col.mw"))}">${r.rencana_mw != null ? esc(angka(r.rencana_mw)) : strip()}</td>
    <td class="jm-tengah" data-label="${esc(t("td.col.aksi"))}"><span class="jm-td-aksi">${src}${tombolIkuti({ jenis: "tender", id: r.id, nama: r.judul })}</span></td></tr>`;
}
function gambarDaftar() {
  let rows = D.baris.filter((r) => cocok(r));
  rows = [...rows].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  if (S.uk && KUNCI_URUT[S.uk]) { const f = KUNCI_URUT[S.uk]; rows.sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * S.ua; }); }
  S.hal = Math.min(S.hal, Math.max(1, Math.ceil(rows.length / HAL)));
  const potong = rows.slice((S.hal - 1) * HAL, S.hal * HAL);
  const th = (k, kelas = "", uk = "") => uk ? `<th class="${kelas}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(k))}</button></th>` : `<th class="${kelas}">${esc(t(k))}</th>`;
  document.getElementById("isi").innerHTML = potong.length ? `<div class="jm-gulir"><table class="jm-tabel jm-td-tabel" data-urut="tidak"><thead><tr>${th("td.col.no", "jm-no")}${th("td.col.tender", "", "judul")}${th("td.col.tek", "", "tek")}${th("td.col.prov", "", "prov")}${th("td.col.tahap", "", "tahap")}${th("td.col.tanggal", "", "tanggal")}${th("td.col.mw", "", "mw")}${th("td.col.aksi")}</tr></thead><tbody>${potong.map((r, i) => barisHtml(r, (S.hal - 1) * HAL + i)).join("")}</tbody></table></div>`
    : kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
  document.getElementById("hal").innerHTML = paginasiHtml({ hal: S.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.tender" });
  document.getElementById("hitung").textContent = t("td.hitung", { n: angka(rows.length), c: angka(D.baris.length) });
  document.getElementById("hapus").hidden = !adaFilter();
  pasangIkuti(document.getElementById("isi"));
}

function gambarKaki() {
  const celah = (D.meta?.celah || []).map((c) => `<li>${esc(c)}</li>`).join("");
  document.getElementById("kaki-data").innerHTML = `<p>${sumberHtml(esc(t("td.sumber", { tanggal: tanggal(D.meta?.diperbarui || D.dibangun_pada) })) + " " + (D.sumber || []).filter((s) => urlAman(s.url)).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.penerbit)}</a>`).join(", "))}</p>`
    + (celah ? `<div class="jm-td-cat"><b>${esc(t("td.celah"))}</b><ul>${celah}</ul></div>` : "");
}

function gambarKepala() {
  const mw = D.baris.reduce((u, r) => u + (r.rencana_mw || 0), 0), terbaru = Math.max(...D.baris.map((r) => r.tahun || 0));
  khUbin("khUbin", [
    { ikon: "palu", nilai: angka(D.baris.length), label: t("td.kh.jumlah") },
    { ikon: "grafik", nilai: angka(mw), satuan: t("td.mw"), label: t("td.kh.mw") },
    { ikon: "lokasi", nilai: angka(new Set(D.baris.map((r) => r.provinsi).filter(Boolean)).size), label: t("td.kh.prov") },
    { ikon: "kalender", nilai: terbaru ? String(terbaru) : "-", label: t("td.kh.terbaru") },
  ]);
}

function gambarSemua() { gambarKepala(); gambarSaring(); gambarGrafik(); gambarDaftar(); gambarKaki(); }

async function main() {
  await mulaiHalaman();
  const akar = document.getElementById("daftar");
  akar.innerHTML = `<div class="jm-td-saring"><div class="jm-saring" id="saring"></div><p class="jm-hitung sr" id="hitung" role="status"></p><div id="isi">${hantuHtml(4)}</div><div class="jm-hal" id="hal"></div><div id="kaki-data"></div></div>`;
  bacaUrl();
  const mulai = async () => {
    try { D = await muat("tender"); } catch { document.getElementById("isi").innerHTML = galatHtml("layanan"); return false; }
    for (const r of D.baris) r._cari = norm([r.judul, r.instansi, r.provinsi, r.lokasi, r.pemenang, label("td.tek.", r.teknologi)].filter(Boolean).join(" "));
    gambarSemua(); return true;
  };
  if (!(await mulai())) { akar.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai()); return; }
  const tunda = () => nanti(() => { tulisUrl(); gambarGrafik(); gambarDaftar(); });
  const cariTunda = debounce(() => { S.hal = 1; tunda(); });
  const saring = document.getElementById("saring");
  saring.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  saring.addEventListener("change", (e) => { const k = e.target.id; if (k in S && k !== "q") { S[k] = e.target.value; S.hal = 1; tunda(); } });
  saring.addEventListener("click", (e) => {
    if (!e.target.closest("#hapus")) return;
    Object.assign(S, { q: "", tek: "", prov: "", tahap: "", tahun: "", hal: 1 });
    for (const el of saring.querySelectorAll("select")) el.value = "";
    document.getElementById("q").value = ""; tunda();
  });
  document.getElementById("grafik").addEventListener("click", (e) => {
    const k = e.target.closest("[data-th]"); if (!k) return;
    S.tahun = S.tahun === k.dataset.th ? "" : k.dataset.th; S.hal = 1;
    for (const b of document.querySelectorAll("#grafik [data-th]")) { const on = b.dataset.th === S.tahun; b.classList.toggle("jm-lg-pilih", on); b.setAttribute("aria-pressed", String(on)); } // chrome urgent
    tunda();
  });
  document.getElementById("isi").addEventListener("click", (e) => {
    const ub = e.target.closest("button[data-uk]"); if (ub) { const k = ub.dataset.uk; S.ua = S.uk === k ? -S.ua : 1; S.uk = k; S.hal = 1; tunda(); return; }
    if (e.target.closest("[data-aksi=reset]")) document.getElementById("hapus").click();
  });
  document.getElementById("hal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hal]"); if (!b || b.disabled) return;
    S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); tunda(); nanti(() => document.getElementById("saring").scrollIntoView({ block: "start" }));
  });
  document.addEventListener("jm:bahasa", () => nanti(gambarSemua));
}
main();
