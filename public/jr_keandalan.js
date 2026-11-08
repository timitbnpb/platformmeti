/* /jaringan, tab Keandalan: SAIDI dan SAIFI nasional, susut jaringan, dan margin cadangan per sistem (keandalan.json, scripts/panen/keandalan_ruptl.mjs).
   SAIDI/SAIFI per wilayah tidak terbit terbuka: ditulis sebagai celah. Halaman rinci tetap /keandalan. INP: grafik lewat nanti(). */
import { D, ex, t, esc, ikon, num, bukti, chip, catatan, daftarCelah, kosongTab, sumberBerkas, cariSumber } from "/jr_umum.js";
import { butuhPenyimpanan } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { garisSvg, kolomSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const TREN = () => D.ke?.tren_nasional || [];

function garis(k, kelas, satuan, labelKey) {
  const el = document.getElementById("jr-k-" + k);
  el.innerHTML = garisSvg({ el, satuan, label: t(labelKey), xTick: [TREN()[0].tahun, 2020, TREN().at(-1).tahun], anot: [TREN().at(-1).tahun],
    seri: [{ id: k, kelas, label: t(labelKey), titik: TREN().filter((r) => r[k === "saidi" ? "saidi_jam" : "saifi_kali"] != null).map((r) => ({ x: r.tahun, y: r[k === "saidi" ? "saidi_jam" : "saifi_kali"] })) }],
    ringkas: (x, v, p) => (p ? t("jr.k.ubah", { a: num(p.y, 2), b: num(v, 2) }) : "") });
}
function susut() {
  const el = document.getElementById("jr-k-susut"), S = D.ke.susut_nasional;
  document.getElementById("jr-k-susutl").innerHTML = legendaHtml([{ kelas: "jr-s-p0", label: t("jr.k.transmisi") }, { kelas: "jr-s-p1", label: t("jr.k.distribusi") }]);
  el.innerHTML = kolomSvg({ el, satuan: "%", label: t("jr.k.susut"), seri: [{ k: "transmisi", kelas: "jr-s-p0" }, { k: "distribusi", kelas: "jr-s-p1" }],
    kategori: S.map((r) => ({ label: String(r.tahun), nilai: { transmisi: r.transmisi, distribusi: r.distribusi }, tip: String(r.tahun), th: tipHtml(String(r.tahun), [[t("jr.k.transmisi"), `${num(r.transmisi, 2)}%`], [t("jr.k.distribusi"), `${num(r.distribusi, 2)}%`], [t("jr.k.jumlah"), `${num(r.jumlah, 2)}%`]]) })) });
}
function tabelRm() {
  const S = butuhPenyimpanan(D.ke), amb = D.ke.ambang_penyimpanan.rm_persen_maks;
  tabel(document.getElementById("jr-k-tb"), { satuan: "jr.k.u", per: 8, urutAwal: 1, menurun: false, kolom: [
    { label: t("jr.s.sistem"), v: (s) => s.nama, f: (s) => `<b>${esc(s.nama)}</b>` },
    { label: t("jr.s.rm_min"), num: true, v: (s) => s.rmMin, f: (s) => `<b>${esc(num(s.rmMin, 1))}%</b>` },
    { label: t("jr.s.ebt"), num: true, v: (s) => s.ebt, f: (s) => esc(num(s.ebt, 1)) + "%" },
    { label: t("jr.status"), v: (s) => (s.rmMin <= amb ? 0 : 1), f: (s) => (s.rmMin <= amb ? chip("jr-k-warn", ikon("peringatan", 14), t("jr.k.tipis")) : chip("jr-k-ok", ikon("centang", 14), t("jr.k.aman"))) },
  ], baris: S });
}

export function mulai(el) {
  if (!TREN().length) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const a = TREN().at(-1), b = TREN()[0], s = D.ke.susut_nasional.at(-1);
  const ub = [[t("jr.k.u_saidi", { y: a.tahun }), `${num(a.saidi_jam, 2)} ${t("jr.k.jam")}`], [t("jr.k.u_saifi", { y: a.tahun }), `${num(a.saifi_kali, 2)} ${t("jr.k.kali")}`], [t("jr.k.u_susut", { y: s.tahun }), `${num(s.jumlah, 2)}%`], [t("jr.k.u_turun", { y: b.tahun }), `${num(((a.saidi_jam - b.saidi_jam) / b.saidi_jam) * 100, 0)}%`]];
  const sm = (id) => cariSumber(D.ke, id);
  el.innerHTML = [
    `<ul class="rg3-ubin">${ub.map(([l, v]) => `<li class="rg3-ub"><b>${esc(v)}</b><small>${esc(l)}</small></li>`).join("")}</ul>`,
    ex({ id: "jr-k-tren", ikon: "jam", topik: t("jr.k.ey"), judulHtml: esc(t("jr.k.j", { a: num(a.saidi_jam, 2) })), subHtml: esc(t("jr.k.s")),
      isiHtml: `<div class="jr-dua"><div><h3 class="rg3-sub">SAIDI (${esc(t("jr.k.jam"))})</h3><div id="jr-k-saidi" class="ih-bagan"></div></div><div><h3 class="rg3-sub">SAIFI (${esc(t("jr.k.kali"))})</h3><div id="jr-k-saifi" class="ih-bagan"></div></div></div><p class="jm-bantu ih-catatan">${bukti("resmi", { sumber: sm("stat")?.penerbit || "" })} ${esc(t("jr.k.n_sumber"))}</p>${daftarCelah(D.ke.celah?.slice(0, 1))}`, kakiHtml: sumberBerkas(D.ke) }),
    ex({ id: "jr-k-susutx", ikon: "grafik", topik: t("jr.k.ey_susut"), judulHtml: esc(t("jr.k.j_susut", { v: num(s.jumlah, 2) })), subHtml: esc(t("jr.k.s_susut")), isiHtml: `<div id="jr-k-susutl"></div><div id="jr-k-susut" class="ih-bagan"></div>${catatan("jr.k.n_susut")}` }),
    ex({ id: "jr-k-rm", ikon: "peringatan", topik: t("jr.k.ey_rm"), judulHtml: esc(t("jr.k.j_rm")), subHtml: esc(t("jr.k.s_rm", { rm: D.ke.ambang_penyimpanan.rm_persen_maks })), isiHtml: `<div id="jr-k-tb"></div><p class="jm-bantu ih-catatan"><a class="rg3-tautan" href="/keandalan">${esc(t("jr.s.ke_keandalan"))}</a></p>` }),
  ].join("");
  nanti(() => { garis("saidi", "jr-s-p2", t("jr.k.jam"), "jr.k.saidi"); garis("saifi", "jr-s-p3", t("jr.k.kali"), "jr.k.saifi"); }); nanti(susut); nanti(tabelRm);
}
