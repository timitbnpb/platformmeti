/* /jaringan, tab Pendanaan jaringan: pinjaman dan hibah transmisi dari IATI (pendanaan_internasional.json, dirujuk lewat id), pernyataan PLN soal celah pembiayaan, JETP.
   World Bank dan JICA: tidak ada pinjaman transmisi yang terverifikasi, ditulis sebagai celah. INP: tabel urut/paginasi lewat tabel(), grafik lewat nanti(). */
import { D, ex, t, esc, ikon, num, bukti, L, chip, catatan, daftarCelah, kosongTab, sumberBerkas, buktiSumber, logoHtml, namaOrg, lbl, orgHref } from "/jr_umum.js";
import { pendanaanJaringan } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { batangSvg, kolomSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const P = () => D.m.pendanaan, DATA = () => pendanaanJaringan(D.pi, P().ids_iati);
const orgDari = (pemberi) => P().pemberi_org[pemberi] || "";
const juta = (v) => v / 1e6;

function perPemberi() {
  const el = document.getElementById("jr-d-g"), d = DATA();
  document.getElementById("jr-d-l").innerHTML = legendaHtml([{ kelas: "jr-s-p0", label: t("jr.d.usd") }]);
  el.innerHTML = batangSvg({ el, d: 0, label: t("jr.d.per_pemberi"), satuan: t("jr.d.juta"), seri: [{ k: "usd", kelas: "jr-s-p0" }],
    baris: d.perPemberi.map((p) => ({ label: p.pemberi, ikon: "kartu", kelasIkon: "jr-s-p0", tip: `${p.pemberi}: ${num(juta(p.usd), 0)}`, th: tipHtml(p.pemberi, [[t("jr.d.usd"), `US$ ${num(juta(p.usd), 0)} ${t("jr.d.juta")}`], [t("jr.d.n"), d.baris.filter((b) => b.pemberi === p.pemberi).length]]), bagian: [{ k: "usd", nilai: juta(p.usd) }] })) });
}
function perTahun() {
  const el = document.getElementById("jr-d-t"), d = DATA(), th = [...new Set(d.baris.map((b) => b.tahun))].sort();
  el.innerHTML = kolomSvg({ el, satuan: t("jr.d.juta"), label: t("jr.d.per_tahun"), seri: [{ k: "usd", kelas: "jr-s-p1" }],
    kategori: th.map((y) => { const v = d.baris.filter((b) => b.tahun === y).reduce((a, b) => a + juta(b.nilai_usd || 0), 0); return { label: String(y), nilai: { usd: v }, tip: String(y), th: tipHtml(String(y), [[t("jr.d.usd"), `US$ ${num(v, 0)} ${t("jr.d.juta")}`]]) }; }) });
}
function tabelIati() {
  tabel(document.getElementById("jr-d-tb"), { satuan: "jr.d.u", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("jr.d.program"), v: (b) => b.nama, f: (b) => `<span class="rg3-idk"><b>${esc(b.nama)}</b><small>${esc(b.id)}</small></span>` },
    { label: t("jr.d.pemberi"), v: (b) => b.pemberi, f: (b) => `<span class="rg3-org">${logoHtml(orgDari(b.pemberi), b.pemberi, "", "rg3-lg rg3-lg-k")}<b>${orgDari(b.pemberi) ? namaOrg(orgDari(b.pemberi), b.pemberi) : esc(b.pemberi)}</b></span>` },
    { label: t("jr.d.usd") + " (" + t("jr.d.juta") + ")", num: true, v: (b) => b.nilai_usd, f: (b) => `<b>${esc(num(juta(b.nilai_usd || 0), 1))}</b>` },
    { label: t("jr.d.tahun"), num: true, v: (b) => b.tahun, f: (b) => esc(String(b.tahun)) },
    { label: t("jr.status"), v: (b) => b.status, f: (b) => chip("jr-iati-" + (b.status || "x").split("-")[0], "", lbl("jr.d.st.", b.status)) },
    { label: t("jr.bukti"), v: (b) => b.tingkat_bukti, f: (b) => bukti(b.tingkat_bukti, { sumber: "IATI" }) },
  ], baris: DATA().baris });
}
function donor() {
  const n = (org) => DATA().baris.filter((b) => orgDari(b.pemberi) === org).length;
  const peta = { "in_9a375db244": ["ADB", n("in_9a375db244")], "in_41e3e0c573": ["IsDB", n("in_41e3e0c573")], "in_0d1892cd4f": ["World Bank", 0], "in_eb327fef3a": ["JICA", 0], l_c455b2f724: ["JETP", 0] };
  const orgs = new Map((D.org?.baris || []).map((o) => [o.id, o]));
  return `<ul class="jr-orgs">${P().donor_rujukan.map((id) => { const o = orgs.get(id), [singk, jml] = peta[id] || ["", 0]; return `<li class="jr-org"><a class="jr-org-a" href="${orgHref(id) || "#"}">${logoHtml(id, o?.nama || singk, o?.logo, "rg3-lg")}<span><b>${esc(o?.nama || singk)}</b><small>${esc(jml ? t("jr.d.program_n", { n: jml }) : t("jr.d.tanpa_program"))}</small></span></a></li>`; }).join("")}</ul>`;
}

export function mulai(el) {
  if (!D.m?.pendanaan) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const d = DATA(), pern = P().pernyataan_pln;
  const ub = [[t("jr.d.u_total"), `US$ ${num(juta(d.total), 0)} ${t("jr.d.juta")}`], [t("jr.d.u_program"), num(d.baris.length)], [t("jr.d.u_pemberi"), num(d.perPemberi.length)], [t("jr.d.u_kebutuhan"), `US$ ${num(pern[0].usd_miliar, 0)} ${t("jr.d.miliar")}`]];
  el.innerHTML = [
    `<ul class="rg3-ubin">${ub.map(([l, v]) => `<li class="rg3-ub"><b>${esc(v)}</b><small>${esc(l)}</small></li>`).join("")}</ul>`,
    ex({ id: "jr-d-iati", ikon: "kartu", topik: t("jr.d.ey"), judulHtml: esc(t("jr.d.j", { n: num(d.baris.length), usd: num(juta(d.total), 0) })), subHtml: esc(t("jr.d.s")),
      isiHtml: `<div id="jr-d-l"></div><div id="jr-d-g" class="ih-bagan"></div><h3 class="rg3-sub">${esc(t("jr.d.per_tahun"))}</h3><div id="jr-d-t" class="ih-bagan"></div><div id="jr-d-tb"></div>${catatan("jr.d.n_cat")}`, kakiHtml: sumberBerkas(D.pi) }),
    ex({ id: "jr-d-pln", ikon: "info", topik: t("jr.d.ey_pln"), judulHtml: esc(t("jr.d.j_pln")), subHtml: esc(t("jr.d.s_pln")),
      isiHtml: `<ul class="rg3-pj jr-pj">${pern.map((x) => `<li class="rg3-ub"><b>US$ ${esc(num(x.usd_miliar, 0))} ${esc(t("jr.d.miliar"))}</b><small>${esc(L(x.teks))}</small>${buktiSumber(x.bukti, x.sumber_id)}</li>`).join("")}</ul><h3 class="rg3-sub">${esc(t("jr.d.donor"))}</h3>${donor()}${daftarCelah(P().celah.map(L))}` }),
  ].join("");
  nanti(perPemberi); nanti(perTahun); nanti(tabelIati);
}
