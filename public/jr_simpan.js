/* /jaringan, tab Penyimpanan dan fleksibilitas: BESS dan penyimpanan per sistem (riset/jaringan.json), kebutuhan menurut ambang /keandalan, pumped storage.
   Hanya dirujuk lewat id sistem; MWh per sistem tidak terbit di RUPTL yang diurai (celah). INP: tabel urut/paginasi lewat tabel(), grafik lewat nanti(). */
import { D, ex, t, esc, ikon, num, bukti, L, chip, catatan, daftarCelah, kosongTab, sumberBerkas, buktiSumber, lbl, luar } from "/jr_umum.js";
import { simpanPerSistem, pumpedStorage, butuhPenyimpanan } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { batangSvg, kolomSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const status = (s) => (s.butuh ? ["bad", "butuh"] : s.rmMin < (D.ke?.ambang_penyimpanan?.rm_persen_maks || 35) ? ["warn", "tipis"] : ["ok", "aman"]);

function perSistem() {
  const el = document.getElementById("jr-s-g"), B = simpanPerSistem(D.riset), fl = new Map(butuhPenyimpanan(D.ke).map((s) => [s.id, s]));
  document.getElementById("jr-s-l").innerHTML = legendaHtml([{ kelas: "jr-s-bess", label: t("jr.s.bess") }]);
  el.innerHTML = batangSvg({ el, d: 0, label: t("jr.s.per_sistem"), satuan: "MW", seri: [{ k: "mw", kelas: "jr-s-bess" }],
    baris: B.map((b) => { const f = fl.get(b.id); return { label: b.nama, ikon: "baterai", kelasIkon: "jr-s-bess", tip: `${b.nama}: ${num(b.mw)} MW`, th: tipHtml(b.nama, [[t("jr.s.bess"), `${num(b.mw)} MW`], ...(f ? [[t("jr.s.rm_min"), `${num(f.rmMin, 1)}%`], [t("jr.s.ebt"), `${num(f.ebt, 1)}%`], [t("jr.status"), t("jr.s.st." + status(f)[1])]] : [])]), bagian: [{ k: "mw", nilai: b.mw }] }; }) });
}
function tabelSistem() {
  const S = butuhPenyimpanan(D.ke);
  tabel(document.getElementById("jr-s-tb"), { satuan: "jr.s.u", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("jr.s.sistem"), v: (s) => s.nama, f: (s) => `<b>${esc(s.nama)}</b>` },
    { label: t("jr.s.bess") + " (MW)", num: true, v: (s) => s.mw, f: (s) => (s.mw ? `<b>${esc(num(s.mw))}</b>` : "-") },
    { label: t("jr.s.rm_min"), num: true, v: (s) => s.rmMin, f: (s) => esc(num(s.rmMin, 1)) + "%" },
    { label: t("jr.s.ebt"), num: true, v: (s) => s.ebt, f: (s) => esc(num(s.ebt, 1)) + "%" },
    { label: t("jr.status"), v: (s) => status(s)[1], f: (s) => chip("jr-k-" + status(s)[0], ikon(status(s)[0] === "ok" ? "centang" : "peringatan", 14), t("jr.s.st." + status(s)[1])) },
  ], baris: S });
}
function psTahun() {
  const p = D.m.penyimpanan.ps_ruptl_mw, el = document.getElementById("jr-s-pg");
  el.innerHTML = kolomSvg({ el, satuan: "MW", label: t("jr.s.ps_tahun"), seri: [{ k: "ps", kelas: "jr-s-ps" }], kategori: D.m.rencana.tahun.map((th) => ({ label: String(th), nilai: { ps: p.tahun[th] || 0 }, tip: String(th), th: tipHtml(String(th), [[t("jr.s.ps"), `${num(p.tahun[th] || 0)} MW`]]) })) });
}
function tabelPs() {
  tabel(document.getElementById("jr-s-pt"), { satuan: "jr.s.u_ps", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("jr.s.proyek"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b>${b.proyek_id ? `<small class="rg3-catat"><a class="rg3-tautan" href="/proyek/${esc(b.proyek_id)}">${esc(t("jr.s.lihat_proyek"))}</a></small>` : ""}` },
    { label: "MW", num: true, v: (b) => b.kapasitas_mw_ruptl, f: (b) => `<b>${esc(num(b.kapasitas_mw_ruptl, 0))}</b>` },
    { label: t("jr.cod"), num: true, v: (b) => b.cod_ruptl?.[0] ?? null, f: (b) => (b.cod_ruptl?.length ? esc(b.cod_ruptl.join(", ")) : "-") },
    { label: t("jr.status"), v: (b) => b.status_ruptl || "", f: (b) => (b.status_ruptl ? chip("jr-st-" + (b.status_ruptl === "konstruksi" ? "konstruksi" : "rencana"), "", lbl("jr.st.", b.status_ruptl)) : "-") },
    { label: t("jr.bukti"), v: (b) => b.tingkat_bukti, f: (b) => bukti(b.tingkat_bukti, { sumber: "RUPTL 2025-2034" }) },
  ], baris: pumpedStorage(D.ps) });
}

export function mulai(el) {
  const B = simpanPerSistem(D.riset);
  if (!B.length && !D.m?.penyimpanan) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const total = B.reduce((a, b) => a + b.mw, 0), butuh = butuhPenyimpanan(D.ke).filter((s) => s.butuh), ps = D.m.penyimpanan.ps_ruptl_mw;
  const ub = [[t("jr.s.u_bess"), `${num(total)} MW`], [t("jr.s.u_ps"), `${num(ps.total)} MW`], [t("jr.s.u_butuh"), num(butuh.length)], [t("jr.s.u_sistem"), num(B.length)]];
  el.innerHTML = [
    `<ul class="rg3-ubin">${ub.map(([l, v]) => `<li class="rg3-ub"><b>${esc(v)}</b><small>${esc(l)}</small></li>`).join("")}</ul>`,
    ex({ id: "jr-s-sistem", ikon: "baterai", topik: t("jr.s.ey.sistem"), judulHtml: esc(t("jr.s.j.sistem", { mw: num(total) })), subHtml: esc(t("jr.s.s.sistem")), isiHtml: `<div id="jr-s-l"></div><div id="jr-s-g" class="ih-bagan"></div><div id="jr-s-tb"></div>${catatan("jr.s.n.sistem", { rm: D.ke?.ambang_penyimpanan?.rm_persen_maks ?? 35, ebt: D.ke?.ambang_penyimpanan?.ebt_rasio_persen_min ?? 50 })}${daftarCelah(D.riset?.meta?.celah?.slice(0, 1))}<p class="jm-bantu ih-catatan"><a class="rg3-tautan" href="/keandalan">${esc(t("jr.s.ke_keandalan"))}</a></p>`, kakiHtml: sumberBerkas(D.riset) }),
    ex({ id: "jr-s-ps", ikon: "air-energi", topik: t("jr.s.ey.ps"), judulHtml: esc(t("jr.s.j.ps", { mw: num(ps.total) })), subHtml: esc(t("jr.s.s.ps")), isiHtml: `<div id="jr-s-pg" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(L(ps.ket))} ${buktiSumber(ps.bukti, ps.sumber_id)}</p><div id="jr-s-pt"></div>${daftarCelah(D.ps?.meta?.celah?.slice(0, 1))}`, kakiHtml: sumberBerkas(D.ps) }),
  ].join("");
  nanti(perSistem); nanti(tabelSistem); nanti(psTahun); nanti(tabelPs);
}
void luar;
