/* /proyek-berhenti: proyek berhenti, batal, atau lewat target COD. Hanya baris bersumber (url) yang masuk. Data = /data/proyek_besar.json. */
import { t, tanggal } from "/i18n.js";
import { esc, galatHtml, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { pilTek } from "/inti/ikon_tek.js";
import { tombolKoreksi } from "/inti/koreksi.js";
import { num, labTek, hl, estPil, muatPotret, selProv, selNamaProyek, tgl, urlAman, pasangTabel } from "/proyek_besar_umum.js";

const $ = (id) => document.getElementById(id);
await mulaiHalaman();
let D;
try { D = await muatPotret(); } catch (e) {
  $("pbIsi").innerHTML = galatHtml("jaringan");
  $("pbIsi").querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const B = D.berhenti, rows = B.baris;
const mwTotal = rows.reduce((a, r) => a + (r.mw || 0), 0), media = rows.filter((r) => r.dilaporkan_media).length;
const puncak = B.per_tahun.slice().sort((a, b) => b.jumlah - a.jumlah)[0];
const sumber = sumberHtml(esc(t("ph.sumber", { tgl: tanggal(D.dibangun_pada, { gaya: "panjang" }) })));

khUbin("pbAngka", [
  { ikon: "proyek", nilai: num(rows.length), label: t("ph.k.total") },
  { ikon: "analisis", nilai: num(mwTotal), satuan: "MW", label: t("ph.k.mw") },
  { ikon: "kalender", nilai: puncak ? String(puncak.tahun) : "-", label: t("ph.k.puncak") },
  { ikon: "info", nilai: num(media), label: t("ph.k.media") },
]);

const bukti = (r) => (r.jenis === "mundur" ? `<span class="jm-bantu">${esc(t("ph.bukti.mundur"))}</span> ${estPil()}`
  : r.dilaporkan_media ? `<span class="jm-pil jm-pil-warn">${esc(t("ph.bukti.media"))}</span>` : `<span class="jm-bantu">${esc(t("ph.bukti.resmi"))}</span>`);
const jenisPil = (r) => `<span class="jm-pil ph-${r.jenis}">${esc(t("ph.j." + r.jenis))}</span>`;
const tanggalSel = (r) => (r.tanggal ? esc(tgl(r.tanggal)) : r.cod ? esc(t("ph.target", { tahun: r.cod })) : "-");
const sumberSel = (r) => { const u = urlAman(r.sumber_url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(r.sumber_jenis || t("pb.sumber"))}</a>` : "-"; };

const kotak = `<aside class="pb-kotak" aria-labelledby="phJawab"><h2 id="phJawab">${ikon("surel", 18)}<span>${esc(t("ph.jawab.j"))}</span></h2><p>${esc(t("ph.jawab.isi"))}</p><p>${esc(t("ph.jawab.cara"))}</p></aside>`;
const tahunEx = exHtml({ id: "ph-tahun", ikon: "kalender", topik: t("ph.tahun.ey"), judulHtml: `${hl(num(B.per_tahun.length))} ${esc(t("ph.tahun.j"))}`, subHtml: esc(t("ph.tahun.s")), aksiHtml: aksiHtml({ csv: false }) + sumber, isiHtml: `<div id="phTahun"></div>` });
const besarEx = exHtml({ id: "ph-besar", ikon: "blokir", topik: t("ph.besar.ey"), judulHtml: `${hl(num(rows.length))} ${esc(t("ph.besar.j"))}`, subHtml: esc(t("ph.besar.s")), aksiHtml: aksiHtml({ csv: true }) + sumber, isiHtml: `<div id="phBesar"></div>` });
$("pbIsi").innerHTML = kotak + tahunEx + besarEx;

pasangTabel($("phTahun"), [["tahun", "ph.c.tahun", (r) => String(r.tahun), "jm-tengah"], ["jumlah", "pb.c.proyek", (r) => num(r.jumlah), "jm-num"], ["mw", "pj.c.kap", (r) => `${num(r.mw)} <span class="jm-pj-sat">MW</span>`, "jm-num"]],
  B.per_tahun, { k: "tahun", arah: -1, hal: 1, turun: ["tahun", "jumlah", "mw"] });
pasangTabel($("phBesar"), [
  ["nama", "pj.c.nama", selNamaProyek], ["tek", "pj.c.tek", (r) => pilTek(r.tek), "jm-tengah"], ["prov", "pj.c.prov", (r) => selProv(r.prov)], ["jenis", "ph.c.jenis", jenisPil, "jm-tengah"],
  ["mw", "pj.c.kap", (r) => (r.mw === null ? "-" : `${num(r.mw)} <span class="jm-pj-sat">${esc(r.sat)}</span>`), "jm-num"],
  ["tanggal", "ph.c.tanggal", tanggalSel, "jm-tengah"], [null, "ph.c.bukti", bukti], [null, "pj.c.sumber", sumberSel, "jm-tengah"],
  [null, "ph.c.koreksi", (r) => tombolKoreksi({ entitas: "proyek", id: r.id, nama: r.nama }), "jm-tengah"],
], rows, { k: "mw", arah: -1, hal: 1, turun: ["mw"] });

$("ph-besar").addEventListener("jm:csv", (e) => {
  e.detail.baris = [[t("pj.c.nama"), t("pj.c.tek"), t("pj.c.prov"), t("ph.c.jenis"), t("pj.c.kap"), t("pj.c.satuan"), t("ph.c.tahun"), t("ph.c.tanggal"), t("ph.c.bukti"), t("pj.c.sumber")],
    ...rows.slice().sort((a, b) => (b.mw || 0) - (a.mw || 0)).map((r) => [r.nama, labTek(r.tek), r.prov, t("ph.j." + r.jenis), r.mw ?? "", r.mw === null ? "" : r.sat, r.tahun, r.tanggal || "", r.jenis === "mundur" ? t("ph.bukti.mundur") : r.dilaporkan_media ? t("ph.bukti.media") : t("ph.bukti.resmi"), r.sumber_url])];
}, true);
