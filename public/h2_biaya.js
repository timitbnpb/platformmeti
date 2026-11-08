/* /hidrogen, tab Biaya: LCOH kisaran (DPR, Krakatau Steel, ambang baja), harga elektroliser, komponen listrik per kg (hitungan METI dari kWh/kg x tarif), rujukan biaya_bangun.json dan pembiayaan internasional (IATI). */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, daftarCelah, catatan, bendera, rentang, namaNegara } from "/h2_umum.js";

function lcoh() {
  const g = document.getElementById("h2-b-g"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "USD/kg", label: t("h2.b.j.g"), seri: [{ k: "min", kelas: "h2-s-dasar" }, { k: "sel", kelas: "h2-s-rentang" }],
    baris: H.h2.biaya.lcoh.map((x) => ({ label: t("h2.b.l." + x.k), ikon: x.k === "baja" ? "pabrik" : "tag", tip: t("h2.b.l." + x.k), th: tipHtml(t("h2.b.l." + x.k), [["USD/kg", rentang(x.usd_kg, 1)], [t("h2.c.bukti"), t("h2.bukti." + x.tingkat_bukti)]]), bagian: [{ k: "min", nilai: x.usd_kg[0] }, { k: "sel", nilai: x.usd_kg[1] - x.usd_kg[0] }] })) });
}
function listrik() {
  const g = document.getElementById("h2-b-l"); if (!g) return;
  const b = H.h2.biaya.listrik;
  g.innerHTML = kolomSvg({ el: g, satuan: "USD/kg", label: t("h2.b.j.l"), seri: [{ k: "n", kelas: "h2-s-biaya" }],
    kategori: b.tarif_usd_kwh.map((r) => ({ label: `${num(r * 100, 0)} ${t("h2.b.sen")}`, nilai: { n: +(r * b.kwh_per_kg).toFixed(2) }, tip: String(r), th: tipHtml(`${num(r, 2)} USD/kWh`, [[t("h2.b.kwhkg"), num(b.kwh_per_kg, 1)], [t("h2.b.listrik_kg"), `${num(r * b.kwh_per_kg, 2)} USD/kg`], [t("h2.c.bukti"), t("h2.hitung")]]) })) });
}
function tabelDana() {
  const el = document.getElementById("h2-b-tab"); if (!el) return;
  const ids = new Set(H.h2.biaya.pendanaan_ids), baris = (H.pi?.baris || []).filter((b) => ids.has(b.id));
  tabel(el, { satuan: "h2.u.aktivitas", per: 4, urutAwal: 3, menurun: true, kolom: [
    { label: t("h2.c.aktivitas"), v: (b) => b.nama, f: (b) => `<span class="rg3-teks"><b>${esc(b.nama)}</b></span>` },
    { label: t("h2.c.pemberi"), v: (b) => b.pemberi, f: (b) => `<span class="rg3-neg">${bendera(b.pemberi_ref.slice(0, 2), 18)}<span>${esc(b.pemberi)}</span></span>` },
    { label: t("h2.c.periode"), v: (b) => b.tanggal_mulai, f: (b) => esc(`${b.tanggal_mulai?.slice(0, 7) || "-"} / ${b.tanggal_selesai?.slice(0, 7) || "-"}`) },
    { label: t("h2.c.nilai"), num: true, v: (b) => b.nilai_usd || 0, f: (b) => `<b>USD ${esc(num(b.nilai_usd, 0))}</b>` },
    { label: t("h2.c.bukti"), v: () => "", f: (b) => bukti("via-pihak-ketiga", { sumber: "IATI, d-portal", tanggal: H.pi?.dibangun_pada }) },
  ], baris });
}
export function mulai(el) {
  const d = H.h2.biaya, celahBB = (H.bb?.celah || []).filter((c) => /hidrogen/i.test(typeof c === "string" ? c : JSON.stringify(c))).map((c) => (typeof c === "string" ? c : tx(c)));
  const hp = d.jepang_cif;
  el.innerHTML = [
    ex({ id: "h2-b-gx", ikon: "tag", topik: t("h2.b.ey.g"), judulHtml: esc(t("h2.b.j.g")), subHtml: esc(t("h2.b.s.g")),
      isiHtml: `<div id="h2-b-g" class="ih-bagan"></div><div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.b.i.jp", { a: hp.yen_nm3[2030], b: hp.yen_nm3[2050] }))} ${buktiS(hp.sumber_id, hp.tingkat_bukti)}</p></div>${catatan("h2.b.n.g")}`, kakiHtml: kakiSumber(d.lcoh.map((x) => x.sumber_id).concat(hp.sumber_id)) }),
    ex({ id: "h2-b-lx", ikon: "petir", topik: t("h2.b.ey.l"), judulHtml: esc(t("h2.b.j.l")), subHtml: esc(t("h2.b.s.l")), isiHtml: `<div id="h2-b-l" class="ih-bagan"></div>${catatan("h2.b.n.l")}`, kakiHtml: kakiSumber([d.listrik.sumber_id]) }),
    ex({ id: "h2-b-bb", ikon: "kalkulator", topik: t("h2.b.ey.bb"), judulHtml: esc(t("h2.b.j.bb")), subHtml: esc(t("h2.b.s.bb")), isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.b.i.bb"))} <a class="rg3-tautan" href="/data">${esc(t("h2.b.lihat_bb"))}</a></p></div>${daftarCelah(celahBB.length ? celahBB.map((c) => c.length > 320 ? c.slice(0, 317) + "..." : c) : [t("h2.b.celah.bb")])}` }),
    ex({ id: "h2-b-dx", ikon: "kartu", topik: t("h2.b.ey.d"), judulHtml: esc(t("h2.b.j.d")), subHtml: esc(t("h2.b.s.d")), isiHtml: `<div id="h2-b-tab"></div>${catatan("h2.b.n.d")}`, kakiHtml: kakiSumber(["iati-pendanaan"]) }),
  ].join("");
  lcoh(); listrik(); tabelDana();
}
