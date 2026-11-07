/* Tab "Tender dan lelang" di /proyek (menggantikan halaman /tender). Dipanggil proyek.js sesudah mulaiHalaman().
   Data /data/tender.json dimuat malas saat tab dibuka. Tanpa grafik tahunan: ringkasan di kepala exhibit, tabel rapat, kartu di layar sempit. */
import { tabHalaman } from "/inti/tab_halaman.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, kosongHtml, hantuHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, exHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { pilTek } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { kodeProv } from "/inti/prov_singkat.js";
import { muat, label, urlAman, norm } from "/publik.js";

const HAL = 10;
const S = { q: "", tek: "", prov: "", tahap: "", tahun: "", inst: "", hal: 1, uk: "", ua: 1 };
/* kode teknologi tender -> kode ikon/pil teknologi bersama */
const TEK = { plts: "surya", pltb: "bayu", pltmh: "hidro", plta: "hidro", pltp: "panas-bumi", pltbm: "bioenergi", pltsa: "biomassa-sampah", baterai: "penyimpanan", spklu: "elektrifikasi", jaringan: "jaringan", studi: "kebijakan" };
const IK_TAHAP = { perencanaan: "kalender", lelang: "palu", selesai: "centang", batal: "silang", gagal: "peringatan" };
const KELAS_TAHAP = { lelang: "jm-pil-warn", selesai: "jm-pil-ok", batal: "jm-pil-bad", gagal: "jm-pil-bad" };
const LOGO = [[/ESDM/i, "/img/logo/esdm.png"], [/\bPLN\b/i, "/img/logo/pln.png"]];
let D = null, host = null;

const cocok = (r, abaikan = "") => (abaikan === "tahap" || !S.tahap || r.tahap === S.tahap) && (!S.tahun || String(r.tahun) === S.tahun) && (!S.inst || r.instansi === S.inst)
  && (!S.tek || r.teknologi === S.tek) && (!S.prov || r.provinsi === S.prov) && (!S.q || r._cari.includes(norm(S.q.trim())));
