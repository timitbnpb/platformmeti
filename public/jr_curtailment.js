/* /jaringan, tab Curtailment dan batas penetrasi: batas serap EBT variabel hasil studi (riset/jaringan.json) dan satu-satunya angka curtailment (model IEA, riset/curtailment.json).
   Kejadian curtailment terukur TIDAK ditemukan: ditulis sebagai celah, bukan dikarang. INP: grafik lewat nanti(). */
import { D, ex, t, esc, ikon, num, bukti, cariSumber, catatan, daftarCelah, kosongTab, sumberBerkas, luar } from "/jr_umum.js";
import { nanti } from "/inti/umum.js";
import { batangSvg, legendaHtml, tipHtml, tabel } from "/info_hijau.js";

const BATAS = () => D.riset?.studi_batas_penetrasi || [], CURT = () => D.curt?.baris || [];
const sumberR = (id) => cariSumber(D.riset, id) || cariSumber(D.curt, id);

function grafik() {
  const el = document.getElementById("jr-c-g"), B = BATAS(), C = CURT();
  const baris = [...B.map((b) => ({ id: b.id, label: b.lingkup, kelas: "jr-s-batas", v: b.batas_persen, tahun: b.tahun, metrik: b.metrik, bukti: b.tingkat_bukti, sid: b.sumber_id, kind: "batas" })),
    ...C.map((c) => ({ id: c.id, label: `${c.sistem_id}`, kelas: "jr-s-curt", v: c.curtailment_persen_tahunan, tahun: c.tahun_skenario, metrik: c.uraian, bukti: c.tingkat_bukti, sid: c.sumber_id, kind: "curt" }))];
  document.getElementById("jr-c-l").innerHTML = legendaHtml([{ kelas: "jr-s-batas", label: t("jr.c.batas") }, { kelas: "jr-s-curt", label: t("jr.c.curt") }]);
  el.innerHTML = batangSvg({ el, d: 1, label: t("jr.c.judul_g"), satuan: "%", seri: [{ k: "batas", kelas: "jr-s-batas" }, { k: "curt", kelas: "jr-s-curt" }],
    baris: baris.map((b) => ({ label: b.kind === "curt" ? t("jr.c.curt_label", { s: b.label }) : b.label, ikon: b.kind === "curt" ? "petir" : "kajian", kelasIkon: b.kelas, tip: `${b.label}: ${b.v}%`,
      th: tipHtml(b.kind === "curt" ? t("jr.c.curt_label", { s: b.label }) : b.label, [[t("jr.c.nilai"), `${num(b.v, 2)}%`], [t("jr.c.tahun"), b.tahun], [t("jr.bukti"), b.bukti], [t("jr.c.sumber"), sumberR(b.sid)?.penerbit || "-"]]), bagian: [{ k: b.kind, nilai: b.v }] })) });
}
function tabelStudi() {
  tabel(document.getElementById("jr-c-tb"), { satuan: "jr.c.u", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("jr.c.lingkup"), v: (b) => b.lingkup, f: (b) => `<b>${esc(b.lingkup)}</b><small class="rg3-catat">${esc(b.metrik)}</small>` },
    { label: "%", num: true, v: (b) => b.batas_persen, f: (b) => `<b>${esc(num(b.batas_persen, 2))}</b>` },
    { label: t("jr.c.tahun"), num: true, v: (b) => b.tahun, f: (b) => esc(String(b.tahun)) },
    { label: t("jr.c.catatan"), v: (b) => b.catatan, f: (b) => `<span class="rg3-teks">${esc(b.catatan)}</span>` },
    { label: t("jr.bukti"), v: (b) => b.tingkat_bukti, f: (b) => `<span class="rg3-sm">${bukti(b.tingkat_bukti === "Hipotesis" ? "hipotesis" : b.tingkat_bukti, { sumber: sumberR(b.sumber_id)?.penerbit || "" })}${luar(sumberR(b.sumber_id)?.url, sumberR(b.sumber_id)?.penerbit || "")}</span>` },
  ], baris: BATAS() });
}

export function mulai(el) {
  if (!BATAS().length && !CURT().length) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const c = CURT()[0];
  el.innerHTML = [
    `<div class="rg3-info rg3-info-bad">${ikon("peringatan", 18)}<p>${esc(t("jr.c.tak_terukur"))}</p></div>`,
    ex({ id: "jr-c-batas", ikon: "petir", topik: t("jr.c.ey"), judulHtml: esc(t("jr.c.j", { n: num(BATAS().length) })), subHtml: esc(t("jr.c.s")),
      isiHtml: `<div id="jr-c-l"></div><div id="jr-c-g" class="ih-bagan"></div>${c ? `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(t("jr.c.model", { s: c.sistem_id, v: num(c.curtailment_persen_tahunan, 0), y: c.tahun_skenario }))} ${bukti("hipotesis", { sumber: "IEA 2022" })} ${esc(c.uraian)}</p></div>` : ""}<div id="jr-c-tb"></div>${catatan("jr.c.n")}${daftarCelah([...(D.riset?.meta?.celah || []).slice(1, 3), ...(D.curt?.meta?.celah || [])])}`, kakiHtml: sumberBerkas(D.riset) }),
  ].join("");
  nanti(grafik); nanti(tabelStudi);
}