const adaFilter = () => !!(S.q || S.tek || S.prov || S.tahap || S.tahun || S.inst);
const strip = () => `<span class="jm-strip" title="${esc(t("jm.belum"))}">-</span>`;
const opsi = (f) => [...new Set(D.baris.map(f).filter(Boolean))];
const $ = (id) => host.querySelector("#" + id);
const lencana = (r) => { const f = LOGO.find(([x]) => x.test(r.instansi || "")), u = f ? f[1] : logoOrgSatu(null, r.instansi); return `<span class="td-lg">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="1">` : ikon("gedung", 14)}</span>`; };
const pilTahap = (k) => `<span class="jm-pil td-pil ${KELAS_TAHAP[k] || ""}">${ikon(IK_TAHAP[k] || "info", 14)}<span>${esc(label("td.tahap.", k))}</span></span>`;
const provSel = (p) => { const k = kodeProv(p); return p ? `<span class="td-prov">${k ? `<img class="td-lb" src="/img/provinsi/${k}.png" width="18" height="18" alt="" loading="lazy" decoding="async">` : ikon("lokasi", 16)}<span>${esc(p)}</span></span>` : strip(); };

function gambarSaring() {
  const p = (id, ik, semua, daftar) => pilihHtml({ id, ikon: ik, label: t(semua), opsi: [["", t(semua)], ...daftar], nilai: S[id] });
  const tek = opsi((r) => r.teknologi).map((v) => [v, label("td.tek.", v)]).sort((a, b) => a[1].localeCompare(b[1], "id"));
  const prov = opsi((r) => r.provinsi).sort((a, b) => a.localeCompare(b, "id")).map((v) => [v, v]);
  const th = opsi((r) => String(r.tahun)).sort().reverse().map((v) => [v, v]);
  const ins = opsi((r) => r.instansi).sort((a, b) => a.localeCompare(b, "id")).map((v) => [v, v]);
  const tahap = [...new Set(D.baris.map((r) => r.tahap))];
  const seg = `<div class="td-seg" role="group" aria-label="${esc(t("td.col.tahap"))}"><button type="button" data-tahap="" aria-pressed="${!S.tahap}">${ikon("daftar", 16)}<span>${esc(t("td.seg.semua"))}</span><small id="tdN-"></small></button>${tahap.map((k) => `<button type="button" data-tahap="${esc(k)}" aria-pressed="${S.tahap === k}">${ikon(IK_TAHAP[k] || "info", 16)}<span>${esc(label("td.tahap.", k))}</span><small id="tdN-${esc(k)}"></small></button>`).join("")}</div>`;
  $("tdSaring").innerHTML = seg + `<div class="jm-saring td-bar">${cariHtml({ id: "q", label: t("td.cari") })}${p("tahun", "tahun", "td.semua.tahun", th)}${p("inst", "gedung", "td.semua.inst", ins)}${p("tek", "topik", "td.semua.tek", tek)}${p("prov", "lokasi", "td.semua.prov", prov)}${hapusHtml({ id: "tdHapus", label: t("jm.kosong.reset") })}</div>`;
  $("q").value = S.q;
}

const URUT = { judul: (r) => r.judul, tek: (r) => label("td.tek.", r.teknologi), prov: (r) => r.provinsi || "", tahap: (r) => r.tahap, tanggal: (r) => r.tanggal || "", mw: (r) => r.rencana_mw ?? -1 };
function baris(r, i) {
  const src = urlAman(r.sumber_url) ? `<a class="td-ik" href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("td.buka_sumber"))}: ${esc(tanggal(r.tanggal_sumber))}" aria-label="${esc(t("td.buka_sumber"))}: ${esc(r.judul)}">${ikon("tautan", 16)}</a>` : "";
  return `<tr><td class="td-no" data-label="${esc(t("td.col.no"))}">${i + 1}</td>
    <td class="td-judul" data-label="${esc(t("td.col.tender"))}"><b>${esc(r.judul)}</b><span class="td-inst">${lencana(r)}<span>${esc(r.instansi || "-")}</span>${r.tingkat_bukti ? `<span class="jm-pil td-bukti" title="${esc(t("td.bukti_tip"))}">${esc(label("td.bukti.", r.tingkat_bukti))}</span>` : ""}</span></td>
    <td data-label="${esc(t("td.col.tek"))}">${r.teknologi ? pilTek(TEK[r.teknologi] || "jaringan") : strip()}</td><td data-label="${esc(t("td.col.prov"))}">${provSel(r.provinsi)}</td>
    <td data-label="${esc(t("td.col.tahap"))}">${pilTahap(r.tahap)}</td>
    <td class="td-n" data-label="${esc(t("td.col.tanggal"))}">${r.tanggal ? esc(tanggal(r.tanggal)) : strip()}</td>
    <td class="td-n" data-label="${esc(t("td.col.mw"))}">${r.rencana_mw != null ? esc(angka(r.rencana_mw)) : strip()}</td>
    <td class="td-aksi" data-label="${esc(t("td.col.aksi"))}"><span class="td-aksi-b">${src}${tombolIkuti({ jenis: "tender", id: r.id, nama: r.judul })}</span></td></tr>`;
}
const urutkan = (rows) => {
  rows = [...rows].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  if (S.uk && URUT[S.uk]) { const f = URUT[S.uk]; rows.sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * S.ua; }); }
  return rows;
};
function gambarDaftar() {
  const rows = urutkan(D.baris.filter((r) => cocok(r)));
  S.hal = Math.min(S.hal, Math.max(1, Math.ceil(rows.length / HAL)));
  const potong = rows.slice((S.hal - 1) * HAL, S.hal * HAL);
  const th = (k, kelas = "", uk = "") => uk ? `<th class="${kelas}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(k))}</button></th>` : `<th class="${kelas}">${esc(t(k))}</th>`;
  $("tdIsi").innerHTML = potong.length ? `<div class="jm-gulir"><table class="jm-tabel td-tabel" data-urut="tidak"><thead><tr>${th("td.col.no", "td-no")}${th("td.col.tender", "", "judul")}${th("td.col.tek", "", "tek")}${th("td.col.prov", "", "prov")}${th("td.col.tahap", "", "tahap")}${th("td.col.tanggal", "", "tanggal")}${th("td.col.mw", "", "mw")}${th("td.col.aksi")}</tr></thead><tbody>${potong.map((r, i) => baris(r, (S.hal - 1) * HAL + i)).join("")}</tbody></table></div>`
    : kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
  $("tdHal").innerHTML = paginasiHtml({ hal: S.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.tender" });
  $("tdHitung").textContent = t("td.hitung", { n: angka(rows.length), c: angka(D.baris.length) });
  $("tdHapus").hidden = !adaFilter();
  for (const el of host.querySelectorAll("[id^='tdN-']")) { const k = el.id.slice(4); el.textContent = angka(D.baris.filter((r) => cocok(r, "tahap") && (!k || r.tahap === k)).length); }
  pasangIkuti($("tdIsi"));
}

function gambarEx() {
  const mw = D.baris.reduce((u, r) => u + (r.rencana_mw || 0), 0), nProv = new Set(D.baris.map((r) => r.provinsi).filter(Boolean)).size, nTek = new Set(D.baris.map((r) => r.teknologi).filter(Boolean)).size;
  const celah = (D.meta?.celah || []).map((c) => `<li>${esc(c)}</li>`).join("");
  const info = `<details class="td-info"><summary aria-label="${esc(t("td.info"))}" title="${esc(t("td.info"))}">${ikon("info", 18)}</summary><div class="td-pop"><p><b>${esc(t("td.butuh"))}</b></p>${celah ? `<ul>${celah}</ul>` : ""}<p class="jm-bantu">${esc(t("td.sumber", { tanggal: tanggal(D.meta?.diperbarui || D.dibangun_pada) }))}</p></div></details>`;
  host.innerHTML = exHtml({ id: "tender", ikon: "palu", topik: t("td.ex.ey"), judulHtml: esc(t("td.ex.j", { n: angka(D.baris.length), mw: angka(mw) })), subHtml: esc(t("td.ex.s", { p: angka(nProv), k: angka(nTek) })),
    aksiHtml: info + aksiHtml({ csv: true, png: false, pdf: false, bagi: false }),
    isiHtml: `<div id="tdSaring" class="td-saring"></div><p class="jm-hitung td-hitung" id="tdHitung" role="status"></p><div id="tdIsi"></div><div id="tdHal"></div>${D.baris.length < 30 ? `<p class="jm-bantu td-cat">${ikon("info", 14)}<span>${esc(t("td.data_sedikit", { n: angka(D.baris.length) }))}</span></p>` : ""}` });
  gambarSaring(); gambarDaftar();
}

let siap = false;
async function muatTender() {
  if (siap) return;
  host.innerHTML = hantuHtml(4);
  D = await muat("tender");
  for (const r of D.baris) r._cari = norm([r.judul, r.instansi, r.provinsi, r.lokasi, r.pemenang, label("td.tek.", r.teknologi)].filter(Boolean).join(" "));
  gambarEx(); siap = true;
  const tunda = () => nanti(gambarDaftar);
  const cariTunda = debounce(() => { S.hal = 1; tunda(); });
  host.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  host.addEventListener("change", (e) => { const k = e.target.id; if (["tek", "prov", "tahun", "inst"].includes(k)) { S[k] = e.target.value; S.hal = 1; tunda(); } });
  host.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-tahap]");
    if (sg) { S.tahap = sg.dataset.tahap; S.hal = 1; for (const b of host.querySelectorAll("[data-tahap]")) b.setAttribute("aria-pressed", String(b === sg)); tunda(); return; } // chrome urgent
    if (e.target.closest("#tdHapus") || e.target.closest("[data-aksi=reset]")) { Object.assign(S, { q: "", tek: "", prov: "", tahap: "", tahun: "", inst: "", hal: 1 }); gambarSaring(); tunda(); return; }
    const ub = e.target.closest("button[data-uk]"); if (ub) { const k = ub.dataset.uk; S.ua = S.uk === k ? -S.ua : 1; S.uk = k; S.hal = 1; tunda(); return; }
    const h = e.target.closest("[data-hal]"); if (h && !h.disabled) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); tunda(); }
  });
  host.querySelector(".jm-ex").addEventListener("jm:csv", (e) => { e.detail.baris = [[t("td.col.tender"), t("td.col.tek"), t("td.col.prov"), t("td.col.tahap"), t("td.col.tanggal"), t("td.col.mw"), t("td.buka_sumber")], ...urutkan(D.baris.filter((r) => cocok(r))).map((r) => [r.judul, r.teknologi ? label("td.tek.", r.teknologi) : "", r.provinsi || "", label("td.tahap.", r.tahap), r.tanggal || "", r.rencana_mw ?? "", r.sumber_url || ""])]; });
  host.addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined && im.closest(".td-lg")) im.replaceWith(Object.assign(document.createElement("span"), { innerHTML: ikon("gedung", 14) })); }, true);
  document.addEventListener("click", (e) => document.querySelectorAll("details.td-info[open]").forEach((p) => { if (!p.contains(e.target)) p.open = false; }));
  document.addEventListener("jm:bahasa", () => { if (siap) nanti(gambarEx); });
}

export function pasangTender() {
  host = document.getElementById("pnTender");
  if (!host) return;
  tabHalaman("pjTab", { label: "pj.tab.label", tab: [
    { k: "proyek", ikon: "peta", teks: "pj.tab.proyek", panel: "pnProyek", muat: async () => {} },
    { k: "tender", ikon: "palu", teks: "pj.tab.tender", panel: "pnTender", muat: muatTender },
  ] });
}
